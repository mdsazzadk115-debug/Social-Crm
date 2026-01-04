
import React, { useState, useEffect } from 'react';
import { mockService } from '../services/mockService';
import { SystemSettings, PaymentMethod } from '../types';
import { Save, Facebook, MessageSquare, Globe, Copy, Check, Info, Layout, Workflow, RefreshCw, Lock, FileText, AlertTriangle, CreditCard, Plus, Trash2, Smartphone, Building } from 'lucide-react';

const Settings: React.FC = () => {
    const [settings, setSettings] = useState<SystemSettings>({
        facebook_page_token: '',
        facebook_verify_token: '',
        sms_api_key: '',
        sms_sender_id: '',
        sms_base_url: '',
        timezone: 'Asia/Dhaka',
        portal_support_phone: '',
        portal_support_url: '',
        portal_fb_group: '',
        system_api_key: ''
    });
    
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'facebook' | 'api' | 'sms' | 'payments' | 'portal' | 'general'>('facebook');
    const [copied, setCopied] = useState(false);

    // Payment Form State
    const [isAddingPayment, setIsAddingPayment] = useState(false);
    const [newPm, setNewPm] = useState<Partial<PaymentMethod>>({ type: 'MOBILE', provider_name: '', account_number: '', mobile_type: 'Personal', instruction: 'Send Money' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const s = await mockService.getSystemSettings();
        const p = await mockService.getPaymentMethods();
        setSettings(s);
        setPaymentMethods(p);
        setIsLoading(false);
    };

    const handleChange = (field: keyof SystemSettings, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }));
        if(error) setError(null);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            await mockService.saveSystemSettings(settings);
            alert('Settings saved successfully!');
        } catch (e: any) {
            setError(e.message || "Failed to save settings.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddPayment = async () => {
        if(!newPm.provider_name || !newPm.account_number) return alert("Required fields missing");
        await mockService.addPaymentMethod(newPm as any);
        setIsAddingPayment(false);
        setNewPm({ type: 'MOBILE', provider_name: '', account_number: '', mobile_type: 'Personal', instruction: 'Send Money' });
        loadData();
    };

    const handleDeletePayment = async (id: string) => {
        if(confirm("Delete this payment method?")) {
            await mockService.deletePaymentMethod(id);
            loadData();
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">⚙️ Settings & Integrations</h1>
                    <p className="text-sm text-gray-500">Configure API keys, payments, and system preferences.</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 flex items-center font-medium shadow-sm disabled:opacity-50"
                >
                    <Save className="h-4 w-4 mr-2" /> {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* TABS */}
                <div className="flex border-b border-gray-200 overflow-x-auto bg-gray-50/50">
                    {[
                        { id: 'facebook', label: 'Facebook', icon: Facebook },
                        { id: 'api', label: 'API & n8n', icon: Workflow },
                        { id: 'sms', label: 'SMS Gateway', icon: MessageSquare },
                        { id: 'payments', label: 'Payments', icon: CreditCard },
                        { id: 'portal', label: 'Support', icon: Layout },
                        { id: 'general', label: 'General', icon: Globe },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-4 text-sm font-bold border-b-2 transition-all flex items-center whitespace-nowrap ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            <tab.icon className="h-4 w-4 mr-2"/> {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-8">
                    {/* FACEBOOK TAB */}
                    {activeTab === 'facebook' && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Page Access Token</label>
                                <input type="password" className="w-full border border-gray-300 rounded-md p-2.5 text-sm font-mono" value={settings.facebook_page_token} onChange={(e) => handleChange('facebook_page_token', e.target.value)} placeholder="EAA..."/>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Verify Token (Custom)</label>
                                <input type="text" className="w-full border border-gray-300 rounded-md p-2.5 text-sm font-mono" value={settings.facebook_verify_token} onChange={(e) => handleChange('facebook_verify_token', e.target.value)} placeholder="my_secure_token"/>
                            </div>
                        </div>
                    )}

                    {/* API TAB */}
                    {activeTab === 'api' && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">System API Key</label>
                                <div className="flex gap-2">
                                    <input readOnly type="text" className="flex-1 bg-gray-50 border border-gray-300 rounded-md p-2.5 text-sm font-mono text-gray-600" value={settings.system_api_key}/>
                                    <button onClick={() => copyToClipboard(settings.system_api_key || '')} className="bg-white border border-gray-300 px-4 rounded-md hover:bg-gray-50"><Copy className="h-4 w-4"/></button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SMS TAB */}
                    {activeTab === 'sms' && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Gateway API URL</label>
                                <input type="url" className="w-full border border-gray-300 rounded-md p-2.5 text-sm" value={settings.sms_base_url} onChange={(e) => handleChange('sms_base_url', e.target.value)} placeholder="https://api.sms-provider.com/v3/send"/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">API Key</label><input type="password" className="w-full border border-gray-300 rounded-md p-2.5 text-sm font-mono" value={settings.sms_api_key} onChange={(e) => handleChange('sms_api_key', e.target.value)}/></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">Sender ID</label><input type="text" className="w-full border border-gray-300 rounded-md p-2.5 text-sm" value={settings.sms_sender_id} onChange={(e) => handleChange('sms_sender_id', e.target.value)}/></div>
                            </div>
                        </div>
                    )}

                    {/* PAYMENT METHODS TAB */}
                    {activeTab === 'payments' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center"><CreditCard className="h-5 w-5 mr-2 text-indigo-600"/> Payment Methods</h3>
                                <button 
                                    onClick={() => setIsAddingPayment(true)}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center hover:bg-indigo-700 transition-colors"
                                >
                                    <Plus className="h-4 w-4 mr-1"/> Add New Method
                                </button>
                            </div>

                            {isAddingPayment && (
                                <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl space-y-4 mb-6 relative">
                                    <button onClick={() => setIsAddingPayment(false)} className="absolute top-4 right-4 text-indigo-400 hover:text-indigo-600"><Trash2 className="h-4 w-4"/></button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                                            <select 
                                                className="w-full border border-gray-300 rounded p-2 text-sm"
                                                value={newPm.type}
                                                onChange={e => setNewPm({...newPm, type: e.target.value as any, provider_name: '', account_number: '', branch_name: '', routing_number: '', account_name: ''})}
                                            >
                                                <option value="MOBILE">Mobile Banking (bKash/Nagad)</option>
                                                <option value="BANK">Bank Account</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{newPm.type === 'MOBILE' ? 'Provider (e.g. bKash)' : 'Bank Name'}</label>
                                            <input className="w-full border border-gray-300 rounded p-2 text-sm" value={newPm.provider_name} onChange={e => setNewPm({...newPm, provider_name: e.target.value})}/>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{newPm.type === 'MOBILE' ? 'Account Number' : 'Account Number'}</label>
                                            <input className="w-full border border-gray-300 rounded p-2 text-sm font-mono" value={newPm.account_number} onChange={e => setNewPm({...newPm, account_number: e.target.value})}/>
                                        </div>
                                        {newPm.type === 'MOBILE' ? (
                                            <>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mobile Type</label>
                                                    <select className="w-full border border-gray-300 rounded p-2 text-sm" value={newPm.mobile_type} onChange={e => setNewPm({...newPm, mobile_type: e.target.value as any})}>
                                                        <option value="Personal">Personal</option>
                                                        <option value="Merchant">Merchant</option>
                                                        <option value="Agent">Agent</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Instruction</label>
                                                    <select className="w-full border border-gray-300 rounded p-2 text-sm" value={newPm.instruction} onChange={e => setNewPm({...newPm, instruction: e.target.value as any})}>
                                                        <option value="Send Money">Send Money</option>
                                                        <option value="Payment">Payment</option>
                                                        <option value="Cash Out">Cash Out</option>
                                                    </select>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Name</label><input className="w-full border border-gray-300 rounded p-2 text-sm" value={newPm.account_name} onChange={e => setNewPm({...newPm, account_name: e.target.value})}/></div>
                                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Branch Name</label><input className="w-full border border-gray-300 rounded p-2 text-sm" value={newPm.branch_name} onChange={e => setNewPm({...newPm, branch_name: e.target.value})}/></div>
                                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Routing Number</label><input className="w-full border border-gray-300 rounded p-2 text-sm" value={newPm.routing_number} onChange={e => setNewPm({...newPm, routing_number: e.target.value})}/></div>
                                            </>
                                        )}
                                    </div>
                                    <button onClick={handleAddPayment} className="w-full bg-indigo-600 text-white font-bold py-2 rounded shadow-md mt-4">Save Payment Method</button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {paymentMethods.map(pm => (
                                    <div key={pm.id} className="bg-gray-50 border border-gray-200 p-5 rounded-xl flex items-start gap-4 relative group">
                                        <button 
                                            onClick={() => handleDeletePayment(pm.id)}
                                            className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="h-4 w-4"/>
                                        </button>
                                        <div className={`p-3 rounded-lg ${pm.type === 'MOBILE' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {pm.type === 'MOBILE' ? <Smartphone size={24}/> : <Building size={24}/>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-900 truncate">{pm.provider_name}</h4>
                                            <p className="text-sm font-mono font-bold text-gray-700 mt-1">{pm.account_number}</p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <span className="text-[10px] font-black uppercase bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-500">{pm.type}</span>
                                                {pm.mobile_type && <span className="text-[10px] font-black uppercase bg-indigo-100 px-2 py-0.5 rounded text-indigo-700">{pm.mobile_type}</span>}
                                            </div>
                                            {pm.account_name && <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">Name: {pm.account_name}</p>}
                                        </div>
                                    </div>
                                ))}
                                {paymentMethods.length === 0 && !isAddingPayment && (
                                    <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                        <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-30"/>
                                        <p className="text-sm">No payment methods added yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* PORTAL TAB */}
                    {activeTab === 'portal' && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Support Phone / WhatsApp</label>
                                <input type="text" className="w-full border border-gray-300 rounded-md p-2.5 text-sm" value={settings.portal_support_phone || ''} onChange={(e) => handleChange('portal_support_phone', e.target.value)} placeholder="+88017..."/>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Private Facebook Group Link</label>
                                <input type="text" className="w-full border border-gray-300 rounded-md p-2.5 text-sm" value={settings.portal_fb_group || ''} onChange={(e) => handleChange('portal_fb_group', e.target.value)} placeholder="https://facebook.com/groups/..."/>
                            </div>
                        </div>
                    )}

                    {/* GENERAL TAB */}
                    {activeTab === 'general' && (
                        <div className="animate-fade-in">
                            <label className="block text-sm font-bold text-gray-700 mb-1">System Timezone</label>
                            <select className="w-full border border-gray-300 rounded-md p-2.5 text-sm bg-white" value={settings.timezone} onChange={(e) => handleChange('timezone', e.target.value)}>
                                <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                                <option value="UTC">UTC</option>
                            </select>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
