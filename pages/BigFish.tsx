
import React, { useState, useEffect } from 'react';
import { mockService } from '../services/mockService';
import { BigFish, TopUpRequest, Transaction } from '../types';
import { Search, Plus, Filter, MoreVertical, ExternalLink, ShieldCheck, Trash2, Layout, X, CheckCircle, AlertCircle, Calendar, DollarSign, TrendingUp, Settings, Lock, Edit2, Save } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
// @ts-ignore
import { Link } from 'react-router-dom';

const BigFishPage: React.FC = () => {
    const { formatCurrency } = useCurrency();
    const [allFish, setAllFish] = useState<BigFish[]>([]);
    const [selectedFishId, setSelectedFishId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Tab State
    const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'topups' | 'settings'>('overview');

    // UI States
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isAddTxOpen, setIsAddTxOpen] = useState(false);
    
    // Add Transaction Form
    const [txType, setTxType] = useState<'DEPOSIT' | 'DEDUCT' | 'AD_SPEND' | 'SERVICE_CHARGE'>('AD_SPEND');
    const [txAmount, setTxAmount] = useState(0);
    const [txDesc, setTxDesc] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const data = await mockService.getBigFish();
        setAllFish(data);
        setLoading(false);
        
        // If we have a selected fish, update it to keep data fresh
        if (selectedFishId) {
            const updated = data.find(f => f.id === selectedFishId);
            if (!updated) setSelectedFishId(null); // Deselect if deleted
        }
    };

    const handleSelectFish = (id: string) => {
        setSelectedFishId(id);
        setActiveTab('overview');
    };

    const selectedFish = allFish.find(f => f.id === selectedFishId);

    // --- TOP UP ACTIONS ---
    const handleApproveTopUp = async (req: TopUpRequest) => {
        if (!selectedFish) return;
        if(confirm(`Approve top-up of ${formatCurrency(req.amount)}? This will add funds to balance.`)) {
            await mockService.approveTopUpRequest(selectedFish.id, req.id);
            // Also create a deposit transaction
            await mockService.addTransaction(selectedFish.id, 'DEPOSIT', req.amount, `Top-up via ${req.method_name} (${req.sender_number})`);
            loadData();
        }
    };

    const handleRejectTopUp = async (reqId: string) => {
        if (!selectedFish) return;
        if(confirm("Reject this top-up request?")) {
            await mockService.rejectTopUpRequest(selectedFish.id, reqId);
            loadData();
        }
    };

    const handleDeleteTopUp = async (reqId: string) => {
        if (!selectedFish) return;
        if(confirm("Delete this request record permanently?")) {
            await mockService.deleteTopUpRequest(selectedFish.id, reqId);
            loadData();
        }
    };

    // --- TRANSACTION ACTIONS ---
    const handleAddTransaction = async () => {
        if(!selectedFish) return;
        if(!txAmount || !txDesc) return alert("Amount and Description required.");
        
        await mockService.addTransaction(selectedFish.id, txType, txAmount, txDesc);
        setIsAddTxOpen(false);
        setTxAmount(0);
        setTxDesc('');
        loadData();
    };

    const handleDeleteTransaction = async (txId: string) => {
        if(!selectedFish) return;
        if(confirm("Delete this transaction? Balance will be recalculated.")) {
            await mockService.deleteTransaction(selectedFish.id, txId);
            loadData();
        }
    };

    // --- SETTINGS ACTIONS ---
    const handleTogglePortal = async (setting: string) => {
        if(!selectedFish) return;
        const config = { ...selectedFish.portal_config };
        
        if(setting === 'show_balance') config.show_balance = !config.show_balance;
        if(setting === 'show_history') config.show_history = !config.show_history;
        if(setting === 'is_suspended') config.is_suspended = !config.is_suspended;
        if(setting === 'topup') {
             config.feature_flags = { 
                 ...config.feature_flags, 
                 allow_topup_request: !config.feature_flags?.allow_topup_request 
             } as any;
        }

        await mockService.updateBigFish(selectedFish.id, { portal_config: config });
        loadData();
    };

    const filteredFish = allFish.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col font-inter">
            {/* Page Header */}
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <span className="mr-2 text-2xl">🐳</span> Big Fish Management
                    </h1>
                    <p className="text-sm text-gray-500">Manage VIP clients, wallets, and portal access.</p>
                </div>
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden">
                
                {/* LEFT: CLIENT LIST */}
                <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden shrink-0">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"/>
                            <input 
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Search clients..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filteredFish.map(fish => (
                            <div 
                                key={fish.id}
                                onClick={() => handleSelectFish(fish.id)}
                                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${selectedFishId === fish.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`font-bold text-sm ${selectedFishId === fish.id ? 'text-indigo-900' : 'text-gray-900'}`}>{fish.name}</h3>
                                    {fish.portal_config.is_suspended && <Lock className="h-3 w-3 text-red-500"/>}
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500">{fish.phone}</span>
                                    <span className={`font-mono font-bold ${fish.balance < (fish.low_balance_alert_threshold || 10) ? 'text-red-600' : 'text-green-600'}`}>
                                        {formatCurrency(fish.balance)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: DETAILS PANEL */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                    {selectedFish ? (
                        <>
                            {/* HEADER */}
                            <div className="p-6 border-b border-gray-200 flex justify-between items-start bg-gradient-to-r from-gray-50 to-white">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{selectedFish.name}</h2>
                                    <p className="text-sm text-gray-500 flex items-center mt-1">
                                        {selectedFish.package_name || 'No Package'} • 
                                        <a href={`#/portal/${selectedFish.id}`} target="_blank" rel="noreferrer" className="ml-2 text-indigo-600 hover:underline flex items-center">
                                            Open Portal <ExternalLink className="h-3 w-3 ml-1"/>
                                        </a>
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 uppercase font-bold">Wallet Balance</p>
                                        <p className={`text-2xl font-mono font-bold ${selectedFish.balance < 20 ? 'text-red-600' : 'text-gray-900'}`}>
                                            {formatCurrency(selectedFish.balance)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* TABS */}
                            <div className="flex border-b border-gray-200 px-6 gap-6">
                                <button onClick={() => setActiveTab('overview')} className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Overview</button>
                                <button onClick={() => setActiveTab('transactions')} className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'transactions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Transactions</button>
                                <button onClick={() => setActiveTab('topups')} className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'topups' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                    Top-up Requests 
                                    {selectedFish.topup_requests?.some(r => r.status === 'PENDING') && <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 rounded-full">!</span>}
                                </button>
                                <button onClick={() => setActiveTab('settings')} className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'settings' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Settings</button>
                            </div>

                            {/* CONTENT */}
                            <div className="p-6 flex-1 overflow-y-auto bg-gray-50/50">
                                
                                {activeTab === 'overview' && (
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                            <h3 className="font-bold text-gray-800 mb-4 flex items-center"><TrendingUp className="h-5 w-5 mr-2 text-indigo-600"/> Spend & Budget</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-gray-500">Total Spent</span>
                                                        <span className="font-bold">{formatCurrency(selectedFish.spent_amount)}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                                        <div className="bg-indigo-500 h-2 rounded-full" style={{width: '100%'}}></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-gray-500">Target Sales</span>
                                                        <span className="font-bold">{selectedFish.current_sales} / {selectedFish.target_sales}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                                        <div className="bg-green-500 h-2 rounded-full" style={{width: `${Math.min((selectedFish.current_sales/selectedFish.target_sales)*100, 100)}%`}}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                            <h3 className="font-bold text-gray-800 mb-4 flex items-center"><Layout className="h-5 w-5 mr-2 text-purple-600"/> Active Tasks</h3>
                                            <div className="space-y-2">
                                                {selectedFish.growth_tasks.filter(t => !t.is_completed).map(t => (
                                                    <div key={t.id} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                                        {t.title}
                                                    </div>
                                                ))}
                                                {selectedFish.growth_tasks.filter(t => !t.is_completed).length === 0 && <p className="text-gray-400 text-sm">No active tasks.</p>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'transactions' && (
                                    <div className="space-y-4">
                                        <div className="flex justify-end">
                                            <button onClick={() => setIsAddTxOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700 flex items-center">
                                                <Plus className="h-4 w-4 mr-2"/> Add Transaction
                                            </button>
                                        </div>
                                        
                                        {/* Add Transaction Form */}
                                        {isAddTxOpen && (
                                            <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-sm mb-4 animate-fade-in">
                                                <h4 className="font-bold text-sm text-indigo-800 mb-3">New Transaction</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                    <select 
                                                        className="border border-gray-300 rounded-md p-2 text-sm"
                                                        value={txType}
                                                        onChange={e => setTxType(e.target.value as any)}
                                                    >
                                                        <option value="AD_SPEND">Ad Spend (Deduct)</option>
                                                        <option value="SERVICE_CHARGE">Service Charge (Deduct)</option>
                                                        <option value="DEPOSIT">Deposit (Add)</option>
                                                        <option value="DEDUCT">Manual Deduct</option>
                                                    </select>
                                                    <input 
                                                        type="number" 
                                                        className="border border-gray-300 rounded-md p-2 text-sm"
                                                        placeholder="Amount ($)"
                                                        value={txAmount}
                                                        onChange={e => setTxAmount(parseFloat(e.target.value))}
                                                    />
                                                    <input 
                                                        type="text" 
                                                        className="border border-gray-300 rounded-md p-2 text-sm md:col-span-2"
                                                        placeholder="Description (e.g. Daily Ads)"
                                                        value={txDesc}
                                                        onChange={e => setTxDesc(e.target.value)}
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2 mt-3">
                                                    <button onClick={() => setIsAddTxOpen(false)} className="text-gray-500 text-sm font-medium hover:bg-gray-100 px-3 py-1.5 rounded">Cancel</button>
                                                    <button onClick={handleAddTransaction} className="bg-indigo-600 text-white text-sm font-bold px-4 py-1.5 rounded hover:bg-indigo-700">Save</button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-50 text-gray-500 font-bold">
                                                    <tr>
                                                        <th className="px-6 py-3">Date</th>
                                                        <th className="px-6 py-3">Type</th>
                                                        <th className="px-6 py-3">Description</th>
                                                        <th className="px-6 py-3 text-right">Amount</th>
                                                        <th className="px-6 py-3 text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {selectedFish.transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => (
                                                        <tr key={tx.id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-3 text-gray-500">{new Date(tx.date).toLocaleDateString()}</td>
                                                            <td className="px-6 py-3">
                                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                                                    tx.type === 'DEPOSIT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                                }`}>
                                                                    {tx.type}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-3 font-medium text-gray-800">{tx.description}</td>
                                                            <td className={`px-6 py-3 text-right font-mono font-bold ${tx.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}`}>
                                                                {tx.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                            </td>
                                                            <td className="px-6 py-3 text-right">
                                                                <button onClick={() => handleDeleteTransaction(tx.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                                                    <Trash2 className="h-4 w-4"/>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'topups' && (
                                    <div className="space-y-6">
                                        <h3 className="font-bold text-gray-800">Pending Requests</h3>
                                        <div className="space-y-4">
                                            {selectedFish.topup_requests?.filter(r => r.status === 'PENDING').map(req => (
                                                <div key={req.id} className="bg-amber-50 p-4 rounded-lg border border-amber-200 flex flex-col md:flex-row justify-between items-center gap-4">
                                                    <div>
                                                        <div className="font-bold text-amber-900 text-lg">{formatCurrency(req.amount)}</div>
                                                        <div className="text-sm text-amber-800">Via: {req.method_name} ({req.sender_number})</div>
                                                        <div className="text-xs text-amber-600 mt-1">{new Date(req.created_at).toLocaleString()}</div>
                                                    </div>
                                                    {req.screenshot_url && (
                                                        <button onClick={() => setPreviewImage(req.screenshot_url || '')} className="text-xs flex items-center text-blue-600 hover:underline">
                                                            <Layout className="h-3 w-3 mr-1"/> View Screenshot
                                                        </button>
                                                    )}
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleApproveTopUp(req)} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700">Approve</button>
                                                        <button onClick={() => handleRejectTopUp(req.id)} className="bg-red-500 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-red-600">Reject</button>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!selectedFish.topup_requests || !selectedFish.topup_requests.some(r => r.status === 'PENDING')) && (
                                                <p className="text-gray-400 text-sm">No pending requests.</p>
                                            )}
                                        </div>

                                        <h3 className="font-bold text-gray-800 pt-4 border-t border-gray-200">History</h3>
                                        <div className="opacity-100 space-y-2">
                                            {selectedFish.topup_requests?.filter(r => r.status !== 'PENDING').map(req => (
                                                <div key={req.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                                                    <div className="flex items-center gap-3">
                                                        {req.screenshot_url ? (
                                                            <img 
                                                                src={req.screenshot_url} 
                                                                alt="Proof" 
                                                                className="h-12 w-12 object-cover rounded-md border border-gray-200 cursor-pointer hover:opacity-80"
                                                                onClick={() => setPreviewImage(req.screenshot_url || '')}
                                                                title="Click to view"
                                                            />
                                                        ) : (
                                                            <div className="h-12 w-12 rounded-md bg-gray-200 flex items-center justify-center text-gray-400 text-xs">No Img</div>
                                                        )}
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${req.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{req.status}</span>
                                                                <span className="font-mono font-bold text-gray-700">{formatCurrency(req.amount)}</span>
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                {new Date(req.created_at).toLocaleString()}
                                                            </div>
                                                            <div className="text-[10px] text-gray-400 mt-0.5">
                                                                Via: {req.method_name} ({req.sender_number})
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleDeleteTopUp(req.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><Trash2 className="h-4 w-4"/></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'settings' && (
                                    <div className="space-y-6">
                                        <div className="bg-white p-5 rounded-xl border border-gray-200">
                                            <h3 className="font-bold text-gray-800 mb-4">Portal Configuration</h3>
                                            <div className="space-y-3">
                                                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                                                    <span className="text-sm font-medium text-gray-700">Show Wallet Balance to Client</span>
                                                    <div className={`w-10 h-5 rounded-full relative transition-colors ${selectedFish.portal_config.show_balance ? 'bg-green-500' : 'bg-gray-300'}`} onClick={() => handleTogglePortal('show_balance')}>
                                                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${selectedFish.portal_config.show_balance ? 'left-6' : 'left-1'}`}></div>
                                                    </div>
                                                </label>
                                                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                                                    <span className="text-sm font-medium text-gray-700">Show Transaction History</span>
                                                    <div className={`w-10 h-5 rounded-full relative transition-colors ${selectedFish.portal_config.show_history ? 'bg-green-500' : 'bg-gray-300'}`} onClick={() => handleTogglePortal('show_history')}>
                                                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${selectedFish.portal_config.show_history ? 'left-6' : 'left-1'}`}></div>
                                                    </div>
                                                </label>
                                                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                                                    <span className="text-sm font-medium text-gray-700">Allow Top-up Requests</span>
                                                    <div className={`w-10 h-5 rounded-full relative transition-colors ${selectedFish.portal_config.feature_flags?.allow_topup_request ? 'bg-green-500' : 'bg-gray-300'}`} onClick={() => handleTogglePortal('topup')}>
                                                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${selectedFish.portal_config.feature_flags?.allow_topup_request ? 'left-6' : 'left-1'}`}></div>
                                                    </div>
                                                </label>
                                                <label className="flex items-center justify-between p-3 bg-red-50 rounded-lg cursor-pointer border border-red-100">
                                                    <span className="text-sm font-bold text-red-700">Suspend Portal Access</span>
                                                    <div className={`w-10 h-5 rounded-full relative transition-colors ${selectedFish.portal_config.is_suspended ? 'bg-red-500' : 'bg-gray-300'}`} onClick={() => handleTogglePortal('is_suspended')}>
                                                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${selectedFish.portal_config.is_suspended ? 'left-6' : 'left-1'}`}></div>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                            <ShieldCheck className="h-16 w-16 mb-4 opacity-20"/>
                            <h2 className="text-xl font-bold text-gray-500">Select a Client</h2>
                            <p className="text-sm mt-2">Choose a Big Fish from the list to view details.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* PREVIEW IMAGE MODAL */}
            {previewImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4" onClick={() => setPreviewImage(null)}>
                    <div className="relative max-w-4xl w-full max-h-[90vh] flex justify-center">
                        <img src={previewImage} alt="Proof" className="max-w-full max-h-full rounded-lg shadow-2xl" />
                        <button onClick={() => setPreviewImage(null)} className="absolute -top-10 right-0 text-white hover:text-gray-300"><X className="h-8 w-8"/></button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BigFishPage;
