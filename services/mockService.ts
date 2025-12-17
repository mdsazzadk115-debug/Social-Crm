
// ... (previous imports)
import { 
  Lead, LeadStatus, LeadSource, Interaction, MessageTemplate, Campaign, 
  SimpleAutomationRule, LeadForm, Customer, Task, Invoice, Snippet, 
  Document, BigFish, PaymentMethod, MessengerConversation, SystemSettings,
  MonthlyTarget, SalesEntry, AdInspiration, ClientInteraction, Transaction,
  InvoiceItem, CampaignRecord, TopUpRequest, Channel, MessageDirection
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

const formatDateForMySQL = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
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
    // ... (Existing Lead Methods)
    getLeads: async (): Promise<Lead[]> => {
        try {
            const res = await fetch(`${API_BASE}/leads.php?_t=${Date.now()}`);
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
        const leads = getStorage<Lead[]>('leads', FULL_DEMO_LEADS);
        
        let existingLeadIndex = -1;
        if (lead.primary_phone) {
            const cleanNewPhone = lead.primary_phone.replace(/\D/g, '');
            existingLeadIndex = leads.findIndex(l => {
                const cleanExisting = l.primary_phone.replace(/\D/g, '');
                return cleanExisting === cleanNewPhone || l.primary_phone === lead.primary_phone;
            });
        }
            
        if (existingLeadIndex !== -1) {
            const existingLead = leads[existingLeadIndex];
            const mergedOnboarding = lead.onboarding_data 
                ? { ...existingLead.onboarding_data, ...lead.onboarding_data } 
                : existingLead.onboarding_data;

            const updatedLead = {
                ...existingLead,
                ...lead,
                id: existingLead.id,
                status: LeadStatus.NEW,
                last_activity_at: new Date().toISOString(),
                onboarding_data: mergedOnboarding
            };

            leads[existingLeadIndex] = updatedLead;
            setStorage('leads', leads);
            try {
                await fetch(`${API_BASE}/leads.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        action: 'update_lead_info', 
                        id: updatedLead.id, 
                        ...updatedLead,
                        onboarding_data: updatedLead.onboarding_data ? JSON.stringify(updatedLead.onboarding_data) : undefined
                    })
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
            industry: lead.industry,
            service_category: lead.service_category,
            facebook_profile_link: lead.facebook_profile_link,
            website_url: lead.website_url,
            is_starred: false,
            is_unread: true,
            total_messages_sent: 0,
            download_count: 0,
            first_contact_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            onboarding_data: lead.onboarding_data,
            ...lead
        } as Lead;

        try {
            await fetch(`${API_BASE}/leads.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newLead,
                    onboarding_data: JSON.stringify(newLead.onboarding_data || {}) 
                })
            });
        } catch (e) { }

        leads.unshift(newLead);
        setStorage('leads', leads);
        return newLead;
    },

    updateLead: async (id: string, updates: Partial<Lead>) => {
        const leads = getStorage<Lead[]>('leads', FULL_DEMO_LEADS);
        const index = leads.findIndex(l => l.id === id);
        let fullData = { ...updates };
        
        if (index !== -1) {
            leads[index] = { ...leads[index], ...updates };
            setStorage('leads', leads);
            fullData = { ...leads[index], ...updates };
        }

        try {
            await fetch(`${API_BASE}/leads.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'update_lead_info', 
                    id, 
                    ...fullData,
                    onboarding_data: fullData.onboarding_data ? JSON.stringify(fullData.onboarding_data) : undefined
                })
            });
        } catch (e) { }
    },
    
    getForms: async (): Promise<LeadForm[]> => { return getStorage<LeadForm[]>('lead_forms', INITIAL_LEAD_FORMS); },
    getFormById: async (id: string): Promise<LeadForm | undefined> => { const forms = await mockService.getForms(); return forms.find(f => f.id === id); },
    createForm: async (form: Omit<LeadForm, 'id' | 'created_at'>) => { 
        const newForm = { ...form, id: uuid(), created_at: new Date().toISOString() }; 
        const forms = getStorage<LeadForm[]>('lead_forms', INITIAL_LEAD_FORMS); 
        forms.push(newForm); 
        setStorage('lead_forms', forms); 
        try { await fetch(`${API_BASE}/forms.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', ...newForm }) }); } catch (e) { console.warn("API Error creating form", e); } 
    },
    updateForm: async (id: string, updates: Partial<LeadForm>) => { 
        const forms = getStorage<LeadForm[]>('lead_forms', INITIAL_LEAD_FORMS); 
        const idx = forms.findIndex(f => f.id === id); 
        if(idx !== -1) { forms[idx] = { ...forms[idx], ...updates }; setStorage('lead_forms', forms); }
        try { await fetch(`${API_BASE}/forms.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', id, updates }) }); } catch (e) { } 
    },
    deleteForm: async (id: string) => { 
        let forms = getStorage<LeadForm[]>('lead_forms', INITIAL_LEAD_FORMS); 
        forms = forms.filter(f => f.id !== id); 
        setStorage('lead_forms', forms); 
        try { await fetch(`${API_BASE}/forms.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) }); } catch (e) { } 
    },
    submitLeadForm: async (formId: string, data: any) => { 
        const newLead: Partial<Lead> = { 
            full_name: data.name, 
            primary_phone: data.phone, 
            source: LeadSource.FORM, 
            status: LeadStatus.NEW, 
            facebook_profile_link: data.facebook || data.website,
            website_url: data.website,
            industry: data.industry || 'Facebook Marketing',
            service_category: 'Sales Guarantee',
            onboarding_data: data.form_type === 'ONBOARDING' ? {
                current_plan: data.current_plan, 
                monthly_avg_budget: data.monthly_avg_budget, 
                product_price: data.product_price, 
                marketing_budget_willingness: data.marketing_budget_willingness
            } : undefined
        }; 
        await mockService.createLead(newLead); 
    },

    // ... (Customer, Task, Invoice methods)
    getCustomers: async (): Promise<Customer[]> => { try { const res = await fetch(`${API_BASE}/customers.php?action=get_customers&_t=${Date.now()}`); if (res.ok) return await res.json(); } catch (e) { console.warn("API Error", e); } return getStorage<Customer[]>('online_customers', []); },
    getCustomerCategories: async (): Promise<string[]> => { return getStorage<string[]>('customer_categories', ['Dress', 'Bag', 'Shoes', 'Watch', 'Gadget']); },
    addCustomerCategory: async (name: string) => { const cats = getStorage<string[]>('customer_categories', ['Dress', 'Bag', 'Shoes', 'Watch', 'Gadget']); if (!cats.includes(name)) { cats.push(name); setStorage('customer_categories', cats); } },
    deleteCustomerCategory: async (name: string) => { let cats = getStorage<string[]>('customer_categories', ['Dress', 'Bag', 'Shoes', 'Watch', 'Gadget']); cats = cats.filter(c => c !== name); setStorage('customer_categories', cats); },
    addBulkCustomers: async (lines: string[], category: string): Promise<number> => { let added = 0; const promises = lines.map(async (line) => { const phone = line.trim(); if (phone) { try { const res = await fetch(`${API_BASE}/customers.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add_customer', id: uuid(), phone, category, date_added: new Date().toISOString() }) }); const result = await res.json(); if (result.added) added++; } catch (e) { console.error("Error adding customer", e); } } }); await Promise.all(promises); return added; },
    deleteCustomer: async (id: string) => { try { await fetch(`${API_BASE}/customers.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete_customer', id }) }); } catch (e) { console.error("API Error", e); } },
    getTasks: async (): Promise<Task[]> => { try { const res = await fetch(`${API_BASE}/tasks.php?_t=${Date.now()}`); if (res.ok) { const data = await res.json(); if (Array.isArray(data)) return data; } else { console.warn(`Tasks API Error: ${res.status}`); } } catch (e) { console.warn("API Error", e); } return getStorage<Task[]>('tasks', []); },
    
    // UPDATED: Create Task with Logging
    createTask: async (text: string, dueDate?: string, leadId?: string) => { 
        const newTask = { id: uuid(), text, is_completed: false, created_at: new Date().toISOString(), due_date: dueDate, lead_id: leadId }; 
        try { await fetch(`${API_BASE}/tasks.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', ...newTask, created_at: formatDateForMySQL(newTask.created_at), due_date: dueDate ? formatDateForMySQL(dueDate) : null }) }); } catch (e) { console.error("API Error Creating Task", e); } 
        const tasks = getStorage<Task[]>('tasks', []); 
        tasks.push(newTask); 
        setStorage('tasks', tasks); 
        
        // AUTO LOGGING: If leadId is present, add to interactions
        if (leadId) {
            await mockService.addLeadInteraction(leadId, {
                type: 'TASK',
                date: new Date().toISOString(),
                notes: `Task Created: ${text} (Due: ${dueDate || 'No Date'})`,
            });
            // Also attempt to add to Big Fish if exists
            await mockService.addClientInteraction(leadId, {
                type: 'TASK',
                date: new Date().toISOString(),
                notes: `Task Created: ${text}`,
            });
        }
    },
    toggleTask: async (id: string) => { const tasks = getStorage<Task[]>('tasks', []); const t = tasks.find(x => x.id === id); if (t) { t.is_completed = !t.is_completed; setStorage('tasks', tasks); try { await fetch(`${API_BASE}/tasks.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle', id, is_completed: t.is_completed }) }); } catch (e) { console.error("API Error", e); } } },
    deleteTask: async (id: string) => { try { await fetch(`${API_BASE}/tasks.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) }); } catch (e) { console.error("API Error", e); } let tasks = getStorage<Task[]>('tasks', []); tasks = tasks.filter(t => t.id !== id); setStorage('tasks', tasks); },
    getInvoices: async (): Promise<Invoice[]> => { try { const res = await fetch(`${API_BASE}/invoices.php?_t=${Date.now()}`); if (res.ok) { const data = await res.json(); if (Array.isArray(data)) return data; } } catch(e) { console.warn("API Error, using local", e); } return getStorage<Invoice[]>('invoices', []); },
    
    // UPDATED: Create Invoice with Logging
    createInvoice: async (inv: Partial<Invoice>) => { 
        const invoices = getStorage<Invoice[]>('invoices', []); 
        const num = invoices.length + 1; 
        const padded = num.toString().padStart(4, '0'); 
        const newInv = { id: inv.id || uuid(), number: inv.number || `INV-${padded}`, client_name: inv.client_name!, client_phone: inv.client_phone, client_address: inv.client_address, items: inv.items || [], status: inv.status || 'new', date: inv.date || new Date().toISOString().slice(0, 10), created_at: formatDateForMySQL(new Date().toISOString()), paid_amount: inv.paid_amount || 0, terms_enabled: inv.terms_enabled || false, terms_content: inv.terms_content }; 
        try { await fetch(`${API_BASE}/invoices.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', ...newInv }) }); } catch(e) { console.warn("API Error", e); } 
        const idx = invoices.findIndex(i => i.id === newInv.id); 
        if (idx !== -1) { invoices[idx] = newInv as Invoice; } else { invoices.unshift(newInv as Invoice); } 
        setStorage('invoices', invoices); 

        // AUTO LOGGING: Find client by phone/name and log invoice creation
        if (inv.client_phone || inv.client_name) {
            const leads = await mockService.getLeads();
            const bigFish = await mockService.getBigFish();
            
            // Try matching
            const matchedLead = leads.find(l => 
                (inv.client_phone && l.primary_phone === inv.client_phone) || 
                l.full_name === inv.client_name
            );
            
            const matchedFish = bigFish.find(f => 
                (inv.client_phone && f.phone === inv.client_phone) || 
                f.name === inv.client_name
            );

            const totalAmount = newInv.items.reduce((s, i) => s + (i.quantity * i.rate), 0);
            const logMsg = `Invoice Created #${newInv.number}: ৳${totalAmount} (${newInv.status})`;

            if (matchedLead) {
                await mockService.addLeadInteraction(matchedLead.id, {
                    type: 'INVOICE',
                    date: new Date().toISOString(),
                    notes: logMsg
                });
            }
            if (matchedFish) {
                await mockService.addClientInteraction(matchedFish.id, {
                    type: 'INVOICE',
                    date: new Date().toISOString(),
                    notes: logMsg
                });
            }
        }
    },
    deleteInvoice: async (id: string) => { try { await fetch(`${API_BASE}/invoices.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) }); } catch(e) { console.warn("API Error", e); } let invoices = getStorage<Invoice[]>('invoices', []); invoices = invoices.filter(i => i.id !== id); setStorage('invoices', invoices); },
    getSnippets: async (): Promise<Snippet[]> => { return getStorage<Snippet[]>('snippets', FULL_SNIPPETS); },
    createSnippet: async (s: Partial<Snippet>) => { const snippets = getStorage<Snippet[]>('snippets', FULL_SNIPPETS); snippets.push({ ...s, id: uuid() } as Snippet); setStorage('snippets', snippets); },
    updateSnippet: async (id: string, updates: Partial<Snippet>) => { const snippets = getStorage<Snippet[]>('snippets', FULL_SNIPPETS); const idx = snippets.findIndex(s => s.id === id); if (idx !== -1) { snippets[idx] = { ...snippets[idx], ...updates }; setStorage('snippets', snippets); } },
    deleteSnippet: async (id: string) => { let snippets = getStorage<Snippet[]>('snippets', FULL_SNIPPETS); snippets = snippets.filter(s => s.id !== id); setStorage('snippets', snippets); },
    getDocuments: async (): Promise<Document[]> => { return getStorage<Document[]>('documents', []); },
    saveDocument: async (doc: Partial<Document>) => { const docs = getStorage<Document[]>('documents', []); docs.unshift({ id: uuid(), title: doc.title || 'Untitled', client_id: doc.client_id, client_name: doc.client_name, content: doc.content || '', created_at: new Date().toISOString() }); setStorage('documents', docs); },
    deleteDocument: async (id: string) => { let docs = getStorage<Document[]>('documents', []); docs = docs.filter(d => d.id !== id); setStorage('documents', docs); },
    
    getBigFish: async (): Promise<BigFish[]> => { 
        return getStorage<BigFish[]>('big_fish', DEMO_BIG_FISH); 
    },
    
    getBigFishById: async (id: string): Promise<BigFish | undefined> => { const fish = await mockService.getBigFish(); return fish.find(f => f.id === id); },
    createBigFish: async (data: Partial<BigFish>) => { const newFish = { id: uuid(), lead_id: uuid(), name: data.name!, phone: data.phone!, status: 'Active Pool', package_name: data.package_name, balance: 0, low_balance_alert_threshold: 10, total_budget: 0, spent_amount: 0, target_sales: 0, current_sales: 0, transactions: [], campaign_records: [], topup_requests: [], growth_tasks: [], reports: [], interactions: [], portal_config: { show_balance: true, show_history: true, is_suspended: false, feature_flags: { show_profit_analysis: true, show_cpr_metrics: true, allow_topup_request: true } }, start_date: new Date().toISOString() }; try { await fetch(`${API_BASE}/bigfish.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', ...newFish }) }); } catch(e) { console.warn("API Error", e); } const fish = getStorage<BigFish[]>('big_fish', []); fish.push(newFish as any); setStorage('big_fish', fish); },
    catchBigFish: async (leadId: string): Promise<boolean> => { const leads = await mockService.getLeads(); const lead = leads.find(l => l.id === leadId); if (!lead) return false; const fish = getStorage<BigFish[]>('big_fish', []); if (fish.some(f => f.lead_id === leadId)) return false; const newFish = { id: uuid(), lead_id: leadId, name: lead.full_name, phone: lead.primary_phone, status: 'Active Pool', package_name: lead.service_category, balance: 0, low_balance_alert_threshold: 10, total_budget: 0, spent_amount: 0, target_sales: 0, current_sales: 0, transactions: [], campaign_records: [], topup_requests: [], growth_tasks: [], reports: [], interactions: [], portal_config: { show_balance: true, show_history: true, is_suspended: false, feature_flags: { show_profit_analysis: true, show_cpr_metrics: true, allow_topup_request: true } }, start_date: new Date().toISOString() }; try { await fetch(`${API_BASE}/bigfish.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', ...newFish }) }); } catch(e) { console.warn("API Error", e); } fish.push(newFish as any); setStorage('big_fish', fish); return true; },
    toggleBigFishStatus: async (id: string) => { let fish = getStorage<BigFish[]>('big_fish', []); let f = fish.find(x => x.id === id); if (f) { f.status = f.status === 'Active Pool' ? 'Hall of Fame' : 'Active Pool'; if (f.status === 'Hall of Fame') f.end_date = new Date().toISOString(); else f.end_date = undefined; setStorage('big_fish', fish); try { await fetch(`${API_BASE}/bigfish.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', id, updates: { status: f.status, end_date: f.end_date } }) }); } catch (e) { console.error("API Error", e); } } },
    updateBigFish: async (id: string, updates: Partial<BigFish>) => { let fish = getStorage<BigFish[]>('big_fish', []); const idx = fish.findIndex(f => f.id === id); if(idx !== -1) { fish[idx] = { ...fish[idx], ...updates }; setStorage('big_fish', fish); } try { await fetch(`${API_BASE}/bigfish.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', id, updates }) }); } catch(e) { console.warn("API Error", e); } },
    
    // UPDATED: Add Transaction with Logging
    addTransaction: async (fishId: string, type: Transaction['type'], amount: number, desc: string, metadata?: any, dateOverride?: string): Promise<BigFish | undefined> => { 
        let fish = getStorage<BigFish[]>('big_fish', []); 
        let f = fish.find(x => x.id === fishId); 
        if (f) { 
            const tx: Transaction = { id: uuid(), date: dateOverride || new Date().toISOString(), type, amount, description: desc, metadata }; 
            f.transactions.unshift(tx); 
            const currentBalance = parseFloat(f.balance as any) || 0; 
            if (type === 'DEPOSIT') f.balance = currentBalance + amount; else f.balance = currentBalance - amount; 
            if (type === 'AD_SPEND') { 
                const currentSpent = parseFloat(f.spent_amount as any) || 0; f.spent_amount = currentSpent + amount; f.reports.unshift({ id: uuid(), date: dateOverride || new Date().toISOString(), task: `Ad Run: Spent $${amount} (${desc})` }); 
                if (metadata && metadata.leads) { if (metadata.resultType === 'SALES') { f.current_sales = (f.current_sales || 0) + metadata.leads; } } 
            } 
            
            // AUTO LOGGING
            if (!f.interactions) f.interactions = [];
            f.interactions.unshift({
                id: uuid(),
                type: 'BALANCE',
                date: new Date().toISOString(),
                created_at: new Date().toISOString(),
                notes: `${type === 'DEPOSIT' ? 'Added' : 'Deducted'} $${amount}: ${desc}`
            });

            setStorage('big_fish', fish); 
            try { await fetch(`${API_BASE}/bigfish.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add_transaction', id: tx.id, big_fish_id: fishId, type, amount, description: desc, date: tx.date, metadata }) }); } catch (e) { console.error("API Error", e); } return f; 
        } 
        return undefined; 
    },
    
    deleteTransaction: async (fishId: string, txId: string) => { let fish = getStorage<BigFish[]>('big_fish', []); let f = fish.find(x => x.id === fishId); let updates: Partial<BigFish> = {}; if (f) { const tx = f.transactions.find(t => t.id === txId); if (tx) { const currentBalance = parseFloat(f.balance as any) || 0; if (tx.type === 'DEPOSIT') { f.balance = currentBalance - tx.amount; } else { f.balance = currentBalance + tx.amount; } updates.balance = f.balance; if (tx.type === 'AD_SPEND') { const currentSpent = parseFloat(f.spent_amount as any) || 0; f.spent_amount = currentSpent - tx.amount; updates.spent_amount = f.spent_amount; if (tx.metadata && tx.metadata.resultType === 'SALES' && tx.metadata.leads) { const currentSales = (f.current_sales || 0); let newSales = currentSales - tx.metadata.leads; if (newSales < 0) newSales = 0; f.current_sales = newSales; updates.current_sales = newSales; } } f.transactions = f.transactions.filter(t => t.id !== txId); setStorage('big_fish', fish); } } try { await fetch(`${API_BASE}/bigfish.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete_transaction', id: txId, big_fish_id: fishId }) }); if (Object.keys(updates).length > 0) { await fetch(`${API_BASE}/bigfish.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', id: fishId, updates }) }); } } catch (e) { console.error("API Error during delete transaction", e); } },
    updateTransaction: async (fishId: string, txId: string, updates: { date: string, description: string, amount: number }) => { let fish = getStorage<BigFish[]>('big_fish', []); let f = fish.find(x => x.id === fishId); if (f) { const txIndex = f.transactions.findIndex(t => t.id === txId); if (txIndex !== -1) { const oldTx = f.transactions[txIndex]; let currentBalance = parseFloat(f.balance as any) || 0; if (oldTx.type === 'DEPOSIT') currentBalance -= oldTx.amount; else currentBalance += oldTx.amount; if (oldTx.type === 'AD_SPEND') { const currentSpent = parseFloat(f.spent_amount as any) || 0; f.spent_amount = currentSpent - oldTx.amount; } const newAmount = updates.amount; if (oldTx.type === 'DEPOSIT') currentBalance += newAmount; else currentBalance -= newAmount; if (oldTx.type === 'AD_SPEND') { const currentSpent = parseFloat(f.spent_amount as any) || 0; f.spent_amount = currentSpent + newAmount; } f.balance = currentBalance; f.transactions[txIndex] = { ...oldTx, ...updates }; setStorage('big_fish', fish); } } try { await fetch(`${API_BASE}/bigfish.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_transaction', id: txId, big_fish_id: fishId, ...updates }) }); } catch (e) { console.error("API Error during update transaction", e); } },
    addGrowthTask: async (fishId: string, title: string, dueDate?: string) => { let fish = getStorage<BigFish[]>('big_fish', []); let f = fish.find(x => x.id === fishId); if (f) { const newTask = { id: uuid(), title, is_completed: false, due_date: dueDate }; if(!f.growth_tasks) f.growth_tasks = []; f.growth_tasks.push(newTask); setStorage('big_fish', fish); try { await fetch(`${API_BASE}/bigfish.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add_task', id: fishId, task_id: newTask.id, title, due_date: dueDate }) }); } catch (e) { console.error("API Error", e); } } },
    toggleGrowthTask: async (fishId: string, taskId: string) => { const fish = getStorage<BigFish[]>('big_fish', []); const f = fish.find(x => x.id === fishId); if (f) { const t = f.growth_tasks.find(x => x.id === taskId); if (t) t.is_completed = !t.is_completed; setStorage('big_fish', fish); try { await fetch(`${API_BASE}/bigfish.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle_task', task_id: taskId }) }); } catch (e) { console.error("API Error", e); } } },
    updatePortalConfig: async (fishId: string, config: any) => { const fish = getStorage<BigFish[]>('big_fish', []); const f = fish.find(x => x.id === fishId); if (f) { f.portal_config = { ...f.portal_config, ...config }; setStorage('big_fish', fish); try { await fetch(`${API_BASE}/bigfish.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_config', id: fishId, config: f.portal_config }) }); } catch (e) { console.error("API Error", e); } } },
    updateTargets: async (fishId: string, target: number, current: number) => { const fish = getStorage<BigFish[]>('big_fish', []); const f = fish.find(x => x.id === fishId); if (f) { f.target_sales = target; f.current_sales = current; setStorage('big_fish', fish); try { await fetch(`${API_BASE}/bigfish.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_targets', id: fishId, target, current }) }); } catch (e) { console.error("API Error", e); } } },
    addWorkLog: async (fishId: string, task: string) => { let fish = getStorage<BigFish[]>('big_fish', []); let f = fish.find(x => x.id === fishId); if (f) { const newLog = { id: uuid(), date: new Date().toISOString(), task }; if(!f.reports) f.reports = []; f.reports.unshift(newLog); setStorage('big_fish', fish); try { await fetch(`${API_BASE}/bigfish.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add_log', id: fishId, log_id: newLog.id, task, date: newLog.date }) }); } catch (e) { console.error("API Error", e); } } },
    checkExpiringCampaigns: async (): Promise<BigFish[]> => { const fish = getStorage<BigFish[]>('big_fish', []); const now = new Date(); const tomorrow = new Date(); tomorrow.setDate(now.getDate() + 1); return fish.filter(f => { if (f.status !== 'Active Pool' || !f.campaign_end_date) return false; const end = new Date(f.campaign_end_date); return end <= tomorrow && end >= now; }); },
    checkRetainerRenewals: async (): Promise<BigFish[]> => { const fish = getStorage<BigFish[]>('big_fish', []); const now = new Date(); const nextWeek = new Date(); nextWeek.setDate(now.getDate() + 7); return fish.filter(f => { if (f.status !== 'Active Pool' || !f.is_retainer || !f.retainer_renewal_date) return false; const renew = new Date(f.retainer_renewal_date); return renew <= nextWeek; }); },
    renewRetainer: async (fishId: string) => { const fish = getStorage<BigFish[]>('big_fish', []); const f = fish.find(x => x.id === fishId); if (f && f.retainer_renewal_date) { const current = new Date(f.retainer_renewal_date); current.setDate(current.getDate() + 30); f.retainer_renewal_date = current.toISOString().slice(0, 10); setStorage('big_fish', fish); } },
    addClientInteraction: async (fishId: string, interaction: Omit<ClientInteraction, 'id' | 'created_at'>) => { const fish = getStorage<BigFish[]>('big_fish', []); const f = fish.find(x => x.id === fishId); if (f) { if (!f.interactions) f.interactions = []; f.interactions.unshift({ id: uuid(), created_at: new Date().toISOString(), ...interaction }); setStorage('big_fish', fish); } },
    deleteClientInteraction: async (fishId: string, interactionId: string) => { const fish = getStorage<BigFish[]>('big_fish', []); const f = fish.find(x => x.id === fishId); if (f && f.interactions) { f.interactions = f.interactions.filter(i => i.id !== interactionId); setStorage('big_fish', fish); } },
    
    // UPDATED: Add Campaign Record with Logging
    addCampaignRecord: async (fishId: string, record: Omit<CampaignRecord, 'id' | 'created_at'>): Promise<BigFish | undefined> => { 
        let fish = getStorage<BigFish[]>('big_fish', []); 
        let f = fish.find(x => x.id === fishId); 
        if (f) { 
            const newRecord: CampaignRecord = { id: uuid(), created_at: new Date().toISOString(), ...record }; 
            if(!f.campaign_records) f.campaign_records = []; f.campaign_records.unshift(newRecord); 
            const currentBalance = parseFloat(f.balance as any) || 0; 
            const currentSpent = parseFloat(f.spent_amount as any) || 0; 
            const spend = parseFloat(record.amount_spent as any) || 0; 
            f.balance = currentBalance - spend; 
            f.spent_amount = currentSpent + spend; 
            if (record.result_type === 'SALES') { f.current_sales = (f.current_sales || 0) + (record.results_count || 0); } 
            
            const tx: Transaction = { id: uuid(), date: record.end_date, type: 'AD_SPEND', amount: spend, description: `Campaign: ${new Date(record.start_date).toLocaleDateString()} - ${new Date(record.end_date).toLocaleDateString()}`, metadata: { impressions: record.impressions, reach: record.reach, leads: record.results_count, resultType: record.result_type } }; 
            f.transactions.unshift(tx); 
            
            // AUTO LOGGING
            if (!f.interactions) f.interactions = [];
            f.interactions.unshift({
                id: uuid(),
                type: record.result_type === 'SALES' ? 'SALE' : 'BALANCE', // Treat message spend as balance update log
                date: new Date().toISOString(),
                created_at: new Date().toISOString(),
                notes: `Campaign Log: Spent $${spend} for ${record.results_count} ${record.result_type.toLowerCase()}`
            });

            setStorage('big_fish', fish); 
            try { await fetch(`${API_BASE}/bigfish.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', id: fishId, updates: { balance: f.balance, spent_amount: f.spent_amount, current_sales: f.current_sales, campaign_records: f.campaign_records, transactions: f.transactions } }) }); } catch (e) { console.error("API Error syncing campaign record", e); } return f; 
        } 
        return undefined; 
    },
    
    deleteCampaignRecord: async (fishId: string, recordId: string) => { let fish = getStorage<BigFish[]>('big_fish', []); let f = fish.find(x => x.id === fishId); if (f && f.campaign_records) { const rec = f.campaign_records.find(r => r.id === recordId); if (rec) { const currentBalance = parseFloat(f.balance as any) || 0; const currentSpent = parseFloat(f.spent_amount as any) || 0; f.balance = currentBalance + rec.amount_spent; f.spent_amount = currentSpent - rec.amount_spent; if (rec.result_type === 'SALES') { f.current_sales = Math.max(0, (f.current_sales || 0) - rec.results_count); } f.campaign_records = f.campaign_records.filter(r => r.id !== recordId); setStorage('big_fish', fish); try { await fetch(`${API_BASE}/bigfish.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', id: fishId, updates: { balance: f.balance, spent_amount: f.spent_amount, current_sales: f.current_sales, campaign_records: f.campaign_records } }) }); } catch (e) { console.error("API Error deleting campaign record", e); } } } },
    createTopUpRequest: async (request: Omit<TopUpRequest, 'id' | 'created_at' | 'status'>) => { let fish = getStorage<BigFish[]>('big_fish', []); let f = fish.find(x => x.id === request.client_id); if (f) { const newReq: TopUpRequest = { id: uuid(), created_at: new Date().toISOString(), status: 'PENDING', ...request }; if(!f.topup_requests) f.topup_requests = []; f.topup_requests.unshift(newReq); setStorage('big_fish', fish); try { await fetch(`${API_BASE}/bigfish.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create_topup', ...newReq }) }); } catch (e) { console.error("API Error", e); } } },
    approveTopUpRequest: async (fishId: string, reqId: string) => { let fish = getStorage<BigFish[]>('big_fish', []); let f = fish.find(x => x.id === fishId); if (f && f.topup_requests) { const req = f.topup_requests.find(r => r.id === reqId); if (req && req.status === 'PENDING') { req.status = 'APPROVED'; await mockService.addTransaction( fishId, 'DEPOSIT', req.amount, `Top-up via ${req.method_name} (${req.sender_number})`, null, new Date().toISOString() ); setStorage('big_fish', fish); try { await fetch(`${API_BASE}/bigfish.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_topup_status', id: reqId, status: 'APPROVED' }) }); } catch (e) { console.error("API Error", e); } } } },
    rejectTopUpRequest: async (fishId: string, reqId: string) => { let fish = getStorage<BigFish[]>('big_fish', []); let f = fish.find(x => x.id === fishId); if (f && f.topup_requests) { const req = f.topup_requests.find(r => r.id === reqId); if (req) { req.status = 'REJECTED'; setStorage('big_fish', fish); try { await fetch(`${API_BASE}/bigfish.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_topup_status', id: reqId, status: 'REJECTED' }) }); } catch (e) { console.error("API Error", e); } } } },
    deleteTopUpRequest: async (fishId: string, reqId: string) => { let fish = getStorage<BigFish[]>('big_fish', []); let f = fish.find(x => x.id === fishId); if (f && f.topup_requests) { f.topup_requests = f.topup_requests.filter(r => r.id !== reqId); setStorage('big_fish', fish); try { await fetch(`${API_BASE}/bigfish.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete_topup', id: reqId }) }); } catch (e) { console.error("API Error", e); } } },
    getPaymentMethods: async (): Promise<PaymentMethod[]> => { return getStorage<PaymentMethod[]>('payment_methods', []); },
    savePaymentMethod: async (pm: Partial<PaymentMethod>) => { const list = getStorage<PaymentMethod[]>('payment_methods', []); list.push({ ...pm, id: uuid() } as PaymentMethod); setStorage('payment_methods', list); },
    deletePaymentMethod: async (id: string) => { let list = getStorage<PaymentMethod[]>('payment_methods', []); list = list.filter(p => p.id !== id); setStorage('payment_methods', list); },
    getSystemSettings: async (): Promise<SystemSettings> => { try { const res = await fetch(`${API_BASE}/settings.php?_t=${Date.now()}`); if (res.ok) { const data = await res.json(); if (data && !Array.isArray(data) && typeof data === 'object') return data; } } catch (e) { } return getStorage<SystemSettings>('system_settings', { facebook_page_token: '', facebook_verify_token: '', sms_api_key: '', sms_sender_id: '', sms_base_url: '', timezone: 'Asia/Dhaka', system_api_key: '', portal_support_phone: '', portal_support_url: '', portal_fb_group: '' }); },
    saveSystemSettings: async (s: SystemSettings) => { try { const res = await fetch(`${API_BASE}/settings.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', ...s }) }); const text = await res.text(); let data; try { data = JSON.parse(text); } catch(e) { console.error("Invalid JSON from server", text); throw new Error("Invalid server response. Check console."); } if (!res.ok || data.error) { throw new Error(data.error || "Server returned error"); } console.log("Settings saved:", data); } catch (e) { console.error("API Error", e); throw e; } setStorage('system_settings', s); },
    getMessengerConversations: async (): Promise<MessengerConversation[]> => { try { const res = await fetch(`${API_BASE}/messenger.php?action=get_conversations&_t=${Date.now()}`); if (res.ok) { return await res.json(); } } catch (e) { console.error("Messenger API Error", e); } return getStorage<MessengerConversation[]>('messenger_convs', []); },
    simulateIncomingMessage: async (text: string, recipientId: string) => { try { await fetch(`${API_BASE}/messenger.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send_message', recipient_id: recipientId, message: text }) }); } catch (e) { console.error("Send API Error", e); } },
    getSalesTargets: async (): Promise<MonthlyTarget[]> => { try { const res = await fetch(`${API_BASE}/sales_goals.php?action=get_targets&_t=${Date.now()}`); if (res.ok) return await res.json(); } catch (e) { console.warn("API Error", e); } return getStorage<MonthlyTarget[]>('sales_targets', []); },
    setSalesTarget: async (target: Omit<MonthlyTarget, 'id'>) => { let targets = getStorage<MonthlyTarget[]>('sales_targets', []); const idx = targets.findIndex(t => t.month === target.month && t.service === target.service); const newTarget = { ...target, id: idx !== -1 ? targets[idx].id : uuid() }; if (idx !== -1) { targets[idx] = { ...targets[idx], ...target }; } else { targets.push(newTarget as MonthlyTarget); } setStorage('sales_targets', targets); try { await fetch(`${API_BASE}/sales_goals.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'set_target', ...newTarget }) }); } catch (e) { console.error("API Error", e); } },
    getSalesEntries: async (): Promise<SalesEntry[]> => { try { const res = await fetch(`${API_BASE}/sales_goals.php?action=get_entries&_t=${Date.now()}`); if (res.ok) return await res.json(); } catch (e) { console.warn("API Error", e); } return getStorage<SalesEntry[]>('sales_entries', []); },
    addSalesEntry: async (entry: Partial<SalesEntry>) => { const newEntry = { id: uuid(), date: entry.date || new Date().toISOString(), service: entry.service!, amount: entry.amount!, description: entry.description!, created_at: new Date().toISOString() }; const entries = getStorage<SalesEntry[]>('sales_entries', []); entries.push(newEntry); setStorage('sales_entries', entries); try { await fetch(`${API_BASE}/sales_goals.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add_entry', ...newEntry }) }); } catch (e) { console.error("API Error", e); } },
    updateSalesEntry: async (id: string, updates: Partial<SalesEntry>) => { const entries = getStorage<SalesEntry[]>('sales_entries', []); const idx = entries.findIndex(e => e.id === id); if (idx !== -1) { entries[idx] = { ...entries[idx], ...updates }; setStorage('sales_entries', entries); } try { await fetch(`${API_BASE}/sales_goals.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_entry', id, ...updates }) }); } catch (e) { console.error("API Error", e); } },
    deleteSalesEntry: async (id: string) => { let entries = getStorage<SalesEntry[]>('sales_entries', []); entries = entries.filter(e => e.id !== id); setStorage('sales_entries', entries); try { await fetch(`${API_BASE}/sales_goals.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete_entry', id }) }); } catch (e) { console.error("API Error", e); } },
    addLeadInteraction: async (leadId: string, interaction: Omit<ClientInteraction, 'id' | 'created_at'>) => { const leads = getStorage<Lead[]>('leads', FULL_DEMO_LEADS); const l = leads.find(x => x.id === leadId); if (l) { if (!l.interactions) l.interactions = []; l.interactions.unshift({ id: uuid(), created_at: new Date().toISOString(), ...interaction }); setStorage('leads', leads); } },
    deleteLeadInteraction: async (leadId: string, interactionId: string) => { const leads = getStorage<Lead[]>('leads', FULL_DEMO_LEADS); const l = leads.find(x => x.id === leadId); if (l && l.interactions) { l.interactions = l.interactions.filter(i => i.id !== interactionId); setStorage('leads', leads); } },
    getAdInspirations: async (): Promise<AdInspiration[]> => { let apiData: AdInspiration[] = []; let apiSuccess = false; try { const res = await fetch(`${API_BASE}/ad_swipe.php?_t=${Date.now()}`); if (res.ok) { const data = await res.json(); if (Array.isArray(data)) { apiData = data; apiSuccess = true; } } } catch(e) { } const localData = getStorage<AdInspiration[]>('ad_swipe_file', []); if (apiSuccess && apiData.length > 0) { return apiData; } if (apiSuccess && apiData.length === 0 && localData.length > 0) { return localData; } return apiSuccess ? apiData : localData; },
    addAdInspiration: async (ad: Partial<AdInspiration>): Promise<AdInspiration> => { const newAd: AdInspiration = { id: uuid(), title: ad.title!, url: ad.url!, image_url: ad.image_url || '', category: ad.category || 'Other', notes: ad.notes || '', created_at: formatDateForMySQL(new Date().toISOString()) || new Date().toISOString() }; try { await fetch(`${API_BASE}/ad_swipe.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', ...newAd }) }); } catch(e) { console.warn("API Error", e); } const list = getStorage<AdInspiration[]>('ad_swipe_file', []); list.unshift(newAd); setStorage('ad_swipe_file', list); return newAd; },
    deleteAdInspiration: async (id: string) => { try { await fetch(`${API_BASE}/ad_swipe.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) }); } catch(e) { console.warn("API Error", e); } let list = getStorage<AdInspiration[]>('ad_swipe_file', []); list = list.filter(a => a.id !== id); setStorage('ad_swipe_file', list); },

    triggerAutomationCheck: async () => {
        console.log("Checking for automated actions...");
        return true;
    },

    getIndustries: async (): Promise<string[]> => {
        return getStorage<string[]>('industries', INDUSTRIES);
    },

    addIndustry: async (name: string) => {
        const list = getStorage<string[]>('industries', INDUSTRIES);
        if(!list.includes(name)) {
            list.push(name);
            setStorage('industries', list);
        }
    },

    deleteIndustry: async (name: string) => {
        let list = getStorage<string[]>('industries', INDUSTRIES);
        list = list.filter(i => i !== name);
        setStorage('industries', list);
    },

    updateLeadStatus: async (id: string, status: LeadStatus) => {
        return mockService.updateLead(id, { status });
    },

    updateLeadIndustry: async (id: string, industry: string) => {
        return mockService.updateLead(id, { industry });
    },

    toggleLeadStar: async (id: string) => {
        const lead = await mockService.getLeadById(id);
        if (lead) {
            return mockService.updateLead(id, { is_starred: !lead.is_starred });
        }
    },

    updateLeadNote: async (id: string, note: string) => {
        return mockService.updateLead(id, { quick_note: note });
    },

    incrementDownloadCount: async (ids: string[]) => {
        const leads = await mockService.getLeads();
        const updatedLeads = leads.map(l => {
            if (ids.includes(l.id)) {
                return { ...l, download_count: (l.download_count || 0) + 1 };
            }
            return l;
        });
        setStorage('leads', updatedLeads);
    },

    getInteractions: async (leadId: string): Promise<Interaction[]> => {
        return [
            {
                id: uuid(),
                lead_id: leadId,
                channel: Channel.MESSENGER,
                direction: MessageDirection.INCOMING,
                content: "Is this service still available?",
                created_at: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: uuid(),
                lead_id: leadId,
                channel: Channel.SMS,
                direction: MessageDirection.OUTGOING,
                content: "Yes, we are open. How can I help?",
                created_at: new Date(Date.now() - 3600000).toISOString()
            }
        ];
    },

    getTemplates: async (): Promise<MessageTemplate[]> => {
        return getStorage<MessageTemplate[]>('templates', FULL_TEMPLATES);
    },

    createTemplate: async (template: Partial<MessageTemplate>) => {
        const templates = await mockService.getTemplates();
        const newTemplate = { ...template, id: uuid() } as MessageTemplate;
        templates.push(newTemplate);
        setStorage('templates', templates);
        return newTemplate;
    },

    updateTemplate: async (id: string, updates: Partial<MessageTemplate>) => {
        const templates = await mockService.getTemplates();
        const index = templates.findIndex(t => t.id === id);
        if (index !== -1) {
            templates[index] = { ...templates[index], ...updates };
            setStorage('templates', templates);
        }
    },

    deleteTemplate: async (id: string) => {
        let templates = await mockService.getTemplates();
        templates = templates.filter(t => t.id !== id);
        setStorage('templates', templates);
    },

    getCampaigns: async (): Promise<Campaign[]> => {
        return getStorage<Campaign[]>('campaigns', []);
    },

    createCampaign: async (campaign: Partial<Campaign>) => {
        const campaigns = await mockService.getCampaigns();
        const newCampaign = { ...campaign, id: uuid(), active_leads_count: 0 } as Campaign;
        campaigns.push(newCampaign);
        setStorage('campaigns', campaigns);
        return newCampaign;
    },

    getSimpleAutomationRules: async (): Promise<SimpleAutomationRule[]> => {
        return getStorage<SimpleAutomationRule[]>('automation_rules', []);
    },

    saveSimpleAutomationRule: async (status: LeadStatus, steps: any[]) => {
        const rules = await mockService.getSimpleAutomationRules();
        const index = rules.findIndex(r => r.status === status);
        if (index !== -1) {
            rules[index].steps = steps;
        } else {
            rules.push({ id: uuid(), status, steps, is_active: true });
        }
        setStorage('automation_rules', rules);
    },

    resolvePhoneNumbersToIds: async (phoneNumbers: string[]): Promise<string[]> => {
        const leads = await mockService.getLeads();
        const ids: string[] = [];
        
        for (const phone of phoneNumbers) {
            let existing = leads.find(l => l.primary_phone === phone);
            if (existing) {
                ids.push(existing.id);
            } else {
                const newLead = await mockService.createLead({
                    full_name: 'Unknown',
                    primary_phone: phone,
                    source: LeadSource.MANUAL,
                    status: LeadStatus.NEW
                });
                ids.push(newLead.id);
            }
        }
        return ids;
    },

    scheduleBulkMessages: async (leadIds: string[], messages: any[]) => {
        console.log(`Scheduled messages for ${leadIds.length} leads.`);
        return true;
    },

    sendBulkSMS: async (leadIds: string[], messageBody: string) => {
        console.log(`Sent SMS to ${leadIds.length} leads: ${messageBody}`);
        
        // AUTO LOGGING: Record SMS sending in interactions
        for (const leadId of leadIds) {
            await mockService.addLeadInteraction(leadId, {
                type: 'OTHER',
                date: new Date().toISOString(),
                notes: `SMS Sent: ${messageBody.substring(0, 50)}...`,
            });
            // Try matching BigFish
            await mockService.addClientInteraction(leadId, {
                type: 'OTHER',
                date: new Date().toISOString(),
                notes: `SMS Sent: ${messageBody.substring(0, 50)}...`,
            });
        }
        return true;
    },
};
