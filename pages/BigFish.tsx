
import React, { useState, useEffect } from 'react';
import { mockService } from '../services/mockService';
import { BigFish, Lead, LeadStatus, Transaction, PaymentMethod, ClientInteraction } from '../types';
import { Plus, TrendingUp, ExternalLink, CheckCircle, Target, Copy, ArrowLeft, Wallet, PieChart, Activity, Eye, List, X, Download, Archive, RotateCcw, Trash2, Settings, Building, Smartphone, Share2, AlertTriangle, Clock, Edit2, User, Search, CheckSquare, ChevronLeft, ChevronRight, Repeat, Phone, MessageSquare, Mail, MessageCircle } from 'lucide-react';
import { PortalView } from './ClientPortal'; 
import { useCurrency } from '../context/CurrencyContext';

const BigFishPage: React.FC = () => {
    const { formatCurrency } = useCurrency(); // Currency Context
    const [allFish, setAllFish] = useState<BigFish[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
    const [isCatchModalOpen, setIsCatchModalOpen] = useState(false);
    const [isManualAddOpen, setIsManualAddOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showDeadlineAlert, setShowDeadlineAlert] = useState(false);
    const [expiringClients, setExpiringClients] = useState<BigFish[]>([]);
    const [catchSearch, setCatchSearch] = useState('');
    const [clientSearch, setClientSearch] = useState(''); // Search state for Active Clients
    const [isEditTxModalOpen, setIsEditTxModalOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [editTxDate, setEditTxDate] = useState('');
    const [editTxDesc, setEditTxDesc] = useState('');
    const [editTxAmount, setEditTxAmount] = useState(0);
    const [selectedFish, setSelectedFish] = useState<BigFish | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'wallet' | 'ad_entry' | 'growth' | 'ledger' | 'settings' | 'targets' | 'profile' | 'retainer' | 'crm'>('overview');
    const [manualName, setManualName] = useState('');
    const [manualPhone, setManualPhone] = useState('');
    const [amount, setAmount] = useState<number>(0);
    const [desc, setDesc] = useState('');
    const [showThankYou, setShowThankYou] = useState(false);
    const [adSpend, setAdSpend] = useState<number>(0);
    const [adImpr, setAdImpr] = useState<number>(0);
    const [adReach, setAdReach] = useState<number>(0);
    const [adLeads, setAdLeads] = useState<number>(0);
    const [adDate, setAdDate] = useState(new Date().toISOString().slice(0, 10));
    const [resultType, setResultType] = useState<'SALES' | 'MESSAGES'>('MESSAGES');
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDate, setTaskDate] = useState('');
    const [newTarget, setNewTarget] = useState(0);
    const [newCurrent, setNewCurrent] = useState(0);
    const [workLogText, setWorkLogText] = useState('');
    const [profilePhone, setProfilePhone] = useState('');
    const [profileWeb, setProfileWeb] = useState('');
    const [profileFb, setProfileFb] = useState('');
    const [profileNotes, setProfileNotes] = useState('');
    const [campStart, setCampStart] = useState('');
    const [campEnd, setCampEnd] = useState('');
    const [methodType, setMethodType] = useState<'BANK' | 'MOBILE'>('MOBILE');
    const [providerName, setProviderName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [routingNumber, setRoutingNumber] = useState('');
    const [mobileType, setMobileType] = useState<'Personal' | 'Merchant' | 'Agent'>('Personal');
    const [instruction, setInstruction] = useState<'Send Money' | 'Payment' | 'Cash Out'>('Send Money');
    const [generatedLink, setGeneratedLink] = useState('');

    // Retainer State
    const [isRetainer, setIsRetainer] = useState(false);
    const [retainerAmount, setRetainerAmount] = useState(0);
    const [retainerDate, setRetainerDate] = useState('');

    // CRM State
    const [interactionType, setInteractionType] = useState<ClientInteraction['type']>('CALL');
    const [interactionNotes, setInteractionNotes] = useState('');
    const [interactionDate, setInteractionDate] = useState(new Date().toISOString().slice(0, 10));
    const [nextFollowUp, setNextFollowUp] = useState('');
    const [autoCreateTask, setAutoCreateTask] = useState(true);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    useEffect(() => { loadData(); }, []);

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
            if(updated) {
                setSelectedFish(updated);
                setNewTarget(updated.target_sales);
                setNewCurrent(updated.current_sales);
                setCampStart(updated.campaign_start_date || '');
                setCampEnd(updated.campaign_end_date || '');
                setProfilePhone(updated.phone || '');
                setProfileWeb(updated.website_url || '');
                setProfileFb(updated.facebook_page || '');
                setProfileNotes(updated.notes || '');
                
                // Initialize Retainer State
                setIsRetainer(updated.is_retainer || false);
                setRetainerAmount(updated.retainer_amount || 0);
                setRetainerDate(updated.retainer_renewal_date || '');
            }
        }
    };

    const handleCatchFish = async (leadId: string) => { const newFish = await mockService.catchBigFish(leadId); if (newFish) { setIsCatchModalOpen(false); setCatchSearch(''); loadData(); alert("🎣 New Big Fish caught!"); } else { alert("This lead is already active!"); } };
    const handleManualAdd = async () => { if (!manualName) return alert("Name is required"); await mockService.createBigFish({ name: manualName, phone: manualPhone, package_name: 'Manual VIP Client' }); setIsManualAddOpen(false); setManualName(''); setManualPhone(''); loadData(); }
    const toggleStatus = async (id: string, e?: React.MouseEvent) => { if (e) e.stopPropagation(); await mockService.toggleBigFishStatus(id); await loadData(); };
    const handleTransaction = async (type: Transaction['type']) => { if (!selectedFish || amount <= 0) return alert("Enter valid amount"); await mockService.addTransaction(selectedFish.id, type, amount, desc || (type === 'DEPOSIT' ? 'Balance Top-up' : 'Manual Deduction')); if (type === 'DEPOSIT') { setShowThankYou(true); setTimeout(() => setShowThankYou(false), 3000); } setAmount(0); setDesc(''); loadData(); };
    const deleteTransaction = async (txId: string) => { if (!selectedFish) return; if(confirm("Are you sure? This will reverse the balance effect.")) { await mockService.deleteTransaction(selectedFish.id, txId); loadData(); } };
    const openEditTxModal = (tx: Transaction) => { setEditingTx(tx); setEditTxDate(new Date(tx.date).toISOString().slice(0, 10)); setEditTxDesc(tx.description); setEditTxAmount(tx.amount); setIsEditTxModalOpen(true); };
    const handleUpdateTransaction = async () => { if (!selectedFish || !editingTx) return; await mockService.updateTransaction(selectedFish.id, editingTx.id, { date: editTxDate, description: editTxDesc, amount: editTxAmount }); setIsEditTxModalOpen(false); setEditingTx(null); loadData(); };
    const handleAdEntry = async () => { if (!selectedFish || adSpend <= 0) return alert("Spend amount required"); if (!adDate) return alert("Date is required"); const metadata = { impressions: adImpr, reach: adReach, leads: adLeads, resultType: resultType }; await mockService.addTransaction(selectedFish.id, 'AD_SPEND', adSpend, `Daily Ad Spend`, metadata, adDate); setAdSpend(0); setAdImpr(0); setAdReach(0); setAdLeads(0); alert(`Ad Spend Recorded & ${resultType} Updated!`); loadData(); };
    const addTask = async () => { if (!selectedFish || !taskTitle) return; await mockService.addGrowthTask(selectedFish.id, taskTitle, taskDate); setTaskTitle(''); setTaskDate(''); loadData(); };
    const toggleTask = async (taskId: string) => { if (!selectedFish) return; await mockService.toggleGrowthTask(selectedFish.id, taskId); loadData(); };
    const updatePortal = async (key: string, val: any) => { if (!selectedFish) return; await mockService.updatePortalConfig(selectedFish.id, { [key]: val }); loadData(); };
    const toggleSharedCalc = async (key: string) => { if(!selectedFish) return; const current = selectedFish.portal_config?.shared_calculators || { cpr: false, currency: false, roi: false }; const newCalcs = { ...current, [key]: !current[key as keyof typeof current] }; await mockService.updatePortalConfig(selectedFish.id, { shared_calculators: newCalcs }); loadData(); }
    const saveCampaignDates = async () => { if (!selectedFish) return; await mockService.updateBigFish(selectedFish.id, { campaign_start_date: campStart, campaign_end_date: campEnd }); alert("Campaign dates updated!"); loadData(); };
    const saveProfile = async () => { if(!selectedFish) return; await mockService.updateBigFish(selectedFish.id, { phone: profilePhone, website_url: profileWeb, facebook_page: profileFb, notes: profileNotes }); alert("Client profile saved!"); loadData(); }
    const saveTargets = async () => { if(!selectedFish) return; await mockService.updateTargets(selectedFish.id, newTarget, newCurrent); alert("Sales targets updated!"); loadData(); };
    const addManualLog = async () => { if(!selectedFish || !workLogText) return; await mockService.addWorkLog(selectedFish.id, workLogText); setWorkLogText(''); loadData(); }
    const handleAddPaymentMethod = async () => { if(!providerName || !accountNumber) return alert("Provider Name and Number are required"); await mockService.savePaymentMethod({ type: methodType, provider_name: providerName, account_number: accountNumber, account_name: methodType === 'BANK' ? accountName : undefined, branch_name: methodType === 'BANK' ? branchName : undefined, routing_number: methodType === 'BANK' ? routingNumber : undefined, mobile_type: methodType === 'MOBILE' ? mobileType : undefined, instruction: methodType === 'MOBILE' ? instruction : undefined, }); setProviderName(''); setAccountNumber(''); setAccountName(''); setBranchName(''); setRoutingNumber(''); loadData(); }
    const handleDeletePaymentMethod = async (id: string) => { if(confirm("Delete this payment method? It will be removed from all client portals.")) { await mockService.deletePaymentMethod(id); loadData(); } }
    const downloadClientList = (list: BigFish[], prefix: string) => { if (list.length === 0) return alert("No data to export."); const data = list.map(f => ({ Name: f.name, Phone: f.phone, Package: f.package_name || 'N/A', Balance: f.balance ? f.balance.toFixed(2) : '0.00', TotalSpend: f.spent_amount ? f.spent_amount.toFixed(2) : '0.00', Status: f.status })); const csvContent = [ Object.keys(data[0]).join(','), ...data.map(row => Object.values(row).map(val => `"${val}"`).join(',')) ].join('\n'); const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.setAttribute('download', `${prefix}_clients_${new Date().toISOString().slice(0,10)}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link); };
    const getPortalLink = () => { if(!selectedFish) return ''; const currentUrl = window.location.href.split('#')[0]; const cleanBase = currentUrl.endsWith('/') ? currentUrl.slice(0, -1) : currentUrl; return `${cleanBase}/#/portal/${selectedFish.id}`; };
    const openShareModal = () => { const link = getPortalLink(); if(!link) return; setGeneratedLink(link); setIsShareModalOpen(true); };
    const openPortalPreview = () => { setShowPreview(true); };
    const handleOpenLinkInPreview = () => { setIsShareModalOpen(false); setShowPreview(true); };
    const getDaysRemaining = (end?: string) => { if (!end) return null; const now = new Date(); const endDate = new Date(end); const diffTime = endDate.getTime() - now.getTime(); const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); return diffDays; };
    
    // Retainer Save Handler
    const handleSaveRetainer = async () => {
        if(!selectedFish) return;
        await mockService.updateBigFish(selectedFish.id, {
            is_retainer: isRetainer,
            retainer_amount: retainerAmount,
            retainer_renewal_date: retainerDate
        });
        alert("Subscription settings updated!");
        loadData();
    };

    // CRM Handlers
    const handleAddInteraction = async () => {
        if(!selectedFish || !interactionNotes) return alert("Please add notes for the interaction.");
        
        // 1. Add Log
        await mockService.addClientInteraction(selectedFish.id, {
            type: interactionType,
            date: interactionDate,
            notes: interactionNotes,
            next_follow_up: nextFollowUp
        });

        // 2. Auto Create Task if enabled and date is present
        if (autoCreateTask && nextFollowUp) {
            await mockService.addGrowthTask(selectedFish.id, `Follow up: ${interactionType.toLowerCase()} regarding "${interactionNotes.substring(0, 20)}..."`, nextFollowUp);
        }

        // Reset
        setInteractionNotes('');
        setNextFollowUp('');
        setInteractionType('CALL');
        alert("Interaction logged successfully.");
        loadData();
    };

    const handleDeleteInteraction = async (interactionId: string) => {
        if(!selectedFish) return;
        if(confirm("Delete this history log?")) {
            await mockService.deleteClientInteraction(selectedFish.id, interactionId);
            loadData();
        }
    };

    // Pagination & Search Logic
    const activePool = allFish.filter(f => 
        f.status === 'Active Pool' && 
        (
            f.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
            f.phone.includes(clientSearch)
        )
    );
    const hallOfFame = allFish.filter(f => f.status === 'Hall of Fame');
    
    const totalPages = Math.ceil(activePool.length / ITEMS_PER_PAGE);
    const displayedFish = activePool.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const filteredLeadsForCatch = leads.filter(l => { const isEligible = l.status === LeadStatus.CLOSED_WON || l.status === LeadStatus.HOT; const matchesSearch = l.full_name.toLowerCase().includes(catchSearch.toLowerCase()) || l.primary_phone.includes(catchSearch); return isEligible && matchesSearch; });

    const getInteractionIcon = (type: string) => {
        switch(type) {
            case 'CALL': return <Phone className="h-4 w-4"/>;
            case 'MEETING': return <User className="h-4 w-4"/>;
            case 'EMAIL': return <Mail className="h-4 w-4"/>;
            case 'WHATSAPP': return <MessageCircle className="h-4 w-4"/>;
            default: return <MessageSquare className="h-4 w-4"/>;
        }
    };

    if (showPreview && selectedFish) { return ( <div className="fixed inset-0 z-[100] bg-gray-50 overflow-y-auto font-inter"> <div className="sticky top-0 z-50 bg-indigo-900 text-white px-6 py-3 flex justify-between items-center shadow-md"> <div className="flex items-center"> <Eye className="mr-3 h-5 w-5 text-indigo-300"/> <span className="font-bold text-lg">Client View Preview</span> <span className="ml-4 text-xs bg-indigo-800 px-2 py-1 rounded text-indigo-200 hidden sm:inline">This is exactly what {selectedFish.name} sees.</span> </div> <button onClick={() => setShowPreview(false)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-bold flex items-center transition-colors shadow-sm"> <X className="h-4 w-4 mr-2"/> Close Preview </button> </div> <PortalView client={selectedFish} paymentMethods={paymentMethods} /> </div> ); }

    // RENDER: DETAIL VIEW
    if (selectedFish) {
        return (
            <div className="flex flex-col h-[calc(100vh-6rem)] font-inter">
                {/* Header Logic */}
                <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedFish(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                            <ArrowLeft className="h-5 w-5"/>
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{selectedFish.name}</h1>
                            <p className="text-xs text-gray-500">{selectedFish.package_name}</p>
                        </div>
                    </div>
                    {/* ... Rest of Detail Header ... */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-gray-100 rounded-lg p-1 mr-2 border border-gray-200">
                            <button onClick={(e) => selectedFish.status !== 'Active Pool' && toggleStatus(selectedFish.id, e)} className={`flex items-center px-3 py-1.5 rounded-md text-xs font-bold transition-all ${selectedFish.status === 'Active Pool' ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}> <div className={`w-2 h-2 rounded-full mr-2 ${selectedFish.status === 'Active Pool' ? 'bg-green-500' : 'bg-gray-300'}`}></div> Active </button>
                            <button onClick={(e) => { if(selectedFish.status === 'Active Pool') { if(confirm('Archive this client to Completed Work?')) { toggleStatus(selectedFish.id, e); setSelectedFish(null); } } }} className={`flex items-center px-3 py-1.5 rounded-md text-xs font-bold transition-all ${selectedFish.status !== 'Active Pool' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:bg-gray-200 hover:text-red-600'}`}> <CheckSquare className="h-3 w-3 mr-1.5"/> Completed </button>
                        </div>
                        <button onClick={openPortalPreview} className="flex items-center bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-100 text-xs font-medium transition-colors"> <Eye className="h-3 w-3 mr-1"/> View Portal </button>
                        <button onClick={openShareModal} className="flex items-center bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 text-xs font-bold shadow-sm transition-colors"> <Share2 className="h-3 w-3 mr-1"/> Share Link </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col p-2 space-y-1 overflow-y-auto">
                        <button onClick={() => setActiveTab('overview')} className={`flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-white shadow-sm text-indigo-600 border border-indigo-100' : 'text-gray-600 hover:bg-gray-200'}`}> <PieChart className="h-4 w-4 mr-3"/> Overview (Portal) </button>
                        <button onClick={() => setActiveTab('profile')} className={`flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-white shadow-sm text-indigo-600 border border-indigo-100' : 'text-gray-600 hover:bg-gray-200'}`}> <User className="h-4 w-4 mr-3"/> Client Profile </button>
                        <button onClick={() => setActiveTab('crm')} className={`flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'crm' ? 'bg-white shadow-sm text-indigo-600 border border-indigo-100' : 'text-gray-600 hover:bg-gray-200'}`}> <MessageSquare className="h-4 w-4 mr-3"/> CRM & History </button>
                        <button onClick={() => setActiveTab('retainer')} className={`flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'retainer' ? 'bg-white shadow-sm text-indigo-600 border border-indigo-100' : 'text-gray-600 hover:bg-gray-200'}`}> <Repeat className="h-4 w-4 mr-3"/> Subscription </button>
                        <button onClick={() => setActiveTab('wallet')} className={`flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'wallet' ? 'bg-white shadow-sm text-indigo-600 border border-indigo-100' : 'text-gray-600 hover:bg-gray-200'}`}> <Wallet className="h-4 w-4 mr-3"/> Wallet & Funds </button>
                        <button onClick={() => setActiveTab('ad_entry')} className={`flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'ad_entry' ? 'bg-white shadow-sm text-indigo-600 border border-indigo-100' : 'text-gray-600 hover:bg-gray-200'}`}> <Activity className="h-4 w-4 mr-3"/> Daily Ad Entry </button>
                        <button onClick={() => setActiveTab('growth')} className={`flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'growth' ? 'bg-white shadow-sm text-indigo-600 border border-indigo-100' : 'text-gray-600 hover:bg-gray-200'}`}> <CheckCircle className="h-4 w-4 mr-3"/> Growth Plan </button>
                        <button onClick={() => setActiveTab('targets')} className={`flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'targets' ? 'bg-white shadow-sm text-indigo-600 border border-indigo-100' : 'text-gray-600 hover:bg-gray-200'}`}> <Target className="h-4 w-4 mr-3"/> Targets & Logs </button>
                        <button onClick={() => setActiveTab('ledger')} className={`flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'ledger' ? 'bg-white shadow-sm text-indigo-600 border border-indigo-100' : 'text-gray-600 hover:bg-gray-200'}`}> <List className="h-4 w-4 mr-3"/> Ledger (History) </button>
                        <button onClick={() => setActiveTab('settings')} className={`flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-white shadow-sm text-indigo-600 border border-indigo-100' : 'text-gray-600 hover:bg-gray-200'}`}> <Settings className="h-4 w-4 mr-3"/> Portal Settings </button>
                    </div>

                    {/* CONTENT AREA */}
                    <div className="flex-1 bg-white p-8 overflow-y-auto">
                        {activeTab === 'overview' && ( <div className="space-y-4"> <h2 className="text-xl font-bold text-gray-800">Admin Overview (Live Data)</h2> <p className="text-gray-500 text-sm">This is exactly what the client sees in their portal.</p> <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm"> <PortalView client={selectedFish} paymentMethods={paymentMethods} /> </div> </div> )}
                        {activeTab === 'profile' && ( <div className="max-w-3xl space-y-6"> <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"> <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center"> <User className="h-5 w-5 mr-2 text-indigo-600"/> Client Contact Info </h3> <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div className="col-span-2 md:col-span-1"> <label className="block text-sm font-medium text-gray-700 mb-1">Phone / WhatsApp</label> <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} /> </div> <div className="col-span-2 md:col-span-1"> <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Page Link</label> <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900" value={profileFb} onChange={e => setProfileFb(e.target.value)} placeholder="https://facebook.com/..." /> </div> <div className="col-span-2"> <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label> <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900" value={profileWeb} onChange={e => setProfileWeb(e.target.value)} placeholder="https://..." /> </div> </div> </div> <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 shadow-sm"> <h3 className="text-lg font-bold text-yellow-800 mb-4 flex items-center"> 📝 Private Admin Notes </h3> <textarea className="w-full border border-yellow-300 rounded-lg p-3 h-32 focus:ring-yellow-500 focus:border-yellow-500 bg-white text-gray-900" placeholder="Write internal notes here (not visible to client)..." value={profileNotes} onChange={e => setProfileNotes(e.target.value)} /> </div> <div className="flex justify-end"> <button onClick={saveProfile} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-all flex items-center"> Save Profile </button> </div> </div> )}
                        
                        {activeTab === 'crm' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                                {/* LEFT: LOG INTERACTION */}
                                <div className="flex flex-col">
                                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                            <Phone className="h-5 w-5 mr-2 text-indigo-600"/> Log Communication
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                                                    <select 
                                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-indigo-500"
                                                        value={interactionType}
                                                        onChange={e => setInteractionType(e.target.value as any)}
                                                    >
                                                        <option value="CALL">Call</option>
                                                        <option value="MEETING">Meeting (Online/Offline)</option>
                                                        <option value="WHATSAPP">WhatsApp</option>
                                                        <option value="EMAIL">Email</option>
                                                        <option value="OTHER">Other</option>
                                                    </select>
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                                                    <input 
                                                        type="date" 
                                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-indigo-500"
                                                        value={interactionDate}
                                                        onChange={e => setInteractionDate(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Summary / Notes</label>
                                                <textarea 
                                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm h-32 focus:ring-indigo-500 focus:border-indigo-500"
                                                    placeholder="What did you discuss? What's the outcome?"
                                                    value={interactionNotes}
                                                    onChange={e => setInteractionNotes(e.target.value)}
                                                />
                                            </div>

                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="block text-xs font-bold text-blue-800 uppercase">Next Follow-up</label>
                                                    <div className="flex items-center">
                                                        <input 
                                                            type="checkbox" 
                                                            id="autoTask" 
                                                            className="h-4 w-4 text-blue-600 rounded mr-2"
                                                            checked={autoCreateTask}
                                                            onChange={e => setAutoCreateTask(e.target.checked)}
                                                        />
                                                        <label htmlFor="autoTask" className="text-xs text-blue-700">Add to Growth Tasks</label>
                                                    </div>
                                                </div>
                                                <input 
                                                    type="date" 
                                                    className="w-full border border-blue-200 rounded-lg p-2 text-sm focus:ring-blue-500"
                                                    value={nextFollowUp}
                                                    onChange={e => setNextFollowUp(e.target.value)}
                                                />
                                                <p className="text-xs text-blue-600 mt-2">
                                                    {nextFollowUp && autoCreateTask 
                                                        ? "A task will be automatically created in 'Growth Plan' for this date." 
                                                        : "Set a date to schedule a follow-up."}
                                                </p>
                                            </div>

                                            <button 
                                                onClick={handleAddInteraction} 
                                                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors flex justify-center items-center"
                                            >
                                                <CheckCircle className="h-4 w-4 mr-2"/> Save Interaction
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT: TIMELINE */}
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 overflow-hidden flex flex-col h-full">
                                    <h3 className="text-lg font-bold text-gray-900 mb-6">Interaction History</h3>
                                    
                                    <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                                        {!selectedFish.interactions || selectedFish.interactions.length === 0 ? (
                                            <div className="text-center text-gray-400 py-10">
                                                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20"/>
                                                <p>No history yet.</p>
                                            </div>
                                        ) : (
                                            selectedFish.interactions.map((item, idx) => (
                                                <div key={item.id} className="relative pl-8 group">
                                                    {/* Vertical Line */}
                                                    {idx !== (selectedFish.interactions!.length - 1) && (
                                                        <div className="absolute top-8 left-[11px] bottom-[-24px] w-0.5 bg-gray-200 group-last:hidden"></div>
                                                    )}
                                                    
                                                    {/* Icon */}
                                                    <div className="absolute left-0 top-1 h-6 w-6 rounded-full bg-white border-2 border-indigo-200 flex items-center justify-center text-indigo-600 z-10">
                                                        {getInteractionIcon(item.type)}
                                                    </div>

                                                    {/* Content Card */}
                                                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative">
                                                        <button 
                                                            onClick={() => handleDeleteInteraction(item.id)}
                                                            className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 className="h-4 w-4"/>
                                                        </button>
                                                        
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">{item.type}</span>
                                                            <span className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{item.notes}</p>
                                                        
                                                        {item.next_follow_up && (
                                                            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center text-xs text-amber-600 font-medium">
                                                                <Clock className="h-3 w-3 mr-1"/> Follow-up: {new Date(item.next_follow_up).toLocaleDateString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'retainer' && (
                            <div className="max-w-2xl bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                                    <Repeat className="h-5 w-5 mr-2 text-indigo-600"/> Monthly Subscription / Retainer
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm">Enable Monthly Tracking</h4>
                                            <p className="text-xs text-gray-500">System will alert you when payment is due.</p>
                                        </div>
                                        <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                            <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" checked={isRetainer} onChange={e => setIsRetainer(e.target.checked)}/>
                                            <label htmlFor="toggle" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${isRetainer ? 'bg-indigo-600' : 'bg-gray-300'}`}></label>
                                        </div>
                                    </div>

                                    {isRetainer && (
                                        <div className="grid grid-cols-2 gap-6 animate-fade-in">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Fee ($)</label>
                                                <input 
                                                    type="number" 
                                                    className="w-full border border-gray-300 rounded p-2.5 focus:ring-indigo-500" 
                                                    value={retainerAmount}
                                                    onChange={e => setRetainerAmount(parseFloat(e.target.value))}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Next Payment Date</label>
                                                <input 
                                                    type="date" 
                                                    className="w-full border border-gray-300 rounded p-2.5 focus:ring-indigo-500"
                                                    value={retainerDate}
                                                    onChange={e => setRetainerDate(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                                        <button onClick={handleSaveRetainer} className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:bg-indigo-700 transition-colors">
                                            Save Settings
                                        </button>
                                    </div>
                                </div>
                                <style>{`
                                    .toggle-checkbox:checked { right: 0; border-color: #68D391; }
                                    .toggle-checkbox { right: auto; left: 0; transition: all 0.3s; }
                                    .toggle-label { width: 3rem; }
                                `}</style>
                            </div>
                        )}
                        {activeTab === 'wallet' && ( <div className="max-w-2xl space-y-6"> <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 flex justify-between items-center"> <div> <p className="text-indigo-600 font-bold uppercase text-xs tracking-wider">Current Balance</p> <h2 className="text-4xl font-mono font-bold text-indigo-900 mt-1">{formatCurrency(selectedFish.balance || 0)}</h2> <p className="text-xs text-indigo-400 mt-2">Lifetime Deposit: {formatCurrency(mockService.getLifetimeDeposit(selectedFish))}</p> </div> <Wallet className="h-16 w-16 text-indigo-200"/> </div> <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"> <h3 className="text-lg font-bold text-gray-900 mb-4">Fund Adjustment</h3> <div className="space-y-4"> <div> <label className="block text-sm font-medium text-gray-700">Amount ($)</label> <input type="number" className="w-full border border-gray-300 rounded p-2 mt-1 text-gray-900" value={amount || ''} onChange={e => setAmount(parseFloat(e.target.value))} /> <p className="text-xs text-gray-500 mt-1">Please enter amount in USD ($).</p></div> <div> <label className="block text-sm font-medium text-gray-700">Description (Optional)</label> <input type="text" className="w-full border border-gray-300 rounded p-2 mt-1 text-gray-900" placeholder="e.g. Bank Transfer Ref..." value={desc} onChange={e => setDesc(e.target.value)} /> </div> <div className="flex gap-4 pt-2"> <button onClick={() => handleTransaction('DEPOSIT')} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded font-bold transition-colors"> <TrendingUp className="inline-block mr-2 h-4 w-4"/> Deposit Funds </button> <button onClick={() => handleTransaction('DEDUCT')} className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-3 rounded font-bold transition-colors"> Deduct / Adjust </button> </div> {showThankYou && ( <div className="bg-green-50 text-green-800 p-3 rounded text-center font-bold animate-bounce mt-4"> 🎉 Thank you! Deposit successful. </div> )} </div> </div> </div> )}
                        {activeTab === 'ad_entry' && ( <div className="max-w-2xl bg-white border border-gray-200 rounded-xl p-6 shadow-sm"> <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center"> <Activity className="h-5 w-5 mr-2 text-indigo-600"/> Daily Ad Performance </h3> <div className="grid grid-cols-2 gap-6"> <div> <label className="block text-sm font-medium text-gray-700 mb-1">Date</label> <input type="date" className="w-full border border-gray-300 rounded p-2 text-gray-900" value={adDate} onChange={e => setAdDate(e.target.value)} /> </div> <div> <label className="block text-sm font-medium text-gray-700 mb-1">Amount Spent ($)</label> <input type="number" className="w-full border border-gray-300 rounded p-2 focus:ring-indigo-500 text-gray-900" value={adSpend || ''} onChange={e => setAdSpend(parseFloat(e.target.value))} /> <p className="text-xs text-gray-500 mt-1">Enter in USD ($)</p></div> <div> <label className="block text-sm font-medium text-gray-700 mb-1">Result Type</label> <select className="w-full border border-gray-300 rounded p-2 text-gray-900" value={resultType} onChange={e => setResultType(e.target.value as any)}> <option value="MESSAGES">Messages</option> <option value="SALES">Sales</option> </select> </div> <div> <label className="block text-sm font-medium text-gray-700 mb-1">Count ({resultType === 'SALES' ? 'Sales' : 'Msgs'})</label> <input type="number" className="w-full border border-gray-300 rounded p-2 text-gray-900" value={adLeads || ''} onChange={e => setAdLeads(parseFloat(e.target.value))} /> </div> <div> <label className="block text-sm font-medium text-gray-700 mb-1">Impressions</label> <input type="number" className="w-full border border-gray-300 rounded p-2 text-gray-900" value={adImpr || ''} onChange={e => setAdImpr(parseFloat(e.target.value))} /> </div> <div> <label className="block text-sm font-medium text-gray-700 mb-1">Reach</label> <input type="number" className="w-full border border-gray-300 rounded p-2 text-gray-900" value={adReach || ''} onChange={e => setAdReach(parseFloat(e.target.value))} /> </div> </div> <div className="mt-8 pt-6 border-t border-gray-100"> <button onClick={handleAdEntry} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold shadow-md transition-all"> Save & Auto-Deduct Balance </button> <p className="text-xs text-gray-500 mt-2 text-center">This will deduct ${adSpend || 0} from wallet and add a work log entry.</p> </div> </div> )}
                        {activeTab === 'growth' && ( <div className="max-w-3xl"> <div className="flex gap-4 mb-6"> <input className="flex-1 border border-gray-300 rounded p-2 text-gray-900" placeholder="New Task (e.g. Upload 4 Videos)" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} /> <input type="date" className="border border-gray-300 rounded p-2 text-gray-900" value={taskDate} onChange={e => setTaskDate(e.target.value)} /> <button onClick={addTask} className="bg-indigo-600 text-white px-6 rounded font-bold">Add</button> </div> <div className="space-y-2"> {selectedFish.growth_tasks?.map(task => ( <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded border hover:bg-white transition-colors"> <div className="flex items-center gap-3"> <button onClick={() => toggleTask(task.id)} className={`h-6 w-6 rounded-full border flex items-center justify-center ${task.is_completed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}> {task.is_completed && <CheckCircle className="text-white h-4 w-4"/>} </button> <span className={task.is_completed ? 'line-through text-gray-400' : 'text-gray-800'}>{task.title}</span> </div> <span className="text-xs text-gray-400">{task.due_date}</span> </div> ))} </div> </div> )}
                        {activeTab === 'targets' && ( <div className="max-w-3xl space-y-8"> <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"> <h3 className="font-bold text-gray-900 mb-4">Sales Targets</h3> <div className="grid grid-cols-2 gap-4"> <div> <label className="block text-sm font-medium text-gray-700">Target Sales</label> <input type="number" className="w-full border border-gray-300 rounded p-2 text-gray-900" value={newTarget} onChange={e => setNewTarget(parseFloat(e.target.value))} /> </div> <div> <label className="block text-sm font-medium text-gray-700">Current Sales</label> <input type="number" className="w-full border border-gray-300 rounded p-2 text-gray-900" value={newCurrent} onChange={e => setNewCurrent(parseFloat(e.target.value))} /> </div> </div> <button onClick={saveTargets} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded font-medium">Update Progress Bar</button> </div> <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"> <h3 className="font-bold text-gray-900 mb-4">Manual Work Log Entry</h3> <div className="flex gap-4"> <input className="flex-1 border border-gray-300 rounded p-2 text-gray-900" placeholder="e.g. Fixed website bug, Posted new creative..." value={workLogText} onChange={e => setWorkLogText(e.target.value)} /> <button onClick={addManualLog} className="bg-green-600 text-white px-6 rounded font-bold">Add Log</button> </div> <p className="text-xs text-gray-500 mt-2">Daily Ad Spend automatically creates logs. Use this for other activities.</p> </div> </div> )}
                        {activeTab === 'ledger' && ( <div className="max-w-4xl"> <table className="w-full text-sm text-left text-gray-600 border rounded-lg overflow-hidden"> <thead className="bg-gray-100 text-gray-700 uppercase text-xs"> <tr> <th className="px-4 py-3">Date</th> <th className="px-4 py-3">Type</th> <th className="px-4 py-3">Description</th> <th className="px-4 py-3 text-right">Amount</th> <th className="px-4 py-3 text-right">Action</th> </tr> </thead> <tbody className="divide-y divide-gray-100"> {selectedFish.transactions?.map(tx => ( <tr key={tx.id} className="hover:bg-gray-50"> <td className="px-4 py-3">{new Date(tx.date).toLocaleDateString()}</td> <td className="px-4 py-3 font-bold text-xs">{tx.type}</td> <td className="px-4 py-3">{tx.description}</td> <td className={`px-4 py-3 text-right font-mono ${tx.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}`}> {tx.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(tx.amount)} </td> <td className="px-4 py-3 text-right"> <div className="flex justify-end gap-2"> <button onClick={() => openEditTxModal(tx)} className="text-gray-400 hover:text-blue-600" title="Edit"> <Edit2 className="h-4 w-4"/> </button> <button onClick={() => deleteTransaction(tx.id)} className="text-gray-400 hover:text-red-600" title="Delete"> <Trash2 className="h-4 w-4"/> </button> </div> </td> </tr> ))} </tbody> </table> </div> )}
                        {activeTab === 'settings' && ( <div className="max-w-2xl space-y-6"> <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"> <h3 className="font-bold text-gray-900 mb-4 flex items-center"> <Clock className="h-5 w-5 mr-2 text-indigo-600"/> Campaign Duration </h3> <div className="grid grid-cols-2 gap-4"> <div> <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label> <input type="date" className="w-full border border-gray-300 rounded p-2 text-gray-900" value={campStart} onChange={e => setCampStart(e.target.value)} /> </div> <div> <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Deadline)</label> <input type="date" className="w-full border border-gray-300 rounded p-2 text-gray-900" value={campEnd} onChange={e => setCampEnd(e.target.value)} /> </div> </div> <button onClick={saveCampaignDates} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded font-medium text-sm">Save Dates</button> <p className="text-xs text-gray-500 mt-2">Setting an End Date will trigger alerts 24 hours before expiration.</p> </div> <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"> <h3 className="font-bold text-gray-900 mb-4">Portal Visibility</h3> <div className="space-y-3"> <label className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer"> <span className="text-sm font-medium text-gray-900">Show Wallet Balance</span> <input type="checkbox" checked={selectedFish.portal_config.show_balance} onChange={e => updatePortal('show_balance', e.target.checked)} className="h-5 w-5 text-indigo-600"/> </label> <label className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer"> <span className="text-sm font-medium text-gray-900">Show Transaction History</span> <input type="checkbox" checked={selectedFish.portal_config.show_history} onChange={e => updatePortal('show_history', e.target.checked)} className="h-5 w-5 text-indigo-600"/> </label> <label className="flex items-center justify-between p-3 border border-red-200 bg-red-50 rounded cursor-pointer"> <span className="text-sm font-bold text-red-700">Suspend Access (Lock Portal)</span> <input type="checkbox" checked={selectedFish.portal_config.is_suspended} onChange={e => updatePortal('is_suspended', e.target.checked)} className="h-5 w-5 text-red-600"/> </label> </div> </div> <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"> <h3 className="font-bold text-gray-900 mb-4">Shared Calculators</h3> <p className="text-xs text-gray-500 mb-4">Enable tools for the client to use in their portal.</p> <div className="space-y-3"> <label className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer"> <span className="text-sm font-medium text-gray-900">Cost Per Result (CPR)</span> <input type="checkbox" checked={selectedFish.portal_config.shared_calculators?.cpr} onChange={() => toggleSharedCalc('cpr')} className="h-5 w-5 text-indigo-600"/> </label> <label className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer"> <span className="text-sm font-medium text-gray-900">USD to BDT Converter</span> <input type="checkbox" checked={selectedFish.portal_config.shared_calculators?.currency} onChange={() => toggleSharedCalc('currency')} className="h-5 w-5 text-indigo-600"/> </label> <label className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer"> <span className="text-sm font-medium text-gray-900">Profit/ROI Calculator</span> <input type="checkbox" checked={selectedFish.portal_config.shared_calculators?.roi} onChange={() => toggleSharedCalc('roi')} className="h-5 w-5 text-indigo-600"/> </label> </div> </div> <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"> <h3 className="font-bold text-gray-900 mb-4">Announcement Banner</h3> <div className="space-y-3"> <input className="w-full border border-gray-300 rounded p-2 text-sm text-gray-900" placeholder="Title (e.g. Payment Due)" value={selectedFish.portal_config.announcement_title || ''} onChange={e => updatePortal('announcement_title', e.target.value)} /> <textarea className="w-full border border-gray-300 rounded p-2 text-sm text-gray-900" placeholder="Message body..." value={selectedFish.portal_config.announcement_message || ''} onChange={e => updatePortal('announcement_message', e.target.value)} /> </div> </div> <div className="bg-red-50 p-6 rounded-xl border border-red-100 shadow-sm mt-6"> <h3 className="font-bold text-red-800 mb-2">Danger Zone</h3> <p className="text-xs text-red-600 mb-4">Once archived, the client will be moved to the 'Hall of Fame' history list. You can restore them later.</p> <button onClick={(e) => { if(confirm('Are you sure you want to archive this client?')) { toggleStatus(selectedFish.id, e); setSelectedFish(null); } }} className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded text-sm font-bold hover:bg-red-50 transition-colors"> <Archive className="h-4 w-4 inline-block mr-2" /> Archive / Move to Hall of Fame </button> </div> </div> )}
                    </div>
                </div>
                {/* Modals from previous code included here... */}
                {/* SHARE MODAL */}
                {isShareModalOpen && ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"> <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl"> <div className="flex justify-between items-center mb-4"> <h3 className="text-lg font-bold text-gray-900 flex items-center"> <Share2 className="h-5 w-5 mr-2 text-indigo-600"/> Share Client Portal </h3> <button onClick={() => setIsShareModalOpen(false)} className="text-gray-400 hover:text-gray-600"> <X className="h-5 w-5"/> </button> </div> <div className="mb-6"> <label className="block text-sm font-medium text-gray-700 mb-2">Unique Access Link</label> <div className="flex shadow-sm rounded-md"> <input type="text" readOnly value={generatedLink} className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 bg-gray-50 text-sm text-gray-600 focus:outline-none" /> <button onClick={() => {navigator.clipboard.writeText(generatedLink); alert("Link Copied!");}} className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium"> <Copy className="h-4 w-4"/> </button> </div> <p className="text-xs text-gray-500 mt-2"> Send this link to your client. They can view their wallet, reports, and progress in real-time. </p> </div> <div className="flex gap-3"> <button onClick={handleOpenLinkInPreview} className="flex-1 bg-indigo-600 text-white text-center py-2 rounded-md font-bold text-sm hover:bg-indigo-700 flex items-center justify-center transition-colors"> <ExternalLink className="h-4 w-4 mr-2"/> Open / Preview </button> <button onClick={() => setIsShareModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-md font-bold text-sm hover:bg-gray-50"> Close </button> </div> </div> </div> )}
                {/* EDIT TRANSACTION MODAL */}
                {isEditTxModalOpen && ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"> <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl"> <div className="flex justify-between items-center mb-4"> <h3 className="text-lg font-bold text-gray-900">Edit Transaction</h3> <button onClick={() => setIsEditTxModalOpen(false)}><X className="h-5 w-5 text-gray-500"/></button> </div> <div className="space-y-4"> <div> <label className="block text-sm font-medium text-gray-700 mb-1">Date</label> <input type="date" className="w-full border border-gray-300 rounded p-2 text-gray-900" value={editTxDate} onChange={e => setEditTxDate(e.target.value)} /> </div> <div> <label className="block text-sm font-medium text-gray-700 mb-1">Description</label> <input type="text" className="w-full border border-gray-300 rounded p-2 text-gray-900" value={editTxDesc} onChange={e => setEditTxDesc(e.target.value)} /> </div> <div> <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label> <input type="number" className="w-full border border-gray-300 rounded p-2 text-gray-900" value={editTxAmount} onChange={e => setEditTxAmount(parseFloat(e.target.value))} /> </div> <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded"> Warning: Changing the amount will automatically recalculate the client's Balance and Total Spend. </p> <div className="flex gap-2 pt-2"> <button onClick={() => setIsEditTxModalOpen(false)} className="flex-1 py-2 bg-gray-200 text-gray-800 rounded">Cancel</button> <button onClick={handleUpdateTransaction} className="flex-1 py-2 bg-indigo-600 text-white rounded font-bold">Save Changes</button> </div> </div> </div> </div> )}
            </div>
        );
    }

    // RENDER: LIST VIEW (MAIN DASHBOARD)
    return (
        <div className="space-y-8 relative font-inter">
            {showDeadlineAlert && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-70 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-bounce-slow">
                        <div className="bg-red-600 p-4 flex justify-between items-center text-white">
                            <h3 className="font-bold text-lg flex items-center"><AlertTriangle className="mr-2 h-6 w-6"/> Critical Campaign Alerts</h3>
                            <button onClick={() => setShowDeadlineAlert(false)} className="text-white hover:bg-red-700 rounded p-1"><X className="h-5 w-5"/></button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700 font-medium mb-4">The following campaigns are ending within 24 hours. Contact clients immediately to renew or extend budget.</p>
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                {expiringClients.map(c => (
                                    <div key={c.id} className="flex justify-between items-center bg-red-50 border border-red-200 p-3 rounded-lg">
                                        <div>
                                            <p className="font-bold text-red-900">{c.name}</p>
                                            <p className="text-xs text-red-700">Ends: {new Date(c.campaign_end_date!).toLocaleDateString()}</p>
                                        </div>
                                        <button onClick={() => { setSelectedFish(c); setShowDeadlineAlert(false); }} className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700"> View </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end">
                            <button onClick={() => setShowDeadlineAlert(false)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-sm font-bold">Dismiss</button>
                        </div>
                    </div>
                </div>
            )}

            {/* NEW HEADER DESIGN */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center group cursor-default">
                        <span className="text-3xl mr-2 inline-block animate-swim">🐋</span>
                        <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent transition-all duration-300 group-hover:from-indigo-600 group-hover:to-blue-600">
                            Big Fish Agency
                        </span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Manage VIP clients, balances, and reports.</p>
                </div>
                <div className="flex gap-3">
                     <button onClick={() => setIsPaymentModalOpen(true)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center text-sm"> <Settings className="h-4 w-4 mr-2" /> Methods </button>
                    <button onClick={() => setIsManualAddOpen(true)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center text-sm"> <Plus className="h-4 w-4 mr-2" /> Manual Add </button>
                    <button onClick={() => setIsCatchModalOpen(true)} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center text-sm"> <Target className="h-4 w-4 mr-2" /> Catch Lead </button>
                </div>
            </div>

            {/* TAB SELECTOR (ACTIVE VS HISTORY) */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
                <button onClick={() => setViewMode('active')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'active' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}> Active Clients ({activePool.length}) </button>
                <button onClick={() => setViewMode('history')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'history' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}> Completed Work ({hallOfFame.length}) </button>
            </div>

            {/* ACTIVE CLIENTS GRID */}
            {viewMode === 'active' && (
                <div>
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input 
                                type="text" 
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Search Active Clients..."
                                value={clientSearch}
                                onChange={(e) => { setClientSearch(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                        <button onClick={() => downloadClientList(activePool, 'active')} className="text-gray-400 hover:text-indigo-600 transition-colors flex items-center text-xs font-bold"> 
                            <Download className="h-4 w-4 mr-1"/> Export List 
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {displayedFish.map(fish => {
                            const daysLeft = getDaysRemaining(fish.campaign_end_date);
                            const isCritical = daysLeft !== null && daysLeft <= 1;
                            const isLowBalance = (fish.balance || 0) < (fish.low_balance_alert_threshold || 10);

                            return (
                                <div onClick={() => setSelectedFish(fish)} key={fish.id} className={`group bg-white rounded-xl border-2 p-5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg relative overflow-hidden ${isCritical ? 'border-red-300 shadow-red-100' : 'border-gray-100 hover:border-indigo-300'}`}>
                                    <div className={`absolute top-0 left-0 right-0 h-1 ${isLowBalance ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                    <div className="absolute top-3 right-3 z-30">
                                        <button onClick={(e) => { e.stopPropagation(); if(window.confirm(`Mark ${fish.name} as Completed/Inactive?`)) { toggleStatus(fish.id, e); } }} className="px-2 py-1 bg-white border border-gray-200 text-gray-500 text-xs font-bold rounded-md shadow-sm hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-colors flex items-center" title="Move to Completed"> <CheckCircle className="h-3 w-3 mr-1" /> Mark Complete </button>
                                    </div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">{fish.name}</h3>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">{fish.package_name || 'Standard'}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Wallet</p>
                                            <p className={`text-xl font-mono font-bold ${isLowBalance ? 'text-red-600' : 'text-gray-800'}`}> {formatCurrency(fish.balance || 0)} </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 mt-2">
                                        <div> <p className="text-[10px] text-gray-400 uppercase">Total Spent</p> <p className="text-sm font-bold text-gray-700">{formatCurrency(fish.spent_amount || 0)}</p> </div>
                                        <div className="text-right"> <p className="text-[10px] text-gray-400 uppercase">Campaign</p> {daysLeft !== null ? ( <p className={`text-sm font-bold ${daysLeft <= 3 ? 'text-red-500' : 'text-green-600'}`}> {daysLeft <= 0 ? 'Ended' : `${daysLeft} Days Left`} </p> ) : ( <p className="text-sm text-gray-400">Ongoing</p> )} </div>
                                    </div>
                                    <div className="absolute inset-0 bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm z-10 pointer-events-none"> <span className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md">Manage Dashboard</span> </div>
                                </div>
                            );
                        })}
                        
                        {/* Only show 'Add New Client' button on last page if pagination is used, or always if less than 1 page */}
                        {(currentPage === totalPages || totalPages === 0) && (
                            <button onClick={() => setIsCatchModalOpen(true)} className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all min-h-[180px]"> <Plus className="h-8 w-8 mb-2" /> <span className="font-bold text-sm">Add New Client</span> </button>
                        )}
                    </div>

                    {/* PAGINATION CONTROLS */}
                    {activePool.length > ITEMS_PER_PAGE && (
                        <div className="flex justify-center items-center mt-8 space-x-4">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center font-medium"
                            >
                                <ChevronLeft className="h-4 w-4 mr-2"/> Previous
                            </button>
                            <span className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-2 rounded">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center font-medium"
                            >
                                Next <ChevronRight className="h-4 w-4 ml-2"/>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* INACTIVE HISTORY */}
            {viewMode === 'history' && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    {hallOfFame.length === 0 ? (
                        <div className="p-12 text-center text-gray-400"> <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-20"/> <p>No completed/inactive clients yet.</p> </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {hallOfFame.map(fish => (
                                <div key={fish.id} onClick={() => setSelectedFish(fish)} className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors"> {fish.name.charAt(0)} </div>
                                        <div> <p className="font-bold text-gray-700 group-hover:text-indigo-600">{fish.name}</p> <p className="text-xs text-gray-400">Completed: {new Date(fish.end_date || new Date().toISOString()).toLocaleDateString()}</p> </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right hidden sm:block"> <p className="text-xs text-gray-400 uppercase">Lifetime Spend</p> <p className="font-bold text-sm text-gray-600">{formatCurrency(fish.spent_amount || 0)}</p> </div>
                                        <button onClick={(e) => toggleStatus(fish.id, e)} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 rounded-md transition-colors shadow-sm text-xs font-bold flex items-center" title="Restore to Active"> <RotateCcw className="h-3 w-3 mr-1.5"/> Restore </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* MODALS */}
            {isCatchModalOpen && ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"> <div className="bg-white rounded-lg p-6 w-full max-w-md"> <h3 className="text-lg font-bold mb-4 text-gray-900">Select Lead to Convert</h3> <div className="relative mb-4"> <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"/> <input className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Search by Name or Phone..." value={catchSearch} onChange={e => setCatchSearch(e.target.value)} autoFocus /> </div> <div className="max-h-60 overflow-y-auto space-y-2 mb-4"> {filteredLeadsForCatch.length === 0 && ( <p className="text-center text-xs text-gray-400 py-4">No matching leads found (Must be HOT or WON)</p> )} {filteredLeadsForCatch.map(lead => ( <button key={lead.id} onClick={() => handleCatchFish(lead.id)} className="w-full text-left p-3 rounded bg-gray-50 hover:bg-blue-50 border border-gray-100 flex justify-between items-center group transition-colors"> <div> <div className="font-bold text-gray-900 group-hover:text-blue-700">{lead.full_name}</div> <div className="text-xs text-gray-600 font-mono">{lead.primary_phone}</div> </div> <Plus className="h-4 w-4 text-gray-400 group-hover:text-blue-600"/> </button> ))} </div> <button onClick={() => setIsCatchModalOpen(false)} className="w-full py-2 bg-gray-200 text-gray-800 rounded font-medium hover:bg-gray-300">Cancel</button> </div> </div> )}
             {isManualAddOpen && ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"> <div className="bg-white rounded-lg p-6 w-full max-w-md"> <h3 className="text-lg font-bold mb-4 text-gray-900">Add VIP Client Manually</h3> <div className="space-y-4 mb-4"> <input className="w-full border border-gray-300 rounded p-2 text-gray-900 placeholder-gray-500" placeholder="Client Name" value={manualName} onChange={e => setManualName(e.target.value)} /> <input className="w-full border border-gray-300 rounded p-2 text-gray-900 placeholder-gray-500" placeholder="Phone Number" value={manualPhone} onChange={e => setManualPhone(e.target.value)} /> </div> <div className="flex gap-2"> <button onClick={() => setIsManualAddOpen(false)} className="flex-1 py-2 bg-gray-200 text-gray-800 rounded font-medium">Cancel</button> <button onClick={handleManualAdd} className="flex-1 py-2 bg-indigo-600 text-white rounded font-bold">Create Client</button> </div> </div> </div> )}
            {isPaymentModalOpen && ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"> <div className="bg-white rounded-lg p-6 w-full max-w-lg"> <div className="flex justify-between items-center mb-4"> <h3 className="text-lg font-bold text-gray-900">Manage Payment Methods</h3> <button onClick={() => setIsPaymentModalOpen(false)}><X className="h-5 w-5 text-gray-500"/></button> </div> <div className="bg-gray-50 p-4 rounded mb-4 border border-gray-200 space-y-3"> <h4 className="text-xs font-bold text-gray-500 uppercase">Add New Method</h4> <div className="flex rounded-md shadow-sm" role="group"> <button type="button" onClick={() => setMethodType('MOBILE')} className={`flex-1 px-4 py-2 text-xs font-medium border rounded-l-lg ${methodType === 'MOBILE' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}> Mobile Banking </button> <button type="button" onClick={() => setMethodType('BANK')} className={`flex-1 px-4 py-2 text-xs font-medium border rounded-r-lg ${methodType === 'BANK' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}> Bank Transfer </button> </div> <div className="grid grid-cols-2 gap-3"> <div className="col-span-2"> <label className="block text-xs font-medium text-gray-500 mb-1">Provider Name</label> <input className="w-full border border-gray-300 rounded p-2 text-sm text-gray-900" placeholder={methodType === 'BANK' ? "e.g. City Bank" : "e.g. bKash"} value={providerName} onChange={e => setProviderName(e.target.value)} /> </div> <div className="col-span-2"> <label className="block text-xs font-medium text-gray-500 mb-1">Account Number</label> <input className="w-full border border-gray-300 rounded p-2 text-sm font-mono text-gray-900" placeholder={methodType === 'BANK' ? "110-220..." : "017..."} value={accountNumber} onChange={e => setAccountNumber(e.target.value)} /> </div> {methodType === 'MOBILE' ? ( <> <div> <label className="block text-xs font-medium text-gray-500 mb-1">Account Type</label> <select className="w-full border border-gray-300 rounded p-2 text-sm text-gray-900" value={mobileType} onChange={e => setMobileType(e.target.value as any)}> <option value="Personal">Personal</option> <option value="Merchant">Merchant</option> <option value="Agent">Agent</option> </select> </div> <div> <label className="block text-xs font-medium text-gray-500 mb-1">Instruction</label> <select className="w-full border border-gray-300 rounded p-2 text-sm text-gray-900" value={instruction} onChange={e => setInstruction(e.target.value as any)}> <option value="Send Money">Send Money</option> <option value="Payment">Payment</option> <option value="Cash Out">Cash Out</option> </select> </div> </> ) : ( <> <div className="col-span-2"> <label className="block text-xs font-medium text-gray-500 mb-1">Account Name</label> <input className="w-full border border-gray-300 rounded p-2 text-sm text-gray-900" placeholder="Account Holder Name" value={accountName} onChange={e => setAccountName(e.target.value)} /> </div> <div> <label className="block text-xs font-medium text-gray-500 mb-1">Branch Name</label> <input className="w-full border border-gray-300 rounded p-2 text-sm text-gray-900" placeholder="Branch Name" value={branchName} onChange={e => setBranchName(e.target.value)} /> </div> <div> <label className="block text-xs font-medium text-gray-500 mb-1">Routing Number</label> <input className="w-full border border-gray-300 rounded p-2 text-sm text-gray-900" placeholder="Optional" value={routingNumber} onChange={e => setRoutingNumber(e.target.value)} /> </div> </> )} </div> <button onClick={handleAddPaymentMethod} className="w-full bg-green-600 text-white py-2 rounded text-sm font-bold hover:bg-green-700 mt-2">Add Payment Method</button> </div> <div className="max-h-60 overflow-y-auto space-y-2"> {paymentMethods.map(pm => ( <div key={pm.id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50"> <div className="flex items-center gap-3"> <div className="p-2 bg-indigo-50 rounded text-indigo-600"> {pm.type === 'BANK' ? <Building className="h-4 w-4"/> : <Smartphone className="h-4 w-4"/>} </div> <div> <p className="font-bold text-sm text-gray-900">{pm.provider_name}</p> <p className="text-xs text-gray-500 font-mono">{pm.account_number}</p> </div> </div> <button onClick={() => handleDeletePaymentMethod(pm.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4"/></button> </div> ))} </div> </div> </div> )}
        </div>
    );
};

export default BigFishPage;
