
import { 
  Lead, LeadStatus, LeadSource, MessageTemplate, 
  Task, Invoice, BigFish, ClientInteraction, Transaction,
  CampaignRecord, Channel, Customer, SalesEntry, MonthlyTarget, 
  Campaign, SimpleAutomationRule, LeadForm, Document, 
  MessengerConversation, AdInspiration, SystemSettings
} from '../types';
import { 
  INITIAL_TEMPLATES, INITIAL_LEAD_FORMS, INITIAL_SNIPPETS, INDUSTRIES, DEMO_LEADS, DEMO_BIG_FISH 
} from '../constants';

const uuid = () => Math.random().toString(36).substr(2, 9);

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

export const mockService = {
    getLeads: async (): Promise<Lead[]> => {
        return getStorage<Lead[]>('leads', DEMO_LEADS.map(l => ({ ...l, download_count: 0 })));
    },
    
    getLeadById: async (id: string): Promise<Lead | undefined> => {
        const leads = await mockService.getLeads();
        return leads.find(l => l.id === id);
    },

    updateLead: async (id: string, updates: Partial<Lead>) => {
        const leads = getStorage<Lead[]>('leads', []);
        const index = leads.findIndex(l => l.id === id);
        if (index !== -1) {
            leads[index] = { ...leads[index], ...updates };
            setStorage('leads', leads);
        }
    },

    updateLeadStatus: async (id: string, status: LeadStatus) => {
        const leads = getStorage<Lead[]>('leads', []);
        const idx = leads.findIndex(l => l.id === id);
        if (idx !== -1) {
            const oldStatus = leads[idx].status;
            leads[idx].status = status;
            if (!leads[idx].interactions) leads[idx].interactions = [];
            leads[idx].interactions!.unshift({
                id: uuid(),
                type: 'OTHER',
                date: new Date().toISOString(),
                created_at: new Date().toISOString(),
                notes: `Status changed from ${oldStatus} to ${status}`
            });
            setStorage('leads', leads);
        }
    },

    updateLeadIndustry: async (id: string, industry: string) => {
        const leads = getStorage<Lead[]>('leads', []);
        const index = leads.findIndex(l => l.id === id);
        if (index !== -1) {
            leads[index].industry = industry;
            setStorage('leads', leads);
        }
    },

    updateLeadNote: async (id: string, note: string) => {
        const leads = getStorage<Lead[]>('leads', []);
        const index = leads.findIndex(l => l.id === id);
        if (index !== -1) {
            leads[index].quick_note = note;
            setStorage('leads', leads);
        }
    },

    toggleLeadStar: async (id: string) => {
        const leads = getStorage<Lead[]>('leads', []);
        const index = leads.findIndex(l => l.id === id);
        if (index !== -1) {
            leads[index].is_starred = !leads[index].is_starred;
            setStorage('leads', leads);
        }
    },

    createLead: async (leadData: Partial<Lead>) => {
        const leads = getStorage<Lead[]>('leads', []);
        const newLead: Lead = {
            id: uuid(),
            full_name: leadData.full_name || 'Unnamed Lead',
            primary_phone: leadData.primary_phone || '',
            source: leadData.source || LeadSource.MANUAL,
            status: leadData.status || LeadStatus.NEW,
            industry: leadData.industry,
            service_category: leadData.service_category,
            facebook_profile_link: leadData.facebook_profile_link,
            website_url: leadData.website_url,
            is_starred: false,
            is_unread: true,
            total_messages_sent: 0,
            download_count: 0,
            first_contact_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            ...leadData
        };
        leads.unshift(newLead);
        setStorage('leads', leads);
        return newLead;
    },

    incrementDownloadCount: async (ids: string[]) => {
        const leads = getStorage<Lead[]>('leads', []);
        ids.forEach(id => {
            const index = leads.findIndex(l => l.id === id);
            if (index !== -1) {
                leads[index].download_count = (leads[index].download_count || 0) + 1;
            }
        });
        setStorage('leads', leads);
    },

    addLeadInteraction: async (leadId: string, interaction: Omit<ClientInteraction, 'id' | 'created_at'>) => {
        const leads = getStorage<Lead[]>('leads', []);
        const l = leads.find(x => x.id === leadId);
        if (l) {
            if (!l.interactions) l.interactions = [];
            l.interactions.unshift({ id: uuid(), created_at: new Date().toISOString(), ...interaction });
            setStorage('leads', leads);
        }
    },

    deleteLeadInteraction: async (leadId: string, interactionId: string) => {
        const leads = getStorage<Lead[]>('leads', []);
        const l = leads.find(x => x.id === leadId);
        if (l && l.interactions) {
            l.interactions = l.interactions.filter(i => i.id !== interactionId);
            setStorage('leads', leads);
        }
    },

    getTasks: async (): Promise<Task[]> => {
        return getStorage<Task[]>('tasks', []);
    },

    createTask: async (text: string, dueDate?: string, leadId?: string) => {
        const newTask: Task = { id: uuid(), text, is_completed: false, created_at: new Date().toISOString(), due_date: dueDate, lead_id: leadId }; 
        const tasks = getStorage<Task[]>('tasks', []); 
        tasks.unshift(newTask); 
        setStorage('tasks', tasks); 
        
        if (leadId) {
            const msg = `New Task: ${text}${dueDate ? ` (Due: ${new Date(dueDate).toLocaleDateString()})` : ''}`;
            await mockService.addLeadInteraction(leadId, { type: 'TASK', date: new Date().toISOString(), notes: msg });
            const bigFish = getStorage<BigFish[]>('big_fish', []);
            if (bigFish.find(f => f.lead_id === leadId)) {
                await mockService.addClientInteractionByLeadId(leadId, { type: 'TASK', date: new Date().toISOString(), notes: msg });
            }
        }
    },

    toggleTask: async (id: string) => {
        const tasks = getStorage<Task[]>('tasks', []);
        const idx = tasks.findIndex(t => t.id === id);
        if (idx !== -1) {
            tasks[idx].is_completed = !tasks[idx].is_completed;
            setStorage('tasks', tasks);
        }
    },

    deleteTask: async (id: string) => {
        const tasks = getStorage<Task[]>('tasks', []);
        setStorage('tasks', tasks.filter(t => t.id !== id));
    },

    getInvoices: async (): Promise<Invoice[]> => {
        return getStorage<Invoice[]>('invoices', []);
    },

    createInvoice: async (inv: Partial<Invoice>) => {
        const invoices = getStorage<Invoice[]>('invoices', []);
        const newInv: Invoice = {
            id: inv.id || uuid(),
            number: inv.number || `INV-${(invoices.length + 1).toString().padStart(4, '0')}`,
            client_name: inv.client_name!,
            client_phone: inv.client_phone,
            client_address: inv.client_address,
            items: inv.items || [],
            status: inv.status || 'new',
            date: inv.date || new Date().toISOString().slice(0, 10),
            created_at: new Date().toISOString(),
            paid_amount: inv.paid_amount || 0,
            terms_enabled: inv.terms_enabled || false,
            terms_content: inv.terms_content
        };
        invoices.unshift(newInv);
        setStorage('invoices', invoices);

        // Auto-log to CRM
        const total = newInv.items.reduce((s, i) => s + (i.quantity * i.rate), 0);
        const logMsg = `Invoice Created #${newInv.number}: ৳${total} (${newInv.status})`;
        
        const leads = getStorage<Lead[]>('leads', []);
        const matchedLead = leads.find(l => l.primary_phone === inv.client_phone || l.full_name === inv.client_name);
        if (matchedLead) {
            await mockService.addLeadInteraction(matchedLead.id, { type: 'INVOICE', date: new Date().toISOString(), notes: logMsg });
            await mockService.addClientInteractionByLeadId(matchedLead.id, { type: 'INVOICE', date: new Date().toISOString(), notes: logMsg });
        }
    },

    deleteInvoice: async (id: string) => {
        const invoices = getStorage<Invoice[]>('invoices', []);
        setStorage('invoices', invoices.filter(i => i.id !== id));
    },

    getBigFish: async (): Promise<BigFish[]> => {
        return getStorage<BigFish[]>('big_fish', DEMO_BIG_FISH);
    },

    getBigFishById: async (id: string): Promise<BigFish | undefined> => {
        const fish = await mockService.getBigFish();
        return fish.find(f => f.id === id);
    },

    updateBigFish: async (id: string, updates: Partial<BigFish>) => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const index = fish.findIndex(f => f.id === id);
        if (index !== -1) {
            fish[index] = { ...fish[index], ...updates };
            setStorage('big_fish', fish);
        }
    },

    catchBigFish: async (leadId: string): Promise<boolean> => {
        const leads = await mockService.getLeads();
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return false;

        const fish = getStorage<BigFish[]>('big_fish', []);
        if (fish.find(f => f.lead_id === leadId)) return false;

        const newFish: BigFish = {
            id: uuid(),
            lead_id: lead.id,
            name: lead.full_name,
            phone: lead.primary_phone,
            status: 'Active Pool',
            balance: 0,
            low_balance_alert_threshold: 20,
            total_budget: 0,
            spent_amount: 0,
            target_sales: 0,
            current_sales: 0,
            facebook_page: lead.facebook_profile_link,
            website_url: lead.website_url,
            transactions: [],
            campaign_records: [],
            growth_tasks: [],
            reports: [],
            portal_config: { show_balance: true, show_history: true, is_suspended: false },
            start_date: new Date().toISOString()
        };
        fish.push(newFish);
        setStorage('big_fish', fish);
        return true;
    },

    addClientInteractionByLeadId: async (leadId: string, interaction: Omit<ClientInteraction, 'id' | 'created_at'>) => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const f = fish.find(x => x.lead_id === leadId);
        if (f) {
            if (!f.interactions) f.interactions = [];
            f.interactions.unshift({ id: uuid(), created_at: new Date().toISOString(), ...interaction });
            setStorage('big_fish', fish);
        }
    },

    addTransaction: async (fishId: string, type: Transaction['type'], amount: number, desc: string): Promise<BigFish | undefined> => {
        let fish = getStorage<BigFish[]>('big_fish', []);
        let f = fish.find(x => x.id === fishId);
        if (f) {
            const tx: Transaction = { id: uuid(), date: new Date().toISOString(), type, amount, description: desc };
            f.transactions.unshift(tx);
            if (type === 'DEPOSIT') f.balance += amount; else f.balance -= amount;
            
            if (!f.interactions) f.interactions = [];
            f.interactions.unshift({
                id: uuid(),
                type: 'BALANCE',
                date: new Date().toISOString(),
                created_at: new Date().toISOString(),
                notes: `${type === 'DEPOSIT' ? 'Deposit' : 'Deduction'}: $${amount} - ${desc}`
            });
            setStorage('big_fish', fish);
            return f;
        }
        return undefined;
    },

    addCampaignRecord: async (fishId: string, record: Omit<CampaignRecord, 'id' | 'created_at'>): Promise<BigFish | undefined> => {
        let fish = getStorage<BigFish[]>('big_fish', []);
        let f = fish.find(x => x.id === fishId);
        if (f) {
            const newRecord: CampaignRecord = { id: uuid(), created_at: new Date().toISOString(), ...record };
            if(!f.campaign_records) f.campaign_records = [];
            f.campaign_records.unshift(newRecord);
            f.balance -= record.amount_spent;
            f.spent_amount += record.amount_spent;
            if (record.result_type === 'SALES') f.current_sales += record.results_count;

            if (!f.interactions) f.interactions = [];
            f.interactions.unshift({
                id: uuid(),
                type: record.result_type === 'SALES' ? 'SALE' : 'BALANCE',
                date: new Date().toISOString(),
                created_at: new Date().toISOString(),
                notes: `Ad Performance: Spent $${record.amount_spent} for ${record.results_count} ${record.result_type.toLowerCase()}`
            });
            setStorage('big_fish', fish);
            return f;
        }
        return undefined;
    },

    checkRetainerRenewals: async (): Promise<BigFish[]> => {
        const fish = await mockService.getBigFish();
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);
        return fish.filter(f => f.is_retainer && f.retainer_renewal_date && new Date(f.retainer_renewal_date) <= nextWeek);
    },

    renewRetainer: async (id: string) => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const idx = fish.findIndex(f => f.id === id);
        if (idx !== -1 && fish[idx].retainer_renewal_date) {
            const oldDate = new Date(fish[idx].retainer_renewal_date!);
            oldDate.setDate(oldDate.getDate() + 30);
            fish[idx].retainer_renewal_date = oldDate.toISOString();
            setStorage('big_fish', fish);
        }
    },

    getCustomers: async (): Promise<Customer[]> => getStorage('customers', []),
    addBulkCustomers: async (lines: string[], category: string): Promise<number> => {
        const customers = getStorage<Customer[]>('customers', []);
        let added = 0;
        lines.forEach(phone => {
            if (!customers.find(c => c.phone === phone)) {
                customers.push({ id: uuid(), phone, category, date_added: new Date().toISOString() });
                added++;
            }
        });
        setStorage('customers', customers);
        return added;
    },
    deleteCustomer: async (id: string) => {
        const customers = getStorage<Customer[]>('customers', []);
        setStorage('customers', customers.filter(c => c.id !== id));
    },
    getCustomerCategories: async (): Promise<string[]> => getStorage('customer_categories', ['Dress', 'Bag', 'Watch']),
    addCustomerCategory: async (name: string) => {
        const cats = await mockService.getCustomerCategories();
        if (!cats.includes(name)) {
            cats.push(name);
            setStorage('customer_categories', cats);
        }
    },
    deleteCustomerCategory: async (name: string) => {
        const cats = await mockService.getCustomerCategories();
        setStorage('customer_categories', cats.filter(c => c !== name));
    },

    getSnippets: async (): Promise<Snippet[]> => getStorage('snippets', INITIAL_SNIPPETS.map(s => ({ ...s, id: uuid() }))),
    createSnippet: async (s: Omit<Snippet, 'id'>) => {
        const snippets = await mockService.getSnippets();
        snippets.unshift({ id: uuid(), ...s });
        setStorage('snippets', snippets);
    },
    updateSnippet: async (id: string, updates: Partial<Snippet>) => {
        const snippets = await mockService.getSnippets();
        const idx = snippets.findIndex(s => s.id === id);
        if (idx !== -1) {
            snippets[idx] = { ...snippets[idx], ...updates };
            setStorage('snippets', snippets);
        }
    },
    deleteSnippet: async (id: string) => {
        const snippets = await mockService.getSnippets();
        setStorage('snippets', snippets.filter(s => s.id !== id));
    },

    getSalesEntries: async (): Promise<SalesEntry[]> => getStorage('sales_entries', []),
    addSalesEntry: async (e: Omit<SalesEntry, 'id'>) => {
        const entries = await mockService.getSalesEntries();
        entries.unshift({ id: uuid(), ...e });
        setStorage('sales_entries', entries);
    },
    updateSalesEntry: async (id: string, updates: Partial<SalesEntry>) => {
        const entries = await mockService.getSalesEntries();
        const idx = entries.findIndex(e => e.id === id);
        if (idx !== -1) {
            entries[idx] = { ...entries[idx], ...updates };
            setStorage('sales_entries', entries);
        }
    },
    deleteSalesEntry: async (id: string) => {
        const entries = await mockService.getSalesEntries();
        setStorage('sales_entries', entries.filter(e => e.id !== id));
    },

    getSalesTargets: async (): Promise<MonthlyTarget[]> => getStorage('sales_targets', []),
    setSalesTarget: async (target: Omit<MonthlyTarget, 'id'>) => {
        const targets = await mockService.getSalesTargets();
        const idx = targets.findIndex(t => t.month === target.month && t.service === target.service);
        if (idx !== -1) {
            targets[idx] = { ...targets[idx], ...target };
        } else {
            targets.push({ id: uuid(), ...target });
        }
        setStorage('sales_targets', targets);
    },

    getTemplates: async (): Promise<MessageTemplate[]> => getStorage('templates', INITIAL_TEMPLATES),
    createTemplate: async (t: Omit<MessageTemplate, 'id'>) => {
        const tmpls = await mockService.getTemplates();
        tmpls.unshift({ id: uuid(), ...t });
        setStorage('templates', tmpls);
    },
    updateTemplate: async (id: string, updates: Partial<MessageTemplate>) => {
        const tmpls = await mockService.getTemplates();
        const idx = tmpls.findIndex(t => t.id === id);
        if (idx !== -1) {
            tmpls[idx] = { ...tmpls[idx], ...updates };
            setStorage('templates', tmpls);
        }
    },
    deleteTemplate: async (id: string) => {
        const tmpls = await mockService.getTemplates();
        setStorage('templates', tmpls.filter(t => t.id !== id));
    },

    getCampaigns: async (): Promise<Campaign[]> => getStorage('campaigns', []),
    createCampaign: async (c: Omit<Campaign, 'id'>) => {
        const camps = await mockService.getCampaigns();
        camps.unshift({ id: uuid(), ...c });
        setStorage('campaigns', camps);
    },

    getSimpleAutomationRules: async (): Promise<SimpleAutomationRule[]> => getStorage('automation_rules', []),
    saveSimpleAutomationRule: async (status: LeadStatus, steps: SimpleAutomationRule['steps']) => {
        const rules = await mockService.getSimpleAutomationRules();
        const idx = rules.findIndex(r => r.status === status);
        if (idx !== -1) {
            rules[idx].steps = steps;
        } else {
            rules.push({ status, steps });
        }
        setStorage('automation_rules', rules);
    },

    getForms: async (): Promise<LeadForm[]> => getStorage('forms', []),
    getFormById: async (id: string) => (await mockService.getForms()).find(f => f.id === id),
    createForm: async (f: Omit<LeadForm, 'id' | 'created_at'>) => {
        const forms = await mockService.getForms();
        forms.unshift({ id: uuid(), created_at: new Date().toISOString(), ...f });
        setStorage('forms', forms);
    },
    updateForm: async (id: string, updates: Partial<LeadForm>) => {
        const forms = await mockService.getForms();
        const idx = forms.findIndex(f => f.id === id);
        if (idx !== -1) {
            forms[idx] = { ...forms[idx], ...updates };
            setStorage('forms', forms);
        }
    },
    deleteForm: async (id: string) => {
        const forms = await mockService.getForms();
        setStorage('forms', forms.filter(f => f.id !== id));
    },
    submitLeadForm: async (formId: string, data: any) => {
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

    getDocuments: async (): Promise<Document[]> => getStorage('documents', []),
    saveDocument: async (d: Omit<Document, 'id' | 'created_at'>) => {
        const docs = await mockService.getDocuments();
        docs.unshift({ id: uuid(), created_at: new Date().toISOString(), ...d });
        setStorage('documents', docs);
    },
    deleteDocument: async (id: string) => {
        const docs = await mockService.getDocuments();
        setStorage('documents', docs.filter(d => d.id !== id));
    },

    getMessengerConversations: async (): Promise<MessengerConversation[]> => getStorage('messenger_convs', []),
    simulateIncomingMessage: async (text: string, senderName: string) => {
        const convs = await mockService.getMessengerConversations();
        let conv = convs.find(c => c.customer_name === senderName);
        if (!conv) {
            conv = { id: uuid(), customer_name: senderName, last_updated: '', messages: [], is_lead_linked: false };
            convs.push(conv);
        }
        conv.messages.push({ id: uuid(), sender: 'customer', content: text, timestamp: new Date().toISOString() });
        conv.last_updated = new Date().toISOString();
        
        // Regex extract phone
        const phoneMatch = text.match(/(?:\+88|88)?01[3-9]\d{8}/);
        if (phoneMatch) {
            conv.customer_phone = phoneMatch[0];
            conv.is_lead_linked = true;
            await mockService.createLead({ full_name: senderName, primary_phone: phoneMatch[0], source: LeadSource.FACEBOOK_MESSENGER });
        }
        setStorage('messenger_convs', convs);
    },

    getAdInspirations: async (): Promise<AdInspiration[]> => getStorage('ad_swipe', []),
    addAdInspiration: async (ad: Omit<AdInspiration, 'id'>) => {
        const ads = await mockService.getAdInspirations();
        const newAd = { id: uuid(), ...ad };
        ads.unshift(newAd);
        setStorage('ad_swipe', ads);
        return newAd;
    },
    deleteAdInspiration: async (id: string) => {
        const ads = await mockService.getAdInspirations();
        setStorage('ad_swipe', ads.filter(a => a.id !== id));
    },

    resolvePhoneNumbersToIds: async (numbers: string[]): Promise<string[]> => {
        const leads = await mockService.getLeads();
        const ids: string[] = [];
        for (const num of numbers) {
            let lead = leads.find(l => l.primary_phone === num);
            if (!lead) {
                lead = await mockService.createLead({ primary_phone: num, full_name: 'Unknown ' + num.slice(-4) });
            }
            ids.push(lead.id);
        }
        return ids;
    },
    scheduleBulkMessages: async (ids: string[], steps: any[]) => {
        // Logic for scheduling (omitted for mock brevity, but method must exist)
    },

    getPaymentMethods: async (): Promise<PaymentMethod[]> => getStorage('payment_methods', []),
    getSystemSettings: async (): Promise<SystemSettings> => getStorage('system_settings', {} as SystemSettings),
    saveSystemSettings: async (s: SystemSettings) => setStorage('system_settings', s),
    triggerAutomationCheck: async () => {},
    getIndustries: async () => INDUSTRIES,
    addIndustry: async (name: string) => {
        // Mock add industry
    },
    deleteIndustry: async (name: string) => {
        // Mock delete industry
    },
    sendBulkSMS: async (leadIds: string[], messageBody: string) => {
        for (const leadId of leadIds) {
            const log = { type: 'SMS' as const, date: new Date().toISOString(), notes: `SMS Sent: ${messageBody.substring(0, 60)}...` };
            await mockService.addLeadInteraction(leadId, log);
            await mockService.addClientInteractionByLeadId(leadId, log);
        }
        return true;
    }
};
