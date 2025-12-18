
import { 
  BigFish, Lead, LeadStatus, CampaignRecord, Task, Customer, 
  Invoice, Snippet, Document, Interaction, MessageTemplate, 
  Campaign, SimpleAutomationRule, LeadForm, PaymentMethod, 
  MessengerConversation, SystemSettings, SalesEntry, 
  MonthlyTarget, AdInspiration, LeadSource, ClientInteraction,
  OnboardingData, PortalConfig, Transaction, TopUpRequest
} from '../types';
import { 
  DEMO_LEADS, DEMO_BIG_FISH, INITIAL_TEMPLATES, INITIAL_SNIPPETS, INDUSTRIES 
} from '../constants';

const API_BASE = '/api';

// Helper to generate IDs
const uuid = () => Math.random().toString(36).substr(2, 9);

// Helper for local storage
const getStorage = <T>(key: string, defaultValue: T): T => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
};

const setStorage = <T>(key: string, data: T): void => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const mockService = {
    // --- LEADS ---
    getLeads: async (): Promise<Lead[]> => {
        return getStorage<Lead[]>('sae_leads', DEMO_LEADS as any);
    },

    getLeadById: async (id: string): Promise<Lead | undefined> => {
        const leads = await mockService.getLeads();
        return leads.find(l => l.id === id);
    },

    createLead: async (lead: Partial<Lead>): Promise<void> => {
        const leads = await mockService.getLeads();
        const newLead: Lead = {
            id: uuid(),
            full_name: lead.full_name || 'Unnamed Lead',
            primary_phone: lead.primary_phone || '',
            source: lead.source || LeadSource.MANUAL,
            status: lead.status || LeadStatus.NEW,
            is_starred: false,
            is_unread: true,
            total_messages_sent: 0,
            download_count: 0,
            first_contact_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            ...lead
        } as Lead;
        setStorage('sae_leads', [newLead, ...leads]);
    },

    updateLead: async (id: string, updates: Partial<Lead>): Promise<void> => {
        const leads = await mockService.getLeads();
        const updated = leads.map(l => l.id === id ? { ...l, ...updates, last_activity_at: new Date().toISOString() } : l);
        setStorage('sae_leads', updated);
    },

    updateLeadStatus: async (id: string, status: LeadStatus): Promise<void> => {
        await mockService.updateLead(id, { status });
    },

    updateLeadIndustry: async (id: string, industry: string): Promise<void> => {
        await mockService.updateLead(id, { industry });
    },

    toggleLeadStar: async (id: string): Promise<void> => {
        const lead = await mockService.getLeadById(id);
        if (lead) await mockService.updateLead(id, { is_starred: !lead.is_starred });
    },

    updateLeadNote: async (id: string, note: string): Promise<void> => {
        await mockService.updateLead(id, { quick_note: note });
    },

    incrementDownloadCount: async (ids: string[]): Promise<void> => {
        const leads = await mockService.getLeads();
        const updated = leads.map(l => ids.includes(l.id) ? { ...l, download_count: (l.download_count || 0) + 1 } : l);
        setStorage('sae_leads', updated);
    },

    // --- BIG FISH (VIP CLIENTS) ---
    getBigFish: async (): Promise<BigFish[]> => {
        try {
            const res = await fetch(`${API_BASE}/big_fish.php`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) return data;
            } else {
                console.error("API GET Failed", await res.text());
            }
        } catch (e) { console.error("API Error", e); }
        // Fallback to empty array if API fails, to prevent UI crash
        return [];
    },

    getBigFishById: async (id: string): Promise<BigFish | undefined> => {
        const allFish = await mockService.getBigFish();
        return allFish.find(f => f.id === id);
    },

    createBigFish: async (fish: Partial<BigFish>): Promise<void> => {
        const newId = uuid();
        try {
            await fetch(`${API_BASE}/big_fish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', id: newId, ...fish })
            });
        } catch (e) { console.error("API Create Error", e); }
    },

    updateBigFish: async (id: string, updates: Partial<BigFish>): Promise<void> => {
        try {
            await fetch(`${API_BASE}/big_fish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update', id, ...updates })
            });
        } catch (e) { console.error("API Update Error", e); }
    },

    catchBigFish: async (leadId: string): Promise<BigFish | null> => {
        const leads = await mockService.getLeads();
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return null;

        const allFish = await mockService.getBigFish();
        if (allFish.some(f => f.lead_id === leadId)) return null;

        const newFish: Partial<BigFish> = {
            lead_id: lead.id,
            name: lead.full_name,
            phone: lead.primary_phone,
            facebook_page: lead.facebook_profile_link,
            website_url: lead.website_url
        };

        await mockService.createBigFish(newFish);
        await mockService.updateLeadStatus(leadId, LeadStatus.CLOSED_WON);
        return await mockService.getBigFishById(leadId) || null;
    },

    toggleBigFishStatus: async (id: string): Promise<void> => {
        const fish = await mockService.getBigFishById(id);
        if (fish) await mockService.updateBigFish(id, { status: fish.status === 'Active Pool' ? 'Hall of Fame' : 'Active Pool' });
    },

    // --- TRANSACTIONS & PERFORMANCE ---
    addTransaction: async (fishId: string, type: 'DEPOSIT' | 'DEDUCT' | 'AD_SPEND' | 'SERVICE_CHARGE', amount: number, description: string): Promise<void> => {
        const txId = uuid();
        try {
            await fetch(`${API_BASE}/big_fish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add_transaction', id: txId, big_fish_id: fishId, type, amount, description, date: new Date().toISOString() })
            });
        } catch (e) { console.error("API Tx Error", e); }
    },

    updateTransaction: async (fishId: string, txId: string, updates: Partial<Transaction>): Promise<void> => {
       // Placeholder for PHP impl if needed
    },

    deleteTransaction: async (fishId: string, txId: string): Promise<void> => {
       // Placeholder for PHP impl
    },

    addCampaignRecord: async (fishId: string, record: Omit<CampaignRecord, 'id' | 'created_at'>): Promise<BigFish | undefined> => { 
        const newId = uuid();
        try {
            const res = await fetch(`${API_BASE}/big_fish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'add_campaign_record', 
                    id: newId, 
                    big_fish_id: fishId, 
                    ...record 
                })
            });
            if (res.ok) {
                return await mockService.getBigFishById(fishId);
            }
        } catch (e) { console.error("API Campaign Error", e); }
        return undefined;
    },

    deleteCampaignRecord: async (fishId: string, recordId: string): Promise<void> => {
        try {
            await fetch(`${API_BASE}/big_fish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_campaign_record', big_fish_id: fishId, record_id: recordId })
            });
        } catch (e) { console.error("API Campaign Delete Error", e); }
    },

    // --- TOP UP REQUESTS (DB Updated) ---
    createTopUpRequest: async (req: Omit<TopUpRequest, 'id' | 'status' | 'created_at'>): Promise<void> => {
        try {
            const res = await fetch(`${API_BASE}/big_fish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create_topup_request', id: uuid(), ...req })
            });
            if(!res.ok) console.error("TopUp Create Failed", await res.text());
        } catch (e) { console.error("TopUp Error", e); }
    },

    approveTopUpRequest: async (fishId: string, reqId: string): Promise<void> => {
        try {
            await fetch(`${API_BASE}/big_fish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_topup_status', request_id: reqId, status: 'APPROVED' })
            });
        } catch (e) { console.error("TopUp Approve Error", e); }
    },

    rejectTopUpRequest: async (fishId: string, reqId: string): Promise<void> => {
        try {
            await fetch(`${API_BASE}/big_fish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_topup_status', request_id: reqId, status: 'REJECTED' })
            });
        } catch (e) { console.error("TopUp Reject Error", e); }
    },

    deleteTopUpRequest: async (fishId: string, reqId: string): Promise<void> => {
        try {
            await fetch(`${API_BASE}/big_fish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_topup_request', request_id: reqId })
            });
        } catch (e) { console.error("TopUp Delete Error", e); }
    },

    // --- GROWTH TASKS (DB Updated) ---
    addGrowthTask: async (fishId: string, title: string, dueDate?: string): Promise<void> => {
        try {
            const res = await fetch(`${API_BASE}/big_fish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add_growth_task', id: uuid(), big_fish_id: fishId, title, due_date: dueDate })
            });
            if(!res.ok) console.error("Task Add Failed", await res.text());
        } catch (e) { console.error("Task Add Error", e); }
    },

    toggleGrowthTask: async (fishId: string, taskId: string): Promise<void> => {
        try {
            const res = await fetch(`${API_BASE}/big_fish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'toggle_growth_task', task_id: taskId })
            });
            if(!res.ok) console.error("Task Toggle Failed", await res.text());
        } catch (e) { console.error("Task Toggle Error", e); }
    },

    updateTargets: async (fishId: string, target: number, current: number): Promise<void> => {
        await mockService.updateBigFish(fishId, { target_sales: target, current_sales: current });
    },

    addClientInteraction: async (fishId: string, interaction: Partial<ClientInteraction>): Promise<void> => {
        // Placeholder as interactions are stored in JSON/Blob often or separate logic
    },

    deleteClientInteraction: async (fishId: string, interactionId: string): Promise<void> => {
        // Placeholder
    },

    // --- TASKS (GENERAL) ---
    getTasks: async (): Promise<Task[]> => {
        return getStorage<Task[]>('sae_tasks', []);
    },

    createTask: async (text: string, dueDate?: string, leadId?: string): Promise<void> => {
        const tasks = await mockService.getTasks();
        const newTask: Task = {
            id: uuid(),
            text,
            is_completed: false,
            created_at: new Date().toISOString(),
            due_date: dueDate,
            lead_id: leadId
        };
        setStorage('sae_tasks', [newTask, ...tasks]);
    },

    toggleTask: async (id: string): Promise<void> => {
        const tasks = await mockService.getTasks();
        const updated = tasks.map(t => t.id === id ? { ...t, is_completed: !t.is_completed } : t);
        setStorage('sae_tasks', updated);
    },

    deleteTask: async (id: string): Promise<void> => {
        const tasks = await mockService.getTasks();
        setStorage('sae_tasks', tasks.filter(t => t.id !== id));
    },

    // --- CRM / INTERACTIONS ---
    getInteractions: async (leadId: string): Promise<Interaction[]> => {
        return getStorage<Interaction[]>('sae_interactions', []).filter(i => i.lead_id === leadId);
    },

    addLeadInteraction: async (leadId: string, interaction: Partial<ClientInteraction>): Promise<void> => {
        const leads = await mockService.getLeads();
        const updated = leads.map(l => {
            if (l.id === leadId) {
                const newInteraction: ClientInteraction = {
                    id: uuid(),
                    date: interaction.date || new Date().toISOString(),
                    type: interaction.type || 'OTHER',
                    notes: interaction.notes || '',
                    next_follow_up: interaction.next_follow_up,
                    created_at: new Date().toISOString()
                };
                return { ...l, interactions: [newInteraction, ...(l.interactions || [])] };
            }
            return l;
        });
        setStorage('sae_leads', updated);
    },

    deleteLeadInteraction: async (leadId: string, interactionId: string): Promise<void> => {
        const leads = await mockService.getLeads();
        const updated = leads.map(l => {
            if (l.id === leadId && l.interactions) {
                return { ...l, interactions: l.interactions.filter(i => i.id !== interactionId) };
            }
            return l;
        });
        setStorage('sae_leads', updated);
    },

    // --- TEMPLATES ---
    getTemplates: async (): Promise<MessageTemplate[]> => {
        return getStorage<MessageTemplate[]>('sae_templates', INITIAL_TEMPLATES.map(t => ({ ...t, id: uuid() })));
    },

    createTemplate: async (template: Partial<MessageTemplate>): Promise<void> => {
        const templates = await mockService.getTemplates();
        setStorage('sae_templates', [{ ...template, id: uuid() } as MessageTemplate, ...templates]);
    },

    updateTemplate: async (id: string, updates: Partial<MessageTemplate>): Promise<void> => {
        const templates = await mockService.getTemplates();
        setStorage('sae_templates', templates.map(t => t.id === id ? { ...t, ...updates } : t));
    },

    deleteTemplate: async (id: string): Promise<void> => {
        const templates = await mockService.getTemplates();
        setStorage('sae_templates', templates.filter(t => t.id !== id));
    },

    // --- AUTOMATION ---
    getCampaigns: async (): Promise<Campaign[]> => {
        return getStorage<Campaign[]>('sae_campaigns', []);
    },

    createCampaign: async (campaign: Partial<Campaign>): Promise<void> => {
        const campaigns = await mockService.getCampaigns();
        setStorage('sae_campaigns', [{ ...campaign, id: uuid(), active_leads_count: 0 } as Campaign, ...campaigns]);
    },

    getSimpleAutomationRules: async (): Promise<SimpleAutomationRule[]> => {
        return getStorage<SimpleAutomationRule[]>('sae_automation_rules', []);
    },

    saveSimpleAutomationRule: async (status: LeadStatus, steps: any[]): Promise<void> => {
        const rules = await mockService.getSimpleAutomationRules();
        const existingIdx = rules.findIndex(r => r.status === status);
        const newRule: SimpleAutomationRule = {
            id: existingIdx > -1 ? rules[existingIdx].id : uuid(),
            status,
            steps: steps.map(s => ({ ...s, id: uuid() })),
            is_active: true
        };
        if (existingIdx > -1) {
            rules[existingIdx] = newRule;
            setStorage('sae_automation_rules', rules);
        } else {
            setStorage('sae_automation_rules', [...rules, newRule]);
        }
    },

    triggerAutomationCheck: async (): Promise<void> => {
        console.log("Automation Heartbeat: Checking for pending messages...");
    },

    // --- MESSAGING ---
    sendBulkSMS: async (ids: string[], body: string): Promise<void> => {
        console.log(`Sending SMS to ${ids.length} recipients: ${body}`);
        const leads = await mockService.getLeads();
        const updated = leads.map(l => ids.includes(l.id) ? { ...l, total_messages_sent: (l.total_messages_sent || 0) + 1 } : l);
        setStorage('sae_leads', updated);
    },

    scheduleBulkMessages: async (ids: string[], schedule: any[]): Promise<void> => {
        console.log(`Scheduling messages for ${ids.length} recipients.`);
    },

    resolvePhoneNumbersToIds: async (numbers: string[]): Promise<string[]> => {
        const leads = await mockService.getLeads();
        const resultIds: string[] = [];
        for (const num of numbers) {
            let lead = leads.find(l => l.primary_phone === num);
            if (lead) {
                resultIds.push(lead.id);
            } else {
                const newId = uuid();
                await mockService.createLead({ full_name: 'New Lead', primary_phone: num, source: LeadSource.MANUAL });
                resultIds.push(newId);
            }
        }
        return resultIds;
    },

    // --- FORMS ---
    getForms: async (): Promise<LeadForm[]> => {
        return getStorage<LeadForm[]>('sae_forms', []);
    },

    getFormById: async (id: string): Promise<LeadForm | undefined> => {
        const forms = await mockService.getForms();
        return forms.find(f => f.id === id);
    },

    createForm: async (form: Omit<LeadForm, 'id' | 'created_at'>): Promise<void> => {
        const forms = await mockService.getForms();
        setStorage('sae_forms', [{ ...form, id: uuid(), created_at: new Date().toISOString() } as LeadForm, ...forms]);
    },

    updateForm: async (id: string, updates: Partial<LeadForm>): Promise<void> => {
        const forms = await mockService.getForms();
        setStorage('sae_forms', forms.map(f => f.id === id ? { ...f, ...updates } : f));
    },

    deleteForm: async (id: string): Promise<void> => {
        const forms = await mockService.getForms();
        setStorage('sae_forms', forms.filter(f => f.id !== id));
    },

    submitLeadForm: async (formId: string, data: any): Promise<void> => {
        const leadData: Partial<Lead> = {
            full_name: data.name,
            primary_phone: data.phone,
            facebook_profile_link: data.facebook,
            website_url: data.website,
            industry: data.industry,
            source: LeadSource.FORM,
            onboarding_data: {
                current_plan: data.current_plan,
                monthly_avg_budget: data.monthly_avg_budget,
                product_price: data.product_price,
                marketing_budget_willingness: data.marketing_budget_willingness
            }
        };
        await mockService.createLead(leadData);
    },

    // --- CUSTOMERS ---
    getCustomers: async (): Promise<Customer[]> => {
        return getStorage<Customer[]>('sae_customers', []);
    },

    addBulkCustomers: async (numbers: string[], category: string): Promise<number> => {
        const customers = await mockService.getCustomers();
        let added = 0;
        const newBatch: Customer[] = [];
        for (const num of numbers) {
            if (!customers.some(c => c.phone === num)) {
                newBatch.push({ id: uuid(), phone: num, category, date_added: new Date().toISOString() });
                added++;
            }
        }
        setStorage('sae_customers', [...newBatch, ...customers]);
        return added;
    },

    deleteCustomer: async (id: string): Promise<void> => {
        const customers = await mockService.getCustomers();
        setStorage('sae_customers', customers.filter(c => c.id !== id));
    },

    getCustomerCategories: async (): Promise<string[]> => {
        return getStorage<string[]>('sae_customer_cats', ['Dress', 'Bag', 'Shoes', 'Watch']);
    },

    addCustomerCategory: async (name: string): Promise<void> => {
        const cats = await mockService.getCustomerCategories();
        if (!cats.includes(name)) setStorage('sae_customer_cats', [...cats, name]);
    },

    deleteCustomerCategory: async (name: string): Promise<void> => {
        const cats = await mockService.getCustomerCategories();
        setStorage('sae_customer_cats', cats.filter(c => c !== name));
    },

    // --- INVOICES ---
    getInvoices: async (): Promise<Invoice[]> => {
        return getStorage<Invoice[]>('sae_invoices', []);
    },

    createInvoice: async (invoice: Partial<Invoice>): Promise<void> => {
        const invoices = await mockService.getInvoices();
        const nextNum = invoices.length > 0 ? (parseInt(invoices[0].number.split('-')[1]) + 1) : 1001;
        const newInv: Invoice = {
            id: uuid(),
            number: `INV-${nextNum}`,
            created_at: new Date().toISOString(),
            paid_amount: 0,
            terms_enabled: true,
            status: 'new',
            date: new Date().toISOString().slice(0, 10),
            items: [],
            client_name: '',
            ...invoice
        } as Invoice;
        setStorage('sae_invoices', [newInv, ...invoices]);
    },

    deleteInvoice: async (id: string): Promise<void> => {
        const invoices = await mockService.getInvoices();
        setStorage('sae_invoices', invoices.filter(i => i.id !== id));
    },

    // --- SNIPPETS ---
    getSnippets: async (): Promise<Snippet[]> => {
        return getStorage<Snippet[]>('sae_snippets', INITIAL_SNIPPETS.map(s => ({ ...s, id: uuid() })));
    },

    createSnippet: async (snippet: Partial<Snippet>): Promise<void> => {
        const snippets = await mockService.getSnippets();
        setStorage('sae_snippets', [{ ...snippet, id: uuid() } as Snippet, ...snippets]);
    },

    updateSnippet: async (id: string, updates: Partial<Snippet>): Promise<void> => {
        const snippets = await mockService.getSnippets();
        setStorage('sae_snippets', snippets.map(s => s.id === id ? { ...s, ...updates } : s));
    },

    deleteSnippet: async (id: string): Promise<void> => {
        const snippets = await mockService.getSnippets();
        setStorage('sae_snippets', snippets.filter(s => s.id !== id));
    },

    // --- DOCUMENTS ---
    getDocuments: async (): Promise<Document[]> => {
        return getStorage<Document[]>('sae_docs', []);
    },

    saveDocument: async (doc: Partial<Document>): Promise<void> => {
        const docs = await mockService.getDocuments();
        setStorage('sae_docs', [{ ...doc, id: uuid(), created_at: new Date().toISOString() } as Document, ...docs]);
    },

    deleteDocument: async (id: string): Promise<void> => {
        const docs = await mockService.getDocuments();
        setStorage('sae_docs', docs.filter(d => d.id !== id));
    },

    // --- SETTINGS ---
    getSystemSettings: async (): Promise<SystemSettings> => {
        return getStorage<SystemSettings>('sae_settings', {
            facebook_page_token: '',
            facebook_verify_token: '',
            sms_api_key: '',
            sms_sender_id: '',
            sms_base_url: '',
            timezone: 'Asia/Dhaka',
            system_api_key: 'lg_' + Math.random().toString(36).substr(2, 12)
        });
    },

    saveSystemSettings: async (settings: SystemSettings): Promise<void> => {
        setStorage('sae_settings', settings);
    },

    // --- SALES GOALS ---
    getSalesTargets: async (): Promise<MonthlyTarget[]> => {
        return getStorage<MonthlyTarget[]>('sae_sales_targets', []);
    },

    setSalesTarget: async (target: Partial<MonthlyTarget>): Promise<void> => {
        const targets = await mockService.getSalesTargets();
        const existingIdx = targets.findIndex(t => t.month === target.month && t.service === target.service);
        if (existingIdx > -1) {
            targets[existingIdx] = { ...targets[existingIdx], ...target };
            setStorage('sae_sales_targets', targets);
        } else {
            setStorage('sae_sales_targets', [{ ...target, id: uuid() } as MonthlyTarget, ...targets]);
        }
    },

    getSalesEntries: async (): Promise<SalesEntry[]> => {
        return getStorage<SalesEntry[]>('sae_sales_entries', []);
    },

    addSalesEntry: async (entry: Partial<SalesEntry>): Promise<void> => {
        const entries = await mockService.getSalesEntries();
        setStorage('sae_sales_entries', [{ ...entry, id: uuid(), created_at: new Date().toISOString() } as SalesEntry, ...entries]);
    },

    updateSalesEntry: async (id: string, updates: Partial<SalesEntry>): Promise<void> => {
        const entries = await mockService.getSalesEntries();
        setStorage('sae_sales_entries', entries.map(e => e.id === id ? { ...e, ...updates } : e));
    },

    deleteSalesEntry: async (id: string): Promise<void> => {
        const entries = await mockService.getSalesEntries();
        setStorage('sae_sales_entries', entries.filter(e => e.id !== id));
    },

    // --- AD INSPIRATION ---
    getAdInspirations: async (): Promise<AdInspiration[]> => {
        return getStorage<AdInspiration[]>('sae_ad_swipe', []);
    },

    addAdInspiration: async (ad: Partial<AdInspiration>): Promise<AdInspiration> => {
        const ads = await mockService.getAdInspirations();
        const newAd = { ...ad, id: uuid(), created_at: new Date().toISOString() } as AdInspiration;
        setStorage('sae_ad_swipe', [newAd, ...ads]);
        return newAd;
    },

    deleteAdInspiration: async (id: string): Promise<void> => {
        const ads = await mockService.getAdInspirations();
        setStorage('sae_ad_swipe', ads.filter(a => a.id !== id));
    },

    // --- MESSENGER SIMULATOR ---
    getMessengerConversations: async (): Promise<MessengerConversation[]> => {
        return getStorage<MessengerConversation[]>('sae_messenger_convs', []);
    },

    simulateIncomingMessage: async (text: string, sender: string): Promise<void> => {
        const convs = await mockService.getMessengerConversations();
        let conv = convs.find(c => c.customer_name === sender);
        const newMessage = { id: uuid(), sender: 'customer', type: 'text', content: text, timestamp: new Date().toISOString() };
        
        if (conv) {
            conv.messages.push(newMessage as any);
            conv.last_message = text;
            conv.last_updated = new Date().toISOString();
        } else {
            conv = {
                id: uuid(),
                facebook_user_id: uuid(),
                customer_name: sender,
                messages: [newMessage as any],
                last_message: text,
                last_updated: new Date().toISOString(),
                is_lead_linked: false
            };
            convs.push(conv);
        }
        setStorage('sae_messenger_convs', convs);
        
        // Simple regex phone capture
        const phone = text.match(/(?:\+88|88)?01[3-9]\d{8}/);
        if (phone) {
            await mockService.createLead({ full_name: sender, primary_phone: phone[0], source: LeadSource.FACEBOOK_MESSENGER });
            conv.is_lead_linked = true;
            conv.customer_phone = phone[0];
            setStorage('sae_messenger_convs', convs);
        }
    },

    // --- MISC BIG FISH METHODS ---
    checkRetainerRenewals: async (): Promise<BigFish[]> => {
        const fish = await mockService.getBigFish();
        const now = new Date();
        const nextWeek = new Date(); nextWeek.setDate(now.getDate() + 7);
        return fish.filter(f => f.is_retainer && f.retainer_renewal_date && new Date(f.retainer_renewal_date) <= nextWeek);
    },

    renewRetainer: async (id: string): Promise<void> => {
        const fish = await mockService.getBigFishById(id);
        if (fish && fish.retainer_renewal_date) {
            const next = new Date(fish.retainer_renewal_date);
            next.setDate(next.getDate() + 30);
            await mockService.updateBigFish(id, { retainer_renewal_date: next.toISOString() });
        }
    },

    checkExpiringCampaigns: async (): Promise<BigFish[]> => {
        const fish = await mockService.getBigFish();
        const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
        return fish.filter(f => f.campaign_end_date && new Date(f.campaign_end_date) <= tomorrow);
    },

    getIndustries: async (): Promise<string[]> => {
        return getStorage<string[]>('sae_industries', INDUSTRIES);
    },

    addIndustry: async (name: string): Promise<void> => {
        const industries = await mockService.getIndustries();
        if (!industries.includes(name)) setStorage('sae_industries', [...industries, name]);
    },

    deleteIndustry: async (name: string): Promise<void> => {
        const industries = await mockService.getIndustries();
        setStorage('sae_industries', industries.filter(i => i !== name));
    },

    getPaymentMethods: async (): Promise<PaymentMethod[]> => {
        return getStorage<PaymentMethod[]>('sae_payment_methods', []);
    }
};
