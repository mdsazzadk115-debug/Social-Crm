
import React, { useEffect, useState } from 'react';
import { Users, ShoppingBag, CheckSquare, FileText, Calculator, Zap, Wallet, ArrowUpRight, ArrowDownRight, Filter, Download, BarChart2, Phone, Globe, Layers, TrendingUp, AlertTriangle, Copy, Check, Repeat, RefreshCw } from 'lucide-react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { mockService } from '../services/mockService';
import { Lead, LeadStatus, BigFish, Invoice, Task, Snippet, Customer, SalesEntry, MonthlyTarget, SalesServiceType } from '../types';
import { STATUS_LABELS } from '../constants';
import { useCurrency } from '../context/CurrencyContext';

// --- COMPONENTS ---

const FinancialCard = ({ title, deposit, spent, period, format }: { title: string, deposit: number, spent: number, period: string, format: (n:number)=>string }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between h-full hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</h3>
                <span className="text-[10px] text-gray-400">{period}</span>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Wallet className="h-5 w-5" />
            </div>
        </div>
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <div className="flex items-center text-green-600">
                    <div className="p-1 bg-green-100 rounded mr-2"><ArrowUpRight className="h-3 w-3" /></div>
                    <span className="text-xs font-bold uppercase">Deposit</span>
                </div>
                <span className="text-lg font-mono font-bold text-gray-900">{format(deposit)}</span>
            </div>
            <div className="w-full bg-gray-100 h-px"></div>
            <div className="flex justify-between items-center">
                <div className="flex items-center text-amber-600">
                    <div className="p-1 bg-amber-100 rounded mr-2"><ArrowDownRight className="h-3 w-3" /></div>
                    <span className="text-xs font-bold uppercase">Spent</span>
                </div>
                <span className="text-lg font-mono font-bold text-gray-900">{format(spent)}</span>
            </div>
        </div>
    </div>
);

const MiniListHeader = ({ title, icon: Icon, link, count, colorClass = "text-indigo-500" }: { title: string, icon: any, link: string, count?: number, colorClass?: string }) => (
    <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
        <h3 className="font-bold text-gray-800 flex items-center text-sm">
            <Icon className={`h-4 w-4 mr-2 ${colorClass}`} /> {title}
            {count !== undefined && <span className="ml-2 bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full">{count}</span>}
        </h3>
        <Link to={link} className="text-[10px] font-bold text-indigo-600 hover:underline">View All</Link>
    </div>
);

// High Contrast Funnel Colors
const FUNNEL_THEMES: Record<string, string> = {
    [LeadStatus.NEW]: "bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-blue-200 border-blue-600",
    [LeadStatus.ATTEMPTED_CONTACT]: "bg-gradient-to-r from-amber-500 to-yellow-400 text-white shadow-amber-200 border-amber-600",
    [LeadStatus.INTERESTED]: "bg-gradient-to-r from-indigo-600 to-violet-500 text-white shadow-indigo-200 border-indigo-600",
    [LeadStatus.HOT]: "bg-gradient-to-r from-orange-600 to-red-500 text-white shadow-orange-200 border-orange-600",
    [LeadStatus.CLOSED_WON]: "bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-emerald-200 border-emerald-600",
};

const Dashboard: React.FC = () => {
  const { formatCurrency, exchangeRate } = useCurrency(); // Use Context

  // Data States
  const [activeFish, setActiveFish] = useState<BigFish[]>([]);
  const [lowBalanceFish, setLowBalanceFish] = useState<BigFish[]>([]); 
  const [retainerRenewals, setRetainerRenewals] = useState<BigFish[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  
  // Sales Goals Data
  const [salesEntries, setSalesEntries] = useState<SalesEntry[]>([]);
  const [salesTargets, setSalesTargets] = useState<MonthlyTarget[]>([]);

  // Financial State
  const [financials, setFinancials] = useState({
      week: { deposit: 0, spent: 0 },
      sixMonths: { deposit: 0, spent: 0 },
      life: { deposit: 0, spent: 0 }
  });

  // Sales Intelligence State
  const [salesFilter, setSalesFilter] = useState<'30_DAYS' | '6_MONTHS' | 'LIFETIME' | 'CUSTOM'>('30_DAYS');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Calculator Widget State
  const [calcUsd, setCalcUsd] = useState(1);
  const [calcRate, setCalcRate] = useState(exchangeRate);

  // UI State
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
      setCalcRate(exchangeRate);
  }, [exchangeRate]);

  const loadAllData = async () => {
    const [f, c, i, t, sn, se, l, st, renew] = await Promise.all([
        mockService.getBigFish(),
        mockService.getCustomers(),
        mockService.getInvoices(),
        mockService.getTasks(),
        mockService.getSnippets(),
        mockService.getSalesEntries(),
        mockService.getLeads(),
        mockService.getSalesTargets(),
        mockService.checkRetainerRenewals()
    ]);
    
    // Process Big Fish Data
    const sortedFish = [...f].sort((a, b) => (b.spent_amount || 0) - (a.spent_amount || 0));
    const allActiveFish = sortedFish.filter(x => x.status === 'Active Pool');
    
    // 1. Top Active Fish (for main table)
    setActiveFish(allActiveFish.slice(0, 10));

    // 2. Low Balance Fish (< $20) - Max 20 items
    const lowBal = allActiveFish
        .filter(fish => (fish.balance || 0) < 20)
        .sort((a, b) => (a.balance || 0) - (b.balance || 0)) // Sort lowest balance first
        .slice(0, 20);
    setLowBalanceFish(lowBal);

    setRetainerRenewals(renew);

    setCustomers(c.slice(0, 5)); 
    setInvoices(i.slice(0, 5)); 
    setTasks(t); 
    setSnippets(sn.slice(0, 5)); 
    setLeads(l);
    setSalesEntries(se);
    setSalesTargets(st);

    // Calculate Financials
    calculateFinancials(f);

    setLoading(false);
  };

  const handleRenewRetainer = async (id: string) => {
      if(confirm("Renew this subscription for another 30 days?")) {
          await mockService.renewRetainer(id);
          alert("Success! Create an invoice now.");
          loadAllData();
      }
  };

  const calculateFinancials = (allFish: BigFish[]) => {
      const now = new Date();
      const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7);
      const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(now.getMonth() - 6);

      const stats = {
          week: { deposit: 0, spent: 0 },
          sixMonths: { deposit: 0, spent: 0 },
          life: { deposit: 0, spent: 0 }
      };

      allFish.forEach(fish => {
          fish.transactions.forEach(tx => {
              const txDate = new Date(tx.date);
              const amount = tx.amount || 0; // Amount is always in USD based on system design

              // Lifetime
              if (tx.type === 'DEPOSIT') stats.life.deposit += amount;
              if (tx.type === 'AD_SPEND') stats.life.spent += amount;

              // 6 Months
              if (txDate >= sixMonthsAgo) {
                  if (tx.type === 'DEPOSIT') stats.sixMonths.deposit += amount;
                  if (tx.type === 'AD_SPEND') stats.sixMonths.spent += amount;
              }

              // 7 Days
              if (txDate >= weekAgo) {
                  if (tx.type === 'DEPOSIT') stats.week.deposit += amount;
                  if (tx.type === 'AD_SPEND') stats.week.spent += amount;
              }
          });
      });

      setFinancials(stats);
  };

  // --- SALES REPORT LOGIC ---
  const getFilteredSales = (): SalesEntry[] => {
      const now = new Date();
      let start = new Date(0); // Epoch
      let end = new Date();

      if (salesFilter === '30_DAYS') {
          start.setDate(now.getDate() - 30);
      } else if (salesFilter === '6_MONTHS') {
          start.setMonth(now.getMonth() - 6);
      } else if (salesFilter === 'CUSTOM') {
          if (customStartDate) start = new Date(customStartDate);
          if (customEndDate) end = new Date(customEndDate);
      }

      return salesEntries.filter(entry => {
          const d = new Date(entry.date);
          return d >= start && d <= end;
      });
  };

  const filteredSales = getFilteredSales();
  const totalRevenue = filteredSales.reduce((sum, e) => sum + e.amount, 0); // e.amount is in USD
  const totalSalesCount = filteredSales.length;

  // --- SALES GRAPH DATA (Grouped by Day or Month) ---
  const getSalesGraphData = (): [string, number][] => {
      // Simple aggregation: Last 10 points based on filter
      const data: Record<string, number> = {};
      filteredSales.forEach(e => {
          const key = salesFilter === 'LIFETIME' || salesFilter === '6_MONTHS' 
              ? e.date.slice(0, 7) // YYYY-MM
              : e.date.slice(5, 10); // MM-DD
          data[key] = (data[key] || 0) + e.amount;
      });
      return Object.entries(data).sort().slice(-15); // Show last 15 points
  };
  const salesGraphData = getSalesGraphData();
  const maxSalesVal = Math.max(...salesGraphData.map(d => d[1]), 100);

  // --- FUNNEL LOGIC ---
  const downloadNumbers = (filteredLeads: Lead[], filename: string) => {
      if (filteredLeads.length === 0) return alert("No leads to download.");
      const csvContent = [
          ['Name', 'Phone', 'Industry', 'Status'],
          ...filteredLeads.map(l => [`"${l.full_name}"`, `"${l.primary_phone}"`, `"${l.industry || ''}"`, `"${l.status}"`])
      ].map(e => e.join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const statusFunnel = [
      LeadStatus.NEW,
      LeadStatus.ATTEMPTED_CONTACT,
      LeadStatus.INTERESTED,
      LeadStatus.HOT,
      LeadStatus.CLOSED_WON
  ];

  const industryGroups: Record<string, Lead[]> = leads.reduce((acc, lead) => {
      const ind = lead.industry || 'Unknown';
      if (!acc[ind]) acc[ind] = [];
      acc[ind].push(lead);
      return acc;
  }, {} as Record<string, Lead[]>);

  // Top 5 Industries
  const topIndustries: [string, Lead[]][] = Object.entries(industryGroups)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5);

  const handleCopySnippet = (id: string, text: string) => {
      navigator.clipboard.writeText(text);
      setCopiedSnippetId(id);
      setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">⏳ Loading dashboard cockpit...</div>;

  // Quick Links
  const quickLinks = [
      { name: 'Big Fish', path: '/big-fish', emoji: '🐟', bg: 'bg-indigo-600', text: 'text-white' },
      { name: 'Leads', path: '/leads', icon: Users, bg: 'bg-blue-100', text: 'text-blue-600' },
      { name: 'Invoices', path: '/invoices', icon: FileText, bg: 'bg-orange-100', text: 'text-orange-600' },
      { name: 'Tasks', path: '/tasks', icon: CheckSquare, bg: 'bg-yellow-100', text: 'text-yellow-600' },
      { name: 'Customers', path: '/customers', icon: ShoppingBag, bg: 'bg-purple-100', text: 'text-purple-600' },
      { name: 'Calc', path: '/calculators', icon: Calculator, bg: 'bg-pink-100', text: 'text-pink-600' },
  ];

  return (
    <div className="space-y-6 font-inter">
      
      {/* 1. FINANCIAL SUMMARY SECTION (TOP) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FinancialCard 
            title="Weekly Flow" 
            period="Last 7 Days"
            deposit={financials.week.deposit} 
            spent={financials.week.spent} 
            format={formatCurrency}
          />
          <FinancialCard 
            title="Half-Yearly Flow" 
            period="Last 6 Months"
            deposit={financials.sixMonths.deposit} 
            spent={financials.sixMonths.spent} 
            format={formatCurrency}
          />
          <FinancialCard 
            title="Lifetime Agency Value" 
            period="All Time"
            deposit={financials.life.deposit} 
            spent={financials.life.spent} 
            format={formatCurrency}
          />
      </div>

      {/* 2. MONTHLY GOAL TRACKER (UPDATED) */}
      <div className="bg-white rounded-xl border border-indigo-100 shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-gray-700 flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4 text-indigo-600"/> Monthly Goal Tracker
              </h3>
              <Link to="/sales-goals" className="text-xs text-indigo-600 font-bold hover:underline">Manage Goals</Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {['FACEBOOK_ADS', 'WEB_DEV', 'LANDING_PAGE', 'CONSULTANCY'].map(service => {
                  const srvId = service as SalesServiceType;
                  const month = new Date().toISOString().slice(0, 7);
                  
                  // Calculate Achievement
                  const entrySum = salesEntries
                      .filter(e => e.date.startsWith(month) && e.service === srvId)
                      .reduce((s, e) => s + e.amount, 0);
                  
                  // Get Target
                  const targetObj = salesTargets.find(t => t.month === month && t.service === srvId);
                  const targetAmount = targetObj?.target_amount || 0;

                  // Calculate Progress
                  const progress = targetAmount > 0 ? (entrySum / targetAmount) * 100 : 0;

                  return (
                      <div key={service} className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex flex-col relative overflow-hidden">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1 z-10">{service.replace('_', ' ')}</span>
                          
                          <div className="flex justify-between items-end z-10 mb-1">
                              <span className="text-lg font-bold text-indigo-700">{formatCurrency(entrySum)}</span>
                              <span className="text-xs text-gray-400 font-medium mb-1">/ {formatCurrency(targetAmount)}</span>
                          </div>
                          
                          <div className="w-full bg-gray-200 h-2 rounded-full mt-1 overflow-hidden z-10">
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ${progress >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`} 
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              ></div>
                          </div>
                          <span className="text-[9px] text-gray-400 mt-1 text-right z-10">{progress.toFixed(0)}% Achieved</span>
                      </div>
                  )
              })}
          </div>
      </div>

      {/* 3. SALES INTELLIGENCE (UPDATED VISUALS) */}
      <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-white to-indigo-50/50">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                        <BarChart2 className="mr-2 h-5 w-5 text-indigo-600"/> Sales Intelligence
                    </h3>
                    <p className="text-xs text-gray-500">Track total revenue and sales count over time.</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    <div className="bg-white border border-gray-200 rounded-lg p-1 flex shadow-sm">
                        <button onClick={() => setSalesFilter('30_DAYS')} className={`text-xs font-bold px-3 py-1.5 rounded transition-colors ${salesFilter === '30_DAYS' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>30 Days</button>
                        <button onClick={() => setSalesFilter('6_MONTHS')} className={`text-xs font-bold px-3 py-1.5 rounded transition-colors ${salesFilter === '6_MONTHS' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>6 Months</button>
                        <button onClick={() => setSalesFilter('LIFETIME')} className={`text-xs font-bold px-3 py-1.5 rounded transition-colors ${salesFilter === 'LIFETIME' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>Lifetime</button>
                        <button onClick={() => setSalesFilter('CUSTOM')} className={`text-xs font-bold px-3 py-1.5 rounded transition-colors ${salesFilter === 'CUSTOM' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>Custom</button>
                    </div>
                    {salesFilter === 'CUSTOM' && (
                        <div className="flex gap-1">
                            <input type="date" className="border border-gray-300 rounded text-xs p-1" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} />
                            <input type="date" className="border border-gray-300 rounded text-xs p-1" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} />
                        </div>
                    )}
                </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">
              {/* Stats */}
              <div className="lg:col-span-1 space-y-6">
                  <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100">
                      <p className="text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">Total Revenue</p>
                      <h2 className="text-3xl font-mono font-bold text-indigo-900">{formatCurrency(totalRevenue)}</h2>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-5 border border-purple-100">
                      <p className="text-purple-600 text-xs font-bold uppercase tracking-wider mb-1">Total Sales Count</p>
                      <h2 className="text-3xl font-mono font-bold text-purple-900">{totalSalesCount}</h2>
                  </div>
              </div>

              {/* Chart - Dynamic Columns */}
              <div className="lg:col-span-2 h-64 flex items-end justify-between gap-3 px-4 pb-4 border-b border-gray-200 relative bg-gray-50/30 rounded-lg">
                  {/* Background Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 pb-8 px-4">
                        <div className="border-t border-gray-400 w-full"></div>
                        <div className="border-t border-gray-400 w-full"></div>
                        <div className="border-t border-gray-400 w-full"></div>
                        <div className="border-t border-gray-400 w-full"></div>
                  </div>

                  {salesGraphData.length === 0 && <p className="w-full text-center text-gray-400 absolute top-1/2 left-0 right-0">No data for this period.</p>}
                  
                  {salesGraphData.map(([date, amount], idx) => {
                      const height = (amount / maxSalesVal) * 100;
                      return (
                          <div key={idx} className="flex-1 flex flex-col justify-end items-center group relative z-10 h-full">
                              {/* The Column */}
                              <div 
                                className="w-full max-w-[30px] sm:max-w-[50px] bg-gradient-to-t from-indigo-600 to-cyan-400 rounded-t-lg shadow-[0_4px_10px_rgba(79,70,229,0.3)] transition-all duration-700 ease-out hover:brightness-110 hover:shadow-lg relative group-hover:scale-y-105 origin-bottom"
                                style={{ height: `${Math.max(height, 5)}%` }} // Minimum 5% height
                              >
                                  {/* Tooltip on Hover */}
                                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl pointer-events-none z-20">
                                      {formatCurrency(amount)}
                                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                  </div>
                              </div>
                              {/* Date Label */}
                              <span className="text-[9px] sm:text-[10px] text-gray-500 mt-3 font-mono font-medium">{date}</span>
                          </div>
                      )
                  })}
              </div>
          </div>
      </div>

      {/* 4. LEAD FUNNELS & SEGMENTATION (UPDATED UI) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Funnel 1: Sales Pipeline */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-gray-900 flex items-center"><Filter className="mr-2 h-5 w-5 text-indigo-600"/> Lead Pipeline</h3>
                  <p className="text-xs text-gray-500">Conversion Flow</p>
              </div>
              
              <div className="space-y-4">
                  {statusFunnel.map((status, index) => {
                      const count = leads.filter(l => l.status === status).length;
                      const percentage = leads.length > 0 ? (count / leads.length) * 100 : 0;
                      // Visual tapering for funnel effect
                      const width = 100 - (index * 8); 
                      const themeClass = FUNNEL_THEMES[status] || "bg-gray-400 text-white";
                      
                      return (
                          <div key={status} className="relative group mb-1">
                              <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1 px-1">
                                  <span>{STATUS_LABELS[status]}</span>
                                  <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{count}</span>
                              </div>
                              <div 
                                className={`h-9 mx-auto relative flex items-center justify-center rounded-lg shadow-sm border-t border-b border-l border-r border-white/20 transition-all hover:scale-[1.02] ${themeClass}`} 
                                style={{ width: `${width}%` }}
                              >
                                  <span className="text-[10px] font-bold opacity-95">{percentage.toFixed(0)}%</span>
                                  
                                  {/* Download Button on Hover */}
                                  <div className="absolute -right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                      <button 
                                        onClick={() => downloadNumbers(leads.filter(l => l.status === status), `leads_${status}`)}
                                        className="bg-gray-800 text-white p-1.5 rounded-full shadow-md text-xs hover:bg-black"
                                        title="Download List"
                                      >
                                          <Download className="h-3 w-3"/>
                                      </button>
                                  </div>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>

          {/* Funnel 2: Industry / Department Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-gray-900 flex items-center"><Layers className="mr-2 h-5 w-5 text-purple-600"/> Department / Industry</h3>
                  <p className="text-xs text-gray-500">Top 5 Segments</p>
              </div>

              <div className="space-y-4">
                  {topIndustries.map(([industry, segmentLeads]: [string, Lead[]]) => {
                      const phoneCount = segmentLeads.filter(l => l.primary_phone).length;
                      const webCount = segmentLeads.filter(l => l.website_url).length;
                      const maxCount = topIndustries[0][1].length;
                      const barWidth = (segmentLeads.length / maxCount) * 100;

                      return (
                          <div key={industry}>
                              <div className="flex justify-between items-end mb-1 text-xs">
                                  <span className="font-bold text-gray-700 truncate max-w-[200px]">{industry.split('(')[0]}</span>
                                  <div className="flex gap-2 text-gray-400">
                                      <span className="flex items-center"><Phone className="h-3 w-3 mr-1"/>{phoneCount}</span>
                                      <span className="flex items-center"><Globe className="h-3 w-3 mr-1"/>{webCount}</span>
                                  </div>
                              </div>
                              <div className="flex items-center gap-3">
                                  <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                                      <div className="bg-purple-500 h-full rounded-full" style={{ width: `${barWidth}%` }}></div>
                                  </div>
                                  <span className="text-xs font-bold text-gray-900 w-8">{segmentLeads.length}</span>
                                  <button 
                                    onClick={() => downloadNumbers(segmentLeads, `industry_${industry}`)}
                                    className="p-1.5 bg-gray-100 hover:bg-purple-100 text-gray-500 hover:text-purple-600 rounded transition-colors"
                                    title="Download List"
                                  >
                                      <Download className="h-4 w-4"/>
                                  </button>
                              </div>
                          </div>
                      )
                  })}
              </div>
          </div>
      </div>

      {/* 5. QUICK MENU & CALCULATOR WIDGET */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Quick Menu */}
          <div className="lg:col-span-3 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Quick Navigation</h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                    {quickLinks.map((link) => (
                        <Link 
                            key={link.name} 
                            to={link.path}
                            className="flex flex-col items-center justify-center text-center group"
                        >
                            <div className={`w-12 h-12 rounded-xl mb-2 flex items-center justify-center transition-transform group-hover:scale-110 ${link.bg} ${link.text}`}>
                                {link.icon ? <link.icon className="h-6 w-6" /> : <span className="text-xl">{link.emoji}</span>}
                            </div>
                            <span className="text-xs font-bold text-gray-600 group-hover:text-indigo-600">{link.name}</span>
                        </Link>
                    ))}
                </div>
          </div>

          {/* Mini Calculator Widget */}
          <div className="lg:col-span-1 bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 rounded-xl shadow-md text-white flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm flex items-center"><Calculator className="h-4 w-4 mr-2"/> Quick Convert</h3>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs w-8 text-indigo-200">USD</span>
                        <input 
                            type="number" 
                            value={calcUsd}
                            onChange={e => setCalcUsd(parseFloat(e.target.value))}
                            className="w-full bg-indigo-900/50 border border-indigo-500 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-white"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs w-8 text-indigo-200">Rate</span>
                        <input 
                            type="number" 
                            value={calcRate}
                            onChange={e => setCalcRate(parseFloat(e.target.value))}
                            className="w-full bg-indigo-900/50 border border-indigo-500 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-white"
                        />
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-indigo-500/50 text-center">
                    <span className="text-xs text-indigo-300 block">Total BDT</span>
                    <span className="text-2xl font-bold">৳ {(calcUsd * calcRate).toLocaleString()}</span>
                </div>
          </div>
      </div>

      {/* 6. DAILY TASKS (HIGHLIGHTED) */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                      <CheckSquare className="h-6 w-6"/>
                  </div>
                  <div>
                      <h3 className="text-lg font-bold text-gray-900">Daily Priority Tasks</h3>
                      <p className="text-xs text-amber-700 font-medium">Don't forget your regular activities!</p>
                  </div>
              </div>
              <Link to="/tasks" className="group flex items-center bg-white border border-amber-200 text-amber-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-amber-100 transition-all">
                  Manage Checklist <ArrowUpRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform"/>
              </Link>
          </div>

          {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 bg-white/60 rounded-xl border-2 border-dashed border-amber-100">
                  <div className="bg-amber-100 p-3 rounded-full mb-3">
                      <CheckSquare className="h-6 w-6 text-amber-500" />
                  </div>
                  <p className="text-gray-500 font-medium">All caught up! No pending tasks.</p>
                  <Link to="/tasks" className="text-sm text-indigo-600 font-bold hover:underline mt-1">Add a new task</Link>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tasks.map(t => (
                      <div key={t.id} className={`p-4 rounded-xl border transition-all flex items-start gap-3 shadow-sm ${t.is_completed ? 'bg-gray-50 border-gray-100 opacity-70' : 'bg-white border-amber-100 hover:border-amber-300 hover:shadow-md'}`}>
                          <div className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${t.is_completed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                              {t.is_completed && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <div className="flex-1">
                              <p className={`text-sm font-bold ${t.is_completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                  {t.text}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-1 font-mono">
                                  {new Date(t.created_at).toLocaleDateString()} • {new Date(t.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>

      {/* 7. MAIN DATA GRID (Remaining Tables) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
              
              {/* BIG FISH ACTIVE (10) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                      <MiniListHeader title="Active Big Fish (Top 10)" icon={Users} link="/big-fish" count={activeFish.length} />
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                              <tr>
                                  <th className="px-4 py-2">Client</th>
                                  <th className="px-4 py-2 text-right">Balance</th>
                                  <th className="px-4 py-2 text-right">Spent</th>
                                  <th className="px-4 py-2 text-right">Status</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {activeFish.map(f => (
                                  <tr key={f.id} className="hover:bg-gray-50">
                                      <td className="px-4 py-2 font-medium text-gray-900">
                                          {f.name}
                                          <div className="text-[10px] text-gray-400">{f.package_name}</div>
                                      </td>
                                      <td className="px-4 py-2 text-right font-mono text-gray-700">{formatCurrency(f.balance || 0)}</td>
                                      <td className="px-4 py-2 text-right font-mono text-gray-500">{formatCurrency(f.spent_amount || 0)}</td>
                                      <td className="px-4 py-2 text-right">
                                          <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>

              {/* LATEST INVOICES (5) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                      <MiniListHeader title="Latest Invoices" icon={FileText} link="/invoices" count={invoices.length} />
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                              <tr>
                                  <th className="px-4 py-2">#</th>
                                  <th className="px-4 py-2">Client</th>
                                  <th className="px-4 py-2 text-right">Total</th>
                                  <th className="px-4 py-2 text-right">Status</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {invoices.map(inv => {
                                  const total = inv.items.reduce((sum, i) => sum + (i.rate * i.quantity), 0);
                                  return (
                                      <tr key={inv.id} className="hover:bg-gray-50">
                                          <td className="px-4 py-2 text-xs text-gray-500">{inv.number}</td>
                                          <td className="px-4 py-2 font-medium text-gray-800">{inv.client_name}</td>
                                          <td className="px-4 py-2 text-right font-mono text-gray-700">{formatCurrency(total)}</td>
                                          <td className="px-4 py-2 text-right">
                                              <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                  {inv.status}
                                              </span>
                                          </td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  </div>
              </div>

          </div>

          {/* RIGHT COLUMN (1/3 width) */}
          <div className="space-y-6">
              
              {/* LOW BALANCE ALERT (<$20) - NOW AT TOP OF COLUMN */}
              <div className="bg-red-50 rounded-xl shadow-sm border border-red-100 overflow-hidden">
                  <div className="p-4 border-b border-red-100 flex items-center justify-between">
                      <h3 className="font-bold text-red-800 flex items-center text-sm">
                          <AlertTriangle className="h-4 w-4 mr-2 text-red-600" /> Low Balance ({'< $20'})
                      </h3>
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{lowBalanceFish.length}</span>
                  </div>
                  <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                      {lowBalanceFish.length === 0 ? (
                          <p className="p-4 text-xs text-red-400 text-center">No clients under $20.</p>
                      ) : (
                          <div className="divide-y divide-red-100">
                              {lowBalanceFish.map(fish => (
                                  <div key={fish.id} className="p-3 flex justify-between items-center hover:bg-red-100/50 transition-colors">
                                      <div>
                                          <p className="text-xs font-bold text-gray-800 truncate w-32" title={fish.name}>{fish.name}</p>
                                          <p className="text-[10px] text-gray-500">{fish.phone}</p>
                                      </div>
                                      <span className="text-xs font-mono font-bold text-red-600 bg-white px-2 py-1 rounded border border-red-100 shadow-sm">
                                          {formatCurrency(fish.balance || 0)}
                                      </span>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>

              {/* RETAINER RENEWAL ALERTS (NEW) */}
              <div className="bg-purple-50 rounded-xl shadow-sm border border-purple-100 overflow-hidden">
                  <div className="p-4 border-b border-purple-100 flex items-center justify-between">
                      <h3 className="font-bold text-purple-800 flex items-center text-sm">
                          <Repeat className="h-4 w-4 mr-2 text-purple-600" /> Upcoming Subscriptions
                      </h3>
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{retainerRenewals.length}</span>
                  </div>
                  <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                      {retainerRenewals.length === 0 ? (
                          <p className="p-4 text-xs text-purple-400 text-center">No renewals in next 7 days.</p>
                      ) : (
                          <div className="divide-y divide-purple-100">
                              {retainerRenewals.map(fish => (
                                  <div key={fish.id} className="p-3 hover:bg-purple-100/50 transition-colors">
                                      <div className="flex justify-between items-start mb-1">
                                          <div>
                                              <p className="text-xs font-bold text-gray-800 truncate w-24" title={fish.name}>{fish.name}</p>
                                              <p className="text-[10px] text-purple-600 font-bold">{new Date(fish.retainer_renewal_date!).toLocaleDateString()}</p>
                                          </div>
                                          <div className="text-right">
                                              <span className="text-xs font-mono font-bold text-gray-700">{formatCurrency(fish.retainer_amount || 0)}</span>
                                          </div>
                                      </div>
                                      <button 
                                        onClick={() => handleRenewRetainer(fish.id)}
                                        className="w-full mt-1 bg-white border border-purple-200 text-purple-700 text-[10px] font-bold py-1 rounded hover:bg-purple-600 hover:text-white transition-colors flex items-center justify-center"
                                      >
                                          <RefreshCw className="h-3 w-3 mr-1"/> Renew (+30 Days)
                                      </button>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>

              {/* QUICK MESSAGES (5) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-blue-50">
                      <MiniListHeader title="Quick Snippets" icon={Zap} link="/snippets" colorClass="text-blue-600" />
                  </div>
                  <div className="divide-y divide-gray-100">
                      {snippets.map(s => (
                          <div 
                            key={s.id} 
                            onClick={() => handleCopySnippet(s.id, s.body)}
                            className="p-3 hover:bg-blue-50 cursor-pointer group transition-colors relative"
                            title="Click to copy"
                          >
                              <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs font-bold text-gray-700">{s.title}</span>
                                  {copiedSnippetId === s.id ? (
                                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold flex items-center animate-pulse">
                                          <Check className="h-3 w-3 mr-1" /> Copied
                                      </span>
                                  ) : (
                                      <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 group-hover:bg-white">{s.category}</span>
                                  )}
                              </div>
                              <p className="text-[10px] text-gray-500 line-clamp-1 group-hover:text-blue-600">{s.body}</p>
                              
                              {/* Hover Copy Icon */}
                              <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <Copy className="h-3 w-3 text-blue-400" />
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* ONLINE CUSTOMERS (5) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                      <MiniListHeader title="Online Customers" icon={ShoppingBag} link="/customers" count={customers.length} />
                  </div>
                  <div className="divide-y divide-gray-100">
                      {customers.map(c => (
                          <div key={c.id} className="p-3 hover:bg-gray-50 flex justify-between items-center">
                              <div>
                                  <p className="text-xs font-mono font-bold text-gray-800">{c.phone}</p>
                                  <span className="text-[9px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">{c.category}</span>
                              </div>
                              <span className="text-[10px] text-gray-400">{new Date(c.date_added).toLocaleDateString()}</span>
                          </div>
                      ))}
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
};

export default Dashboard;
