
export enum UserRole {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
}

export enum LeadStatus {
  NEW = 'new',
  ATTEMPTED_CONTACT = 'attempted_contact',
  INTERESTED = 'interested',
  HOT = 'hot',
  WORKING = 'working',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost',
  COLD = 'cold',
}

export enum LeadSource {
  FACEBOOK_MESSENGER = 'facebook_messenger',
  MANUAL = 'manual',
  IMPORT = 'import',
  WEBSITE = 'website',
  FORM = 'form_submission',
  N8N_WEBHOOK = 'n8n_automation', // Added N8N Source
  GOOGLE_FORM = 'google_form', // Added Google Form Source
}

export enum Channel {
  SMS = 'sms',
  MESSENGER = 'facebook_messenger',
  PHONE_CALL = 'phone_call',
  OTHER = 'other',
}

export enum MessageDirection {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Lead {
  id: string;
  full_name: string;
  primary_phone: string;
  facebook_profile_link?: string;
  website_url?: string;
  source: LeadSource;
  status: LeadStatus;
  
  industry?: string; 
  service_category?: string; // NEW: Live Category (FB Marketing, Dev, LP)
  quick_note?: string; // NEW: Single line quick note
  download_count: number; // NEW: Track export count
  is_starred: boolean; 
  is_unread: boolean; 

  total_messages_sent: number;

  first_contact_at: string; 
  last_activity_at: string; 
  created_at: string;
  active_campaign_id?: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export interface Interaction {
  id: string;
  lead_id: string;
  channel: Channel;
  direction: MessageDirection;
  content: string;
  created_at: string;
}

export interface ScheduledMessage {
  id: string;
  lead_id: string;
  template_id?: string; 
  template_name: string;
  body: string; 
  scheduled_at: string; 
  status: 'pending' | 'sent' | 'cancelled';
  created_at: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  category: string;
  type: string;
  channel: Channel;
  body: string;
  is_active: boolean;
}

export interface CampaignStep {
  id: string;
  delay_days: number;
  template_id: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  steps: CampaignStep[];
  active_leads_count: number;
  is_active: boolean;
}

export interface SimpleAutomationRule {
    id: string;
    status: LeadStatus; 
    steps: {
        id: string;
        delay_days: number; 
        send_time: string; 
        template_id?: string; 
        custom_body?: string; 
    }[];
    is_active: boolean;
}

export interface LeadForm {
    id: string;
    title: string;
    subtitle: string;
    config: {
        include_website: boolean;
        include_facebook: boolean;
        include_industry: boolean;
        theme_color: string;
    };
    created_at: string;
}

// 1. Online Customers (Raw Data)
export interface Customer {
    id: string;
    phone: string;
    name?: string;
    category?: string; // e.g. Dress, Bag, Shoes
    date_added: string;
}

// 2. Daily Tasks
export interface Task {
    id: string;
    text: string;
    is_completed: boolean;
    created_at: string;
    due_date?: string; // NEW: Due Date & Time
}

// 3. Invoice
export interface InvoiceItem {
    description: string;
    quantity: number;
    rate: number;
}

export interface Invoice {
    id: string;
    number: string;
    client_name: string;
    client_phone?: string;
    client_address?: string;
    items: InvoiceItem[];
    status: 'paid' | 'unpaid' | 'new';
    date: string;
    created_at: string;
    
    // Payment Tracking
    paid_amount: number; // For advance/partial payments

    // New Fields
    terms_enabled: boolean;
    terms_content?: string;
}

// 4. Quick Message Snippet
export interface Snippet {
    id: string;
    title: string;
    category: string; // e.g., Payment, Report, Intro
    body: string;
}

// 5. Letterhead Document
export interface Document {
    id: string;
    title: string;
    client_id?: string;
    client_name?: string;
    content: string; // The HTML/Text content of the letter
    created_at: string;
}

// 6. BIG FISH (VIP Clients) - EXPANDED

export interface Transaction {
    id: string;
    date: string;
    type: 'DEPOSIT' | 'DEDUCT' | 'AD_SPEND' | 'SERVICE_CHARGE';
    amount: number;
    description: string;
    metadata?: {
        impressions?: number;
        reach?: number;
        leads?: number;
        resultType?: 'SALES' | 'MESSAGES'; // NEW: Track what the result represents
        roas?: number;
    };
}

export interface GrowthTask {
    id: string;
    title: string;
    is_completed: boolean;
    due_date?: string;
}

export interface WorkLog {
    id: string;
    date: string;
    task: string;
}

export interface PortalConfig {
    show_balance: boolean;
    show_history: boolean;
    is_suspended: boolean;
    announcement_title?: string;
    announcement_message?: string;
    shared_calculators?: {
        cpr: boolean;
        currency: boolean;
        roi: boolean;
    };
    // Deprecated in favor of global settings, but kept for interface compatibility if needed
    agency_support_phone?: string;
    agency_support_url?: string;
    agency_fb_group?: string;
}

export interface BigFish {
    id: string;
    lead_id: string;
    name: string;
    status: 'Active Pool' | 'Hall of Fame'; // Active vs Completed
    package_name?: string; // e.g. "Pro Scale Plan"

    // Financials (Wallet)
    balance: number;
    low_balance_alert_threshold: number;
    
    // Legacy fields (kept for compatibility or aggregate stats)
    total_budget: number;
    spent_amount: number;
    
    // Targets
    target_sales: number;
    current_sales: number;
    
    // Links & Contact
    facebook_page?: string;
    website_url?: string;
    phone: string;
    notes?: string; // Admin Notes
    
    // Campaign Dates (New)
    campaign_start_date?: string;
    campaign_end_date?: string;

    // Advanced Data
    transactions: Transaction[];
    growth_tasks: GrowthTask[];
    reports: WorkLog[];
    portal_config: PortalConfig;
    
    start_date: string;
    end_date?: string;
}

// 7. Payment Methods (Global)
export interface PaymentMethod {
    id: string;
    type: 'BANK' | 'MOBILE';
    provider_name: string; // "City Bank", "bKash"
    
    // Common
    account_number: string;
    
    // Bank Specific
    account_name?: string;
    branch_name?: string;
    routing_number?: string;
    
    // Mobile Specific
    mobile_type?: 'Personal' | 'Merchant' | 'Agent';
    instruction?: 'Send Money' | 'Payment' | 'Cash Out';
}

// 8. MESSAGE BABA (Messenger Integration)
export interface MessengerMessage {
    id: string;
    sender: 'customer' | 'page';
    type: 'text' | 'image' | 'link';
    content: string;
    timestamp: string;
}

export interface MessengerConversation {
    id: string;
    facebook_user_id: string;
    customer_name: string;
    customer_phone?: string; // Extracted phone
    messages: MessengerMessage[];
    last_message: string;
    last_updated: string;
    is_lead_linked: boolean; // True if connected to Lead system
}

// 9. SYSTEM SETTINGS (API Keys & Config)
export interface SystemSettings {
    // Facebook
    facebook_page_token: string;
    facebook_verify_token: string;
    
    // SMS
    sms_api_key: string;
    sms_sender_id: string;
    sms_base_url: string;
    
    // General
    timezone: string;

    // Global Portal Support Info
    portal_support_phone?: string;
    portal_support_url?: string;
    portal_fb_group?: string;

    // n8n & External API
    system_api_key?: string; // For incoming webhooks security
}

// 10. SALES GOALS & TRACKING (NEW)
export type SalesServiceType = 'FACEBOOK_ADS' | 'WEB_DEV' | 'LANDING_PAGE' | 'CONSULTANCY';

export interface MonthlyTarget {
    id: string;
    month: string; // Format: "YYYY-MM"
    service: SalesServiceType;
    target_amount: number;
    target_clients: number;
}

export interface SalesEntry {
    id: string;
    date: string; // ISO Date
    service: SalesServiceType;
    amount: number;
    description: string; // e.g. "Client Name - Project X"
    created_at: string;
}