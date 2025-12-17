
import React, { useState, useEffect } from 'react';
import { mockService } from '../services/mockService';
import { BigFish, Lead, LeadStatus, Transaction, PaymentMethod, ClientInteraction, CampaignRecord, PortalConfig } from '../types';
import { Plus, TrendingUp, ArrowLeft, Wallet, Activity, Eye, List, X, Archive, RotateCcw, Trash2, Settings, Smartphone, Share2, AlertTriangle, Clock, Search, CheckSquare, Grid, Check, Send, MessageCircle, Image } from 'lucide-react';
import { PortalView } from './ClientPortal'; 
import { useCurrency } from '../context/CurrencyContext';

const BigFishPage: React.FC = () => {
    const { formatCurrency } = useCurrency();
    const [allFish, setAllFish] = useState<BigFish[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
    const [displayType, setDisplayType] = useState<'grid' | 'list'>('grid');
    const [isCatchModalOpen, setIsCatchModalOpen] = useState(false);
    const [isManualAddOpen, setIsManualAddOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showDeadlineAlert, setShowDeadlineAlert] = useState(false);
    const [expiringClients, setExpiringClients] = useState<BigFish[]>([]);
    const [catchSearch, setCatchSearch] = useState('');
    const [clientSearch, setClientSearch] = useState('');
    const [selectedFish, setSelectedFish] = useState<BigFish | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'wallet' | 'ad_entry' | 'growth' | 'targets' | 'profile' | 'crm' | 'topups' | 'camp_tools'>('overview');
    
    // Form States
    const [amount, setAmount] = useState<number>(0);
    const [desc, setDesc] = useState('');
    const [campStartDateInput, setCampStartDateInput] = useState(new Date().toISOString().slice(0, 10));
    const [campEndDateInput, setCampEndDateInput] = useState(new Date().toISOString().slice(0, 10));
    const [campSpend, setCampSpend] = useState<number>(0);
    const [campResults, setCampResults] = useState<number>(0);
    const [campResultType, setCampResultType] = useState<'SALES' | 'MESSAGES'>('MESSAGES');
    
    const [genCampPageName, setGenCampPageName] = useState('');
    const [genCampBudget, setGenCampBudget] = useState<number>(0);
    const [genCampStartDate, setGenCampStartDate] = useState(new Date().toISOString().slice(0, 10));
    const [genCampEndDate, setGenCampEndDate] = useState('');
    const [genCampTitleCopied, setGenCampTitleCopied] = useState(false);
    const [genCampMsgCopied, setGenCampMsgCopied] = useState(false);
    const [isSendingSMS, setIsSendingSMS] = useState(false);

    // Profile & Settings State
    const [portalConfig, setPortalConfig] = useState<PortalConfig>({
        show_balance: true,
        show_history: true,
        is_suspended: false,
        feature_flags: {
            show_profit_analysis: true,
            show_cpr_metrics: true,
            allow_topup_request: true,
            show_message_report: true,
            show_sales_report: true,
            show_profit_loss_report: false
        }
    });

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        if (selectedFish) {
            setGenCampPageName(selectedFish.facebook_page || selectedFish.name || '');
            if(selectedFish.portal_config) setPortalConfig(selectedFish.portal_config);
        }
    }, [selectedFish]);

    const loadData = async () => {
        const fish = await mockService.getBigFish();
        setAllFish(fish);
        const l = await mockService.getLeads();
        setLeads(l);
        const pm = await mockService.getPaymentMethods();
        setPaymentMethods(pm);
    };

    const handleCatchFish = async (leadId: string) => { 
        const success = await mockService.catchBigFish(leadId); 
        if (success) { setIsCatchModalOpen(false); loadData(); } 
    };

    const handleTransaction = async (type: Transaction['type']) => { 
        if (!selectedFish || amount <= 0) return; 
        const updated = await mockService.addTransaction(selectedFish.id, type, amount, desc || (type === 'DEPOSIT' ? 'Balance Top-up' : 'Manual Deduction')); 
        if (updated) setSelectedFish({ ...updated });
        setAmount(0); setDesc(''); loadData(); 
    };

    const handleCampaignEntry = async () => {
        if (!selectedFish || campSpend <= 0) return;
        const updated = await mockService.addCampaignRecord(selectedFish.id, {
            start_date: campStartDateInput,
            end_date: campEndDateInput,
            amount_spent: campSpend,
            result_type: campResultType,
            results_count: campResults,
            impressions: 0, reach: 0, clicks: 0 
        });
        if (updated) setSelectedFish({ ...updated });
        setCampSpend(0); setCampResults(0); loadData();
    };

    const handleSendSystemSMS = async () => {
        if (!selectedFish) return;
        setIsSendingSMS(true);
        const msg = generateClientMessage();
        await mockService.sendBulkSMS([selectedFish.lead_id], msg);
        setIsSendingSMS(false);
        alert("✅ Bill SMS Sent!");
        loadData();
    };

    const generateClientMessage = () => {
        const totalBill = genCampBudget * 145;
        return `সম্মানিত ক্লায়েন্ট, আপনার "${genCampPageName}" ক্যাম্পেইন সফলভাবে চলছে। বাজেট: $${genCampBudget}, মোট বিল: ৳${totalBill.toLocaleString()}। ধন্যবাদ!`;
    };

    const toggleFeature = (key: keyof NonNullable<PortalConfig['feature_flags']>) => {
        setPortalConfig(prev => ({
            ...prev,
            feature_flags: {
                show_profit_analysis: prev.feature_flags?.show_profit_analysis || false,
                show_cpr_metrics: prev.feature_flags?.show_cpr_metrics || false,
                allow_topup_request: prev.feature_flags?.allow_topup_request || false,
                ...prev.feature_flags,
                [key]: !prev.feature_flags?.[key]
            }
        }));
    };

    const filteredFish = allFish.filter(f => 
        (viewMode === 'active' ? f.status === 'Active Pool' : f.status !== 'Active Pool') &&
        f.name.toLowerCase().includes(clientSearch.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {!selectedFish ? (
                <>
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">🐟 Big Fish Clients</h1>
                        <button onClick={() => setIsCatchModalOpen(true)} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold flex items-center">
                            <Plus className="h-5 w-5 mr-2" /> Catch New Fish
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {filteredFish.map(fish => (
                            <div key={fish.id} onClick={() => setSelectedFish(fish)} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-shadow">
                                <h3 className="font-bold text-lg text-gray-900">{fish.name}</h3>
                                <p className="text-sm text-gray-500">{fish.phone}</p>
                                <div className="mt-4 flex justify-between">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Balance</span>
                                    <span className="font-mono font-bold text-indigo-600">{formatCurrency(fish.balance)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="flex flex-col h-full">
                    <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setSelectedFish(null)} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft className="h-5 w-5"/></button>
                            <h1 className="text-xl font-bold text-gray-900">{selectedFish.name}</h1>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => setShowPreview(!showPreview)} className="px-4 py-2 border rounded-lg text-sm font-bold">
                                {showPreview ? 'Exit Preview' : 'Client View'}
                             </button>
                        </div>
                    </div>

                    {!showPreview ? (
                        <div className="flex gap-6 flex-1 overflow-hidden">
                            <div className="w-64 bg-white border rounded-xl overflow-y-auto shrink-0 flex flex-col">
                                {['overview', 'wallet', 'camp_tools', 'ad_entry', 'crm', 'profile'].map(tab => (
                                    <button key={tab} onClick={() => setActiveTab(tab as any)} className={`p-4 text-sm font-medium text-left capitalize ${activeTab === tab ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                                        {tab.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 bg-white border rounded-xl p-6 overflow-y-auto">
                                {activeTab === 'overview' && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-indigo-50 p-6 rounded-xl text-center">
                                            <h3 className="text-indigo-800 text-xs font-bold uppercase">Balance</h3>
                                            <p className="text-2xl font-bold mt-1">{formatCurrency(selectedFish.balance)}</p>
                                        </div>
                                        <div className="bg-purple-50 p-6 rounded-xl text-center">
                                            <h3 className="text-purple-800 text-xs font-bold uppercase">Total Spent</h3>
                                            <p className="text-2xl font-bold mt-1">{formatCurrency(selectedFish.spent_amount)}</p>
                                        </div>
                                        <div className="bg-green-50 p-6 rounded-xl text-center">
                                            <h3 className="text-green-800 text-xs font-bold uppercase">Total Sales</h3>
                                            <p className="text-2xl font-bold mt-1">{selectedFish.current_sales}</p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'wallet' && (
                                    <div className="space-y-6">
                                        <div className="bg-gray-50 p-4 rounded-lg flex gap-4">
                                            <input type="number" className="flex-1 border p-2 rounded" placeholder="Amount ($)" value={amount || ''} onChange={e => setAmount(parseFloat(e.target.value))} />
                                            <input type="text" className="flex-[2] border p-2 rounded" placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />
                                            <button onClick={() => handleTransaction('DEPOSIT')} className="bg-green-600 text-white px-4 py-2 rounded font-bold">Add</button>
                                            <button onClick={() => handleTransaction('AD_SPEND')} className="bg-red-500 text-white px-4 py-2 rounded font-bold">Deduct</button>
                                        </div>
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-100 text-xs uppercase text-gray-500">
                                                <tr><th className="p-3">Date</th><th className="p-3">Desc</th><th className="p-3 text-right">Amount</th></tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {selectedFish.transactions.map(tx => (
                                                    <tr key={tx.id} className="hover:bg-gray-50">
                                                        <td className="p-3">{new Date(tx.date).toLocaleDateString()}</td>
                                                        <td className="p-3">{tx.description}</td>
                                                        <td className={`p-3 text-right font-bold ${tx.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-500'}`}>
                                                            {tx.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === 'ad_entry' && (
                                    <div className="space-y-6">
                                        <div className="bg-indigo-50 p-4 rounded-lg space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <input type="number" className="border p-2 rounded" placeholder="Spend ($)" value={campSpend || ''} onChange={e => setCampSpend(parseFloat(e.target.value))} />
                                                <input type="number" className="border p-2 rounded" placeholder="Results" value={campResults || ''} onChange={e => setCampResults(parseFloat(e.target.value))} />
                                            </div>
                                            <select className="w-full border p-2 rounded" value={campResultType} onChange={e => setCampResultType(e.target.value as any)}>
                                                <option value="MESSAGES">Messages</option>
                                                <option value="SALES">Sales</option>
                                            </select>
                                            <button onClick={handleCampaignEntry} className="w-full bg-indigo-600 text-white py-2 rounded font-bold">Save & Update Balance</button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'camp_tools' && (
                                    <div className="space-y-4">
                                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                            <h3 className="font-bold text-orange-800 mb-4">Quick Client Message</h3>
                                            <input className="w-full border p-2 rounded mb-3" value={genCampPageName} onChange={e => setGenCampPageName(e.target.value)} placeholder="Page Name"/>
                                            <input type="number" className="w-full border p-2 rounded mb-3" value={genCampBudget || ''} onChange={e => setGenCampBudget(parseFloat(e.target.value))} placeholder="Budget ($)"/>
                                            <div className="bg-white p-3 border rounded text-sm text-gray-700 font-mono whitespace-pre-wrap mb-4">
                                                {generateClientMessage()}
                                            </div>
                                            <button onClick={handleSendSystemSMS} disabled={isSendingSMS} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold flex items-center justify-center">
                                                <Send className="h-4 w-4 mr-2"/> {isSendingSMS ? 'Sending...' : 'Send Bill via System SMS'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'crm' && (
                                    <div className="space-y-6">
                                        <div className="divide-y">
                                            {selectedFish.interactions?.map(item => (
                                                <div key={item.id} className="py-4 flex gap-4">
                                                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0"><Activity size={16}/></div>
                                                    <div>
                                                        <div className="flex gap-2 items-center mb-1">
                                                            <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded">{item.type}</span>
                                                            <span className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-700">{item.notes}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!selectedFish.interactions || selectedFish.interactions.length === 0) && <p className="text-center text-gray-400 py-8">No history yet.</p>}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'profile' && (
                                    <div className="max-w-lg space-y-6">
                                        <h3 className="font-bold text-gray-900 border-b pb-2">Visibility Settings</h3>
                                        <div className="space-y-3">
                                            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <span className="text-sm">Show Message Reports</span>
                                                <button onClick={() => toggleFeature('show_message_report')} className={`w-10 h-5 rounded-full p-1 ${portalConfig.feature_flags?.show_message_report ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                                    <div className={`bg-white w-3 h-3 rounded-full transition-transform ${portalConfig.feature_flags?.show_message_report ? 'translate-x-5' : ''}`}></div>
                                                </button>
                                            </label>
                                            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <span className="text-sm">Show Sales Reports</span>
                                                <button onClick={() => toggleFeature('show_sales_report')} className={`w-10 h-5 rounded-full p-1 ${portalConfig.feature_flags?.show_sales_report ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                                    <div className={`bg-white w-3 h-3 rounded-full transition-transform ${portalConfig.feature_flags?.show_sales_report ? 'translate-x-5' : ''}`}></div>
                                                </button>
                                            </label>
                                        </div>
                                        <button onClick={async () => {
                                            await mockService.updateBigFish(selectedFish.id, { portal_config: portalConfig });
                                            alert("Settings Saved!");
                                        }} className="w-full bg-indigo-600 text-white py-3 rounded font-bold">Save All Settings</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto bg-gray-100 rounded-xl border">
                             <PortalView client={selectedFish} paymentMethods={paymentMethods} />
                        </div>
                    )}
                </div>
            )}

            {/* CATCH MODAL */}
            {isCatchModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold">Catch Big Fish from Leads</h3>
                            <button onClick={() => setIsCatchModalOpen(false)}><X/></button>
                        </div>
                        <div className="p-2 border-b">
                            <input className="w-full border p-2 rounded" placeholder="Search name..." value={catchSearch} onChange={e => setCatchSearch(e.target.value)}/>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {leads.filter(l => l.full_name.toLowerCase().includes(catchSearch.toLowerCase())).map(lead => (
                                <div key={lead.id} onClick={() => handleCatchFish(lead.id)} className="p-3 border-b hover:bg-indigo-50 cursor-pointer flex justify-between">
                                    <div><p className="font-bold text-sm">{lead.full_name}</p><p className="text-xs text-gray-500">{lead.primary_phone}</p></div>
                                    <Plus className="text-indigo-600"/>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BigFishPage;
