
import React, { useEffect, useState, useRef } from 'react';
// @ts-ignore
import { useParams } from 'react-router-dom';
import { mockService } from '../services/mockService';
import { BigFish, PaymentMethod, SystemSettings, CampaignRecord } from '../types';
import { DollarSign, Calendar, CheckCircle, ShieldCheck, Target, AlertTriangle, CreditCard, Lock, List, BarChart2, Download, Building, Smartphone, Copy, Check, Calculator, ChevronLeft, ChevronRight, Phone, Globe, Users, PlusCircle, UploadCloud, X, MessageCircle, ShoppingBag, TrendingUp, TrendingDown, Table, Filter, Clock } from 'lucide-react';

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

    // --- TOP UP LOGIC ---
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const maxWidth = 800; 
                    const scaleSize = maxWidth / img.width;
                    canvas.width = maxWidth;
                    canvas.height = img.height * scaleSize;
                    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7); 
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
        await mockService.createTopUpRequest({
            client_id: client.id,
            client_name: client.name,
            amount: topUpAmount,
            method_name: topUpMethod,
            sender_number: topUpSender,
            screenshot_url: topUpImage
        });
        setIsSubmittingTopUp(false);
        setIsTopUpOpen(false);
        setTopUpAmount(0); setTopUpSender(''); setTopUpImage(null);
        alert("Top-up request submitted! Your balance will update after admin approval.");
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
    // Ensure sorting by date descending (Newest first)
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

    // Pending Top-ups
    const pendingTopUps = client.topup_requests?.filter(r => r.status === 'PENDING') || [];

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

    // Flags
    const showCPR = client.portal_config?.shared_calculators?.cpr;
    const showCurrency = client.portal_config?.shared_calculators?.currency;
    const showROI = client.portal_config?.shared_calculators?.roi;
    const showCalculators = showCPR || showCurrency || showROI;
    const showTopUp = client.portal_config?.feature_flags?.allow_topup_request;

    // Report Visibility Flags (Default to TRUE if undefined, except Profit Loss)
    const flags = client.portal_config?.feature_flags || {};
    const showMessageReport = flags.show_message_report !== false; 
    const showSalesReport = flags.show_sales_report !== false;
    const showProfitLossReport = flags.show_profit_loss_report === true; // Opt-in default false

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

                {/* --- REPORT CONTROLS (GLOBAL FOR THIS SECTION) --- */}
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

                {/* --- SEPARATED PERFORMANCE REPORTS (Standard Style) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* 1. MESSAGE PERFORMANCE SECTION */}
                    {showMessageReport && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
                            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-base flex items-center">
                                        <MessageCircle className="mr-2 text-blue-600 h-5 w-5"/> Message Report
                                    </h3>
                                    <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded mt-1 inline-block">মেসেজ রিপোর্ট</span>
                                </div>
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    <button 
                                        onClick={() => setMsgView('TABLE')}
                                        className={`p-1.5 rounded transition-all ${msgView === 'TABLE' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <Table className="h-4 w-4"/>
                                    </button>
                                    <button 
                                        onClick={() => setMsgView('GRAPH')}
                                        className={`p-1.5 rounded transition-all ${msgView === 'GRAPH' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <BarChart2 className="h-4 w-4"/>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex-1 min-h-[300px]">
                                {messageCampaigns.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-gray-400 text-sm p-8">No message data for selected period.</div>
                                ) : msgView === 'TABLE' ? (
                                    <div className="max-h-80 overflow-y-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-3">Date</th>
                                                    <th className="px-4 py-3 text-right">Spend</th>
                                                    <th className="px-4 py-3 text-center">Messages</th>
                                                    <th className="px-4 py-3 text-right">CPR</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {messageCampaigns.map(rec => (
                                                    <tr key={rec.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-gray-700 font-medium">
                                                            {new Date(rec.start_date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short'})}
                                                            {rec.start_date !== rec.end_date && ` - ${new Date(rec.end_date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short'})}`}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono font-bold text-gray-800">${rec.amount_spent.toFixed(2)}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold">{rec.results_count}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-xs text-gray-500 font-mono">
                                                            ${(rec.results_count > 0 ? (rec.amount_spent / rec.results_count) : 0).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <SimpleChart 
                                        data={messageCampaigns} 
                                        labelKey="start_date" 
                                        valueKey="results_count" 
                                        colorClass="bg-blue-500" 
                                        valuePrefix="" 
                                        valueSuffix=" msgs"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* 2. SALES PERFORMANCE SECTION */}
                    {showSalesReport && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
                            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-base flex items-center">
                                        <ShoppingBag className="mr-2 text-green-600 h-5 w-5"/> Sales Report
                                    </h3>
                                    <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded mt-1 inline-block">সেলস রিপোর্ট</span>
                                </div>
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    <button 
                                        onClick={() => setSalesView('TABLE')}
                                        className={`p-1.5 rounded transition-all ${salesView === 'TABLE' ? 'bg-white shadow text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <Table className="h-4 w-4"/>
                                    </button>
                                    <button 
                                        onClick={() => setSalesView('GRAPH')}
                                        className={`p-1.5 rounded transition-all ${salesView === 'GRAPH' ? 'bg-white shadow text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <BarChart2 className="h-4 w-4"/>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex-1 min-h-[300px]">
                                {salesCampaigns.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-gray-400 text-sm p-8">No sales data for selected period.</div>
                                ) : salesView === 'TABLE' ? (
                                    <div className="max-h-80 overflow-y-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-white text-gray-500 font-bold text-xs uppercase sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-3">Date</th>
                                                    <th className="px-4 py-3 text-right">Spend</th>
                                                    <th className="px-4 py-3 text-center">Sales</th>
                                                    <th className="px-4 py-3 text-right">CPA</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {salesCampaigns.map(rec => (
                                                    <tr key={rec.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-gray-700 font-medium">
                                                            {new Date(rec.start_date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short'})}
                                                            {rec.start_date !== rec.end_date && ` - ${new Date(rec.end_date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short'})}`}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono font-bold text-gray-800">${rec.amount_spent.toFixed(2)}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-bold">{rec.results_count}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-xs text-gray-500 font-mono">
                                                            ${(rec.results_count > 0 ? (rec.amount_spent / rec.results_count) : 0).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <SimpleChart 
                                        data={salesCampaigns} 
                                        labelKey="start_date" 
                                        valueKey="results_count" 
                                        colorClass="bg-green-500" 
                                        valuePrefix="" 
                                        valueSuffix=" Sales"
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. PROFIT / LOSS LEDGER (OPTIONAL) */}
                {showProfitLossReport && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-8">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg flex items-center">
                                    <TrendingUp className="mr-2 text-purple-600 h-5 w-5"/> Profit & Loss Ledger
                                </h3>
                                <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded mt-1 inline-block">লাভ/ক্ষতি হিসাব</span>
                            </div>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button 
                                    onClick={() => setProfitView('TABLE')}
                                    className={`p-1.5 rounded transition-all ${profitView === 'TABLE' ? 'bg-white shadow text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <Table className="h-4 w-4"/>
                                </button>
                                <button 
                                    onClick={() => setProfitView('GRAPH')}
                                    className={`p-1.5 rounded transition-all ${profitView === 'GRAPH' ? 'bg-white shadow text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <BarChart2 className="h-4 w-4"/>
                                </button>
                            </div>
                        </div>
                        
                        {salesCampaigns.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">No data available for profit analysis in this period.</div>
                        ) : profitView === 'TABLE' ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-600 font-bold text-xs uppercase">
                                        <tr>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3 text-center">Sold Qty</th>
                                            <th className="px-6 py-3 text-right">Ad Spend</th>
                                            <th className="px-6 py-3 text-right">Product Profit</th>
                                            <th className="px-6 py-3 text-right">Net Profit/Loss</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {salesCampaigns.map(rec => {
                                            // Calculation Logic
                                            const totalRevenue = rec.results_count * (rec.product_price || 0);
                                            const totalCOGS = rec.results_count * (rec.product_cost || 0);
                                            const grossProfit = totalRevenue - totalCOGS; // Profit from Product only
                                            
                                            // Ad Spend is in USD usually, need conversion or assume uniform unit.
                                            // Based on context, spend is entered in USD.
                                            const adSpendBDT = rec.amount_spent * 120; // Approx Rate for quick view, or use stored rate
                                            const realNetProfit = grossProfit - adSpendBDT;

                                            const isProfit = realNetProfit >= 0;

                                            return (
                                                <tr key={rec.id} className={`hover:bg-gray-50 ${isProfit ? 'bg-green-50/10' : 'bg-red-50/10'}`}>
                                                    <td className="px-6 py-4 font-medium text-gray-700">
                                                        {new Date(rec.start_date).toLocaleDateString('en-GB')}
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold">{rec.results_count}</td>
                                                    <td className="px-6 py-4 text-right text-gray-600">
                                                        ${rec.amount_spent.toFixed(2)} <span className="text-xs text-gray-400">({Math.round(adSpendBDT)}৳)</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-gray-600">
                                                        {grossProfit.toLocaleString()}৳
                                                    </td>
                                                    <td className={`px-6 py-4 text-right font-bold text-lg ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                                                        {isProfit ? '+' : ''}{realNetProfit.toLocaleString()}৳
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-4">
                                <SimpleChart 
                                    data={salesCampaigns.map(r => {
                                        // Calc net profit for graph
                                        const totalRevenue = r.results_count * (r.product_price || 0);
                                        const totalCOGS = r.results_count * (r.product_cost || 0);
                                        const adSpendBDT = r.amount_spent * 120;
                                        const net = (totalRevenue - totalCOGS) - adSpendBDT;
                                        return { ...r, net_profit: net };
                                    })} 
                                    labelKey="start_date" 
                                    valueKey="net_profit" 
                                    colorClass="bg-purple-500" 
                                    valuePrefix="৳ " 
                                    valueSuffix=""
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* 4. TOOLS & CALCULATORS */}
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
                                        Loss (Ret): <span className="font-bold text-red-500">{(adCost + 100).toFixed(0)}</span>
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

                        {/* RECENT TRANSACTIONS (Conditional) - WITH PAGINATION */}
                        {client.portal_config?.show_history && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
                                    <h3 className="font-bold text-gray-900 text-lg flex items-center"><List className="mr-2 text-indigo-600"/> Transaction History ({filteredTx.length})</h3>
                                    
                                    {/* FILTERS */}
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <div className="relative">
                                            <Calendar className="h-4 w-4 absolute left-2 top-2 text-gray-400"/>
                                            <input 
                                                type="date" 
                                                className="bg-white border border-gray-300 text-gray-700 text-xs rounded pl-8 pr-2 py-1 focus:ring-indigo-500 focus:border-indigo-500"
                                                value={startDate}
                                                onChange={e => { setStartDate(e.target.value); setHistoryPage(1); }}
                                            />
                                        </div>
                                        <span className="text-gray-400">-</span>
                                        <div className="relative">
                                            <Calendar className="h-4 w-4 absolute left-2 top-2 text-gray-400"/>
                                            <input 
                                                type="date" 
                                                className="bg-white border border-gray-300 text-gray-700 text-xs rounded pl-8 pr-2 py-1 focus:ring-indigo-500 focus:border-indigo-500"
                                                value={endDate}
                                                onChange={e => { setEndDate(e.target.value); setHistoryPage(1); }}
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
                                <div className="min-h-[200px]">
                                    <table className="w-full text-sm text-left text-gray-600">
                                        <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3">Date</th>
                                                <th className="px-6 py-3">Description</th>
                                                <th className="px-6 py-3 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {displayedTx.length === 0 && (
                                                <tr><td colSpan={3} className="p-6 text-center">No transactions found in this period.</td></tr>
                                            )}
                                            {displayedTx.map(tx => (
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
                                {/* Pagination Controls */}
                                {filteredTx.length > 0 && (
                                    <div className="bg-gray-50 p-3 border-t border-gray-200 flex justify-between items-center">
                                        <button 
                                            disabled={historyPage === 1}
                                            onClick={() => setHistoryPage(p => p - 1)}
                                            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <ChevronLeft className="h-4 w-4"/>
                                        </button>
                                        <span className="text-xs text-gray-500">Page {historyPage} of {totalHistoryPages}</span>
                                        <button 
                                            disabled={historyPage === totalHistoryPages}
                                            onClick={() => setHistoryPage(p => p + 1)}
                                            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <ChevronRight className="h-4 w-4"/>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* RIGHT COL: WORK LOG & BANK INFO */}
                    <div className="lg:col-span-1 space-y-6">
                         
                         {/* DYNAMIC SUPPORT SECTION */}
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

                        {/* Payment Info & TOP-UP REQUEST */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center"><ShieldCheck className="mr-2 text-indigo-600"/> Make a Payment</h3>
                            
                            {/* Top-Up Request Action */}
                            {showTopUp && (
                                <button 
                                    onClick={() => setIsTopUpOpen(true)}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center mb-6"
                                >
                                    <UploadCloud className="h-5 w-5 mr-2" />
                                    Submit Payment / Top-up Request
                                </button>
                            )}

                            {/* Pending Requests History */}
                            {pendingTopUps.length > 0 && (
                                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <h4 className="text-xs font-bold text-amber-800 uppercase mb-2 flex items-center">
                                        <Clock className="h-3 w-3 mr-1"/> Pending Requests
                                    </h4>
                                    <div className="space-y-2">
                                        {pendingTopUps.map(req => (
                                            <div key={req.id} className="text-xs text-amber-700 flex justify-between border-b border-amber-100 last:border-0 pb-1 last:pb-0">
                                                <span>{new Date(req.created_at).toLocaleDateString()}</span>
                                                <span className="font-bold">${req.amount}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

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

            {/* TOP UP MODAL */}
            {isTopUpOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
                        <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
                            <h3 className="font-bold text-lg flex items-center"><PlusCircle className="mr-2 h-5 w-5"/> Request Balance Add</h3>
                            <button onClick={() => setIsTopUpOpen(false)} className="hover:bg-indigo-700 rounded p-1"><X className="h-5 w-5"/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Sent ($)</label>
                                <input type="number" className="w-full border border-gray-300 rounded p-2.5 focus:ring-indigo-500" placeholder="e.g. 50" value={topUpAmount || ''} onChange={e => setTopUpAmount(parseFloat(e.target.value))} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Method Used</label>
                                <select className="w-full border border-gray-300 rounded p-2.5 focus:ring-indigo-500" value={topUpMethod} onChange={e => setTopUpMethod(e.target.value)}>
                                    <option value="">-- Select Method --</option>
                                    
                                    {/* Agency Accounts */}
                                    <optgroup label="Agency Accounts">
                                        {paymentMethods.map(pm => (
                                            <option key={pm.id} value={`${pm.provider_name} (${pm.account_number})`}>
                                                {pm.provider_name} - {pm.account_number}
                                            </option>
                                        ))}
                                    </optgroup>

                                    {/* General Methods */}
                                    <optgroup label="Mobile Banking">
                                        <option value="bKash">bKash</option>
                                        <option value="Nagad">Nagad</option>
                                        <option value="Rocket">Rocket</option>
                                        <option value="Upay">Upay</option>
                                        <option value="Cellfin">Cellfin</option>
                                        <option value="Tap">Tap</option>
                                        <option value="OK Wallet">OK Wallet</option>
                                    </optgroup>
                                    <optgroup label="Banking & Others">
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="City Bank">City Bank</option>
                                        <option value="Brac Bank">Brac Bank</option>
                                        <option value="Dutch Bangla Bank">Dutch Bangla Bank</option>
                                        <option value="Islami Bank">Islami Bank</option>
                                        <option value="Cash">Cash / Hand Cash</option>
                                        <option value="Other">Other</option>
                                    </optgroup>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sender Number / Trx ID</label>
                                <input type="text" className="w-full border border-gray-300 rounded p-2.5 focus:ring-indigo-500" placeholder="Last 4 digits or Trx ID" value={topUpSender} onChange={e => setTopUpSender(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Screenshot</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-indigo-300 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    {topUpImage ? (
                                        <div className="text-center">
                                            <img src={topUpImage} alt="Preview" className="h-20 mx-auto mb-2 object-contain" />
                                            <span className="text-xs text-green-600 font-bold">Image Selected (Compressed)</span>
                                        </div>
                                    ) : (
                                        <>
                                            <UploadCloud className="h-8 w-8 mb-2"/>
                                            <span className="text-xs">Click to upload image</span>
                                        </>
                                    )}
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </div>
                            </div>
                            <button 
                                onClick={submitTopUp}
                                disabled={isSubmittingTopUp}
                                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 shadow-md transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmittingTopUp ? 'Sending Request...' : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
