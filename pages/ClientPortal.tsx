import React, { useEffect, useState } from 'react';
// @ts-ignore
import { useParams } from 'react-router-dom';
import { mockService } from '../services/mockService';
import { BigFish, PaymentMethod, SystemSettings } from '../types';
import { DollarSign, Calendar, CheckCircle, ShieldCheck, Target, AlertTriangle, CreditCard, Lock, List, BarChart2, Download, Building, Smartphone, Copy, Check, Calculator, ChevronLeft, ChevronRight, Phone, Globe, Users } from 'lucide-react';

// --- REUSABLE PORTAL VIEW COMPONENT (Exported for Admin Preview) ---
export const PortalView: React.FC<{ client: BigFish, paymentMethods: PaymentMethod[] }> = ({ client, paymentMethods = [] }) => {
    // Local state for Ledger Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [globalSettings, setGlobalSettings] = useState<SystemSettings | null>(null);

    // --- WORK LOG PAGINATION ---
    const [logPage, setLogPage] = useState(1);
    const LOGS_PER_PAGE = 15;

    // --- GRAPH STATE ---
    const [graphMetric, setGraphMetric] = useState<'SALES' | 'MESSAGES'>('MESSAGES');
    // Default to last 7 days
    const defaultEnd = new Date();
    const defaultStart = new Date();
    defaultStart.setDate(defaultEnd.getDate() - 7);
    const [graphStartDate, setGraphStartDate] = useState(defaultStart.toISOString().slice(0, 10));
    const [graphEndDate, setGraphEndDate] = useState(defaultEnd.toISOString().slice(0, 10));

    // --- CALCULATOR STATES (Local to client view) ---
    // CPR
    const [cprSpend, setCprSpend] = useState(0);
    const [cprResults, setCprResults] = useState(0);
    // Currency
    const [usdAmount, setUsdAmount] = useState(0);
    const [exchangeRate, setExchangeRate] = useState(145);
    // Profit
    const [prodCost, setProdCost] = useState(0);
    const [salePrice, setSalePrice] = useState(0);
    const [adCost, setAdCost] = useState(0);
    const [delCost, setDelCost] = useState(100);
    const retCharge = 100; // Fixed default return charge for simplicity

    useEffect(() => {
        // Fetch global settings for support info
        mockService.getSystemSettings().then(setGlobalSettings);
    }, []);

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (!client) return null;

    // --- SUSPENDED STATE ---
    if (client.portal_config?.is_suspended) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-900 p-4 text-center font-inter">
                <Lock className="h-16 w-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold">Access Suspended</h1>
                <p className="text-gray-500 mt-2">Please contact your account manager for assistance.</p>
            </div>
        );
    }

    // Calculations
    const currentSales = client.current_sales || 0; 
    const targetSales = client.target_sales || 100;
    const mockSalesProgress = targetSales > 0 ? Math.min((currentSales / targetSales) * 100, 100) : 0;
    
    // Filtered Transactions for Ledger
    const filteredTx = (client.transactions || []).filter(tx => {
        if (startDate && new Date(tx.date) < new Date(startDate)) return false;
        if (endDate && new Date(tx.date) > new Date(endDate + 'T23:59:59')) return false;
        return true;
    });

    const recentTx = filteredTx.slice(0, 10);

    // Safe values
    const balance = client.balance || 0;
    const spent = client.spent_amount || 0;

    // Work Log Pagination Logic
    const allLogs = client.reports || [];
    const totalLogPages = Math.ceil(allLogs.length / LOGS_PER_PAGE);
    const displayedLogs = allLogs.slice((logPage - 1) * LOGS_PER_PAGE, logPage * LOGS_PER_PAGE);

    // --- GRAPH DATA GENERATION (DYNAMIC DATE RANGE) ---
    const generateGraphData = () => {
        const start = new Date(graphStartDate);
        const end = new Date(graphEndDate);
        const data = [];
        
        // Loop through each day from start to end
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }); // 25/10
            const isoStr = d.toISOString().slice(0, 10); // "2023-10-25"

            // Find transactions on this specific day
            const txsOnDay = (client.transactions || []).filter(tx => 
                tx.date.slice(0, 10) === isoStr && tx.type === 'AD_SPEND'
            );
            
            // Sum up metrics for that day
            const totalSpend = txsOnDay.reduce((sum, tx) => sum + (tx.amount || 0), 0);
            
            let resultCount = 0;
            if (graphMetric === 'SALES') {
                resultCount = txsOnDay.reduce((sum, tx) => {
                    return sum + (tx.metadata?.resultType === 'SALES' ? (tx.metadata.leads || 0) : 0);
                }, 0);
            } else {
                resultCount = txsOnDay.reduce((sum, tx) => {
                    return sum + (tx.metadata?.resultType !== 'SALES' ? (tx.metadata?.leads || 0) : 0);
                }, 0);
            }

            data.push({ 
                date: dateStr, 
                iso: isoStr, 
                spend: totalSpend, 
                value: resultCount 
            });
        }
        return data;
    };
    
    const graphData = generateGraphData();
    // Calculate max values for independent scaling
    const maxSpend = Math.max(...graphData.map(d => d.spend), 10); 
    const maxValue = Math.max(...graphData.map(d => d.value), 5);

    // Download CSV
    const handleDownloadLedger = () => {
        const dataToExport = filteredTx.map(tx => ({
            Date: new Date(tx.date).toLocaleDateString(),
            Type: tx.type,
            Description: tx.description,
            Amount: tx.amount,
            BalanceEffect: tx.type === 'DEPOSIT' ? '+' : '-'
        }));

        if (dataToExport.length === 0) return alert("No transactions to export.");

        const csvContent = [
            Object.keys(dataToExport[0]).join(','),
            ...dataToExport.map(row => Object.values(row).map(val => `"${val}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `statement_${client.name}_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Shared Calculator Config
    const showCPR = client.portal_config?.shared_calculators?.cpr;
    const showCurrency = client.portal_config?.shared_calculators?.currency;
    const showROI = client.portal_config?.shared_calculators?.roi;
    const showCalculators = showCPR || showCurrency || showROI;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-inter">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="text-2xl mr-3">🚀</span>
                        <h1 className="text-xl font-bold tracking-wider text-gray-900">Social Ads Expert <span className="text-indigo-600 font-normal">/ Portal</span></h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-gray-900">{client.name}</p>
                            <p className="text-xs text-gray-500">{client.package_name || 'Standard Plan'}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
                            {client.name?.charAt(0) || 'C'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Announcement Banner */}
            {client.portal_config?.announcement_title && (
                <div className="bg-orange-50 border-b border-orange-200 p-4 text-center">
                    <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600"/>
                        <span className="font-bold text-orange-800">{client.portal_config.announcement_title}:</span>
                        <span className="text-sm text-orange-700">{client.portal_config.announcement_message}</span>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                
                {/* 1. WALLET & STATS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Wallet Card (Conditional) */}
                    {client.portal_config?.show_balance ? (
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[180px] text-white">
                            <div className="absolute top-0 right-0 p-4 opacity-20"><CreditCard size={100} /></div>
                            <div>
                                <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Available Balance</p>
                                <h3 className="text-4xl font-mono font-bold mt-1">${balance.toFixed(2)}</h3>
                            </div>
                            <div className="mt-4">
                                {balance < (client.low_balance_alert_threshold || 10) && (
                                    <div className="inline-block bg-red-600 border border-red-400 text-white text-xs px-2 py-1 rounded animate-pulse font-bold">
                                        ⚠️ Low Balance
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // Fallback if hidden
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm relative overflow-hidden flex flex-col justify-center items-center text-center">
                            <ShieldCheck className="h-12 w-12 text-gray-400 mb-2"/>
                            <p className="text-gray-500 text-sm">Wallet Balance Hidden</p>
                        </div>
                    )}

                    {/* Spend Meter */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5"><DollarSign size={64} className="text-gray-900"/></div>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-wide">Total Spend</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">${spent.toFixed(2)}</h3>
                        <p className="text-xs text-gray-400 mt-2">Lifetime Ad Budget Used</p>
                    </div>

                    {/* Target Meter */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5"><Target size={64} className="text-gray-900"/></div>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-wide">Sales Goal</p>
                        <div className="flex items-end gap-2">
                             <h3 className="text-3xl font-bold text-gray-900 mt-1">{currentSales}</h3>
                             <span className="text-gray-400 mb-1">/ {targetSales}</span>
                        </div>
                        <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${mockSalesProgress}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* 2. DYNAMIC GRAPH */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-hidden">
                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                         <div>
                             <h3 className="font-bold text-gray-900 text-lg flex items-center">
                                 <BarChart2 className="mr-2 text-indigo-600"/> Ad Performance
                             </h3>
                             <p className="text-xs text-gray-500 mt-1">Comparison: Money Spent vs Results Generated</p>
                         </div>
                         
                         <div className="flex flex-wrap items-center gap-3">
                             {/* Metric Toggle */}
                             <div className="bg-gray-100 rounded p-1 flex border border-gray-200">
                                 <button 
                                    onClick={() => setGraphMetric('MESSAGES')}
                                    className={`text-xs px-3 py-1.5 rounded font-bold transition-colors ${graphMetric === 'MESSAGES' ? 'bg-white text-teal-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                                 >
                                     Messages
                                 </button>
                                 <button 
                                    onClick={() => setGraphMetric('SALES')}
                                    className={`text-xs px-3 py-1.5 rounded font-bold transition-colors ${graphMetric === 'SALES' ? 'bg-white text-teal-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                                 >
                                     Sales
                                 </button>
                             </div>

                             {/* Date Range */}
                             <div className="flex items-center gap-2 bg-gray-100 rounded p-1 px-2 border border-gray-200">
                                 <Calendar className="h-3 w-3 text-gray-500" />
                                 <input 
                                    type="date" 
                                    className="bg-transparent border-none text-xs text-gray-700 focus:ring-0 w-24 p-0 font-medium"
                                    value={graphStartDate}
                                    onChange={e => setGraphStartDate(e.target.value)}
                                 />
                                 <span className="text-gray-400 text-xs">-</span>
                                 <input 
                                    type="date" 
                                    className="bg-transparent border-none text-xs text-gray-700 focus:ring-0 w-24 p-0 font-medium"
                                    value={graphEndDate}
                                    onChange={e => setGraphEndDate(e.target.value)}
                                 />
                             </div>
                         </div>
                     </div>

                     {/* Legend */}
                     <div className="flex gap-6 mb-6 justify-end text-xs font-medium px-4">
                         <div className="flex items-center gap-2">
                             <span className="w-3 h-3 bg-amber-400 rounded-sm"></span>
                             <span className="text-gray-600">Expenses (USD)</span>
                         </div>
                         <div className="flex items-center gap-2">
                             <span className="w-3 h-3 bg-teal-500 rounded-sm"></span>
                             <span className="text-gray-600">{graphMetric === 'SALES' ? 'Sales' : 'Messages'} (Count)</span>
                         </div>
                     </div>

                     {/* Graph Area - DUAL BAR DESIGN */}
                     <div className="h-80 flex items-end gap-2 justify-between px-2 overflow-x-auto pb-4 relative pt-12">
                         {/* Background Grid Lines */}
                         <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-50 pt-12 pb-8 px-2">
                             <div className="border-t border-dashed border-gray-200 w-full"></div>
                             <div className="border-t border-dashed border-gray-200 w-full"></div>
                             <div className="border-t border-dashed border-gray-200 w-full"></div>
                             <div className="border-t border-dashed border-gray-200 w-full"></div>
                             <div className="border-t border-dashed border-gray-200 w-full"></div>
                         </div>

                         {graphData.length === 0 ? (
                             <div className="w-full text-center text-gray-400 py-12">No data for selected range.</div>
                         ) : (
                             graphData.map((d, i) => {
                                 // Independent Scaling: Normalize both to 100% of their respective max
                                 const spendHeight = (d.spend / maxSpend) * 100;
                                 const valueHeight = (d.value / maxValue) * 100;
                                 
                                 return (
                                     <div key={i} className="flex-1 flex flex-col justify-end items-center gap-2 group relative min-w-[50px] z-10 h-full">
                                         
                                         {/* Background Track for Day */}
                                         <div className="absolute inset-x-1 top-0 bottom-0 bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                                         <div className="flex items-end gap-1.5 h-full w-full justify-center px-1 pb-6">
                                             
                                             {/* Bar 1: Results (Teal) */}
                                             <div 
                                                className="relative w-3 md:w-5 bg-gradient-to-t from-teal-500 to-teal-400 rounded-t-sm transition-all duration-700 ease-out hover:brightness-110 shadow-sm" 
                                                style={{ height: `${Math.max(valueHeight, 5)}%` }} // Min 5% height for visibility
                                             >
                                                 {/* Floating Label */}
                                                 <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-teal-600 opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-y-1 bg-white px-2 py-0.5 rounded border border-gray-200 shadow-lg whitespace-nowrap z-30">
                                                     {d.value} {graphMetric === 'SALES' ? 'Sales' : 'Msgs'}
                                                 </span>
                                             </div>

                                             {/* Bar 2: Expenses (Amber) */}
                                             <div 
                                                className="relative w-3 md:w-5 bg-gradient-to-t from-amber-500 to-amber-300 rounded-t-sm transition-all duration-700 ease-out hover:brightness-110 shadow-sm" 
                                                style={{ height: `${Math.max(spendHeight, 5)}%` }} // Min 5% height for visibility
                                             >
                                                  {/* Floating Label */}
                                                 <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-amber-600 opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-y-1 bg-white px-2 py-0.5 rounded border border-gray-200 shadow-lg whitespace-nowrap z-30">
                                                     ${d.spend}
                                                 </span>
                                             </div>
                                         </div>
                                         
                                         {/* X Axis Label */}
                                         <div className="absolute bottom-0 text-center w-full border-t border-gray-200 pt-2">
                                             <span className="text-[10px] text-gray-500 font-mono block">{d.date}</span>
                                         </div>
                                     </div>
                                 )
                             })
                         )}
                     </div>
                </div>

                {/* 3. TOOLS & CALCULATORS (NEW) */}
                {showCalculators && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 text-lg mb-6 flex items-center">
                            <Calculator className="mr-2 text-indigo-600"/> Tools & Calculators
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            
                            {/* CPR */}
                            {showCPR && (
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h4 className="text-sm font-bold text-indigo-600 mb-4">Cost Per Result (CPR)</h4>
                                    <div className="space-y-3">
                                        <input type="number" placeholder="Spend ($)" className="w-full bg-white border border-gray-300 rounded p-2 text-xs" value={cprSpend || ''} onChange={e => setCprSpend(parseFloat(e.target.value))} />
                                        <input type="number" placeholder="Results" className="w-full bg-white border border-gray-300 rounded p-2 text-xs" value={cprResults || ''} onChange={e => setCprResults(parseFloat(e.target.value))} />
                                        <div className="text-center font-bold text-xl text-gray-800 pt-2">
                                            ${cprResults > 0 ? (cprSpend / cprResults).toFixed(2) : '0.00'} <span className="text-xs text-gray-500 font-normal">/ result</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Currency */}
                            {showCurrency && (
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h4 className="text-sm font-bold text-green-600 mb-4">USD to BDT</h4>
                                    <div className="space-y-3">
                                        <input type="number" placeholder="USD ($)" className="w-full bg-white border border-gray-300 rounded p-2 text-xs" value={usdAmount || ''} onChange={e => setUsdAmount(parseFloat(e.target.value))} />
                                        <input type="number" placeholder="Rate" className="w-full bg-white border border-gray-300 rounded p-2 text-xs" value={exchangeRate} onChange={e => setExchangeRate(parseFloat(e.target.value))} />
                                        <div className="text-center font-bold text-xl text-gray-800 pt-2">
                                            ৳ {(usdAmount * exchangeRate).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Profit */}
                            {showROI && (
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h4 className="text-sm font-bold text-purple-600 mb-4">Profit Calc</h4>
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <input type="number" placeholder="Buy Price" className="bg-white border border-gray-300 rounded p-1.5 text-xs" value={prodCost || ''} onChange={e => setProdCost(parseFloat(e.target.value))} />
                                        <input type="number" placeholder="Sell Price" className="bg-white border border-gray-300 rounded p-1.5 text-xs" value={salePrice || ''} onChange={e => setSalePrice(parseFloat(e.target.value))} />
                                        <input type="number" placeholder="Ad Cost" className="bg-white border border-gray-300 rounded p-1.5 text-xs" value={adCost || ''} onChange={e => setAdCost(parseFloat(e.target.value))} />
                                        <input type="number" placeholder="Del. Cost" className="bg-white border border-gray-300 rounded p-1.5 text-xs" value={delCost} onChange={e => setDelCost(parseFloat(e.target.value))} />
                                    </div>
                                    <div className="text-center text-xs text-gray-500">
                                        Profit: <span className="font-bold text-green-600">{(salePrice - prodCost - adCost - delCost).toFixed(0)}</span> | 
                                        Loss (Ret): <span className="font-bold text-red-500">{(adCost + retCharge).toFixed(0)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* LEFT COL: GROWTH & LEDGER */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* GROWTH CHECKLIST */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                                <h3 className="font-bold text-gray-900 text-lg flex items-center"><CheckCircle className="mr-2 text-indigo-600"/> Project Tasks & Milestones</h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {client.growth_tasks?.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400">No tasks active.</div>
                                ) : (
                                    client.growth_tasks?.map(task => (
                                        <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${task.is_completed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                                                    {task.is_completed && <CheckCircle size={14} className="text-white"/>}
                                                </div>
                                                <div>
                                                    <p className={`text-sm ${task.is_completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{task.title}</p>
                                                    {task.due_date && <p className="text-xs text-gray-400">Due: {task.due_date}</p>}
                                                </div>
                                            </div>
                                            {task.is_completed && <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">DONE</span>}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* RECENT TRANSACTIONS (Conditional) */}
                        {client.portal_config?.show_history && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
                                    <h3 className="font-bold text-gray-900 text-lg flex items-center"><List className="mr-2 text-indigo-600"/> Recent Transactions</h3>
                                    
                                    {/* FILTERS */}
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <div className="relative">
                                            <Calendar className="h-4 w-4 absolute left-2 top-2 text-gray-400"/>
                                            <input 
                                                type="date" 
                                                className="bg-white border border-gray-300 text-gray-700 text-xs rounded pl-8 pr-2 py-1 focus:ring-indigo-500 focus:border-indigo-500"
                                                value={startDate}
                                                onChange={e => setStartDate(e.target.value)}
                                            />
                                        </div>
                                        <span className="text-gray-400">-</span>
                                        <div className="relative">
                                            <Calendar className="h-4 w-4 absolute left-2 top-2 text-gray-400"/>
                                            <input 
                                                type="date" 
                                                className="bg-white border border-gray-300 text-gray-700 text-xs rounded pl-8 pr-2 py-1 focus:ring-indigo-500 focus:border-indigo-500"
                                                value={endDate}
                                                onChange={e => setEndDate(e.target.value)}
                                            />
                                        </div>
                                        <button 
                                            onClick={handleDownloadLedger}
                                            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 p-1.5 rounded" 
                                            title="Download CSV"
                                        >
                                            <Download className="h-4 w-4"/>
                                        </button>
                                    </div>
                                </div>
                                <table className="w-full text-sm text-left text-gray-600">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3">Description</th>
                                            <th className="px-6 py-3 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {recentTx.length === 0 && (
                                            <tr><td colSpan={3} className="p-6 text-center">No transactions found in this period.</td></tr>
                                        )}
                                        {recentTx.map(tx => (
                                            <tr key={tx.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-3">{new Date(tx.date).toLocaleDateString()}</td>
                                                <td className="px-6 py-3 flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${tx.type === 'DEPOSIT' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                    {tx.description}
                                                </td>
                                                <td className={`px-6 py-3 text-right font-mono ${tx.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-500'}`}>
                                                    {tx.type === 'DEPOSIT' ? '+' : '-'}${(tx.amount || 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COL: WORK LOG & BANK INFO */}
                    <div className="lg:col-span-1 space-y-6">
                         
                         {/* DYNAMIC SUPPORT SECTION (Now Using Global Settings) */}
                         <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-6 text-center">
                            <h4 className="text-indigo-800 font-bold mb-2 flex justify-center items-center">
                                <Users className="h-5 w-5 mr-2"/> Need Support?
                            </h4>
                            <p className="text-sm text-indigo-600 mb-4">Contact your account manager directly.</p>
                            
                            <div className="space-y-2">
                                {/* Support Phone */}
                                {globalSettings?.portal_support_phone && (
                                    <a href={`tel:${globalSettings.portal_support_phone}`} className="flex items-center justify-center p-2 bg-white rounded border border-indigo-100 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                                        <Phone className="h-4 w-4 mr-2"/> {globalSettings.portal_support_phone}
                                    </a>
                                )}
                                
                                {/* Support Website */}
                                {globalSettings?.portal_support_url && (
                                    <a href={globalSettings.portal_support_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center p-2 bg-white rounded border border-indigo-100 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                                        <Globe className="h-4 w-4 mr-2"/> Visit Website
                                    </a>
                                )}

                                {/* FB Group */}
                                {globalSettings?.portal_fb_group && (
                                    <a href={globalSettings.portal_fb_group} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center p-2 bg-white rounded border border-indigo-100 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                                        <Users className="h-4 w-4 mr-2"/> Join FB Group
                                    </a>
                                )}

                                {/* Fallback if no details set */}
                                {(!globalSettings?.portal_support_phone && !globalSettings?.portal_support_url && !globalSettings?.portal_fb_group) && (
                                    <p className="text-xs text-indigo-400 italic">No contact details configured.</p>
                                )}
                            </div>
                         </div>

                         {/* Daily Work Log (WITH PAGINATION) */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-4 bg-gray-50/80 sticky top-0 backdrop-blur-md border-b border-gray-200 flex justify-between items-center">
                                <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wider">Daily Work Log</h3>
                                <span className="text-xs text-gray-400">Page {logPage} of {totalLogPages || 1}</span>
                            </div>
                             <div className="p-4 space-y-4 min-h-[200px]">
                                {displayedLogs.length === 0 && <p className="text-gray-400 text-sm">No logs found.</p>}
                                {displayedLogs.map(report => (
                                    <div key={report.id} className="relative pl-4 border-l-2 border-gray-300">
                                        <div className="mb-1 text-xs text-indigo-600 font-bold">{new Date(report.date).toLocaleDateString()}</div>
                                        <p className="text-sm text-gray-700">{report.task}</p>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Pagination Controls */}
                            {allLogs.length > LOGS_PER_PAGE && (
                                <div className="bg-gray-50 p-3 border-t border-gray-200 flex justify-between items-center">
                                    <button 
                                        disabled={logPage === 1}
                                        onClick={() => setLogPage(p => p - 1)}
                                        className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="h-4 w-4"/>
                                    </button>
                                    <span className="text-xs text-gray-500">{displayedLogs.length} items shown</span>
                                    <button 
                                        disabled={logPage === totalLogPages}
                                        onClick={() => setLogPage(p => p + 1)}
                                        className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="h-4 w-4"/>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Payment Info */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center"><ShieldCheck className="mr-2 text-indigo-600"/> Make a Payment</h3>
                            <div className="space-y-4">
                                {paymentMethods.map(pm => {
                                    if (pm.type === 'BANK') {
                                        return (
                                            <div key={pm.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-indigo-300 transition-colors">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <Building className="h-5 w-5 text-indigo-600"/>
                                                        <span className="font-bold text-gray-800">{pm.provider_name}</span>
                                                    </div>
                                                    <span className="text-[10px] uppercase bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">Bank Transfer</span>
                                                </div>
                                                <div className="space-y-2 text-sm text-gray-600">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400 text-xs">Account Name</span>
                                                        <span>{pm.account_name}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-white border border-gray-200 p-2 rounded">
                                                        <span className="text-gray-400 text-xs">A/C Number</span>
                                                        <div className="flex items-center">
                                                            <span className="font-mono text-gray-800 mr-2 font-bold">{pm.account_number}</span>
                                                            <button onClick={() => handleCopy(pm.id + '_ac', pm.account_number)} className="text-gray-400 hover:text-indigo-600">
                                                                {copiedId === pm.id + '_ac' ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400 text-xs">Branch</span>
                                                        <span>{pm.branch_name}</span>
                                                    </div>
                                                    {pm.routing_number && (
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-400 text-xs">Routing No</span>
                                                            <div className="flex items-center gap-2">
                                                                <span>{pm.routing_number}</span>
                                                                <button onClick={() => handleCopy(pm.id + '_rt', pm.routing_number!)} className="text-gray-400 hover:text-indigo-600">
                                                                    {copiedId === pm.id + '_rt' ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    } else {
                                        return (
                                            <div key={pm.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-pink-300 transition-colors">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <Smartphone className="h-5 w-5 text-pink-600"/>
                                                        <span className="font-bold text-gray-800">{pm.provider_name}</span>
                                                    </div>
                                                    <span className="text-[10px] uppercase bg-pink-100 text-pink-800 px-2 py-0.5 rounded">{pm.mobile_type}</span>
                                                </div>
                                                <div className="bg-white border border-gray-200 p-3 rounded flex justify-between items-center">
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">{pm.instruction}</p>
                                                        <p className="font-mono text-lg text-gray-900 font-bold">{pm.account_number}</p>
                                                    </div>
                                                    <button onClick={() => handleCopy(pm.id, pm.account_number)} className="p-2 hover:bg-gray-100 rounded text-gray-400 hover:text-indigo-600">
                                                        {copiedId === pm.id ? <Check size={18} className="text-green-500"/> : <Copy size={18}/>}
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    }
                                })}
                                {paymentMethods.length === 0 && (
                                    <p className="text-gray-400 text-sm text-center">No payment methods added.</p>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

// --- DEFAULT PAGE COMPONENT (Fetches Data) ---
const ClientPortal: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [client, setClient] = useState<BigFish | null>(null);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if(id) {
            Promise.all([
                mockService.getBigFishById(id),
                mockService.getPaymentMethods()
            ]).then(([c, pm]) => {
                setClient(c || null);
                setPaymentMethods(pm);
                setLoading(false);
            });
        }
    }, [id]);

    if(loading) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-900 font-inter">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-500 text-sm">Loading secure portal...</p>
        </div>
    );
    
    if(!client) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-900 p-4 text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Portal Link</h1>
            <p className="text-gray-500">The link you followed may be incorrect, expired, or the client record was removed.</p>
        </div>
    );

    return <PortalView client={client} paymentMethods={paymentMethods} />;
};

export default ClientPortal;