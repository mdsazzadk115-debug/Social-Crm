
import { 
  Lead, LeadStatus, LeadSource, Interaction, MessageTemplate, Campaign, 
  SimpleAutomationRule, LeadForm, Customer, Task, Invoice, Snippet, 
  Document, BigFish, PaymentMethod, MessengerConversation, SystemSettings,
  MonthlyTarget, SalesEntry, SalesServiceType, Transaction, AdInspiration, ClientInteraction
} from '../types';
import { 
  INITIAL_TEMPLATES, INITIAL_LEAD_FORMS, INITIAL_SNIPPETS, INDUSTRIES, DEMO_LEADS 
} from '../constants';

const uuid = () => Math.random().toString(36).substr(2, 9);

const STORAGE_KEYS = {
  LEADS: 'leads_data',
  INTERACTIONS: 'interactions_data',
  TEMPLATES: 'templates_data',
  CAMPAIGNS: 'campaigns_data',
  AUTOMATION_RULES: 'automation_rules',
  FORMS: 'lead_forms',
  CUSTOMERS: 'online_customers',
  TASKS: 'daily_tasks',
  INVOICES: 'invoices_data',
  SNIPPETS: 'snippets_data',
  DOCUMENTS: 'documents_data',
  BIG_FISH: 'big_fish_data',
  PAYMENT_METHODS: 'payment_methods',
  MESSENGER_CONV: 'messenger_conversations',
  SETTINGS: 'system_settings',
  SALES_TARGETS: 'sales_targets',
  SALES_ENTRIES: 'sales_entries',
  CUSTOMER_CATEGORIES: 'customer_categories',
  INDUSTRIES_LIST: 'industries_list',
  AD_INSPIRATIONS: 'ad_inspirations'
};

class MockService {
  private getStorage<T>(key: string, defaultVal: T): T {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultVal;
  }

  private setStorage<T>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // --- LEADS ---
  async getLeads(): Promise<Lead[]> {
    // Inject Demo Data if empty
    let leads = this.getStorage<Lead[]>(STORAGE_KEYS.LEADS, []);
    if (leads.length === 0) {
        // Initialize download_count and interactions for demo leads
        leads = DEMO_LEADS.map(l => ({...l, download_count: 0, interactions: []}));
        this.setStorage(STORAGE_KEYS.LEADS, leads);
    }
    return leads;
  }

  async getLeadById(id: string): Promise<Lead | undefined> {
    const leads = await this.getLeads();
    return leads.find(l => l.id === id);
  }

  async createLead(data: Partial<Lead>): Promise<Lead> {
    const leads = await this.getLeads();
    const newLead: Lead = {
      id: uuid(),
      full_name: data.full_name || 'Unknown',
      primary_phone: data.primary_phone || '',
      source: data.source || LeadSource.MANUAL,
      status: data.status || LeadStatus.NEW,
      is_starred: false,
      is_unread: true,
      total_messages_sent: 0,
      download_count: 0,
      interactions: [],
      first_contact_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      ...data
    } as Lead;
    
    leads.unshift(newLead);
    this.setStorage(STORAGE_KEYS.LEADS, leads);
    return newLead;
  }

  async updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
    const leads = await this.getLeads();
    const lead = leads.find(l => l.id === id);
    if (lead) {
      lead.status = status;
      lead.last_activity_at = new Date().toISOString();
      this.setStorage(STORAGE_KEYS.LEADS, leads);
    }
  }

  async updateLeadIndustry(id: string, industry: string): Promise<void> {
    const leads = await this.getLeads();
    const lead = leads.find(l => l.id === id);
    if (lead) {
      lead.industry = industry;
      this.setStorage(STORAGE_KEYS.LEADS, leads);
    }
  }

  async updateLeadNote(id: string, note: string): Promise<void> {
      const leads = await this.getLeads();
      const lead = leads.find(l => l.id === id);
      if (lead) {
          lead.quick_note = note;
          this.setStorage(STORAGE_KEYS.LEADS, leads);
      }
  }

  async toggleLeadStar(id: string): Promise<void> {
      const leads = await this.getLeads();
      const lead = leads.find(l => l.id === id);
      if (lead) {
          lead.is_starred = !lead.is_starred;
          this.setStorage(STORAGE_KEYS.LEADS, leads);
      }
  }

  async incrementDownloadCount(ids: string[]): Promise<void> {
      const leads = await this.getLeads();
      let changed = false;
      leads.forEach(lead => {
          if (ids.includes(lead.id)) {
              lead.download_count = (lead.download_count || 0) + 1;
              changed = true;
          }
      });
      if (changed) {
          this.setStorage(STORAGE_KEYS.LEADS, leads);
      }
  }

  // --- LEAD CRM INTERACTIONS ---
  async addLeadInteraction(leadId: string, data: Partial<ClientInteraction>): Promise<void> {
      const leads = await this.getLeads();
      const lead = leads.find(l => l.id === leadId);
      if(lead) {
          const interaction: ClientInteraction = {
              id: uuid(),
              date: data.date || new Date().toISOString(),
              type: data.type || 'OTHER',
              notes: data.notes || '',
              next_follow_up: data.next_follow_up,
              created_at: new Date().toISOString()
          };
          if (!lead.interactions) lead.interactions = [];
          lead.interactions.unshift(interaction);
          this.setStorage(STORAGE_KEYS.LEADS, leads);
      }
  }

  async deleteLeadInteraction(leadId: string, interactionId: string): Promise<void> {
      const leads = await this.getLeads();
      const lead = leads.find(l => l.id === leadId);
      if(lead && lead.interactions) {
          lead.interactions = lead.interactions.filter(i => i.id !== interactionId);
          this.setStorage(STORAGE_KEYS.LEADS, leads);
      }
  }

  // --- INDUSTRIES MANAGEMENT ---
  async getIndustries(): Promise<string[]> {
      return this.getStorage<string[]>(STORAGE_KEYS.INDUSTRIES_LIST, INDUSTRIES);
  }

  async addIndustry(name: string): Promise<void> {
      const list = await this.getIndustries();
      if(!list.includes(name)) {
          list.push(name);
          this.setStorage(STORAGE_KEYS.INDUSTRIES_LIST, list);
      }
  }

  async deleteIndustry(name: string): Promise<void> {
      const list = await this.getIndustries();
      this.setStorage(STORAGE_KEYS.INDUSTRIES_LIST, list.filter(i => i !== name));
  }

  // --- INTERACTIONS (Message Logs) ---
  async getInteractions(leadId: string): Promise<Interaction[]> {
    const all = this.getStorage<Interaction[]>(STORAGE_KEYS.INTERACTIONS, []);
    return all.filter(i => i.lead_id === leadId).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  // --- TEMPLATES ---
  async getTemplates(): Promise<MessageTemplate[]> {
    const defaults = INITIAL_TEMPLATES.map((t, i) => ({ ...t, id: `tmpl_${i}` })) as MessageTemplate[];
    return this.getStorage<MessageTemplate[]>(STORAGE_KEYS.TEMPLATES, defaults);
  }

  async createTemplate(data: Omit<MessageTemplate, 'id'>): Promise<void> {
    const tmpls = await this.getTemplates();
    tmpls.push({ ...data, id: uuid() });
    this.setStorage(STORAGE_KEYS.TEMPLATES, tmpls);
  }

  async updateTemplate(id: string, data: Partial<MessageTemplate>): Promise<void> {
    const tmpls = await this.getTemplates();
    const idx = tmpls.findIndex(t => t.id === id);
    if (idx !== -1) {
      tmpls[idx] = { ...tmpls[idx], ...data };
      this.setStorage(STORAGE_KEYS.TEMPLATES, tmpls);
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    const tmpls = await this.getTemplates();
    this.setStorage(STORAGE_KEYS.TEMPLATES, tmpls.filter(t => t.id !== id));
  }

  // --- CAMPAIGNS ---
  async getCampaigns(): Promise<Campaign[]> {
    return this.getStorage<Campaign[]>(STORAGE_KEYS.CAMPAIGNS, []);
  }

  async createCampaign(data: Omit<Campaign, 'id' | 'active_leads_count'>): Promise<void> {
    const campaigns = await this.getCampaigns();
    campaigns.push({ ...data, id: uuid(), active_leads_count: 0 });
    this.setStorage(STORAGE_KEYS.CAMPAIGNS, campaigns);
  }

  // --- AUTOMATION RULES ---
  async getSimpleAutomationRules(): Promise<SimpleAutomationRule[]> {
    return this.getStorage<SimpleAutomationRule[]>(STORAGE_KEYS.AUTOMATION_RULES, []);
  }

  async saveSimpleAutomationRule(status: string, steps: any[]): Promise<void> {
    const rules = await this.getSimpleAutomationRules();
    const existingIdx = rules.findIndex(r => r.status === status);
    if (existingIdx !== -1) {
      rules[existingIdx].steps = steps;
    } else {
      rules.push({ id: uuid(), status: status as LeadStatus, steps, is_active: true });
    }
    this.setStorage(STORAGE_KEYS.AUTOMATION_RULES, rules);
  }

  // --- MESSAGING ---
  async resolvePhoneNumbersToIds(numbers: string[]): Promise<string[]> {
    const leads = await this.getLeads();
    const ids: string[] = [];
    
    for (const num of numbers) {
      let lead = leads.find(l => l.primary_phone === num || l.primary_phone.includes(num));
      if (!lead) {
        // Create new lead implicitly
        lead = await this.createLead({ primary_phone: num, full_name: 'Unknown Mobile User' });
      }
      ids.push(lead.id);
    }
    return ids;
  }

  async sendBulkSMS(leadIds: string[], body: string): Promise<void> {
    // Mock sending
    const leads = await this.getLeads();
    const interactions = this.getStorage<Interaction[]>(STORAGE_KEYS.INTERACTIONS, []);
    
    leadIds.forEach(id => {
      const lead = leads.find(l => l.id === id);
      if (lead) {
        lead.total_messages_sent = (lead.total_messages_sent || 0) + 1;
        lead.last_activity_at = new Date().toISOString();
        
        interactions.push({
          id: uuid(),
          lead_id: id,
          channel: 'sms' as any,
          direction: 'outgoing' as any,
          content: body,
          created_at: new Date().toISOString()
        });
      }
    });
    
    this.setStorage(STORAGE_KEYS.LEADS, leads);
    this.setStorage(STORAGE_KEYS.INTERACTIONS, interactions);
  }

  async scheduleBulkMessages(leadIds: string[], messages: any[]): Promise<void> {
    console.log(`Scheduled ${messages.length} messages for ${leadIds.length} leads.`);
  }

  // --- FORMS ---
  async getForms(): Promise<LeadForm[]> {
    return this.getStorage<LeadForm[]>(STORAGE_KEYS.FORMS, INITIAL_LEAD_FORMS);
  }

  async getFormById(id: string): Promise<LeadForm | undefined> {
    const forms = await this.getForms();
    return forms.find(f => f.id === id);
  }

  async createForm(data: Omit<LeadForm, 'id' | 'created_at'>): Promise<void> {
    const forms = await this.getForms();
    forms.push({ ...data, id: uuid(), created_at: new Date().toISOString() });
    this.setStorage(STORAGE_KEYS.FORMS, forms);
  }

  async updateForm(id: string, data: Partial<LeadForm>): Promise<void> {
    const forms = await this.getForms();
    const idx = forms.findIndex(f => f.id === id);
    if (idx !== -1) {
      forms[idx] = { ...forms[idx], ...data };
      this.setStorage(STORAGE_KEYS.FORMS, forms);
    }
  }

  async deleteForm(id: string): Promise<void> {
    const forms = await this.getForms();
    this.setStorage(STORAGE_KEYS.FORMS, forms.filter(f => f.id !== id));
  }

  async submitLeadForm(formId: string, data: any): Promise<void> {
    const form = await this.getFormById(formId);
    if (!form) throw new Error("Form not found");
    
    await this.createLead({
      full_name: data.name,
      primary_phone: data.phone,
      source: LeadSource.FORM,
      website_url: data.website,
      facebook_profile_link: data.facebook,
      industry: data.industry
    });
  }

  // --- ONLINE CUSTOMERS ---
  async getCustomers(): Promise<Customer[]> {
    return this.getStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  }

  async getCustomerCategories(): Promise<string[]> {
    return this.getStorage<string[]>(STORAGE_KEYS.CUSTOMER_CATEGORIES, ['Dress', 'Bag', 'Watch', 'Shoe', 'Gadget']);
  }

  async addCustomerCategory(name: string): Promise<void> {
    const cats = await this.getCustomerCategories();
    if (!cats.includes(name)) {
      cats.push(name);
      this.setStorage(STORAGE_KEYS.CUSTOMER_CATEGORIES, cats);
    }
  }

  async deleteCustomerCategory(name: string): Promise<void> {
    const cats = await this.getCustomerCategories();
    this.setStorage(STORAGE_KEYS.CUSTOMER_CATEGORIES, cats.filter(c => c !== name));
  }

  async addBulkCustomers(lines: string[], category: string): Promise<number> {
    const customers = await this.getCustomers();
    let added = 0;
    const now = new Date().toISOString();

    for (const line of lines) {
      const phoneMatch = line.match(/(?:\+88|88)?(01[3-9]\d{8})/);
      if (phoneMatch) {
        const phone = phoneMatch[0];
        if (!customers.some(c => c.phone === phone)) {
          customers.unshift({
            id: uuid(),
            phone,
            category,
            date_added: now
          });
          added++;
        }
      }
    }
    this.setStorage(STORAGE_KEYS.CUSTOMERS, customers);
    return added;
  }

  async deleteCustomer(id: string): Promise<void> {
    const customers = await this.getCustomers();
    this.setStorage(STORAGE_KEYS.CUSTOMERS, customers.filter(c => c.id !== id));
  }

  // --- DAILY TASKS ---
  async getTasks(): Promise<Task[]> {
    return this.getStorage<Task[]>(STORAGE_KEYS.TASKS, []);
  }

  async createTask(text: string, dueDate?: string, leadId?: string): Promise<void> {
    const tasks = await this.getTasks();
    tasks.unshift({ 
        id: uuid(), 
        text, 
        is_completed: false, 
        created_at: new Date().toISOString(),
        due_date: dueDate,
        lead_id: leadId
    });
    this.setStorage(STORAGE_KEYS.TASKS, tasks);
  }

  async toggleTask(id: string): Promise<void> {
    const tasks = await this.getTasks();
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.is_completed = !task.is_completed;
      this.setStorage(STORAGE_KEYS.TASKS, tasks);
    }
  }

  async deleteTask(id: string): Promise<void> {
    const tasks = await this.getTasks();
    this.setStorage(STORAGE_KEYS.TASKS, tasks.filter(t => t.id !== id));
  }

  // --- INVOICES ---
  async getInvoices(): Promise<Invoice[]> {
    return this.getStorage<Invoice[]>(STORAGE_KEYS.INVOICES, []);
  }

  async createInvoice(data: Omit<Invoice, 'id' | 'number' | 'created_at'>): Promise<void> {
    const invoices = await this.getInvoices();
    const number = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
    invoices.unshift({ 
        ...data, 
        id: uuid(), 
        number, 
        created_at: new Date().toISOString() 
    });
    this.setStorage(STORAGE_KEYS.INVOICES, invoices);
  }

  async deleteInvoice(id: string): Promise<void> {
    const invoices = await this.getInvoices();
    this.setStorage(STORAGE_KEYS.INVOICES, invoices.filter(i => i.id !== id));
  }

  // --- SNIPPETS ---
  async getSnippets(): Promise<Snippet[]> {
    const defaults = INITIAL_SNIPPETS.map((s, i) => ({ ...s, id: `snp_${i}` }));
    return this.getStorage<Snippet[]>(STORAGE_KEYS.SNIPPETS, defaults);
  }

  async createSnippet(data: Omit<Snippet, 'id'>): Promise<void> {
    const snippets = await this.getSnippets();
    snippets.push({ ...data, id: uuid() });
    this.setStorage(STORAGE_KEYS.SNIPPETS, snippets);
  }

  async updateSnippet(id: string, data: Partial<Snippet>): Promise<void> {
    const snippets = await this.getSnippets();
    const idx = snippets.findIndex(s => s.id === id);
    if (idx !== -1) {
      snippets[idx] = { ...snippets[idx], ...data };
      this.setStorage(STORAGE_KEYS.SNIPPETS, snippets);
    }
  }

  async deleteSnippet(id: string): Promise<void> {
    const snippets = await this.getSnippets();
    this.setStorage(STORAGE_KEYS.SNIPPETS, snippets.filter(s => s.id !== id));
  }

  // --- DOCUMENTS ---
  async getDocuments(): Promise<Document[]> {
    return this.getStorage<Document[]>(STORAGE_KEYS.DOCUMENTS, []);
  }

  async saveDocument(data: any): Promise<void> {
    const docs = await this.getDocuments();
    docs.unshift({ ...data, id: uuid(), created_at: new Date().toISOString() });
    this.setStorage(STORAGE_KEYS.DOCUMENTS, docs);
  }

  async deleteDocument(id: string): Promise<void> {
    const docs = await this.getDocuments();
    this.setStorage(STORAGE_KEYS.DOCUMENTS, docs.filter(d => d.id !== id));
  }

  // --- BIG FISH ---
  async getBigFish(): Promise<BigFish[]> {
    return this.getStorage<BigFish[]>(STORAGE_KEYS.BIG_FISH, []);
  }

  async getBigFishById(id: string): Promise<BigFish | undefined> {
    const fish = await this.getBigFish();
    return fish.find(f => f.id === id);
  }

  async createBigFish(data: Partial<BigFish>): Promise<BigFish> {
    const fish = await this.getBigFish();
    const newFish: BigFish = {
      id: uuid(),
      lead_id: data.lead_id || uuid(),
      name: data.name || 'Unknown Client',
      phone: data.phone || '',
      status: 'Active Pool',
      balance: 0,
      spent_amount: 0,
      target_sales: 100,
      current_sales: 0,
      transactions: [],
      growth_tasks: [],
      reports: [],
      interactions: [], // CRM: Initialize interactions
      start_date: new Date().toISOString(),
      low_balance_alert_threshold: 10,
      portal_config: { show_balance: true, show_history: true, is_suspended: false },
      // Subscription Defaults
      is_retainer: false,
      retainer_amount: 0,
      retainer_status: 'ACTIVE',
      ...data
    } as BigFish;
    
    fish.unshift(newFish);
    this.setStorage(STORAGE_KEYS.BIG_FISH, fish);
    return newFish;
  }

  async catchBigFish(leadId: string): Promise<BigFish | null> {
    const leads = await this.getLeads();
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return null;

    const fish = await this.getBigFish();
    if (fish.some(f => f.lead_id === leadId && f.status === 'Active Pool')) return null;

    return this.createBigFish({
      lead_id: lead.id,
      name: lead.full_name,
      phone: lead.primary_phone,
      website_url: lead.website_url,
      facebook_page: lead.facebook_profile_link,
    });
  }

  async toggleBigFishStatus(id: string): Promise<void> {
    const fish = await this.getBigFish();
    const f = fish.find(x => x.id === id);
    if (f) {
      f.status = f.status === 'Active Pool' ? 'Hall of Fame' : 'Active Pool';
      if (f.status === 'Hall of Fame') f.end_date = new Date().toISOString();
      else f.end_date = undefined;
      this.setStorage(STORAGE_KEYS.BIG_FISH, fish);
    }
  }

  async updateBigFish(id: string, updates: Partial<BigFish>): Promise<void> {
    const fish = await this.getBigFish();
    const idx = fish.findIndex(f => f.id === id);
    if (idx !== -1) {
      fish[idx] = { ...fish[idx], ...updates };
      this.setStorage(STORAGE_KEYS.BIG_FISH, fish);
    }
  }

  async updatePortalConfig(id: string, config: any): Promise<void> {
    const fish = await this.getBigFish();
    const f = fish.find(x => x.id === id);
    if (f) {
      f.portal_config = { ...f.portal_config, ...config };
      this.setStorage(STORAGE_KEYS.BIG_FISH, fish);
    }
  }

  // --- CRM: INTERACTIONS (BIG FISH) ---
  async addClientInteraction(fishId: string, data: Partial<ClientInteraction>): Promise<void> {
      const fish = await this.getBigFish();
      const f = fish.find(x => x.id === fishId);
      if(f) {
          const interaction: ClientInteraction = {
              id: uuid(),
              date: data.date || new Date().toISOString(),
              type: data.type || 'OTHER',
              notes: data.notes || '',
              next_follow_up: data.next_follow_up,
              created_at: new Date().toISOString()
          };
          
          if (!f.interactions) f.interactions = [];
          f.interactions.unshift(interaction);
          this.setStorage(STORAGE_KEYS.BIG_FISH, fish);
      }
  }

  async deleteClientInteraction(fishId: string, interactionId: string): Promise<void> {
      const fish = await this.getBigFish();
      const f = fish.find(x => x.id === fishId);
      if(f && f.interactions) {
          f.interactions = f.interactions.filter(i => i.id !== interactionId);
          this.setStorage(STORAGE_KEYS.BIG_FISH, fish);
      }
  }

  // Transactions & Financials
  async addTransaction(id: string, type: any, amount: number, desc: string, metadata?: any, date?: string): Promise<void> {
    const fish = await this.getBigFish();
    const f = fish.find(x => x.id === id);
    if (f) {
      const tx: Transaction = {
        id: uuid(),
        date: date || new Date().toISOString(),
        type,
        amount,
        description: desc,
        metadata
      };
      f.transactions.unshift(tx);
      
      if (type === 'DEPOSIT') f.balance += amount;
      if (type === 'DEDUCT' || type === 'AD_SPEND' || type === 'SERVICE_CHARGE') f.balance -= amount;
      
      if (type === 'AD_SPEND') {
        f.spent_amount += amount;
        f.reports.unshift({
            id: uuid(),
            date: date || new Date().toISOString(),
            task: `Ad Spend Run: $${amount} (Results: ${metadata?.leads || 0})`
        });
      }
      this.setStorage(STORAGE_KEYS.BIG_FISH, fish);
    }
  }

  async deleteTransaction(fishId: string, txId: string): Promise<void> {
      const fish = await this.getBigFish();
      const f = fish.find(x => x.id === fishId);
      if(f) {
          const tx = f.transactions.find(t => t.id === txId);
          if(!tx) return;
          // Reverse Balance
          if (tx.type === 'DEPOSIT') f.balance -= tx.amount;
          else f.balance += tx.amount;
          
          if (tx.type === 'AD_SPEND') f.spent_amount -= tx.amount;

          f.transactions = f.transactions.filter(t => t.id !== txId);
          this.setStorage(STORAGE_KEYS.BIG_FISH, fish);
      }
  }

  async updateTransaction(fishId: string, txId: string, updates: Partial<Transaction>): Promise<void> {
      const fish = await this.getBigFish();
      const f = fish.find(x => x.id === fishId);
      if(f) {
          const tx = f.transactions.find(t => t.id === txId);
          if(!tx) return;

          // Revert old amount logic first
          if (tx.type === 'DEPOSIT') f.balance -= tx.amount;
          else f.balance += tx.amount;
          if (tx.type === 'AD_SPEND') f.spent_amount -= tx.amount;

          // Apply updates
          Object.assign(tx, updates);

          // Apply new amount logic
          if (tx.type === 'DEPOSIT') f.balance += tx.amount;
          else f.balance -= tx.amount;
          if (tx.type === 'AD_SPEND') f.spent_amount += tx.amount;

          this.setStorage(STORAGE_KEYS.BIG_FISH, fish);
      }
  }

  async addGrowthTask(fishId: string, title: string, dueDate: string): Promise<void> {
      const fish = await this.getBigFish();
      const f = fish.find(x => x.id === fishId);
      if(f) {
          f.growth_tasks.unshift({ id: uuid(), title, is_completed: false, due_date: dueDate });
          this.setStorage(STORAGE_KEYS.BIG_FISH, fish);
      }
  }

  async toggleGrowthTask(fishId: string, taskId: string): Promise<void> {
      const fish = await this.getBigFish();
      const f = fish.find(x => x.id === fishId);
      if(f) {
          const t = f.growth_tasks.find(x => x.id === taskId);
          if(t) t.is_completed = !t.is_completed;
          this.setStorage(STORAGE_KEYS.BIG_FISH, fish);
      }
  }

  async updateTargets(fishId: string, target: number, current: number): Promise<void> {
      const fish = await this.getBigFish();
      const f = fish.find(x => x.id === fishId);
      if(f) {
          f.target_sales = target;
          f.current_sales = current;
          this.setStorage(STORAGE_KEYS.BIG_FISH, fish);
      }
  }

  async addWorkLog(fishId: string, task: string): Promise<void> {
      const fish = await this.getBigFish();
      const f = fish.find(x => x.id === fishId);
      if(f) {
          f.reports.unshift({ id: uuid(), date: new Date().toISOString(), task });
          this.setStorage(STORAGE_KEYS.BIG_FISH, fish);
      }
  }

  async checkExpiringCampaigns(): Promise<BigFish[]> {
      const fish = await this.getBigFish();
      const now = new Date();
      return fish.filter(f => {
          if (f.status !== 'Active Pool' || !f.campaign_end_date) return false;
          const end = new Date(f.campaign_end_date);
          const diff = end.getTime() - now.getTime();
          const days = diff / (1000 * 3600 * 24);
          return days <= 1 && days >= 0; // Expires in <= 24 hours
      });
  }

  async checkRetainerRenewals(): Promise<BigFish[]> {
      const fish = await this.getBigFish();
      const now = new Date();
      return fish.filter(f => {
          if (f.status !== 'Active Pool' || !f.is_retainer || !f.retainer_renewal_date) return false;
          const renewal = new Date(f.retainer_renewal_date);
          const diff = renewal.getTime() - now.getTime();
          const days = Math.ceil(diff / (1000 * 3600 * 24));
          return days <= 7 && days >= -5; // Renewals in next 7 days or overdue by 5
      });
  }

  async renewRetainer(id: string): Promise<void> {
      const fish = await this.getBigFish();
      const f = fish.find(x => x.id === id);
      if (f && f.retainer_renewal_date) {
          const current = new Date(f.retainer_renewal_date);
          current.setDate(current.getDate() + 30); // Add 30 days
          f.retainer_renewal_date = current.toISOString().slice(0, 10);
          this.setStorage(STORAGE_KEYS.BIG_FISH, fish);
      }
  }

  getLifetimeDeposit(fish: BigFish): number {
      return fish.transactions
          .filter(t => t.type === 'DEPOSIT')
          .reduce((sum, t) => sum + t.amount, 0);
  }

  // --- PAYMENT METHODS ---
  async getPaymentMethods(): Promise<PaymentMethod[]> {
      return this.getStorage<PaymentMethod[]>(STORAGE_KEYS.PAYMENT_METHODS, []);
  }

  async savePaymentMethod(data: Omit<PaymentMethod, 'id'>): Promise<void> {
      const methods = await this.getPaymentMethods();
      methods.push({ ...data, id: uuid() });
      this.setStorage(STORAGE_KEYS.PAYMENT_METHODS, methods);
  }

  async deletePaymentMethod(id: string): Promise<void> {
      const methods = await this.getPaymentMethods();
      this.setStorage(STORAGE_KEYS.PAYMENT_METHODS, methods.filter(m => m.id !== id));
  }

  // --- MESSENGER BABA (MOCK) ---
  async getMessengerConversations(): Promise<MessengerConversation[]> {
      return this.getStorage<MessengerConversation[]>(STORAGE_KEYS.MESSENGER_CONV, []);
  }

  async simulateIncomingMessage(text: string, senderName: string): Promise<void> {
      const convs = await this.getMessengerConversations();
      // Simple mock logic: create or update conversation
      let conv = convs.find(c => c.customer_name === senderName);
      if(!conv) {
          conv = {
              id: uuid(),
              facebook_user_id: uuid(),
              customer_name: senderName,
              messages: [],
              last_message: '',
              last_updated: '',
              is_lead_linked: false
          };
          convs.unshift(conv);
      }
      
      const newMsg = {
          id: uuid(),
          sender: 'customer' as const,
          type: 'text' as const,
          content: text,
          timestamp: new Date().toISOString()
      };
      
      conv.messages.push(newMsg);
      conv.last_message = text;
      conv.last_updated = new Date().toISOString();

      // Phone Extraction Mock
      const phoneMatch = text.match(/(?:\+88|88)?(01[3-9]\d{8})/);
      if(phoneMatch && !conv.customer_phone) {
          conv.customer_phone = phoneMatch[0];
          conv.is_lead_linked = true;
          // Auto create lead
          await this.createLead({
              full_name: senderName,
              primary_phone: phoneMatch[0],
              source: LeadSource.FACEBOOK_MESSENGER
          });
      }

      this.setStorage(STORAGE_KEYS.MESSENGER_CONV, convs);
  }

  // --- SYSTEM SETTINGS ---
  async getSystemSettings(): Promise<SystemSettings> {
      return this.getStorage<SystemSettings>(STORAGE_KEYS.SETTINGS, {
          facebook_page_token: '',
          facebook_verify_token: '',
          sms_api_key: '',
          sms_sender_id: '',
          sms_base_url: '',
          timezone: 'Asia/Dhaka',
          system_api_key: 'lg_' + uuid()
      });
  }

  async saveSystemSettings(settings: SystemSettings): Promise<void> {
      this.setStorage(STORAGE_KEYS.SETTINGS, settings);
  }

  // --- SALES GOALS ---
  async getSalesTargets(): Promise<MonthlyTarget[]> {
      return this.getStorage<MonthlyTarget[]>(STORAGE_KEYS.SALES_TARGETS, []);
  }

  async setSalesTarget(target: Omit<MonthlyTarget, 'id'>): Promise<void> {
      const targets = await this.getSalesTargets();
      const idx = targets.findIndex(t => t.month === target.month && t.service === target.service);
      if (idx !== -1) {
          targets[idx] = { ...targets[idx], ...target };
      } else {
          targets.push({ ...target, id: uuid() });
      }
      this.setStorage(STORAGE_KEYS.SALES_TARGETS, targets);
  }

  async getSalesEntries(): Promise<SalesEntry[]> {
      // Inject Demo Sales Data if empty to show graph
      let entries = this.getStorage<SalesEntry[]>(STORAGE_KEYS.SALES_ENTRIES, []);
      if (entries.length === 0) {
          const today = new Date();
          const demoEntries: SalesEntry[] = [];
          for (let i = 0; i < 30; i++) {
              const d = new Date();
              d.setDate(today.getDate() - i);
              if (Math.random() > 0.5) {
                  demoEntries.push({
                      id: uuid(),
                      date: d.toISOString(),
                      service: Math.random() > 0.5 ? 'FACEBOOK_ADS' : 'WEB_DEV',
                      amount: Math.floor(Math.random() * 5000) + 1000,
                      description: 'Demo Sale',
                      created_at: d.toISOString()
                  });
              }
          }
          entries = demoEntries;
          this.setStorage(STORAGE_KEYS.SALES_ENTRIES, entries);
      }
      return entries;
  }

  async addSalesEntry(entry: Omit<SalesEntry, 'id' | 'created_at'>): Promise<void> {
      const entries = await this.getSalesEntries();
      entries.unshift({ ...entry, id: uuid(), created_at: new Date().toISOString() });
      this.setStorage(STORAGE_KEYS.SALES_ENTRIES, entries);
  }

  async updateSalesEntry(id: string, entry: Partial<SalesEntry>): Promise<void> {
      const entries = await this.getSalesEntries();
      const idx = entries.findIndex(e => e.id === id);
      if (idx !== -1) {
          entries[idx] = { ...entries[idx], ...entry };
          this.setStorage(STORAGE_KEYS.SALES_ENTRIES, entries);
      }
  }

  async deleteSalesEntry(id: string): Promise<void> {
      const entries = await this.getSalesEntries();
      this.setStorage(STORAGE_KEYS.SALES_ENTRIES, entries.filter(e => e.id !== id));
  }

  // --- AD SWIPE FILE ---
  async getAdInspirations(): Promise<AdInspiration[]> {
      let ads = this.getStorage<AdInspiration[]>(STORAGE_KEYS.AD_INSPIRATIONS, []);
      if (ads.length === 0) {
          // Add some demo ads
          ads = [
              {
                  id: uuid(),
                  title: 'Nike High Conversion',
                  url: 'https://nike.com',
                  image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
                  category: 'Fashion',
                  notes: 'Great use of red background and bold text.',
                  created_at: new Date().toISOString()
              },
              {
                  id: uuid(),
                  title: 'Real Estate Luxury',
                  url: 'https://zillow.com',
                  image_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500&q=80',
                  category: 'Real Estate',
                  notes: 'Video hook was amazing. Showing lifestyle first.',
                  created_at: new Date().toISOString()
              }
          ];
          this.setStorage(STORAGE_KEYS.AD_INSPIRATIONS, ads);
      }
      return ads;
  }

  async addAdInspiration(data: Omit<AdInspiration, 'id' | 'created_at'>): Promise<void> {
      const ads = await this.getAdInspirations();
      ads.unshift({ ...data, id: uuid(), created_at: new Date().toISOString() });
      this.setStorage(STORAGE_KEYS.AD_INSPIRATIONS, ads);
  }

  async deleteAdInspiration(id: string): Promise<void> {
      const ads = await this.getAdInspirations();
      this.setStorage(STORAGE_KEYS.AD_INSPIRATIONS, ads.filter(a => a.id !== id));
  }
}

export const mockService = new MockService();
