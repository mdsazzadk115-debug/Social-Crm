
import React, { useState, useEffect } from 'react';
import { Send, Search, CheckSquare, Square, Save, Plus, Trash2, Calendar, Clock, Repeat, List, Clipboard, Zap, Flame, Briefcase, CheckCircle, Edit3 } from 'lucide-react';
import { mockService } from '../services/mockService';
import { Lead, MessageTemplate, Channel, LeadStatus, SimpleAutomationRule } from '../types';
import { STATUS_LABELS, STATUS_COLORS } from '../constants';

const Messaging: React.FC = () => {
    // Data State
    const [leads, setLeads] = useState<Lead[]>([]);
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [automationRules, setAutomationRules] = useState<SimpleAutomationRule[]>([]);
    
    // UI State for Navigation
    const [activeTab, setActiveTab] = useState<'manual' | 'auto'>('manual');

    // --- MANUAL TAB STATE ---
    // Recipient Mode
    const [recipientMode, setRecipientMode] = useState<'list' | 'input'>('list');
    
    // List Mode State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterIndustry] = useState('all'); // Not currently used in dropdown but ready
    const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());

    // Input Mode State
    const [rawNumbersInput, setRawNumbersInput] = useState('');
    const [parsedNumbers, setParsedNumbers] = useState<string[]>([]);

    // Message Composition State
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [messageBody, setMessageBody] = useState('');
    const [scheduleDate, setScheduleDate] = useState(''); // Empty = Send Now
    const [isSending, setIsSending] = useState(false);

    // --- AUTO TAB STATE ---
    const [selectedCategory, setSelectedCategory] = useState<LeadStatus>(LeadStatus.NEW);
    const [categorySteps, setCategorySteps] = useState<{delay_days: number, send_time: string, template_id?: string, custom_body?: string, use_custom: boolean}[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        mockService.getLeads().then(setLeads);
        mockService.getTemplates().then(setTemplates);
        mockService.getSimpleAutomationRules().then(setAutomationRules);
    };

    // --- CALCULATE COUNTS ---
    const counts = {
        [LeadStatus.NEW]: leads.filter(l => l.status === LeadStatus.NEW).length,
        [LeadStatus.HOT]: leads.filter(l => l.status === LeadStatus.HOT).length,
        [LeadStatus.WORKING]: leads.filter(l => l.status === LeadStatus.WORKING).length,
        [LeadStatus.CLOSED_WON]: leads.filter(l => l.status === LeadStatus.CLOSED_WON).length,
        [LeadStatus.INTERESTED]: leads.filter(l => l.status === LeadStatus.INTERESTED).length,
        all: leads.length
    };

    // --- FILTER LOGIC (List Mode) ---
    const filteredLeads = leads.filter(lead => {
        const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
        const matchesIndustry = filterIndustry === 'all' || lead.industry === filterIndustry;
        const matchesSearch = 
            lead.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            lead.primary_phone.includes(searchTerm);
        return matchesStatus && matchesSearch && matchesIndustry;
    });

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

    // --- INPUT LOGIC (Paste Mode) ---
    const handleRawNumberChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setRawNumbersInput(val);
        // Simple extraction logic: valid numbers 11-14 chars
        const matches = val.match(/(?:\+88|88)?01[3-9]\d{8}/g) || [];
        setParsedNumbers(Array.from(new Set(matches))); // Unique numbers only
    };

    // --- MANUAL / SCHEDULE HANDLERS ---
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

    const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessageBody(e.target.value);
        // If user modifies text, we consider it a custom deviation, 
        // but we can keep the template ID selected or clear it. 
        // Clearing it makes it clear to the user they are sending a custom message.
        if (selectedTemplateId) {
            setSelectedTemplateId(''); 
        }
    };

    const handleSendOrSchedule = async () => {
        if (recipientMode === 'list' && selectedLeadIds.size === 0) return alert("Please select recipients from the list.");
        if (recipientMode === 'input' && parsedNumbers.length === 0) return alert("Please enter valid phone numbers.");
        if (!messageBody.trim()) return alert("Message body cannot be empty.");

        setIsSending(true);
        try {
            let targetIds: string[] = [];

            if (recipientMode === 'list') {
                targetIds = Array.from(selectedLeadIds);
            } else {
                // Convert raw numbers to Lead IDs (creates new leads if needed)
                targetIds = await mockService.resolvePhoneNumbersToIds(parsedNumbers);
            }

            if (scheduleDate) {
                // Schedule Mode
                await mockService.scheduleBulkMessages(
                    targetIds, 
                    [{ template_id: selectedTemplateId || undefined, body: messageBody, scheduled_at: scheduleDate }]
                );
                alert(`Successfully scheduled for ${targetIds.length} recipients.`);
            } else {
                // Instant Mode (Wait for result report)
                const report = await mockService.sendBulkSMS(targetIds, messageBody);
                
                let reportMsg = `📊 Report:\n✅ Sent Successfully: ${report.success}\n❌ Failed: ${report.failed}`;
                
                if (report.gatewayResponse) {
                    reportMsg += `\n\n📡 Gateway Response: ${report.gatewayResponse.substring(0, 100)}`;
                }

                if (report.failed > 0 && report.errors.length > 0) {
                    reportMsg += `\n\nErrors:\n${report.errors.slice(0, 3).join('\n')}`;
                    if(report.errors.length > 3) reportMsg += `\n...and ${report.errors.length - 3} more.`;
                }
                alert(reportMsg);
            }
            
            // Reset form
            setSelectedTemplateId('');
            setMessageBody('');
            setScheduleDate('');
            setSelectedLeadIds(new Set());
            setRawNumbersInput('');
            setParsedNumbers([]);
            loadData();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setIsSending(false);
        }
    };

    // --- AUTOMATION TAB HANDLERS ---
    useEffect(() => {
        const rule = automationRules.find(r => r.status === selectedCategory);
        if (rule) {
            setCategorySteps(rule.steps.map(s => ({ 
                delay_days: s.delay_days,
                send_time: s.send_time || "10:00",
                template_id: s.template_id,
                custom_body: s.custom_body,
                use_custom: !!s.custom_body // If custom body exists, set flag true
            })));
        } else {
            setCategorySteps([]);
        }
    }, [selectedCategory, automationRules]);

    const handleAddStep = () => {
        setCategorySteps([...categorySteps, { delay_days: 1, send_time: "10:00", use_custom: false }]);
    };

    const handleRemoveStep = (idx: number) => {
        const newSteps = [...categorySteps];
        newSteps.splice(idx, 1);
        setCategorySteps(newSteps);
    };

    const updateStep = (idx: number, field: string, value: any) => {
        const newSteps = [...categorySteps];
        // @ts-ignore
        newSteps[idx][field] = value;
        setCategorySteps(newSteps);
    };

    const toggleStepCustom = (idx: number) => {
        const newSteps = [...categorySteps];
        newSteps[idx].use_custom = !newSteps[idx].use_custom;
        // Clear conflicting fields
        if(newSteps[idx].use_custom) {
            newSteps[idx].template_id = undefined;
            newSteps[idx].custom_body = '';
        } else {
            newSteps[idx].custom_body = undefined;
            newSteps[idx].template_id = '';
        }
        setCategorySteps(newSteps);
    };

    const handleSaveAutomation = async () => {
        // Validation
        for(const step of categorySteps) {
            if(step.use_custom && !step.custom_body) return alert("Please enter message text for all custom steps.");
            if(!step.use_custom && !step.template_id) return alert("Please select a template for all steps.");
        }
        
        try {
            await mockService.saveSimpleAutomationRule(selectedCategory, categorySteps.map(s => ({
                delay_days: s.delay_days,
                send_time: s.send_time,
                template_id: s.use_custom ? undefined : s.template_id,
                custom_body: s.use_custom ? s.custom_body : undefined
            })));
            alert(`Automation saved for category "${STATUS_LABELS[selectedCategory]}". New leads in this category will receive these messages.`);
            loadData();
        } catch (e: any) {
            alert(e.message);
        }
    };

    // Helper to quick-select status
    const handleStatClick = (status: LeadStatus) => {
        if (activeTab === 'manual') {
            setFilterStatus(status);
            setRecipientMode('list');
        } else {
            setSelectedCategory(status);
            setActiveTab('auto');
        }
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col gap-4">
            
            {/* --- TOP STATISTICS BAR (Interactive) --- */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                <button onClick={() => handleStatClick(LeadStatus.NEW)} className={`flex items-center justify-between p-3 rounded-md transition-colors border ${activeTab === 'manual' && filterStatus === LeadStatus.NEW ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-transparent bg-gray-50'}`}>
                    <div className="flex items-center">
                        <div className="p-1.5 rounded-full bg-blue-100 text-blue-600 mr-2"><Zap className="h-4 w-4"/></div>
                        <span className="text-sm font-medium text-gray-700">New Leads</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{counts[LeadStatus.NEW]}</span>
                </button>

                <button onClick={() => handleStatClick(LeadStatus.HOT)} className={`flex items-center justify-between p-3 rounded-md transition-colors border ${activeTab === 'manual' && filterStatus === LeadStatus.HOT ? 'bg-orange-50 border-orange-200' : 'hover:bg-gray-50 border-transparent bg-gray-50'}`}>
                    <div className="flex items-center">
                        <div className="p-1.5 rounded-full bg-orange-100 text-orange-600 mr-2"><Flame className="h-4 w-4"/></div>
                        <span className="text-sm font-medium text-gray-700">Hot Leads</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{counts[LeadStatus.HOT]}</span>
                </button>

                <button onClick={() => handleStatClick(LeadStatus.WORKING)} className={`flex items-center justify-between p-3 rounded-md transition-colors border ${activeTab === 'manual' && filterStatus === LeadStatus.WORKING ? 'bg-purple-50 border-purple-200' : 'hover:bg-gray-50 border-transparent bg-gray-50'}`}>
                    <div className="flex items-center">
                         <div className="p-1.5 rounded-full bg-purple-100 text-purple-600 mr-2"><Briefcase className="h-4 w-4"/></div>
                        <span className="text-sm font-medium text-gray-700">Processing</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{counts[LeadStatus.WORKING]}</span>
                </button>

                 <button onClick={() => handleStatClick(LeadStatus.CLOSED_WON)} className={`flex items-center justify-between p-3 rounded-md transition-colors border ${activeTab === 'manual' && filterStatus === LeadStatus.CLOSED_WON ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50 border-transparent bg-gray-50'}`}>
                    <div className="flex items-center">
                         <div className="p-1.5 rounded-full bg-green-100 text-green-600 mr-2"><CheckCircle className="h-4 w-4"/></div>
                        <span className="text-sm font-medium text-gray-700">Closed</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{counts[LeadStatus.CLOSED_WON]}</span>
                </button>

                {/* Total / All for Manual Mode Only */}
                <button 
                    onClick={() => setFilterStatus('all')}
                    className={`hidden lg:flex items-center justify-between p-3 rounded-md transition-colors border ${activeTab === 'manual' && filterStatus === 'all' ? 'bg-gray-200 border-gray-300' : 'hover:bg-gray-100 border-transparent bg-gray-50'}`}
                >
                    <span className="text-sm font-medium text-gray-700 ml-2">Total Leads</span>
                    <span className="text-lg font-bold text-gray-900">{counts.all}</span>
                </button>
            </div>


            <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
                {/* LEFT PANEL: RECIPIENT SELECTION */}
                {activeTab === 'manual' && (
                    <div className="w-full md:w-7/12 bg-white shadow rounded-lg flex flex-col overflow-hidden">
                        {/* Header with Mode Toggle */}
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center mb-3">
                                1. Select Recipients
                            </h2>
                            
                            <div className="flex rounded-md shadow-sm mb-4" role="group">
                                <button
                                    type="button"
                                    onClick={() => setRecipientMode('list')}
                                    className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium border rounded-l-lg ${
                                        recipientMode === 'list' 
                                        ? 'bg-indigo-600 text-white border-indigo-600' 
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <List className="h-4 w-4 mr-2" />
                                    Saved Leads
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRecipientMode('input')}
                                    className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium border rounded-r-lg ${
                                        recipientMode === 'input' 
                                        ? 'bg-indigo-600 text-white border-indigo-600' 
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <Clipboard className="h-4 w-4 mr-2" />
                                    Paste Numbers
                                </button>
                            </div>

                            {recipientMode === 'list' && (
                                <div className="space-y-2">
                                    <div className="flex gap-2 mb-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input 
                                                type="text"
                                                className="pl-9 w-full border border-gray-300 rounded-md p-2 text-sm"
                                                placeholder="Search name/phone..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <select
                                            className="border border-gray-300 rounded-md p-2 text-sm w-40"
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                        >
                                            <option value="all">All Status ({counts.all})</option>
                                            {Object.keys(STATUS_LABELS).map(k => {
                                                return <option key={k} value={k}>{STATUS_LABELS[k as LeadStatus]}</option>
                                            })}
                                        </select>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                        <button onClick={handleSelectAll} className="text-indigo-600 font-medium hover:underline flex items-center">
                                            {selectedLeadIds.size > 0 && selectedLeadIds.size === filteredLeads.length ? <CheckSquare className="h-4 w-4 mr-1"/> : <Square className="h-4 w-4 mr-1"/>}
                                            Select All Shown
                                        </button>
                                        <span>{filteredLeads.length} leads found</span>
                                    </div>
                                </div>
                            )}
                            
                            {recipientMode === 'input' && (
                                <div className="text-sm text-gray-500">
                                    Enter Bangladeshi numbers (e.g. 017...). New numbers will be created as "New Leads".
                                </div>
                            )}
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto bg-gray-50">
                            {recipientMode === 'list' ? (
                                filteredLeads.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">No leads found.</div>
                                ) : (
                                    <ul className="divide-y divide-gray-200 bg-white">
                                        {filteredLeads.map(lead => (
                                            <li 
                                                key={lead.id} 
                                                onClick={() => toggleSelect(lead.id)}
                                                className={`px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center ${selectedLeadIds.has(lead.id) ? 'bg-indigo-50' : ''}`}
                                            >
                                                <input 
                                                    type="checkbox"
                                                    checked={selectedLeadIds.has(lead.id)}
                                                    onChange={() => toggleSelect(lead.id)}
                                                    className="h-4 w-4 text-indigo-600 rounded mr-3"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900">{lead.full_name}</p>
                                                    <p className="text-xs text-gray-500">{lead.primary_phone}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`px-2 py-0.5 rounded text-xs border ${STATUS_COLORS[lead.status]}`}>
                                                        {STATUS_LABELS[lead.status]}
                                                    </span>
                                                    <div className="text-xs text-gray-400 mt-1">{lead.total_messages_sent || 0} msgs</div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )
                            ) : (
                                <div className="p-4 h-full flex flex-col">
                                    <textarea
                                        className="w-full flex-1 border border-gray-300 rounded-md p-3 text-sm font-mono focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder={`01712345678\n01887654321\n...`}
                                        value={rawNumbersInput}
                                        onChange={handleRawNumberChange}
                                    />
                                    <div className="mt-2 flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Separated by new line or comma.</span>
                                        <span className={`font-bold ${parsedNumbers.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                            {parsedNumbers.length} valid numbers detected
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* RIGHT PANEL: ACTIONS */}
                <div className={`w-full ${activeTab === 'manual' ? 'md:w-5/12' : 'md:w-full max-w-4xl mx-auto'} bg-white shadow rounded-lg flex flex-col h-full`}>
                    
                    {/* TABS HEADER */}
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('manual')}
                            className={`flex-1 py-4 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === 'manual' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            <Send className="h-4 w-4 inline-block mr-2" />
                            Send Message (Manual)
                        </button>
                        <button
                            onClick={() => setActiveTab('auto')}
                            className={`flex-1 py-4 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === 'auto' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            <Repeat className="h-4 w-4 inline-block mr-2" />
                            Auto Follow-up
                        </button>
                    </div>

                    {/* --- TAB CONTENT: MANUAL --- */}
                    {activeTab === 'manual' && (
                        <div className="p-6 flex flex-col flex-1 overflow-y-auto">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">2. Compose & Send</h2>
                            
                            <div className="space-y-4 flex-1">
                                {/* Template Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Template</label>
                                    <div className="flex">
                                        <select
                                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            value={selectedTemplateId}
                                            onChange={handleTemplateSelect}
                                        >
                                            <option value="">-- Write Custom Message --</option>
                                            {templates.filter(t => t.channel === Channel.SMS).map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Message Body */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Message Body 
                                        {!selectedTemplateId && <span className="text-xs text-indigo-500 ml-2 font-normal">(Custom)</span>}
                                    </label>
                                    <textarea
                                        rows={6}
                                        className="block w-full border border-gray-300 rounded-md shadow-sm p-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Type your message here..."
                                        value={messageBody}
                                        onChange={handleBodyChange}
                                    />
                                    <div className="flex justify-end mt-1">
                                        <span className="text-xs text-gray-400">{messageBody.length} characters</span>
                                    </div>
                                </div>

                                {/* Scheduling */}
                                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                        When to send?
                                    </label>
                                    <input 
                                        type="datetime-local"
                                        className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white"
                                        value={scheduleDate}
                                        onChange={(e) => setScheduleDate(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        {scheduleDate ? "Will be scheduled for the selected time." : "Leave empty to send IMMEDIATELY."}
                                    </p>
                                </div>
                            </div>

                            {/* Footer Action */}
                            <div className="pt-6 mt-4 border-t border-gray-100">
                                {/* Dynamic Button Text Calculation */}
                                {(() => {
                                    const count = recipientMode === 'list' ? selectedLeadIds.size : parsedNumbers.length;
                                    return (
                                        <>
                                            <button
                                                onClick={handleSendOrSchedule}
                                                disabled={isSending || count === 0 || !messageBody}
                                                className={`w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white transition-colors ${
                                                    scheduleDate 
                                                    ? 'bg-blue-600 hover:bg-blue-700' 
                                                    : 'bg-green-600 hover:bg-green-700'
                                                } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                                            >
                                                {isSending 
                                                    ? 'Processing...' 
                                                    : scheduleDate 
                                                        ? `Schedule for ${count} Recipients` 
                                                        : `Send Now to ${count} Recipients`
                                                }
                                                {!isSending && (scheduleDate ? <Clock className="ml-2 h-4 w-4" /> : <Send className="ml-2 h-4 w-4" />)}
                                            </button>
                                            {count === 0 && (
                                                <p className="text-xs text-red-500 mt-2 text-center">
                                                    {recipientMode === 'list' ? "Select recipients from list." : "Enter valid phone numbers."}
                                                </p>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {/* --- TAB CONTENT: AUTO FOLLOW-UP --- */}
                    {activeTab === 'auto' && (
                        <div className="p-6 flex flex-col h-full overflow-y-auto">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Automated Follow-up Rules</h2>
                                <p className="text-sm text-gray-500">
                                    Automatically send messages when a lead belongs to a specific category.
                                </p>
                            </div>

                            {/* 1. Category Selector */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-2">1. Select Category / Status</label>
                                <select
                                    className="block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value as LeadStatus)}
                                >
                                    {Object.keys(STATUS_LABELS).map(k => {
                                        // Count specifically for this dropdown
                                        const count = leads.filter(l => l.status === k).length;
                                        return <option key={k} value={k}>{STATUS_LABELS[k as LeadStatus]} ({count} Leads)</option>
                                    })}
                                </select>
                                <div className={`mt-2 p-3 rounded-md text-sm border ${
                                    selectedCategory === LeadStatus.NEW ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-gray-50 border-gray-200 text-gray-600'
                                }`}>
                                    Currently editing rules for: <strong>{STATUS_LABELS[selectedCategory]}</strong>. 
                                    <br/>Any lead marked as "{STATUS_LABELS[selectedCategory]}" will automatically enter this sequence.
                                </div>
                            </div>

                            {/* 2. Steps Builder */}
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">2. Define Follow-up Steps</label>
                                
                                <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-[200px]">
                                    {categorySteps.length === 0 && (
                                        <p className="text-center text-gray-400 py-8">No automation rules set for this category yet.</p>
                                    )}
                                    
                                    {categorySteps.map((step, idx) => (
                                        <div key={idx} className="flex flex-col gap-3 bg-white p-4 rounded shadow-sm border border-gray-200">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex items-center flex-wrap gap-2">
                                                    <span className="bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded text-xs mr-2">Step {idx + 1}</span>
                                                    
                                                    {/* Day Input */}
                                                    <div className="flex items-center">
                                                        <span className="text-sm text-gray-600 mr-2">Send after</span>
                                                        <input 
                                                            type="number" 
                                                            min="1" 
                                                            max="30"
                                                            className="w-16 border border-gray-300 rounded p-1 text-sm text-center"
                                                            value={step.delay_days}
                                                            onChange={(e) => updateStep(idx, 'delay_days', parseInt(e.target.value))}
                                                        />
                                                        <span className="text-sm text-gray-600 ml-1">days</span>
                                                    </div>

                                                    {/* Time Input */}
                                                    <div className="flex items-center">
                                                        <span className="text-sm text-gray-600 mx-2">at</span>
                                                        <input 
                                                            type="time" 
                                                            className="border border-gray-300 rounded p-1 text-sm"
                                                            value={step.send_time}
                                                            onChange={(e) => updateStep(idx, 'send_time', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <button onClick={() => handleRemoveStep(idx)} className="text-gray-400 hover:text-red-600 p-1">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>

                                            {/* Custom vs Template Switch */}
                                            <div className="flex items-center justify-end">
                                                <label className="inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={step.use_custom} 
                                                        onChange={() => toggleStepCustom(idx)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                                    <span className="ms-3 text-xs font-medium text-gray-700 flex items-center">
                                                        <Edit3 className="h-3 w-3 mr-1"/> Write Custom Message
                                                    </span>
                                                </label>
                                            </div>

                                            <div className="w-full">
                                                {step.use_custom ? (
                                                    <textarea
                                                        className="block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                        rows={3}
                                                        placeholder="Type your custom automated message here..."
                                                        value={step.custom_body || ''}
                                                        onChange={(e) => updateStep(idx, 'custom_body', e.target.value)}
                                                    />
                                                ) : (
                                                    <select
                                                        className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                                                        value={step.template_id || ''}
                                                        onChange={(e) => updateStep(idx, 'template_id', e.target.value)}
                                                    >
                                                        <option value="">-- Select Template --</option>
                                                        {templates.filter(t => t.channel === Channel.SMS).map(t => (
                                                            <option key={t.id} value={t.id}>{t.name}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    <button 
                                        onClick={handleAddStep}
                                        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-white transition-colors text-sm font-medium flex items-center justify-center"
                                    >
                                        <Plus className="h-4 w-4 mr-1" /> Add Follow-up Message
                                    </button>
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                                <button
                                    onClick={handleSaveAutomation}
                                    className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Automation Rules
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Messaging;
