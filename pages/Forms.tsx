
import React, { useState, useEffect } from 'react';
import { mockService } from '../services/mockService';
import { LeadForm } from '../types';
import { Edit2, Trash2, Link as LinkIcon, Copy, Check, Globe, ShieldCheck, User, Phone, FileText, DollarSign, Send, AlertCircle, Layout } from 'lucide-react';

const THEME_COLORS: Record<string, string> = {
    indigo: '#4f46e5',
    blue: '#2563eb',
    green: '#16a34a',
    red: '#dc2626',
    orange: '#ea580c',
    purple: '#9333ea',
    pink: '#db2777',
    navy: '#1e3a8a', // Dark Navy for Guarantee
};

const Forms: React.FC = () => {
    const [forms, setForms] = useState<LeadForm[]>([]);
    const [isCreateMode, setIsCreateMode] = useState(false);
    const [editForm, setEditForm] = useState<Partial<LeadForm>>({
        config: {
            include_facebook: true,
            include_website: true,
            include_industry: true,
            theme_color: 'navy'
        }
    });
    const [loading, setLoading] = useState(false);
    
    // Modal for Share/Embed
    const [showShareModal, setShowShareModal] = useState<string | null>(null);
    const [copiedLinkMap, setCopiedLinkMap] = useState<Record<string, boolean>>({});

    useEffect(() => {
        loadForms();
    }, []);

    const loadForms = () => {
        setLoading(true);
        mockService.getForms().then(data => {
            setForms(data);
            setLoading(false);
        });
    };

    // NEW: Preset for Sales Guarantee Form
    const handleCreateOnboarding = () => {
        setEditForm({
            title: '১০০% সেলস গ্যারান্টি',
            subtitle: 'সেল গ্যারান্টি পেতে আপনার ইনফরমেশন গুলো সাবমিট করুন এবং বিস্তারিত জানুন। আপনার সঠিক তথ্য আমাদের স্ট্র্যাটেজি তৈরিতে সাহায্য করবে।',
            type: 'ONBOARDING',
            config: {
                include_facebook: true, // Required for FB Page Link
                include_industry: true, // Useful for business type
                include_website: true,  // Website Link
                theme_color: 'navy'
            }
        });
        setIsCreateMode(true);
    };

    const handleEdit = (form: LeadForm) => {
        setEditForm(form);
        setIsCreateMode(true);
    };

    const handleDelete = async (id: string) => {
        if(confirm("Are you sure you want to delete this form?")) {
            await mockService.deleteForm(id);
            loadForms();
        }
    };

    const handleSave = async () => {
        if(!editForm.title) return alert("Title is required");

        // Ensure config is present to avoid errors
        const finalForm = {
            ...editForm,
            // EXPLICITLY preserve ONBOARDING type if set in state
            type: editForm.type || 'SIMPLE',
            config: editForm.config || {
                include_facebook: true,
                include_website: true,
                include_industry: true,
                theme_color: 'navy'
            }
        };

        try {
            if(editForm.id) {
                await mockService.updateForm(editForm.id, finalForm);
            } else {
                await mockService.createForm(finalForm as Omit<LeadForm, 'id' | 'created_at'>);
            }
            setIsCreateMode(false);
            // Wait a moment for local storage to update before reloading
            setTimeout(loadForms, 200);
        } catch(e) {
            console.error(e);
            alert("Failed to save form. Please try again.");
        }
    };

    const copyToClipboard = (text: string, id?: string) => {
        navigator.clipboard.writeText(text);
        if (id) {
            setCopiedLinkMap(prev => ({ ...prev, [id]: true }));
            setTimeout(() => setCopiedLinkMap(prev => ({ ...prev, [id]: false })), 2000);
        }
    };

    // --- UNIVERSAL LINK GENERATOR (Safe for Unicode/Bangla) ---
    const getPublicLink = (form: Partial<LeadForm>) => {
        const baseUrl = window.location.href.split('#')[0];
        const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl; 
        
        // FIX: Encode form configuration into the URL (Portable Link)
        // This ensures the form works on any browser/device without a shared database.
        if (form.title) {
            const payload = {
                t: form.title,
                s: form.subtitle,
                type: form.type,
                c: form.config
            };
            try {
                const json = JSON.stringify(payload);
                // Safe Base64 encoding for Unicode strings (Bangla support)
                const encoded = window.btoa(unescape(encodeURIComponent(json)));
                return `${cleanBase}/#/f/cfg-${encoded}`;
            } catch (e) {
                console.error("Link generation failed", e);
            }
        }

        // Fallback to ID (Only works locally)
        if (form.id) {
            return `${cleanBase}/#/f/${form.id}`;
        }
        
        // Fallback for preview
        return '#';
    };

    const getEmbedCode = (form: LeadForm) => {
        const url = getPublicLink(form);
        return `<iframe src="${url}" width="100%" height="600px" frameborder="0" style="border:0; width:100%; max-width:600px;"></iframe>`;
    };

    const currentThemeColor = editForm.config?.theme_color || 'indigo';
    const currentHex = THEME_COLORS[currentThemeColor] || THEME_COLORS['indigo'];

    // STRICT FILTER: Only show ONBOARDING forms as requested
    const displayedForms = forms.filter(f => f.type === 'ONBOARDING');

    return (
        <div className="space-y-6 font-inter">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">📋 All Forms</h1>
                    <p className="text-sm text-gray-500">Create shareable forms to collect leads automatically.</p>
                </div>
                {!isCreateMode && (
                    <div className="flex gap-2">
                        {/* Sales Guarantee Form Button */}
                        <button 
                            onClick={handleCreateOnboarding}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            Create Sales Guarantee Form
                        </button>
                    </div>
                )}
            </div>

            {isCreateMode ? (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <h3 className="text-lg font-bold text-gray-900">{editForm.id ? 'Edit Form' : 'New Form Configuration'}</h3>
                        {editForm.type === 'ONBOARDING' && (
                            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded font-bold border border-purple-200 flex items-center">
                                <ShieldCheck className="h-3 w-3 mr-1"/> Sales Guarantee Mode
                            </span>
                        )}
                    </div>
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Configuration */}
                        <div className="space-y-5">
                             <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Form Title</label>
                                <input 
                                    type="text" 
                                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    value={editForm.title || ''}
                                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                                    placeholder="e.g. Order Form"
                                />
                             </div>
                             <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Subtitle / Description</label>
                                <textarea 
                                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    rows={3}
                                    value={editForm.subtitle || ''}
                                    onChange={e => setEditForm({...editForm, subtitle: e.target.value})}
                                    placeholder="Instructions for the user..."
                                />
                             </div>
                             
                             <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                 <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                                     <Layout className="h-4 w-4 mr-2 text-gray-500"/> Fields Configuration
                                 </h4>
                                 
                                 {editForm.type === 'ONBOARDING' ? (
                                     <div className="space-y-2">
                                         <p className="text-xs text-purple-700 font-bold mb-2 flex items-center bg-purple-50 p-2 rounded border border-purple-100">
                                             <ShieldCheck className="h-3 w-3 mr-1.5"/>
                                             Sales Guarantee Fields are FIXED:
                                         </p>
                                         <ul className="text-xs text-gray-600 space-y-1.5 list-disc pl-5">
                                             <li>Page Name (আপনার পেজের নাম)</li>
                                             <li>Page Link (পেজের লিংক)</li>
                                             <li>Phone Number (আপনার ফোন নাম্বার)</li>
                                             <li>Business Status (বর্তমান ব্যবসার অবস্থা)</li>
                                             <li>Previous Budget (আগের বাজেট)</li>
                                             <li>Product Price (প্রোডাক্ট প্রাইস)</li>
                                             <li>Future Plan (আপনার ফিউচার প্ল্যান)</li>
                                         </ul>
                                     </div>
                                 ) : (
                                     <div className="space-y-3">
                                         <div className="flex items-center justify-between text-sm bg-white p-2 rounded border border-gray-200">
                                             <span className="text-gray-600 flex items-center"><User className="h-3 w-3 mr-2"/> Full Name</span>
                                             <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">Required</span>
                                         </div>
                                         <div className="flex items-center justify-between text-sm bg-white p-2 rounded border border-gray-200">
                                             <span className="text-gray-600 flex items-center"><Phone className="h-3 w-3 mr-2"/> Phone Number</span>
                                             <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">Required</span>
                                         </div>
                                         <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-gray-100 rounded transition-colors">
                                             <span className="text-sm text-gray-700">Include "Website URL"?</span>
                                             <div className="relative inline-block w-10 h-5 align-middle select-none transition duration-200 ease-in">
                                                <input type="checkbox" checked={editForm.config?.include_website} onChange={e => setEditForm({...editForm, config: {...editForm.config!, include_website: e.target.checked}})} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 checked:right-0 checked:border-green-400"/>
                                                <label className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer checked:bg-green-400"></label>
                                             </div>
                                         </label>
                                     </div>
                                 )}
                             </div>

                             <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Theme Color</label>
                                <div className="flex space-x-2">
                                    {Object.keys(THEME_COLORS).map(color => (
                                        <button 
                                            key={color}
                                            type="button"
                                            onClick={() => setEditForm({...editForm, config: {...editForm.config!, theme_color: color}})}
                                            className={`h-8 w-8 rounded-full border-2 transition-transform ${editForm.config?.theme_color === color ? 'border-gray-900 scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`}
                                            style={{ backgroundColor: THEME_COLORS[color] }}
                                            title={color}
                                        >
                                        </button>
                                    ))}
                                </div>
                             </div>
                        </div>

                        {/* Live Preview */}
                        <div className="bg-gray-100 p-6 rounded-xl flex items-center justify-center border border-gray-200 shadow-inner">
                             <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden border border-gray-200 transform scale-95 origin-top">
                                 {/* Header */}
                                 {editForm.type === 'ONBOARDING' ? (
                                     <div className="bg-gradient-to-r from-[#111827] to-[#1f2937] p-4 flex items-center gap-3">
                                         <div className="p-2 bg-yellow-500/20 rounded-full border border-yellow-500/50">
                                             <ShieldCheck className="h-5 w-5 text-yellow-400" />
                                         </div>
                                         <div>
                                             <h3 className="text-white font-bold text-sm leading-tight">{editForm.title || 'Form Title'}</h3>
                                             <p className="text-[9px] text-green-400 font-medium flex items-center mt-0.5">
                                                 <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1 animate-pulse"></span>
                                                 Data Protected & Secure
                                             </p>
                                         </div>
                                     </div>
                                 ) : (
                                     <div className="p-4" style={{ backgroundColor: currentHex }}>
                                         <h3 className="text-white font-bold text-lg">{editForm.title || 'Form Title'}</h3>
                                         <p className="text-white text-opacity-90 text-xs mt-1 line-clamp-2">{editForm.subtitle || 'Form description...'}</p>
                                     </div>
                                 )}

                                 <div className="p-4 space-y-3">
                                     {editForm.type === 'ONBOARDING' && (
                                         <div className="bg-yellow-50 border border-yellow-200 rounded p-2.5 mb-2">
                                             <p className="text-[10px] text-amber-800 font-bold flex items-center"><AlertCircle className="h-3 w-3 mr-1"/> কেন এই ফর্মটি পূরণ করবেন?</p>
                                             <p className="text-[9px] text-gray-600 mt-1 line-clamp-3">{editForm.subtitle}</p>
                                         </div>
                                     )}

                                     {editForm.type === 'ONBOARDING' ? (
                                         // Detailed Onboarding Inputs Preview
                                         <div className="space-y-2 opacity-80 pointer-events-none">
                                            <div className="h-8 border border-gray-200 rounded px-2 flex items-center text-xs text-gray-400"><User className="h-3 w-3 mr-2"/> আপনার পেজের নাম</div>
                                            <div className="h-8 border border-gray-200 rounded px-2 flex items-center text-xs text-gray-400"><LinkIcon className="h-3 w-3 mr-2"/> পেজের লিংক (URL)</div>
                                            <div className="h-8 border border-gray-200 rounded px-2 flex items-center text-xs text-gray-400"><Phone className="h-3 w-3 mr-2"/> আপনার ফোন নাম্বার (WhatsApp)</div>
                                            <div className="h-10 border border-gray-200 rounded px-2 flex items-center text-xs text-gray-400">বর্তমান ব্যবসার অবস্থা...</div>
                                            <div className="flex gap-2">
                                                <div className="h-8 border border-gray-200 rounded px-2 flex items-center text-xs text-gray-400 flex-1"><DollarSign className="h-3 w-3 mr-1"/> বাজেট?</div>
                                                <div className="h-8 border border-gray-200 rounded px-2 flex items-center text-xs text-gray-400 flex-1">প্রোডাক্ট প্রাইস</div>
                                            </div>
                                            <div className="h-8 border border-gray-200 rounded px-2 flex items-center text-xs text-gray-400"><FileText className="h-3 w-3 mr-2"/> ফিউচার প্ল্যান?</div>
                                         </div>
                                     ) : (
                                         // Simple Inputs Preview
                                         <div className="space-y-3 opacity-80 pointer-events-none">
                                            <div className="h-9 bg-gray-50 border border-gray-200 rounded px-3 flex items-center text-xs text-gray-400">Full Name</div>
                                            <div className="h-9 bg-gray-50 border border-gray-200 rounded px-3 flex items-center text-xs text-gray-400">Phone Number</div>
                                            {editForm.config?.include_website && <div className="h-9 bg-gray-50 border border-gray-200 rounded px-3 flex items-center text-xs text-gray-400">Website URL</div>}
                                            {editForm.config?.include_facebook && <div className="h-9 bg-gray-50 border border-gray-200 rounded px-3 flex items-center text-xs text-gray-400">Facebook Profile</div>}
                                         </div>
                                     )}

                                     <div 
                                        className="w-full h-10 rounded text-white text-sm font-bold flex items-center justify-center mt-4 shadow-md"
                                        style={{ backgroundColor: editForm.type === 'ONBOARDING' ? '#2563eb' : currentHex }}
                                     >
                                         সাবমিট করুন <Send className="h-3 w-3 ml-2"/>
                                     </div>
                                     {editForm.type === 'ONBOARDING' && <p className="text-[8px] text-center text-gray-400 mt-2">* ১০০০+ সফল উদ্যোক্তা আমাদের সাথে</p>}
                                 </div>
                             </div>
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                        <div className="text-xs text-gray-500">
                            * Changes are saved locally.
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsCreateMode(false)}
                                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSave}
                                className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-bold rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                            >
                                Save Form
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                    <ul className="divide-y divide-gray-200">
                        {loading ? (
                            <li className="px-6 py-12 text-center text-gray-500">Loading forms...</li>
                        ) : displayedForms.length === 0 ? (
                            <li className="px-6 py-12 text-center text-gray-500 flex flex-col items-center">
                                <FileText className="h-10 w-10 text-gray-300 mb-2"/>
                                <p>No Guarantee forms created yet.</p>
                                <p className="text-xs text-gray-400 mt-1">Click "Create Sales Guarantee Form" to start.</p>
                            </li>
                        ) : (
                            displayedForms.map((form) => {
                                const isGuarantee = form.type === 'ONBOARDING';
                                return (
                                <li key={form.id} className={`px-6 py-4 hover:bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${isGuarantee ? 'bg-purple-50/30' : ''}`}>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {isGuarantee ? (
                                                <span className="p-1 bg-yellow-100 text-yellow-700 rounded-full"><ShieldCheck className="h-4 w-4"/></span>
                                            ) : (
                                                <span className="p-1 bg-gray-100 text-gray-600 rounded-full"><FileText className="h-4 w-4"/></span>
                                            )}
                                            <h3 className="text-sm font-bold text-gray-900 truncate" title={form.title}>{form.title}</h3>
                                            {isGuarantee && <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold border border-purple-200">Guarantee Form</span>}
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-1 ml-7">{form.subtitle || 'No description'}</p>
                                        <div className="flex gap-2 mt-2 ml-7">
                                            {form.config.include_facebook && <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 rounded border border-blue-100">Facebook</span>}
                                            {form.config.include_website && <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 rounded border border-gray-200">Website</span>}
                                            {form.config.include_industry && <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 rounded border border-purple-100">Industry</span>}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2 ml-7 sm:ml-0">
                                        {/* Prominent Copy Link for Guarantee Forms */}
                                        {isGuarantee ? (
                                            <button 
                                                onClick={() => copyToClipboard(getPublicLink(form), form.id)}
                                                className="flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded-md text-xs font-bold hover:bg-green-200 transition-colors border border-green-200 mr-2 shadow-sm"
                                                title="Copy Shareable Link"
                                            >
                                                {copiedLinkMap[form.id] ? <Check className="h-3 w-3 mr-1.5"/> : <LinkIcon className="h-3 w-3 mr-1.5"/>}
                                                {copiedLinkMap[form.id] ? 'Copied' : 'Get Link'}
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => copyToClipboard(getPublicLink(form), form.id)}
                                                className="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors" 
                                                title="Copy Link"
                                            >
                                                {copiedLinkMap[form.id] ? <Check className="h-4 w-4 text-green-500"/> : <LinkIcon className="h-4 w-4"/>}
                                            </button>
                                        )}
                                        
                                        <div className="h-4 w-px bg-gray-300 mx-1"></div>

                                        <button onClick={() => {setShowShareModal(getEmbedCode(form));}} className="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50" title="Get Embed Code">
                                            <Globe className="h-4 w-4"/>
                                        </button>
                                        <button onClick={() => handleEdit(form)} className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50" title="Edit">
                                            <Edit2 className="h-4 w-4"/>
                                        </button>
                                        <button onClick={() => handleDelete(form.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50" title="Delete">
                                            <Trash2 className="h-4 w-4"/>
                                        </button>
                                    </div>
                                </li>
                            )})
                        )}
                    </ul>
                </div>
            )}

            {/* Embed Code Modal */}
            {showShareModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-lg shadow-xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Share / Embed Form</h3>
                            <button onClick={() => setShowShareModal(null)} className="text-gray-400 hover:text-gray-600"><Trash2 className="h-5 w-5 opacity-0"/></button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Public Link</label>
                                <div className="flex gap-2">
                                    <input 
                                        readOnly
                                        className="flex-1 border border-gray-300 rounded-md p-2 text-xs bg-gray-50 text-gray-600"
                                        value={showShareModal.match(/src="([^"]+)"/)?.[1] || ''}
                                    />
                                    <button 
                                        onClick={() => copyToClipboard(showShareModal.match(/src="([^"]+)"/)?.[1] || '', 'modal_link')}
                                        className="bg-gray-100 border border-gray-300 px-3 rounded-md hover:bg-gray-200"
                                    >
                                        {copiedLinkMap['modal_link'] ? <Check className="h-4 w-4 text-green-600"/> : <Copy className="h-4 w-4 text-gray-600"/>}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Iframe Embed Code</label>
                                <textarea 
                                    readOnly 
                                    className="w-full h-24 p-3 border border-gray-300 rounded-md text-xs font-mono text-gray-600 focus:outline-none bg-gray-50"
                                    value={showShareModal} 
                                />
                                <div className="mt-2 flex justify-end">
                                    <button 
                                        onClick={() => copyToClipboard(showShareModal, 'modal_embed')}
                                        className="text-xs font-bold text-indigo-600 hover:underline flex items-center"
                                    >
                                        {copiedLinkMap['modal_embed'] ? <Check className="h-3 w-3 mr-1"/> : <Copy className="h-3 w-3 mr-1"/>}
                                        {copiedLinkMap['modal_embed'] ? 'Copied Code' : 'Copy Code'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setShowShareModal(null)} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-indigo-700 shadow-sm">Done</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Forms;
