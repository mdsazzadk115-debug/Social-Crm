
import { LeadSource, LeadStatus } from '../types';

// Mock PrismaClient since @prisma/client is not generated/available in this environment
class PrismaClient {
  lead = {
    findUnique: async (args: any) => null as any,
    findFirst: async (args: any) => null as any, // Added findFirst support
    update: async (args: any) => null as any,
    create: async (args: any) => ({ id: 'mock-id' }) as any
  };
  interaction = {
    create: async (args: any) => null as any
  };
}

const prisma = new PrismaClient();

// Robust Regex for Bangladeshi numbers: Supports +8801..., 8801..., 01...
// Matches 013-019 followed by 8 digits.
const BD_PHONE_REGEX = /(?:\+88|88)?(01[3-9]\d{8})/g;

// Improved Regex to capture http, https, and www. links
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;

export const normalizePhoneNumber = (raw: string): string => {
  if (!raw) return '';
  // Remove all non-digit characters
  const digits = raw.replace(/\D/g, '');
  
  // Logic for Bangladeshi numbers
  if (digits.startsWith('8801')) {
    return '+' + digits;
  }
  if (digits.startsWith('01')) {
    return '+88' + digits;
  }
  
  return '+' + digits;
};

// --- FACEBOOK HANDLER ---
export const handleFacebookMessage = async (senderId: string, text: string) => {
  try {
    // 1. Extract Phone Number
    const phoneMatches = text.match(BD_PHONE_REGEX);
    let normalizedPhone: string | null = null;
    if (phoneMatches && phoneMatches.length > 0) {
        normalizedPhone = normalizePhoneNumber(phoneMatches[0]);
    }

    // 2. Extract URLs
    const allUrls = text.match(URL_REGEX) || [];
    
    let websiteUrl: string | undefined = undefined;

    // Prioritize finding a website URL (ignore facebook links for the website field if possible, or take first)
    for (const url of allUrls) {
      // Normalize www. links to https://
      const cleanUrl = url.startsWith('www.') ? `https://${url}` : url;
      
      if (!cleanUrl.includes('facebook.com') && !cleanUrl.includes('fb.com')) {
        websiteUrl = cleanUrl;
        break; // Found a likely website link
      }
    }
    // Fallback: If only FB links exist and we haven't found a website, use the first link as websiteUrl? 
    // Usually we prefer not to set FB link as website_url, but if user wants "any link", we can uncomment below:
    // if (!websiteUrl && allUrls.length > 0) websiteUrl = allUrls[0].startsWith('www.') ? `https://${allUrls[0]}` : allUrls[0];

    // This is the identifier for the conversation based on Sender ID
    const senderProfileLink = `https://facebook.com/${senderId}`;

    // 3. Find Existing Lead
    let lead = null;

    if (normalizedPhone) {
        // Priority 1: Search by Phone Number
        lead = await prisma.lead.findUnique({
            where: { primary_phone: normalizedPhone }
        });
    } 
    
    if (!lead) {
        // Priority 2: Search by Sender ID (Profile Link) to find existing conversation
        // This handles the case where user sends a link later without a phone number
        lead = await prisma.lead.findFirst({
            where: { facebook_profile_link: senderProfileLink }
        });
    }

    const now = new Date();

    // 4. Logic: Create or Update
    if (lead) {
      console.log(`[Webhook] Updating existing lead: ${lead.id}`);
      
      // Prepare update data
      const updateData: any = {
          last_activity_at: now,
      };

      // CRITICAL: Ensure the lead is bound to this Sender ID.
      // If we found the lead by Phone Number, we must update/set the facebook_profile_link
      // to the current senderProfileLink. This ensures that future messages (without phone)
      // from this sender will correctly find this lead.
      if (lead.facebook_profile_link !== senderProfileLink) {
          updateData.facebook_profile_link = senderProfileLink;
      }

      // Only update website_url if a new one is found in this message
      if (websiteUrl) updateData.website_url = websiteUrl;
      
      // Note: We deliberately do NOT overwrite facebook_profile_link with links found in text.
      // We strictly use the senderProfileLink (ID based) to maintain the session/connection.

      lead = await prisma.lead.update({
        where: { id: lead.id },
        data: updateData
      });

    } else {
      // Lead does NOT exist.
      if (normalizedPhone) {
          // ONLY create a new lead if a Phone Number is present.
          console.log(`[Webhook] Creating new lead for phone: ${normalizedPhone}`);
          
          lead = await prisma.lead.create({
            data: {
              primary_phone: normalizedPhone,
              full_name: 'Messenger User',
              source: LeadSource.FACEBOOK_MESSENGER,
              status: LeadStatus.NEW,
              first_contact_at: now,
              last_activity_at: now,
              // Use the sender ID based link as the primary profile link to enable future lookups
              facebook_profile_link: senderProfileLink, 
              website_url: websiteUrl
            }
          });
      } else {
          console.log(`[Webhook] Message from ${senderId} ignored. No phone number provided and no existing lead found.`);
          // STOP HERE. Do not create interaction log for non-lead messages to keep DB clean.
          return; 
      }
    }

    // 5. Log Interaction (Only if a lead exists or was just created)
    if (lead) {
        await prisma.interaction.create({
          data: {
            lead_id: lead.id,
            channel: 'facebook_messenger',
            direction: 'incoming',
            content: text,
            raw_payload: { senderId, text, extractedPhone: normalizedPhone, extractedUrls: allUrls }
          }
        });
    }

  } catch (error) {
    console.error('[Webhook] Error handling FB webhook:', error);
  }
};

// --- N8N / API HANDLER (NEW) ---
export const handleN8nPayload = async (payload: any) => {
    try {
        console.log('[API Ingest] Processing payload:', payload);

        // 1. Validate Input
        if (!payload.phone) {
            throw new Error('Phone number is required in payload');
        }

        const normalizedPhone = normalizePhoneNumber(payload.phone);
        const now = new Date();

        // Determine Source
        let source = LeadSource.N8N_WEBHOOK;
        if (payload.source === 'Google Form') source = LeadSource.GOOGLE_FORM;
        else if (payload.source) source = payload.source; // Allow custom string mapping if enum supports it

        // 2. Find or Create Lead
        let lead = await prisma.lead.findUnique({
            where: { primary_phone: normalizedPhone }
        });

        if (lead) {
            // Merge Data: Only update fields if they are present in payload
            lead = await prisma.lead.update({
                where: { id: lead.id },
                data: {
                    full_name: payload.name || lead.full_name,
                    last_activity_at: now,
                    facebook_profile_link: payload.fb_link || lead.facebook_profile_link,
                    website_url: payload.website || lead.website_url,
                    industry: payload.industry || lead.industry,
                    service_category: payload.category || lead.service_category
                }
            });
        } else {
            // Create New
            lead = await prisma.lead.create({
                data: {
                    primary_phone: normalizedPhone,
                    full_name: payload.name || 'API Lead',
                    source: source,
                    status: LeadStatus.NEW,
                    first_contact_at: now,
                    last_activity_at: now,
                    facebook_profile_link: payload.fb_link,
                    website_url: payload.website,
                    industry: payload.industry,
                    service_category: payload.category
                }
            });
        }

        // 3. Log Interaction (If message provided)
        if (payload.message) {
            await prisma.interaction.create({
                data: {
                    lead_id: lead.id,
                    channel: 'other', 
                    direction: 'incoming',
                    content: payload.message,
                    raw_payload: payload
                }
            });
        }

        return { success: true, leadId: lead.id };

    } catch (error) {
        console.error('[API Ingest] Error:', error);
        throw error;
    }
};
