
import React, { useState, useEffect } from 'react';
import { mockService } from '../services/mockService';
import { SalesEntry, MonthlyTarget, SalesServiceType } from '../types';
import { Target, TrendingUp, Plus, Trash2, Calendar, Users, History, Edit2 } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const SERVICES: { id: SalesServiceType; label: string; color: string }[] = [
    { id: 'FACEBOOK_ADS', label: 'Facebook Ads Service', color: 'blue' },
    { id: 'WEB_DEV', label: 'Website Sales', color: 'green' },
    { id: 'LANDING_PAGE', label: 'Landing Page Service', color: 'pink' },
    { id: 'CONSULTANCY', label: 'Business Consultancy', color: 'purple' },
];

const SalesGoals: React.FC = () => {
    const { formatCurrency } = useCurrency();
    // State
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [targets, setTargets] = useState<MonthlyTarget[]>([]);
    const [entries, setEntries] = useState<SalesEntry[]>([]);
    const [activeTab, setActiveTab] = useState<'goals' | 'history'>('goals');

    // Add/Edit Entry Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
    
    const [newEntryService, setNewEntryService] = useState<SalesServiceType>('FACEBOOK_ADS');
    const [newEntryAmount, setNewEntryAmount] = useState(0);
    const [newEntryDesc, setNewEntryDesc] = useState('');
    const [newEntryDate, setNewEntryDate] = useState(new Date().toISOString().slice(0, 10));

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [t, e] = await Promise.all([
            mockService.getSalesTargets(),
            mockService.getSalesEntries()
        ]);
        setTargets(t);
        setEntries(e);
    };

    // Filtered Data for Selected Month
    const currentMonthEntries = entries.filter(e => e.date.startsWith(selectedMonth));
    
    // Calculations for progress
    const getServiceStats = (serviceId: SalesServiceType) => {
        const target = targets.find(t => t.month === selectedMonth && t.service === serviceId);
        
        const achievedAmount = currentMonthEntries
            .filter(e => e.service === serviceId)
            .reduce((sum, e) => sum + e.amount, 0);
            
        const achievedCount = currentMonthEntries
            .filter(e => e.service === serviceId)
            .length;

        return {
            targetAmount: target?.target_amount || 0,
            targetCount: target?.target_clients || 0,
            achievedAmount,
            achievedCount
        };
    };

    // Handlers
    const handleUpdateTarget = async (service: SalesServiceType, field: 'amount' | 'count', value: string) => {
        const numValue = parseFloat(value) || 0;
        const currentTarget = targets.find(t => t.month === selectedMonth && t.service === service);
        
        await mockService.setSalesTarget({
            month: selectedMonth,
            service,
            target_amount: field === 'amount' ? numValue : (currentTarget?.target_amount || 0),
            target_clients: field === 'count' ? numValue : (currentTarget?.target_clients || 0)
        });
        loadData();
    };

    const openAddModal = () => {
        setEditingEntryId(null);
        setNewEntryService('FACEBOOK_ADS');
        setNewEntryAmount(0);
        setNewEntryDesc('');
        setNewEntryDate(new Date().toISOString().slice(0, 10));
        setIsAddModalOpen(true);
    };

    const openEditModal = (entry: SalesEntry) => {
        setEditingEntryId(entry.id);
        setNewEntryService(entry.service);
        setNewEntryAmount(entry.amount);
        setNewEntryDesc(entry.description);
        setNewEntryDate(entry.date.slice(0, 10)); // Ensure YYYY-MM-DD format
        setIsAddModalOpen(true);
    };

    const handleSaveEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEntryAmount || !newEntryDesc) return alert("Amount and Description required");

        if (editingEntryId) {
            // Update existing
            await mockService.updateSalesEntry(editingEntryId, {
                service: newEntryService,
                amount: newEntryAmount,
                description: newEntryDesc,
                date: newEntryDate
            });
        } else {
            // Create new
            await mockService.addSalesEntry({
                service: newEntryService,
                amount: newEntryAmount,
                description: newEntryDesc,
                date: newEntryDate
            });
        }
        
        setIsAddModalOpen(false);
        setEditingEntryId(null);
        setNewEntryAmount(0); setNewEntryDesc(''); 
        loadData();
    };

    const handleDeleteEntry = async (id: string) => {
        if(window.confirm("Are you sure you want to delete this sales record?")) {
            await mockService.deleteSalesEntry(id);
            loadData();
        }
    };

    return (
        <div className="space-y-6 font-inter">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Target className="mr-2 h-6 w-6 text-indigo-600" /> Sales Goals & Tracking
                    </h1>
                    <p className="text-gray-500 text-sm">Set monthly targets and track your achievements.</p>
                </div>
                
                <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <input 
                        type="month" 
                        className="border-none bg-transparent font-bold text-gray-700 focus:ring-0 cursor-pointer"
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                    />
                </div>
            </div>

            {/* Main Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                <button 
                    onClick={() => setActiveTab('goals')}
                    className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'goals' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Current Month Goals
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'history' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    History & Analytics
                </button>
            </div>

            {/* TAB: GOALS */}
            {activeTab === 'goals' && (
                <div className="space-y-8">
                    {/* Add Button */}
                    <div className="flex justify-end">
                        <button 
                            onClick={openAddModal} 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md flex items-center transition-colors"
                        >
                            <Plus className="h-5 w-5 mr-2" /> Log New Sale
                        </button>
                    </div>

                    {/* Goal Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {SERVICES.map(srv => {
                            const stats = getServiceStats(srv.id);
                            const amountProgress = stats.targetAmount > 0 ? (stats.achievedAmount / stats.targetAmount) * 100 : 0;
                            const countProgress = stats.targetCount > 0 ? (stats.achievedCount / stats.targetCount) * 100 : 0;
                            
                            // Correct Colors Map (Replaced bar- with bg-)
                            const colors: any = {
                                blue: { header: 'bg-blue-50 text-blue-700 border-blue-200', bar: 'bg-blue-500', subBar: 'bg-blue-300' },
                                green: { header: 'bg-green-50 text-green-700 border-green-200', bar: 'bg-green-500', subBar: 'bg-green-300' },
                                pink: { header: 'bg-pink-50 text-pink-700 border-pink-200', bar: 'bg-pink-500', subBar: 'bg-pink-300' },
                                purple: { header: 'bg-purple-50 text-purple-700 border-purple-200', bar: 'bg-purple-500', subBar: 'bg-purple-300' },
                            };
                            const theme = colors[srv.color];

                            return (
                                <div key={srv.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                                    <div className={`p-4 border-b flex justify-between items-center ${theme.header}`}>
                                        <h3 className="font-bold">{srv.label}</h3>
                                        <TrendingUp className="h-5 w-5" />
                                    </div>
                                    
                                    <div className="p-5 flex-1 space-y-6">
                                        {/* Financial Goal */}
                                        <div>
                                            <div className="flex justify-between items-end mb-2">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-500 font-bold uppercase">Revenue Achieved</span>
                                                    <span className="text-2xl font-bold text-gray-800">{formatCurrency(stats.achievedAmount)}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs text-gray-400">Target ($)</span>
                                                    <div className="flex items-center gap-1 justify-end">
                                                        <span className="text-gray-400">$</span>
                                                        <input 
                                                            type="number" 
                                                            className="w-20 text-right border-b border-gray-300 focus:border-indigo-500 focus:outline-none text-sm font-bold text-gray-600 bg-transparent"
                                                            value={stats.targetAmount || ''}
                                                            placeholder="0"
                                                            onChange={(e) => handleUpdateTarget(srv.id, 'amount', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                <div 
                                                    className={`h-2.5 rounded-full transition-all duration-1000 ${theme.bar}`} 
                                                    style={{ width: `${Math.min(amountProgress, 100)}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-right mt-1 text-gray-400">{amountProgress.toFixed(0)}% Done</p>
                                        </div>

                                        {/* Count Goal */}
                                        <div>
                                            <div className="flex justify-between items-end mb-2">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-500 font-bold uppercase">Clients Signed</span>
                                                    <span className="text-xl font-bold text-gray-800">{stats.achievedCount}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs text-gray-400">Target</span>
                                                    <div className="flex items-center gap-1 justify-end">
                                                        <Users className="h-3 w-3 text-gray-400"/>
                                                        <input 
                                                            type="number" 
                                                            className="w-12 text-right border-b border-gray-300 focus:border-indigo-500 focus:outline-none text-sm font-bold text-gray-600 bg-transparent"
                                                            value={stats.targetCount || ''}
                                                            placeholder="0"
                                                            onChange={(e) => handleUpdateTarget(srv.id, 'count', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                <div 
                                                    className={`h-1.5 rounded-full transition-all duration-1000 ${theme.subBar}`} 
                                                    style={{ width: `${Math.min(countProgress, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Current Month Log */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b bg-gray-50 font-bold text-gray-700">
                            Sales Log - {new Date(selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Service</th>
                                    <th className="px-6 py-3">Description / Client</th>
                                    <th className="px-6 py-3 text-right">Amount</th>
                                    <th className="px-6 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {currentMonthEntries.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">No sales logged this month.</td></tr>
                                ) : (
                                    currentMonthEntries.map(entry => (
                                        <tr key={entry.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-3 text-gray-600">{new Date(entry.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-bold 
                                                    ${entry.service === 'FACEBOOK_ADS' ? 'bg-blue-100 text-blue-700' : 
                                                      entry.service === 'WEB_DEV' ? 'bg-green-100 text-green-700' : 
                                                      entry.service === 'LANDING_PAGE' ? 'bg-pink-100 text-pink-700' : 'bg-purple-100 text-purple-700'}`}>
                                                    {SERVICES.find(s => s.id === entry.service)?.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 font-medium text-gray-900">{entry.description}</td>
                                            <td className="px-6 py-3 text-right font-mono text-green-600 font-bold">{formatCurrency(entry.amount)}</td>
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => openEditModal(entry)} className="p-1 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50" title="Edit">
                                                        <Edit2 className="h-4 w-4"/>
                                                    </button>
                                                    <button onClick={() => handleDeleteEntry(entry.id)} className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50" title="Delete">
                                                        <Trash2 className="h-4 w-4"/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB: HISTORY */}
            {activeTab === 'history' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-6 text-gray-500">
                        <History className="h-5 w-5" />
                        <span className="text-sm">Aggregated Performance Data (All Time)</span>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Month</th>
                                    <th className="px-4 py-3 text-center">FB Ads Rev</th>
                                    <th className="px-4 py-3 text-center">Web Dev Rev</th>
                                    <th className="px-4 py-3 text-center">Landing Page Rev</th>
                                    <th className="px-4 py-3 text-center">Consultancy Rev</th>
                                    <th className="px-4 py-3 text-right rounded-r-lg bg-gray-200">Total Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {/* Aggregate entries by month */}
                                {Array.from(new Set(entries.map(e => e.date.slice(0, 7)))).sort().reverse().map(monthStr => {
                                    const monthEntries = entries.filter(e => e.date.startsWith(monthStr));
                                    const total = monthEntries.reduce((sum, e) => sum + e.amount, 0);
                                    
                                    const getSum = (srv: SalesServiceType) => monthEntries.filter(e => e.service === srv).reduce((s, e) => s + e.amount, 0);

                                    return (
                                        <tr key={monthStr} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-bold text-gray-900">
                                                {new Date(monthStr + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
                                            </td>
                                            <td className="px-4 py-3 text-center text-blue-600">{formatCurrency(getSum('FACEBOOK_ADS'))}</td>
                                            <td className="px-4 py-3 text-center text-green-600">{formatCurrency(getSum('WEB_DEV'))}</td>
                                            <td className="px-4 py-3 text-center text-pink-600">{formatCurrency(getSum('LANDING_PAGE'))}</td>
                                            <td className="px-4 py-3 text-center text-purple-600">{formatCurrency(getSum('CONSULTANCY'))}</td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900 bg-gray-50">{formatCurrency(total)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL: ADD / EDIT ENTRY */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
                            <h3 className="font-bold flex items-center">
                                <TrendingUp className="mr-2 h-5 w-5"/> 
                                {editingEntryId ? 'Edit Sale Record' : 'Log Completed Sale'}
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-white/80 hover:text-white"><Plus className="h-5 w-5 transform rotate-45"/></button>
                        </div>
                        <form onSubmit={handleSaveEntry} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-lg p-2.5"
                                    value={newEntryService}
                                    onChange={e => setNewEntryService(e.target.value as SalesServiceType)}
                                >
                                    {SERVICES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sale Amount ($ USD)</label>
                                <input 
                                    type="number"
                                    className="w-full border border-gray-300 rounded-lg p-2.5"
                                    placeholder="e.g. 100"
                                    value={newEntryAmount || ''}
                                    onChange={e => setNewEntryAmount(parseFloat(e.target.value))}
                                />
                                <p className="text-xs text-gray-500 mt-1">Please enter amount in Dollars ($).</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client / Description</label>
                                <input 
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg p-2.5"
                                    placeholder="e.g. Fashion House - June Campaign"
                                    value={newEntryDesc}
                                    onChange={e => setNewEntryDesc(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input 
                                    type="date"
                                    className="w-full border border-gray-300 rounded-lg p-2.5"
                                    value={newEntryDate}
                                    onChange={e => setNewEntryDate(e.target.value)}
                                />
                            </div>
                            <div className="pt-2">
                                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-md transition-colors">
                                    {editingEntryId ? 'Update Record' : 'Record Sale'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesGoals;
