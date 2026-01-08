
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

// Helper for MySQL Date (YYYY-MM-DD HH:MM:SS)
const getMySQLDate = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

// Helper for local storage
const getStorage = <T>(key: string, defaultValue: T): T => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
};

const setStorage = <T>(key: string, data: T): void => {
    localStorage.setItem(key, JSON.stringify(data));
};

/**
 * Safer Fetch Wrapper
 * Prevents "Unexpected end of JSON input" by checking if response has content
 */
const safeFetch = async (url: string, options?: RequestInit) => {
    const res = await fetch(url, options);
    const text = await res.text();
    
    if (!res.ok) {
        throw new Error(`Server Error (${res.status}): ${text.substring(0, 100)}`);
    }

    if (!text || text.trim() === "") {
        return null;
    }

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
        } catch (e) {
            // console.warn("Leads API failed, using local fallback", e);
        }
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
            ...lead
        } as Lead;

        const leads = getStorage<Lead[]>('sae_leads', DEMO_LEADS as Lead[]);
        setStorage('sae_leads', [newLead, ...leads]);

        try {
            await fetch(`${API_BASE}/leads.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', ...newLead })
            });
        } catch (e) { console.error("API Create Error", e); }
    },

    updateLead: async (id: string, updates: Partial<Lead>): Promise<void> => {
        const leads = getStorage<Lead[]>('sae_leads', DEMO_LEADS as Lead[]);
        
        // FIX: Find existing lead to merge data properly
        const existingLead = leads.find(l => l.id === id);
        const fullUpdatedLead = existingLead 
            ? { ...existingLead, ...updates, last_activity_at: new Date().toISOString() }
            : { ...updates, id } as Lead;

        const updatedList = leads.map(l => l.id === id ? fullUpdatedLead : l);
        setStorage('sae_leads', updatedList);

        try {
            // FIX: Send the FULL MERGED OBJECT to API, not just the updates.
            // This prevents the PHP script from wiping out missing fields.
            await fetch(`${API_BASE}/leads.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update', id, ...fullUpdatedLead }) 
            });
        } catch (e) { console.error("API Update Error", e); }
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
            const data = await safeFetch(`${API_BASE}/big_fish.php`);
            if (Array.isArray(data)) return data;
        } catch (e) {
            // console.error("BigFish API Error", e);
        }
        return getStorage<BigFish[]>('sae_big_fish', DEMO_BIG_FISH);
    },

    getBigFishById: async (id: string): Promise<BigFish | undefined> => {
        const allFish = await mockService.getBigFish();
        return allFish.find(f => f.id === id);
    },

    createBigFish: async (fish: Partial<BigFish>): Promise<void> => {
        const allFish = getStorage<BigFish[]>('sae_big_fish', DEMO_BIG_FISH);
        const newFish = { id: uuid(), ...fish } as BigFish;
        setStorage('sae_big_fish', [newFish, ...allFish]);

        try {
            await fetch(`${API_BASE}/big_fish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', ...newFish })
            });
        } catch (e) { console.error("API Create Error", e); }
    },

    updateBigFish: async (id: string, updates: Partial<BigFish>): Promise<void> => {
        const allFish = getStorage<BigFish[]>('sae_big_fish', DEMO_BIG_FISH);
        const updated = allFish.map(f => f.id === id ? { ...f, ...updates } : f);
        setStorage('sae_big_fish', updated);

        try {
            await fetch(`${API_BASE}/big_fish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update', id, updates: updates })
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
            id: uuid(),
            lead_id: lead.id,
            name: lead.full_name,
            phone: lead.primary_phone,
            facebook_page: lead.facebook_profile_link,
            website_url: lead.website_url,
            status: 'Active Pool',
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
                    show_profit_loss_report: true,
                    show_payment_methods: true
                }
            }
        };

        await mockService.createBigFish(newFish);
        
        // FIX: Ensure we update the lead with FULL data, not just status
        const leadUpdatePayload = { ...lead, status: LeadStatus.CLOSED_WON };
        await mockService.updateLead(leadId, leadUpdatePayload);
        
        return newFish as BigFish;
    },

    toggleBigFishStatus: async (id: string): Promise<void> => {
        const fish = await mockService.getBigFishById(id);
        if (fish) await mockService.updateBigFish(id, { status: fish.status === 'Active Pool' ? 'Hall of Fame' : 'Active Pool' });
    },

    // --- TRANSACTIONS & PERFORMANCE ---
    addTransaction: async (fishId: string, type: 'DEPOSIT' | 'DEDUCT' | 'AD_SPEND' | 'SERVICE_CHARGE', amount: number, description: string): Promise<void> => {
        const allFish = getStorage<BigFish[]>('sae_big_fish', DEMO_BIG_FISH);
        const newTx: Transaction = {
            id: uuid(),
            date: new Date().toISOString(),
            type,
            amount,
            description
        };
        
        const updated = allFish.map(f => {
            if (f.id === fishId) {
                const newBalance = type === 'DEPOSIT' ? (f.balance + amount) : (f.balance - amount);
                const newSpent = type === 'AD_SPEND' ? (f.spent_amount + amount) : f.spent_amount;
                return { 
                    ...f, 
                    balance: newBalance, 
                    spent_amount: newSpent,
                    transactions: [newTx, ...(f.transactions || [])]
                };
            }
            return f;
        });
        setStorage('sae_big_fish', updated);

        try {
            await fetch(`${API_BASE}/big_fish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'add_transaction', 
                    id: newTx.id, 
                    big_fish_id: fishId, 
                    type, 
                    amount, 
                    description, 
                    date: newTx.date 
                })
            });
        } catch (e) { console.error("API Tx Error", e); }
    },

    updateTransaction: async (fishId: string, txId: string, updates: Partial<Transaction>): Promise<void> => {
        try {
            await fetch(`${API_BASE}/big_fish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_transaction', big_fish_id: fishId, transaction_id: txId, ...updates })
            });
        } catch (e) { console.error("API Tx Update Error", e); }
    },

    deleteTransaction: async (fishId: string, txId: string): Promise<void> => {
        try {
            await fetch(`${API_BASE}/big_fish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_transaction', transaction_id: txId })
            });
        } catch (e) { console.error("API Tx Delete Error", e); }
    },

    addCampaignRecord: async (fishId: string, record: Omit<CampaignRecord, 'id' | 'created_at'>): Promise<BigFish | undefined> => { 
        const id = uuid();
        try {
            const data = await safeFetch(`${API_BASE}/big_fish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'add_campaign_record', 
                    id, 
                    big_fish_id: fishId, 
                    ...record 
                })
            });
            
            if (data && data.id) {
                return data as BigFish;
            }

            console.warn("API did not return updated fish object, falling back to fetch.");
            return await mockService.getBigFishById(fishId);
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

    // --- TOP UP REQUESTS ---
    createTopUpRequest: async (req: Omit<TopUpRequest, 'id' | 'status' | 'created_at'>): Promise<void> => {
        const newReq: TopUpRequest = {
            id: uuid(),
            status: 'PENDING',
            created_at: new Date().toISOString(),
            ...req
        };

        try {
            const res = await fetch(`${API_BASE}/big_fish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create_topup_request', id: newReq.id, ...req })
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Server failed: ${errorText}`);
            }

            const responseData = await res.json();
            if (responseData.error) {
                throw new Error(responseData.error);
            }

            const allFish = getStorage<BigFish[]>('sae_big_fish', DEMO_BIG_FISH);
            const updatedFish = allFish.map(f => {
                if (f.id === req.client_id) {
                    return { 
                        ...f, 
                        topup_requests: [newReq, ...(f.topup_requests || [])] 
                    };
                }
                return f;
            });
            setStorage('sae_big_fish', updatedFish);

        } catch (e: any) {
            console.error("TopUp Error", e);
            throw e;
        }
    },

    approveTopUpRequest: async (fishId: string, reqId: string): Promise<void> => {
        const allFish = getStorage<BigFish[]>('sae_big_fish', DEMO_BIG_FISH);
        const updatedFish = allFish.map(f => {
            if (f.id === fishId && f.topup_requests) {
                const req = f.topup_requests.find(r => r.id === reqId);
                if (req && req.status === 'PENDING') {
                    const newTx: Transaction = {
                        id: uuid(),
                        date: new Date().toISOString(),
                        type: 'DEPOSIT',
                        amount: req.amount,
                        description: `Top-up Approved: ${req.method_name} (${req.sender_number})`
                    };
                    return {
                        ...f,
                        balance: (f.balance || 0) + req.amount,
                        transactions: [newTx, ...(f.transactions || [])],
                        topup_requests: f.topup_requests.map(r => r.id === reqId ? { ...r, status: 'APPROVED' } : r)
                    };
                }
            }
            return f;
        });
        setStorage('sae_big_fish', updatedFish);

        try {
            await fetch(`${API_BASE}/big_fish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_topup_status', request_id: reqId, status: 'APPROVED' })
            });
        } catch (e) { console.error("TopUp Approve Error", e); }
    },

    rejectTopUpRequest: async (fishId: string, reqId: string): Promise<void> => {
        const allFish = getStorage<BigFish[]>('sae_big_fish', DEMO_BIG_FISH);
        const updatedFish = allFish.map(f => {
            if (f.id === fishId && f.topup_requests) {
                return {
                    ...f,
                    topup_requests: f.topup_requests.map(r => r.id === reqId ? { ...r, status: 'REJECTED' } : r)
                };
            }
            return f;
        });
        setStorage('sae_big_fish', updatedFish);

        try {
            await fetch(`${API_BASE}/big_fish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_topup_status', request_id: reqId, status: 'REJECTED' })
            });
        } catch (e) { console.error("TopUp Reject Error", e); }
    },

    deleteTopUpRequest: async (fishId: string, reqId: string): Promise<void> => {
        const allFish = getStorage<BigFish[]>('sae_big_fish', DEMO_BIG_FISH);
        const updatedFish = allFish.map(f => {
            if (f.id === fishId && f.topup_requests) {
                return {
                    ...f,
                    topup_requests: f.topup_requests.filter(r => r.id !== reqId)
                };
            }
            return f;
        });
        setStorage('sae_big_fish', updatedFish);

        try {
            await fetch(`${API_BASE}/big_fish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_topup_request', request_id: reqId })
            });
        } catch (e) { console.error("TopUp Delete Error", e); }
    },

    // --- GROWTH TASKS ---
    addGrowthTask: async (fishId: string, title: string, dueDate?: string): Promise<void> => {
        try {
            await fetch(`${API_BASE}/big_fish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add_growth_task', id: uuid(), big_fish_id: fishId, title, due_date: dueDate })
            });
        } catch (e) { console.error("Task Add Error", e); }
    },

    toggleGrowthTask: async (fishId: string, taskId: string): Promise<void> => {
        try {
            await fetch(`${API_BASE}/big_fish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'toggle_growth_task', task_id: taskId })
            });
        } catch (e) { console.error("Task Toggle Error", e); }
    },

    updateTargets: async (fishId: string, target: number, current: number): Promise<void> => {
        const allFish = getStorage<BigFish[]>('sae_big_fish', DEMO_BIG_FISH);
        const updated = allFish.map(f => f.id === fishId ? { ...f, target_sales: target, current_sales: current } : f);
        setStorage('sae_big_fish', updated);

        try {
            await fetch(`${API_BASE}/big_fish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'update_targets',
                    id: fishId, 
                    target: target, 
                    current: current 
                })
            });
        } catch (e) { 
            console.error("API Target Update Error", e); 
        }
    },

    // --- CRM / INTERACTIONS ---
    addClientInteraction: async (fishId: string, interaction: Partial<ClientInteraction>): Promise<void> => {
        // Placeholder
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
        // Heartbeat logic
    },

    // --- MESSAGING ---
    sendBulkSMS: async (ids: string[], body: string): Promise<{ success: number, failed: number, errors: string[], gatewayResponse?: string }> => {
        const settings = await mockService.getSystemSettings();
        const leads = await mockService.getLeads();
        const targets = leads.filter(l => ids.includes(l.id));
        
        let success = 0;
        let failed = 0;
        let errors: string[] = [];
        let lastGatewayResponse = "";

        if (!settings.sms_base_url || !settings.sms_api_key) {
            return { success: 0, failed: targets.length, errors: ["SMS Settings Missing"] };
        }

        for (const lead of targets) {
            const cleanNumber = lead.primary_phone.replace(/\D/g, ''); 
            const formattedNumber = cleanNumber.startsWith('88') ? cleanNumber : '88' + cleanNumber;

            try {
                const url = new URL(settings.sms_base_url.trim().replace(/\/$/, ""));
                url.searchParams.append('api_key', settings.sms_api_key);
                url.searchParams.append('senderid', settings.sms_sender_id);
                url.searchParams.append('number', formattedNumber);
                url.searchParams.append('message', body);
                
                const res = await fetch(url.toString(), { method: 'GET' }); 
                const text = await res.text();
                lastGatewayResponse = text; 

                if (res.ok) {
                    success++;
                } else {
                    throw new Error(`Gateway Error: ${text}`);
                }
            } catch (e: any) {
                failed++;
                errors.push(`${lead.full_name}: ${e.message}`);
            }
        }

        if (success > 0) {
            const updated = leads.map(l => ids.includes(l.id) ? { ...l, total_messages_sent: (l.total_messages_sent || 0) + 1 } : l);
            setStorage('sae_leads', updated);
        }

        return { success, failed, errors, gatewayResponse: lastGatewayResponse };
    },

    scheduleBulkMessages: async (ids: string[], schedule: any[]): Promise<void> => {
        console.log(`Scheduled messages for ${ids.length} recipients.`);
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

    // --- FORMS (STRICTLY DATABASE ONLY) ---
    getForms: async (): Promise<LeadForm[]> => {
        try {
            const data = await safeFetch(`${API_BASE}/forms.php?t=${Date.now()}`);
            if (Array.isArray(data)) return data;
        } catch (e) {
            console.error("API Form Fetch Error", e);
        }
        return [];
    },

    getFormById: async (id: string): Promise<LeadForm | undefined> => {
        try {
            const data = await safeFetch(`${API_BASE}/forms.php?id=${id}&t=${Date.now()}`);
            if (data && data.id) return data;
        } catch (e) {
            console.error("API Form Fetch Error", e);
        }
        return undefined;
    },

    createForm: async (form: Omit<LeadForm, 'id' | 'created_at'>): Promise<void> => {
        const newForm = { ...form, id: uuid(), created_at: getMySQLDate() };
        await safeFetch(`${API_BASE}/forms.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', ...newForm })
        });
    },

    updateForm: async (id: string, updates: Partial<LeadForm>): Promise<void> => {
        await safeFetch(`${API_BASE}/forms.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update', id, ...updates })
        });
    },

    deleteForm: async (id: string): Promise<void> => {
        await safeFetch(`${API_BASE}/forms.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', id })
        });
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
        const defaults: SystemSettings = {
            facebook_page_token: '',
            facebook_verify_token: '',
            sms_api_key: '',
            sms_sender_id: '',
            sms_base_url: '',
            timezone: 'Asia/Dhaka',
            system_api_key: '',
            portal_support_phone: '',
            portal_support_url: '',
            portal_fb_group: ''
        };

        try {
            const data = await safeFetch(`${API_BASE}/settings.php`);
            if (data) return { ...defaults, ...data };
        } catch (e) {
            // console.warn("Settings API Error, falling back to local");
        }

        return getStorage<SystemSettings>('sae_settings', {
            ...defaults,
            system_api_key: 'lg_' + Math.random().toString(36).substr(2, 12)
        });
    },

    saveSystemSettings: async (settings: SystemSettings): Promise<void> => {
        setStorage('sae_settings', settings);

        try {
            await safeFetch(`${API_BASE}/settings.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update', ...settings })
            });
        } catch (e) { 
            console.error("API Settings Save Error", e);
            throw e; 
        }
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
    },

    // --- MISC ---
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
        try {
            const data = await safeFetch(`${API_BASE}/payment_methods.php`);
            if (Array.isArray(data)) return data;
        } catch (e) {
            console.error("API Payment Methods Error", e);
        }
        // Fallback for offline dev
        return getStorage<PaymentMethod[]>('sae_payment_methods', []);
    },

    addPaymentMethod: async (method: Partial<PaymentMethod>): Promise<void> => {
        try {
            await fetch(`${API_BASE}/payment_methods.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', id: uuid(), ...method })
            });
        } catch (e) { console.error("API Add Payment Error", e); }
    },

    deletePaymentMethod: async (id: string): Promise<void> => {
        try {
            await fetch(`${API_BASE}/payment_methods.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', id })
            });
        } catch (e) { console.error("API Delete Payment Error", e); }
    }
};
