
import React, { useEffect, useState, useRef } from 'react';
// @ts-ignore
import { useParams } from 'react-router-dom';
import { mockService } from '../services/mockService';
import { BigFish, PaymentMethod, SystemSettings } from '../types';
import { DollarSign, Calendar, CheckCircle, ShieldCheck, Target, AlertTriangle, CreditCard, Lock, List, BarChart2, Download, Building, Smartphone, Copy, Check, Calculator, ChevronLeft, ChevronRight, Phone, Globe, Users, PlusCircle, UploadCloud, X, MessageCircle, ShoppingBag, TrendingUp, Table, Filter, Clock } from 'lucide-react';

// --- HELPER: CSS BAR CHART COMPONENT ---
const SimpleChart = ({ data, colorClass, labelKey, valueKey, valuePrefix = '', valueSuffix = '' }: any) => {
    if (!data || data.length === 0) return <div className="h-48 flex items-center justify-center text-gray-400 text-xs">No data for graph</div>;

    const maxValue = Math.max(...data.map((d: any) => d[valueKey]), 1);

    return (
        <div className="h-56 flex items-end justify-between gap-2 pt-8 pb-2 px-2">
            {data.map((item: any, idx: number) => {
                const height = (item[valueKey] / maxValue) * 100;
                return (
                    <div key={idx} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                        {/* Tooltip */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {item[labelKey]}: {valuePrefix}{item[valueKey].toLocaleString()}{valueSuffix}
                        </div>
                        {/* Bar */}
                        <div 
                            className={`w-full max-w-[40px] rounded-t-sm transition-all duration-500 hover:opacity-80 relative ${colorClass}`}
                            style={{ height: `${Math.max(height, 5)}%` }}
                        >
                            {/* Value inside bar if tall enough */}
                            {height > 20 && (
                                <span className="absolute bottom-2 left-0 right-0 text-center text-[9px] text-white/90 font-bold overflow-hidden">
                                    {item[valueKey]}
                                </span>
                            )}
                        </div>
                        {/* Label */}
                        <span className="text-[9px] text-gray-500 mt-2 truncate w-full text-center">
                            {new Date(item[labelKey]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

// --- REUSABLE PORTAL VIEW COMPONENT (Exported for Admin Preview) ---
export const PortalView: React.FC<{ client: BigFish, paymentMethods: PaymentMethod[] }> = ({ client, paymentMethods = [] }) => {
    // Local state for Ledger Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [globalSettings, setGlobalSettings] = useState<SystemSettings | null>(null);

    // --- REPORT FILTERS STATE ---
    // Default: Last 30 Days
    const [reportRange, setReportRange] = useState<'30_DAYS' | 'THIS_MONTH' | 'CUSTOM'>('30_DAYS');
    const [reportStart, setReportStart] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().slice(0, 10);
    });
    const [reportEnd, setReportEnd] = useState(() => new Date().toISOString().slice(0, 10));
    
    // --- VIEW TOGGLES ---
    const [msgView, setMsgView] = useState<'TABLE' | 'GRAPH'>('TABLE');
    const [salesView, setSalesView] = useState<'TABLE' | 'GRAPH'>('TABLE');
    const [profitView, setProfitView] = useState<'TABLE' | 'GRAPH'>('TABLE');

    // --- TOP UP STATE ---
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState<number>(0);
    const [topUpMethod, setTopUpMethod] = useState('');
    const [topUpSender, setTopUpSender] = useState('');
    const [topUpImage, setTopUpImage] = useState<string | null>(null);
    const [isSubmittingTopUp, setIsSubmittingTopUp] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- WORK LOG PAGINATION ---
    const [logPage, setLogPage] = useState(1);
    const LOGS_PER_PAGE = 15;

    // --- HISTORY PAGINATION ---
    const [historyPage, setHistoryPage] = useState(1);
    const HISTORY_PER_PAGE = 20;

    // --- CALCULATOR STATES (Local to client view) ---
    const [cprSpend, setCprSpend] = useState(0);
    const [cprResults, setCprResults] = useState(0);
    const [usdAmount, setUsdAmount] = useState(0);
    const [exchangeRate, setExchangeRate] = useState(145);
    const [prodCost, setProdCost] = useState(0);
    const [salePrice, setSalePrice] = useState(0);
    const [adCost, setAdCost] = useState(0);
    const [delCost, setDelCost] = useState(100);

    useEffect(() => {
        // Fetch global settings for support info
        mockService.getSystemSettings().then(setGlobalSettings);
    }, [client]);

    // Handle Report Range Changes
    useEffect(() => {
        const now = new Date();
        let start = new Date();
        let end = new Date();

        if (reportRange === '30_DAYS') {
            start.setDate(now.getDate() - 30);
        } else if (reportRange === 'THIS_MONTH') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
        } else {
            // Custom: retain manual selection
            return; 
        }
        setReportStart(start.toISOString().slice(0, 10));
        setReportEnd(end.toISOString().slice(0, 10));
    }, [reportRange]);

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // --- TOP UP LOGIC (IMPROVED COMPRESSION) ---
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Basic size check (5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert("File is too large. Please upload an image smaller than 5MB.");
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Stronger Compression: Max Width 600px
                    const maxWidth = 600; 
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = Math.round(height * (maxWidth / width));
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    
                    ctx?.drawImage(img, 0, 0, width, height);
                    
                    // Reduced Quality to 0.6 (60%)
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.6); 
                    setTopUpImage(dataUrl);
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const submitTopUp = async () => {
        if (!topUpAmount || !topUpMethod || !topUpSender || !topUpImage) {
            return alert("Please fill all fields and upload a screenshot.");
        }
        
        setIsSubmittingTopUp(true);
        try {
            await mockService.createTopUpRequest({
                client_id: client.id,
                client_name: client.name,
                amount: topUpAmount,
                method_name: topUpMethod,
                sender_number: topUpSender,
                screenshot_url: topUpImage
            });
            setIsTopUpOpen(false);
            setTopUpAmount(0); setTopUpSender(''); setTopUpImage(null);
            alert("✅ Top-up request submitted successfully! Your balance will update after admin approval.");
        } catch (e: any) {
            console.error(e);
            alert("❌ Failed to submit request. Please ensure the image is not too large or check your internet connection.");
        } finally {
            setIsSubmittingTopUp(false);
        }
    };

    if (!client) return null;

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
    
    // Filtered Transactions
    const allTransactions = client.transactions || [];
    const sortedTransactions = [...allTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const filteredTx = sortedTransactions.filter(tx => {
        if (startDate && new Date(tx.date) < new Date(startDate)) return false;
        if (endDate && new Date(tx.date) > new Date(endDate + 'T23:59:59')) return false;
        return true;
    });

    const totalHistoryPages = Math.ceil(filteredTx.length / HISTORY_PER_PAGE);
    const displayedTx = filteredTx.slice((historyPage - 1) * HISTORY_PER_PAGE, historyPage * HISTORY_PER_PAGE);

    const balance = client.balance || 0;
    const spent = client.spent_amount || 0;

    // Work Log Pagination
    const allLogs = client.reports || [];
    const totalLogPages = Math.ceil(allLogs.length / LOGS_PER_PAGE);
    const displayedLogs = allLogs.slice((logPage - 1) * LOGS_PER_PAGE, logPage * LOGS_PER_PAGE);

    // --- REPORT DATA FILTERING ---
    const allRecords = Array.isArray(client.campaign_records) ? client.campaign_records : [];
    const filteredRecords = allRecords.filter(rec => {
        const recDate = new Date(rec.start_date);
        const s = new Date(reportStart);
        const e = new Date(reportEnd + 'T23:59:59');
        return recDate >= s && recDate <= e;
    });

    const messageCampaigns = filteredRecords.filter(r => r.result_type === 'MESSAGES');
    const salesCampaigns = filteredRecords.filter(r => r.result_type === 'SALES');

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

    // Flags
    const showCPR = client.portal_config?.shared_calculators?.cpr;
    const showCurrency = client.portal_config?.shared_calculators?.currency;
    const showROI = client.portal_config?.shared_calculators?.roi;
    const showCalculators = showCPR || showCurrency || showROI;
    const showTopUp = client.portal_config?.feature_flags?.allow_topup_request;

    // Visibility Flags
    const flags: any = client.portal_config?.feature_flags || {};
    const showMessageReport = flags.show_message_report !== false; 
    const showSalesReport = flags.show_sales_report !== false;
    const showProfitLossReport = flags.show_profit_loss_report === true; 
    const showPaymentMethods = flags.show_payment_methods !== false; // Default true

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
                    {/* Wallet Card */}
                    {client.portal_config?.show_balance ? (
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[180px] text-white">
                            <div className="absolute top-0 right-0 p-4 opacity-20"><CreditCard size={100} /></div>
                            <div>
                                <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Available Balance</p>
                                <h3 className="text-4xl font-mono font-bold mt-1">${balance.toFixed(2)}</h3>
                            </div>
                            <div className="mt-4 flex justify-between items-end">
                                {balance < (client.low_balance_alert_threshold || 10) && (
                                    <div className="inline-block bg-red-600 border border-red-400 text-white text-xs px-2 py-1 rounded animate-pulse font-bold">
                                        ⚠️ Low Balance
                                    </div>
                                )}
                                {showTopUp && (
                                    <button 
                                        onClick={() => setIsTopUpOpen(true)}
                                        className="bg-white text-indigo-700 font-bold px-4 py-2 rounded-lg shadow-sm hover:bg-gray-100 transition-colors flex items-center text-xs"
                                    >
                                        <PlusCircle className="h-4 w-4 mr-1"/> Request Top-up
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
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

                {/* 2. PERFORMANCE REPORTS */}
                {(showMessageReport || showSalesReport || showProfitLossReport) && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                            <Filter className="h-5 w-5 text-indigo-600"/>
                            <span className="font-bold text-sm">Report Filters:</span>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                            <div className="bg-gray-100 p-1 rounded-lg flex">
                                <button 
                                    onClick={() => setReportRange('30_DAYS')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${reportRange === '30_DAYS' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Last 30 Days
                                </button>
                                <button 
                                    onClick={() => setReportRange('THIS_MONTH')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${reportRange === 'THIS_MONTH' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    This Month
                                </button>
                                <button 
                                    onClick={() => setReportRange('CUSTOM')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${reportRange === 'CUSTOM' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Custom Range
                                </button>
                            </div>
                            {reportRange === 'CUSTOM' && (
                                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded border border-gray-200">
                                    <input 
                                        type="date" 
                                        className="text-xs bg-transparent border-none focus:ring-0 text-gray-700 font-medium"
                                        value={reportStart}
                                        onChange={e => setReportStart(e.target.value)}
                                    />
                                    <span className="text-gray-400">-</span>
                                    <input 
                                        type="date" 
                                        className="text-xs bg-transparent border-none focus:ring-0 text-gray-700 font-medium"
                                        value={reportEnd}
                                        onChange={e => setReportEnd(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {showMessageReport && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
                            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                                <div><h3 className="font-bold text-gray-900 text-base flex items-center"><MessageCircle className="mr-2 text-blue-600 h-5 w-5"/> Message Report</h3><span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded mt-1 inline-block">মেসেজ রিপোর্ট</span></div>
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    <button onClick={() => setMsgView('TABLE')} className={`p-1.5 rounded transition-all ${msgView === 'TABLE' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}><Table className="h-4 w-4"/></button>
                                    <button onClick={() => setMsgView('GRAPH')} className={`p-1.5 rounded transition-all ${msgView === 'GRAPH' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}><BarChart2 className="h-4 w-4"/></button>
                                </div>
                            </div>
                            <div className="flex-1 min-h-[300px]">
                                {messageCampaigns.length === 0 ? <div className="flex items-center justify-center h-full text-gray-400 text-sm p-8">No message data.</div> : msgView === 'TABLE' ? (
                                    <div className="max-h-80 overflow-y-auto"><table className="w-full text-sm text-left"><thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase sticky top-0"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-right">Spend</th><th className="px-4 py-3 text-center">Messages</th><th className="px-4 py-3 text-right">CPR</th></tr></thead><tbody className="divide-y divide-gray-100">{messageCampaigns.map(rec => (<tr key={rec.id} className="hover:bg-gray-50"><td className="px-4 py-3 text-gray-700 font-medium">{new Date(rec.start_date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short'})}</td><td className="px-4 py-3 text-right font-mono font-bold text-gray-800">${rec.amount_spent.toFixed(2)}</td><td className="px-4 py-3 text-center"><span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold">{rec.results_count}</span></td><td className="px-4 py-3 text-right text-xs text-gray-500 font-mono">${(rec.results_count > 0 ? (rec.amount_spent / rec.results_count) : 0).toFixed(2)}</td></tr>))}</tbody></table></div>
                                ) : <SimpleChart data={messageCampaigns} labelKey="start_date" valueKey="results_count" colorClass="bg-blue-500" valuePrefix="" valueSuffix=" msgs" />}
                            </div>
                        </div>
                    )}
                    {showSalesReport && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
                            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                                <div><h3 className="font-bold text-gray-900 text-base flex items-center"><ShoppingBag className="mr-2 text-green-600 h-5 w-5"/> Sales Report</h3><span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded mt-1 inline-block">সেলস রিপোর্ট</span></div>
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    <button onClick={() => setSalesView('TABLE')} className={`p-1.5 rounded transition-all ${salesView === 'TABLE' ? 'bg-white shadow text-green-600' : 'text-gray-400 hover:text-gray-600'}`}><Table className="h-4 w-4"/></button>
                                    <button onClick={() => setSalesView('GRAPH')} className={`p-1.5 rounded transition-all ${salesView === 'GRAPH' ? 'bg-white shadow text-green-600' : 'text-gray-400 hover:text-gray-600'}`}><BarChart2 className="h-4 w-4"/></button>
                                </div>
                            </div>
                            <div className="flex-1 min-h-[300px]">
                                {salesCampaigns.length === 0 ? <div className="flex items-center justify-center h-full text-gray-400 text-sm p-8">No sales data.</div> : salesView === 'TABLE' ? (
                                    <div className="max-h-80 overflow-y-auto"><table className="w-full text-sm text-left"><thead className="bg-white text-gray-500 font-bold text-xs uppercase sticky top-0"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-right">Spend</th><th className="px-4 py-3 text-center">Sales</th><th className="px-4 py-3 text-right">CPA</th></tr></thead><tbody className="divide-y divide-gray-100">{salesCampaigns.map(rec => (<tr key={rec.id} className="hover:bg-gray-50"><td className="px-4 py-3 text-gray-700 font-medium">{new Date(rec.start_date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short'})}</td><td className="px-4 py-3 text-right font-mono font-bold text-gray-800">${rec.amount_spent.toFixed(2)}</td><td className="px-4 py-3 text-center"><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-bold">{rec.results_count}</span></td><td className="px-4 py-3 text-right text-xs text-gray-500 font-mono">${(rec.results_count > 0 ? (rec.amount_spent / rec.results_count) : 0).toFixed(2)}</td></tr>))}</tbody></table></div>
                                ) : <SimpleChart data={salesCampaigns} labelKey="start_date" valueKey="results_count" colorClass="bg-green-500" valuePrefix="" valueSuffix=" Sales" />}
                            </div>
                        </div>
                    )}
                </div>

                {showProfitLossReport && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-8">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                            <div><h3 className="font-bold text-gray-900 text-lg flex items-center"><TrendingUp className="mr-2 text-purple-600 h-5 w-5"/> Profit & Loss Ledger</h3><span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded mt-1 inline-block">লাভ/ক্ষতি হিসাব</span></div>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button onClick={() => setProfitView('TABLE')} className={`p-1.5 rounded transition-all ${profitView === 'TABLE' ? 'bg-white shadow text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}><Table className="h-4 w-4"/></button>
                                <button onClick={() => setProfitView('GRAPH')} className={`p-1.5 rounded transition-all ${profitView === 'GRAPH' ? 'bg-white shadow text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}><BarChart2 className="h-4 w-4"/></button>
                            </div>
                        </div>
                        <div className="p-4">
                            {salesCampaigns.length === 0 ? <div className="p-4 text-center text-gray-400">No profit data.</div> : profitView === 'TABLE' ? (
                                <table className="w-full text-sm text-left"><thead className="bg-gray-50 text-gray-600 font-bold text-xs uppercase"><tr><th className="px-6 py-3">Date</th><th className="px-6 py-3 text-center">Sold</th><th className="px-6 py-3 text-right">Ad Spend</th><th className="px-6 py-3 text-right">Net Profit</th></tr></thead><tbody className="divide-y divide-gray-100">{salesCampaigns.map(rec => { const net = (rec.results_count * (rec.product_price || 0) - rec.results_count * (rec.product_cost || 0)) - (rec.amount_spent * 145); return (<tr key={rec.id} className="hover:bg-gray-50"><td className="px-6 py-4">{new Date(rec.start_date).toLocaleDateString('en-GB')}</td><td className="px-6 py-4 text-center font-bold">{rec.results_count}</td><td className="px-6 py-4 text-right">${rec.amount_spent.toFixed(2)}</td><td className={`px-6 py-4 text-right font-bold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{net.toLocaleString()}৳</td></tr>); })}</tbody></table>
                            ) : <SimpleChart data={salesCampaigns.map(r => ({ ...r, net: (r.results_count * (r.product_price || 0) - r.results_count * (r.product_cost || 0)) - (r.amount_spent * 145) }))} labelKey="start_date" valueKey="net" colorClass="bg-purple-500" valuePrefix="৳ " valueSuffix="" />}
                        </div>
                    </div>
                )}

                {/* 3. CALCULATORS & INFO */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                                <h3 className="font-bold text-gray-900 text-lg flex items-center"><CheckCircle className="mr-2 text-indigo-600"/> Project Tasks & Milestones</h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {client.growth_tasks?.length === 0 ? <div className="p-8 text-center text-gray-400">No tasks active.</div> : client.growth_tasks?.map(task => (<div key={task.id} className="p-4 flex justify-between items-center"><div className="flex items-center gap-3"><div className={`h-5 w-5 rounded-full border flex items-center justify-center ${task.is_completed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>{task.is_completed && <CheckCircle size={14} className="text-white"/>}</div><div><p className={`text-sm ${task.is_completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{task.title}</p></div></div>{task.is_completed && <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">DONE</span>}</div>))}
                            </div>
                        </div>

                        {client.portal_config?.show_history && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                                    <h3 className="font-bold text-gray-900 text-lg flex items-center"><List className="mr-2 text-indigo-600"/> Transaction History</h3>
                                    <button onClick={handleDownloadLedger} className="bg-white border border-gray-300 text-gray-700 p-1.5 rounded"><Download className="h-4 w-4"/></button>
                                </div>
                                <table className="w-full text-sm text-left"><thead className="text-xs text-gray-500 uppercase bg-gray-50"><tr><th className="px-6 py-3">Date</th><th className="px-6 py-3">Description</th><th className="px-6 py-3 text-right">Amount</th></tr></thead><tbody className="divide-y divide-gray-100">{displayedTx.map(tx => (<tr key={tx.id} className="hover:bg-gray-50"><td className="px-6 py-3">{new Date(tx.date).toLocaleDateString()}</td><td className="px-6 py-3">{tx.description}</td><td className={`px-6 py-3 text-right font-mono ${tx.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-500'}`}>{tx.type === 'DEPOSIT' ? '+' : '-'}${tx.amount.toFixed(2)}</td></tr>))}</tbody></table>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-6 text-center">
                            <h4 className="text-indigo-800 font-bold mb-2 flex justify-center items-center"><Users className="h-5 w-5 mr-2"/> Need Support?</h4>
                            <div className="space-y-2">
                                {globalSettings?.portal_support_phone && <a href={`tel:${globalSettings.portal_support_phone}`} className="flex justify-center p-2 bg-white rounded border text-sm text-gray-700 hover:text-indigo-600"><Phone className="h-4 w-4 mr-2"/> Call Agent</a>}
                                {globalSettings?.portal_fb_group && <a href={globalSettings.portal_fb_group} target="_blank" rel="noreferrer" className="flex justify-center p-2 bg-white rounded border text-sm text-gray-700 hover:text-indigo-600"><Users className="h-4 w-4 mr-2"/> FB Group</a>}
                            </div>
                        </div>

                        {showPaymentMethods && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center"><ShieldCheck className="mr-2 text-indigo-600"/> Payment Methods</h3>
                                {showTopUp && <button onClick={() => setIsTopUpOpen(true)} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-indigo-700 transition-all flex items-center justify-center mb-6"><UploadCloud className="h-5 w-5 mr-2" /> Submit Payment Slip</button>}
                                <div className="space-y-4">
                                    {paymentMethods.map(pm => (
                                        <div key={pm.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            <div className="flex justify-between items-center mb-2"><span className="font-bold text-gray-800">{pm.provider_name}</span><span className="text-[10px] uppercase bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">{pm.type}</span></div>
                                            <div className="bg-white border border-gray-200 p-2 rounded flex justify-between items-center"><span className="font-mono text-sm font-bold">{pm.account_number}</span><button onClick={() => handleCopy(pm.id, pm.account_number)} className="text-gray-400 hover:text-indigo-600">{copiedId === pm.id ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}</button></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {isTopUpOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
                        <div className="bg-indigo-600 p-4 flex justify-between items-center text-white"><h3 className="font-bold text-lg">Balance Top-up Request</h3><button onClick={() => setIsTopUpOpen(false)}><X className="h-5 w-5"/></button></div>
                        <div className="p-6 space-y-4">
                            <div><label className="block text-sm font-medium text-gray-700">Amount Sent ($)</label><input type="number" className="w-full border rounded p-2" value={topUpAmount || ''} onChange={e => setTopUpAmount(parseFloat(e.target.value))} /></div>
                            <div><label className="block text-sm font-medium text-gray-700">Method</label><select className="w-full border rounded p-2" value={topUpMethod} onChange={e => setTopUpMethod(e.target.value)}><option value="">-- Choose --</option>{paymentMethods.map(p => <option key={p.id} value={p.provider_name}>{p.provider_name}</option>)}</select></div>
                            <div><label className="block text-sm font-medium text-gray-700">Sender / Trx ID</label><input type="text" className="w-full border rounded p-2" value={topUpSender} onChange={e => setTopUpSender(e.target.value)} /></div>
                            <div className="border-2 border-dashed rounded p-4 text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>{topUpImage ? <span className="text-green-600 font-bold">Image Attached</span> : <span>Upload Screenshot (Max 5MB)</span>}<input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload}/></div>
                            <button onClick={submitTopUp} disabled={isSubmittingTopUp} className="w-full bg-indigo-600 text-white font-bold py-3 rounded shadow hover:bg-indigo-700 disabled:opacity-50">{isSubmittingTopUp ? 'Sending...' : 'Submit Request'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ClientPortal: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [client, setClient] = useState<BigFish | null>(null);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => { if(id) { Promise.all([mockService.getBigFishById(id), mockService.getPaymentMethods()]).then(([c, pm]) => { setClient(c || null); setPaymentMethods(pm); setLoading(false); }); } }, [id]);
    if(loading) return <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">Loading...</div>;
    if(!client) return <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">Invalid Link</div>;
    return <PortalView client={client} paymentMethods={paymentMethods} />;
};
export default ClientPortal;
