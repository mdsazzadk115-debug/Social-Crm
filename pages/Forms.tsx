

import React, { useState, useEffect } from 'react';
import { mockService } from '../services/mockService';
import { LeadForm } from '../types';
import { Plus, Edit2, Trash2, Link as LinkIcon, Copy, Check, Globe } from 'lucide-react';

const THEME_COLORS: Record<string, string> = {
    indigo: '#4f46e5',
    blue: '#2563eb',
    green: '#16a34a',
    red: '#dc2626',
    orange: '#ea580c',
    purple: '#9333ea',
    pink: '#db2777',
};

const Forms: React.FC = () => {
    const [forms, setForms] = useState<LeadForm[]>([]);
    const [isCreateMode, setIsCreateMode] = useState(false);
    const [editForm, setEditForm] = useState<Partial<LeadForm>>({});
    
    // Modal for Share/Embed
    const [showShareModal, setShowShareModal] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadForms();
    }, []);

    const loadForms = () => {
        mockService.getForms().then(setForms);
    };

    const handleCreateNew = () => {
        setEditForm({
            title: 'Contact Us',
            subtitle: 'Please fill out the form below.',
            config: {
                include_facebook: true,
                include_industry: true,
                include_website: true,
                theme_color: 'indigo'
            }
        });
        setIsCreateMode(true);
    };

    const handleEdit = (form: LeadForm) => {
        setEditForm(form);
        setIsCreateMode(true);
    };

    const handleDelete = async (id: string) => {
        if(confirm("Are you sure you want to delete this form?")) {
            await mockService.deleteForm(id);
            loadForms();
        }
    };

    const handleSave = async () => {
        if(!editForm.title) return alert("Title is required");

        try {
            if(editForm.id) {
                await mockService.updateForm(editForm.id, editForm);
            } else {
                await mockService.createForm(editForm as Omit<LeadForm, 'id' | 'created_at'>);
            }
            setIsCreateMode(false);
            loadForms();
        } catch(e) {
            console.error(e);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // --- UNIVERSAL LINK GENERATOR (Safe for Unicode/Bangla) ---
    const getPublicLink = (form: LeadForm) => {
        // We encode the form config into the URL so it opens anywhere without a database
        const payload = {
            t: form.title,
            s: form.subtitle,
            c: form.config
        };
        // Encode Unicode string to Base64
        const jsonStr = JSON.stringify(payload);
        const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
        
        // Use current location origin and pathname, stripping any hash or query params
        const baseUrl = window.location.href.split('#')[0];
        // Ensure no double slash if pathname ends with /
        const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl; 
        
        return `${cleanBase}/#/f/cfg-${encoded}`;
    };

    const getEmbedCode = (form: LeadForm) => {
        const url = getPublicLink(form);
        return `<iframe src="${url}" width="100%" height="600px" frameborder="0" style="border:0; width:100%; max-width:600px;"></iframe>`;
    };

    const currentThemeColor = editForm.config?.theme_color || 'indigo';
    const currentHex = THEME_COLORS[currentThemeColor] || THEME_COLORS['indigo'];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">📝 Lead Forms Builder</h1>
                    <p className="mt-1 text-sm text-gray-500">Create forms to collect leads from your website or social media.</p>
                </div>
                {!isCreateMode && (
                    <button 
                        onClick={handleCreateNew}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Form
                    </button>
                )}
            </div>

            {isCreateMode ? (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">{editForm.id ? 'Edit Form' : 'New Form Configuration'}</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Configuration */}
                        <div className="space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Form Title</label>
                                <input 
                                    type="text" 
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={editForm.title || ''}
                                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                                />
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Subtitle / Description</label>
                                <textarea 
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    rows={3}
                                    value={editForm.subtitle || ''}
                                    onChange={e => setEditForm({...editForm, subtitle: e.target.value})}
                                />
                             </div>
                             
                             <div className="pt-4 border-t border-gray-100">
                                 <h4 className="text-sm font-bold text-gray-900 mb-3">Form Fields</h4>
                                 <div className="space-y-3">
                                     <div className="flex items-center justify-between">
                                         <span className="text-sm text-gray-600">Full Name</span>
                                         <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">Required</span>
                                     </div>
                                     <div className="flex items-center justify-between">
                                         <span className="text-sm text-gray-600">Phone Number</span>
                                         <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">Required</span>
                                     </div>
                                     
                                     <label className="flex items-center justify-between cursor-pointer">
                                         <span className="text-sm text-gray-700">Include "Website URL"?</span>
                                         <input 
                                            type="checkbox" 
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            checked={editForm.config?.include_website}
                                            onChange={e => setEditForm({...editForm, config: {...editForm.config!, include_website: e.target.checked}})}
                                         />
                                     </label>
                                     <label className="flex items-center justify-between cursor-pointer">
                                         <span className="text-sm text-gray-700">Include "Facebook Profile"?</span>
                                         <input 
                                            type="checkbox" 
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            checked={editForm.config?.include_facebook}
                                            onChange={e => setEditForm({...editForm, config: {...editForm.config!, include_facebook: e.target.checked}})}
                                         />
                                     </label>
                                     <label className="flex items-center justify-between cursor-pointer">
                                         <span className="text-sm text-gray-700">Include "Industry/Category"?</span>
                                         <input 
                                            type="checkbox" 
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            checked={editForm.config?.include_industry}
                                            onChange={e => setEditForm({...editForm, config: {...editForm.config!, include_industry: e.target.checked}})}
                                         />
                                     </label>
                                 </div>
                             </div>

                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Theme Color</label>
                                <div className="flex space-x-2">
                                    {Object.keys(THEME_COLORS).map(color => (
                                        <button 
                                            key={color}
                                            type="button"
                                            onClick={() => setEditForm({...editForm, config: {...editForm.config!, theme_color: color}})}
                                            className={`h-8 w-8 rounded-full border-2 ${editForm.config?.theme_color === color ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: THEME_COLORS[color] }}
                                        >
                                        </button>
                                    ))}
                                </div>
                             </div>
                        </div>

                        {/* Live Preview */}
                        <div className="bg-gray-100 p-6 rounded-lg flex items-center justify-center">
                             <div className="bg-white rounded-lg shadow-lg w-full max-w-sm overflow-hidden">
                                 <div className="p-4" style={{ backgroundColor: currentHex }}>
                                     <h3 className="text-white font-bold text-lg">{editForm.title || 'Form Title'}</h3>
                                     <p className="text-white text-opacity-90 text-xs mt-1">{editForm.subtitle || 'Form description goes here.'}</p>
                                 </div>
                                 <div className="p-4 space-y-3">
                                     <div className="bg-gray-50 border border-gray-200 h-8 rounded animate-pulse"></div>
                                     <div className="bg-gray-50 border border-gray-200 h-8 rounded animate-pulse"></div>
                                     {editForm.config?.include_industry && <div className="bg-gray-50 border border-gray-200 h-8 rounded animate-pulse"></div>}
                                     {editForm.config?.include_website && <div className="bg-gray-50 border border-gray-200 h-8 rounded animate-pulse"></div>}
                                     <div 
                                        className="w-full h-8 rounded text-white text-xs font-bold flex items-center justify-center"
                                        style={{ backgroundColor: currentHex }}
                                     >
                                         Submit
                                     </div>
                                 </div>
                             </div>
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 flex justify-end space-x-3">
                        <button 
                            onClick={() => setIsCreateMode(false)}
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                        >
                            Save Form
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {forms.length === 0 ? (
                            <li className="px-6 py-12 text-center text-gray-500">No forms created yet.</li>
                        ) : (
                            forms.map((form) => (
                                <li key={form.id} className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">{form.title}</h3>
                                        <p className="text-xs text-gray-500">{form.subtitle}</p>
                                        <div className="flex gap-2 mt-2">
                                            {form.config.include_facebook && <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 rounded border border-blue-100">Facebook</span>}
                                            {form.config.include_website && <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 rounded border border-gray-200">Website</span>}
                                            {form.config.include_industry && <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 rounded border border-purple-100">Industry</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => {copyToClipboard(getPublicLink(form));}} className="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50" title="Copy Universal Link">
                                            {copied ? <Check className="h-4 w-4 text-green-500"/> : <LinkIcon className="h-4 w-4"/>}
                                        </button>
                                        <button onClick={() => {setShowShareModal(getEmbedCode(form));}} className="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50" title="Get Embed Code">
                                            <Globe className="h-4 w-4"/>
                                        </button>
                                        <button onClick={() => handleEdit(form)} className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50" title="Edit">
                                            <Edit2 className="h-4 w-4"/>
                                        </button>
                                        <button onClick={() => handleDelete(form.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50" title="Delete">
                                            <Trash2 className="h-4 w-4"/>
                                        </button>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}

            {/* Embed Code Modal */}
            {showShareModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-lg shadow-xl p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Embed / Share Code</h3>
                        <p className="text-xs text-green-600 mb-2 font-bold bg-green-50 p-2 rounded">
                            ✨ Generated Universal Link! This form will now work on any device or browser without requiring a shared database.
                        </p>
                        <textarea 
                            readOnly 
                            className="w-full h-32 p-3 border border-gray-300 rounded-md text-xs font-mono text-gray-600 focus:outline-none bg-gray-50"
                            value={showShareModal} 
                        />
                        <div className="mt-4 flex justify-end">
                            <button onClick={() => setShowShareModal(null)} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-indigo-700">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Forms;
