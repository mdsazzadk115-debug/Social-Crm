
import React, { useState, useEffect } from 'react';
// @ts-ignore
import { useParams } from 'react-router-dom';
import { mockService } from '../services/mockService';
import { LeadForm } from '../types';
import { CheckCircle, AlertCircle, ShieldCheck, User, Link as LinkIcon, Phone, FileText, DollarSign, Send, X } from 'lucide-react';

const THEME_COLORS: Record<string, string> = {
    indigo: '#4f46e5',
    blue: '#2563eb',
    green: '#16a34a',
    red: '#dc2626',
    orange: '#ea580c',
    purple: '#9333ea',
    pink: '#db2777',
    navy: '#1e3a8a', // Dark Navy for Guarantee Form
};

const PublicForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [form, setForm] = useState<LeadForm | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    
    // Form State
    const [formData, setFormData] = useState({
        name: '', // Page Name (Mapped to full_name)
        phone: '', // Phone Number
        website: '', 
        facebook: '', // Page Link (Mapped to profile link)
        industry: '',
        // Onboarding Specific Fields
        current_plan: '', // Business Status
        monthly_avg_budget: '', // Previous Budget
        product_price: '', // Product Price
        marketing_budget_willingness: '' // Future Plan
    });

    useEffect(() => {
        if(id) {
            // Load form directly from Database via Service
            mockService.getFormById(id).then(f => {
                setForm(f || null);
                setLoading(false);
            }).catch(e => {
                console.error("Failed to load form", e);
                setLoading(false);
            });
        }
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.name || !formData.phone) {
            setError('Please fill in required fields (Name & Phone).');
            return;
        }

        try {
            // Use ID if available, or 'portable' identifier
            const formId = form?.id || 'unknown';
            
            // Construct payload based on type
            const submissionData = {
                ...formData,
                form_type: form?.type
            };

            await mockService.submitLeadForm(formId, submissionData);
            setSubmitted(true);
        } catch(e) {
            setError('Something went wrong. Please try again.');
        }
    };

    if(loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading form...</div>;
    
    if(!form) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
             <div className="text-center">
                 <h1 className="text-2xl font-bold text-gray-800">Form Not Found</h1>
                 <p className="text-gray-500 mt-2">The link you followed may be broken or the form has been removed.</p>
             </div>
        </div>
    );

    if(submitted) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-inter">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center bg-green-100 mb-4`}>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
                <p className="text-gray-600">আপনার তথ্য সফলভাবে জমা দেওয়া হয়েছে। আমাদের টিম খুব শীঘ্রই আপনার সাথে যোগাযোগ করবে।</p>
            </div>
        </div>
    );

    const themeColorKey = form.config.theme_color || 'indigo';
    const primaryColor = THEME_COLORS[themeColorKey] || THEME_COLORS['indigo'];
    const isOnboarding = form.type === 'ONBOARDING';

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4 sm:px-6 font-inter">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                
                {/* Custom Header for Sales Guarantee */}
                {isOnboarding ? (
                    <div className="bg-gradient-to-r from-[#111827] to-[#1f2937] p-6 flex justify-between items-center text-white relative overflow-hidden">
                        <div className="relative z-10 flex items-center gap-3">
                            <div className="p-2.5 bg-yellow-500/20 rounded-full border border-yellow-500/50 shadow-inner">
                                <ShieldCheck className="h-6 w-6 text-yellow-400" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold tracking-wide">{form.title}</h1>
                                <div className="text-[10px] text-gray-300 flex items-center mt-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                                    Data Protected & Secure
                                </div>
                            </div>
                        </div>
                        <X className="h-5 w-5 text-gray-500 cursor-not-allowed opacity-50 relative z-10" />
                        
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    </div>
                ) : (
                    <div className="py-6 px-6 text-center" style={{ backgroundColor: primaryColor }}>
                        <h1 className="text-2xl font-bold text-white">{form.title}</h1>
                        {form.subtitle && <p className="mt-2 text-white text-opacity-90">{form.subtitle}</p>}
                    </div>
                )}

                <div className="p-6 sm:p-8">
                    {/* Warning/Info Box for Sales Guarantee */}
                    {isOnboarding && (
                        <div className="bg-[#fffbeb] border border-[#fcd34d] rounded-lg p-4 mb-6 shadow-sm">
                            <h3 className="text-sm font-bold text-[#b45309] flex items-center mb-1">
                                <AlertCircle className="h-4 w-4 mr-2"/> কেন এই ফর্মটি পূরণ করবেন?
                            </h3>
                            <p className="text-xs text-gray-700 leading-relaxed font-medium">
                                {form.subtitle || "সেল গ্যারান্টি পেতে আপনার ইনফরমেশন গুলো সাবমিট করুন এবং বিস্তারিত জানুন। আপনার সঠিক তথ্য আমাদের স্ট্র্যাটেজি তৈরিতে সাহায্য করবে।"}
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative flex items-center" role="alert">
                            <AlertCircle className="h-4 w-4 mr-2"/>
                            <span className="block sm:inline text-sm">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        
                        {/* 1. Page Name (Maps to Full Name) */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input 
                                type="text"
                                required 
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder={isOnboarding ? "আপনার পেজের নাম" : "Full Name"}
                            />
                        </div>

                        {/* 2. Page Link (Maps to Facebook Profile Link) - Always shown for onboarding */}
                        {(form.config.include_facebook || isOnboarding) && (
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LinkIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input 
                                    type="text"
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                                    value={formData.facebook}
                                    onChange={e => setFormData({...formData, facebook: e.target.value})}
                                    placeholder={isOnboarding ? "পেজের লিংক (URL)" : "Facebook Profile Link"}
                                />
                            </div>
                        )}

                        {/* 3. Phone Number */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input 
                                type="tel" 
                                required
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                placeholder={isOnboarding ? "আপনার ফোন নাম্বার (WhatsApp)" : "Phone Number"}
                            />
                        </div>

                        {/* ONBOARDING SPECIFIC FIELDS */}
                        {isOnboarding && (
                            <>
                                {/* 4. Current Status (Business Status) */}
                                <div className="relative group">
                                    <textarea 
                                        className="block w-full p-3 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all min-h-[80px]"
                                        value={formData.current_plan}
                                        onChange={e => setFormData({...formData, current_plan: e.target.value})}
                                        placeholder="বর্তমান ব্যবসার অবস্থা বিস্তারিত লিখুন..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* 5. Previous Budget */}
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <DollarSign className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                        <input 
                                            type="text" 
                                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                                            value={formData.monthly_avg_budget}
                                            onChange={e => setFormData({...formData, monthly_avg_budget: e.target.value})}
                                            placeholder="আগের বাজেট?"
                                        />
                                    </div>
                                    
                                    {/* 6. Product Price */}
                                    <div className="relative group">
                                        <input 
                                            type="text" 
                                            className="block w-full px-4 py-3 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all text-center"
                                            value={formData.product_price}
                                            onChange={e => setFormData({...formData, product_price: e.target.value})}
                                            placeholder="প্রোডাক্ট প্রাইস"
                                        />
                                    </div>
                                </div>

                                {/* 7. Future Plan */}
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FileText className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input 
                                        type="text" 
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                                        value={formData.marketing_budget_willingness}
                                        onChange={e => setFormData({...formData, marketing_budget_willingness: e.target.value})}
                                        placeholder="আপনার ফিউচার প্ল্যান কি?"
                                    />
                                </div>
                            </>
                        )}

                        <div className="pt-2">
                            <button 
                                type="submit" 
                                className="w-full flex flex-col items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform active:scale-[0.98]"
                            >
                                <span className="text-lg font-bold flex items-center">
                                    সাবমিট করুন <Send className="ml-2 h-5 w-5 rotate-45" />
                                </span>
                                {isOnboarding && <span className="text-xs font-normal text-blue-100 mt-0.5">সেল শুরু করার প্রথম ধাপ সম্পূর্ণ করুন</span>}
                            </button>
                        </div>
                    </form>
                    
                    {isOnboarding && (
                        <p className="text-center text-[10px] text-gray-400 mt-4">
                            * ১০০০+ সফল উদ্যোক্তা আমাদের সাথে কাজ করছেন
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PublicForm;
