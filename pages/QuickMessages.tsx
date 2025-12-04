
import React, { useState, useEffect } from 'react';
import { mockService } from '../services/mockService';
import { Snippet } from '../types';
import { Copy, Plus, Edit2, Trash2, Download, Check } from 'lucide-react';

const QuickMessages: React.FC = () => {
    const [snippets, setSnippets] = useState<Snippet[]>([]);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editSnippet, setEditSnippet] = useState<Partial<Snippet>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        mockService.getSnippets().then(setSnippets);
    };

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleSave = async () => {
        if (!editSnippet.title || !editSnippet.body) return alert("Fields required");
        if (editSnippet.id) {
            await mockService.updateSnippet(editSnippet.id, editSnippet);
        } else {
            await mockService.createSnippet(editSnippet as any);
        }
        setIsEditMode(false);
        setEditSnippet({});
        loadData();
    };

    const handleDelete = async (id: string) => {
        if(confirm("Delete snippet?")) {
            await mockService.deleteSnippet(id);
            loadData();
        }
    };

    const handleDownloadAll = () => {
        const text = snippets.map(s => `=== ${s.title} (${s.category}) ===\n${s.body}\n`).join('\n-------------------\n\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'quick_messages.txt';
        a.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">⚡ Quick Messages</h1>
                    <p className="text-sm text-gray-500">Copy-paste ready templates for common scenarios.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleDownloadAll} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center">
                        <Download className="h-4 w-4 mr-2" /> Export All
                    </button>
                    <button onClick={() => { setEditSnippet({}); setIsEditMode(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center">
                        <Plus className="h-4 w-4 mr-2" /> New Snippet
                    </button>
                </div>
            </div>

            {isEditMode ? (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-bold mb-4">{editSnippet.id ? 'Edit Snippet' : 'New Snippet'}</h3>
                    <div className="space-y-4">
                        <input 
                            className="w-full border border-gray-300 rounded p-2" 
                            placeholder="Title (e.g. Payment Info)" 
                            value={editSnippet.title || ''} 
                            onChange={e => setEditSnippet({...editSnippet, title: e.target.value})}
                        />
                        <input 
                            className="w-full border border-gray-300 rounded p-2" 
                            placeholder="Category (e.g. Payment, Report)" 
                            value={editSnippet.category || ''} 
                            onChange={e => setEditSnippet({...editSnippet, category: e.target.value})}
                        />
                        <textarea 
                            className="w-full border border-gray-300 rounded p-2 h-32" 
                            placeholder="Message Body..." 
                            value={editSnippet.body || ''} 
                            onChange={e => setEditSnippet({...editSnippet, body: e.target.value})}
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsEditMode(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {snippets.map(s => (
                        <div key={s.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow relative group">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full mb-1">{s.category}</span>
                                    <h3 className="font-bold text-gray-900">{s.title}</h3>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditSnippet(s); setIsEditMode(true); }} className="p-1 text-gray-400 hover:text-indigo-600"><Edit2 className="h-4 w-4"/></button>
                                    <button onClick={() => handleDelete(s.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4"/></button>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 whitespace-pre-wrap font-sans border border-gray-100 h-32 overflow-y-auto mb-3">
                                {s.body}
                            </div>
                            <button 
                                onClick={() => handleCopy(s.id, s.body)}
                                className={`w-full flex items-center justify-center py-2 rounded-md text-sm font-medium transition-colors ${copiedId === s.id ? 'bg-green-100 text-green-700' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
                            >
                                {copiedId === s.id ? <><Check className="h-4 w-4 mr-2"/> Copied!</> : <><Copy className="h-4 w-4 mr-2"/> Copy Text</>}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
export default QuickMessages;
