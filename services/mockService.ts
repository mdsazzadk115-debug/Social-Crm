
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

const uuid = () => Math.random().toString(36).substr(2, 9);

const getStorage = <T>(key: string, defaultValue: T): T => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
};

const setStorage = <T>(key: string, data: T): void => {
    localStorage.setItem(key, JSON.stringify(data));
};

const safeFetch = async (url: string, options?: RequestInit) => {
    const res = await fetch(url, options);
    const text = await res.text();
    if (!res.ok) throw new Error(`Server Error (${res.status}): ${text.substring(0, 100)}`);
    if (!text || text.trim() === "") return null;
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse JSON response:", text);
        throw new Error("Invalid JSON response from server");
    }
};

export const mockService = {
    // --- LEADS ---
    getLeads: async (): Promise<Lead[]> => {
        try {
            const data = await safeFetch(`${API_BASE}/leads.php`);
            if (Array.isArray(data)) return data;
        } catch (e) {}
        return getStorage<Lead[]>('sae_leads', DEMO_LEADS as Lead[]);
    },

    getLeadById: async (id: string): Promise<Lead | undefined> => {
        const leads = await mockService.getLeads();
        return leads.find(l => l.id === id);
    },

    createLead: async (lead: Partial<Lead>): Promise<void> => {
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
            interactions: [],
            ...lead
        } as Lead;
        const leads = getStorage<Lead[]>('sae_leads', DEMO_LEADS as Lead[]);
        setStorage('sae_leads', [newLead, ...leads]);
    },

    updateLead: async (id: string, updates: Partial<Lead>): Promise<void> => {
        const leads = getStorage<Lead[]>('sae_leads', DEMO_LEADS as Lead[]);
        const updated = leads.map(l => l.id === id ? { ...l, ...updates, last_activity_at: new Date().toISOString() } : l);
        setStorage('sae_leads', updated);
    },

    updateLeadStatus: async (id: string, status: LeadStatus): Promise<void> => {
        await mockService.updateLead(id, { status });
    },

    updateLeadIndustry: async (id: string, industry: string): Promise<void> => {
        await mockService.updateLead(id, { industry });
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
            const data = await safeFetch(`${API_BASE}/big_fish.php`);
            if (Array.isArray(data)) return data;
        } catch (e) {}
        return getStorage<BigFish[]>('sae_big_fish', DEMO_BIG_FISH);
    },

    getBigFishById: async (id: string): Promise<BigFish | undefined> => {
        const allFish = await mockService.getBigFish();
        return allFish.find(f => f.id === id);
    },

    createBigFish: async (fish: Partial<BigFish>): Promise<void> => {
        const allFish = getStorage<BigFish[]>('sae_big_fish', DEMO_BIG_FISH);
        const newFish = { 
            id: uuid(), 
            balance: 0, 
            spent_amount: 0, 
            target_sales: 0, 
            current_sales: 0, 
            transactions: [], 
            campaign_records: [], 
            growth_tasks: [], 
            reports: [], 
            start_date: new Date().toISOString(),
            portal_config: {
                show_balance: true,
                show_history: true,
                is_suspended: false,
                feature_flags: {
                    show_profit_analysis: true,
                    show_cpr_metrics: true,
                    allow_topup_request: true,
                    show_message_report: true,
                    show_sales_report: true,
                    show_profit_loss_report: false,
                    show_payment_methods: true
                }
            },
            ...fish 
        } as BigFish;
        setStorage('sae_big_fish', [newFish, ...allFish]);
    },

    updateBigFish: async (id: string, updates: Partial<BigFish>): Promise<void> => {
        const allFish = getStorage<BigFish[]>('sae_big_fish', DEMO_BIG_FISH);
        const updated = allFish.map(f => f.id === id ? { ...f, ...updates } : f);
        setStorage('sae_big_fish', updated);
    },

    catchBigFish: async (leadId: string): Promise<BigFish | null> => {
        const leads = await mockService.getLeads();
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return null;
        const allFish = await mockService.getBigFish();
        if (allFish.some(f => f.lead_id === leadId)) return null;
        const newFish: Partial<BigFish> = {
            id: uuid(),
            lead_id: lead.id,
            name: lead.full_name,
            phone: lead.primary_phone,
            status: 'Active Pool',
            balance: 0,
            spent_amount: 0,
            target_sales: 0,
            current_sales: 0,
            transactions: [],
            campaign_records: [],
            growth_tasks: [],
            reports: [],
            start_date: new Date().toISOString()
        };
        await mockService.createBigFish(newFish);
        await mockService.updateLeadStatus(leadId, LeadStatus.CLOSED_WON);
        return newFish as BigFish;
    },

    toggleBigFishStatus: async (id: string): Promise<void> => {
        const fish = await mockService.getBigFishById(id);
        if (fish) await mockService.updateBigFish(id, { status: fish.status === 'Active Pool' ? 'Hall of Fame' : 'Active Pool' });
    },

    // --- TRANSACTIONS & PERFORMANCE ---
    addTransaction: async (fishId: string, type: 'DEPOSIT' | 'DEDUCT' | 'AD_SPEND' | 'SERVICE_CHARGE', amount: number, description: string): Promise<void> => {
        const allFish = getStorage<BigFish[]>('sae_big_fish', DEMO_BIG_FISH);
        const newTx: Transaction = { id: uuid(), date: new Date().toISOString(), type, amount, description };
        const updated = allFish.map(f => {
            if (f.id === fishId) {
                const newBalance = type === 'DEPOSIT' ? (f.balance + amount) : (f.balance - amount);
                const newSpent = type === 'AD_SPEND' ? (f.spent_amount + amount) : f.spent_amount;
                return { ...f, balance: newBalance, spent_amount: newSpent, transactions: [newTx, ...(f.transactions || [])] };
            }
            return f;
        });
        setStorage('sae_big_fish', updated);
    },

    updateTransaction: async (fishId: string, txId: string, updates: Partial<Transaction>): Promise<void> => {
        const allFish = getStorage<BigFish[]>('sae_big_fish', DEMO_BIG_FISH);
        const updated = allFish.map(f => {
            if(f.id === fishId) {
                return { ...f, transactions: f.transactions.map(t => t.id === txId ? { ...t, ...updates } : t) };
            }
            return f;
        });
        setStorage('sae_big_fish', updated);
    },

    deleteTransaction: async (fishId: string, txId: string): Promise<void> => {
        const allFish = getStorage<BigFish[]>('sae_big_fish', DEMO_BIG_FISH);
        const updated = allFish.map(f => {
            if(f.id === fishId) {
                return { ...f, transactions: f.transactions.filter(t => t.id !== txId) };
            }
            return f;
        });
        setStorage('sae_big_fish', updated);
    },

    addCampaignRecord: async (fishId: string, record: Omit<CampaignRecord, 'id' | 'created_at'>): Promise<BigFish | undefined> => { 
        const allFish = getStorage<BigFish[]>('sae_big_fish', DEMO_BIG_FISH);
        const newRec = { ...record, id: uuid(), created_at: new Date().toISOString() };
        const updated = allFish.map(f => {
            if(f.id === fishId) {
                return { ...f, campaign_records: [newRec, ...(f.campaign_records || [])] };
            }
            return f;
        });
        setStorage('sae_big_fish', updated);
        await mockService.addTransaction(fishId, 'AD_SPEND', record.amount_spent, `Ad Campaign: ${new Date(record.start_date).toLocaleDateString()}`);
        return await mockService.getBigFishById(fishId);
    },

    deleteCampaignRecord: async (fishId: string, recordId: string): Promise<void> => {
        const allFish = getStorage<BigFish[]>('sae_big_fish', DEMO_BIG_FISH);
        const updated = allFish.map(f => {
            if(f.id === fishId) {
                return { ...f, campaign_records: f.campaign_records?.filter(r => r.id !== recordId) };
            }
            return f;
        });
        setStorage('sae_big_fish', updated);
    },

    // --- TOP UP REQUESTS ---
    createTopUpRequest: async (req: Omit<TopUpRequest, 'id' | 'status' | 'created_at'>): Promise<void> => {
        const requests = getStorage<TopUpRequest[]>('sae_topup_requests', []);
        const newReq: TopUpRequest = { ...req, id: uuid(), status: 'PENDING', created_at: new Date().toISOString() };
        setStorage('sae_topup_requests', [newReq, ...requests]);
    },

    approveTopUpRequest: async (fishId: string, reqId: string): Promise<void> => {
        const requests = getStorage<TopUpRequest[]>('sae_topup_requests', []);
        const req = requests.find(r => r.id === reqId);
        if(req) {
            await mockService.addTransaction(fishId, 'DEPOSIT', req.amount, `Top-up Approved: ${req.method_name}`);
            setStorage('sae_topup_requests', requests.map(r => r.id === reqId ? { ...r, status: 'APPROVED' } : r));
        }
    },

    rejectTopUpRequest: async (fishId: string, reqId: string): Promise<void> => {
        const requests = getStorage<TopUpRequest[]>('sae_topup_requests', []);
        setStorage('sae_topup_requests', requests.map(r => r.id === reqId ? { ...r, status: 'REJECTED' } : r));
    },

    deleteTopUpRequest: async (fishId: string, reqId: string): Promise<void> => {
        const requests = getStorage<TopUpRequest[]>('sae_topup_requests', []);
        setStorage('sae_topup_requests', requests.filter(r => r.id !== reqId));
    },

    // --- GROWTH TASKS ---
    addGrowthTask: async (fishId: string, title: string, dueDate?: string): Promise<void> => {
        const allFish = getStorage<BigFish[]>('sae_big_fish', DEMO_BIG_FISH);
        const newTask = { id: uuid(), title, is_completed: false, due_date: dueDate };
        setStorage('sae_big_fish', allFish.map(f => f.id === fishId ? { ...f, growth_tasks: [...f.growth_tasks, newTask] } : f));
    },

    toggleGrowthTask: async (fishId: string, taskId: string): Promise<void> => {
        const allFish = getStorage<BigFish[]>('sae_big_fish', DEMO_BIG_FISH);
        setStorage('sae_big_fish', allFish.map(f => f.id === fishId ? { ...f, growth_tasks: f.growth_tasks.map(t => t.id === taskId ? { ...t, is_completed: !t.is_completed } : t) } : f));
    },

    updateTargets: async (fishId: string, target: number, current: number): Promise<void> => {
        await mockService.updateBigFish(fishId, { target_sales: target, current_sales: current });
    },

    // --- PAYMENT METHODS (ADMIN CONTROL) ---
    getPaymentMethods: async (): Promise<PaymentMethod[]> => {
        return getStorage<PaymentMethod[]>('sae_payment_methods', [
            { id: 'pm_bkash', type: 'MOBILE', provider_name: 'bKash', account_number: '01798205143', mobile_type: 'Personal', instruction: 'Send Money' },
            { id: 'pm_nagad', type: 'MOBILE', provider_name: 'Nagad', account_number: '01798205143', mobile_type: 'Personal', instruction: 'Send Money' }
        ]);
    },

    addPaymentMethod: async (pm: Omit<PaymentMethod, 'id'>): Promise<void> => {
        const methods = await mockService.getPaymentMethods();
        const newMethod = { ...pm, id: uuid() };
        setStorage('sae_payment_methods', [...methods, newMethod]);
    },

    updatePaymentMethod: async (id: string, updates: Partial<PaymentMethod>): Promise<void> => {
        const methods = await mockService.getPaymentMethods();
        setStorage('sae_payment_methods', methods.map(m => m.id === id ? { ...m, ...updates } : m));
    },

    deletePaymentMethod: async (id: string): Promise<void> => {
        const methods = await mockService.getPaymentMethods();
        setStorage('sae_payment_methods', methods.filter(m => m.id !== id));
    },

    // --- CRM / INTERACTIONS ---
    addClientInteraction: async (fishId: string, interaction: Partial<ClientInteraction>): Promise<void> => {
        const allFish = getStorage<BigFish[]>('sae_big_fish', DEMO_BIG_FISH);
        const newInt: ClientInteraction = { 
            id: uuid(), 
            date: interaction.date || new Date().toISOString(), 
            type: interaction.type || 'OTHER', 
            notes: interaction.notes || '', 
            next_follow_up: interaction.next_follow_up, 
            created_at: new Date().toISOString() 
        };
        setStorage('sae_big_fish', allFish.map(f => f.id === fishId ? { ...f, interactions: [newInt, ...(f.interactions || [])] } : f));
    },

    // Fix for missing getInteractions used in LeadDetail.tsx
    getInteractions: async (leadId: string): Promise<ClientInteraction[]> => {
        const lead = await mockService.getLeadById(leadId);
        return lead?.interactions || [];
    },

    // Fix for missing addLeadInteraction used in WonLeads.tsx
    addLeadInteraction: async (leadId: string, interaction: Partial<ClientInteraction>): Promise<void> => {
        const leads = getStorage<Lead[]>('sae_leads', DEMO_LEADS as Lead[]);
        const newInt: ClientInteraction = { 
            id: uuid(), 
            date: interaction.date || new Date().toISOString(), 
            type: interaction.type || 'OTHER', 
            notes: interaction.notes || '', 
            next_follow_up: interaction.next_follow_up, 
            created_at: new Date().toISOString() 
        };
        const updated = leads.map(l => l.id === leadId ? { ...l, interactions: [newInt, ...(l.interactions || [])] } : l);
        setStorage('sae_leads', updated);
    },

    // Fix for missing deleteLeadInteraction used in WonLeads.tsx
    deleteLeadInteraction: async (leadId: string, interactionId: string): Promise<void> => {
        const leads = getStorage<Lead[]>('sae_leads', DEMO_LEADS as Lead[]);
        const updated = leads.map(l => l.id === leadId ? { ...l, interactions: (l.interactions || []).filter(i => i.id !== interactionId) } : l);
        setStorage('sae_leads', updated);
    },

    // --- GENERAL TASKS ---
    getTasks: async (): Promise<Task[]> => getStorage<Task[]>('sae_tasks', []),
    createTask: async (text: string, dueDate?: string, leadId?: string): Promise<void> => {
        const tasks = await mockService.getTasks();
        const newTask: Task = { id: uuid(), text, is_completed: false, created_at: new Date().toISOString(), due_date: dueDate, lead_id: leadId };
        setStorage('sae_tasks', [newTask, ...tasks]);
    },
    toggleTask: async (id: string): Promise<void> => {
        const tasks = await mockService.getTasks();
        setStorage('sae_tasks', tasks.map(t => t.id === id ? { ...t, is_completed: !t.is_completed } : t));
    },
    deleteTask: async (id: string): Promise<void> => {
        const tasks = await mockService.getTasks();
        setStorage('sae_tasks', tasks.filter(t => t.id !== id));
    },

    // --- SETTINGS ---
    getSystemSettings: async (): Promise<SystemSettings> => {
        return getStorage<SystemSettings>('sae_settings', {
            facebook_page_token: '', facebook_verify_token: '', sms_api_key: '', sms_sender_id: '', sms_base_url: '', timezone: 'Asia/Dhaka', system_api_key: 'lg_' + uuid()
        });
    },
    saveSystemSettings: async (settings: SystemSettings): Promise<void> => setStorage('sae_settings', settings),

    // --- SALES ---
    getSalesEntries: async (): Promise<SalesEntry[]> => getStorage<SalesEntry[]>('sae_sales_entries', []),
    addSalesEntry: async (entry: Partial<SalesEntry>): Promise<void> => {
        const entries = await mockService.getSalesEntries();
        setStorage('sae_sales_entries', [{ ...entry, id: uuid(), created_at: new Date().toISOString() } as SalesEntry, ...entries]);
    },
    // Fix for missing updateSalesEntry used in SalesGoals.tsx
    updateSalesEntry: async (id: string, updates: Partial<SalesEntry>): Promise<void> => {
        const entries = await mockService.getSalesEntries();
        setStorage('sae_sales_entries', entries.map(e => e.id === id ? { ...e, ...updates } : e));
    },
    // Fix for missing deleteSalesEntry used in SalesGoals.tsx
    deleteSalesEntry: async (id: string): Promise<void> => {
        const entries = await mockService.getSalesEntries();
        setStorage('sae_sales_entries', entries.filter(e => e.id !== id));
    },
    getSalesTargets: async (): Promise<MonthlyTarget[]> => getStorage<MonthlyTarget[]>('sae_sales_targets', []),
    // Fix for missing setSalesTarget used in SalesGoals.tsx
    setSalesTarget: async (target: Partial<MonthlyTarget>): Promise<void> => {
        const targets = getStorage<MonthlyTarget[]>('sae_sales_targets', []);
        const existingIdx = targets.findIndex(t => t.month === target.month && t.service === target.service);
        if (existingIdx > -1) {
            targets[existingIdx] = { ...targets[existingIdx], ...target };
        } else {
            targets.push({ ...target, id: uuid() } as MonthlyTarget);
        }
        setStorage('sae_sales_targets', targets);
    },

    // --- MISC ---
    getTemplates: async (): Promise<MessageTemplate[]> => getStorage<MessageTemplate[]>('sae_templates', INITIAL_TEMPLATES.map(t => ({ ...t, id: uuid() }))),
    // Fix for missing deleteTemplate used in Templates.tsx
    deleteTemplate: async (id: string): Promise<void> => {
        const templates = await mockService.getTemplates();
        setStorage('sae_templates', templates.filter(t => t.id !== id));
    },
    // Fix for missing updateTemplate used in Templates.tsx
    updateTemplate: async (id: string, updates: Partial<MessageTemplate>): Promise<void> => {
        const templates = await mockService.getTemplates();
        setStorage('sae_templates', templates.map(t => t.id === id ? { ...t, ...updates } : t));
    },
    // Fix for missing createTemplate used in Templates.tsx
    createTemplate: async (tmpl: Partial<MessageTemplate>): Promise<void> => {
        const templates = await mockService.getTemplates();
        setStorage('sae_templates', [{ ...tmpl, id: uuid() } as MessageTemplate, ...templates]);
    },

    getSnippets: async (): Promise<Snippet[]> => getStorage<Snippet[]>('sae_snippets', INITIAL_SNIPPETS.map(s => ({ ...s, id: uuid() }))),
    // Fix for missing createSnippet used in QuickMessages.tsx
    createSnippet: async (snippet: Partial<Snippet>): Promise<void> => {
        const snippets = await mockService.getSnippets();
        setStorage('sae_snippets', [{ ...snippet, id: uuid() } as Snippet, ...snippets]);
    },
    // Fix for missing updateSnippet used in QuickMessages.tsx
    updateSnippet: async (id: string, updates: Partial<Snippet>): Promise<void> => {
        const snippets = await mockService.getSnippets();
        setStorage('sae_snippets', snippets.map(s => s.id === id ? { ...s, ...updates } : s));
    },
    // Fix for missing deleteSnippet used in QuickMessages.tsx
    deleteSnippet: async (id: string): Promise<void> => {
        const snippets = await mockService.getSnippets();
        setStorage('sae_snippets', snippets.filter(s => s.id !== id));
    },

    getAdInspirations: async (): Promise<AdInspiration[]> => getStorage<AdInspiration[]>('sae_ad_swipe', []),
    // Fix for missing addAdInspiration used in AdSwipeFile.tsx
    addAdInspiration: async (ad: Partial<AdInspiration>): Promise<AdInspiration> => {
        const ads = getStorage<AdInspiration[]>('sae_ad_swipe', []);
        const newAd = { ...ad, id: uuid(), created_at: new Date().toISOString() } as AdInspiration;
        setStorage('sae_ad_swipe', [newAd, ...ads]);
        return newAd;
    },
    // Fix for missing deleteAdInspiration used in AdSwipeFile.tsx
    deleteAdInspiration: async (id: string): Promise<void> => {
        const ads = await mockService.getAdInspirations();
        setStorage('sae_ad_swipe', ads.filter(a => a.id !== id));
    },

    getIndustries: async (): Promise<string[]> => getStorage<string[]>('sae_industries', INDUSTRIES),
    addIndustry: async (name: string): Promise<void> => {
        const industries = await mockService.getIndustries();
        if (!industries.includes(name)) setStorage('sae_industries', [...industries, name]);
    },
    deleteIndustry: async (name: string): Promise<void> => {
        const industries = await mockService.getIndustries();
        setStorage('sae_industries', industries.filter(i => i !== name));
    },
    triggerAutomationCheck: async (): Promise<void> => {},

    // --- CUSTOMERS ---
    // Fix for missing getCustomers used in Dashboard.tsx and OnlineCustomers.tsx
    getCustomers: async (): Promise<Customer[]> => getStorage<Customer[]>('sae_customers', []),
    // Fix for missing addBulkCustomers used in OnlineCustomers.tsx
    addBulkCustomers: async (phones: string[], category: string): Promise<number> => {
        const customers = getStorage<Customer[]>('sae_customers', []);
        let count = 0;
        const newCusts = [...customers];
        phones.forEach(p => {
            if (!newCusts.find(c => c.phone === p)) {
                newCusts.push({ id: uuid(), phone: p, category, date_added: new Date().toISOString() });
                count++;
            }
        });
        setStorage('sae_customers', newCusts);
        return count;
    },
    // Fix for missing deleteCustomer used in OnlineCustomers.tsx
    deleteCustomer: async (id: string): Promise<void> => {
        const customers = getStorage<Customer[]>('sae_customers', []);
        setStorage('sae_customers', customers.filter(c => c.id !== id));
    },
    // Fix for missing getCustomerCategories used in OnlineCustomers.tsx
    getCustomerCategories: async (): Promise<string[]> => getStorage<string[]>('sae_cust_cats', ['Dress', 'Bag', 'Watch', 'Jewelry']),
    // Fix for missing addCustomerCategory used in OnlineCustomers.tsx
    addCustomerCategory: async (cat: string): Promise<void> => {
        const cats = getStorage<string[]>('sae_cust_cats', ['Dress', 'Bag', 'Watch', 'Jewelry']);
        if (!cats.includes(cat)) setStorage('sae_cust_cats', [...cats, cat]);
    },
    // Fix for missing deleteCustomerCategory used in OnlineCustomers.tsx
    deleteCustomerCategory: async (cat: string): Promise<void> => {
        const cats = getStorage<string[]>('sae_cust_cats', ['Dress', 'Bag', 'Watch', 'Jewelry']);
        setStorage('sae_cust_cats', cats.filter(c => c !== cat));
    },

    // --- INVOICES ---
    // Fix for missing getInvoices used in Dashboard.tsx and Invoices.tsx
    getInvoices: async (): Promise<Invoice[]> => getStorage<Invoice[]>('sae_invoices', []),
    // Fix for missing createInvoice used in Invoices.tsx
    createInvoice: async (inv: Partial<Invoice>): Promise<void> => {
        const invoices = getStorage<Invoice[]>('sae_invoices', []);
        const newInv = { ...inv, id: uuid(), number: 'INV-' + (invoices.length + 1001), created_at: new Date().toISOString() } as Invoice;
        setStorage('sae_invoices', [newInv, ...invoices]);
    },
    // Fix for missing deleteInvoice used in Invoices.tsx
    deleteInvoice: async (id: string): Promise<void> => {
        const invoices = getStorage<Invoice[]>('sae_invoices', []);
        setStorage('sae_invoices', invoices.filter(i => i.id !== id));
    },

    // --- RETAINERS & CAMPAIGNS ---
    // Fix for missing checkRetainerRenewals used in Dashboard.tsx
    checkRetainerRenewals: async (): Promise<BigFish[]> => {
        const allFish = await mockService.getBigFish();
        const now = new Date();
        const in7Days = new Date(); in7Days.setDate(now.getDate() + 7);
        return allFish.filter(f => f.is_retainer && f.retainer_renewal_date && new Date(f.retainer_renewal_date) <= in7Days);
    },
    // Fix for missing renewRetainer used in Dashboard.tsx
    renewRetainer: async (id: string): Promise<void> => {
        const allFish = getStorage<BigFish[]>('sae_big_fish', DEMO_BIG_FISH);
        const updated = allFish.map(f => {
            if (f.id === id && f.retainer_renewal_date) {
                const nextDate = new Date(f.retainer_renewal_date);
                nextDate.setDate(nextDate.getDate() + 30);
                return { ...f, retainer_renewal_date: nextDate.toISOString().slice(0, 10) };
            }
            return f;
        });
        setStorage('sae_big_fish', updated);
    },
    // Fix for missing getCampaigns used in Campaigns.tsx
    getCampaigns: async (): Promise<Campaign[]> => getStorage<Campaign[]>('sae_campaigns', []),
    // Fix for missing createCampaign used in Campaigns.tsx
    createCampaign: async (camp: Partial<Campaign>): Promise<void> => {
        const campaigns = getStorage<Campaign[]>('sae_campaigns', []);
        setStorage('sae_campaigns', [{ ...camp, id: uuid(), active_leads_count: 0 } as Campaign, ...campaigns]);
    },
    // Fix for missing checkExpiringCampaigns used in BigFish.tsx
    checkExpiringCampaigns: async (): Promise<BigFish[]> => {
        const allFish = await mockService.getBigFish();
        const now = new Date();
        const in3Days = new Date(); in3Days.setDate(now.getDate() + 3);
        return allFish.filter(f => f.campaign_end_date && new Date(f.campaign_end_date) <= in3Days && new Date(f.campaign_end_date) >= now);
    },

    // --- AUTOMATION & MESSAGING ---
    // Fix for missing getSimpleAutomationRules used in Messaging.tsx
    getSimpleAutomationRules: async (): Promise<SimpleAutomationRule[]> => getStorage<SimpleAutomationRule[]>('sae_automation_rules', []),
    // Fix for missing saveSimpleAutomationRule used in Messaging.tsx
    saveSimpleAutomationRule: async (status: LeadStatus, steps: any[]): Promise<void> => {
        const rules = await mockService.getSimpleAutomationRules();
        const existingIdx = rules.findIndex(r => r.status === status);
        const newRule = { id: uuid(), status, steps: steps.map(s => ({ ...s, id: uuid() })), is_active: true };
        if (existingIdx > -1) rules[existingIdx] = newRule;
        else rules.push(newRule);
        setStorage('sae_automation_rules', rules);
    },
    // Fix for missing resolvePhoneNumbersToIds used in Messaging.tsx
    resolvePhoneNumbersToIds: async (phones: string[]): Promise<string[]> => {
        const leads = await mockService.getLeads();
        const ids: string[] = [];
        for (const p of phones) {
            let lead = leads.find(l => l.primary_phone === p);
            if (lead) {
                ids.push(lead.id);
            } else {
                const newId = uuid();
                await mockService.createLead({ id: newId, primary_phone: p, full_name: 'Manual Entry' });
                ids.push(newId);
            }
        }
        return ids;
    },
    // Fix for missing scheduleBulkMessages used in Messaging.tsx
    scheduleBulkMessages: async (ids: string[], steps: any[]): Promise<void> => {
        console.log("Scheduled bulk messages for", ids.length, "recipients", steps);
    },
    // Fix for missing sendBulkSMS used in Messaging.tsx and Calculators.tsx
    sendBulkSMS: async (ids: string[], body: string): Promise<any> => {
        console.log("Sending bulk SMS to", ids.length, "recipients:", body);
        return { success: ids.length, failed: 0, gatewayResponse: 'Success', errors: [] };
    },

    // --- FORMS ---
    // Fix for missing getForms used in Forms.tsx
    getForms: async (): Promise<LeadForm[]> => getStorage<LeadForm[]>('sae_forms', []),
    // Fix for missing getFormById used in PublicForm.tsx
    getFormById: async (id: string): Promise<LeadForm | undefined> => {
        const forms = await mockService.getForms();
        return forms.find(f => f.id === id);
    },
    // Fix for missing createForm used in Forms.tsx
    createForm: async (form: Partial<LeadForm>): Promise<void> => {
        const forms = getStorage<LeadForm[]>('sae_forms', []);
        setStorage('sae_forms', [{ ...form, id: uuid(), created_at: new Date().toISOString() } as LeadForm, ...forms]);
    },
    // Fix for missing updateForm used in Forms.tsx
    updateForm: async (id: string, updates: Partial<LeadForm>): Promise<void> => {
        const forms = await mockService.getForms();
        setStorage('sae_forms', forms.map(f => f.id === id ? { ...f, ...updates } : f));
    },
    // Fix for missing deleteForm used in Forms.tsx
    deleteForm: async (id: string): Promise<void> => {
        const forms = await mockService.getForms();
        setStorage('sae_forms', forms.filter(f => f.id !== id));
    },
    // Fix for missing submitLeadForm used in PublicForm.tsx
    submitLeadForm: async (formId: string, data: any): Promise<void> => {
        await mockService.createLead({
            full_name: data.name,
            primary_phone: data.phone,
            source: LeadSource.FORM,
            facebook_profile_link: data.facebook,
            website_url: data.website,
            industry: data.industry,
            onboarding_data: {
                current_plan: data.current_plan,
                monthly_avg_budget: data.monthly_avg_budget,
                product_price: data.product_price,
                marketing_budget_willingness: data.marketing_budget_willingness
            }
        });
    },

    // --- DOCUMENTS ---
    // Fix for missing getDocuments used in Letterhead.tsx
    getDocuments: async (): Promise<Document[]> => getStorage<Document[]>('sae_docs', []),
    // Fix for missing saveDocument used in Letterhead.tsx
    saveDocument: async (doc: Partial<Document>): Promise<void> => {
        const docs = getStorage<Document[]>('sae_docs', []);
        setStorage('sae_docs', [{ ...doc, id: uuid(), created_at: new Date().toISOString() } as Document, ...docs]);
    },
    // Fix for missing deleteDocument used in Letterhead.tsx
    deleteDocument: async (id: string): Promise<void> => {
        const docs = await mockService.getDocuments();
        setStorage('sae_docs', docs.filter(d => d.id !== id));
    },

    // --- MESSENGER ---
    // Fix for missing getMessengerConversations used in MessageBaba.tsx
    getMessengerConversations: async (): Promise<MessengerConversation[]> => getStorage<MessengerConversation[]>('sae_messenger', []),
    // Fix for missing simulateIncomingMessage used in MessageBaba.tsx
    simulateIncomingMessage: async (text: string, name: string): Promise<void> => {
        const convs = getStorage<MessengerConversation[]>('sae_messenger', []);
        let conv = convs.find(c => c.customer_name === name);
        const msg = { id: uuid(), sender: 'customer', type: 'text', content: text, timestamp: new Date().toISOString() } as any;
        if (conv) {
            conv.messages.push(msg);
            conv.last_message = text;
            conv.last_updated = new Date().toISOString();
        } else {
            conv = { 
                id: uuid(), 
                facebook_user_id: uuid(), 
                customer_name: name, 
                messages: [msg], 
                last_message: text, 
                last_updated: new Date().toISOString(), 
                is_lead_linked: false 
            };
            convs.push(conv);
        }
        setStorage('sae_messenger', convs);
        
        const phoneMatch = text.match(/(?:\+88|88)?(01[3-9]\d{8})/);
        if (phoneMatch) {
            const phone = phoneMatch[0];
            await mockService.createLead({ full_name: name, primary_phone: phone, source: LeadSource.FACEBOOK_MESSENGER });
            conv.customer_phone = phone;
            conv.is_lead_linked = true;
            setStorage('sae_messenger', convs);
        }
    }
};
