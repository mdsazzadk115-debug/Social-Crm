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

// API Helper
const API_BASE = './api'; 

// --- DATE HELPER FOR MYSQL ---
const formatDateForMySQL = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    
    // Format: YYYY-MM-DD HH:MM:SS
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

// --- JSON PARSER HELPER ---
const safeJSONParse = (data: any, fallback: any = {}) => {
    if (!data) return fallback;
    if (typeof data === 'object') return data; // Already an object
    try {
        return JSON.parse(data);
    } catch (e) {
        console.warn("JSON Parse failed for:", data);
        return fallback;
    }
};

export const mockService = {
    // --- LEADS (CONNECTED TO PHP/MYSQL) ---
    getLeads: async (): Promise<Lead[]> => {
        try {
            const res = await fetch(`${API_BASE}/leads.php`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) return data;
            }
        } catch (e) {
            // console.warn("Running in Offline/Demo Mode (API fetch failed):", e);
        }
        return getStorage<Lead[]>('leads', FULL_DEMO_LEADS);
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

        try {
            // Send to Server
            await fetch(`${API_BASE}/leads.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newLead)
            });
        } catch (e) {
            console.error("Failed to save to server, saving locally", e);
        }

        // Keep LocalStorage Sync for immediate UI update / Fallback
        const leads = getStorage<Lead[]>('leads', FULL_DEMO_LEADS);
        leads.unshift(newLead);
        setStorage('leads', leads);
        
        return newLead;
    },
    updateLeadStatus: async (id: string, status: LeadStatus) => {
        // Optimistic UI Update
        const leads = getStorage<Lead[]>('leads', FULL_DEMO_LEADS);
        const index = leads.findIndex(l => l.id === id);
        if (index !== -1) {
            leads[index].status = status;
            leads[index].last_activity_at = new Date().toISOString();
            setStorage('leads', leads);
        }

        try {
            await fetch(`${API_BASE}/leads.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_status', id, status })
            });
        } catch (e) { console.error("API Error", e); }
    },
    updateLeadIndustry: async (id: string, industry: string) => {
        const leads = getStorage<Lead[]>('leads', FULL_DEMO_LEADS);
        const index = leads.findIndex(l => l.id === id);
        if (index !== -1) {
            leads[index].industry = industry;
            setStorage('leads', leads);
        }
        try {
            await fetch(`${API_BASE}/leads.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_industry', id, industry })
            });
        } catch (e) { console.error("API Error", e); }
    },
    toggleLeadStar: async (id: string) => {
        const leads = getStorage<Lead[]>('leads', FULL_DEMO_LEADS);
        const index = leads.findIndex(l => l.id === id);
        if (index !== -1) {
            leads[index].is_starred = !leads[index].is_starred;
            setStorage('leads', leads);
        }
        try {
            await fetch(`${API_BASE}/leads.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'toggle_star', id })
            });
        } catch (e) { console.error("API Error", e); }
    },
    updateLeadNote: async (id: string, note: string) => {
        const leads = getStorage<Lead[]>('leads', FULL_DEMO_LEADS);
        const index = leads.findIndex(l => l.id === id);
        if (index !== -1) {
            leads[index].quick_note = note;
            setStorage('leads', leads);
        }
    },
    incrementDownloadCount: async (ids: string[]) => {
        const leads = getStorage<Lead[]>('leads', FULL_DEMO_LEADS);
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
        const leads = await mockService.getLeads(); // Use getLeads to ensure we have latest
        const ids: string[] = [];

        for (const phone of phones) {
            const existing = leads.find(l => l.primary_phone.includes(phone) || phone.includes(l.primary_phone));
            if (existing) {
                ids.push(existing.id);
            } else {
                // Create new lead
                const newLead: Lead = {
                    id: uuid(),
                    full_name: 'Unknown',
                    primary_phone: phone,
                    source: LeadSource.MANUAL,
                    status: LeadStatus.NEW,
                    is_starred: false,
                    is_unread: true,
                    total_messages_sent: 0,
                    download_count: 0,
                    first_contact_at: new Date().toISOString(),
                    last_activity_at: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                };
                
                // Create in DB
                await mockService.createLead(newLead);
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
    
    // --- TEMPLATES ---
    getTemplates: async (): Promise<MessageTemplate[]> => {
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
        const leads = getStorage<Lead[]>('leads', FULL_DEMO_LEADS);
        
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

    // --- CUSTOMERS (ONLINE) - API Connected ---
    getCustomers: async (): Promise<Customer[]> => {
        try {
            const res = await fetch(`${API_BASE}/customers.php?action=get_customers`);
            if (res.ok) return await res.json();
        } catch (e) { console.warn("API Error", e); }
        return getStorage<Customer[]>('online_customers', []);
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
        let added = 0;
        
        // Loop through lines and send API requests
        const promises = lines.map(async (line) => {
            const phone = line.trim();
            if (phone) {
                try {
                    const res = await fetch(`${API_BASE}/customers.php`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            action: 'add_customer',
                            id: uuid(),
                            phone, 
                            category,
                            date_added: new Date().toISOString()
                        })
                    });
                    const result = await res.json();
                    if (result.added) added++;
                } catch (e) { console.error("Error adding customer", e); }
            }
        });

        await Promise.all(promises);
        return added;
    },
    deleteCustomer: async (id: string) => {
        try {
            await fetch(`${API_BASE}/customers.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_customer', id })
            });
        } catch (e) { console.error("API Error", e); }
    },

    // --- TASKS (API Connected) ---
    getTasks: async (): Promise<Task[]> => {
        try {
            const res = await fetch(`${API_BASE}/tasks.php`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) return data;
            } else {
                console.warn(`Tasks API Error: ${res.status}`);
            }
        } catch (e) { console.warn("API Error", e); }
        return getStorage<Task[]>('tasks', []);
    },
    createTask: async (text: string, dueDate?: string, leadId?: string) => {
        const newTask = {
            id: uuid(),
            text,
            is_completed: false,
            created_at: new Date().toISOString(),
            due_date: dueDate,
            lead_id: leadId
        };

        try {
            await fetch(`${API_BASE}/tasks.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'create', 
                    ...newTask,
                    // Format dates for MySQL to avoid errors
                    created_at: formatDateForMySQL(newTask.created_at),
                    due_date: dueDate ? formatDateForMySQL(dueDate) : null
                })
            });
        } catch (e) { console.error("API Error Creating Task", e); }

        const tasks = getStorage<Task[]>('tasks', []);
        tasks.push(newTask);
        setStorage('tasks', tasks);
    },
    toggleTask: async (id: string) => {
        const tasks = getStorage<Task[]>('tasks', []);
        const t = tasks.find(x => x.id === id);
        if (t) {
            t.is_completed = !t.is_completed;
            setStorage('tasks', tasks);

            try {
                await fetch(`${API_BASE}/tasks.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'toggle', id, is_completed: t.is_completed })
                });
            } catch (e) { console.error("API Error", e); }
        }
    },
    deleteTask: async (id: string) => {
        try {
            await fetch(`${API_BASE}/tasks.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', id })
            });
        } catch (e) { console.error("API Error", e); }

        let tasks = getStorage<Task[]>('tasks', []);
        tasks = tasks.filter(t => t.id !== id);
        setStorage('tasks', tasks);
    },

    // --- INVOICES (API Connected) ---
    getInvoices: async (): Promise<Invoice[]> => {
        try {
            const res = await fetch(`${API_BASE}/invoices.php`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) return data;
            }
        } catch(e) { console.warn("API Error, using local", e); }
        return getStorage<Invoice[]>('invoices', []);
    },
    createInvoice: async (inv: Partial<Invoice>) => {
        const invoices = getStorage<Invoice[]>('invoices', []);
        // Generate a simple number if creating new
        const num = invoices.length + 1;
        const padded = num.toString().padStart(4, '0');
        
        const newInv = {
            id: inv.id || uuid(),
            number: inv.number || `INV-${padded}`,
            client_name: inv.client_name!,
            client_phone: inv.client_phone,
            client_address: inv.client_address,
            items: inv.items || [],
            status: inv.status || 'new',
            date: inv.date || new Date().toISOString().slice(0, 10),
            created_at: formatDateForMySQL(new Date().toISOString()),
            paid_amount: inv.paid_amount || 0,
            terms_enabled: inv.terms_enabled || false,
            terms_content: inv.terms_content
        };

        try {
            await fetch(`${API_BASE}/invoices.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create',
                    ...newInv
                })
            });
        } catch(e) { console.warn("API Error", e); }

        // Local Fallback
        const idx = invoices.findIndex(i => i.id === newInv.id);
        if (idx !== -1) {
            invoices[idx] = newInv as Invoice;
        } else {
            invoices.unshift(newInv as Invoice);
        }
        setStorage('invoices', invoices);
    },
    deleteInvoice: async (id: string) => {
        try {
            await fetch(`${API_BASE}/invoices.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', id })
            });
        } catch(e) { console.warn("API Error", e); }

        let invoices = getStorage<Invoice[]>('invoices', []);
        invoices = invoices.filter(i => i.id !== id);
        setStorage('invoices', invoices);
    },

    // --- SNIPPETS ---
    getSnippets: async (): Promise<Snippet[]> => {
        return getStorage<Snippet[]>('snippets', FULL_SNIPPETS);
    },
    createSnippet: async (s: Partial<Snippet>) => {
        const snippets = getStorage<Snippet[]>('snippets', FULL_SNIPPETS);
        snippets.push({ ...s, id: uuid() } as Snippet);
        setStorage('snippets', snippets);
    },
    updateSnippet: async (id: string, updates: Partial<Snippet>) => {
        const snippets = getStorage<Snippet[]>('snippets', FULL_SNIPPETS);
        const idx = snippets.findIndex(s => s.id === id);
        if (idx !== -1) {
            snippets[idx] = { ...snippets[idx], ...updates };
            setStorage('snippets', snippets);
        }
    },
    deleteSnippet: async (id: string) => {
        let snippets = getStorage<Snippet[]>('snippets', FULL_SNIPPETS);
        snippets = snippets.filter(s => s.id !== id);
        setStorage('snippets', snippets);
    },

    // --- DOCUMENTS ---
    getDocuments: async (): Promise<Document[]> => {
        return getStorage<Document[]>('documents', []);
    },
    saveDocument: async (doc: Partial<Document>) => {
        const docs = getStorage<Document[]>('documents', []);
        docs.unshift({
            id: uuid(),
            title: doc.title || 'Untitled',
            client_id: doc.client_id,
            client_name: doc.client_name,
            content: doc.content || '',
            created_at: new Date().toISOString()
        });
        setStorage('documents', docs);
    },
    deleteDocument: async (id: string) => {
        let docs = getStorage<Document[]>('documents', []);
        docs = docs.filter(d => d.id !== id);
        setStorage('documents', docs);
    },

    // --- BIG FISH (VIP CLIENTS) - API Connected ---
    getBigFish: async (): Promise<BigFish[]> => {
        try {
            const res = await fetch(`${API_BASE}/bigfish.php`);
            if(res.ok) {
                const rawData = await res.json();
                if (!Array.isArray(rawData)) return [];
                
                // Sanitize Data
                return rawData.map((fish: any) => {
                    const config = safeJSONParse(fish.portal_config, { show_balance: true, show_history: true, is_suspended: false });
                    let transactions = fish.transactions;
                    if (!Array.isArray(transactions)) transactions = [];
                    
                    transactions = transactions.map((t: any) => ({
                        ...t,
                        amount: parseFloat(t.amount || 0),
                        metadata: safeJSONParse(t.metadata)
                    }));

                    return {
                        ...fish,
                        balance: parseFloat(fish.balance || 0),
                        spent_amount: parseFloat(fish.spent_amount || 0),
                        target_sales: parseInt(fish.target_sales || 0),
                        current_sales: parseInt(fish.current_sales || 0),
                        retainer_amount: parseFloat(fish.retainer_amount || 0),
                        portal_config: config,
                        transactions: transactions,
                        growth_tasks: Array.isArray(fish.growth_tasks) ? fish.growth_tasks : [],
                        reports: Array.isArray(fish.reports) ? fish.reports : [],
                        interactions: Array.isArray(fish.interactions) ? fish.interactions : [],
                    };
                });
            }
        } catch (e) { console.warn("API Error", e); }
        return getStorage<BigFish[]>('big_fish', []);
    },
    getBigFishById: async (id: string): Promise<BigFish | undefined> => {
        const fish = await mockService.getBigFish();
        return fish.find(f => f.id === id);
    },
    createBigFish: async (data: Partial<BigFish>) => {
        const newFish = {
            id: uuid(),
            lead_id: uuid(),
            name: data.name!,
            phone: data.phone!,
            status: 'Active Pool',
            package_name: data.package_name,
            balance: 0,
            low_balance_alert_threshold: 10,
            total_budget: 0,
            spent_amount: 0,
            target_sales: 0,
            current_sales: 0,
            transactions: [],
            growth_tasks: [],
            reports: [],
            interactions: [],
            portal_config: { show_balance: true, show_history: true, is_suspended: false },
            start_date: new Date().toISOString()
        };

        try {
            await fetch(`${API_BASE}/bigfish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', ...newFish })
            });
        } catch(e) { console.warn("API Error", e); }

        const fish = getStorage<BigFish[]>('big_fish', []);
        fish.push(newFish as any);
        setStorage('big_fish', fish);
    },
    catchBigFish: async (leadId: string): Promise<boolean> => {
        const leads = await mockService.getLeads();
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return false;

        const fish = getStorage<BigFish[]>('big_fish', []);
        if (fish.some(f => f.lead_id === leadId)) return false;

        const newFish = {
            id: uuid(),
            lead_id: leadId,
            name: lead.full_name,
            phone: lead.primary_phone,
            status: 'Active Pool',
            package_name: lead.service_category,
            balance: 0,
            low_balance_alert_threshold: 10,
            total_budget: 0,
            spent_amount: 0,
            target_sales: 0,
            current_sales: 0,
            transactions: [],
            growth_tasks: [],
            reports: [],
            interactions: [],
            portal_config: { show_balance: true, show_history: true, is_suspended: false },
            start_date: new Date().toISOString()
        };

        try {
            await fetch(`${API_BASE}/bigfish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', ...newFish })
            });
        } catch(e) { console.warn("API Error", e); }

        fish.push(newFish as any);
        setStorage('big_fish', fish);
        return true;
    },
    toggleBigFishStatus: async (id: string) => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const f = fish.find(x => x.id === id);
        if (f) {
            f.status = f.status === 'Active Pool' ? 'Hall of Fame' : 'Active Pool';
            if (f.status === 'Hall of Fame') f.end_date = new Date().toISOString();
            else f.end_date = undefined; // Clear end date if reactivated
            
            setStorage('big_fish', fish);

            // Sync with Server (Fix for Mark Complete Bug)
            try {
                await fetch(`${API_BASE}/bigfish.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        action: 'update', 
                        id, 
                        updates: { 
                            status: f.status,
                            end_date: f.end_date 
                        } 
                    })
                });
            } catch (e) { console.error("API Error", e); }
        }
    },
    updateBigFish: async (id: string, updates: Partial<BigFish>) => {
        // Optimistic UI Update
        const fish = getStorage<BigFish[]>('big_fish', []);
        const idx = fish.findIndex(f => f.id === id);
        if(idx !== -1) {
            fish[idx] = { ...fish[idx], ...updates };
            setStorage('big_fish', fish);
        }
        // Send to Server
        try {
            await fetch(`${API_BASE}/bigfish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update', id, updates })
            });
        } catch(e) { console.warn("API Error", e); }
    },
    addTransaction: async (fishId: string, type: Transaction['type'], amount: number, desc: string, metadata?: any, dateOverride?: string) => {
        // 1. Prepare Local Data
        const fish = getStorage<BigFish[]>('big_fish', []);
        const f = fish.find(x => x.id === fishId);
        if (f) {
            const tx: Transaction = {
                id: uuid(),
                date: dateOverride || new Date().toISOString(),
                type,
                amount,
                description: desc,
                metadata
            };
            f.transactions.unshift(tx);
            
            // Force balance to be number before calculation (Fix for Balance Bug)
            const currentBalance = parseFloat(f.balance as any) || 0;
            
            if (type === 'DEPOSIT') f.balance = currentBalance + amount;
            else f.balance = currentBalance - amount;

            if (type === 'AD_SPEND') {
                const currentSpent = parseFloat(f.spent_amount as any) || 0;
                f.spent_amount = currentSpent + amount;
                
                f.reports.unshift({
                    id: uuid(),
                    date: dateOverride || new Date().toISOString(),
                    task: `Ad Run: Spent $${amount} (${desc})`
                });
                if (metadata && metadata.leads) {
                    if (metadata.resultType === 'SALES') {
                        f.current_sales = (f.current_sales || 0) + metadata.leads;
                    }
                }
            }
            setStorage('big_fish', fish);

            // 2. Send to PHP API
            try {
                await fetch(`${API_BASE}/bigfish.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'add_transaction',
                        id: tx.id,
                        big_fish_id: fishId,
                        type,
                        amount,
                        description: desc,
                        date: tx.date,
                        metadata
                    })
                });
            } catch (e) { console.error("API Error", e); }
        }
    },
    deleteTransaction: async (fishId: string, txId: string) => {
        // 1. Update Local Storage
        const fish = getStorage<BigFish[]>('big_fish', []);
        const f = fish.find(x => x.id === fishId);
        
        let updates: Partial<BigFish> = {}; // Capture changes to sync

        if (f) {
            const tx = f.transactions.find(t => t.id === txId);
            if (tx) {
                // Force number conversion (Fix for Balance Bug)
                const currentBalance = parseFloat(f.balance as any) || 0;
                
                if (tx.type === 'DEPOSIT') {
                    f.balance = currentBalance - tx.amount;
                } else {
                    f.balance = currentBalance + tx.amount;
                }
                updates.balance = f.balance;
                
                if (tx.type === 'AD_SPEND') {
                    const currentSpent = parseFloat(f.spent_amount as any) || 0;
                    f.spent_amount = currentSpent - tx.amount;
                    updates.spent_amount = f.spent_amount;
                    
                    // Revert Sales Count if applicable (Fix for Sales Count Bug)
                    if (tx.metadata && tx.metadata.resultType === 'SALES' && tx.metadata.leads) {
                         const currentSales = (f.current_sales || 0);
                         let newSales = currentSales - tx.metadata.leads;
                         if (newSales < 0) newSales = 0;
                         f.current_sales = newSales;
                         updates.current_sales = newSales;
                    }
                }
                
                f.transactions = f.transactions.filter(t => t.id !== txId);
                setStorage('big_fish', fish);
            }
        }

        // 2. Update Server
        try {
            // Delete the transaction record
            await fetch(`${API_BASE}/bigfish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete_transaction',
                    id: txId,
                    big_fish_id: fishId
                })
            });

            // Update parent record stats if any changes occurred
            if (Object.keys(updates).length > 0) {
                await fetch(`${API_BASE}/bigfish.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        action: 'update', 
                        id: fishId, 
                        updates 
                    })
                });
            }
        } catch (e) { console.error("API Error during delete transaction", e); }
    },
    updateTransaction: async (fishId: string, txId: string, updates: { date: string, description: string, amount: number }) => {
        // 1. Update Local Storage
        const fish = getStorage<BigFish[]>('big_fish', []);
        const f = fish.find(x => x.id === fishId);
        if (f) {
            const txIndex = f.transactions.findIndex(t => t.id === txId);
            if (txIndex !== -1) {
                const oldTx = f.transactions[txIndex];
                // Force number conversion
                let currentBalance = parseFloat(f.balance as any) || 0;

                // Revert old balance effect
                if (oldTx.type === 'DEPOSIT') currentBalance -= oldTx.amount;
                else currentBalance += oldTx.amount;
                
                if (oldTx.type === 'AD_SPEND') {
                    const currentSpent = parseFloat(f.spent_amount as any) || 0;
                    f.spent_amount = currentSpent - oldTx.amount;
                }

                // Apply new balance effect
                const newAmount = updates.amount;
                if (oldTx.type === 'DEPOSIT') currentBalance += newAmount;
                else currentBalance -= newAmount;
                
                if (oldTx.type === 'AD_SPEND') {
                    const currentSpent = parseFloat(f.spent_amount as any) || 0;
                    f.spent_amount = currentSpent + newAmount;
                }

                f.balance = currentBalance;
                f.transactions[txIndex] = { ...oldTx, ...updates };
                setStorage('big_fish', fish);
            }
        }

        // 2. Update Server
        try {
            await fetch(`${API_BASE}/bigfish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_transaction',
                    id: txId,
                    big_fish_id: fishId,
                    ...updates
                })
            });
        } catch (e) { console.error("API Error during update transaction", e); }
    },
    getLifetimeDeposit: (fish: BigFish) => {
        return fish.transactions.filter(t => t.type === 'DEPOSIT').reduce((acc, t) => acc + t.amount, 0);
    },
    addGrowthTask: async (fishId: string, title: string, dueDate?: string) => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const f = fish.find(x => x.id === fishId);
        if (f) {
            const newTask = {
                id: uuid(),
                title,
                is_completed: false,
                due_date: dueDate
            };
            f.growth_tasks.push(newTask);
            setStorage('big_fish', fish);

            try {
                await fetch(`${API_BASE}/bigfish.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'add_task',
                        id: fishId,
                        task_id: newTask.id,
                        title,
                        due_date: dueDate
                    })
                });
            } catch (e) { console.error("API Error", e); }
        }
    },
    toggleGrowthTask: async (fishId: string, taskId: string) => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const f = fish.find(x => x.id === fishId);
        if (f) {
            const t = f.growth_tasks.find(x => x.id === taskId);
            if (t) t.is_completed = !t.is_completed;
            setStorage('big_fish', fish);

            try {
                await fetch(`${API_BASE}/bigfish.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'toggle_task', task_id: taskId })
                });
            } catch (e) { console.error("API Error", e); }
        }
    },
    updatePortalConfig: async (fishId: string, config: any) => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const f = fish.find(x => x.id === fishId);
        if (f) {
            f.portal_config = { ...f.portal_config, ...config };
            setStorage('big_fish', fish);

            try {
                await fetch(`${API_BASE}/bigfish.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'update_config', id: fishId, config: f.portal_config })
                });
            } catch (e) { console.error("API Error", e); }
        }
    },
    updateTargets: async (fishId: string, target: number, current: number) => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const f = fish.find(x => x.id === fishId);
        if (f) {
            f.target_sales = target;
            f.current_sales = current;
            setStorage('big_fish', fish);

            try {
                await fetch(`${API_BASE}/bigfish.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'update_targets', id: fishId, target, current })
                });
            } catch (e) { console.error("API Error", e); }
        }
    },
    addWorkLog: async (fishId: string, task: string) => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const f = fish.find(x => x.id === fishId);
        if (f) {
            const newLog = {
                id: uuid(),
                date: new Date().toISOString(),
                task
            };
            f.reports.unshift(newLog);
            setStorage('big_fish', fish);

            try {
                await fetch(`${API_BASE}/bigfish.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        action: 'add_log', 
                        id: fishId, 
                        log_id: newLog.id, 
                        task,
                        date: newLog.date 
                    })
                });
            } catch (e) { console.error("API Error", e); }
        }
    },
    checkExpiringCampaigns: async (): Promise<BigFish[]> => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(now.getDate() + 1);
        
        return fish.filter(f => {
            if (f.status !== 'Active Pool' || !f.campaign_end_date) return false;
            const end = new Date(f.campaign_end_date);
            return end <= tomorrow && end >= now;
        });
    },
    checkRetainerRenewals: async (): Promise<BigFish[]> => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);

        return fish.filter(f => {
            if (f.status !== 'Active Pool' || !f.is_retainer || !f.retainer_renewal_date) return false;
            const renew = new Date(f.retainer_renewal_date);
            return renew <= nextWeek; 
        });
    },
    renewRetainer: async (fishId: string) => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const f = fish.find(x => x.id === fishId);
        if (f && f.retainer_renewal_date) {
            const current = new Date(f.retainer_renewal_date);
            current.setDate(current.getDate() + 30); 
            f.retainer_renewal_date = current.toISOString().slice(0, 10);
            setStorage('big_fish', fish);
        }
    },
    addClientInteraction: async (fishId: string, interaction: Omit<ClientInteraction, 'id' | 'created_at'>) => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const f = fish.find(x => x.id === fishId);
        if (f) {
            if (!f.interactions) f.interactions = [];
            f.interactions.unshift({
                id: uuid(),
                created_at: new Date().toISOString(),
                ...interaction
            });
            setStorage('big_fish', fish);
        }
    },
    deleteClientInteraction: async (fishId: string, interactionId: string) => {
        const fish = getStorage<BigFish[]>('big_fish', []);
        const f = fish.find(x => x.id === fishId);
        if (f && f.interactions) {
            f.interactions = f.interactions.filter(i => i.id !== interactionId);
            setStorage('big_fish', fish);
        }
    },

    // --- PAYMENT METHODS ---
    getPaymentMethods: async (): Promise<PaymentMethod[]> => {
        return getStorage<PaymentMethod[]>('payment_methods', []);
    },
    savePaymentMethod: async (pm: Partial<PaymentMethod>) => {
        const list = getStorage<PaymentMethod[]>('payment_methods', []);
        list.push({ ...pm, id: uuid() } as PaymentMethod);
        setStorage('payment_methods', list);
    },
    deletePaymentMethod: async (id: string) => {
        let list = getStorage<PaymentMethod[]>('payment_methods', []);
        list = list.filter(p => p.id !== id);
        setStorage('payment_methods', list);
    },

    // --- SYSTEM SETTINGS ---
    getSystemSettings: async (): Promise<SystemSettings> => {
        return getStorage<SystemSettings>('system_settings', {
            facebook_page_token: '',
            facebook_verify_token: '',
            sms_api_key: '',
            sms_sender_id: '',
            sms_base_url: '',
            timezone: 'Asia/Dhaka',
            system_api_key: ''
        });
    },
    saveSystemSettings: async (s: SystemSettings) => {
        setStorage('system_settings', s);
    },

    // --- MESSENGER BABA (Mock) ---
    getMessengerConversations: async (): Promise<MessengerConversation[]> => {
        return getStorage<MessengerConversation[]>('messenger_convs', []);
    },
    simulateIncomingMessage: async (text: string, senderName: string) => {
        const convs = getStorage<MessengerConversation[]>('messenger_convs', []);
        let conv = convs.find(c => c.customer_name === senderName);
        
        if (!conv) {
            conv = {
                id: uuid(),
                facebook_user_id: 'fb_' + Math.floor(Math.random() * 10000),
                customer_name: senderName,
                messages: [],
                last_message: '',
                last_updated: new Date().toISOString(),
                is_lead_linked: false
            };
            convs.push(conv);
        }

        conv.messages.push({
            id: uuid(),
            sender: 'customer',
            type: 'text',
            content: text,
            timestamp: new Date().toISOString()
        });
        conv.last_message = text;
        conv.last_updated = new Date().toISOString();

        const phoneMatch = text.match(/(?:\+88|88)?01[3-9]\d{8}/);
        if (phoneMatch) {
            const phone = phoneMatch[0];
            conv.customer_phone = phone;
            
            const leads = await mockService.getLeads();
            const exists = leads.find(l => l.primary_phone === phone);
            
            if (!exists) {
                const newLead: Lead = {
                    id: uuid(),
                    full_name: senderName,
                    primary_phone: phone,
                    source: LeadSource.FACEBOOK_MESSENGER,
                    status: LeadStatus.NEW,
                    is_starred: false,
                    is_unread: true,
                    total_messages_sent: 0,
                    download_count: 0,
                    first_contact_at: new Date().toISOString(),
                    last_activity_at: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                };
                await mockService.createLead(newLead);
                conv.is_lead_linked = true;
            } else {
                conv.is_lead_linked = true;
            }
        }

        setStorage('messenger_convs', convs);
    },

    // --- SALES GOALS ---
    getSalesTargets: async (): Promise<MonthlyTarget[]> => {
        try {
            const res = await fetch(`${API_BASE}/sales_goals.php?action=get_targets`);
            if (res.ok) return await res.json();
        } catch (e) { console.warn("API Error", e); }
        return getStorage<MonthlyTarget[]>('sales_targets', []);
    },
    setSalesTarget: async (target: Omit<MonthlyTarget, 'id'>) => {
        // Local Update
        let targets = getStorage<MonthlyTarget[]>('sales_targets', []);
        const idx = targets.findIndex(t => t.month === target.month && t.service === target.service);
        const newTarget = { ...target, id: idx !== -1 ? targets[idx].id : uuid() };
        
        if (idx !== -1) {
            targets[idx] = { ...targets[idx], ...target };
        } else {
            targets.push(newTarget as MonthlyTarget);
        }
        setStorage('sales_targets', targets);

        // Server Update
        try {
            await fetch(`${API_BASE}/sales_goals.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'set_target', ...newTarget })
            });
        } catch (e) { console.error("API Error", e); }
    },
    getSalesEntries: async (): Promise<SalesEntry[]> => {
        try {
            const res = await fetch(`${API_BASE}/sales_goals.php?action=get_entries`);
            if (res.ok) return await res.json();
        } catch (e) { console.warn("API Error", e); }
        return getStorage<SalesEntry[]>('sales_entries', []);
    },
    addSalesEntry: async (entry: Partial<SalesEntry>) => {
        const newEntry = {
            id: uuid(),
            date: entry.date || new Date().toISOString(),
            service: entry.service!,
            amount: entry.amount!,
            description: entry.description!,
            created_at: new Date().toISOString()
        };
        
        // Local
        const entries = getStorage<SalesEntry[]>('sales_entries', []);
        entries.push(newEntry);
        setStorage('sales_entries', entries);

        // Server
        try {
            await fetch(`${API_BASE}/sales_goals.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add_entry', ...newEntry })
            });
        } catch (e) { console.error("API Error", e); }
    },
    updateSalesEntry: async (id: string, updates: Partial<SalesEntry>) => {
        // Local
        const entries = getStorage<SalesEntry[]>('sales_entries', []);
        const idx = entries.findIndex(e => e.id === id);
        if (idx !== -1) {
            entries[idx] = { ...entries[idx], ...updates };
            setStorage('sales_entries', entries);
        }

        // Server
        try {
            await fetch(`${API_BASE}/sales_goals.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_entry', id, ...updates })
            });
        } catch (e) { console.error("API Error", e); }
    },
    deleteSalesEntry: async (id: string) => {
        // Local
        let entries = getStorage<SalesEntry[]>('sales_entries', []);
        entries = entries.filter(e => e.id !== id);
        setStorage('sales_entries', entries);

        // Server
        try {
            await fetch(`${API_BASE}/sales_goals.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_entry', id })
            });
        } catch (e) { console.error("API Error", e); }
    },

    // --- LEAD CRM INTERACTIONS ---
    addLeadInteraction: async (leadId: string, interaction: Omit<ClientInteraction, 'id' | 'created_at'>) => {
        const leads = getStorage<Lead[]>('leads', FULL_DEMO_LEADS);
        const l = leads.find(x => x.id === leadId);
        if (l) {
            if (!l.interactions) l.interactions = [];
            l.interactions.unshift({
                id: uuid(),
                created_at: new Date().toISOString(),
                ...interaction
            });
            setStorage('leads', leads);
        }
    },
    deleteLeadInteraction: async (leadId: string, interactionId: string) => {
        const leads = getStorage<Lead[]>('leads', FULL_DEMO_LEADS);
        const l = leads.find(x => x.id === leadId);
        if (l && l.interactions) {
            l.interactions = l.interactions.filter(i => i.id !== interactionId);
            setStorage('leads', leads);
        }
    },

    // --- AD SWIPE FILE ---
    getAdInspirations: async (): Promise<AdInspiration[]> => {
        try {
            const res = await fetch(`${API_BASE}/ad_swipe.php`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) return data;
            }
        } catch(e) { console.warn("API Error, using local", e); }
        return getStorage<AdInspiration[]>('ad_swipe_file', []);
    },
    addAdInspiration: async (ad: Partial<AdInspiration>) => {
        const newAd = {
            id: uuid(),
            title: ad.title!,
            url: ad.url!,
            image_url: ad.image_url,
            category: ad.category || 'Other',
            notes: ad.notes || '',
            created_at: formatDateForMySQL(new Date().toISOString())
        };

        try {
            await fetch(`${API_BASE}/ad_swipe.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create',
                    ...newAd
                })
            });
        } catch(e) { console.warn("API Error", e); }

        const list = getStorage<AdInspiration[]>('ad_swipe_file', []);
        list.unshift(newAd as AdInspiration);
        setStorage('ad_swipe_file', list);
    },
    deleteAdInspiration: async (id: string) => {
        try {
            await fetch(`${API_BASE}/ad_swipe.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', id })
            });
        } catch(e) { console.warn("API Error", e); }

        let list = getStorage<AdInspiration[]>('ad_swipe_file', []);
        list = list.filter(a => a.id !== id);
        setStorage('ad_swipe_file', list);
    }
};