import React, { useState, useEffect } from 'react';
import { mockService } from '../services/mockService';
import { Lead, LeadStatus, ClientInteraction, Task } from '../types';
import { Phone, Globe, Facebook, Save, CheckCircle, ExternalLink, Target, Copy, MessageCircle, Download, Clock, User, Mail, MessageSquare, Trash2, CheckSquare, Plus, X, Calendar } from 'lucide-react';
// @ts-ignore
import { Link } from 'react-router-dom';

const WonLeads: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingNote, setEditingNote] = useState<{id: string, text: string} | null>(null);
    
    // CRM Modal State
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [crmTab, setCrmTab] = useState<'interactions' | 'tasks'>('interactions');
    
    // CRM Interaction Form State
    const [interactionType, setInteractionType] = useState<ClientInteraction['type']>('CALL');
    const [interactionNotes, setInteractionNotes] = useState('');
    const [interactionDate, setInteractionDate] = useState(new Date().toISOString().slice(0, 10));
    const [nextFollowUp, setNextFollowUp] = useState('');
    const [autoCreateTask, setAutoCreateTask] = useState(true);

    // CRM Task Form State
    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskDate, setNewTaskDate] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [allLeads, allTasks] = await Promise.all([
            mockService.getLeads(),
            mockService.getTasks()
        ]);
        setLeads(allLeads.filter(l => l.status === LeadStatus.CLOSED_WON));
        setTasks(allTasks);
        setLoading(false);
    };

    // --- MAIN LIST HANDLERS ---
    const handleNoteChange = (id: string, text: string) => {
        setEditingNote({ id, text });
    };

    const saveNote = async (id: string) => {
        if (editingNote && editingNote.id === id) {
            await mockService.updateLeadNote(id, editingNote.text);
            const updated = leads.map(l => l.id === id ? { ...l, quick_note: editingNote.text } : l);
            setLeads(updated);
            setEditingNote(null);
            alert("Note saved!");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copied: " + text);
    };

    const handleConvertToBigFish = async (leadId: string) => {
        if(confirm("Add this client to VIP (Big Fish) List?")) {
            const result = await mockService.catchBigFish(leadId);
            if(result) {
                alert("Successfully moved to Big Fish!");
                window.location.href = '#/big-fish';
            } else {
                alert("Already exists in Big Fish.");
            }
        }
    };

    const handleWhatsApp = (lead: Lead) => {
        let num = lead.primary_phone.replace(/\D/g, '');
        if(num.startsWith('01')) num = '88' + num;
        
        const text = `Congratulations ${lead.full_name}! We are excited to start working with you. Let's discuss the next steps for ${lead.service_category || 'your project'}.`;
        const url = `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const handleDownload = () => {
        if (leads.length === 0) return alert("No clients to download.");
        const csvContent = [
            ['Name', 'Phone', 'Service Category', 'Note', 'Date Added'],
            ...leads.map(l => [
                `"${l.full_name}"`,
                `"${l.primary_phone}"`,
                `"${l.service_category || l.industry || ''}"`,
                `"${l.quick_note || ''}"`,
                `"${new Date(l.created_at).toLocaleDateString()}"`
            ])
        ].map(e => e.join(',')).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `won_clients_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- CRM MODAL HANDLERS ---
    const openCrmModal = (lead: Lead) => {
        setSelectedLead(lead);
        setCrmTab('interactions');
    };

    const handleAddInteraction = async () => {
        if(!selectedLead || !interactionNotes) return alert("Please add notes.");
        
        await mockService.addLeadInteraction(selectedLead.id, {
            type: interactionType,
            date: interactionDate,
            notes: interactionNotes,
            next_follow_up: nextFollowUp
        });

        if (autoCreateTask && nextFollowUp) {
            await mockService.createTask(
                `Follow up with ${selectedLead.full_name}: ${interactionNotes.substring(0, 30)}...`,
                nextFollowUp,
                selectedLead.id
            );
        }

        // Refresh Data
        const updatedLeads = await mockService.getLeads();
        const updatedTasks = await mockService.getTasks();
        setLeads(updatedLeads.filter(l => l.status === LeadStatus.CLOSED_WON));
        setTasks(updatedTasks);
        
        // Update currently selected lead in modal
        setSelectedLead(updatedLeads.find(l => l.id === selectedLead.id) || null);

        // Reset Form
        setInteractionNotes('');
        setNextFollowUp('');
    };

    const handleDeleteInteraction = async (interactionId: string) => {
        if(!selectedLead) return;
        if(confirm("Delete this log?")) {
            await mockService.deleteLeadInteraction(selectedLead.id, interactionId);
            const updatedLeads = await mockService.getLeads();
            setLeads(updatedLeads.filter(l => l.status === LeadStatus.CLOSED_WON));
            setSelectedLead(updatedLeads.find(l => l.id === selectedLead.id) || null);
        }
    };

    const handleAddTask = async () => {
        if(!selectedLead || !newTaskText) return;
        await mockService.createTask(newTaskText, newTaskDate || undefined, selectedLead.id);
        const updatedTasks = await mockService.getTasks();
        setTasks(updatedTasks);
        setNewTaskText('');
        setNewTaskDate('');
    };

    const getInteractionIcon = (type: string) => {
        switch(type) {
            case 'CALL': return <Phone className="h-4 w-4"/>;
            case 'MEETING': return <User className="h-4 w-4"/>;
            case 'EMAIL': return <Mail className="h-4 w-4"/>;
            case 'WHATSAPP': return <MessageCircle className="h-4 w-4"/>;
            default: return <MessageSquare className="h-4 w-4"/>;
        }
    };

    // Filter tasks for selected lead
    const leadTasks = selectedLead ? tasks.filter(t => t.lead_id === selectedLead.id) : [];

    if (loading) return <div className="p-8 text-center text-gray-500">Loading won clients...</div>;

    return (
        <div className="space-y-6 font-inter">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <CheckCircle className="mr-2 h-7 w-7 text-green-600" /> Won Clients & CRM
                    </h1>
                    <p className="text-sm text-gray-500">Manage advanced relationships, history, and tasks.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleDownload}
                        className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium flex items-center text-sm shadow-sm transition-colors"
                        title="Download List"
                    >
                        <Download className="h-4 w-4 mr-2"/> Export List
                    </button>
                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-bold">
                        Total Won: {leads.length}
                    </div>
                </div>
            </div>

            {leads.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
                    <CheckCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No Won Leads Yet</h3>
                    <p className="text-gray-500">Convert leads to "Closed Won" status to see them here.</p>
                    <Link to="/leads" className="mt-4 inline-block text-indigo-600 font-bold hover:underline">Go to Leads</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {leads.map(lead => (
                        <div key={lead.id} className="bg-white rounded-xl shadow-sm border border-green-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                            {/* Header */}
                            <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 relative">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 truncate pr-8" title={lead.full_name}>{lead.full_name}</h3>
                                        <span className="text-xs bg-white text-green-700 px-2 py-0.5 rounded border border-green-200 mt-1 inline-block">
                                            {lead.service_category || lead.industry || 'General Client'}
                                        </span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => openCrmModal(lead)}
                                            className="bg-indigo-600 text-white p-1.5 rounded-full shadow-sm hover:bg-indigo-700 transition-colors"
                                            title="Open CRM"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleConvertToBigFish(lead.id)}
                                            className="bg-white text-indigo-600 p-1.5 rounded-full shadow-sm hover:bg-indigo-50 border border-indigo-100"
                                            title="Convert to VIP"
                                        >
                                            <Target className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="p-5 space-y-4 flex-1">
                                <div>
                                    <div className="flex items-center justify-between mt-1">
                                        <a href={`tel:${lead.primary_phone}`} className="text-lg font-mono font-bold text-gray-800 hover:text-green-600 flex items-center">
                                            <Phone className="h-4 w-4 mr-2" /> {lead.primary_phone}
                                        </a>
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={() => handleWhatsApp(lead)} 
                                                className="text-white bg-green-500 hover:bg-green-600 p-1.5 rounded shadow-sm transition-colors"
                                                title="Open WhatsApp"
                                            >
                                                <MessageCircle className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => copyToClipboard(lead.primary_phone)} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded">
                                                <Copy className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 text-sm">
                                    {lead.facebook_profile_link && (
                                        <a href={lead.facebook_profile_link} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center p-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-100">
                                            <Facebook className="h-4 w-4 mr-2" /> Facebook
                                        </a>
                                    )}
                                    {lead.website_url && (
                                        <a href={lead.website_url} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center p-2 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 border border-gray-200">
                                            <Globe className="h-4 w-4 mr-2" /> Website
                                        </a>
                                    )}
                                </div>

                                {/* Quick Note */}
                                <div className="pt-4 border-t border-gray-100">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Quick Note</label>
                                        {editingNote?.id === lead.id && (
                                            <button onClick={() => saveNote(lead.id)} className="text-xs bg-green-600 text-white px-2 py-0.5 rounded flex items-center">
                                                <Save className="h-3 w-3 mr-1" /> Save
                                            </button>
                                        )}
                                    </div>
                                    <textarea 
                                        className="w-full bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-gray-800 min-h-[60px] focus:ring-yellow-400 focus:border-yellow-400"
                                        placeholder="Quick notes..."
                                        value={editingNote?.id === lead.id ? editingNote.text : (lead.quick_note || '')}
                                        onChange={(e) => handleNoteChange(lead.id, e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ADVANCED CRM MODAL */}
            {selectedLead && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-scale-up">
                        {/* Header */}
                        <div className="bg-indigo-600 p-6 text-white flex justify-between items-start shrink-0">
                            <div>
                                <h2 className="text-2xl font-bold">{selectedLead.full_name}</h2>
                                <div className="flex gap-4 mt-2 text-indigo-100 text-sm">
                                    <span className="flex items-center"><Phone className="h-4 w-4 mr-1"/> {selectedLead.primary_phone}</span>
                                    <span className="flex items-center"><CheckCircle className="h-4 w-4 mr-1"/> Won Client</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedLead(null)} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
                            <button 
                                onClick={() => setCrmTab('interactions')} 
                                className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors flex justify-center items-center ${crmTab === 'interactions' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}
                            >
                                <MessageSquare className="h-4 w-4 mr-2"/> Communication History
                            </button>
                            <button 
                                onClick={() => setCrmTab('tasks')} 
                                className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors flex justify-center items-center ${crmTab === 'tasks' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}
                            >
                                <CheckSquare className="h-4 w-4 mr-2"/> Tasks & Reminders
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                            {crmTab === 'interactions' && (
                                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                                    {/* Left: Form */}
                                    <div className="w-full lg:w-1/3 bg-gray-50 p-6 border-r border-gray-200 overflow-y-auto">
                                        <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Log New Interaction</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Type & Date</label>
                                                <div className="flex gap-2">
                                                    <select 
                                                        className="flex-1 border border-gray-300 rounded p-2 text-sm"
                                                        value={interactionType}
                                                        onChange={e => setInteractionType(e.target.value as any)}
                                                    >
                                                        <option value="CALL">Call</option>
                                                        <option value="MEETING">Meeting</option>
                                                        <option value="WHATSAPP">WhatsApp</option>
                                                        <option value="EMAIL">Email</option>
                                                    </select>
                                                    <input 
                                                        type="date" 
                                                        className="flex-1 border border-gray-300 rounded p-2 text-sm"
                                                        value={interactionDate}
                                                        onChange={e => setInteractionDate(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                                                <textarea 
                                                    className="w-full border border-gray-300 rounded p-2 text-sm h-24 focus:ring-indigo-500 focus:border-indigo-500"
                                                    placeholder="Summary of conversation..."
                                                    value={interactionNotes}
                                                    onChange={e => setInteractionNotes(e.target.value)}
                                                />
                                            </div>
                                            <div className="bg-indigo-50 p-3 rounded border border-indigo-100">
                                                <label className="block text-xs font-bold text-indigo-700 mb-1">Next Follow-up</label>
                                                <input 
                                                    type="date" 
                                                    className="w-full border border-indigo-200 rounded p-2 text-sm mb-2"
                                                    value={nextFollowUp}
                                                    onChange={e => setNextFollowUp(e.target.value)}
                                                />
                                                <div className="flex items-center">
                                                    <input 
                                                        type="checkbox" 
                                                        id="autoTaskModal" 
                                                        className="h-4 w-4 text-indigo-600 rounded mr-2"
                                                        checked={autoCreateTask}
                                                        onChange={e => setAutoCreateTask(e.target.checked)}
                                                    />
                                                    <label htmlFor="autoTaskModal" className="text-xs text-indigo-600">Create Task Automatically</label>
                                                </div>
                                            </div>
                                            <button onClick={handleAddInteraction} className="w-full bg-indigo-600 text-white py-2 rounded font-bold hover:bg-indigo-700 transition-colors">
                                                Log Interaction
                                            </button>
                                        </div>
                                    </div>

                                    {/* Right: Timeline */}
                                    <div className="flex-1 p-6 overflow-y-auto bg-white">
                                        <h3 className="font-bold text-gray-800 mb-6 text-sm uppercase tracking-wide">Timeline History</h3>
                                        <div className="space-y-6">
                                            {(!selectedLead.interactions || selectedLead.interactions.length === 0) && (
                                                <p className="text-center text-gray-400 py-10">No interactions recorded yet.</p>
                                            )}
                                            {selectedLead.interactions?.map((item, idx) => (
                                                <div key={item.id} className="relative pl-8 group">
                                                    {idx !== (selectedLead.interactions!.length - 1) && (
                                                        <div className="absolute top-8 left-[11px] bottom-[-24px] w-0.5 bg-gray-200 group-last:hidden"></div>
                                                    )}
                                                    <div className="absolute left-0 top-1 h-6 w-6 rounded-full bg-white border-2 border-indigo-200 flex items-center justify-center text-indigo-600 z-10">
                                                        {getInteractionIcon(item.type)}
                                                    </div>
                                                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative group-hover:border-indigo-200 transition-colors">
                                                        <button 
                                                            onClick={() => handleDeleteInteraction(item.id)}
                                                            className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 className="h-4 w-4"/>
                                                        </button>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">{item.type}</span>
                                                            <span className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{item.notes}</p>
                                                        {item.next_follow_up && (
                                                            <div className="mt-2 pt-2 border-t border-gray-50 flex items-center text-xs text-amber-600 font-medium">
                                                                <Clock className="h-3 w-3 mr-1"/> Follow-up: {new Date(item.next_follow_up).toLocaleDateString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {crmTab === 'tasks' && (
                                <div className="p-6 flex-1 flex flex-col overflow-hidden">
                                    <div className="flex gap-4 mb-6">
                                        <input 
                                            type="text" 
                                            className="flex-1 border border-gray-300 rounded p-2 text-sm"
                                            placeholder="Add new task for this client..."
                                            value={newTaskText}
                                            onChange={e => setNewTaskText(e.target.value)}
                                        />
                                        <input 
                                            type="date" 
                                            className="border border-gray-300 rounded p-2 text-sm"
                                            value={newTaskDate}
                                            onChange={e => setNewTaskDate(e.target.value)}
                                        />
                                        <button onClick={handleAddTask} className="bg-indigo-600 text-white px-4 py-2 rounded font-bold hover:bg-indigo-700">
                                            <Plus className="h-5 w-5"/>
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-2">
                                        {leadTasks.length === 0 && (
                                            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                                <CheckSquare className="h-10 w-10 mx-auto text-gray-300 mb-2"/>
                                                <p className="text-gray-500">No active tasks for this client.</p>
                                            </div>
                                        )}
                                        {leadTasks.map(task => (
                                            <div key={task.id} className={`p-4 rounded-lg border flex items-center justify-between transition-colors ${task.is_completed ? 'bg-gray-50 border-gray-200 opacity-70' : 'bg-white border-indigo-100 hover:shadow-md'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-5 w-5 rounded border flex items-center justify-center ${task.is_completed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                                                        {task.is_completed && <CheckSquare className="h-4 w-4 text-white"/>}
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-medium ${task.is_completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>{task.text}</p>
                                                        {task.due_date && (
                                                            <p className="text-xs text-gray-500 flex items-center mt-1">
                                                                <Calendar className="h-3 w-3 mr-1"/> Due: {new Date(task.due_date).toLocaleString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    Task ID: {task.id.substring(0,6)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WonLeads;