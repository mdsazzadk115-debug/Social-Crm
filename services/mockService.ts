
import { 
  Lead, LeadStatus, LeadSource, Interaction, MessageTemplate, Campaign, 
  SimpleAutomationRule, LeadForm, Customer, Task, Invoice, Snippet, 
  Document, BigFish, PaymentMethod, MessengerConversation, SystemSettings,
  MonthlyTarget, SalesEntry, AdInspiration, ClientInteraction, Transaction
} from '../types';
import { 
  INITIAL_TEMPLATES, INITIAL_LEAD_FORMS, INITIAL_SNIPPETS, INDUSTRIES, DEMO_LEADS 
} from '../constants';

const uuid = () => Math.random().toString(36).substr(2, 9);

// API Configuration
// Changed to relative path './' so it works if the app is in a subfolder
const API_URL = './api/index.php'; 

class MockService {
  
  // --- CORE API HELPER ---
  private async apiRequest<T>(collection: string, method: 'GET' | 'POST' | 'DELETE', data?: any, id?: string): Promise<T> {
      try {
          let url = `${API_URL}?collection=${collection}`;
          if (id) url += `&id=${id}`;

          const options: RequestInit = {
              method,
              headers: { 'Content-Type': 'application/json' }
          };

          if (data) {
              options.body = JSON.stringify(data);
          }

          const response = await fetch(url, options);
          if (!response.ok) {
              // Fallback for local dev or network error: return empty array or handle error
              console.warn(`API Error ${collection}:`, response.statusText);
              // IF API FAILS (e.g. Localhost without PHP), Try LocalStorage as Fallback to not break UI
              return this.fallbackLocalStorage(collection, method, data, id) as any;
          }
          
          const result = await response.json();
          return result;
      } catch (error) {
          console.error("API Request Failed, using fallback:", error);
          return this.fallbackLocalStorage(collection, method, data, id) as any;
      }
  }

  // Fallback for Local Development without PHP
  private fallbackLocalStorage(collection: string, method: string, data: any, id: string | undefined) {
      const key = `bk_${collection}`;
      let items = JSON.parse(localStorage.getItem(key) || '[]');
      
      if (method === 'GET') return items;
      if (method === 'POST') {
          const idx = items.findIndex((i: any) => i.id === data.id);
          if (idx > -1) items[idx] = data;
          else items.unshift(data);
          localStorage.setItem(key, JSON.stringify(items));
          return data;
      }
      if (method === 'DELETE') {
          items = items.filter((i: any) => i.id !== id);
          localStorage.setItem(key, JSON.stringify(items));
          return { success: true };
      }
  }

  // --- LEADS ---
  async getLeads(): Promise<Lead[]> {
    const leads = await this.apiRequest<Lead[]>('leads', 'GET');
    // If empty DB, return demo for first time
    if (leads.length === 0 && !localStorage.getItem('demo_init')) {
        return []; // Return empty, let user add leads or use fallback
    }
    return leads;
  }

  async getLeadById(id: string): Promise<Lead | undefined> {
    const leads = await this.getLeads();
    return leads.find(l => l.id === id);
  }

  async createLead(data: Partial<Lead>): Promise<Lead> {
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
    
    await this.apiRequest('leads', 'POST', newLead);
    return newLead;
  }

  async updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
    const lead = await this.getLeadById(id);
    if (lead) {
      lead.status = status;
      lead.last_activity_at = new Date().toISOString();
      await this.apiRequest('leads', 'POST', lead);
    }
  }

  async updateLeadIndustry(id: string, industry: string): Promise<void> {
    const lead = await this.getLeadById(id);
    if (lead) {
      lead.industry = industry;
      await this.apiRequest('leads', 'POST', lead);
    }
  }

  async updateLeadNote(id: string, note: string): Promise<void> {
      const lead = await this.getLeadById(id);
      if (lead) {
          lead.quick_note = note;
          await this.apiRequest('leads', 'POST', lead);
      }
  }

  async toggleLeadStar(id: string): Promise<void> {
      const lead = await this.getLeadById(id);
      if (lead) {
          lead.is_starred = !lead.is_starred;
          await this.apiRequest('leads', 'POST', lead);
      }
  }

  async incrementDownloadCount(ids: string[]): Promise<void> {
      const leads = await this.getLeads();
      for (const id of ids) {
          const lead = leads.find(l => l.id === id);
          if (lead) {
              lead.download_count = (lead.download_count || 0) + 1;
              await this.apiRequest('leads', 'POST', lead);
          }
      }
  }

  // --- LEAD CRM INTERACTIONS ---
  async addLeadInteraction(leadId: string, data: Partial<ClientInteraction>): Promise<void> {
      const lead = await this.getLeadById(leadId);
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
          await this.apiRequest('leads', 'POST', lead);
      }
  }

  async deleteLeadInteraction(leadId: string, interactionId: string): Promise<void> {
      const lead = await this.getLeadById(leadId);
      if(lead && lead.interactions) {
          lead.interactions = lead.interactions.filter(i => i.id !== interactionId);
          await this.apiRequest('leads', 'POST', lead);
      }
  }

  // --- INDUSTRIES MANAGEMENT ---
  async getIndustries(): Promise<string[]> {
      const data = await this.apiRequest<{id: string, list: string[]}[]>('settings', 'GET');
      const setting = data.find(d => d.id === 'industries_list');
      return setting ? setting.list : INDUSTRIES;
  }

  async addIndustry(name: string): Promise<void> {
      const list = await this.getIndustries();
      if(!list.includes(name)) {
          list.push(name);
          await this.apiRequest('settings', 'POST', { id: 'industries_list', list });
      }
  }

  async deleteIndustry(name: string): Promise<void> {
      const list = await this.getIndustries();
      const newList = list.filter(i => i !== name);
      await this.apiRequest('settings', 'POST', { id: 'industries_list', list: newList });
  }

  // --- INTERACTIONS (Message Logs) ---
  async getInteractions(leadId: string): Promise<Interaction[]> {
    const all = await this.apiRequest<Interaction[]>('interactions', 'GET');
    return all.filter(i => i.lead_id === leadId).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  // --- TEMPLATES ---
  async getTemplates(): Promise<MessageTemplate[]> {
    const tmpls = await this.apiRequest<MessageTemplate[]>('templates', 'GET');
    if (tmpls.length === 0 && !localStorage.getItem('tmpl_init')) {
        return INITIAL_TEMPLATES.map((t, i) => ({ ...t, id: `tmpl_${i}` })) as MessageTemplate[];
    }
    return tmpls;
  }

  async createTemplate(data: Omit<MessageTemplate, 'id'>): Promise<void> {
    const tmpl = { ...data, id: uuid() };
    await this.apiRequest('templates', 'POST', tmpl);
  }

  async updateTemplate(id: string, data: Partial<MessageTemplate>): Promise<void> {
    const tmpls = await this.getTemplates();
    const tmpl = tmpls.find(t => t.id === id);
    if (tmpl) {
        await this.apiRequest('templates', 'POST', { ...tmpl, ...data });
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.apiRequest('templates', 'DELETE', null, id);
  }

  // --- CAMPAIGNS ---
  async getCampaigns(): Promise<Campaign[]> {
    return this.apiRequest<Campaign[]>('campaigns', 'GET');
  }

  async createCampaign(data: Omit<Campaign, 'id' | 'active_leads_count'>): Promise<void> {
    const campaign = { ...data, id: uuid(), active_leads_count: 0 };
    await this.apiRequest('campaigns', 'POST', campaign);
  }

  // --- AUTOMATION RULES ---
  async getSimpleAutomationRules(): Promise<SimpleAutomationRule[]> {
    return this.apiRequest<SimpleAutomationRule[]>('automation_rules', 'GET');
  }

  async saveSimpleAutomationRule(status: string, steps: any[]): Promise<void> {
    const rules = await this.getSimpleAutomationRules();
    let rule = rules.find(r => r.status === status);
    
    if (rule) {
      rule.steps = steps;
    } else {
      rule = { id: uuid(), status: status as LeadStatus, steps, is_active: true };
    }
    await this.apiRequest('automation_rules', 'POST', rule);
  }

  // --- MESSAGING ---
  async resolvePhoneNumbersToIds(numbers: string[]): Promise<string[]> {
    const leads = await this.getLeads();
    const ids: string[] = [];
    
    for (const num of numbers) {
      let lead = leads.find(l => l.primary_phone === num || l.primary_phone.includes(num));
      if (!lead) {
        lead = await this.createLead({ primary_phone: num, full_name: 'Unknown Mobile User' });
      }
      ids.push(lead.id);
    }
    return ids;
  }

  async sendBulkSMS(leadIds: string[], body: string): Promise<void> {
    const leads = await this.getLeads();
    
    for (const id of leadIds) {
      const lead = leads.find(l => l.id === id);
      if (lead) {
        lead.total_messages_sent = (lead.total_messages_sent || 0) + 1;
        lead.last_activity_at = new Date().toISOString();
        await this.apiRequest('leads', 'POST', lead);
        
        await this.apiRequest('interactions', 'POST', {
          id: uuid(),
          lead_id: id,
          channel: 'sms',
          direction: 'outgoing',
          content: body,
          created_at: new Date().toISOString()
        });
      }
    }
  }

  async scheduleBulkMessages(leadIds: string[], messages: any[]): Promise<void> {
    console.log(`Scheduled ${messages.length} messages for ${leadIds.length} leads.`);
  }

  // --- FORMS ---
  async getForms(): Promise<LeadForm[]> {
    const forms = await this.apiRequest<LeadForm[]>('lead_forms', 'GET');
    return forms.length > 0 ? forms : INITIAL_LEAD_FORMS;
  }

  async getFormById(id: string): Promise<LeadForm | undefined> {
    const forms = await this.getForms();
    return forms.find(f => f.id === id);
  }

  async createForm(data: Omit<LeadForm, 'id' | 'created_at'>): Promise<void> {
    const form = { ...data, id: uuid(), created_at: new Date().toISOString() };
    await this.apiRequest('lead_forms', 'POST', form);
  }

  async updateForm(id: string, data: Partial<LeadForm>): Promise<void> {
    const form = await this.getFormById(id);
    if(form) {
        await this.apiRequest('lead_forms', 'POST', { ...form, ...data });
    }
  }

  async deleteForm(id: string): Promise<void> {
    await this.apiRequest('lead_forms', 'DELETE', null, id);
  }

  async submitLeadForm(formId: string, data: any): Promise<void> {
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
    return this.apiRequest<Customer[]>('customers', 'GET');
  }

  async getCustomerCategories(): Promise<string[]> {
    const data = await this.apiRequest<{id: string, list: string[]}[]>('settings', 'GET');
    const setting = data.find(d => d.id === 'customer_categories');
    return setting ? setting.list : ['Dress', 'Bag', 'Watch', 'Shoe', 'Gadget'];
  }

  async addCustomerCategory(name: string): Promise<void> {
    const list = await this.getCustomerCategories();
    if (!list.includes(name)) {
      list.push(name);
      await this.apiRequest('settings', 'POST', { id: 'customer_categories', list });
    }
  }

  async deleteCustomerCategory(name: string): Promise<void> {
    const list = await this.getCustomerCategories();
    const newList = list.filter(c => c !== name);
    await this.apiRequest('settings', 'POST', { id: 'customer_categories', list: newList });
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
          await this.apiRequest('customers', 'POST', {
            id: uuid(),
            phone,
            category,
            date_added: now
          });
          added++;
        }
      }
    }
    return added;
  }

  async deleteCustomer(id: string): Promise<void> {
    await this.apiRequest('customers', 'DELETE', null, id);
  }

  // --- DAILY TASKS ---
  async getTasks(): Promise<Task[]> {
    return this.apiRequest<Task[]>('tasks', 'GET');
  }

  async createTask(text: string, dueDate?: string, leadId?: string): Promise<void> {
    const task = { 
        id: uuid(), 
        text, 
        is_completed: false, 
        created_at: new Date().toISOString(),
        due_date: dueDate,
        lead_id: leadId
    };
    await this.apiRequest('tasks', 'POST', task);
  }

  async toggleTask(id: string): Promise<void> {
    const tasks = await this.getTasks();
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.is_completed = !task.is_completed;
      await this.apiRequest('tasks', 'POST', task);
    }
  }

  async deleteTask(id: string): Promise<void> {
    await this.apiRequest('tasks', 'DELETE', null, id);
  }

  // --- INVOICES ---
  async getInvoices(): Promise<Invoice[]> {
    return this.apiRequest<Invoice[]>('invoices', 'GET');
  }

  async createInvoice(data: Omit<Invoice, 'id' | 'number' | 'created_at'>): Promise<void> {
    const invoices = await this.getInvoices();
    const number = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
    const invoice = { 
        ...data, 
        id: uuid(), 
        number, 
        created_at: new Date().toISOString() 
    };
    await this.apiRequest('invoices', 'POST', invoice);
  }

  async deleteInvoice(id: string): Promise<void> {
    await this.apiRequest('invoices', 'DELETE', null, id);
  }

  // --- SNIPPETS ---
  async getSnippets(): Promise<Snippet[]> {
    const snippets = await this.apiRequest<Snippet[]>('snippets', 'GET');
    return snippets.length > 0 ? snippets : INITIAL_SNIPPETS.map((s, i) => ({ ...s, id: `snp_${i}` }));
  }

  async createSnippet(data: Omit<Snippet, 'id'>): Promise<void> {
    await this.apiRequest('snippets', 'POST', { ...data, id: uuid() });
  }

  async updateSnippet(id: string, data: Partial<Snippet>): Promise<void> {
    const snippets = await this.getSnippets();
    const snp = snippets.find(s => s.id === id);
    if(snp) {
        await this.apiRequest('snippets', 'POST', { ...snp, ...data });
    }
  }

  async deleteSnippet(id: string): Promise<void> {
    await this.apiRequest('snippets', 'DELETE', null, id);
  }

  // --- DOCUMENTS ---
  async getDocuments(): Promise<Document[]> {
    return this.apiRequest<Document[]>('documents', 'GET');
  }

  async saveDocument(data: any): Promise<void> {
    const doc = { ...data, id: uuid(), created_at: new Date().toISOString() };
    await this.apiRequest('documents', 'POST', doc);
  }

  async deleteDocument(id: string): Promise<void> {
    await this.apiRequest('documents', 'DELETE', null, id);
  }

  // --- BIG FISH ---
  async getBigFish(): Promise<BigFish[]> {
    return this.apiRequest<BigFish[]>('big_fish', 'GET');
  }

  async getBigFishById(id: string): Promise<BigFish | undefined> {
    const fish = await this.getBigFish();
    return fish.find(f => f.id === id);
  }

  async createBigFish(data: Partial<BigFish>): Promise<BigFish> {
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
      interactions: [],
      start_date: new Date().toISOString(),
      low_balance_alert_threshold: 10,
      portal_config: { show_balance: true, show_history: true, is_suspended: false },
      is_retainer: false,
      retainer_amount: 0,
      retainer_status: 'ACTIVE',
      ...data
    } as BigFish;
    
    await this.apiRequest('big_fish', 'POST', newFish);
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
    const f = await this.getBigFishById(id);
    if (f) {
      f.status = f.status === 'Active Pool' ? 'Hall of Fame' : 'Active Pool';
      if (f.status === 'Hall of Fame') f.end_date = new Date().toISOString();
      else f.end_date = undefined;
      await this.apiRequest('big_fish', 'POST', f);
    }
  }

  async updateBigFish(id: string, updates: Partial<BigFish>): Promise<void> {
    const f = await this.getBigFishById(id);
    if (f) {
        const updated = { ...f, ...updates };
        await this.apiRequest('big_fish', 'POST', updated);
    }
  }

  async updatePortalConfig(id: string, config: any): Promise<void> {
    const f = await this.getBigFishById(id);
    if (f) {
      f.portal_config = { ...f.portal_config, ...config };
      await this.apiRequest('big_fish', 'POST', f);
    }
  }

  // --- CRM: INTERACTIONS (BIG FISH) ---
  async addClientInteraction(fishId: string, data: Partial<ClientInteraction>): Promise<void> {
      const f = await this.getBigFishById(fishId);
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
          await this.apiRequest('big_fish', 'POST', f);
      }
  }

  async deleteClientInteraction(fishId: string, interactionId: string): Promise<void> {
      const f = await this.getBigFishById(fishId);
      if(f && f.interactions) {
          f.interactions = f.interactions.filter(i => i.id !== interactionId);
          await this.apiRequest('big_fish', 'POST', f);
      }
  }

  // Transactions
  async addTransaction(id: string, type: any, amount: number, desc: string, metadata?: any, date?: string): Promise<void> {
    const f = await this.getBigFishById(id);
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
      await this.apiRequest('big_fish', 'POST', f);
    }
  }

  async deleteTransaction(fishId: string, txId: string): Promise<void> {
      const f = await this.getBigFishById(fishId);
      if(f) {
          const tx = f.transactions.find(t => t.id === txId);
          if(!tx) return;
          if (tx.type === 'DEPOSIT') f.balance -= tx.amount;
          else f.balance += tx.amount;
          if (tx.type === 'AD_SPEND') f.spent_amount -= tx.amount;
          f.transactions = f.transactions.filter(t => t.id !== txId);
          await this.apiRequest('big_fish', 'POST', f);
      }
  }

  async updateTransaction(fishId: string, txId: string, updates: Partial<Transaction>): Promise<void> {
      const f = await this.getBigFishById(fishId);
      if(f) {
          const tx = f.transactions.find(t => t.id === txId);
          if(!tx) return;
          
          // Revert old
          if (tx.type === 'DEPOSIT') f.balance -= tx.amount;
          else f.balance += tx.amount;
          if (tx.type === 'AD_SPEND') f.spent_amount -= tx.amount;

          Object.assign(tx, updates);

          // Apply new
          if (tx.type === 'DEPOSIT') f.balance += tx.amount;
          else f.balance -= tx.amount;
          if (tx.type === 'AD_SPEND') f.spent_amount += tx.amount;

          await this.apiRequest('big_fish', 'POST', f);
      }
  }

  async addGrowthTask(fishId: string, title: string, dueDate: string): Promise<void> {
      const f = await this.getBigFishById(fishId);
      if(f) {
          f.growth_tasks.unshift({ id: uuid(), title, is_completed: false, due_date: dueDate });
          await this.apiRequest('big_fish', 'POST', f);
      }
  }

  async toggleGrowthTask(fishId: string, taskId: string): Promise<void> {
      const f = await this.getBigFishById(fishId);
      if(f) {
          const t = f.growth_tasks.find(x => x.id === taskId);
          if(t) t.is_completed = !t.is_completed;
          await this.apiRequest('big_fish', 'POST', f);
      }
  }

  async updateTargets(fishId: string, target: number, current: number): Promise<void> {
      const f = await this.getBigFishById(fishId);
      if(f) {
          f.target_sales = target;
          f.current_sales = current;
          await this.apiRequest('big_fish', 'POST', f);
      }
  }

  async addWorkLog(fishId: string, task: string): Promise<void> {
      const f = await this.getBigFishById(fishId);
      if(f) {
          f.reports.unshift({ id: uuid(), date: new Date().toISOString(), task });
          await this.apiRequest('big_fish', 'POST', f);
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
          return days <= 1 && days >= 0;
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
          return days <= 7 && days >= -5;
      });
  }

  async renewRetainer(id: string): Promise<void> {
      const f = await this.getBigFishById(id);
      if (f && f.retainer_renewal_date) {
          const current = new Date(f.retainer_renewal_date);
          current.setDate(current.getDate() + 30);
          f.retainer_renewal_date = current.toISOString().slice(0, 10);
          await this.apiRequest('big_fish', 'POST', f);
      }
  }

  getLifetimeDeposit(fish: BigFish): number {
      return fish.transactions
          .filter(t => t.type === 'DEPOSIT')
          .reduce((sum, t) => sum + t.amount, 0);
  }

  // --- PAYMENT METHODS ---
  async getPaymentMethods(): Promise<PaymentMethod[]> {
      return this.apiRequest<PaymentMethod[]>('payment_methods', 'GET');
  }

  async savePaymentMethod(data: Omit<PaymentMethod, 'id'>): Promise<void> {
      await this.apiRequest('payment_methods', 'POST', { ...data, id: uuid() });
  }

  async deletePaymentMethod(id: string): Promise<void> {
      await this.apiRequest('payment_methods', 'DELETE', null, id);
  }

  // --- MESSENGER BABA (MOCK) ---
  async getMessengerConversations(): Promise<MessengerConversation[]> {
      return this.apiRequest<MessengerConversation[]>('messenger_conversations', 'GET');
  }

  async simulateIncomingMessage(text: string, senderName: string): Promise<void> {
      const convs = await this.getMessengerConversations();
      let conv = convs.find(c => c.customer_name === senderName);
      let newConv = false;
      
      if(!conv) {
          newConv = true;
          conv = {
              id: uuid(),
              facebook_user_id: uuid(),
              customer_name: senderName,
              messages: [],
              last_message: '',
              last_updated: '',
              is_lead_linked: false
          };
      }
      
      conv.messages.push({
          id: uuid(),
          sender: 'customer' as const,
          type: 'text' as const,
          content: text,
          timestamp: new Date().toISOString()
      });
      conv.last_message = text;
      conv.last_updated = new Date().toISOString();

      const phoneMatch = text.match(/(?:\+88|88)?(01[3-9]\d{8})/);
      if(phoneMatch && !conv.customer_phone) {
          conv.customer_phone = phoneMatch[0];
          conv.is_lead_linked = true;
          await this.createLead({
              full_name: senderName,
              primary_phone: phoneMatch[0],
              source: LeadSource.FACEBOOK_MESSENGER
          });
      }

      await this.apiRequest('messenger_conversations', 'POST', conv);
  }

  // --- SYSTEM SETTINGS ---
  async getSystemSettings(): Promise<SystemSettings> {
      const data = await this.apiRequest<{id: string, value: SystemSettings}[]>('settings', 'GET');
      const settings = data.find(d => d.id === 'system_settings');
      return settings ? settings.value : {
          facebook_page_token: '',
          facebook_verify_token: '',
          sms_api_key: '',
          sms_sender_id: '',
          sms_base_url: '',
          timezone: 'Asia/Dhaka',
          system_api_key: 'lg_' + uuid()
      };
  }

  async saveSystemSettings(settings: SystemSettings): Promise<void> {
      await this.apiRequest('settings', 'POST', { id: 'system_settings', value: settings });
  }

  // --- SALES GOALS ---
  async getSalesTargets(): Promise<MonthlyTarget[]> {
      return this.apiRequest<MonthlyTarget[]>('sales_targets', 'GET');
  }

  async setSalesTarget(target: Omit<MonthlyTarget, 'id'>): Promise<void> {
      const targets = await this.getSalesTargets();
      const existing = targets.find(t => t.month === target.month && t.service === target.service);
      const data = existing ? { ...existing, ...target } : { ...target, id: uuid() };
      await this.apiRequest('sales_targets', 'POST', data);
  }

  async getSalesEntries(): Promise<SalesEntry[]> {
      return this.apiRequest<SalesEntry[]>('sales_entries', 'GET');
  }

  async addSalesEntry(entry: Omit<SalesEntry, 'id' | 'created_at'>): Promise<void> {
      await this.apiRequest('sales_entries', 'POST', { ...entry, id: uuid(), created_at: new Date().toISOString() });
  }

  async updateSalesEntry(id: string, entry: Partial<SalesEntry>): Promise<void> {
      const entries = await this.getSalesEntries();
      const existing = entries.find(e => e.id === id);
      if(existing) {
          await this.apiRequest('sales_entries', 'POST', { ...existing, ...entry });
      }
  }

  async deleteSalesEntry(id: string): Promise<void> {
      await this.apiRequest('sales_entries', 'DELETE', null, id);
  }

  // --- AD SWIPE FILE ---
  async getAdInspirations(): Promise<AdInspiration[]> {
      return this.apiRequest<AdInspiration[]>('ad_inspirations', 'GET');
  }

  async addAdInspiration(data: Omit<AdInspiration, 'id' | 'created_at'>): Promise<void> {
      await this.apiRequest('ad_inspirations', 'POST', { ...data, id: uuid(), created_at: new Date().toISOString() });
  }

  async deleteAdInspiration(id: string): Promise<void> {
      await this.apiRequest('ad_inspirations', 'DELETE', null, id);
  }
}

export const mockService = new MockService();