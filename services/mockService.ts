
import { 
  Lead, LeadStatus, LeadSource, Interaction, MessageTemplate, Campaign, 
  SimpleAutomationRule, LeadForm, Customer, Task, Invoice, Snippet, 
  Document, BigFish, PaymentMethod, MessengerConversation, SystemSettings,
  MonthlyTarget, SalesEntry, AdInspiration, ClientInteraction, Transaction,
  CampaignRecord, TopUpRequest, Channel, MessageDirection
} from '../types';
import { 
  INITIAL_TEMPLATES, INITIAL_LEAD_FORMS, INITIAL_SNIPPETS, INDUSTRIES, DEMO_LEADS, DEMO_BIG_FISH 
} from '../constants';

const uuid = () => Math.random().toString(36).substr(2, 9);

const API_BASE = './api'; 

const getStorage = <T>(key: string, defaultVal: T): T => {
    const stored = localStorage.getItem(key);
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

const safeJSONParse = (data: any, fallback: any = {}) => {
    if (!data) return fallback;
    if (typeof data === 'object') return data;
    try {
        return JSON.parse(data);
    } catch (e) {
        return fallback;
    }
};

const FULL_DEMO_LEADS: Lead[] = DEMO_LEADS.map(l => ({ ...l, download_count: 0 }));
const FULL_TEMPLATES: MessageTemplate[] = INITIAL_TEMPLATES.map(t => ({ ...t, id: uuid() }));
const FULL_SNIPPETS: Snippet[] = INITIAL_SNIPPETS.map(s => ({ ...s, id: uuid() }));

export const mockService = {
    // --- LEAD METHODS ---
    getLeads: async (): Promise<Lead[]> => {
        try {
            const res = await fetch(`${API_BASE}/leads.php?action=get_leads&_t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    const parsedData = data.map((l: any) => ({
                        ...l,
                        onboarding_data: typeof l.onboarding_data === 'string' ? safeJSONParse(l.onboarding_data) : l.onboarding_data
                    }));
                    setStorage('leads', parsedData);
                    return parsedData;
                }
            }
        } catch (e) { }
        return getStorage<Lead[]>('leads', FULL_DEMO_LEADS);
    },
    
    getLeadById: async (id: string): Promise<Lead | undefined> => {
        const leads = await mockService.getLeads();
        return leads.find(l => l.id === id);
    },
    
    createLead: async (lead: Partial<Lead>): Promise<Lead> => {
        const leads = await mockService.getLeads();
        let existingLeadIndex = -1;
        if (lead.primary_phone) {
            const cleanNewPhone = lead.primary_phone.replace(/\D/g, '');
            existingLeadIndex = leads.findIndex(l => l.primary_phone.replace(/\D/g, '') === cleanNewPhone);
        }
            
        if (existingLeadIndex !== -1) {
            const existingLead = leads[existingLeadIndex];
            const updatedLead = { ...existingLead, ...lead, id: existingLead.id };
            try {
                await fetch(`${API_BASE}/leads.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'update_lead_info', ...updatedLead })
                });
            } catch (e) { }
            return updatedLead;
        }

        const newLead: Lead = {
            id: uuid(),
            full_name: lead.full_name || 'Unknown',
            primary_phone: lead.primary_phone || '',
            source: lead.source || LeadSource.MANUAL,
            status: lead.status || LeadStatus.NEW,
            is_starred: false,
            is_unread: true,
            total_messages_sent: 0,
            download_count: 0,
            created_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
            interactions: [],
            ...lead
        } as Lead;

        try {
            await fetch(`${API_BASE}/leads.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create_lead', ...newLead })
            });
        } catch (e) { }
        
        const updatedLeads = [newLead, ...leads];
        setStorage('leads', updatedLeads);
        return newLead;
    },

    updateLead: async (id: string, updates: Partial<Lead>) => {
        const leads = await mockService.getLeads();
        const updatedLeads = leads.map(l => l.id === id ? { ...l, ...updates } : l);
        setStorage('leads', updatedLeads);
        try {
            await fetch(`${API_BASE}/leads.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_lead_info', id, ...updates })
            });
        } catch (e) { }
    },

    updateLeadStatus: async (id: string, status: LeadStatus) => {
        return mockService.updateLead(id, { status });
    },

    updateLeadIndustry: async (id: string, industry: string) => {
        return mockService.updateLead(id, { industry });
    },

    toggleLeadStar: async (id: string) => {
        const lead = await mockService.getLeadById(id);
        if (lead) return mockService.updateLead(id, { is_starred: !lead.is_starred });
    },

    updateLeadNote: async (id: string, note: string) => {
        return mockService.updateLead(id, { quick_note: note });
    },

    incrementDownloadCount: async (ids: string[]) => {
        const leads = await mockService.getLeads();
        const updated = leads.map(l => ids.includes(l.id) ? { ...l, download_count: (l.download_count || 0) + 1 } : l);
        setStorage('leads', updated);
    },

    // --- BIG FISH (VIP) METHODS - NOW CONNECTED TO API ---
    getBigFish: async (): Promise<BigFish[]> => { 
        try {
            const res = await fetch(`${API_BASE}/big_fish.php?action=get_all&_t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    const parsedData = data.map((f: any) => ({
                        ...f,
                        transactions: typeof f.transactions === 'string' ? safeJSONParse(f.transactions, []) : (f.transactions || []),
                        campaign_records: typeof f.campaign_records === 'string' ? safeJSONParse(f.campaign_records, []) : (f.campaign_records || []),
                        topup_requests: typeof f.topup_requests === 'string' ? safeJSONParse(f.topup_requests, []) : (f.topup_requests || []),
                        growth_tasks: typeof f.growth_tasks === 'string' ? safeJSONParse(f.growth_tasks, []) : (f.growth_tasks || []),
                        reports: typeof f.reports === 'string' ? safeJSONParse(f.reports, []) : (f.reports || []),
                        interactions: typeof f.interactions === 'string' ? safeJSONParse(f.interactions, []) : (f.interactions || []),
                        portal_config: typeof f.portal_config === 'string' ? safeJSONParse(f.portal_config, {}) : (f.portal_config || {})
                    }));
                    setStorage('big_fish', parsedData);
                    return parsedData;
                }
            }
        } catch (e) { }
        return getStorage<BigFish[]>('big_fish', DEMO_BIG_FISH); 
    },
    
    getBigFishById: async (id: string): Promise<BigFish | undefined> => { 
        const fish = await mockService.getBigFish(); 
        return fish.find(f => f.id === id); 
    },

    createBigFish: async (data: Partial<BigFish>) => { 
        const newFish: BigFish = { 
            id: uuid(), 
            lead_id: data.lead_id || uuid(), 
            name: data.name!, 
            phone: data.phone!, 
            status: 'Active Pool', 
            package_name: data.package_name, 
            balance: 0, 
            spent_amount: 0, 
            target_sales: 0, 
            current_sales: 0, 
            transactions: [], 
            campaign_records: [], 
            topup_requests: [], 
            growth_tasks: [], 
            reports: [], 
            interactions: [], 
            low_balance_alert_threshold: 20,
            total_budget: 0,
            portal_config: { 
                show_balance: true, 
                show_history: true, 
                is_suspended: false, 
                feature_flags: { show_profit_analysis: true, show_cpr_metrics: true, allow_topup_request: true } 
            }, 
            start_date: new Date().toISOString() 
        }; 
        try {
            await fetch(`${API_BASE}/big_fish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', ...newFish })
            });
        } catch (e) { }
        const fishList = await mockService.getBigFish();
        setStorage('big_fish', [newFish, ...fishList]);
        return newFish;
    },

    catchBigFish: async (leadId: string): Promise<boolean> => { 
        const lead = await mockService.getLeadById(leadId); 
        if (!lead) return false; 
        const fish = await mockService.getBigFish(); 
        if (fish.some(f => f.lead_id === leadId)) return false; 
        await mockService.createBigFish({ lead_id: leadId, name: lead.full_name, phone: lead.primary_phone, package_name: lead.service_category });
        return true; 
    },

    updateBigFish: async (id: string, updates: Partial<BigFish>) => { 
        const fishList = await mockService.getBigFish();
        const updatedFishList = fishList.map(f => f.id === id ? { ...f, ...updates } : f);
        setStorage('big_fish', updatedFishList);
        try {
            await fetch(`${API_BASE}/big_fish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update', id, ...updates })
            });
        } catch (e) { }
    },

    toggleBigFishStatus: async (id: string) => { 
        const fish = await mockService.getBigFishById(id);
        if (fish) {
            const newStatus = fish.status === 'Active Pool' ? 'Hall of Fame' : 'Active Pool';
            await mockService.updateBigFish(id, { status: newStatus, end_date: newStatus === 'Hall of Fame' ? new Date().toISOString() : undefined });
        }
    },

    addTransaction: async (fishId: string, type: Transaction['type'], amount: number, desc: string, metadata?: any, dateOverride?: string): Promise<BigFish | undefined> => { 
        const fish = await mockService.getBigFishById(fishId);
        if (fish) {
            const tx: Transaction = { id: uuid(), date: dateOverride || new Date().toISOString(), type, amount, description: desc, metadata }; 
            const newTransactions = [tx, ...fish.transactions];
            let newBalance = parseFloat(fish.balance as any) || 0;
            if (type === 'DEPOSIT') newBalance += amount; else newBalance -= amount;
            
            let newSpent = parseFloat(fish.spent_amount as any) || 0;
            if (type === 'AD_SPEND') newSpent += amount;

            const updates: Partial<BigFish> = { 
                transactions: newTransactions, 
                balance: newBalance, 
                spent_amount: newSpent 
            };
            await mockService.updateBigFish(fishId, updates);
            return { ...fish, ...updates };
        }
        return undefined;
    },

    updateTransaction: async (fishId: string, txId: string, updates: Partial<Transaction>) => {
        const fish = await mockService.getBigFishById(fishId);
        if (fish) {
            const newTransactions = fish.transactions.map(t => t.id === txId ? { ...t, ...updates } : t);
            // Recalculate balance for simplicity in mock
            let balance = 0;
            let spent = 0;
            newTransactions.forEach(t => {
                if (t.type === 'DEPOSIT') balance += t.amount;
                else balance -= t.amount;
                if (t.type === 'AD_SPEND') spent += t.amount;
            });
            await mockService.updateBigFish(fishId, { transactions: newTransactions, balance, spent_amount: spent });
        }
    },

    deleteTransaction: async (fishId: string, txId: string) => { 
        const fish = await mockService.getBigFishById(fishId);
        if (fish) {
            const tx = fish.transactions.find(t => t.id === txId);
            if (tx) {
                let newBalance = parseFloat(fish.balance as any) || 0;
                if (tx.type === 'DEPOSIT') newBalance -= tx.amount; else newBalance += tx.amount;
                let newSpent = parseFloat(fish.spent_amount as any) || 0;
                if (tx.type === 'AD_SPEND') newSpent -= tx.amount;
                await mockService.updateBigFish(fishId, {
                    transactions: fish.transactions.filter(t => t.id !== txId),
                    balance: newBalance,
                    spent_amount: newSpent
                });
            }
        }
    },

    addCampaignRecord: async (fishId: string, record: Omit<CampaignRecord, 'id' | 'created_at'>): Promise<BigFish | undefined> => { 
        const fish = await mockService.getBigFishById(fishId);
        /* FIXED: Changed 'f' to 'fish' on line 277 as per error report */
        if (fish) {
            const newRecord: CampaignRecord = { id: uuid(), created_at: new Date().toISOString(), ...record }; 
            const records = [newRecord, ...(fish.campaign_records || [])];
            const spend = parseFloat(record.amount_spent as any) || 0;
            const newBalance = (parseFloat(fish.balance as any) || 0) - spend;
            const newSpent = (parseFloat(fish.spent_amount as any) || 0) + spend;
            const updates: Partial<BigFish> = { campaign_records: records, balance: newBalance, spent_amount: newSpent };
            if (record.result_type === 'SALES') updates.current_sales = (fish.current_sales || 0) + (record.results_count || 0);
            await mockService.updateBigFish(fishId, updates);
            return { ...fish, ...updates };
        }
        return undefined;
    },

    deleteCampaignRecord: async (fishId: string, recordId: string) => {
        const fish = await mockService.getBigFishById(fishId);
        if (fish && fish.campaign_records) {
            const record = fish.campaign_records.find(r => r.id === recordId);
            if (record) {
                const spend = record.amount_spent;
                const newRecords = fish.campaign_records.filter(r => r.id !== recordId);
                const updates: Partial<BigFish> = {
                    campaign_records: newRecords,
                    balance: (fish.balance || 0) + spend,
                    spent_amount: (fish.spent_amount || 0) - spend
                };
                if (record.result_type === 'SALES') updates.current_sales = (fish.current_sales || 0) - record.results_count;
                await mockService.updateBigFish(fishId, updates);
            }
        }
    },

    approveTopUpRequest: async (fishId: string, requestId: string) => {
        const fish = await mockService.getBigFishById(fishId);
        if (fish && fish.topup_requests) {
            const req = fish.topup_requests.find(r => r.id === requestId);
            if (req && req.status === 'PENDING') {
                const newRequests = fish.topup_requests.map(r => r.id === requestId ? { ...r, status: 'APPROVED' } : r) as TopUpRequest[];
                await mockService.addTransaction(fishId, 'DEPOSIT', req.amount, `Top-up Approved: ${req.method_name}`);
                await mockService.updateBigFish(fishId, { topup_requests: newRequests });
            }
        }
    },

    rejectTopUpRequest: async (fishId: string, requestId: string) => {
        const fish = await mockService.getBigFishById(fishId);
        if (fish && fish.topup_requests) {
            const newRequests = fish.topup_requests.map(r => r.id === requestId ? { ...r, status: 'REJECTED' } : r) as TopUpRequest[];
            await mockService.updateBigFish(fishId, { topup_requests: newRequests });
        }
    },

    deleteTopUpRequest: async (fishId: string, requestId: string) => {
        const fish = await mockService.getBigFishById(fishId);
        if (fish && fish.topup_requests) {
            const newRequests = fish.topup_requests.filter(r => r.id !== requestId);
            await mockService.updateBigFish(fishId, { topup_requests: newRequests });
        }
    },

    createTopUpRequest: async (req: Omit<TopUpRequest, 'id' | 'created_at' | 'status'>) => {
        const fish = await mockService.getBigFishById(req.client_id);
        if (fish) {
            const newReq: TopUpRequest = { ...req, id: uuid(), created_at: new Date().toISOString(), status: 'PENDING' };
            const requests = [newReq, ...(fish.topup_requests || [])];
            await mockService.updateBigFish(req.client_id, { topup_requests: requests });
        }
    },

    addGrowthTask: async (fishId: string, title: string, dueDate?: string) => {
        const fish = await mockService.getBigFishById(fishId);
        if (fish) {
            const newTask = { id: uuid(), title, is_completed: false, due_date: dueDate };
            const tasks = [newTask, ...(fish.growth_tasks || [])];
            await mockService.updateBigFish(fishId, { growth_tasks: tasks });
        }
    },

    toggleGrowthTask: async (fishId: string, taskId: string) => {
        const fish = await mockService.getBigFishById(fishId);
        if (fish && fish.growth_tasks) {
            const tasks = fish.growth_tasks.map(t => t.id === taskId ? { ...t, is_completed: !t.is_completed } : t);
            await mockService.updateBigFish(fishId, { growth_tasks: tasks });
        }
    },

    updateTargets: async (fishId: string, target: number, current: number) => {
        await mockService.updateBigFish(fishId, { target_sales: target, current_sales: current });
    },

    checkRetainerRenewals: async (): Promise<BigFish[]> => {
        const fish = await mockService.getBigFish();
        const now = new Date();
        const next7Days = new Date();
        next7Days.setDate(now.getDate() + 7);
        return fish.filter(f => f.is_retainer && f.retainer_renewal_date && new Date(f.retainer_renewal_date) <= next7Days);
    },

    renewRetainer: async (id: string) => {
        const fish = await mockService.getBigFishById(id);
        if (fish && fish.retainer_renewal_date) {
            const current = new Date(fish.retainer_renewal_date);
            current.setDate(current.getDate() + 30);
            await mockService.updateBigFish(id, { retainer_renewal_date: current.toISOString() });
        }
    },

    checkExpiringCampaigns: async (): Promise<BigFish[]> => {
        const fish = await mockService.getBigFish();
        const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().slice(0, 10);
        return fish.filter(f => f.campaign_end_date === tomorrowStr);
    },

    // --- OTHER PERSISTENT METHODS ---
    getSystemSettings: async (): Promise<SystemSettings> => { 
        try {
            const res = await fetch(`${API_BASE}/settings.php?action=get`);
            if (res.ok) return await res.json();
        } catch (e) {}
        return getStorage<SystemSettings>('system_settings', { facebook_page_token: '', facebook_verify_token: '', sms_api_key: '', sms_sender_id: '', sms_base_url: '', timezone: 'Asia/Dhaka' }); 
    },
    saveSystemSettings: async (s: SystemSettings) => { 
        try {
            await fetch(`${API_BASE}/settings.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'save', ...s })
            });
        } catch (e) {}
        setStorage('system_settings', s); 
    },

    getTasks: async (): Promise<Task[]> => { return getStorage<Task[]>('tasks', []); },
    createTask: async (text: string, dueDate?: string, leadId?: string) => { 
        const newTask = { id: uuid(), text, is_completed: false, created_at: new Date().toISOString(), due_date: dueDate, lead_id: leadId }; 
        const tasks = await mockService.getTasks(); tasks.push(newTask); setStorage('tasks', tasks); 
    },
    toggleTask: async (id: string) => { const tasks = await mockService.getTasks(); const t = tasks.find(x => x.id === id); if (t) { t.is_completed = !t.is_completed; setStorage('tasks', tasks); } },
    deleteTask: async (id: string) => { let tasks = await mockService.getTasks(); tasks = tasks.filter(t => t.id !== id); setStorage('tasks', tasks); },

    getInvoices: async (): Promise<Invoice[]> => { return getStorage<Invoice[]>('invoices', []); },
    createInvoice: async (inv: Partial<Invoice>) => { 
        const invoices = await mockService.getInvoices(); 
        const num = invoices.length + 1; 
        const newInv = { id: inv.id || uuid(), number: inv.number || `INV-${num.toString().padStart(4, '0')}`, client_name: inv.client_name!, client_phone: inv.client_phone, client_address: inv.client_address, items: inv.items || [], status: inv.status || 'new', date: inv.date || new Date().toISOString().slice(0, 10), created_at: new Date().toISOString(), paid_amount: inv.paid_amount || 0, terms_enabled: inv.terms_enabled !== false, terms_content: inv.terms_content }; 
        invoices.unshift(newInv as Invoice); setStorage('invoices', invoices); 
    },
    deleteInvoice: async (id: string) => { let invoices = await mockService.getInvoices(); invoices = invoices.filter(i => i.id !== id); setStorage('invoices', invoices); },

    // Customers
    getCustomers: async (): Promise<Customer[]> => getStorage<Customer[]>('customers', []),
    addBulkCustomers: async (phones: string[], category: string): Promise<number> => {
        const customers = await mockService.getCustomers();
        let added = 0;
        const newCustomers = [...customers];
        phones.forEach(p => {
            if (!customers.find(c => c.phone === p)) {
                newCustomers.push({ id: uuid(), phone: p, category, date_added: new Date().toISOString() });
                added++;
            }
        });
        setStorage('customers', newCustomers);
        return added;
    },
    deleteCustomer: async (id: string) => {
        const customers = await mockService.getCustomers();
        setStorage('customers', customers.filter(c => c.id !== id));
    },
    getCustomerCategories: async (): Promise<string[]> => getStorage('customer_categories', ['Dress', 'Bag', 'Shoes']),
    addCustomerCategory: async (name: string) => {
        const cats = await mockService.getCustomerCategories();
        if (!cats.includes(name)) setStorage('customer_categories', [...cats, name]);
    },
    deleteCustomerCategory: async (name: string) => {
        const cats = await mockService.getCustomerCategories();
        setStorage('customer_categories', cats.filter(c => c !== name));
    },

    // Sales Tracking
    getSalesEntries: async (): Promise<SalesEntry[]> => getStorage<SalesEntry[]>('sales_entries', []),
    addSalesEntry: async (entry: Omit<SalesEntry, 'id' | 'created_at'>) => {
        const entries = await mockService.getSalesEntries();
        const newEntry = { ...entry, id: uuid(), created_at: new Date().toISOString() };
        setStorage('sales_entries', [newEntry, ...entries]);
        return newEntry;
    },
    updateSalesEntry: async (id: string, updates: Partial<SalesEntry>) => {
        const entries = await mockService.getSalesEntries();
        setStorage('sales_entries', entries.map(e => e.id === id ? { ...e, ...updates } : e));
    },
    deleteSalesEntry: async (id: string) => {
        const entries = await mockService.getSalesEntries();
        setStorage('sales_entries', entries.filter(e => e.id !== id));
    },
    getSalesTargets: async (): Promise<MonthlyTarget[]> => getStorage<MonthlyTarget[]>('sales_targets', []),
    setSalesTarget: async (target: Omit<MonthlyTarget, 'id'>) => {
        const targets = await mockService.getSalesTargets();
        const existing = targets.find(t => t.month === target.month && t.service === target.service);
        if (existing) {
            setStorage('sales_targets', targets.map(t => t.id === existing.id ? { ...t, ...target } : t));
        } else {
            setStorage('sales_targets', [{ ...target, id: uuid() }, ...targets]);
        }
    },

    // Interactions
    getInteractions: async (leadId: string): Promise<ClientInteraction[]> => {
        const lead = await mockService.getLeadById(leadId);
        return lead?.interactions || [];
    },
    addLeadInteraction: async (leadId: string, interaction: Omit<ClientInteraction, 'id' | 'created_at'>) => {
        const lead = await mockService.getLeadById(leadId);
        if (lead) {
            const newInteraction = { ...interaction, id: uuid(), created_at: new Date().toISOString() };
            const interactions = [newInteraction, ...(lead.interactions || [])];
            await mockService.updateLead(leadId, { interactions });
        }
    },
    deleteLeadInteraction: async (leadId: string, interactionId: string) => {
        const lead = await mockService.getLeadById(leadId);
        if (lead && lead.interactions) {
            await mockService.updateLead(leadId, { interactions: lead.interactions.filter(i => i.id !== interactionId) });
        }
    },
    addClientInteraction: async (fishId: string, interaction: Omit<ClientInteraction, 'id' | 'created_at'>) => {
        const fish = await mockService.getBigFishById(fishId);
        if (fish) {
            const newInteraction = { ...interaction, id: uuid(), created_at: new Date().toISOString() };
            const interactions = [newInteraction, ...(fish.interactions || [])];
            await mockService.updateBigFish(fishId, { interactions });
        }
    },
    deleteClientInteraction: async (fishId: string, interactionId: string) => {
        const fish = await mockService.getBigFishById(fishId);
        if (fish && fish.interactions) {
            await mockService.updateBigFish(fishId, { interactions: fish.interactions.filter(i => i.id !== interactionId) });
        }
    },

    // Templates
    deleteTemplate: async (id: string) => {
        const list = await mockService.getTemplates();
        setStorage('templates', list.filter(t => t.id !== id));
    },
    updateTemplate: async (id: string, updates: Partial<MessageTemplate>) => {
        const list = await mockService.getTemplates();
        setStorage('templates', list.map(t => t.id === id ? { ...t, ...updates } : t));
    },
    createTemplate: async (template: Omit<MessageTemplate, 'id'>) => {
        const list = await mockService.getTemplates();
        const newT = { ...template, id: uuid() };
        setStorage('templates', [...list, newT]);
        return newT;
    },

    // Campaigns
    getCampaigns: async (): Promise<Campaign[]> => getStorage<Campaign[]>('campaigns', []),
    createCampaign: async (campaign: Omit<Campaign, 'id' | 'active_leads_count'>) => {
        const list = await mockService.getCampaigns();
        const newC = { ...campaign, id: uuid(), active_leads_count: 0 };
        setStorage('campaigns', [...list, newC]);
        return newC;
    },

    // Automation
    getSimpleAutomationRules: async (): Promise<SimpleAutomationRule[]> => getStorage<SimpleAutomationRule[]>('automation_rules', []),
    saveSimpleAutomationRule: async (status: LeadStatus, steps: any[]) => {
        const rules = await mockService.getSimpleAutomationRules();
        const existing = rules.find(r => r.status === status);
        if (existing) {
            setStorage('automation_rules', rules.map(r => r.id === existing.id ? { ...r, steps } : r));
        } else {
            setStorage('automation_rules', [{ id: uuid(), status, steps, is_active: true }, ...rules]);
        }
    },

    // Forms
    getForms: async (): Promise<LeadForm[]> => getStorage<LeadForm[]>('lead_forms', INITIAL_LEAD_FORMS),
    getFormById: async (id: string): Promise<LeadForm | undefined> => {
        const forms = await mockService.getForms();
        return forms.find(f => f.id === id);
    },
    createForm: async (form: Omit<LeadForm, 'id' | 'created_at'>) => {
        const forms = await mockService.getForms();
        const newF = { ...form, id: uuid(), created_at: new Date().toISOString() };
        setStorage('lead_forms', [newF, ...forms]);
        return newF;
    },
    updateForm: async (id: string, updates: Partial<LeadForm>) => {
        const forms = await mockService.getForms();
        setStorage('lead_forms', forms.map(f => f.id === id ? { ...f, ...updates } : f));
    },
    deleteForm: async (id: string) => {
        const forms = await mockService.getForms();
        setStorage('lead_forms', forms.filter(f => f.id !== id));
    },
    submitLeadForm: async (formId: string, data: any) => {
        const onboarding: any = {};
        if (data.current_plan) onboarding.current_plan = data.current_plan;
        if (data.monthly_avg_budget) onboarding.monthly_avg_budget = data.monthly_avg_budget;
        if (data.product_price) onboarding.product_price = data.product_price;
        if (data.marketing_budget_willingness) onboarding.marketing_budget_willingness = data.marketing_budget_willingness;

        await mockService.createLead({
            full_name: data.name,
            primary_phone: data.phone,
            facebook_profile_link: data.facebook,
            website_url: data.website,
            industry: data.industry,
            source: LeadSource.FORM,
            onboarding_data: Object.keys(onboarding).length > 0 ? onboarding : undefined,
            service_category: data.form_type === 'ONBOARDING' ? 'Sales Guarantee' : undefined
        });
    },

    // Snippets
    createSnippet: async (snippet: Omit<Snippet, 'id'>) => {
        const list = await mockService.getSnippets();
        const newS = { ...snippet, id: uuid() };
        setStorage('snippets', [...list, newS]);
        return newS;
    },
    updateSnippet: async (id: string, updates: Partial<Snippet>) => {
        const list = await mockService.getSnippets();
        setStorage('snippets', list.map(s => s.id === id ? { ...s, ...updates } : s));
    },
    deleteSnippet: async (id: string) => {
        const list = await mockService.getSnippets();
        setStorage('snippets', list.filter(s => s.id !== id));
    },

    // Documents
    getDocuments: async (): Promise<Document[]> => getStorage<Document[]>('documents', []),
    saveDocument: async (doc: Omit<Document, 'id' | 'created_at'>) => {
        const docs = await mockService.getDocuments();
        const newD = { ...doc, id: uuid(), created_at: new Date().toISOString() };
        setStorage('documents', [newD, ...docs]);
        return newD;
    },
    deleteDocument: async (id: string) => {
        const docs = await mockService.getDocuments();
        setStorage('documents', docs.filter(d => d.id !== id));
    },

    // Payment Methods
    getPaymentMethods: async (): Promise<PaymentMethod[]> => getStorage<PaymentMethod[]>('payment_methods', []),

    // Messenger
    getMessengerConversations: async (): Promise<MessengerConversation[]> => getStorage<MessengerConversation[]>('messenger_conversations', []),
    simulateIncomingMessage: async (text: string, senderName: string) => {
        const convs = await mockService.getMessengerConversations();
        let conv = convs.find(c => c.customer_name === senderName);
        const now = new Date().toISOString();
        const phone = text.match(/(?:\+88|88)?01[3-9]\d{8}/)?.[0];

        if (conv) {
            conv.messages.push({ id: uuid(), sender: 'customer', type: 'text', content: text, timestamp: now });
            conv.last_message = text;
            conv.last_updated = now;
            if (phone) conv.customer_phone = phone;
        } else {
            conv = {
                id: uuid(),
                facebook_user_id: uuid(),
                customer_name: senderName,
                customer_phone: phone,
                messages: [{ id: uuid(), sender: 'customer', type: 'text', content: text, timestamp: now }],
                last_message: text,
                last_updated: now,
                is_lead_linked: !!phone
            };
            convs.push(conv);
        }
        setStorage('messenger_conversations', convs);
        if (phone) await mockService.createLead({ full_name: senderName, primary_phone: phone, source: LeadSource.FACEBOOK_MESSENGER });
    },

    // Ad Inspiration
    getAdInspirations: async (): Promise<AdInspiration[]> => getStorage<AdInspiration[]>('ad_inspirations', []),
    addAdInspiration: async (ad: Omit<AdInspiration, 'id' | 'created_at'>): Promise<AdInspiration> => {
        const list = await mockService.getAdInspirations();
        const newAd = { ...ad, id: uuid(), created_at: new Date().toISOString() };
        setStorage('ad_inspirations', [newAd, ...list]);
        return newAd;
    },
    deleteAdInspiration: async (id: string) => {
        const list = await mockService.getAdInspirations();
        setStorage('ad_inspirations', list.filter(a => a.id !== id));
    },

    // Fallback constants methods
    getIndustries: async (): Promise<string[]> => { return getStorage<string[]>('industries', INDUSTRIES); },
    addIndustry: async (name: string) => { const list = await mockService.getIndustries(); if(!list.includes(name)) { list.push(name); setStorage('industries', list); } },
    deleteIndustry: async (name: string) => { const list = await mockService.getIndustries(); setStorage('industries', list.filter(i => i !== name)); },
    getTemplates: async (): Promise<MessageTemplate[]> => { return getStorage<MessageTemplate[]>('templates', FULL_TEMPLATES); },
    getSnippets: async (): Promise<Snippet[]> => { return getStorage<Snippet[]>('snippets', FULL_SNIPPETS); },
    
    // Automation simulation
    triggerAutomationCheck: async () => { return true; },
    scheduleBulkMessages: async (ids: string[], msgs: any[]) => { return true; },
    sendBulkSMS: async (ids: string[], body: string) => { return true; },
    resolvePhoneNumbersToIds: async (phones: string[]): Promise<string[]> => { 
        const ids = [];
        for (const p of phones) {
            const l = await mockService.createLead({ primary_phone: p });
            ids.push(l.id);
        }
        return ids;
    }
};
