
import { 
  Lead, LeadStatus, LeadSource, Interaction, MessageTemplate, Campaign, 
  SimpleAutomationRule, LeadForm, Customer, Task, Invoice, Snippet, 
  Document, BigFish, PaymentMethod, MessengerConversation, SystemSettings,
  MonthlyTarget, SalesEntry, AdInspiration, ClientInteraction, Transaction,
  InvoiceItem
} from '../types';
import { 
  INITIAL_TEMPLATES, INITIAL_LEAD_FORMS, INITIAL_SNIPPETS, INDUSTRIES, DEMO_LEADS 
} from '../constants';

const uuid = () => Math.random().toString(36).substr(2, 9);


// Fix Types for Constants
const FULL_DEMO_LEADS: Lead[] = DEMO_LEADS.map(l => ({ ...l, download_count: 0 }));
const FULL_TEMPLATES: MessageTemplate[] = INITIAL_TEMPLATES.map(t => ({ ...t, id: uuid() }));
const FULL_SNIPPETS: Snippet[] = INITIAL_SNIPPETS.map(s => ({ ...s, id: uuid() }));

// Helper for local storage
const getStorage = <T>(key: string, defaultVal: T): T => {
    const stored = localStorage.getItem(key);
    // If specifically "[]" (empty array), return empty array
    if (stored === '[]') return [] as unknown as T;
    if (!stored) return defaultVal;
    try {
        return JSON.parse(stored);
    } catch {
        return defaultVal;
    }
};

const setStorage = (key: string, val: any) => {
    localStorage.setItem(key, JSON.stringify(val));
};

// --- SYNC HELPER ---
const getSettings = (): SystemSettings => {
    return getStorage<SystemSettings>('system_settings', {
        facebook_page_token: '',
        facebook_verify_token: '',
        sms_api_key: '',
        sms_sender_id: '',
        sms_base_url: '',
        timezone: 'Asia/Dhaka',
        system_api_key: 'lg_demo_key',
        server_url: '',
        sync_enabled: false
    });
};

const syncToServer = async (action: string, data: any) => {
    const settings = getSettings();
    if (settings.sync_enabled && settings.server_url) {
        try {
            console.log(`[Server Sync] ${action} -> ${settings.server_url}`);
            // Attempt to send data to PHP backend
            // Using 'no-cors' mode just in case of simple testing, but real API needs CORS enabled on PHP
            await fetch(settings.server_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Action': action
                },
                body: JSON.stringify({ action, data })
            });
        } catch (e) {
            console.error("[Server Sync Failed] Check your PHP URL or CORS settings", e);
        }
    }
};

export const mockService = {
    // --- DATABASE MANAGEMENT ---
    clearAllData: async () => {
        setStorage('leads', []);
        setStorage('big_fish', []);
        setStorage('invoices', []);
        setStorage('daily_tasks', []);
        setStorage('online_customers', []);
        setStorage('sales_entries', []);
        setStorage('sales_targets', []);
        setStorage('messenger_convs', []);
        setStorage('interactions', []);
        setStorage('documents', []);
        setStorage('ad_swipe', []);
        // Don't clear settings/templates to keep app usable
    },
    restoreDemoData: async () => {
        setStorage('leads', FULL_DEMO_LEADS);
        setStorage('templates', FULL_TEMPLATES);
        setStorage('snippets', FULL_SNIPPETS);
        setStorage('lead_forms', INITIAL_LEAD_FORMS);
        // Clear others to reset
        localStorage.removeItem('big_fish');
        localStorage.removeItem('invoices');
        localStorage.removeItem('daily_tasks');
    },

    // --- LEADS (CONNECTED TO LOCAL STORAGE + SERVER SYNC) ---
    getLeads: async (): Promise<Lead[]> => {
        const settings = getSettings();
        
        // If Sync is enabled, try to fetch from server first
        if (settings.sync_enabled && settings.server_url) {
            try {
                const response = await fetch(`${settings.server_url}?action=get_leads`);
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data)) {
                        // Update local cache
                        setStorage('leads', data);
                        return data;
                    }
                }
            } catch (e) {
                console.warn("Could not fetch from server, falling back to local storage.", e);
            }
        }

        // Fallback to Local Storage
        return getStorage<Lead[]>('leads', []);
    },
    getLeadById: async (id: string): Promise<Lead | undefined> => {
        const leads = await mockService.getLeads();
        return leads.find(l => l.id === id);
    },
    createLead: async (lead: Partial<Lead>): Promise<Lead> => {
        const newLead: Lead = {
            id: uuid(),
            full_name: lead.full_name || 'Unknown',
            primary_phone: lead.primary_phone || '',
            source: lead.source || LeadSource.MANUAL,
            status: lead.status || LeadStatus.NEW,
            industry: lead.industry,
            service_category: lead.service_category,
            is_starred: false,
            is_unread: true,
            total_messages_sent: 0,
            download_count: 0,
            first_contact_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            ...lead
        } as Lead;

        // Local Save
        const leads = getStorage<Lead[]>('leads', []);
        leads.unshift(newLead);
        setStorage('leads', leads);
        
        // Server Sync
        await syncToServer('create_lead', newLead);

        return newLead;
    },
    deleteLead: async (id: string) => {
        let leads = getStorage<Lead[]>('leads', []);
        leads = leads.filter(l => l.id !== id);
        setStorage('leads', leads);
        
        // Server Sync
        await syncToServer('delete_lead', { id });
    },
    deleteAllLeads: async () => {
        setStorage('leads', []);
        // Server Sync
        await syncToServer('delete_all_leads', {});
    },
    updateLeadStatus: async (id: string, status: LeadStatus) => {
        const leads = getStorage<Lead[]>('leads', []);
        const index = leads.findIndex(l => l.id === id);
        if (index !== -1) {
            leads[index].status = status;
            leads[index].last_activity_at = new Date().toISOString();
            setStorage('leads', leads);
            // Server Sync
            await syncToServer('update_lead', leads[index]);
        }
    },
    updateLeadIndustry: async (id: string, industry: string) => {
        const leads = getStorage<Lead[]>('leads', []);
        const index = leads.findIndex(l => l.id === id);
        if (index !== -1) {
            leads[index].industry = industry;
            setStorage('leads', leads);
            await syncToServer('update_lead', leads[index]);
        }
    },
    toggleLeadStar: async (id: string) => {
        const leads = getStorage<Lead[]>('leads', []);
        const index = leads.findIndex(l => l.id === id);
        if (index !== -1) {
            leads[index].is_starred = !leads[index].is_starred;
            setStorage('leads', leads);
            await syncToServer('update_lead', leads[index]);
        }
    },
    updateLeadNote: async (id: string, note: string) => {
        const leads = getStorage<Lead[]>('leads', []);
        const index = leads.findIndex(l => l.id === id);
        if (index !== -1) {
            leads[index].quick_note = note;
            setStorage('leads', leads);
            await syncToServer('update_lead', leads[index]);
        }
    },
    incrementDownloadCount: async (ids: string[]) => {
        const leads = getStorage<Lead[]>('leads', []);
        let updated = false;
        leads.forEach(l => {
            if (ids.includes(l.id)) {
                l.download_count = (l.download_count || 0) + 1;
                updated = true;
            }
        });
        if (updated) setStorage('leads', leads);
    },
    resolvePhoneNumbersToIds: async (phones: string[]): Promise<string[]> => {
        const leads = await mockService.getLeads(); 
        const ids: string[] = [];

        for (const phone of phones) {
            const existing = leads.find(l => l.primary_phone.includes(phone) || phone.includes(l.primary_phone));
            if (existing) {
                ids.push(existing.id);
            } else {
                const newLead = await mockService.createLead({
                    full_name: 'Unknown',
                    primary_phone: phone,
                    source: LeadSource.MANUAL,
                    status: LeadStatus.NEW,
                });
                ids.push(newLead.id);
            }
        }
        return ids;
    },

    // --- INDUSTRIES ---
    getIndustries: async (): Promise<string[]> => {
        return getStorage<string[]>('industries', INDUSTRIES);
    },
    addIndustry: async (name: string) => {
        const list = getStorage<string[]>('industries', INDUSTRIES);
        if (!list.includes(name)) {
            list.push(name);
            setStorage('industries', list);
        }
    },
    deleteIndustry: async (name: string) => {
        let list = getStorage<string[]>('industries', INDUSTRIES);
        list = list.filter(i => i !== name);
        setStorage('industries', list);
    },

    // --- INTERACTIONS ---
    getInteractions: async (leadId: string): Promise<Interaction[]> => {
        const interactions = getStorage<Interaction[]>('interactions', []);
        return interactions.filter(i => i.lead_id === leadId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    addLeadInteraction: async (leadId: string, data: Partial<ClientInteraction>) => {
        const interactions = getStorage<Interaction[]>('interactions', []);
        const newInt = {
            id: uuid(),
            lead_id: leadId,
            channel: 'other',
            direction: 'incoming',
            content: `${data.type}: ${data.notes}`,
            created_at: data.date || new Date().toISOString()
        } as any;
        
        interactions.push(newInt);
        setStorage('interactions', interactions);
        
        await syncToServer('add_interaction', newInt);
    },
    deleteLeadInteraction: async (leadId: string, interactionId: string) => {
        let interactions = getStorage<Interaction[]>('interactions', []);
        interactions = interactions.filter(i => i.id !== interactionId);
        setStorage('interactions', interactions);
    },
    
    // --- TEMPLATES ---
    getTemplates: async (): Promise<MessageTemplate[]> => {
        // Keep default templates for utility, but allow deletion
        return getStorage<MessageTemplate[]>('templates', FULL_TEMPLATES);
    },
    createTemplate: async (template: Partial<MessageTemplate>) => {
        const templates = getStorage<MessageTemplate[]>('templates', FULL_TEMPLATES);
        const newT: MessageTemplate = {
            id: uuid(),
            name: template.name!,
            category: template.category!,
            channel: template.channel!,
            type: template.type || 'custom',
            body: template.body!,
            is_active: true
        };
        templates.push(newT);
        setStorage('templates', templates);
    },
    updateTemplate: async (id: string, updates: Partial<MessageTemplate>) => {
        const templates = getStorage<MessageTemplate[]>('templates', FULL_TEMPLATES);
        const idx = templates.findIndex(t => t.id === id);
        if (idx !== -1) {
            templates[idx] = { ...templates[idx], ...updates };
            setStorage('templates', templates);
        }
    },
    deleteTemplate: async (id: string) => {
        let templates = getStorage<MessageTemplate[]>('templates', FULL_TEMPLATES);
        templates = templates.filter(t => t.id !== id);
        setStorage('templates', templates);
    },

    // --- CAMPAIGNS ---
    getCampaigns: async (): Promise<Campaign[]> => {
        return getStorage<Campaign[]>('campaigns', []);
    },
    createCampaign: async (campaign: Partial<Campaign>) => {
        const campaigns = getStorage<Campaign[]>('campaigns', []);
        const newC: Campaign = {
            id: uuid(),
            name: campaign.name!,
            description: campaign.description || '',
            steps: campaign.steps || [],
            active_leads_count: 0,
            is_active: true
        };
        campaigns.push(newC);
        setStorage('campaigns', campaigns);
    },

    // --- AUTOMATION RULES ---
    getSimpleAutomationRules: async (): Promise<SimpleAutomationRule[]> => {
        return getStorage<SimpleAutomationRule[]>('automation_rules', []);
    },
    saveSimpleAutomationRule: async (status: LeadStatus, steps: any[]) => {
        let rules = getStorage<SimpleAutomationRule[]>('automation_rules', []);
        const idx = rules.findIndex(r => r.status === status);
        if (idx !== -1) {
            rules[idx].steps = steps.map(s => ({ ...s, id: uuid() }));
        } else {
            rules.push({
                id: uuid(),
                status,
                steps: steps.map(s => ({ ...s, id: uuid() })),
                is_active: true
            });
        }
        setStorage('automation_rules', rules);
    },

    // --- MESSAGING ---
    sendBulkSMS: async (leadIds: string[], body: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const interactions = getStorage<Interaction[]>('interactions', []);
        const leads = getStorage<Lead[]>('leads', []);
        
        leadIds.forEach(id => {
            interactions.push({
                id: uuid(),
                lead_id: id,
                channel: 'sms',
                direction: 'outgoing', 
                content: body,
                created_at: new Date().toISOString()
            } as any);

            const leadIdx = leads.findIndex(l => l.id === id);
            if (leadIdx !== -1) {
                leads[leadIdx].total_messages_sent = (leads[leadIdx].total_messages_sent || 0) + 1;
                leads[leadIdx].last_activity_at = new Date().toISOString();
            }
        });
        setStorage('interactions', interactions);
        setStorage('leads', leads);
    },
    scheduleBulkMessages: async (leadIds: string[], messages: any[]) => {
        await new Promise(resolve => setTimeout(resolve, 500));
    },

    // --- FORMS ---
    getForms: async (): Promise<LeadForm[]> => {
        return getStorage<LeadForm[]>('lead_forms', INITIAL_LEAD_FORMS);
    },
    getFormById: async (id: string): Promise<LeadForm | undefined> => {
        const forms = getStorage<LeadForm[]>('lead_forms', INITIAL_LEAD_FORMS);
        return forms.find(f => f.id === id);
    },
    createForm: async (form: Omit<LeadForm, 'id' | 'created_at'>) => {
        const forms = getStorage<LeadForm[]>('lead_forms', INITIAL_LEAD_FORMS);
        forms.push({ ...form, id: uuid(), created_at: new Date().toISOString() });
        setStorage('lead_forms', forms);
    },
    updateForm: async (id: string, updates: Partial<LeadForm>) => {
        const forms = getStorage<LeadForm[]>('lead_forms', INITIAL_LEAD_FORMS);
        const idx = forms.findIndex(f => f.id === id);
        if(idx !== -1) {
            forms[idx] = { ...forms[idx], ...updates };
            setStorage('lead_forms', forms);
        }
    },
    deleteForm: async (id: string) => {
        let forms = getStorage<LeadForm[]>('lead_forms', INITIAL_LEAD_FORMS);
        forms = forms.filter(f => f.id !== id);
        setStorage('lead_forms', forms);
    },
    submitLeadForm: async (formId: string, data: any) => {
        const newLead: Partial<Lead> = {
            full_name: data.name,
            primary_phone: data.phone,
            source: LeadSource.FORM,
            status: LeadStatus.NEW,
            industry: data.industry,
            website_url: data.website,
            facebook_profile_link: data.facebook
        };
        await mockService.createLead(newLead);
    },

    // --- CUSTOMERS (ONLINE) ---
    getCustomers: async (): Promise<Customer[]> => {
        return getStorage<Customer[]>('online_customers', []);
    },
    deleteCustomer: async (id: string) => {
        let customers = getStorage<Customer[]>('online_customers', []);
        customers = customers.filter(c => c.id !== id);
        setStorage('online_customers', customers);
    },
    getCustomerCategories: async (): Promise<string[]> => {
        return getStorage<string[]>('customer_categories', ['Dress', 'Bag', 'Shoes', 'Watch', 'Gadget']);
    },
    addCustomerCategory: async (name: string) => {
        const cats = getStorage<string[]>('customer_categories', ['Dress', 'Bag', 'Shoes', 'Watch', 'Gadget']);
        if (!cats.includes(name)) {
            cats.push(name);
            setStorage('customer_categories', cats);
        }
    },
    deleteCustomerCategory: async (name: string) => {
        let cats = getStorage<string[]>('customer_categories', ['Dress', 'Bag', 'Shoes', 'Watch', 'Gadget']);
        cats = cats.filter(c => c !== name);
        setStorage('customer_categories', cats);
    },
    addBulkCustomers: async (lines: string[], category: string): Promise<number> => {
        let customers = getStorage<Customer[]>('online_customers', []);
        let added = 0;
        
        lines.forEach(line => {
            const phone = line.trim();
            if (phone && !customers.find(c => c.phone === phone)) {
                customers.unshift({
                    id: uuid(),
                    phone,
                    category,
                    date_added: new Date().toISOString()
                });
                added++;
            }
        });
        setStorage('online_customers', customers);
        return added;
    },

    // --- BIG FISH (VIP CLIENTS) ---
    getBigFish: async (): Promise<BigFish[]> => {
        return getStorage<BigFish[]>('big_fish', []);
    },
    getBigFishById: async (id: string): Promise<BigFish | undefined> => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        return fish.find(f => f.id === id);
    },
    createBigFish: async (fish: Partial<BigFish>) => {
        const allFish = getStorage<BigFish[]>('big_fish', []);
        const newFish: BigFish = {
            id: uuid(),
            lead_id: fish.lead_id || uuid(),
            name: fish.name!,
            status: 'Active Pool',
            package_name: fish.package_name,
            balance: 0,
            low_balance_alert_threshold: 10,
            total_budget: 0,
            spent_amount: 0,
            target_sales: 100,
            current_sales: 0,
            phone: fish.phone || '',
            transactions: [],
            growth_tasks: [],
            reports: [],
            portal_config: { show_balance: true, show_history: true, is_suspended: false },
            start_date: new Date().toISOString(),
            interactions: []
        };
        allFish.unshift(newFish);
        setStorage('big_fish', allFish);
        return newFish;
    },
    updateBigFish: async (id: string, updates: Partial<BigFish>) => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const idx = fish.findIndex(f => f.id === id);
        if (idx !== -1) {
            fish[idx] = { ...fish[idx], ...updates };
            setStorage('big_fish', fish);
        }
    },
    catchBigFish: async (leadId: string): Promise<BigFish | null> => {
        const leads = getStorage<Lead[]>('leads', []);
        const fish = getStorage<BigFish[]>('big_fish', []);
        
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return null;
        
        if (fish.find(f => f.lead_id === leadId)) return null; // Already caught

        const newFish: BigFish = {
            id: uuid(),
            lead_id: lead.id,
            name: lead.full_name,
            status: 'Active Pool',
            package_name: lead.service_category || 'Standard Plan',
            balance: 0,
            low_balance_alert_threshold: 10,
            total_budget: 0,
            spent_amount: 0,
            target_sales: 100,
            current_sales: 0,
            phone: lead.primary_phone,
            transactions: [],
            growth_tasks: [],
            reports: [],
            portal_config: { show_balance: true, show_history: true, is_suspended: false },
            start_date: new Date().toISOString(),
            interactions: []
        };
        
        fish.unshift(newFish);
        setStorage('big_fish', fish);
        
        // Optionally update lead status to WON
        await mockService.updateLeadStatus(leadId, LeadStatus.CLOSED_WON);
        
        return newFish;
    },
    toggleBigFishStatus: async (id: string) => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const idx = fish.findIndex(f => f.id === id);
        if (idx !== -1) {
            fish[idx].status = fish[idx].status === 'Active Pool' ? 'Hall of Fame' : 'Active Pool';
            fish[idx].end_date = fish[idx].status === 'Hall of Fame' ? new Date().toISOString() : undefined;
            setStorage('big_fish', fish);
        }
    },
    addTransaction: async (fishId: string, type: Transaction['type'], amount: number, desc: string, metadata?: any, dateStr?: string) => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const idx = fish.findIndex(f => f.id === fishId);
        if (idx !== -1) {
            const tx: Transaction = {
                id: uuid(),
                date: dateStr || new Date().toISOString(),
                type,
                amount,
                description: desc,
                metadata
            };
            fish[idx].transactions.unshift(tx);
            
            // Recalculate Balance
            if (type === 'DEPOSIT') {
                fish[idx].balance = (fish[idx].balance || 0) + amount;
                fish[idx].total_budget = (fish[idx].total_budget || 0) + amount;
            } else {
                fish[idx].balance = (fish[idx].balance || 0) - amount;
                if(type === 'AD_SPEND') {
                    fish[idx].spent_amount = (fish[idx].spent_amount || 0) + amount;
                    // Auto-update sales if metadata provided
                    if(metadata && metadata.resultType === 'SALES' && metadata.leads) {
                        fish[idx].current_sales = (fish[idx].current_sales || 0) + metadata.leads;
                    }
                    // Auto-add Report Log
                    fish[idx].reports.unshift({
                        id: uuid(),
                        date: dateStr || new Date().toISOString(),
                        task: `Ad Spend: $${amount} | Results: ${metadata?.leads || 0} (${metadata?.resultType})`
                    });
                }
            }
            setStorage('big_fish', fish);
        }
    },
    updateTransaction: async (fishId: string, txId: string, updates: Partial<Transaction>) => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const fIdx = fish.findIndex(f => f.id === fishId);
        if (fIdx !== -1) {
            const txIdx = fish[fIdx].transactions.findIndex(t => t.id === txId);
            if (txIdx !== -1) {
                // Revert old balance effect
                const oldTx = fish[fIdx].transactions[txIdx];
                if (oldTx.type === 'DEPOSIT') fish[fIdx].balance -= oldTx.amount;
                else fish[fIdx].balance += oldTx.amount;
                if (oldTx.type === 'AD_SPEND') fish[fIdx].spent_amount -= oldTx.amount;

                // Update
                const newTx = { ...oldTx, ...updates };
                fish[fIdx].transactions[txIdx] = newTx;

                // Apply new balance effect
                if (newTx.type === 'DEPOSIT') fish[fIdx].balance += newTx.amount;
                else fish[fIdx].balance -= newTx.amount;
                if (newTx.type === 'AD_SPEND') fish[fIdx].spent_amount += newTx.amount;

                setStorage('big_fish', fish);
            }
        }
    },
    deleteTransaction: async (fishId: string, txId: string) => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const fIdx = fish.findIndex(f => f.id === fishId);
        if (fIdx !== -1) {
            const tx = fish[fIdx].transactions.find(t => t.id === txId);
            if (tx) {
                // Revert balance
                if (tx.type === 'DEPOSIT') fish[fIdx].balance -= tx.amount;
                else fish[fIdx].balance += tx.amount;
                if (tx.type === 'AD_SPEND') fish[fIdx].spent_amount -= tx.amount;

                // Remove
                fish[fIdx].transactions = fish[fIdx].transactions.filter(t => t.id !== txId);
                setStorage('big_fish', fish);
            }
        }
    },
    addGrowthTask: async (fishId: string, title: string, dueDate?: string) => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const idx = fish.findIndex(f => f.id === fishId);
        if (idx !== -1) {
            fish[idx].growth_tasks.push({
                id: uuid(),
                title,
                is_completed: false,
                due_date: dueDate
            });
            setStorage('big_fish', fish);
        }
    },
    toggleGrowthTask: async (fishId: string, taskId: string) => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const idx = fish.findIndex(f => f.id === fishId);
        if (idx !== -1) {
            const task = fish[idx].growth_tasks.find(t => t.id === taskId);
            if (task) task.is_completed = !task.is_completed;
            setStorage('big_fish', fish);
        }
    },
    updatePortalConfig: async (fishId: string, config: any) => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const idx = fish.findIndex(f => f.id === fishId);
        if (idx !== -1) {
            fish[idx].portal_config = { ...fish[idx].portal_config, ...config };
            setStorage('big_fish', fish);
        }
    },
    updateTargets: async (fishId: string, target: number, current: number) => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const idx = fish.findIndex(f => f.id === fishId);
        if (idx !== -1) {
            fish[idx].target_sales = target;
            fish[idx].current_sales = current;
            setStorage('big_fish', fish);
        }
    },
    addWorkLog: async (fishId: string, text: string) => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const idx = fish.findIndex(f => f.id === fishId);
        if (idx !== -1) {
            fish[idx].reports.unshift({
                id: uuid(),
                date: new Date().toISOString(),
                task: text
            });
            setStorage('big_fish', fish);
        }
    },
    checkExpiringCampaigns: async (): Promise<BigFish[]> => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const now = new Date();
        return fish.filter(f => {
            if (!f.campaign_end_date || f.status !== 'Active Pool') return false;
            const end = new Date(f.campaign_end_date);
            const diffHours = (end.getTime() - now.getTime()) / (1000 * 60 * 60);
            return diffHours > 0 && diffHours <= 24;
        });
    },
    checkRetainerRenewals: async (): Promise<BigFish[]> => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const now = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(now.getDate() + 7);
        
        return fish.filter(f => {
            if (!f.is_retainer || !f.retainer_renewal_date || f.status !== 'Active Pool') return false;
            const renew = new Date(f.retainer_renewal_date);
            return renew <= sevenDaysFromNow;
        });
    },
    renewRetainer: async (fishId: string) => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const idx = fish.findIndex(f => f.id === fishId);
        if (idx !== -1 && fish[idx].retainer_renewal_date) {
            // Add 30 days
            const current = new Date(fish[idx].retainer_renewal_date!);
            current.setDate(current.getDate() + 30);
            fish[idx].retainer_renewal_date = current.toISOString().slice(0, 10);
            
            // Add Log
            fish[idx].reports.unshift({
                id: uuid(),
                date: new Date().toISOString(),
                task: `Subscription Renewed. Next due: ${fish[idx].retainer_renewal_date}`
            });
            
            setStorage('big_fish', fish);
        }
    },
    getLifetimeDeposit: (fish: BigFish): number => {
        return fish.transactions
            .filter(t => t.type === 'DEPOSIT')
            .reduce((sum, t) => sum + t.amount, 0);
    },
    addClientInteraction: async (fishId: string, data: Partial<ClientInteraction>) => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const idx = fish.findIndex(f => f.id === fishId);
        if (idx !== -1) {
            const newInteraction: ClientInteraction = {
                id: uuid(),
                type: data.type || 'CALL',
                date: data.date || new Date().toISOString(),
                notes: data.notes || '',
                next_follow_up: data.next_follow_up,
                created_at: new Date().toISOString()
            };
            if (!fish[idx].interactions) fish[idx].interactions = [];
            fish[idx].interactions!.unshift(newInteraction);
            setStorage('big_fish', fish);
        }
    },
    deleteClientInteraction: async (fishId: string, interactionId: string) => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const idx = fish.findIndex(f => f.id === fishId);
        if (idx !== -1 && fish[idx].interactions) {
            fish[idx].interactions = fish[idx].interactions!.filter(i => i.id !== interactionId);
            setStorage('big_fish', fish);
        }
    },

    // --- TASKS (DAILY) ---
    getTasks: async (): Promise<Task[]> => {
        return getStorage<Task[]>('daily_tasks', []);
    },
    createTask: async (text: string, dueDate?: string, leadId?: string) => {
        const tasks = getStorage<Task[]>('daily_tasks', []);
        tasks.unshift({
            id: uuid(),
            text,
            is_completed: false,
            created_at: new Date().toISOString(),
            due_date: dueDate,
            lead_id: leadId
        });
        setStorage('daily_tasks', tasks);
    },
    toggleTask: async (id: string) => {
        const tasks = getStorage<Task[]>('daily_tasks', []);
        const idx = tasks.findIndex(t => t.id === id);
        if (idx !== -1) {
            tasks[idx].is_completed = !tasks[idx].is_completed;
            setStorage('daily_tasks', tasks);
        }
    },
    deleteTask: async (id: string) => {
        let tasks = getStorage<Task[]>('daily_tasks', []);
        tasks = tasks.filter(t => t.id !== id);
        setStorage('daily_tasks', tasks);
    },

    // --- SALES GOALS ---
    getSalesTargets: async (): Promise<MonthlyTarget[]> => {
        return getStorage<MonthlyTarget[]>('sales_targets', []);
    },
    setSalesTarget: async (target: Partial<MonthlyTarget>) => {
        const targets = getStorage<MonthlyTarget[]>('sales_targets', []);
        const idx = targets.findIndex(t => t.month === target.month && t.service === target.service);
        if (idx !== -1) {
            targets[idx] = { ...targets[idx], ...target };
        } else {
            targets.push({ id: uuid(), ...target } as MonthlyTarget);
        }
        setStorage('sales_targets', targets);
    },
    getSalesEntries: async (): Promise<SalesEntry[]> => {
        return getStorage<SalesEntry[]>('sales_entries', []);
    },
    addSalesEntry: async (entry: Partial<SalesEntry>) => {
        const entries = getStorage<SalesEntry[]>('sales_entries', []);
        entries.push({ id: uuid(), created_at: new Date().toISOString(), ...entry } as SalesEntry);
        setStorage('sales_entries', entries);
    },
    updateSalesEntry: async (id: string, updates: Partial<SalesEntry>) => {
        const entries = getStorage<SalesEntry[]>('sales_entries', []);
        const idx = entries.findIndex(e => e.id === id);
        if(idx !== -1) {
            entries[idx] = { ...entries[idx], ...updates };
            setStorage('sales_entries', entries);
        }
    },
    deleteSalesEntry: async (id: string) => {
        let entries = getStorage<SalesEntry[]>('sales_entries', []);
        entries = entries.filter(e => e.id !== id);
        setStorage('sales_entries', entries);
    },

    // --- INVOICES ---
    getInvoices: async (): Promise<Invoice[]> => {
        return getStorage<Invoice[]>('invoices', []);
    },
    createInvoice: async (data: any) => {
        const invoices = getStorage<Invoice[]>('invoices', []);
        const nextNum = (invoices.length + 1).toString().padStart(4, '0');
        const newInv: Invoice = {
            id: uuid(),
            number: `INV-${nextNum}`,
            created_at: new Date().toISOString(),
            ...data
        };
        invoices.unshift(newInv);
        setStorage('invoices', invoices);
    },
    deleteInvoice: async (id: string) => {
        let invoices = getStorage<Invoice[]>('invoices', []);
        invoices = invoices.filter(i => i.id !== id);
        setStorage('invoices', invoices);
    },

    // --- SNIPPETS ---
    getSnippets: async (): Promise<Snippet[]> => {
        return getStorage<Snippet[]>('snippets', FULL_SNIPPETS);
    },
    createSnippet: async (data: any) => {
        const list = getStorage<Snippet[]>('snippets', FULL_SNIPPETS);
        list.push({ id: uuid(), ...data });
        setStorage('snippets', list);
    },
    updateSnippet: async (id: string, data: any) => {
        const list = getStorage<Snippet[]>('snippets', FULL_SNIPPETS);
        const idx = list.findIndex(s => s.id === id);
        if(idx !== -1) { list[idx] = { ...list[idx], ...data }; setStorage('snippets', list); }
    },
    deleteSnippet: async (id: string) => {
        let list = getStorage<Snippet[]>('snippets', FULL_SNIPPETS);
        list = list.filter(s => s.id !== id);
        setStorage('snippets', list);
    },

    // --- PAYMENT METHODS ---
    getPaymentMethods: async (): Promise<PaymentMethod[]> => {
        return getStorage<PaymentMethod[]>('payment_methods', []);
    },
    savePaymentMethod: async (pm: any) => {
        const list = getStorage<PaymentMethod[]>('payment_methods', []);
        list.push({ id: uuid(), ...pm });
        setStorage('payment_methods', list);
    },
    deletePaymentMethod: async (id: string) => {
        let list = getStorage<PaymentMethod[]>('payment_methods', []);
        list = list.filter(p => p.id !== id);
        setStorage('payment_methods', list);
    },

    // --- AD SWIPE ---
    getAdInspirations: async (): Promise<AdInspiration[]> => {
        return getStorage<AdInspiration[]>('ad_swipe', []);
    },
    addAdInspiration: async (ad: any) => {
        const list = getStorage<AdInspiration[]>('ad_swipe', []);
        const newAd = { id: uuid(), created_at: new Date().toISOString(), ...ad };
        list.unshift(newAd);
        setStorage('ad_swipe', list);
        return newAd;
    },
    deleteAdInspiration: async (id: string) => {
        let list = getStorage<AdInspiration[]>('ad_swipe', []);
        list = list.filter(a => a.id !== id);
        setStorage('ad_swipe', list);
    },

    // --- DOCUMENTS (Letterhead) ---
    getDocuments: async (): Promise<Document[]> => {
        return getStorage<Document[]>('documents', []);
    },
    saveDocument: async (doc: any) => {
        const list = getStorage<Document[]>('documents', []);
        list.unshift({ id: uuid(), created_at: new Date().toISOString(), ...doc });
        setStorage('documents', list);
    },
    deleteDocument: async (id: string) => {
        let list = getStorage<Document[]>('documents', []);
        list = list.filter(d => d.id !== id);
        setStorage('documents', list);
    },

    // --- SYSTEM SETTINGS ---
    getSystemSettings: async (): Promise<SystemSettings> => {
        return getSettings();
    },
    saveSystemSettings: async (settings: SystemSettings) => {
        setStorage('system_settings', settings);
    },

    // --- MESSENGER MOCK ---
    getMessengerConversations: async (): Promise<MessengerConversation[]> => {
        return getStorage<MessengerConversation[]>('messenger_convs', []);
    },
    simulateIncomingMessage: async (text: string, senderName: string) => {
        const convs = getStorage<MessengerConversation[]>('messenger_convs', []);
        let conv = convs.find(c => c.customer_name === senderName);
        
        if (!conv) {
            conv = {
                id: uuid(),
                facebook_user_id: uuid(),
                customer_name: senderName,
                messages: [],
                last_message: '',
                last_updated: new Date().toISOString(),
                is_lead_linked: false
            };
            convs.push(conv);
        }

        // Add Customer Message
        conv.messages.push({
            id: uuid(),
            sender: 'customer',
            type: 'text',
            content: text,
            timestamp: new Date().toISOString()
        });
        conv.last_message = text;
        conv.last_updated = new Date().toISOString();

        // Regex for phone parsing
        const phoneMatch = text.match(/(?:\+88|88)?01[3-9]\d{8}/);
        if (phoneMatch) {
            conv.customer_phone = phoneMatch[0];
            conv.is_lead_linked = true;
            
            // Check if Lead exists, if not create
            const leads = await mockService.getLeads();
            const exists = leads.find(l => l.primary_phone === phoneMatch[0]);
            if (!exists) {
                await mockService.createLead({
                    full_name: senderName,
                    primary_phone: phoneMatch[0],
                    source: LeadSource.FACEBOOK_MESSENGER,
                    status: LeadStatus.NEW
                });
            }
        }

        setStorage('messenger_convs', convs);
    }
};
