
import React, { useState, useEffect } from 'react';
// Correcting imports to point to root directory (../../)
import { mockService } from '../../services/mockService';
import { BigFish, CampaignRecord } from '../../types';
import { Search, Plus, Trash2, Calendar, DollarSign, BarChart2, Users, Target, TrendingUp, CheckCircle, X, ChevronRight, Filter } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

const BigFishPage: React.FC = () => {
    const { formatCurrency } = useCurrency();
    const [allFish, setAllFish] = useState<BigFish[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFish, setSelectedFish] = useState<BigFish | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Campaign Entry State
    const [campStartDateInput, setCampStartDateInput] = useState(new Date().toISOString().slice(0, 10));
    const [campEndDateInput, setCampEndDateInput] = useState('');
    const [campSpend, setCampSpend] = useState<number>(0);
    const [campRealSpend, setCampRealSpend] = useState<number>(0);
    const [campBuyingRate, setCampBuyingRate] = useState<number>(130);
    const [campClientRate, setCampClientRate] = useState<number>(145);
    const [campImpr, setCampImpr] = useState<number>(0);
    const [campReach, setCampReach] = useState<number>(0);
    const [campClicks, setCampClicks] = useState<number>(0);
    const [campResultType, setCampResultType] = useState<'MESSAGES' | 'SALES'>('MESSAGES');
    const [campResults, setCampResults] = useState<number>(0);
    const [campProdPrice, setCampProdPrice] = useState<number>(0);
    const [campProdCost, setCampProdCost] = useState<number>(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const fish = await mockService.getBigFish();
        setAllFish(fish);
        setLoading(false);
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

        // Track sales locally to prevent race condition
        let latestSalesCount = selectedFish.current_sales || 0;

        if (campResultType === 'SALES') {
            latestSalesCount = (selectedFish.current_sales || 0) + campResults;
            await mockService.updateTargets(selectedFish.id, selectedFish.target_sales, latestSalesCount);
        }

        const updatedFish = await mockService.addCampaignRecord(selectedFish.id, record as any);
        
        // Reset form
        setCampSpend(0); setCampRealSpend(0); setCampImpr(0); setCampReach(0); setCampClicks(0); setCampResults(0);
        setCampProdPrice(0); setCampProdCost(0);
        
        alert(`সাফল্যের সাথে এন্ট্রি হয়েছে! ক্লায়েন্ট ব্যালেন্স থেকে $${campSpend} কাটা হয়েছে।`);
        
        if (updatedFish) {
            // Force the updated sales count into the state immediately
            const finalFish = { ...updatedFish, current_sales: latestSalesCount };
            setSelectedFish(finalFish);
            setAllFish(prev => prev.map(f => f.id === finalFish.id ? finalFish : f));
        } else {
            loadData();
        }
    };

    const filteredFish = allFish.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading) return <div className="p-8 text-center text-gray-500">Loading clients...</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">🐟 Big Fish Clients</h1>
                    <p className="text-sm text-gray-500">Manage VIP clients, campaign records, and balances.</p>
                </div>
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search clients..." 
                        className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LIST */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 font-bold text-gray-700">Client List</div>
                    <div className="flex-1 overflow-y-auto">
                        {filteredFish.map(fish => (
                            <div 
                                key={fish.id}
                                onClick={() => setSelectedFish(fish)}
                                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedFish?.id === fish.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-900">{fish.name}</h3>
                                        <p className="text-xs text-gray-500">{fish.phone}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${fish.balance < fish.low_balance_alert_threshold ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {formatCurrency(fish.balance)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* DETAILS & FORM */}
                <div className="lg:col-span-2 space-y-6">
                    {selectedFish ? (
                        <>
                            {/* Stats Card */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{selectedFish.name}</h2>
                                        <p className="text-sm text-gray-500">{selectedFish.package_name}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400 uppercase">Balance</p>
                                            <p className="text-2xl font-bold text-indigo-600">{formatCurrency(selectedFish.balance)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                                        <p className="text-xs text-gray-500 uppercase">Total Spent</p>
                                        <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedFish.spent_amount)}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                                        <p className="text-xs text-gray-500 uppercase">Sales Target</p>
                                        <p className="text-lg font-bold text-gray-900">{selectedFish.current_sales} / {selectedFish.target_sales}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                                        <p className="text-xs text-gray-500 uppercase">Status</p>
                                        <span className="text-sm font-bold text-green-600">{selectedFish.status}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Add Campaign Record Form */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                                    <Plus className="h-5 w-5 mr-2 text-indigo-600"/> Add Daily Report / Campaign Record
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                                        <input type="date" className="w-full border border-gray-300 rounded p-2 text-sm" value={campStartDateInput} onChange={e => setCampStartDateInput(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Result Type</label>
                                        <select className="w-full border border-gray-300 rounded p-2 text-sm" value={campResultType} onChange={e => setCampResultType(e.target.value as any)}>
                                            <option value="MESSAGES">Messages</option>
                                            <option value="SALES">Sales</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Client Bill ($)</label>
                                        <input type="number" className="w-full border border-gray-300 rounded p-2 text-sm font-bold text-indigo-600" value={campSpend || ''} onChange={e => setCampSpend(parseFloat(e.target.value))} placeholder="0.00" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Real Cost ($)</label>
                                        <input type="number" className="w-full border border-gray-300 rounded p-2 text-sm" value={campRealSpend || ''} onChange={e => setCampRealSpend(parseFloat(e.target.value))} placeholder="Optional" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Buy Rate (BDT)</label>
                                        <input type="number" className="w-full border border-gray-300 rounded p-2 text-sm" value={campBuyingRate} onChange={e => setCampBuyingRate(parseFloat(e.target.value))} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Charge Rate</label>
                                        <input type="number" className="w-full border border-gray-300 rounded p-2 text-sm" value={campClientRate} onChange={e => setCampClientRate(parseFloat(e.target.value))} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Results (Count)</label>
                                        <input type="number" className="w-full border border-gray-300 rounded p-2 text-sm" value={campResults || ''} onChange={e => setCampResults(parseFloat(e.target.value))} placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Impressions</label>
                                        <input type="number" className="w-full border border-gray-300 rounded p-2 text-sm" value={campImpr || ''} onChange={e => setCampImpr(parseFloat(e.target.value))} placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reach</label>
                                        <input type="number" className="w-full border border-gray-300 rounded p-2 text-sm" value={campReach || ''} onChange={e => setCampReach(parseFloat(e.target.value))} placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Clicks</label>
                                        <input type="number" className="w-full border border-gray-300 rounded p-2 text-sm" value={campClicks || ''} onChange={e => setCampClicks(parseFloat(e.target.value))} placeholder="0" />
                                    </div>
                                </div>

                                {campResultType === 'SALES' && (
                                    <div className="grid grid-cols-2 gap-4 mb-4 bg-green-50 p-3 rounded border border-green-100">
                                        <div>
                                            <label className="block text-xs font-bold text-green-700 uppercase mb-1">Product Price (BDT)</label>
                                            <input type="number" className="w-full border border-green-300 rounded p-2 text-sm" value={campProdPrice || ''} onChange={e => setCampProdPrice(parseFloat(e.target.value))} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-green-700 uppercase mb-1">Product Cost (BDT)</label>
                                            <input type="number" className="w-full border border-green-300 rounded p-2 text-sm" value={campProdCost || ''} onChange={e => setCampProdCost(parseFloat(e.target.value))} />
                                        </div>
                                    </div>
                                )}

                                <button onClick={handleCampaignEntry} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                                    Add Record & Deduct Balance
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-white rounded-xl border border-gray-200 p-10">
                            <Users className="h-16 w-16 mb-4 text-gray-200" />
                            <p>Select a client to view details and add records.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BigFishPage;
    