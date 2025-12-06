
import { LeadSource, LeadStatus } from '../types';

// Mock PrismaClient since @prisma/client is not generated/available in this environment
class PrismaClient {
  lead = {
    findUnique: async (args: any) => null as any,
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
    const phoneMatches = text.match(BD_PHONE_REGEX);
    
    if (!phoneMatches || phoneMatches.length === 0) {
      console.log(`[Webhook] No phone number found in message from ${senderId}, skipping lead creation.`);
      return;
    }

    const rawPhone = phoneMatches[0];
    const normalizedPhone = normalizePhoneNumber(rawPhone);

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const allUrls = text.match(urlRegex) || [];
    
    let websiteUrl: string | undefined = undefined;
    let facebookProfileLink: string | undefined = undefined;

    for (const url of allUrls) {
      if (url.includes('facebook.com') || url.includes('fb.com')) {
        facebookProfileLink = url;
      } else if (!websiteUrl) {
        websiteUrl = url;
      }
    }

    if (!facebookProfileLink) {
        facebookProfileLink = `https://facebook.com/${senderId}`;
    }

    let lead = await prisma.lead.findUnique({
      where: { primary_phone: normalizedPhone }
    });

    const now = new Date();

    if (lead) {
      console.log(`[Webhook] Updating existing lead: ${lead.id}`);
      lead = await prisma.lead.update({
        where: { id: lead.id },
        data: {
          last_activity_at: now,
          website_url: lead.website_url ? undefined : websiteUrl,
          facebook_profile_link: lead.facebook_profile_link ? undefined : facebookProfileLink
        }
      });
    } else {
      console.log(`[Webhook] Creating new lead for phone: ${normalizedPhone}`);
      lead = await prisma.lead.create({
        data: {
          primary_phone: normalizedPhone,
          full_name: 'Messenger User',
          source: LeadSource.FACEBOOK_MESSENGER,
          status: LeadStatus.NEW,
          first_contact_at: now,
          last_activity_at: now,
          facebook_profile_link: facebookProfileLink,
          website_url: websiteUrl
        }
      });
    }

    await prisma.interaction.create({
      data: {
        lead_id: lead.id,
        channel: 'facebook_messenger',
        direction: 'incoming',
        content: text,
        raw_payload: { senderId, text, extractedPhone: normalizedPhone }
      }
    });

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
