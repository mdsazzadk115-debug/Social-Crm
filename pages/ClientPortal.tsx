
import React, { useEffect, useState, useRef } from 'react';
// @ts-ignore
import { useParams } from 'react-router-dom';
import { mockService } from '../services/mockService';
import { BigFish, PaymentMethod, SystemSettings } from '../types';
import { DollarSign, Calendar, CheckCircle, ShieldCheck, Target, AlertTriangle, CreditCard, Lock, List, BarChart2, Download, Building, Smartphone, Copy, Check, Calculator, ChevronLeft, ChevronRight, Phone, Globe, Users, PlusCircle, UploadCloud, X, MessageCircle, ShoppingBag, TrendingUp, Table, Filter } from 'lucide-react';

const SimpleChart = ({ data, colorClass, labelKey, valueKey, valuePrefix = '', valueSuffix = '' }: any) => {
    if (!data || data.length === 0) return <div className="h-48 flex items-center justify-center text-gray-400 text-xs">No data for graph</div>;
    const maxValue = Math.max(...data.map((d: any) => d[valueKey]), 1);
    return (
        <div className="h-56 flex items-end justify-between gap-2 pt-8 pb-2 px-2">
            {data.map((item: any, idx: number) => {
                const height = (item[valueKey] / maxValue) * 100;
                return (
                    <div key={idx} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {new Date(item[labelKey]).toLocaleDateString()}: {valuePrefix}{item[valueKey].toLocaleString()}{valueSuffix}
                        </div>
                        <div className={`w-full max-w-[40px] rounded-t-sm transition-all duration-500 hover:opacity-80 relative ${colorClass}`} style={{ height: `${Math.max(height, 5)}%` }}>
                            {height > 20 && <span className="absolute bottom-2 left-0 right-0 text-center text-[9px] text-white/90 font-bold overflow-hidden">{item[valueKey]}</span>}
                        </div>
                        <span className="text-[9px] text-gray-500 mt-2 truncate w-full text-center">{new Date(item[labelKey]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                    </div>
                );
            })}
        </div>
    );
};

export const PortalView: React.FC<{ client: BigFish, paymentMethods: PaymentMethod[] }> = ({ client, paymentMethods = [] }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [globalSettings, setGlobalSettings] = useState<SystemSettings | null>(null);
    const [reportRange, setReportRange] = useState<'30_DAYS' | 'THIS_MONTH' | 'CUSTOM'>('30_DAYS');
    const [reportStart, setReportStart] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - 30);
        return d.toISOString().slice(0, 10);
    });
    const [reportEnd, setReportEnd] = useState(() => new Date().toISOString().slice(0, 10));
    const [msgView, setMsgView] = useState<'TABLE' | 'GRAPH'>('TABLE');
    const [salesView, setSalesView] = useState<'TABLE' | 'GRAPH'>('TABLE');

    useEffect(() => { mockService.getSystemSettings().then(setGlobalSettings); }, [client]);

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const allRecords = Array.isArray(client.campaign_records) ? client.campaign_records : [];
    const filteredRecords = allRecords.filter(rec => {
        const recDate = new Date(rec.start_date);
        const s = new Date(reportStart);
        const e = new Date(reportEnd + 'T23:59:59');
        return recDate >= s && recDate <= e;
    });

    const messageCampaigns = filteredRecords.filter(r => r.result_type === 'MESSAGES');
    const salesCampaigns = filteredRecords.filter(r => r.result_type === 'SALES');

    const flags = client.portal_config?.feature_flags || { show_message_report: true, show_sales_report: true, show_profit_loss_report: false, allow_topup_request: true, show_cpr_metrics: true, show_profit_analysis: true };
    const showMessageReport = flags.show_message_report !== false; 
    const showSalesReport = flags.show_sales_report !== false;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-inter p-4 md:p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                    <p className="text-indigo-100 text-xs font-bold uppercase">Balance</p>
                    <h3 className="text-4xl font-mono font-bold mt-1">${client.balance.toFixed(2)}</h3>
                </div>
                <div className="bg-white rounded-2xl p-6 border shadow-sm">
                    <p className="text-gray-500 text-xs font-bold uppercase">Total Spend</p>
                    <h3 className="text-3xl font-bold mt-1">${client.spent_amount.toFixed(2)}</h3>
                </div>
                <div className="bg-white rounded-2xl p-6 border shadow-sm">
                    <p className="text-gray-500 text-xs font-bold uppercase">Sales Goal</p>
                    <h3 className="text-3xl font-bold mt-1">{client.current_sales} / {client.target_sales}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {showMessageReport && (
                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold flex items-center"><MessageCircle className="mr-2 text-blue-600 h-5 w-5"/> Messages</h3>
                            <div className="flex bg-gray-200 p-1 rounded-lg text-xs">
                                <button onClick={() => setMsgView('TABLE')} className={`px-2 py-1 rounded ${msgView === 'TABLE' ? 'bg-white shadow' : ''}`}>Table</button>
                                <button onClick={() => setMsgView('GRAPH')} className={`px-2 py-1 rounded ${msgView === 'GRAPH' ? 'bg-white shadow' : ''}`}>Graph</button>
                            </div>
                        </div>
                        {msgView === 'TABLE' ? (
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr><th className="p-3 text-left">Date</th><th className="p-3 text-right">Spend</th><th className="p-3 text-center">Qty</th></tr>
                                </thead>
                                <tbody>
                                    {messageCampaigns.map(r => (
                                        <tr key={r.id} className="border-t"><td className="p-3">{new Date(r.start_date).toLocaleDateString()}</td><td className="p-3 text-right font-mono">${r.amount_spent}</td><td className="p-3 text-center font-bold">{r.results_count}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <SimpleChart data={messageCampaigns} labelKey="start_date" valueKey="results_count" colorClass="bg-blue-500" valueSuffix=" msgs"/>
                        )}
                    </div>
                )}

                {showSalesReport && (
                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold flex items-center"><ShoppingBag className="mr-2 text-green-600 h-5 w-5"/> Sales</h3>
                            <div className="flex bg-gray-200 p-1 rounded-lg text-xs">
                                <button onClick={() => setSalesView('TABLE')} className={`px-2 py-1 rounded ${salesView === 'TABLE' ? 'bg-white shadow' : ''}`}>Table</button>
                                <button onClick={() => setSalesView('GRAPH')} className={`px-2 py-1 rounded ${salesView === 'GRAPH' ? 'bg-white shadow' : ''}`}>Graph</button>
                            </div>
                        </div>
                        {salesView === 'TABLE' ? (
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr><th className="p-3 text-left">Date</th><th className="p-3 text-right">Spend</th><th className="p-3 text-center">Qty</th></tr>
                                </thead>
                                <tbody>
                                    {salesCampaigns.map(r => (
                                        <tr key={r.id} className="border-t"><td className="p-3">{new Date(r.start_date).toLocaleDateString()}</td><td className="p-3 text-right font-mono">${r.amount_spent}</td><td className="p-3 text-center font-bold">{r.results_count}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <SimpleChart data={salesCampaigns} labelKey="start_date" valueKey="results_count" colorClass="bg-green-500" valueSuffix=" sales"/>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const ClientPortal: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [client, setClient] = useState<BigFish | null>(null);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if(id) {
            Promise.all([mockService.getBigFishById(id), mockService.getPaymentMethods()])
            .then(([c, pm]) => { setClient(c || null); setPaymentMethods(pm); setLoading(false); });
        }
    }, [id]);

    if(loading) return <div className="p-20 text-center">Loading portal...</div>;
    if(!client) return <div className="p-20 text-center text-red-500">Invalid link.</div>;

    return <PortalView client={client} paymentMethods={paymentMethods} />;
};

export default ClientPortal;
