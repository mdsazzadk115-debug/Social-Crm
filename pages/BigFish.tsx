
import React, { useState, useEffect } from 'react';
import { mockService } from '../services/mockService';
import { BigFish, Lead, Transaction, PaymentMethod, CampaignRecord, TopUpRequest, PortalConfig } from '../types';
import { Plus, TrendingUp, CheckCircle, Target, Copy, ArrowLeft, Wallet, Activity, Eye, List, X, Archive, RotateCcw, Trash2, Settings, Smartphone, Share2, AlertTriangle, Clock, Search, CheckSquare, Layout, Grid, Check, Send, Coins, Percent, RefreshCw, MessageCircle, ShoppingBag, DollarSign } from 'lucide-react';
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
    const [isEditTxModalOpen, setIsEditTxModalOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [editTxDate, setEditTxDate] = useState('');
    const [editTxDesc, setEditTxDesc] = useState('');
    const [editTxAmount, setEditTxAmount] = useState(0);
    const [selectedFish, setSelectedFish] = useState<BigFish | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'wallet' | 'ad_entry' | 'growth' | 'targets' | 'profile' | 'crm' | 'topups' | 'camp_tools'>('overview');
    const [amount, setAmount] = useState<number>(0);
    const [desc, setDesc] = useState('');
    const [manualName, setManualName] = useState('');
    const [manualPhone, setManualPhone] = useState('');
    
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Detailed Campaign Entry State
    const [campStartDateInput, setCampStartDateInput] = useState(new Date().toISOString().slice(0, 10));
    const [campEndDateInput, setCampEndDateInput] = useState(new Date().toISOString().slice(0, 10));
    const [campSpend, setCampSpend] = useState<number>(0); 
    const [campRealSpend, setCampRealSpend] = useState<number>(0); 
    const [campBuyingRate, setCampBuyingRate] = useState<number>(130); 
    const [campClientRate, setCampClientRate] = useState<number>(145); 
    const [campImpr, setCampImpr] = useState<number>(0);
    const [campReach, setCampReach] = useState<number>(0);
    const [campClicks, setCampClicks] = useState<number>(0);
    const [campResults, setCampResults] = useState<number>(0);
    const [campResultType, setCampResultType] = useState<'SALES' | 'MESSAGES'>('MESSAGES');
    const [campProdPrice, setCampProdPrice] = useState<number>(0); 
    const [campProdCost, setCampProdCost] = useState<number>(0);   

    const [genCampPageName, setGenCampPageName] = useState('');
    const [genCampBudget, setGenCampBudget] = useState<number>(0);
    const [genCampStartDate, setGenCampStartDate] = useState(new Date().toISOString().slice(0, 10));
    const [genCampEndDate, setGenCampEndDate] = useState('');
    const [genCampTitleCopied, setGenCampTitleCopied] = useState(false);
    const [genCampMsgCopied, setGenCampMsgCopied] = useState(false);
    const [isSendingSMS, setIsSendingSMS] = useState(false);

    const [taskTitle, setTaskTitle] = useState('');
    const [taskDate, setTaskDate] = useState('');
    const [newTarget, setNewTarget] = useState(0);
    const [newCurrent, setNewCurrent] = useState(0);
    const [profilePhone, setProfilePhone] = useState('');
    const [profileWeb, setProfileWeb] = useState('');
    const [profileFb, setProfileFb] = useState('');
    const [profileNotes, setProfileNotes] = useState('');
    
    // Initial Default State
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
            show_profit_loss_report: false,
            show_payment_methods: true
        }
    });

    const [interactionType, setInteractionType] = useState<'CALL' | 'MEETING' | 'EMAIL' | 'WHATSAPP' | 'OTHER' | 'INVOICE' | 'TASK' | 'SALE' | 'BALANCE'>('CALL');
    const [interactionNotes, setInteractionNotes] = useState('');
    const [interactionDate, setInteractionDate] = useState(new Date().toISOString().slice(0, 10));
    const [nextFollowUp, setNextFollowUp] = useState('');

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        if (selectedFish) {
            let pageName = selectedFish.facebook_page || selectedFish.name || '';
            if(pageName.includes('facebook.com/')) {
                const parts = pageName.split('facebook.com/');
                if (parts.length > 1) {
                    pageName = parts[1].replace(/\/$/, '');
                }
            }
            setGenCampPageName(pageName);
            setNewTarget(selectedFish.target_sales || 0);
            setNewCurrent(selectedFish.current_sales || 0);
            setProfilePhone(selectedFish.phone || '');
            setProfileWeb(selectedFish.website_url || '');
            setProfileFb(selectedFish.facebook_page || '');
            setProfileNotes(selectedFish.notes || '');
            
            // --- FIX: Merge with defaults to ensure feature_flags exist for old records ---
            const defaultConfig: PortalConfig = {
                show_balance: true,
                show_history: true,
                is_suspended: false,
                feature_flags: {
                    show_profit_analysis: true,
                    show_cpr_metrics: true,
                    allow_topup_request: true,
                    show_message_report: true,
                    show_sales_report: true,
                    show_profit_loss_report: false,
                    show_payment_methods: true
                }
            };
            
            const mergedConfig = {
                ...defaultConfig,
                ...selectedFish.portal_config,
                feature_flags: {
                    ...defaultConfig.feature_flags,
                    ...(selectedFish.portal_config?.feature_flags || {})
                }
            };
            setPortalConfig(mergedConfig);
        }
    }, [selectedFish]);

    const loadData = async () => {
        const fish = await mockService.getBigFish();
        setAllFish(fish);
        const l = await mockService.getLeads();
        setLeads(l);
        const pm = await mockService.getPaymentMethods();
        setPaymentMethods(pm);
        const expiring = await mockService.checkExpiringCampaigns();
        if (expiring.length > 0) { setExpiringClients(expiring); setShowDeadlineAlert(true); }
        if (selectedFish) {
            const updated = fish.find(f => f.id === selectedFish.id);
            if(updated) setSelectedFish(updated);
        }
    };

    const handleCatchFish = async (leadId: string) => { const newFish = await mockService.catchBigFish(leadId); if (newFish) { setIsCatchModalOpen(false); setCatchSearch(''); loadData(); alert("🎣 New Big Fish caught!"); } else { alert("This lead is already active!"); } };
    const handleManualAdd = async () => { if (!manualName) return alert("Name is required"); await mockService.createBigFish({ name: manualName, phone: manualPhone, package_name: 'Manual VIP Client' }); setIsManualAddOpen(false); setManualName(''); setManualPhone(''); loadData(); }
    const toggleStatus = async (id: string, e?: React.MouseEvent) => { if (e) e.stopPropagation(); await mockService.toggleBigFishStatus(id); await loadData(); };
    
    const handleTransaction = async (type: Transaction['type']) => { 
        if (!selectedFish || amount <= 0) return alert("Enter valid amount"); 
        await mockService.addTransaction(selectedFish.id, type, amount, desc || (type === 'DEPOSIT' ? 'Balance Top-up' : 'Manual Deduction')); 
        setAmount(0); setDesc(''); loadData(); 
    };
    
    const deleteTransaction = async (txId: string) => { 
        if (!selectedFish) return; 
        if(window.confirm("Are you sure you want to delete this transaction? This will reverse the balance effect.")) { 
            await mockService.deleteTransaction(selectedFish.id, txId); 
            setTimeout(loadData, 300); 
        } 
    };
    
    const handleUpdateTransaction = async () => { 
        if (!selectedFish || !editingTx) return; 
        await mockService.updateTransaction(selectedFish.id, editingTx.id, { date: editTxDate, description: editTxDesc, amount: editTxAmount }); 
        setIsEditTxModalOpen(false); 
        setEditingTx(null); 
        setTimeout(loadData, 300); 
    };

    const handleCampaignEntry = async () => {
        if (!selectedFish || campSpend <= 0) return alert("Client Bill amount is required ($)");
        if (!campStartDateInput) return alert("Date is required");

        const record: Partial<CampaignRecord> = {
            start_date: campStartDateInput,
            end_date: campEndDateInput || campStartDateInput,
            amount_spent: campSpend,
            real_amount_spent: campRealSpend || campSpend,
            buying_rate: campBuyingRate,
            client_rate: campClientRate,
            impressions: campImpr,
            reach: campReach,
            clicks: campClicks,
            result_type: campResultType,
            results_count: campResults,
            product_price: campResultType === 'SALES' ? campProdPrice : 0,
            product_cost: campResultType === 'SALES' ? campProdCost : 0,
        };

        if (campResultType === 'SALES') {
            const newSales = (selectedFish.current_sales || 0) + campResults;
            await mockService.updateTargets(selectedFish.id, selectedFish.target_sales, newSales);
        }

        const updatedFish = await mockService.addCampaignRecord(selectedFish.id, record as any);
        
        setCampSpend(0); setCampRealSpend(0); setCampImpr(0); setCampReach(0); setCampClicks(0); setCampResults(0);
        setCampProdPrice(0); setCampProdCost(0);
        
        alert(`সাফল্যের সাথে এন্ট্রি হয়েছে! ক্লায়েন্ট ব্যালেন্স থেকে $${campSpend} কাটা হয়েছে।`);
        if (updatedFish) {
            setSelectedFish(updatedFish);
            setAllFish(prev => prev.map(f => f.id === updatedFish.id ? updatedFish : f));
        } else {
            loadData();
        }
    };

    const deleteCampaignRecord = async (recId: string) => {
        if(!selectedFish) return;
        if(confirm("Delete this campaign entry? This will refund the amount to wallet.")) {
            const recordToDelete = selectedFish.campaign_records?.find(r => r.id === recId);
            if (recordToDelete && recordToDelete.result_type === 'SALES') {
                const newSales = Math.max(0, (selectedFish.current_sales || 0) - recordToDelete.results_count);
                await mockService.updateTargets(selectedFish.id, selectedFish.target_sales, newSales);
            }
            await mockService.deleteCampaignRecord(selectedFish.id, recId);
            loadData();
        }
    };

    const handleApproveTopUp = async (req: TopUpRequest) => {
        if(!selectedFish) return;
        if(confirm(`Approve top-up of ${formatCurrency(req.amount)}?`)) {
            await mockService.approveTopUpRequest(selectedFish.id, req.id);
            loadData();
        }
    };

    const handleRejectTopUp = async (reqId: string) => {
        if(!selectedFish) return;
        if(confirm("Reject this top-up request?")) {
            await mockService.rejectTopUpRequest(selectedFish.id, reqId);
            loadData();
        }
    };

    const handleDeleteTopUp = async (reqId: string) => {
        if(!selectedFish) return;
        if(confirm("Delete this request history?")) {
            await mockService.deleteTopUpRequest(selectedFish.id, reqId);
            loadData();
        }
    };

    const addTask = async () => { if (!selectedFish || !taskTitle) return; await mockService.addGrowthTask(selectedFish.id, taskTitle, taskDate); setTaskTitle(''); setTaskDate(''); loadData(); };
    const toggleTask = async (taskId: string) => { 
        if (!selectedFish) return;
        await mockService.toggleGrowthTask(selectedFish.id, taskId);
        loadData();
    };

    const handleUpdateProfile = async () => {
        if(!selectedFish) return;
        await mockService.updateBigFish(selectedFish.id, {
            phone: profilePhone,
            website_url: profileWeb,
            facebook_page: profileFb,
            notes: profileNotes,
            portal_config: portalConfig
        });
        alert("Profile & Settings updated!");
        loadData();
    };

    const handleUpdateTargets = async () => {
        if(!selectedFish) return;
        await mockService.updateTargets(selectedFish.id, newTarget, newCurrent);
        alert("Targets updated!");
        loadData();
    };

    const generateCampaignTitle = () => {
        const date = genCampEndDate ? new Date(genCampEndDate).toLocaleDateString('en-GB') : 'No Date';
        return `${genCampPageName || 'Page'} - $${genCampBudget} - ${date}`;
    };

    const generateClientMessage = () => {
        const sDate = genCampStartDate ? new Date(genCampStartDate).toLocaleDateString('en-GB') : '...';
        const eDate = genCampEndDate ? new Date(genCampEndDate).toLocaleDateString('en-GB') : '...';
        const totalBill = genCampBudget * campClientRate;
        return `সম্মানিত ক্লায়েন্ট,
আপনার "${genCampPageName}" পেজের ক্যাম্পেইনটি সফলভাবে চলছে/সম্পন্ন হয়েছে ✅

📅 সময়কাল: ${sDate} থেকে ${eDate}
💵 অ্যাড বাজেট: $${genCampBudget}
💰 মোট বিল: ৳ ${totalBill.toLocaleString()} (রেট: ${campClientRate} টাকা)

দয়া করে আমাদের পেমেন্ট ক্লিয়ার করে দিবেন।
(অবশ্যই বিকাশে খরচ সহ দিবেন। ব্যাংকে খরচ দিতে হবে না)

ধন্যবাদ!`;
    };

    const handleCopyCampTitle = () => {
        navigator.clipboard.writeText(generateCampaignTitle());
        setGenCampTitleCopied(true);
        setTimeout(() => setGenCampTitleCopied(false), 2000);
    };

    const handleCopyClientMsg = () => {
        navigator.clipboard.writeText(generateClientMessage());
        setGenCampMsgCopied(true);
        setTimeout(() => setGenCampMsgCopied(false), 2000);
    };

    const handleSendWhatsApp = () => {
        if (!selectedFish) return;
        let num = selectedFish.phone.replace(/[^\d]/g, '');
        if(num.startsWith('01')) num = '88' + num;
        else if(num.startsWith('1')) num = '880' + num;
        const msg = generateClientMessage();
        const url = `https://web.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    const calculateAgencyProfit = () => {
        if(!selectedFish || !selectedFish.campaign_records) return 0;
        return selectedFish.campaign_records.reduce((acc, rec) => {
            const clientChargedUSD = rec.amount_spent;
            const realCostUSD = rec.real_amount_spent || clientChargedUSD;
            const bRate = rec.buying_rate || 130;
            const cRate = rec.client_rate || 145;
            const chargedBDT = clientChargedUSD * cRate;
            const costBDT = realCostUSD * bRate;
            return acc + (chargedBDT - costBDT);
        }, 0);
    };

    const filteredFish = allFish
        .filter(f => (viewMode === 'active' ? f.status === 'Active Pool' : f.status !== 'Active Pool'))
        .filter(f => f.name.toLowerCase().includes(clientSearch.toLowerCase()) || f.phone.includes(clientSearch));

    // Live Agency Profit Calculation for the form
    const liveAgencyProfitBDT = (campSpend * campClientRate) - (campRealSpend * campBuyingRate);

    // --- FIX: Robust Toggle Helper for Portal Config ---
    const toggleConfig = (field: string) => {
        setPortalConfig(prev => {
            // Top level fields
            if (['show_balance', 'show_history', 'is_suspended'].includes(field)) {
                return { ...prev, [field]: !prev[field as keyof PortalConfig] };
            }
            
            // Feature flags - Ensure object exists and update immutably
            return {
                ...prev,
                feature_flags: {
                    ...(prev.feature_flags || {}), // ensure base exists
                    // @ts-ignore
                    [field]: !prev.feature_flags?.[field]
                }
            };
        });
    };

    return (
        <div className="space-y-6">
            {!selectedFish ? (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                                <span className="mr-2 text-3xl">🐟</span> Big Fish Clients
                            </h1>
                            <p className="text-sm text-gray-500">Manage your VIP clients, wallets, and campaigns.</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setIsManualAddOpen(true)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                                Manual Add
                            </button>
                            <button onClick={() => setIsCatchModalOpen(true)} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 shadow-md transition-colors flex items-center">
                                <Plus className="h-5 w-5 mr-2" /> Catch New Fish
                            </button>
                        </div>
                    </div>
                    {/* ... stats and filters ... */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex gap-2 p-1 bg-gray-200 rounded-lg">
                            <button onClick={() => setViewMode('active')} className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${viewMode === 'active' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Active Pool ({allFish.filter(f => f.status === 'Active Pool').length})</button>
                            <button onClick={() => setViewMode('history')} className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${viewMode === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Hall of Fame ({allFish.filter(f => f.status !== 'Active Pool').length})</button>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
                                <input className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Search clients..." value={clientSearch} onChange={e => setClientSearch(e.target.value)}/>
                            </div>
                            <div className="flex bg-white border border-gray-300 rounded-lg p-1">
                                <button onClick={() => setDisplayType('grid')} className={`p-2 rounded-md ${displayType === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}><Grid className="h-4 w-4"/></button>
                                <button onClick={() => setDisplayType('list')} className={`p-2 rounded-md ${displayType === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}><List className="h-4 w-4"/></button>
                            </div>
                        </div>
                    </div>
                    {filteredFish.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-500">No clients found in this view.</p>
                        </div>
                    ) : displayType === 'list' ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
                                        <tr>
                                            <th className="px-6 py-4">Client Name</th>
                                            <th className="px-6 py-4 text-right">Balance ($)</th>
                                            <th className="px-6 py-4 text-right">Total Spent</th>
                                            <th className="px-6 py-4 text-center">Status</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredFish.map(fish => (
                                            <tr key={fish.id} className="hover:bg-indigo-50/30 transition-colors group cursor-pointer" onClick={() => setSelectedFish(fish)}>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900 text-base">{fish.name}</div>
                                                    <div className="text-xs text-gray-500 flex items-center mt-1"><Smartphone className="h-3 w-3 mr-1"/> {fish.phone}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`font-mono font-bold text-base px-3 py-1 rounded-full ${fish.balance < 20 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>{formatCurrency(fish.balance)}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-gray-600 font-mono">{formatCurrency(fish.spent_amount)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${fish.status === 'Active Pool' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{fish.status === 'Active Pool' ? 'Active' : 'Archived'}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                                    <button onClick={(e) => toggleStatus(fish.id, e)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">{fish.status === 'Active Pool' ? <Archive className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredFish.map(fish => (
                                <div key={fish.id} onClick={() => setSelectedFish(fish)} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer relative group overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900 truncate pr-2">{fish.name}</h3>
                                            <p className="text-xs text-gray-500 flex items-center mt-1"><Smartphone className="h-3 w-3 mr-1"/> {fish.phone}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${fish.status === 'Active Pool' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{fish.status === 'Active Pool' ? 'Active' : 'Archived'}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="bg-gray-50 p-3 rounded-lg text-center"><span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Balance</span><span className={`block text-lg font-mono font-bold ${fish.balance < 20 ? 'text-red-500' : 'text-indigo-600'}`}>{formatCurrency(fish.balance)}</span></div>
                                        <div className="bg-gray-50 p-3 rounded-lg text-center"><span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Spent</span><span className="block text-lg font-mono font-bold text-gray-700">{formatCurrency(fish.spent_amount)}</span></div>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); setShowPreview(true); setSelectedFish(fish); }} className="p-2 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-full"><Eye className="h-4 w-4"/></button>
                                        <button onClick={(e) => toggleStatus(fish.id, e)} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-full">{fish.status === 'Active Pool' ? <Archive className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <div className="flex flex-col h-[calc(100vh-100px)]">
                    {/* Detail Header */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-col md:flex-row justify-between items-center shadow-sm">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <button onClick={() => setSelectedFish(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><ArrowLeft className="h-5 w-5"/></button>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">{selectedFish.name}</h1>
                                <div className="flex items-center gap-3 text-sm text-gray-500"><span className="flex items-center"><Smartphone className="h-3 w-3 mr-1"/> {selectedFish.phone}</span><span className="hidden md:inline text-gray-300">|</span><span className={`font-mono font-bold ${selectedFish.balance < 20 ? 'text-red-500' : 'text-green-600'}`}>Wallet: {formatCurrency(selectedFish.balance)}</span></div>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-3 md:mt-0 w-full md:w-auto">
                            <button onClick={() => setShowPreview(!showPreview)} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center border transition-colors ${showPreview ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}><Eye className="h-4 w-4 mr-2"/> {showPreview ? 'Exit Preview' : 'Client View'}</button>
                            <button onClick={() => setIsShareModalOpen(true)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"><Share2 className="h-4 w-4"/></button>
                        </div>
                    </div>

                    {showPreview ? (
                        <div className="flex-1 overflow-y-auto bg-gray-100 rounded-xl border border-gray-300 shadow-inner">
                            <PortalView client={selectedFish} paymentMethods={paymentMethods} />
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-hidden">
                            <div className="w-full md:w-64 bg-white border border-gray-200 rounded-xl overflow-y-auto shrink-0 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible">
                                {[
                                    { id: 'overview', label: 'Overview', icon: Activity },
                                    { id: 'wallet', label: 'Wallet & Funds', icon: Wallet },
                                    { id: 'camp_tools', label: 'Campaign Tools', icon: Layout },
                                    { id: 'ad_entry', label: 'Ad Performance', icon: TrendingUp },
                                    { id: 'crm', label: 'CRM & Notes', icon: List },
                                    { id: 'growth', label: 'Tasks & Growth', icon: CheckCircle },
                                    { id: 'targets', label: 'Sales Targets', icon: Target },
                                    { id: 'topups', label: 'Top-up Requests', icon: Plus },
                                    { id: 'profile', label: 'Profile & Settings', icon: Settings },
                                ].map(tab => (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`p-4 text-sm font-medium flex items-center transition-colors whitespace-nowrap md:whitespace-normal ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-600 border-b-2 md:border-b-0 md:border-l-4 border-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                                        <tab.icon className="h-4 w-4 mr-3"/> {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 overflow-y-auto shadow-sm">
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100"><h3 className="text-indigo-800 font-bold text-sm uppercase">Wallet Balance</h3><p className="text-3xl font-mono font-bold text-indigo-600 mt-2">{formatCurrency(selectedFish.balance)}</p></div>
                                            <div className="bg-purple-50 p-6 rounded-xl border border-purple-100"><h3 className="text-purple-800 font-bold text-sm uppercase">Ad Budget Used</h3><p className="text-3xl font-mono font-bold text-purple-600 mt-2">{formatCurrency(selectedFish.spent_amount)}</p></div>
                                            <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
                                                <h3 className="text-emerald-800 font-bold text-sm uppercase flex items-center">
                                                    <Coins className="h-4 w-4 mr-1"/> Agency Profit (BDT)
                                                </h3>
                                                <p className="text-3xl font-mono font-bold text-emerald-600 mt-2">৳{calculateAgencyProfit().toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'ad_entry' && (
                                    <div className="space-y-8 pb-12">
                                        {/* Entry Form */}
                                        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 shadow-sm">
                                            <h3 className="font-black text-indigo-900 mb-6 flex items-center uppercase tracking-wider text-sm">
                                                <Activity className="h-5 w-5 mr-2 text-indigo-600"/> Ad Performance Log
                                            </h3>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Execution Period</label>
                                                        <div className="flex gap-2">
                                                            <input type="date" className="w-full border-gray-300 rounded-lg p-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500" value={campStartDateInput} onChange={e => setCampStartDateInput(e.target.value)} />
                                                            <input type="date" className="w-full border-gray-300 rounded-lg p-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500" value={campEndDateInput} onChange={e => setCampEndDateInput(e.target.value)} />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 flex items-center">
                                                                <Percent className="h-3 w-3 mr-1"/> Buy Rate (৳)
                                                            </label>
                                                            <input type="number" className="w-full border-emerald-200 rounded-lg p-2 text-sm font-bold text-emerald-700 bg-emerald-50/30 focus:ring-2 focus:ring-emerald-500" value={campBuyingRate} onChange={e => setCampBuyingRate(parseFloat(e.target.value))} placeholder="130"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5 flex items-center">
                                                                <Percent className="h-3 w-3 mr-1"/> Charge Rate (৳)
                                                            </label>
                                                            <input type="number" className="w-full border-blue-200 rounded-lg p-2 text-sm font-bold text-blue-700 bg-blue-50/30 focus:ring-2 focus:ring-blue-500" value={campClientRate} onChange={e => setCampClientRate(parseFloat(e.target.value))} placeholder="145"/>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-1.5">Client Bill ($)</label>
                                                            <input type="number" className="w-full border-indigo-200 rounded-lg p-2 text-sm font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500" value={campSpend || ''} onChange={e => setCampSpend(parseFloat(e.target.value))} placeholder="Will be deducted"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-black text-red-600 uppercase tracking-widest mb-1.5">Actual Cost ($)</label>
                                                            <input type="number" className="w-full border-red-200 rounded-lg p-2 text-sm font-bold text-red-600 bg-red-50/20 focus:ring-2 focus:ring-red-500" value={campRealSpend || ''} onChange={e => setCampRealSpend(parseFloat(e.target.value))} placeholder="Paid to FB"/>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Campaign Mode</label>
                                                        <div className="flex bg-white rounded-lg p-1 border border-indigo-100 shadow-sm">
                                                            <button onClick={() => setCampResultType('MESSAGES')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${campResultType === 'MESSAGES' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-indigo-600'}`}><MessageCircle size={14}/> Message</button>
                                                            <button onClick={() => setCampResultType('SALES')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${campResultType === 'SALES' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-indigo-600'}`}><ShoppingBag size={14}/> Sales</button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Results (Count)</label>
                                                        <input type="number" className="w-full border-indigo-200 rounded-lg p-2.5 text-sm font-black text-indigo-700 pr-10 focus:ring-2 focus:ring-indigo-500" value={campResults || ''} onChange={e => setCampResults(parseInt(e.target.value))} placeholder="e.g. 50"/>
                                                    </div>
                                                    {campResultType === 'SALES' && (
                                                        <div className="grid grid-cols-2 gap-3 bg-indigo-100/50 p-3 rounded-lg border border-indigo-200">
                                                            <div><label className="block text-[9px] font-black text-gray-600 uppercase mb-1">Product Cost (৳)</label><input type="number" className="w-full border-indigo-300 rounded p-1.5 text-xs font-bold" value={campProdCost || ''} onChange={e => setCampProdCost(parseFloat(e.target.value))}/></div>
                                                            <div><label className="block text-[9px] font-black text-gray-600 uppercase mb-1">Selling Price (৳)</label><input type="number" className="w-full border-indigo-300 rounded p-1.5 text-xs font-bold" value={campProdPrice || ''} onChange={e => setCampProdPrice(parseFloat(e.target.value))}/></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Agency Profit Preview (Internal Only) */}
                                            <div className="mb-6 p-4 bg-emerald-900 rounded-xl text-white shadow-inner flex justify-between items-center">
                                                <div>
                                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Agency Profit Preview (Internal Only)</p>
                                                    <div className="flex items-baseline gap-2">
                                                        <h4 className={`text-3xl font-black font-mono ${liveAgencyProfitBDT >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>
                                                            ৳ {liveAgencyProfitBDT.toLocaleString()}
                                                        </h4>
                                                        <span className="text-[10px] text-emerald-400 font-bold">(Profit = Charged BDT - Buy Cost BDT)</span>
                                                    </div>
                                                </div>
                                                <div className="text-right border-l border-emerald-800 pl-4">
                                                    <p className="text-[10px] font-bold text-emerald-400 uppercase">Wallet Effect</p>
                                                    <p className="text-xl font-black text-red-300">-$ {campSpend}</p>
                                                </div>
                                            </div>

                                            <button onClick={handleCampaignEntry} className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2">
                                                <RefreshCw size={20} className="animate-spin-slow"/> DEDUCT WALLET & SAVE RECORD
                                            </button>
                                        </div>

                                        {/* Records Ledger */}
                                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mt-8">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-black border-b border-gray-100">
                                                        <tr>
                                                            <th className="px-6 py-4">Date</th>
                                                            <th className="px-6 py-4">Results</th>
                                                            <th className="px-6 py-4 text-right">Client Bill ($)</th>
                                                            <th className="px-6 py-4 text-right">Agency Cost ($)</th>
                                                            <th className="px-6 py-4 text-right font-bold">Agency Profit (৳)</th>
                                                            <th className="px-6 py-4 text-right">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {selectedFish.campaign_records?.slice().reverse().map(rec => {
                                                            const bRate = rec.buying_rate || 130;
                                                            const cRate = rec.client_rate || 145;
                                                            const chargedBDT = rec.amount_spent * cRate;
                                                            const actualCostBDT = (rec.real_amount_spent || rec.amount_spent) * bRate;
                                                            const totalMarginBDT = chargedBDT - actualCostBDT;
                                                            return (
                                                                <tr key={rec.id} className="hover:bg-gray-50">
                                                                    <td className="px-6 py-4 font-mono text-xs">{new Date(rec.start_date).toLocaleDateString('en-GB')}</td>
                                                                    <td className="px-6 py-4 text-xs font-bold">{rec.results_count} {rec.result_type}</td>
                                                                    <td className="px-6 py-4 text-right font-mono font-bold text-red-500">${rec.amount_spent.toFixed(1)}</td>
                                                                    <td className="px-6 py-4 text-right font-mono text-gray-500">${(rec.real_amount_spent || rec.amount_spent).toFixed(1)}</td>
                                                                    <td className={`px-6 py-4 text-right font-mono font-black ${totalMarginBDT >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>৳ {totalMarginBDT.toLocaleString()}</td>
                                                                    <td className="px-6 py-4 text-right"><button onClick={() => deleteCampaignRecord(rec.id)} className="p-2 text-gray-300 hover:text-red-600"><Trash2 className="h-4 w-4"/></button></td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'wallet' && (
                                    <div className="space-y-8">
                                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
                                            <h3 className="font-black text-gray-800 mb-4 uppercase text-xs tracking-widest">Manual Wallet Adjustment</h3>
                                            <div className="flex flex-col md:flex-row gap-4">
                                                <div className="flex-1 relative"><DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"/><input type="number" className="w-full pl-9 border-gray-300 rounded-lg p-2 text-sm shadow-sm" placeholder="Amount ($)" value={amount || ''} onChange={e => setAmount(parseFloat(e.target.value))} /></div>
                                                <input type="text" className="flex-[2] border-gray-300 rounded-lg p-2 text-sm shadow-sm" placeholder="Ref Description" value={desc} onChange={e => setDesc(e.target.value)} />
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleTransaction('DEPOSIT')} className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center shadow-md"><Plus className="h-4 w-4 mr-2"/> Add Funds</button>
                                                    <button onClick={() => handleTransaction('AD_SPEND')} className="bg-red-500 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center shadow-md"><TrendingUp className="h-4 w-4 mr-2"/> Deduct</button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-100 text-gray-500 font-black text-[10px] uppercase border-b border-gray-200"><tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Description</th><th className="px-6 py-4 text-right">Amount</th><th className="px-6 py-4 text-right">Action</th></tr></thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {selectedFish.transactions?.map(tx => (
                                                        <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-6 py-4 text-gray-500 font-mono text-xs">{new Date(tx.date).toLocaleDateString('en-GB')}</td>
                                                            <td className="px-6 py-4 font-medium text-gray-800">{tx.description}</td>
                                                            <td className={`px-6 py-4 text-right font-mono font-bold ${tx.type === 'DEPOSIT' ? 'text-emerald-600' : 'text-red-500'}`}>{tx.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(tx.amount)}</td>
                                                            <td className="px-6 py-4 text-right"><button onClick={() => deleteTransaction(tx.id)} className="p-2 text-gray-300 hover:text-red-600"><Trash2 className="h-4 w-4"/></button></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'camp_tools' && (
                                    <div className="space-y-6"><div className="bg-orange-50 border border-orange-100 p-6 rounded-xl"><h3 className="font-bold text-orange-800 mb-4 flex items-center"><Layout className="h-5 w-5 mr-2"/> Campaign Messenger</h3><div className="space-y-4"><div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">Page Name</label><input type="text" className="w-full border-gray-300 rounded-md p-2 text-sm" value={genCampPageName} onChange={e => setGenCampPageName(e.target.value)}/></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">Budget ($)</label><input type="number" className="w-full border-gray-300 rounded-md p-2 text-sm" value={genCampBudget || ''} onChange={e => setGenCampBudget(parseFloat(e.target.value))}/></div><div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">Charge Rate (৳)</label><input type="number" className="w-full border-gray-300 rounded-md p-2 text-sm" value={campClientRate} onChange={e => setCampClientRate(parseFloat(e.target.value))}/></div></div><div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">Date Range</label><div className="flex gap-2"><input type="date" className="w-full border-gray-300 rounded-md p-2 text-sm" value={genCampStartDate} onChange={e => setGenCampStartDate(e.target.value)}/><input type="date" className="w-full border-gray-300 rounded-md p-2 text-sm" value={genCampEndDate} onChange={e => setGenCampEndDate(e.target.value)}/></div></div><div className="space-y-4 pt-4 border-t border-orange-200"><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Client Bill Message</label><div className="relative"><textarea readOnly value={generateClientMessage()} className="w-full text-xs text-gray-800 bg-white border border-gray-300 rounded p-3 h-40 resize-none"/><button onClick={handleCopyClientMsg} className={`absolute bottom-2 right-2 text-xs font-bold px-3 py-1.5 rounded shadow-sm ${genCampMsgCopied ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{genCampMsgCopied ? 'Copied' : 'Copy Message'}</button></div></div><div className="flex gap-3"><button onClick={handleSendWhatsApp} className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center shadow-sm transition-colors"><Smartphone className="h-4 w-4 mr-1.5"/> Send via WhatsApp</button></div></div></div></div></div>
                                )}
                                {activeTab === 'crm' && (
                                    <div className="space-y-6"><div className="bg-gray-50 p-4 rounded-lg border border-gray-200"><h3 className="font-bold text-gray-700 mb-3 text-sm uppercase">Log New Interaction</h3><div className="flex gap-2 mb-3"><select className="border border-gray-300 rounded p-2 text-sm" value={interactionType} onChange={e => setInteractionType(e.target.value as any)}><option value="CALL">Call</option><option value="MEETING">Meeting</option><option value="WHATSAPP">WhatsApp</option><option value="EMAIL">Email</option></select><input type="date" className="border border-gray-300 rounded p-2 text-sm" value={interactionDate} onChange={e => setInteractionDate(e.target.value)} /></div><textarea className="w-full border border-gray-300 rounded p-2 text-sm mb-3 focus:ring-indigo-500" rows={3} placeholder="Notes..." value={interactionNotes} onChange={e => setInteractionNotes(e.target.value)}/><div className="flex justify-between items-center"><div className="flex items-center gap-2"><span className="text-xs text-gray-500">Next Follow-up:</span><input type="date" className="border border-gray-300 rounded p-1 text-sm" value={nextFollowUp} onChange={e => setNextFollowUp(e.target.value)} /></div><button onClick={async () => { if(!interactionNotes) return alert("Notes required"); await mockService.addClientInteraction(selectedFish.id, { type: interactionType, date: interactionDate, notes: interactionNotes, next_follow_up: nextFollowUp }); setInteractionNotes(''); setNextFollowUp(''); loadData(); }} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-indigo-700">Save Log</button></div></div></div>
                                )}
                                {activeTab === 'growth' && (
                                    <div className="space-y-6"><div className="flex gap-2"><input className="flex-1 border border-gray-300 rounded p-2 text-sm" placeholder="Add new task..." value={taskTitle} onChange={e => setTaskTitle(e.target.value)}/><input type="date" className="border border-gray-300 rounded p-2 text-sm" value={taskDate} onChange={e => setTaskDate(e.target.value)}/><button onClick={addTask} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"><Plus className="h-5 w-5"/></button></div><div className="space-y-2">{selectedFish.growth_tasks?.map(task => (<div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"><div className="flex items-center gap-3"><button onClick={() => toggleTask(task.id)} className={`h-5 w-5 rounded border flex items-center justify-center ${task.is_completed ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'}`}>{task.is_completed && <CheckSquare className="h-3 w-3 text-white"/>}</button><div><p className={`text-sm ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</p>{task.due_date && <p className="text-xs text-gray-400">Due: {task.due_date}</p>}</div></div></div>))}</div></div>
                                )}
                                {activeTab === 'targets' && (
                                    <div className="max-w-md space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Target Sales</label><input type="number" className="w-full border border-gray-300 rounded p-2" value={newTarget} onChange={e => setNewTarget(parseInt(e.target.value))} /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Current Sales</label><input type="number" className="w-full border border-gray-300 rounded p-2" value={newCurrent} onChange={e => setNewCurrent(parseInt(e.target.value))} /></div><button onClick={handleUpdateTargets} className="bg-indigo-600 text-white px-4 py-2 rounded font-bold hover:bg-indigo-700">Update Targets</button></div>
                                )}
                                {activeTab === 'profile' && (
                                    <div className="space-y-8">
                                        <div className="max-w-lg space-y-4">
                                            <h3 className="font-bold text-gray-900 border-b pb-2">Client Profile</h3>
                                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label><input className="w-full border border-gray-300 rounded p-2" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} /></div>
                                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Website URL</label><input className="w-full border border-gray-300 rounded p-2" value={profileWeb} onChange={e => setProfileWeb(e.target.value)} /></div>
                                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Facebook Page</label><input className="w-full border border-gray-300 rounded p-2" value={profileFb} onChange={e => setProfileFb(e.target.value)} /></div>
                                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Admin Notes</label><textarea className="w-full border border-gray-300 rounded p-2 h-24" value={profileNotes} onChange={e => setProfileNotes(e.target.value)} /></div>
                                        </div>
                                        
                                        <div className="max-w-lg pt-4">
                                            <h3 className="font-bold text-gray-900 border-b pb-2 mb-4">Portal Visibility Settings</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-indigo-200">
                                                    <span className="text-xs font-bold text-gray-700">Wallet Balance</span>
                                                    <div onClick={() => toggleConfig('show_balance')} className={`w-10 h-5 flex items-center rounded-full p-1 duration-300 ${portalConfig.show_balance ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${portalConfig.show_balance ? 'translate-x-5' : ''}`}></div>
                                                    </div>
                                                </label>
                                                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-indigo-200">
                                                    <span className="text-xs font-bold text-gray-700">History Ledger</span>
                                                    <div onClick={() => toggleConfig('show_history')} className={`w-10 h-5 flex items-center rounded-full p-1 duration-300 ${portalConfig.show_history ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${portalConfig.show_history ? 'translate-x-5' : ''}`}></div>
                                                    </div>
                                                </label>
                                                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-indigo-200">
                                                    <span className="text-xs font-bold text-gray-700">Message Report</span>
                                                    <div onClick={() => toggleConfig('show_message_report')} className={`w-10 h-5 flex items-center rounded-full p-1 duration-300 ${portalConfig.feature_flags?.show_message_report ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${portalConfig.feature_flags?.show_message_report ? 'translate-x-5' : ''}`}></div>
                                                    </div>
                                                </label>
                                                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-indigo-200">
                                                    <span className="text-xs font-bold text-gray-700">Sales Report</span>
                                                    <div onClick={() => toggleConfig('show_sales_report')} className={`w-10 h-5 flex items-center rounded-full p-1 duration-300 ${portalConfig.feature_flags?.show_sales_report ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${portalConfig.feature_flags?.show_sales_report ? 'translate-x-5' : ''}`}></div>
                                                    </div>
                                                </label>
                                                <label className="flex items-center justify-between p-3 bg-purple-50 rounded-lg cursor-pointer border border-purple-100 hover:border-purple-300">
                                                    <span className="text-xs font-black text-purple-700">Profit/Loss Report</span>
                                                    <div onClick={() => toggleConfig('show_profit_loss_report')} className={`w-10 h-5 flex items-center rounded-full p-1 duration-300 ${portalConfig.feature_flags?.show_profit_loss_report ? 'bg-purple-600' : 'bg-gray-300'}`}>
                                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${portalConfig.feature_flags?.show_profit_loss_report ? 'translate-x-5' : ''}`}></div>
                                                    </div>
                                                </label>
                                                <label className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg cursor-pointer border border-indigo-100 hover:border-indigo-300">
                                                    <span className="text-xs font-black text-indigo-700">Payment Methods</span>
                                                    <div onClick={() => toggleConfig('show_payment_methods')} className={`w-10 h-5 flex items-center rounded-full p-1 duration-300 ${portalConfig.feature_flags?.show_payment_methods ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${portalConfig.feature_flags?.show_payment_methods ? 'translate-x-5' : ''}`}></div>
                                                    </div>
                                                </label>
                                                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-indigo-200">
                                                    <span className="text-xs font-bold text-gray-700">Allow Top-up</span>
                                                    <div onClick={() => toggleConfig('allow_topup_request')} className={`w-10 h-5 flex items-center rounded-full p-1 duration-300 ${portalConfig.feature_flags?.allow_topup_request ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${portalConfig.feature_flags?.allow_topup_request ? 'translate-x-5' : ''}`}></div>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="max-w-lg pt-4">
                                            <label className="flex items-center justify-between p-3 bg-red-50 rounded-lg cursor-pointer border border-red-100">
                                                <span className="text-sm font-black text-red-700 uppercase">Suspended (Block Access)</span>
                                                <div onClick={() => toggleConfig('is_suspended')} className={`w-10 h-5 flex items-center rounded-full p-1 duration-300 ${portalConfig.is_suspended ? 'bg-red-600' : 'bg-gray-300'}`}>
                                                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${portalConfig.is_suspended ? 'translate-x-5' : ''}`}></div>
                                                </div>
                                            </label>
                                        </div>

                                        <button onClick={handleUpdateProfile} className="bg-indigo-600 text-white px-6 py-3 rounded font-bold hover:bg-indigo-700 w-full md:w-auto shadow-sm mt-6">Save All Changes</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
            {/* Catch/Manual Modal ... */}
            {isCatchModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"><div className="bg-white rounded-lg shadow-xl w-full max-w-md h-[500px] flex flex-col"><div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50"><h3 className="font-bold text-gray-800">Select Client from Leads</h3><button onClick={() => setIsCatchModalOpen(false)}><X className="h-5 w-5 text-gray-500"/></button></div><div className="p-2 border-b border-gray-100"><input className="w-full border border-gray-300 rounded-md p-2 text-sm" placeholder="Search name..." value={catchSearch} onChange={e => setCatchSearch(e.target.value)} autoFocus /></div><div className="flex-1 overflow-y-auto">{leads.filter(l => l.full_name.toLowerCase().includes(catchSearch.toLowerCase())).map(lead => (<div key={lead.id} onClick={() => handleCatchFish(lead.id)} className="p-3 border-b border-gray-100 hover:bg-indigo-50 cursor-pointer flex justify-between items-center"><div><p className="font-bold text-gray-900">{lead.full_name}</p><p className="text-xs text-gray-500">{lead.primary_phone}</p></div><Plus className="h-4 w-4 text-indigo-600"/></div>))}</div></div></div>
            )}
            {isManualAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"><div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6"><h3 className="font-bold text-lg mb-4">Add Manual Client</h3><div className="space-y-3"><input className="w-full border border-gray-300 rounded p-2" placeholder="Client Name" value={manualName} onChange={e => setManualName(e.target.value)} /><input className="w-full border border-gray-300 rounded p-2" placeholder="Phone Number" value={manualPhone} onChange={e => setManualPhone(e.target.value)} /><button onClick={handleManualAdd} className="w-full bg-indigo-600 text-white font-bold py-2 rounded hover:bg-indigo-700">Create Client</button><button onClick={() => setIsManualAddOpen(false)} className="w-full border border-gray-300 text-gray-700 font-bold py-2 rounded hover:bg-gray-50">Cancel</button></div></div></div>
            )}
            {isShareModalOpen && selectedFish && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"><div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"><h3 className="font-bold text-lg mb-4 text-center">Share Portal Access</h3><div className="bg-gray-100 p-3 rounded-lg border border-gray-200 mb-4 break-all text-sm font-mono text-center">{window.location.origin}/#/portal/{selectedFish.id}</div><div className="flex gap-2"><button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/#/portal/${selectedFish.id}`); setIsShareModalOpen(false); alert("Link Copied!"); }} className="flex-1 bg-indigo-600 text-white font-bold py-2 rounded hover:bg-indigo-700 flex items-center justify-center"><Copy className="h-4 w-4 mr-2"/> Copy Link</button><button onClick={() => setIsShareModalOpen(false)} className="flex-1 border border-gray-300 font-bold py-2 rounded hover:bg-gray-50">Close</button></div></div></div>
            )}
            {previewImage && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-90 p-4 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
                    <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center">
                        <img src={previewImage} alt="Screenshot" className="max-w-full max-h-[80vh] object-contain rounded-lg border-2 border-white shadow-2xl" />
                        <button onClick={() => setPreviewImage(null)} className="mt-4 bg-white text-gray-900 px-6 py-2 rounded-full font-bold shadow-lg">Close Preview</button>
                    </div>
                </div>
            )}
        </div>
    );
};
export default BigFishPage;
