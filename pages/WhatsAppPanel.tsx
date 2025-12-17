
import React, { useState, useEffect } from 'react';
import { mockService } from '../services/mockService';
import { Lead, MessageTemplate, Channel, LeadStatus } from '../types';
import { Search, Send, CheckSquare, Square, Smartphone, ArrowRight, CheckCircle, RefreshCcw, ExternalLink, MessageCircle } from 'lucide-react';
import { STATUS_LABELS, STATUS_COLORS } from '../constants';

interface QueueItem {
    lead: Lead;
    status: 'pending' | 'sent';
}

const WhatsAppPanel: React.FC = () => {
    // Data State
    const [leads, setLeads] = useState<Lead[]>([]);
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    
    // UI State
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
    
    // Message State
    const [messageBody, setMessageBody] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');

    // Queue Mode State
    const [isQueueMode, setIsQueueMode] = useState(false);
    const [sendingQueue, setSendingQueue] = useState<QueueItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        mockService.getLeads().then(setLeads);
        mockService.getTemplates().then(setTemplates);
    };

    // Filter Logic
    const filteredLeads = leads.filter(lead => {
        const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
        const matchesSearch = 
            lead.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            lead.primary_phone.includes(searchTerm);
        return matchesStatus && matchesSearch && lead.primary_phone; // Must have phone
    });

    // Selection Logic
    const handleSelectAll = () => {
        if (selectedLeadIds.size === filteredLeads.length && filteredLeads.length > 0) {
            setSelectedLeadIds(new Set());
        } else {
            setSelectedLeadIds(new Set(filteredLeads.map(l => l.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedLeadIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedLeadIds(newSet);
    };

    // Template Logic
    const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const tId = e.target.value;
        setSelectedTemplateId(tId);
        if (tId) {
            const tmpl = templates.find(t => t.id === tId);
            if (tmpl) setMessageBody(tmpl.body);
        } else {
            setMessageBody('');
        }
    };

    // Start Queue Logic
    const startQueue = () => {
        if (selectedLeadIds.size === 0) return alert("Select at least one lead.");
        if (!messageBody.trim()) return alert("Message cannot be empty.");

        const queue: QueueItem[] = leads
            .filter(l => selectedLeadIds.has(l.id))
            .map(l => ({ lead: l, status: 'pending' }));
        
        setSendingQueue(queue);
        setCurrentIndex(0);
        setIsQueueMode(true);
    };

    // Main Sending Function
    const handleSendClick = (item: QueueItem, index: number) => {
        // 1. Format Number
        let num = item.lead.primary_phone.replace(/[^\d]/g, '');
        if(num.startsWith('01')) num = '88' + num;
        else if(num.startsWith('1')) num = '880' + num;

        // 2. Personalize Message
        const personalMsg = messageBody.replace(/\[Name\]/g, item.lead.full_name || 'Customer');

        // 3. Construct URL
        const url = `https://web.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(personalMsg)}`;
        
        // 4. Open Window
        window.open(url, '_blank');

        // 5. Update Status
        const newQueue = [...sendingQueue];
        newQueue[index].status = 'sent';
        setSendingQueue(newQueue);

        // 6. Move to next if available
        if (index + 1 < sendingQueue.length) {
            setCurrentIndex(index + 1);
        }
    };

    const resetPanel = () => {
        setIsQueueMode(false);
        setSendingQueue([]);
        setSelectedLeadIds(new Set());
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col font-inter space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center">
                        <Smartphone className="h-6 w-6 text-green-600 mr-2"/> WhatsApp Sender Panel
                    </h1>
                    <p className="text-sm text-gray-500">Safe, manual bulk messaging via Web WhatsApp.</p>
                </div>
                {isQueueMode && (
                    <button onClick={resetPanel} className="text-gray-500 hover:text-red-600 font-bold text-sm flex items-center">
                        <RefreshCcw className="h-4 w-4 mr-1"/> Exit Queue
                    </button>
                )}
            </div>

            {/* MAIN CONTENT SPLIT */}
            {!isQueueMode ? (
                <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
                    
                    {/* LEFT: LEAD SELECTION */}
                    <div className="w-full md:w-7/12 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <div className="flex gap-2 mb-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input 
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        placeholder="Search leads..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="border border-gray-300 rounded-lg p-2 text-sm bg-white"
                                    value={filterStatus}
                                    onChange={e => setFilterStatus(e.target.value)}
                                >
                                    <option value="all">All Status</option>
                                    {Object.keys(STATUS_LABELS).map(k => (
                                        <option key={k} value={k}>{STATUS_LABELS[k as LeadStatus]}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <button onClick={handleSelectAll} className="text-indigo-600 font-bold hover:underline flex items-center">
                                    {selectedLeadIds.size > 0 && selectedLeadIds.size === filteredLeads.length ? <CheckSquare className="h-4 w-4 mr-1"/> : <Square className="h-4 w-4 mr-1"/>}
                                    Select All Shown
                                </button>
                                <span className="text-gray-500 font-medium">{selectedLeadIds.size} selected</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {filteredLeads.length === 0 ? (
                                <div className="p-10 text-center text-gray-400">No leads found.</div>
                            ) : (
                                <ul className="divide-y divide-gray-100">
                                    {filteredLeads.map(lead => (
                                        <li 
                                            key={lead.id} 
                                            onClick={() => toggleSelect(lead.id)}
                                            className={`px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center transition-colors ${selectedLeadIds.has(lead.id) ? 'bg-indigo-50' : ''}`}
                                        >
                                            <input 
                                                type="checkbox"
                                                checked={selectedLeadIds.has(lead.id)}
                                                onChange={() => toggleSelect(lead.id)}
                                                className="h-4 w-4 text-indigo-600 rounded mr-3"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-gray-900 text-sm">{lead.full_name}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded border ${STATUS_COLORS[lead.status]}`}>
                                                        {STATUS_LABELS[lead.status]}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 font-mono">{lead.primary_phone}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: COMPOSER */}
                    <div className="w-full md:w-5/12 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <MessageCircle className="h-5 w-5 mr-2 text-indigo-600"/> Compose Message
                        </h2>
                        
                        <div className="space-y-4 flex-1">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Load Template</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                                    value={selectedTemplateId}
                                    onChange={handleTemplateSelect}
                                >
                                    <option value="">-- Write Custom --</option>
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Message Body</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm h-48 focus:ring-green-500 focus:border-green-500"
                                    placeholder="Type your message here... Use [Name] to insert customer name."
                                    value={messageBody}
                                    onChange={e => setMessageBody(e.target.value)}
                                />
                                <p className="text-xs text-gray-400 mt-1 text-right">
                                    Tip: Use <strong>[Name]</strong> variable for personalization.
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={startQueue}
                            disabled={selectedLeadIds.size === 0 || !messageBody}
                            className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 shadow-md transition-colors flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed mt-6"
                        >
                            Start Queue ({selectedLeadIds.size}) <ArrowRight className="h-4 w-4 ml-2"/>
                        </button>
                    </div>
                </div>
            ) : (
                /* --- QUEUE MODE --- */
                <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden flex flex-col md:flex-row">
                    
                    {/* List of Queue */}
                    <div className="w-full md:w-1/3 border-r border-gray-200 bg-gray-50 flex flex-col">
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="font-bold text-gray-800">Sending Queue ({sendingQueue.length})</h3>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div 
                                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(sendingQueue.filter(i => i.status === 'sent').length / sendingQueue.length) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {sendingQueue.map((item, idx) => (
                                <div 
                                    key={idx} 
                                    className={`p-3 border-b border-gray-100 flex items-center justify-between ${idx === currentIndex ? 'bg-indigo-100 border-l-4 border-l-indigo-600' : 'bg-white'} ${item.status === 'sent' ? 'opacity-60' : ''}`}
                                >
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">{item.lead.full_name}</p>
                                        <p className="text-xs text-gray-500">{item.lead.primary_phone}</p>
                                    </div>
                                    {item.status === 'sent' && <CheckCircle className="h-5 w-5 text-green-500"/>}
                                    {idx === currentIndex && item.status !== 'sent' && <span className="text-xs font-bold text-indigo-600 bg-white px-2 py-1 rounded">Active</span>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Active Sending Area */}
                    <div className="flex-1 p-8 flex flex-col items-center justify-center bg-white text-center">
                        {currentIndex < sendingQueue.length ? (
                            <div className="max-w-md w-full">
                                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Smartphone className="h-10 w-10 text-green-600"/>
                                </div>
                                
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    Send to {sendingQueue[currentIndex].lead.full_name}
                                </h2>
                                <p className="text-gray-500 mb-6 font-mono bg-gray-50 py-1 px-3 rounded inline-block">
                                    {sendingQueue[currentIndex].lead.primary_phone}
                                </p>

                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-left mb-8 max-h-40 overflow-y-auto">
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                        {messageBody.replace(/\[Name\]/g, sendingQueue[currentIndex].lead.full_name || 'Customer')}
                                    </p>
                                </div>

                                <button 
                                    onClick={() => handleSendClick(sendingQueue[currentIndex], currentIndex)}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transform active:scale-95 transition-all flex items-center justify-center text-lg"
                                >
                                    <Send className="h-5 w-5 mr-3"/> Open WhatsApp & Send
                                </button>
                                
                                <div className="mt-4 flex justify-between text-sm text-gray-400">
                                    <button onClick={() => setCurrentIndex(prev => Math.min(prev + 1, sendingQueue.length))} className="hover:text-gray-600">Skip This Lead</button>
                                    <span>{currentIndex + 1} of {sendingQueue.length}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                    <CheckCircle className="h-12 w-12 text-green-600"/>
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Queue Completed!</h2>
                                <p className="text-gray-500 mb-8">All messages have been processed.</p>
                                <button onClick={resetPanel} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-md">
                                    Start New Batch
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WhatsAppPanel;
