
import { LeadStatus, Channel, LeadSource, BigFish } from './types';

export const APP_NAME = "Social Ads Expert";
export const DEFAULT_TIMEZONE = "Asia/Dhaka";

// Improved Color Palette for Statuses (Better Contrast)
export const STATUS_COLORS: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: "bg-blue-100 text-blue-800 border border-blue-200",
  [LeadStatus.ATTEMPTED_CONTACT]: "bg-amber-100 text-amber-800 border border-amber-200",
  [LeadStatus.INTERESTED]: "bg-indigo-100 text-indigo-800 border border-indigo-200",
  [LeadStatus.HOT]: "bg-orange-100 text-orange-800 border border-orange-200",
  [LeadStatus.WORKING]: "bg-purple-100 text-purple-800 border border-purple-200",
  [LeadStatus.CLOSED_WON]: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  [LeadStatus.CLOSED_LOST]: "bg-red-100 text-red-800 border border-red-200",
  [LeadStatus.COLD]: "bg-slate-100 text-slate-600 border border-slate-200",
};

export const STATUS_LABELS: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: "✨ New Lead",
  [LeadStatus.ATTEMPTED_CONTACT]: "📞 Attempted",
  [LeadStatus.INTERESTED]: "🧐 Interested",
  [LeadStatus.HOT]: "🔥 Hot Lead",
  [LeadStatus.WORKING]: "⚙️ Processing",
  [LeadStatus.CLOSED_WON]: "✅ Won",
  [LeadStatus.CLOSED_LOST]: "❌ Lost",
  [LeadStatus.COLD]: "🧊 Cold",
};

export const SERVICE_CATEGORIES = [
    "Facebook Marketing",
    "Development",
    "Landing Page"
];

// Initial Industries (Can be managed in app now)
export const INDUSTRIES = [
  "📢 Facebook Marketing (ফেসবুক মার্কেটিং)",
  "💻 Website Development (ওয়েবসাইট ডেভেলপমেন্ট)",
  "🎨 Landing Page Design (ল্যান্ডিং পেজ ডিজাইন)",
  "🛍️ E-commerce (ইকমার্স)",
  "🍽️ Restaurant (রেস্টুরেন্ট)",
  "👗 Fashion (ফ্যাশন)",
  "💄 Beauty (বিউটি)",
  "📱 Gadget (গেজেট)",
  "✈️ Travel (ট্রাভেল)",
  "🏠 Real Estate (রিয়েল স্টেট)"
];

// --- 10 HASAN DUMMY LEADS (SALES GUARANTEE) ---
const HASAN_LEADS = Array.from({ length: 10 }).map((_, i) => ({
    id: `hasan_lead_${i + 1}`,
    full_name: `Hasan Mahmud ${i + 1}`,
    primary_phone: `0171234567${i}`,
    source: LeadSource.FORM,
    status: LeadStatus.NEW,
    industry: '📢 Facebook Marketing (ফেসবুক মার্কেটিং)',
    service_category: 'Sales Guarantee',
    facebook_profile_link: `https://facebook.com/hasan.fashion.${i + 1}`,
    website_url: `https://hasan-shop-${i + 1}.com`,
    is_starred: i < 3, // First 3 starred
    is_unread: true,
    total_messages_sent: 0,
    download_count: 0,
    first_contact_at: new Date().toISOString(),
    last_activity_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    onboarding_data: {
        current_plan: `আমি বর্তমানে বুস্টিং করছি কিন্তু ভালো রেজাল্ট পাচ্ছি না। কস্ট বেশি হচ্ছে (Lead #${i + 1})।`,
        monthly_avg_budget: `${30000 + (i * 5000)}`,
        product_price: `${1200 + (i * 100)}`,
        marketing_budget_willingness: 'যদি গ্যারান্টি সেলস পাই তবে বাজেট বাড়াতে সমস্যা নেই।',
    }
}));

// --- 10 DEMO LEADS ---
export const DEMO_LEADS = [
    ...HASAN_LEADS, // Inject Hasan Leads at the top
    {
        id: 'dl_1',
        full_name: 'Tanvir Hasan',
        primary_phone: '01712345678',
        source: LeadSource.FACEBOOK_MESSENGER,
        status: LeadStatus.NEW,
        industry: '🛍️ E-commerce (ইকমার্স)',
        service_category: 'Facebook Marketing',
        is_starred: true,
        is_unread: true,
        total_messages_sent: 0,
        download_count: 0,
        first_contact_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
    },
    {
        id: 'dl_2',
        full_name: 'Sadia Islam',
        primary_phone: '01898765432',
        source: LeadSource.MANUAL,
        status: LeadStatus.HOT,
        industry: '👗 Fashion (ফ্যাশন)',
        service_category: 'Landing Page',
        is_starred: false,
        is_unread: false,
        total_messages_sent: 2,
        download_count: 0,
        first_contact_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
    }
];

// --- DEMO BIG FISH (VIP CLIENTS) ---
export const DEMO_BIG_FISH: BigFish[] = [
    {
        id: 'bf_1',
        lead_id: 'dl_1',
        name: 'Urban Vogue BD',
        phone: '01711223344',
        status: 'Active Pool',
        package_name: 'Premium Growth Package',
        balance: 250.00, // Adjusted to handle $150 deduction
        low_balance_alert_threshold: 20,
        total_budget: 2000,
        spent_amount: 150.00,
        target_sales: 500,
        current_sales: 0,
        transactions: [
            { id: 'tx_init', date: new Date().toISOString(), type: 'DEPOSIT', amount: 400, description: 'Initial Deposit' },
            { id: 'tx_demo', date: new Date().toISOString(), type: 'AD_SPEND', amount: 150, description: 'Ad Campaign: Test Entry' },
        ],
        campaign_records: [
            { 
                id: 'cr_demo_test', 
                start_date: new Date().toISOString().slice(0, 10), 
                end_date: new Date().toISOString().slice(0, 10), 
                amount_spent: 150.00,       // Client Bill ($)
                real_amount_spent: 100.00,  // Actual Cost ($)
                buying_rate: 130,           // Buy Rate (৳)
                client_rate: 145,           // Charge Rate (৳)
                impressions: 25000, 
                reach: 18000, 
                clicks: 1200, 
                result_type: 'MESSAGES', 
                results_count: 500,         // 500 Results
                created_at: new Date().toISOString() 
            }
        ],
        growth_tasks: [
            { id: 'gt_1', title: 'Verify Profit Calculation', is_completed: false },
        ],
        reports: [],
        portal_config: { 
            show_balance: true, 
            show_history: true, 
            is_suspended: false, 
            feature_flags: { 
                show_sales_report: true,
                show_profit_analysis: true,
                show_cpr_metrics: true,
                allow_topup_request: true,
                show_message_report: true,
                show_profit_loss_report: true
            } 
        },
        start_date: new Date().toISOString(),
    },
    {
        id: 'bf_5',
        lead_id: 'dl_2',
        name: 'Style Loft BD',
        phone: '01898765432',
        status: 'Active Pool',
        package_name: 'Scale Pro',
        balance: 450.00,
        low_balance_alert_threshold: 50,
        total_budget: 5000,
        spent_amount: 0,
        target_sales: 1000,
        current_sales: 0,
        transactions: [],
        campaign_records: [],
        growth_tasks: [],
        reports: [],
        portal_config: { 
            show_balance: true, 
            show_history: true, 
            is_suspended: false,
            feature_flags: {
                show_profit_analysis: true,
                show_cpr_metrics: true,
                show_message_report: true,
                show_sales_report: true,
                show_profit_loss_report: true,
                allow_topup_request: true
            }
        },
        start_date: new Date().toISOString()
    }
];

// --- INITIAL TEMPLATES (PERMANENT DEMO DATA) ---
export const INITIAL_TEMPLATES = [
    {
        name: "Generic Welcome",
        category: "General",
        channel: Channel.SMS,
        type: "intro",
        body: "আসসালামু আলাইকুম! Social Ads Expert এ যোগাযোগ করার জন্য ধন্যবাদ। আমরা আপনার মেসেজটি পেয়েছি। একজন প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন। জরুরি প্রয়োজনে কল করুন: 01798205143",
        is_active: true
    }
];

// --- INITIAL SNIPPETS DATA ---
export const INITIAL_SNIPPETS = [
    {
        title: "Payment Info (bKash/Nagad)",
        category: "Payment",
        body: "পেমেন্ট কনফার্ম করতে নিচে দেওয়া নাম্বারে সেন্ড মানি করুন।\n\nbKash (Personal): 01798205143\nNagad (Personal): 01798205143\n\nরেফারেন্স হিসেবে আপনার নাম ব্যবহার করুন এবং পেমেন্ট শেষে শেষের ৩ ডিজিট জানাবেন।"
    }
];

// --- INVOICE CONSTANTS ---
export const INVOICE_SERVICE_TYPES = [
    "Facebook Marketing Service",
    "Website Development",
    "Landing Page Design"
];

export const DEFAULT_INVOICE_TERMS = "1. Payment is due within 7 days.\n2. Please include invoice number in reference.";

// --- LETTERHEAD TEMPLATES ---
export const LETTERHEAD_TEMPLATES: Record<string, string> = {
    FB_REPORT: `<h3>📈 Facebook Performance Report</h3><p>Total Reach: [0,000]</p><p>Total Results: [00]</p>`,
    BUSINESS_PLAN: `<h3>📅 Marketing Strategy</h3><p>Goal: Increase ROI by 20%</p>`
};
