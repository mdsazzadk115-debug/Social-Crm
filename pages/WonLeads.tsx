
import React, { useState, useEffect } from 'react';
import { mockService } from '../services/mockService';
import { Lead, LeadStatus } from '../types';
import { Phone, Globe, Facebook, Save, CheckCircle, ExternalLink, Target, Copy, MessageCircle, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

const WonLeads: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingNote, setEditingNote] = useState<{id: string, text: string} | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const allLeads = await mockService.getLeads();
        // Filter only Closed Won
        setLeads(allLeads.filter(l => l.status === LeadStatus.CLOSED_WON));
        setLoading(false);
    };

    const handleNoteChange = (id: string, text: string) => {
        setEditingNote({ id, text });
    };

    const saveNote = async (id: string) => {
        if (editingNote && editingNote.id === id) {
            await mockService.updateLeadNote(id, editingNote.text);
            
            // Update local state to reflect saved status
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

    if (loading) return <div className="p-8 text-center text-gray-500">Loading won clients...</div>;

    return (
        <div className="space-y-6 font-inter">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <CheckCircle className="mr-2 h-7 w-7 text-green-600" /> Won Clients & Onboarding
                    </h1>
                    <p className="text-sm text-gray-500">Manage contact details and notes for your successful conversions.</p>
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
                            <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 truncate" title={lead.full_name}>{lead.full_name}</h3>
                                        <span className="text-xs bg-white text-green-700 px-2 py-0.5 rounded border border-green-200 mt-1 inline-block">
                                            {lead.service_category || lead.industry || 'General Client'}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => handleConvertToBigFish(lead.id)}
                                        className="text-indigo-600 hover:text-indigo-800 bg-white p-1.5 rounded-full shadow-sm hover:bg-indigo-50"
                                        title="Convert to Big Fish (VIP)"
                                    >
                                        <Target className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="p-5 space-y-4 flex-1">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase">Phone / WhatsApp</label>
                                    <div className="flex items-center justify-between mt-1">
                                        <a href={`tel:${lead.primary_phone}`} className="text-lg font-mono font-bold text-gray-800 hover:text-green-600 flex items-center">
                                            <Phone className="h-4 w-4 mr-2" /> {lead.primary_phone}
                                        </a>
                                        <button onClick={() => copyToClipboard(lead.primary_phone)} className="text-gray-400 hover:text-gray-600">
                                            <Copy className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-2 text-sm">
                                    {lead.facebook_profile_link && (
                                        <a href={lead.facebook_profile_link} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center p-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
                                            <Facebook className="h-4 w-4 mr-2" /> Facebook
                                        </a>
                                    )}
                                    {lead.website_url && (
                                        <a href={lead.website_url} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center p-2 bg-gray-50 text-gray-700 rounded hover:bg-gray-100">
                                            <Globe className="h-4 w-4 mr-2" /> Website
                                        </a>
                                    )}
                                </div>

                                {/* Note Section */}
                                <div className="pt-4 border-t border-gray-100">
                                    <label className="text-xs font-bold text-gray-400 uppercase flex justify-between items-center mb-2">
                                        Client Notes
                                        {editingNote?.id === lead.id && (
                                            <button onClick={() => saveNote(lead.id)} className="text-xs bg-green-600 text-white px-2 py-0.5 rounded flex items-center">
                                                <Save className="h-3 w-3 mr-1" /> Save
                                            </button>
                                        )}
                                    </label>
                                    <textarea 
                                        className="w-full bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-gray-800 min-h-[100px] focus:ring-yellow-400 focus:border-yellow-400"
                                        placeholder="Write important notes, onboarding details here..."
                                        value={editingNote?.id === lead.id ? editingNote.text : (lead.quick_note || '')}
                                        onChange={(e) => handleNoteChange(lead.id, e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="bg-gray-50 p-3 border-t border-gray-200 text-xs text-center text-gray-500">
                                Added on {new Date(lead.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WonLeads;
