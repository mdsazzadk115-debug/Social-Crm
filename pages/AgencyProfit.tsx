
import React, { useState, useEffect, useMemo } from 'react';
import { mockService } from '../services/mockService';
import { BigFish, CampaignRecord } from '../types';
import { Coins, TrendingUp, RefreshCw, Plus, Check, Target, BarChart2, DollarSign, ChevronRight, Activity, Layers, ArrowRightLeft, ShieldCheck, Banknote, MoveHorizontal } from 'lucide-react';
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
    const [timeframe, setTimeframe] = useState<'DAY' | 'WEEK' | 'MONTH' | 'YEAR'>('WEEK');

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
        const daysCount = timeframe === 'DAY' ? 1 : timeframe === 'WEEK' ? 7 : timeframe === 'MONTH' ? 30 : 365;
        const days = Array.from({ length: daysCount }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (daysCount - 1 - i));
            return d;
        });

        const colors = ['bg-indigo-600', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-500', 'bg-purple-500'];

        return days.map(day => {
            const dateStr = day.toISOString().split('T')[0];
            const label = daysCount <= 31 
                ? day.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                : day.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
            
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

            // Demo fill for empty visuals removed here to prevent fake data

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
    }, [timeframe, allFish]);

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
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
            <RefreshCw className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
            <p className="font-bold text-xs uppercase tracking-widest">Aggregating Agency Profit...</p>
        </div>
    );

    return (
        <div className="space-y-6 font-inter pb-20 animate-fade-in">
            {/* 1. Header & Range Select */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-slate-900 rounded-3xl shadow-xl ring-4 ring-slate-50">
                        <Coins className="h-8 w-8 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Revenue Analytics</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Global Profit Tracking @ {exchangeRate} BDT</p>
                    </div>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto">
                    {[
                        { id: 'DAY', label: 'আজ' },
                        { id: 'WEEK', label: 'সপ্তাহ' },
                        { id: 'MONTH', label: 'মাস' },
                        { id: 'YEAR', label: 'বছর' }
                    ].map((tf) => (
                        <button 
                            key={tf.id} 
                            onClick={() => setTimeframe(tf.id as any)}
                            className={`flex-1 sm:flex-none px-8 py-3 text-xs font-black rounded-xl transition-all ${timeframe === tf.id ? 'bg-white text-indigo-600 shadow-lg scale-105' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            {tf.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-7 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-400 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-blue-600 group-hover:scale-110 transition-transform"><ArrowRightLeft size={80}/></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Currency Margin (৳১৫/$)</span>
                    <h3 className="text-3xl font-black text-blue-600 font-mono tracking-tighter">৳{totalCurrencyProfit.toLocaleString()}</h3>
                    <p className="text-sm font-bold text-slate-400 mt-1">${(totalCurrencyProfit / exchangeRate).toFixed(1)} USD</p>
                </div>

                <div className="bg-white p-7 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-600 group-hover:scale-110 transition-transform"><ShieldCheck size={80}/></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Service Markup ($ Gain)</span>
                    <h3 className="text-3xl font-black text-emerald-600 font-mono tracking-tighter">৳{totalMarkupProfit.toLocaleString()}</h3>
                    <p className="text-sm font-bold text-slate-400 mt-1">${(totalMarkupProfit / exchangeRate).toFixed(1)} USD</p>
                </div>

                <div className="bg-slate-900 p-7 rounded-[2.5rem] shadow-2xl flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-white transition-transform group-hover:scale-110 duration-500"><DollarSign size={100}/></div>
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-4 block">Total Net Profit</span>
                    <div>
                        <h3 className="text-3xl font-black text-white font-mono tracking-tighter">৳{totalProfit.toLocaleString()}</h3>
                        <h4 className="text-xl font-bold text-indigo-400 font-mono mt-1">${(totalProfit / exchangeRate).toLocaleString()} USD</h4>
                    </div>
                </div>

                <div className="bg-indigo-50 p-7 rounded-[2.5rem] border border-indigo-100 flex flex-col justify-between">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4 block">Avg Run Rate</span>
                    <div>
                        <h3 className="text-3xl font-black text-indigo-900 font-mono tracking-tighter">৳{Math.round(totalProfit / (chartData.length || 1)).toLocaleString()}</h3>
                        <p className="text-sm font-bold text-indigo-400 mt-1">${(totalProfit / (chartData.length || 1) / exchangeRate).toFixed(1)} USD/Day</p>
                    </div>
                </div>
            </div>

            {/* 3. MAIN SCROLLABLE CHART */}
            <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/40">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600 border border-slate-100">
                            <BarChart2 size={24}/>
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.15em]">Profit Velocity Graph</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Scale: ৳10,000 = 50% Height Mark</p>
                        </div>
                    </div>
                    {chartData.length > 15 && (
                        <div className="bg-indigo-600 px-5 py-2.5 rounded-full text-white text-[10px] font-black uppercase flex items-center gap-2 shadow-xl shadow-indigo-100 animate-pulse">
                            <MoveHorizontal size={16}/> নিচে স্ক্রল বার ধরে ডানে টানুন ({chartData.length} দিন)
                        </div>
                    )}
                </div>

                <div className="p-10 h-[600px] relative bg-white overflow-hidden">
                    {/* Y-Axis Grid (Static) */}
                    <div className="absolute left-10 right-10 top-12 bottom-32 pointer-events-none z-0">
                        {milestones.map(m => {
                            const bottomPos = calculateVisualHeight(m.val);
                            return (
                                <div key={m.val} className={`absolute left-0 right-0 border-t transition-all duration-700 ${m.isMid ? 'border-indigo-200 border-dashed z-20 opacity-100' : 'border-slate-100 opacity-50'}`} style={{ bottom: `${bottomPos}%` }}>
                                    <span className={`absolute -left-6 translate-x-[-100%] text-[10px] font-black whitespace-nowrap pr-6 ${m.isMid ? 'text-indigo-600' : 'text-slate-300'}`}>
                                        {m.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Scrollable Horizontal Canvas */}
                    <div className="h-full overflow-x-auto custom-scrollbar-horizontal relative z-10 pl-24 pb-8">
                        <div 
                            className="flex items-end h-full pb-16" 
                            style={{ 
                                // Each bar gets fixed width to prevent design breakdown
                                width: timeframe === 'YEAR' ? '12000px' : timeframe === 'MONTH' ? '2400px' : '100%',
                                gap: timeframe === 'YEAR' ? '12px' : '30px',
                                paddingLeft: '20px'
                            }}
                        >
                            {chartData.map((day, i) => {
                                const totalHeight = calculateVisualHeight(day.totalProfitBDT);
                                return (
                                    <div key={i} className="flex flex-col justify-end items-center group relative h-full flex-shrink-0" style={{ width: timeframe === 'YEAR' ? '20px' : timeframe === 'MONTH' ? '50px' : '100px' }}>
                                        
                                        {/* Floating Dual Currency Label */}
                                        <div className="mb-4 flex flex-col items-center group-hover:-translate-y-2 transition-transform duration-500">
                                            <div className="px-3 py-2 rounded-2xl bg-slate-900 text-white shadow-2xl flex flex-col items-center border border-white/20 min-w-[50px]">
                                                <span className="text-[10px] font-black tracking-tighter">৳{(day.totalProfitBDT / 1000).toFixed(1)}k</span>
                                                {timeframe !== 'YEAR' && (
                                                    <span className="text-[8px] font-black text-indigo-400 uppercase mt-1 tracking-widest">${(day.totalProfitBDT / exchangeRate).toFixed(1)}</span>
                                                )}
                                            </div>
                                            <div className="w-0.5 h-3 bg-slate-900/5 mt-1"></div>
                                        </div>

                                        {/* Stacked Bar / Candle */}
                                        <div className="w-full rounded-t-2xl shadow-lg transition-all duration-1000 ease-out origin-bottom flex flex-col-reverse group-hover:brightness-110 relative overflow-hidden" style={{ height: `${totalHeight}%` }}>
                                            {day.segments.map((seg, sIdx) => {
                                                const segmentHeight = (seg.profitBDT / (day.totalProfitBDT || 1)) * 100;
                                                return (
                                                    <div key={sIdx} className={`${seg.color} border-b border-white/20 relative group/seg transition-all`} style={{ height: `${segmentHeight}%` }}>
                                                        {/* Luxury Tooltip */}
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 hidden group-hover/seg:block z-50 animate-scale-up">
                                                            <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-2xl border border-white/10 ring-[12px] ring-black/5 min-w-[180px]">
                                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 border-b border-white/10 pb-2">{seg.name}</p>
                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between items-center gap-6">
                                                                        <span className="text-[10px] text-slate-400 uppercase font-bold">BDT</span>
                                                                        <span className="text-emerald-400 font-mono font-black text-sm">৳{Math.round(seg.profitBDT).toLocaleString()}</span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center gap-6">
                                                                        <span className="text-[10px] text-slate-400 uppercase font-bold">USD</span>
                                                                        <span className="text-blue-400 font-mono font-black text-sm">${seg.profitUSD.toFixed(2)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="w-4 h-4 bg-slate-900 rotate-45 mx-auto -mt-2.5 border-r border-b border-white/10"></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-white/10 to-transparent"></div>
                                        </div>
                                        
                                        {/* Date Axis Label */}
                                        <div className="absolute top-full mt-6 flex flex-col items-center">
                                            <span className={`font-black text-slate-800 tracking-tighter whitespace-nowrap ${timeframe === 'YEAR' ? 'text-[8px] rotate-45 mt-2 origin-left bg-slate-100 px-1 rounded' : 'text-xs uppercase'}`}>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                <div className="lg:col-span-2 bg-slate-900 p-12 rounded-[4rem] shadow-3xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-[100px] pointer-events-none"></div>
                     <div className="relative z-10">
                        <div className="flex items-center gap-5 mb-10">
                            <div className="p-4 bg-indigo-50/10 rounded-3xl border border-indigo-500/30">
                                <Plus className="h-7 w-7 text-indigo-400" />
                            </div>
                            <h2 className="text-white font-black text-2xl uppercase tracking-widest">Manual Profit Injection</h2>
                        </div>

                        <form onSubmit={handleQuickEntry} className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-2">Ledger Date</label>
                                    <input type="date" className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-5 text-sm text-white focus:ring-4 focus:ring-indigo-500/30 outline-none transition-all" value={entryDate} onChange={e => setEntryDate(e.target.value)}/>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-2">Portfolio Segment</label>
                                    <select 
                                        className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-5 text-sm text-white focus:ring-4 focus:ring-indigo-500/30 outline-none appearance-none"
                                        value={selectedClientId}
                                        onChange={e => setSelectedClientId(e.target.value)}
                                    >
                                        <option value="" className="bg-slate-900 text-gray-400">-- Choose Source --</option>
                                        {allFish.map(f => (<option key={f.id} value={f.id} className="bg-slate-900 text-white">{f.name}</option>))}
                                        <option value="MANUAL" className="bg-slate-900 text-indigo-400 font-bold">+ External Revenue</option>
                                    </select>
                                </div>
                            </div>

                            {selectedClientId === 'MANUAL' && (
                                <div className="space-y-3 animate-slide-up">
                                    <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-2">External Identity</label>
                                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-5 text-sm text-white" value={manualClientName} onChange={e => setManualClientName(e.target.value)} placeholder="Type source name..."/>
                                </div>
                            )}

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-2">Net Profit Amount (BDT)</label>
                                <div className="relative">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-indigo-500 text-2xl">৳</div>
                                    <input type="number" className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-6 pl-14 text-3xl text-white font-mono font-black focus:ring-4 focus:ring-indigo-500/30 outline-none placeholder:text-slate-700" placeholder="0.00" value={entryProfitBDT} onChange={e => setEntryProfitBDT(e.target.value)}/>
                                    {entryProfitBDT && (
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                                            ≈ ${(Number(entryProfitBDT) / exchangeRate).toFixed(2)} USD
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-indigo-900/40 transition-all flex items-center justify-center gap-4 transform active:scale-95 disabled:opacity-50 text-base uppercase tracking-[0.2em]">
                                {isSubmitting ? <RefreshCw className="h-6 w-6 animate-spin"/> : <Check className="h-6 w-6"/>}
                                Commit Transaction
                            </button>
                        </form>
                     </div>
                </div>

                <div className="flex flex-col gap-8">
                    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 flex-1 flex flex-col justify-center">
                        <div className="flex items-start gap-8">
                            <div className="p-5 bg-indigo-50 rounded-[2rem] text-indigo-600 shadow-inner">
                                <Activity size={40} />
                            </div>
                            <div>
                                <h4 className="text-slate-900 font-black text-sm uppercase tracking-widest mb-3">Scroll Instructions</h4>
                                <p className="text-xs text-slate-500 leading-relaxed font-bold">
                                    ড্যাশবোর্ডটি এখন ৩৬৫ দিন পর্যন্ত ডাটা সাপোর্ট করে। অনেক বেশি ডাটা হলে চার্টের নিচে একটি স্ক্রলবার আসবে যা ধরে ডানে টান দিলে আপনি বাকি দিনগুলোর হিসাব দেখতে পারবেন। 
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-10 rounded-[3.5rem] shadow-2xl shadow-indigo-100 flex-1 flex items-center justify-between group">
                        <div className="text-white">
                             <h4 className="font-black text-indigo-200 text-[10px] uppercase tracking-widest mb-2">Benchmark Mark</h4>
                             <p className="text-5xl font-black font-mono tracking-tighter">৳১০,০০০</p>
                             <p className="text-xl font-bold text-indigo-200 mt-1 opacity-80">$৬৯.০০ USD</p>
                             <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase text-emerald-400">
                                <Banknote size={14}/> 50% Visual Height
                             </div>
                        </div>
                        <Layers size={80} className="text-white/10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700" />
                    </div>
                </div>
            </div>
            
            <style>{`
                .custom-scrollbar-horizontal::-webkit-scrollbar {
                    height: 10px;
                }
                .custom-scrollbar-horizontal::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 10px;
                }
                .custom-scrollbar-horizontal::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                    border: 2px solid #f1f5f9;
                }
                .custom-scrollbar-horizontal::-webkit-scrollbar-thumb:hover {
                    background: #6366f1;
                }
            `}</style>
        </div>
    );
};

export default AgencyProfit;
