
import React, { useState, useEffect } from 'react';
import { mockService } from '../services/mockService';
import { LeadForm } from '../types';
import { Plus, Edit2, Trash2, Eye, Link as LinkIcon, Code, Copy, Check, Save } from 'lucide-react';

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

    const getPublicLink = (id: string) => {
        // In a real app, this would be the actual domain.
        // For this demo, we assume the router handles /f/:id
        const baseUrl = window.location.origin + window.location.pathname + '#/f/' + id;
        return baseUrl;
    };

    const getEmbedCode = (id: string) => {
        const url = getPublicLink(id);
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
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            <Save className="h-4 w-4 mr-2"/>
                            Save Form
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {forms.map(form => {
                         const formColor = THEME_COLORS[form.config.theme_color || 'indigo'];
                         return (
                        <div key={form.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all">
                            <div className="h-2 rounded-t-lg" style={{ backgroundColor: formColor }}></div>
                            <div className="p-5">
                                <h3 className="text-lg font-bold text-gray-900 truncate">{form.title}</h3>
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2 min-h-[40px]">{form.subtitle}</p>
                                
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {form.config.include_industry && <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">Industry</span>}
                                    {form.config.include_website && <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">Website</span>}
                                    {form.config.include_facebook && <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">FB Link</span>}
                                </div>

                                <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100">
                                    <div className="flex space-x-1">
                                        <button 
                                            onClick={() => handleEdit(form)}
                                            className="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50"
                                            title="Edit"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(form.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => setShowShareModal(form.id)}
                                        className="inline-flex items-center px-3 py-1.5 border border-indigo-200 text-indigo-700 text-xs font-medium rounded-full hover:bg-indigo-50"
                                    >
                                        <LinkIcon className="h-3 w-3 mr-1" />
                                        Share / Embed
                                    </button>
                                </div>
                            </div>
                        </div>
                    )})}
                    {forms.length === 0 && (
                        <div className="col-span-full py-12 text-center bg-white border-2 border-dashed border-gray-300 rounded-lg">
                            <p className="text-gray-500">No forms created yet. Click "Create New Form" to get started.</p>
                        </div>
                    )}
                </div>
            )}

            {/* SHARE MODAL */}
            {showShareModal && (
                <div className="fixed z-20 inset-0 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowShareModal(null)}></div>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Share Form</h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Public Link (WhatsApp, Messenger)</label>
                                        <div className="flex rounded-md shadow-sm">
                                            <input 
                                                type="text" 
                                                readOnly
                                                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 bg-gray-50 text-sm text-gray-500"
                                                value={getPublicLink(showShareModal)}
                                            />
                                            <button 
                                                onClick={() => copyToClipboard(getPublicLink(showShareModal))}
                                                className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200"
                                            >
                                                {copied ? <Check className="h-4 w-4 text-green-600"/> : <Copy className="h-4 w-4"/>}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Website Embed Code</label>
                                        <div className="relative">
                                            <textarea 
                                                readOnly
                                                rows={3}
                                                className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-xs font-mono text-gray-600"
                                                value={getEmbedCode(showShareModal)}
                                            />
                                             <button 
                                                onClick={() => copyToClipboard(getEmbedCode(showShareModal))}
                                                className="absolute top-2 right-2 p-1 bg-white border border-gray-300 rounded hover:bg-gray-100"
                                            >
                                                {copied ? <Check className="h-3 w-3 text-green-600"/> : <Copy className="h-3 w-3"/>}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex justify-center">
                                         <a 
                                            href={getPublicLink(showShareModal)} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="text-sm text-indigo-600 hover:underline flex items-center"
                                         >
                                             <Eye className="h-4 w-4 mr-1"/> Preview Form
                                         </a>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button 
                                    type="button" 
                                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setShowShareModal(null)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Forms;
