
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
  N8N_WEBHOOK = 'n8n_automation', 
  GOOGLE_FORM = 'google_form',
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

export interface ClientInteraction {
    id: string;
    date: string;
    type: 'CALL' | 'MEETING' | 'EMAIL' | 'WHATSAPP' | 'OTHER' | 'INVOICE' | 'TASK' | 'SALE' | 'BALANCE';
    notes: string;
    next_follow_up?: string;
    created_at: string;
}

export interface OnboardingData {
    current_plan?: string;
    monthly_avg_budget?: string;
    product_price?: string;
    marketing_budget_willingness?: string;
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
  service_category?: string;
  quick_note?: string;
  download_count: number;
  is_starred: boolean; 
  is_unread: boolean; 
  total_messages_sent: number;
  first_contact_at: string; 
  last_activity_at: string; 
  created_at: string;
  active_campaign_id?: string;
  interactions?: ClientInteraction[];
  onboarding_data?: OnboardingData;
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
    type?: 'SIMPLE' | 'ONBOARDING';
    config: {
        include_website: boolean;
        include_facebook: boolean;
        include_industry: boolean;
        theme_color: string;
    };
    created_at: string;
}

export interface Customer {
    id: string;
    phone: string;
    name?: string;
    category?: string;
    date_added: string;
}

export interface Task {
    id: string;
    text: string;
    is_completed: boolean;
    created_at: string;
    due_date?: string;
    lead_id?: string;
}

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
    paid_amount: number;
    terms_enabled: boolean;
    terms_content?: string;
}

export interface Snippet {
    id: string;
    title: string;
    category: string;
    body: string;
}

export interface Document {
    id: string;
    title: string;
    client_id?: string;
    client_name?: string;
    content: string;
    created_at: string;
}

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
        resultType?: 'SALES' | 'MESSAGES';
        roas?: number;
    };
}

export interface CampaignRecord {
    id: string;
    start_date: string;
    end_date: string;
    amount_spent: number; 
    real_amount_spent?: number; 
    buying_rate?: number; 
    client_rate?: number; 
    impressions: number;
    reach: number;
    clicks: number;
    result_type: 'SALES' | 'MESSAGES';
    results_count: number;
    product_price?: number;
    product_cost?: number;
    notes?: string;
    created_at: string;
}

export interface TopUpRequest {
    id: string;
    client_id: string;
    client_name: string;
    amount: number;
    method_name: string; 
    sender_number: string;
    screenshot_url?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    created_at: string;
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
    feature_flags?: {
        show_profit_analysis: boolean;
        show_cpr_metrics: boolean;
        allow_topup_request: boolean;
        show_message_report?: boolean;
        show_sales_report?: boolean;
        show_profit_loss_report?: boolean;
        show_payment_methods?: boolean;
    };
    announcement_title?: string;
    announcement_message?: string;
    shared_calculators?: {
        cpr: boolean;
        currency: boolean;
        roi: boolean;
    };
    agency_support_phone?: string;
    agency_support_url?: string;
    agency_fb_group?: string;
}

export interface BigFish {
    id: string;
    lead_id: string;
    name: string;
    status: 'Active Pool' | 'Hall of Fame'; 
    package_name?: string; 
    balance: number;
    low_balance_alert_threshold: number;
    total_budget: number;
    spent_amount: number;
    target_sales: number;
    current_sales: number;
    facebook_page?: string;
    website_url?: string;
    phone: string;
    notes?: string;
    campaign_start_date?: string;
    campaign_end_date?: string;
    transactions: Transaction[];
    campaign_records?: CampaignRecord[];
    topup_requests?: TopUpRequest[];
    growth_tasks: GrowthTask[];
    reports: WorkLog[];
    interactions?: ClientInteraction[];
    portal_config: PortalConfig;
    start_date: string;
    end_date?: string;
    is_retainer?: boolean;
    retainer_amount?: number;
    retainer_renewal_date?: string;
    retainer_status?: 'ACTIVE' | 'PAUSED';
}

export interface PaymentMethod {
    id: string;
    type: 'BANK' | 'MOBILE';
    provider_name: string;
    account_number: string;
    account_name?: string;
    branch_name?: string;
    routing_number?: string;
    mobile_type?: 'Personal' | 'Merchant' | 'Agent';
    instruction?: 'Send Money' | 'Payment' | 'Cash Out';
}

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
    customer_phone?: string;
    messages: MessengerMessage[];
    last_message: string;
    last_updated: string;
    is_lead_linked: boolean;
}

export interface SystemSettings {
    facebook_page_token: string;
    facebook_verify_token: string;
    sms_api_key: string;
    sms_sender_id: string;
    sms_base_url: string;
    timezone: string;
    portal_support_phone?: string;
    portal_support_url?: string;
    portal_fb_group?: string;
    system_api_key?: string;
}

export type SalesServiceType = 'FACEBOOK_ADS' | 'WEB_DEV' | 'LANDING_PAGE' | 'CONSULTANCY';

export interface MonthlyTarget {
    id: string;
    month: string;
    service: SalesServiceType;
    target_amount: number;
    target_clients: number;
}

export interface SalesEntry {
    id: string;
    date: string;
    service: SalesServiceType;
    amount: number;
    description: string;
    created_at: string;
}

export interface AdInspiration {
    id: string;
    title: string;
    url: string;
    image_url?: string;
    category: string;
    notes: string;
    created_at: string;
}
