
import React, { useState, useEffect, useMemo } from 'react';
import { mockService } from '../services/mockService';
import { BigFish, CampaignRecord } from '../types';
import { Coins, TrendingUp, RefreshCw, Plus, Check, Target, BarChart2, DollarSign, ChevronRight, Activity, Layers, ArrowRightLeft, ShieldCheck, Banknote, MoveHorizontal, Calendar } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

interface ClientProfitSegment {
    name: string;
    profitBDT: number;
    profitUSD: number;
    color: string;
}

const AgencyProfit: React.FC = () => {
    const { exchangeRate } = useCurrency();
    const [allFish, setAllFish] = useState<BigFish[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Date Range Filter State (Defaults to last 30 days)
    const [filterStartDate, setFilterStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().slice(0, 10);
    });
    const [filterEndDate, setFilterEndDate] = useState(new Date().toISOString().slice(0, 10));

    // Entry Form State
    const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
    const [selectedClientId, setSelectedClientId] = useState('');
    const [manualClientName, setManualClientName] = useState('');
    const [entryProfitBDT, setEntryProfitBDT] = useState<number | string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const data = await mockService.getBigFish();
        setAllFish(data);
        setLoading(false);
    };

    const handleQuickEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!entryProfitBDT || (!selectedClientId && !manualClientName)) {
            alert("অনুগ্রহ করে ক্লায়েন্ট এবং প্রফিট অ্যামাউন্ট দিন।");
            return;
        }

        setIsSubmitting(true);
        const profit = Number(entryProfitBDT);
        const client = allFish.find(f => f.id === selectedClientId);
        const clientName = client ? client.name : manualClientName;
        const usdProfit = profit / exchangeRate;

        try {
            if (selectedClientId && selectedClientId !== 'MANUAL') {
                await mockService.addCampaignRecord(selectedClientId, {
                    start_date: entryDate,
                    end_date: entryDate,
                    amount_spent: usdProfit,
                    real_amount_spent: usdProfit * 0.85, 
                    buying_rate: 130,
                    client_rate: 145,
                    impressions: 0,
                    reach: 0,
                    clicks: 0,
                    result_type: 'MESSAGES',
                    results_count: 0,
                    notes: `Manual Profit Entry: ${clientName}`
                } as any);
            }
            alert(`৳${profit.toLocaleString()} প্রফিট সফলভাবে যোগ করা হয়েছে!`);
            setEntryProfitBDT('');
            setManualClientName('');
            loadData();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Scaling: 10k = 50% height
    const calculateVisualHeight = (value: number): number => {
        if (value <= 0) return 0;
        if (value <= 10000) {
            return (value / 10000) * 50;
        } else {
            const extra = value - 10000;
            const percentageInTopHalf = (Math.min(extra, 90000) / 90000) * 50;
            return Math.min(50 + percentageInTopHalf, 98);
        }
    };

    const chartData = useMemo(() => {
        const start = new Date(filterStartDate);
        const end = new Date(filterEndDate);
        const days = [];
        
        // Generate dates between start and end
        let current = new Date(start);
        current.setHours(0,0,0,0);
        const endMidnight = new Date(end);
        endMidnight.setHours(0,0,0,0);

        while (current <= endMidnight) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        const colors = ['bg-indigo-600', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-500', 'bg-purple-500'];

        return days.map(day => {
            const dateStr = day.toISOString().split('T')[0];
            const label = day.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
            
            let dayCurrencyProfit = 0;
            let dayMarkupProfit = 0;
            const clientMap: Record<string, { bdt: number, usd: number }> = {};
            
            allFish.forEach(fish => {
                fish.campaign_records?.forEach(rec => {
                    if (rec.start_date.startsWith(dateStr)) {
                        const bRate = rec.buying_rate || 130;
                        const cRate = rec.client_rate || 145;
                        const actualUSD = rec.real_amount_spent || rec.amount_spent;
                        const billedUSD = rec.amount_spent;
                        const cGain = actualUSD * (cRate - bRate);
                        const mGain = (billedUSD - actualUSD) * cRate;
                        dayCurrencyProfit += cGain;
                        dayMarkupProfit += mGain;
                        const total = cGain + mGain;
                        if(!clientMap[fish.name]) clientMap[fish.name] = { bdt: 0, usd: 0 };
                        clientMap[fish.name].bdt += total;
                        clientMap[fish.name].usd += (total / cRate);
                    }
                });
            });

            const segments: ClientProfitSegment[] = Object.entries(clientMap).map(([name, data], idx) => ({
                name,
                profitBDT: data.bdt,
                profitUSD: data.usd,
                color: colors[idx % colors.length]
            }));

            return { 
                label, 
                totalProfitBDT: segments.reduce((sum, s) => sum + s.profitBDT, 0),
                currencyProfitBDT: dayCurrencyProfit,
                markupProfitBDT: dayMarkupProfit,
                segments 
            };
        });
    }, [filterStartDate, filterEndDate, allFish]);

    const totalProfit = chartData.reduce((sum, d) => sum + d.totalProfitBDT, 0);
    const totalCurrencyProfit = chartData.reduce((sum, d) => sum + d.currencyProfitBDT, 0);
    const totalMarkupProfit = chartData.reduce((sum, d) => sum + d.markupProfitBDT, 0);

    const milestones = [
        { val: 100000, label: '৳১০০ক' },
        { val: 50000, label: '৳৫০ক' },
        { val: 25000, label: '৳২৫ক' },
        { val: 10000, label: '৳১০ক (৫০%)', isMid: true },
        { val: 5000, label: '৳৫ক' },
        { val: 1000, label: '৳১ক' }
    ];

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-60 text-gray-500">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
            <p className="font-bold text-[10px] uppercase tracking-widest">Loading Data...</p>
        </div>
    );

    // Calculate dynamic container width for horizontal scrolling based on data points
    const barWidth = 40; // Reduced width for mobile
    const calculatedWidthPx = chartData.length * barWidth;
    
    // Only apply fixed pixel width if it exceeds the container area roughly
    const containerStyleWidth = calculatedWidthPx > 800 ? `${calculatedWidthPx}px` : '100%';

    return (
        <div className="space-y-3 sm:space-y-6 font-inter pb-20 animate-fade-in w-full max-w-[100vw] overflow-x-hidden px-1">
            {/* 1. Header & Range Select */}
            <div className="bg-white p-3 sm:p-6 lg:p-8 rounded-xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
                <div className="flex items-center gap-2 w-full lg:w-auto">
                    <div className="p-2 bg-slate-900 rounded-lg sm:rounded-3xl shadow-md shrink-0">
                        <Coins className="h-5 w-5 sm:h-8 sm:w-8 text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-base sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight truncate">Revenue Analytics</h1>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate">Global Profit @ {exchangeRate} BDT</p>
                    </div>
                </div>
                
                {/* Custom Date Range Picker */}
                <div className="w-full lg:w-auto bg-slate-50 p-1 rounded-lg border border-slate-200 flex items-center justify-between gap-1">
                    <input 
                        type="date" 
                        className="flex-1 bg-white border-none rounded-md text-[9px] sm:text-xs font-bold text-slate-700 px-1 py-1.5 focus:ring-1 focus:ring-indigo-500 shadow-sm cursor-pointer outline-none min-w-0"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                    />
                    <span className="text-slate-400 font-black text-xs shrink-0">-</span>
                    <input 
                        type="date" 
                        className="flex-1 bg-white border-none rounded-md text-[9px] sm:text-xs font-bold text-slate-700 px-1 py-1.5 focus:ring-1 focus:ring-indigo-500 shadow-sm cursor-pointer outline-none min-w-0"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                    />
                </div>
            </div>

            {/* 2. KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6">
                {/* Currency Margin */}
                <div className="bg-white p-3 sm:p-7 rounded-xl sm:rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-5 text-blue-600"><ArrowRightLeft size={40}/></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Currency (৳১৫/$)</span>
                    <h3 className="text-xl sm:text-3xl font-black text-blue-600 font-mono tracking-tighter">৳{totalCurrencyProfit.toLocaleString()}</h3>
                    <p className="text-[9px] sm:text-sm font-bold text-slate-400 mt-0.5">${(totalCurrencyProfit / exchangeRate).toFixed(1)}</p>
                </div>

                {/* Service Markup */}
                <div className="bg-white p-3 sm:p-7 rounded-xl sm:rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-5 text-emerald-600"><ShieldCheck size={40}/></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Service Markup</span>
                    <h3 className="text-xl sm:text-3xl font-black text-emerald-600 font-mono tracking-tighter">৳{totalMarkupProfit.toLocaleString()}</h3>
                    <p className="text-[9px] sm:text-sm font-bold text-slate-400 mt-0.5">${(totalMarkupProfit / exchangeRate).toFixed(1)}</p>
                </div>

                {/* Total Profit - Dark Card */}
                <div className="bg-slate-900 p-3 sm:p-7 rounded-xl sm:rounded-[2.5rem] shadow-md flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10 text-white"><DollarSign size={50}/></div>
                    <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1 block">Total Net Profit</span>
                    <div>
                        <h3 className="text-xl sm:text-3xl font-black text-white font-mono tracking-tighter">৳{totalProfit.toLocaleString()}</h3>
                        <h4 className="text-xs sm:text-xl font-bold text-indigo-400 font-mono mt-0.5">${(totalProfit / exchangeRate).toLocaleString()}</h4>
                    </div>
                </div>

                {/* Run Rate */}
                <div className="bg-indigo-50 p-3 sm:p-7 rounded-xl sm:rounded-[2.5rem] border border-indigo-100 flex flex-col justify-between">
                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1 block">Daily Run Rate</span>
                    <div>
                        <h3 className="text-xl sm:text-3xl font-black text-indigo-900 font-mono tracking-tighter">৳{Math.round(totalProfit / (chartData.length || 1)).toLocaleString()}</h3>
                        <p className="text-[9px] sm:text-sm font-bold text-indigo-400 mt-0.5">${(totalProfit / (chartData.length || 1) / exchangeRate).toFixed(1)}/Day</p>
                    </div>
                </div>
            </div>

            {/* 3. MAIN SCROLLABLE CHART */}
            <div className="bg-white rounded-xl sm:rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-3 sm:px-10 py-3 sm:py-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50/40">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm text-indigo-600 border border-slate-100">
                            <BarChart2 size={16}/>
                        </div>
                        <div>
                            <h3 className="text-[10px] sm:text-sm font-black text-slate-800 uppercase tracking-widest">Profit Velocity</h3>
                            <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase mt-0">Scale: ৳10k = 50%</p>
                        </div>
                    </div>
                    {chartData.length > 10 && (
                        <div className="w-full sm:w-auto bg-indigo-600 px-3 py-1.5 rounded-full text-white text-[8px] font-black uppercase flex items-center justify-center gap-1 shadow-sm animate-pulse">
                            <MoveHorizontal size={12}/> Scroll Right
                        </div>
                    )}
                </div>

                <div className="p-2 sm:p-10 h-[300px] sm:h-[600px] relative bg-white overflow-hidden">
                    {/* Y-Axis Grid (Static) */}
                    <div className="absolute left-2 right-2 top-8 bottom-16 pointer-events-none z-0">
                        {milestones.map(m => {
                            const bottomPos = calculateVisualHeight(m.val);
                            return (
                                <div key={m.val} className={`absolute left-0 right-0 border-t transition-all duration-700 ${m.isMid ? 'border-indigo-200 border-dashed z-20 opacity-100' : 'border-slate-100 opacity-50'}`} style={{ bottom: `${bottomPos}%` }}>
                                    <span className={`absolute -left-2 translate-x-[-100%] text-[8px] font-black whitespace-nowrap pr-2 ${m.isMid ? 'text-indigo-600' : 'text-slate-300'}`}>
                                        {m.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Scrollable Horizontal Canvas */}
                    <div className="h-full overflow-x-auto custom-scrollbar-horizontal relative z-10 pl-8 sm:pl-24 pb-4 w-full">
                        <div 
                            className="flex items-end h-full pb-10" 
                            style={{ 
                                width: containerStyleWidth,
                                gap: '10px',
                                paddingLeft: '5px'
                            }}
                        >
                            {chartData.map((day, i) => {
                                const totalHeight = calculateVisualHeight(day.totalProfitBDT);
                                return (
                                    <div key={i} className="flex flex-col justify-end items-center group relative h-full flex-shrink-0" style={{ width: '30px' }}>
                                        
                                        {/* Floating Label */}
                                        <div className="mb-1 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="px-1.5 py-0.5 rounded bg-slate-900 text-white text-[8px] font-bold">
                                                {Math.round(day.totalProfitBDT / 1000)}k
                                            </div>
                                        </div>

                                        {/* Stacked Bar */}
                                        <div className="w-full rounded-t-sm shadow-sm transition-all duration-1000 ease-out flex flex-col-reverse group-hover:brightness-110 relative overflow-hidden" style={{ height: `${totalHeight}%` }}>
                                            {day.segments.map((seg, sIdx) => {
                                                const segmentHeight = (seg.profitBDT / (day.totalProfitBDT || 1)) * 100;
                                                return (
                                                    <div key={sIdx} className={`${seg.color} border-b border-white/20 relative w-full`} style={{ height: `${segmentHeight}%` }}></div>
                                                );
                                            })}
                                        </div>
                                        
                                        {/* Date Axis Label */}
                                        <div className="absolute top-full mt-1 flex flex-col items-center">
                                            <span className="font-black text-slate-800 text-[8px] uppercase transform -rotate-45 origin-top-left whitespace-nowrap">
                                                {day.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Ingestion & Operations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 items-stretch">
                <div className="lg:col-span-2 bg-slate-900 p-4 sm:p-10 rounded-2xl sm:rounded-[3rem] shadow-lg relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none"></div>
                     <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-1.5 bg-indigo-50/10 rounded-lg border border-indigo-500/30">
                                <Plus className="h-4 w-4 text-indigo-400" />
                            </div>
                            <h2 className="text-white font-black text-sm sm:text-xl uppercase tracking-widest">Manual Injection</h2>
                        </div>

                        <form onSubmit={handleQuickEntry} className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest ml-1">Ledger Date</label>
                                    <input type="date" className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white focus:ring-1 focus:ring-indigo-500/50 outline-none" value={entryDate} onChange={e => setEntryDate(e.target.value)}/>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest ml-1">Portfolio Segment</label>
                                    <select 
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white focus:ring-1 focus:ring-indigo-500/50 outline-none"
                                        value={selectedClientId}
                                        onChange={e => setSelectedClientId(e.target.value)}
                                    >
                                        <option value="" className="bg-slate-900 text-gray-400">-- Source --</option>
                                        {allFish.map(f => (<option key={f.id} value={f.id} className="bg-slate-900 text-white">{f.name}</option>))}
                                        <option value="MANUAL" className="bg-slate-900 text-indigo-400 font-bold">+ External</option>
                                    </select>
                                </div>
                            </div>

                            {selectedClientId === 'MANUAL' && (
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest ml-1">Identity</label>
                                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white" value={manualClientName} onChange={e => setManualClientName(e.target.value)} placeholder="Source name..."/>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest ml-1">Net Profit (BDT)</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-indigo-500 text-sm">৳</div>
                                    <input type="number" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 pl-8 text-lg text-white font-mono font-black focus:ring-1 focus:ring-indigo-500/50 outline-none" placeholder="0.00" value={entryProfitBDT} onChange={e => setEntryProfitBDT(e.target.value)}/>
                                </div>
                            </div>

                            <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider mt-2">
                                {isSubmitting ? <RefreshCw className="h-3 w-3 animate-spin"/> : <Check className="h-3 w-3"/>}
                                Save
                            </button>
                        </form>
                     </div>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex-1 flex flex-col justify-center">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                <Activity size={20} />
                            </div>
                            <div>
                                <h4 className="text-slate-900 font-black text-[10px] uppercase tracking-widest mb-1">Instructions</h4>
                                <p className="text-[9px] text-slate-500 leading-relaxed font-bold">
                                    Scroll chart for history. Use Manual Injection for non-automated sources.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-4 rounded-2xl shadow-lg flex-1 flex items-center justify-between group overflow-hidden relative">
                        <div className="text-white relative z-10">
                             <h4 className="font-black text-indigo-200 text-[8px] uppercase tracking-widest mb-0.5">Benchmark</h4>
                             <p className="text-2xl font-black font-mono tracking-tighter">৳10k</p>
                             <p className="text-[10px] font-bold text-indigo-200 mt-0">= 50% Height</p>
                        </div>
                        <Layers size={40} className="text-white/10 absolute right-[-5px] bottom-[-5px]" />
                    </div>
                </div>
            </div>
            
            <style>{`
                .custom-scrollbar-horizontal::-webkit-scrollbar {
                    height: 4px;
                }
                .custom-scrollbar-horizontal::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                }
                .custom-scrollbar-horizontal::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
};

export default AgencyProfit;