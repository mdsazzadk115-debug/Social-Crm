
import React, { useState, useEffect } from 'react';
import { mockService } from '../services/mockService';
import { MessageTemplate, Channel } from '../types';
import { Plus, Edit2, Trash2, MessageSquare, Save, Layers, Layout, Target, Briefcase } from 'lucide-react';

const CATEGORIES = ['All', 'General', 'Facebook Marketing', 'Landing Page', 'Business Plan'];

const Templates: React.FC = () => {
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [activeCategory, setActiveCategory] = useState('All');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [channel, setChannel] = useState<Channel>(Channel.SMS);
    const [category, setCategory] = useState('General');
    const [body, setBody] = useState('');

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = () => {
        mockService.getTemplates().then(setTemplates);
    };

    const handleOpenCreate = () => {
        setEditingTemplate(null);
        setName('');
        setChannel(Channel.SMS);
        setCategory(activeCategory === 'All' ? 'General' : activeCategory);
        setBody('');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (template: MessageTemplate) => {
        setEditingTemplate(template);
        setName(template.name);
        setChannel(template.channel);
        setCategory(template.category || 'General');
        setBody(template.body);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this template?")) {
            await mockService.deleteTemplate(id);
            loadTemplates();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingTemplate) {
            // Update
            await mockService.updateTemplate(editingTemplate.id, {
                name,
                channel,
                category,
                body
            });
        } else {
            // Create
            await mockService.createTemplate({
                name,
                channel,
                category,
                body,
                type: 'custom',
                is_active: true
            });
        }
        
        setIsModalOpen(false);
        loadTemplates();
    };

    // Filter templates based on active category
    const filteredTemplates = activeCategory === 'All' 
        ? templates 
        : templates.filter(t => t.category === activeCategory);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">💬 Message Templates</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage your funnel scripts and automated messages.</p>
                </div>
                <button 
                    onClick={handleOpenCreate}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                </button>
            </div>

            {/* CATEGORY TABS */}
            <div className="border-b border-gray-200 overflow-x-auto">
                <nav className="-mb-px flex space-x-8 min-w-max" aria-label="Tabs">
                    {CATEGORIES.map((cat) => {
                         const isActive = activeCategory === cat;
                         return (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`
                                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center
                                    ${isActive 
                                        ? 'border-indigo-500 text-indigo-600' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }
                                `}
                            >
                                {cat === 'General' && <Layers className="h-4 w-4 mr-2"/>}
                                {cat === 'Facebook Marketing' && <Target className="h-4 w-4 mr-2"/>}
                                {cat === 'Landing Page' && <Layout className="h-4 w-4 mr-2"/>}
                                {cat === 'Business Plan' && <Briefcase className="h-4 w-4 mr-2"/>}
                                {cat}
                                <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-900'}`}>
                                    {cat === 'All' ? templates.length : templates.filter(t => t.category === cat).length}
                                </span>
                            </button>
                         );
                    })}
                </nav>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {filteredTemplates.map((template) => (
                        <li key={template.id} className="hover:bg-gray-50">
                            <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className={`p-2 rounded-lg mr-3 ${template.channel === Channel.SMS ? 'bg-green-100' : 'bg-blue-100'}`}>
                                            <MessageSquare className={`h-5 w-5 ${template.channel === Channel.SMS ? 'text-green-600' : 'text-blue-600'}`} />
                                        </div>
                                        <div>
                                            <div className="flex items-center">
                                                <p className="text-sm font-medium text-indigo-600 truncate">{template.name}</p>
                                                {template.category && (
                                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                        {template.category}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {template.channel === Channel.SMS ? 'SMS' : 'Messenger'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button 
                                            onClick={() => handleOpenEdit(template)}
                                            className="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50"
                                            title="Edit"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(template.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md w-full border border-gray-100 whitespace-pre-wrap font-sans">
                                        {template.body}
                                    </p>
                                </div>
                            </div>
                        </li>
                    ))}
                    {filteredTemplates.length === 0 && (
                         <li className="px-4 py-12 text-center text-gray-500 flex flex-col items-center">
                             <Layers className="h-8 w-8 text-gray-300 mb-2"/>
                             No templates found in this category.
                         </li>
                    )}
                </ul>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed z-10 inset-0 overflow-y-auto" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handleSubmit}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                                {editingTemplate ? 'Edit Template' : 'New Template'}
                                            </h3>
                                            <div className="mt-4 space-y-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Template Name</label>
                                                        <input 
                                                            type="text" 
                                                            required
                                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                            value={name}
                                                            onChange={e => setName(e.target.value)}
                                                            placeholder="e.g. Intro Message"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Category</label>
                                                        <select
                                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                            value={category}
                                                            onChange={e => setCategory(e.target.value)}
                                                        >
                                                            {CATEGORIES.filter(c => c !== 'All').map(c => (
                                                                <option key={c} value={c}>{c}</option>
                                                            ))}
                                                            <option value="Other">Other</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Channel</label>
                                                    <select
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                        value={channel}
                                                        onChange={e => setChannel(e.target.value as Channel)}
                                                    >
                                                        <option value={Channel.SMS}>SMS</option>
                                                        <option value={Channel.MESSENGER}>Facebook Messenger</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Message Body</label>
                                                    <textarea
                                                        rows={5}
                                                        required
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                                                        value={body}
                                                        onChange={e => setBody(e.target.value)}
                                                        placeholder="Type your message here..."
                                                    />
                                                    <div className="flex justify-between mt-1">
                                                         <p className="text-xs text-gray-500">Supports Bangla & English.</p>
                                                         <p className="text-xs text-gray-500">{body.length} chars</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button 
                                        type="submit" 
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Template
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsModalOpen(false)}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Templates;
