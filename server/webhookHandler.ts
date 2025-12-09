
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
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const allUrls = text.match(urlRegex) || [];
    
    let websiteUrl: string | undefined = undefined;
    let facebookProfileLinkFromText: string | undefined = undefined;

    for (const url of allUrls) {
      if (url.includes('facebook.com') || url.includes('fb.com')) {
        facebookProfileLinkFromText = url;
      } else if (!websiteUrl) {
        websiteUrl = url;
      }
    }

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

      // Only update fields if new data is present in the message
      if (websiteUrl) updateData.website_url = websiteUrl;
      
      // If the text contains a specific FB profile link, we might want to save it, 
      // but usually we keep the senderID link as the primary source identifier.
      // However, if the user explicitly sends a profile link, we can store it.
      if (facebookProfileLinkFromText) updateData.facebook_profile_link = facebookProfileLinkFromText;

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
              // Use the sender ID based link as the primary profile link
              facebook_profile_link: senderProfileLink, 
              website_url: websiteUrl
            }
          });
      } else {
          console.log(`[Webhook] Message from ${senderId} ignored. No phone number provided and no existing lead found.`);
          // STOP HERE. Do not create interaction log for non-lead messages to keep DB clean?
          // Or return here to ensure no lead is created.
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
