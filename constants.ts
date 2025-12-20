
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
  [LeadStatus.CLOSED_WON]: "bg-green-100 text-green-800 border border-green-200",
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
        first_contact_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
    },
    {
        id: 'dl_3',
        full_name: 'Rahim Uddin',
        primary_phone: '01655667788',
        source: LeadSource.WEBSITE,
        status: LeadStatus.INTERESTED,
        industry: '🍽️ Restaurant (রেস্টুরেন্ট)',
        service_category: 'Facebook Marketing',
        is_starred: false,
        is_unread: true,
        total_messages_sent: 1,
        first_contact_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
    },
    {
        id: 'dl_4',
        full_name: 'Nusrat Jahan',
        primary_phone: '01911223344',
        source: LeadSource.FACEBOOK_MESSENGER,
        status: LeadStatus.WORKING,
        industry: '💄 Beauty (বিউটি)',
        service_category: 'Development',
        is_starred: true,
        is_unread: false,
        total_messages_sent: 5,
        first_contact_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
    },
    {
        id: 'dl_5',
        full_name: 'Karim Enterprise',
        primary_phone: '01555666777',
        source: LeadSource.MANUAL,
        status: LeadStatus.CLOSED_WON,
        industry: '🏠 Real Estate (রিয়েল স্টেট)',
        service_category: 'Development',
        is_starred: false,
        is_unread: false,
        total_messages_sent: 10,
        first_contact_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
    },
    {
        id: 'dl_6',
        full_name: 'Travel Xpress',
        primary_phone: '01333444555',
        source: LeadSource.FORM,
        status: LeadStatus.NEW,
        industry: '✈️ Travel (ট্রাভেল)',
        service_category: 'Landing Page',
        is_starred: false,
        is_unread: true,
        total_messages_sent: 0,
        first_contact_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
    },
    {
        id: 'dl_7',
        full_name: 'Gadget World',
        primary_phone: '01777888999',
        source: LeadSource.FACEBOOK_MESSENGER,
        status: LeadStatus.ATTEMPTED_CONTACT,
        industry: '📱 Gadget (গেজেট)',
        service_category: 'Facebook Marketing',
        is_starred: false,
        is_unread: false,
        total_messages_sent: 1,
        first_contact_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
    },
    {
        id: 'dl_8',
        full_name: 'Farhana Akter',
        primary_phone: '01811221122',
        source: LeadSource.IMPORT,
        status: LeadStatus.COLD,
        industry: '👗 Fashion (ফ্যাশন)',
        service_category: 'Facebook Marketing',
        is_starred: false,
        is_unread: false,
        total_messages_sent: 0,
        first_contact_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
    },
    {
        id: 'dl_9',
        full_name: 'Build Master Ltd',
        primary_phone: '01600000001',
        source: LeadSource.MANUAL,
        status: LeadStatus.INTERESTED,
        industry: '🏠 Real Estate (রিয়েল স্টেট)',
        service_category: 'Development',
        is_starred: true,
        is_unread: false,
        total_messages_sent: 3,
        first_contact_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
    },
    {
        id: 'dl_10',
        full_name: 'Organic Foods BD',
        primary_phone: '01999888777',
        source: LeadSource.FACEBOOK_MESSENGER,
        status: LeadStatus.HOT,
        industry: '🛍️ E-commerce (ইকমার্স)',
        service_category: 'Landing Page',
        is_starred: true,
        is_unread: true,
        total_messages_sent: 4,
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
        balance: 155.50,
        low_balance_alert_threshold: 20,
        total_budget: 2000,
        spent_amount: 1844.50,
        target_sales: 500,
        current_sales: 342,
        transactions: [
            { id: 'tx_1', date: new Date().toISOString(), type: 'DEPOSIT', amount: 200, description: 'Balance Top-up via bKash' },
            { id: 'tx_2', date: new Date(Date.now() - 86400000).toISOString(), type: 'AD_SPEND', amount: 15.50, description: 'Daily Ad Spend (May 15)' },
            { id: 'tx_3', date: new Date(Date.now() - 172800000).toISOString(), type: 'AD_SPEND', amount: 12.00, description: 'Daily Ad Spend (May 14)' },
        ],
        campaign_records: [],
        topup_requests: [],
        growth_tasks: [
            { id: 'gt_1', title: 'Launch Eid Collection Ads', is_completed: true, due_date: new Date().toISOString() },
            { id: 'gt_2', title: 'Setup Retargeting Pixel', is_completed: false }
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
                allow_topup_request: true
            } 
        },
        start_date: new Date(Date.now() - 7776000000).toISOString(), // 3 months ago
        facebook_page: 'https://fb.com/urbanvoguebd'
    },
    {
        id: 'bf_2',
        lead_id: 'dl_5',
        name: 'Dhaka Dine Restaurant',
        phone: '01555666777',
        status: 'Active Pool',
        package_name: 'Local Awareness',
        balance: 5.25, // LOW BALANCE
        low_balance_alert_threshold: 15,
        total_budget: 500,
        spent_amount: 494.75,
        target_sales: 1000,
        current_sales: 850,
        transactions: [],
        growth_tasks: [],
        reports: [],
        portal_config: { show_balance: true, show_history: true, is_suspended: false },
        start_date: new Date().toISOString()
    },
    {
        id: 'bf_3',
        lead_id: 'dl_9',
        name: 'Build Master Real Estate',
        phone: '01600000001',
        status: 'Active Pool',
        package_name: 'Lead Gen Pro',
        balance: 450.00,
        low_balance_alert_threshold: 50,
        total_budget: 5000,
        spent_amount: 1200,
        target_sales: 50,
        current_sales: 12,
        transactions: [],
        growth_tasks: [],
        reports: [],
        portal_config: { show_balance: true, show_history: true, is_suspended: false },
        start_date: new Date().toISOString(),
        is_retainer: true,
        retainer_amount: 25000,
        retainer_renewal_date: new Date(Date.now() + 259200000).toISOString() // 3 days later
    },
    {
        id: 'bf_4',
        lead_id: 'dl_7',
        name: 'Gadget Gear',
        phone: '01777888999',
        status: 'Active Pool',
        package_name: 'Standard',
        balance: 45.00,
        low_balance_alert_threshold: 10,
        total_budget: 100,
        spent_amount: 55,
        target_sales: 100,
        current_sales: 20,
        transactions: [],
        growth_tasks: [],
        reports: [],
        portal_config: { show_balance: true, show_history: true, is_suspended: false },
        start_date: new Date().toISOString(),
        topup_requests: [
            { 
                id: 'tr_1', 
                client_id: 'bf_4', 
                client_name: 'Gadget Gear', 
                amount: 100, 
                method_name: 'bKash', 
                sender_number: '017XXX999', 
                status: 'PENDING', 
                created_at: new Date().toISOString() 
            }
        ]
    }
];

// --- INITIAL TEMPLATES (PERMANENT DEMO DATA) ---
export const INITIAL_TEMPLATES = [
    // --- GENERAL ---
    {
        name: "Generic Welcome",
        category: "General",
        channel: Channel.SMS,
        type: "intro",
        body: "আসসালামু আলাইকুম! Social Ads Expert এ যোগাযোগ করার জন্য ধন্যবাদ। আমরা আপনার মেসেজটি পেয়েছি। একজন প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন। জরুরি প্রয়োজনে কল করুন: 01798205143",
        is_active: true
    },
    {
        name: "Office Hours / Away",
        category: "General",
        channel: Channel.SMS,
        type: "info",
        body: "ধন্যবাদ। আমাদের অফিস সময় সকাল ১০টা থেকে রাত ৮টা পর্যন্ত। আমরা আপনার মেসেজটি নোট করেছি এবং অফিস খুললেই আপনাকে কল করা হবে। - Social Ads Expert",
        is_active: true
    },
    {
        name: "Missed Call Reply",
        category: "General",
        channel: Channel.SMS,
        type: "followup",
        body: "দুঃখিত, আমরা আপনার কলটি ধরতে পারিনি। দয়া করে আপনার নাম এবং কি বিষয়ে জানতে চান তা লিখে এসএমএস করুন। আমরা কল ব্যাক করবো।",
        is_active: true
    },
    {
        name: "Payment Received",
        category: "General",
        channel: Channel.SMS,
        type: "update",
        body: "✅ পেমেন্ট রিসিভড! আপনার পেমেন্ট সফলভাবে জমা হয়েছে। আমাদের সাথে থাকার জন্য ধন্যবাদ। পরবর্তী আপডেট শীঘ্রই জানানো হবে।",
        is_active: true
    },
    {
        name: "Review Request",
        category: "General",
        channel: Channel.SMS,
        type: "closing",
        body: "প্রিয় গ্রাহক, আমাদের সার্ভিস আপনার কেমন লেগেছে? আপনার মতামত আমাদের জন্য খুব গুরুত্বপূর্ণ। সময় পেলে আমাদের পেজে একটি রিভিউ দেওয়ার অনুরোধ রইলো। ধন্যবাদ!",
        is_active: true
    },

    // --- FACEBOOK MARKETING ---
    {
        name: "FB Ads Intro",
        category: "Facebook Marketing",
        channel: Channel.MESSENGER,
        type: "intro",
        body: "আপনার কি ফেসবুক পেজ আছে কিন্তু সেল আসছে না? 🤔 আমরা দিচ্ছি টার্গেটেড ফেসবুক মার্কেটিং সার্ভিস যা আপনার সেলস বাড়াতে সাহায্য করবে। আমাদের প্যাকেজ দেখতে 'Yes' লিখুন। - Social Ads Expert",
        is_active: true
    },
    {
        name: "Portfolio Share",
        category: "Facebook Marketing",
        channel: Channel.MESSENGER,
        type: "info",
        body: "আমাদের আগের কাজের কিছু নমুনা এবং ক্লায়েন্ট সাকসেস স্টোরি এখানে দেখতে পারেন: [Portfolio Link]। আমরা ১০০০+ বিজনেসের সেলস গ্রোথ নিশ্চিত করেছি।",
        is_active: true
    },
    {
        name: "Package Pricing",
        category: "Facebook Marketing",
        channel: Channel.MESSENGER,
        type: "sales",
        body: "আমাদের বুস্টিং প্যাকেজ শুরু ১০ ডলার থেকে। বিস্তারিত কথা বলতে আপনার ফোন নাম্বারটি দিন, আমরা কল করবো।",
        is_active: true
    },
    {
        name: "Ads Follow-up (3 Days)",
        category: "Facebook Marketing",
        channel: Channel.MESSENGER,
        type: "followup",
        body: "হ্যালো, আপনি কি আপনার বিজনেসের মার্কেটিং নিয়ে কোনো সিদ্ধান্ত নিলেন? আমরা এই সপ্তাহে স্পেশাল ডিসকাউন্ট দিচ্ছি। অফারটি নিতে চাইলে আজই কনফার্ম করুন।",
        is_active: true
    },
    {
        name: "Reporting Update",
        category: "Facebook Marketing",
        channel: Channel.MESSENGER,
        type: "update",
        body: "আপনার এই সপ্তাহের অ্যাড রিপোর্ট রেডি 📊। টোটাল রিচ: ২০,০০০+, মেসেজ: ৫০+। বিস্তারিত রিপোর্ট ইমেইলে পাঠানো হয়েছে। চেক করে জানাবেন।",
        is_active: true
    },

    // --- LANDING PAGE ---
    {
        name: "LP Requirement Ask",
        category: "Landing Page",
        channel: Channel.MESSENGER,
        type: "intro",
        body: "আপনার ল্যান্ডিং পেজের জন্য আমাদের এই তথ্যগুলো প্রয়োজন: ১. লোগো ২. প্রোডাক্ট ছবি ৩. অফার প্রাইস ৪. ডোমেইন এক্সেস (যদি থাকে)। এগুলো রেডি হলে জানাবেন।",
        is_active: true
    },
    {
        name: "Domain/Hosting Info",
        category: "Landing Page",
        channel: Channel.MESSENGER,
        type: "info",
        body: "ল্যান্ডিং পেজ লাইভ করার জন্য ডোমেইন ও হোস্টিং প্রয়োজন। আপনার কি কেনা আছে? না থাকলে আমরা কিনে দিতে পারবো। জানাবেন। - Social Ads Expert",
        is_active: true
    },
    {
        name: "Design Draft Review",
        category: "Landing Page",
        channel: Channel.MESSENGER,
        type: "update",
        body: "আপনার ল্যান্ডিং পেজের ডিজাইন ড্রাফট রেডি! 🎨 দয়া করে এই লিংকে গিয়ে দেখুন এবং কোনো পরিবর্তন লাগলে জানান: [Link]।",
        is_active: true
    },
    {
        name: "LP Testing Phase",
        category: "Landing Page",
        channel: Channel.MESSENGER,
        type: "update",
        body: "আপনার পেজ এখন লাইভ টেস্টিং এ আছে। অর্ডার ফর্ম ঠিকমতো কাজ করছে কিনা চেক করুন। সব ঠিক থাকলে আমরা ফাইনাল হ্যান্ডওভার দিবো।",
        is_active: true
    },
    {
        name: "Project Handover",
        category: "Landing Page",
        channel: Channel.MESSENGER,
        type: "closing",
        body: "অভিনন্দন! 🎉 আপনার ওয়েবসাইট এখন লাইভ। লগইন ডিটেলস আপনাকে হোয়াটসঅ্যাপে দেওয়া হয়েছে। পাসওয়ার্ড পরিবর্তন করে নিবেন। ধন্যবাদ আমাদের সাথে কাজ করার জন্য।",
        is_active: true
    },

    // --- BUSINESS PLAN ---
    {
        name: "Consultation Call",
        category: "Business Plan",
        channel: Channel.SMS,
        type: "intro",
        body: "আপনার বিজনেসের গ্রোথ প্ল্যান নিয়ে কথা বলতে চাই। আগামীকাল দুপুর ৩টায় কি আপনি ফ্রি আছেন? - Social Ads Expert",
        is_active: true
    },
    {
        name: "Strategy Sent",
        category: "Business Plan",
        channel: Channel.SMS,
        type: "info",
        body: "আপনার বিজনেসের জন্য আগামী ৩ মাসের একটি ডিজিটাল মার্কেটিং প্ল্যান আমরা ইমেইল করেছি। দয়া করে পিডিএফটি দেখুন। কোনো প্রশ্ন থাকলে কল করুন: 01798205143",
        is_active: true
    },
    {
        name: "Budget Approval",
        category: "Business Plan",
        channel: Channel.SMS,
        type: "sales",
        body: "আমরা যে বাজেট প্ল্যান দিয়েছি, সেটা কি আপনার জন্য ঠিক আছে? কনফার্ম করলে আমরা টিম সেটআপ শুরু করবো।",
        is_active: true
    },
    {
        name: "Goal Setting",
        category: "Business Plan",
        channel: Channel.SMS,
        type: "update",
        body: "এই মাসের টার্গেট: ১. সেলস ২০% বৃদ্ধি ২. নতুন কাস্টমার ৫০ জন। আমরা আজ থেকেই ক্যাম্পেইন অপ্টিমাইজেশন শুরু করছি।",
        is_active: true
    },
    {
        name: "Month End Review",
        category: "Business Plan",
        channel: Channel.SMS,
        type: "closing",
        body: "মাস শেষ হতে চললো। আগামী মাসের প্ল্যানিং এর জন্য একটি মিটিং প্রয়োজন। কবে আপনার সুবিধা হবে জানাবেন।",
        is_active: true
    }
];

// --- INITIAL LEAD FORMS (CLEARED AS REQUESTED) ---
export const INITIAL_LEAD_FORMS = [];

// --- INITIAL SNIPPETS DATA ---
export const INITIAL_SNIPPETS = [
    {
        title: "Payment Info (bKash/Nagad)",
        category: "Payment",
        body: "পেমেন্ট কনফার্ম করতে নিচে দেওয়া নাম্বারে সেন্ড মানি করুন।\n\nbKash (Personal): 01798205143\nNagad (Personal): 01798205143\n\nরেফারেন্স হিসেবে আপনার নাম ব্যবহার করুন এবং পেমেন্ট শেষে শেষের ৩ ডিজিট জানাবেন।"
    },
    {
        title: "First Inbox Message",
        category: "Intro",
        body: "আসসালামু আলাইকুম! Social Ads Expert এ আপনাকে স্বাগতম।\nআমি কিভাবে আপনাকে সাহায্য করতে পারি? আমাদের সার্ভিস সম্পর্কে বিস্তারিত জানতে 'Service' লিখে রিপ্লাই দিন।"
    },
    {
        title: "FB Marketing Details",
        category: "Service Info",
        body: "আমাদের ফেসবুক মার্কেটিং সার্ভিসে যা যা থাকছে:\n✅ অডিয়েন্স রিসার্চ\n✅ হাই-কনভার্টিং অ্যাড কপি\n✅ গ্রাফিক্স ডিজাইন সাপোর্ট\n✅ উইকলি রিপোর্ট\n✅ সেলস ফানেল সেটআপ\n\nআমাদের প্যাকেজ শুরু ১০,০০০ টাকা থেকে। আপনি কি ফ্রি কনসালটেশন চান?"
    },
    {
        title: "Website Req. Gathering",
        category: "Requirement",
        body: "আপনার ওয়েবসাইটের কাজের জন্য নিচের তথ্যগুলো প্রয়োজন:\n১. ডোমেইন নাম (যদি থাকে)\n২. পছন্দের ৩টি রেফারেন্স ওয়েবসাইট\n৩. লোগো এবং কালার প্রিফারেন্স\n৪. ওয়েবসাইটের কন্টেন্ট বা ছবি\n\nএগুলো রেডি হলে জানাবেন, আমরা কাজ শুরু করবো।"
    },
    {
        title: "Work Completed",
        category: "Update",
        body: "শুভ সংবাদ! 🎉 আপনার প্রজেক্টের কাজ সফলভাবে সম্পন্ন হয়েছে।\nদয়া করে চেক করে কনফার্ম করুন। কোনো পরিবর্তন প্রয়োজন হলে আগামী ২৪ ঘন্টার মধ্যে জানাবেন।"
    },
    {
        title: "Weekly Report Format",
        category: "Report",
        body: "📊 সাপ্তাহিক রিপোর্ট (Week 1)\n\n🔸 টোটাল রিচ: ১২,৫০০\n🔸 মেসেজ কনভার্সন: ৪৫টি\n🔸 টোটাল সেলস: ৮টি\n🔸 খরচ: $২০\n\nআগামী সপ্তাহের প্ল্যান: আমরা রি-টার্গেটিং অ্যাড রান করবো।"
    },
    {
        title: "Project Timeline",
        category: "Onboarding",
        body: "আপনার প্রজেক্টের টাইমলাইন:\n📅 শুরু: [Start Date]\n📅 শেষ: [End Date]\n\nআমরা ৩টি ধাপে কাজ করবো: ডিজাইন > ডেভেলপমেন্ট > টেস্টিং।\nধন্যবাদ আমাদের সাথে থাকার জন্য।"
    }
];

// --- INVOICE CONSTANTS ---
export const INVOICE_SERVICE_TYPES = [
    "Facebook Marketing Service",
    "Website Development",
    "Landing Page Design",
    "Server-side Tracking Setup",
    "Conversion API Setup",
    "Google Ads Management",
    "Graphics Design Package",
    "Video Editing Service"
];

export const DEFAULT_INVOICE_TERMS = "1. Payment is due within 7 days of invoice date.\n2. Please include the invoice number as a reference when paying.\n3. Services are non-refundable once the work has commenced.\n4. Late payments may be subject to a 5% surcharge.";

// --- LETTERHEAD TEMPLATES ---
export const LETTERHEAD_TEMPLATES: Record<string, string> = {
    FB_REPORT: `
<h3 style="color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 16px;">📈 Facebook Marketing Performance Report</h3>

<p><strong>Project Name:</strong> [Enter Page Name Here]</p>
<p><strong>Reporting Period:</strong> [Date Range]</p>
<p><strong>Total Budget Spent:</strong> $100</p>

<h4 style="margin-top: 24px; color: #374151;">📊 Campaign Results</h4>
<ul>
    <li><strong>Total Reach:</strong> [0,000] People</li>
    <li><strong>Post Engagement:</strong> [0,000] Reactions/Comments</li>
    <li><strong>Total Messages/Leads:</strong> [00] Leads</li>
    <li><strong>Cost Per Result:</strong> $[0.00]</li>
</ul>

<h4 style="margin-top: 24px; color: #374151;">💡 Analysis & Insights</h4>
<p>
    This month, we successfully identified the winning audience segment (Age 25-34). 
    However, the ad creative fatigue increased towards the end of the month.
</p>

<h4 style="margin-top: 24px; color: #374151;">🚀 Recommendations for Next Month</h4>
<ol>
    <li>Increase budget for the retargeting campaign to capture lost leads.</li>
    <li>Launch new video creatives (Reels) to boost organic reach.</li>
    <li>Optimize the landing page for faster loading speed.</li>
</ol>
`,
    WEB_HANDOVER: `
<h3 style="color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 16px;">💻 Website Handover Credentials</h3>

<p>Dear Client,</p>
<p>We are pleased to inform you that your website development project is complete. Below are the access details for your website admin panel. Please keep this information secure.</p>

<h4 style="margin-top: 24px; color: #374151;">🔐 Admin Access Details</h4>
<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
    <tr style="background-color: #f3f4f6;">
        <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Login URL</strong></td>
        <td style="padding: 8px; border: 1px solid #e5e7eb;">[yourdomain.com/wp-admin]</td>
    </tr>
    <tr>
        <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Username</strong></td>
        <td style="padding: 8px; border: 1px solid #e5e7eb;">[admin_user]</td>
    </tr>
    <tr style="background-color: #f3f4f6;">
        <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Password</strong></td>
        <td style="padding: 8px; border: 1px solid #e5e7eb;">[TempPassword123!]</td>
    </tr>
</table>

<h4 style="margin-top: 24px; color: #374151;">⚠️ Important Instructions</h4>
<ul>
    <li>Please change your password immediately after your first login.</li>
    <li>Keep your plugins and themes updated to ensure security.</li>
    <li>We have installed a backup plugin; please schedule weekly backups.</li>
</ul>

<p style="margin-top: 20px;">If you face any technical issues within the next 7 days, please let us know immediately.</p>
`,
    LANDING_HANDOVER: `
<h3 style="color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 16px;">🚀 Landing Page Project Completion</h3>

<p><strong>Project:</strong> High-Converting Landing Page Design</p>
<p><strong>Live URL:</strong> <a href="#">[www.your-landing-page.com]</a></p>

<h4 style="margin-top: 24px; color: #374151;">✅ Completed Features</h4>
<ul>
    <li>Fully Responsive Design (Mobile & Desktop Optimized)</li>
    <li>Facebook Pixel & Conversion API Integrated</li>
    <li>Lead Form Connected to Google Sheets/CRM</li>
    <li>Speed Optimization (PageSpeed Score: 90+)</li>
    <li>Sticky 'Order Now' Button for higher conversions</li>
</ul>

<h4 style="margin-top: 24px; color: #374151;">🛠️ Technical Stack Used</h4>
<p>WordPress / Elementor Pro / HTML5 / Tailwind CSS</p>

<h4 style="margin-top: 24px; color: #374151;">📞 Support</h4>
<p>Your 1-month free maintenance support starts from today. This covers text changes, image swaps, and bug fixes.</p>
`,
    BUSINESS_PLAN: `
<h3 style="color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 16px;">📅 Monthly Digital Marketing Plan</h3>

<p><strong>Client:</strong> [Client Name]</p>
<p><strong>Month:</strong> [Month, Year]</p>

<h4 style="margin-top: 24px; color: #374151;">🎯 Primary Objectives</h4>
<ul>
    <li>Increase Brand Awareness by 20%</li>
    <li>Generate 150+ Qualified Leads</li>
    <li>Achieve a ROAS (Return on Ad Spend) of 3.0x</li>
</ul>

<h4 style="margin-top: 24px; color: #374151;">📢 Strategy & Channels</h4>
<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
    <tr style="background-color: #f3f4f6;">
        <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Channel</th>
        <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Activity</th>
        <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Budget</th>
    </tr>
    <tr>
        <td style="padding: 8px; border: 1px solid #e5e7eb;">Facebook Ads</td>
        <td style="padding: 8px; border: 1px solid #e5e7eb;">Traffic & Message Campaigns</td>
        <td style="padding: 8px; border: 1px solid #e5e7eb;">$200</td>
    </tr>
    <tr>
        <td style="padding: 8px; border: 1px solid #e5e7eb;">Google Ads</td>
        <td style="padding: 8px; border: 1px solid #e5e7eb;">Search Intent (PPC)</td>
        <td style="padding: 8px; border: 1px solid #e5e7eb;">$150</td>
    </tr>
     <tr>
        <td style="padding: 8px; border: 1px solid #e5e7eb;">Content</td>
        <td style="padding: 8px; border: 1px solid #e5e7eb;">12 Social Media Posts</td>
        <td style="padding: 8px; border: 1px solid #e5e7eb;">-</td>
    </tr>
</table>

<h4 style="margin-top: 24px; color: #374151;">📅 Action Plan Timeline</h4>
<ul>
    <li><strong>Week 1:</strong> Content Creation & Ad Account Setup</li>
    <li><strong>Week 2:</strong> Launch Awareness Campaign</li>
    <li><strong>Week 3:</strong> Launch Retargeting Ads</li>
    <li><strong>Week 4:</strong> Analysis & Optimization Report</li>
</ul>
`
};
