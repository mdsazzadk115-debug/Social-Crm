import React, { useState, useEffect } from 'react';
import { mockService } from '../services/mockService';
import { Campaign, MessageTemplate, Channel } from '../types';
import { Plus, Trash2, Clock, PlayCircle } from 'lucide-react';

const Campaigns: React.FC = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [isCreateMode, setIsCreateMode] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [steps, setSteps] = useState<{delay_days: number, template_id: string}[]>([
        { delay_days: 0, template_id: '' }
    ]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        mockService.getCampaigns().then(setCampaigns);
        mockService.getTemplates().then(setTemplates);
    };

    const handleAddStep = () => {
        setSteps([...steps, { delay_days: 1, template_id: '' }]);
    };

    const handleRemoveStep = (index: number) => {
        const newSteps = [...steps];
        newSteps.splice(index, 1);
        setSteps(newSteps);
    };

    const updateStep = (index: number, field: string, value: any) => {
        const newSteps = [...steps];
        // @ts-ignore
        newSteps[index][field] = value;
        setSteps(newSteps);
    };

    const handleSave = async () => {
        if (!name) return alert("Please enter a campaign name");
        if (steps.some(s => !s.template_id)) return alert("All steps must have a template selected");

        try {
            // Generate IDs for steps as required by CampaignStep interface
            const stepsWithIds = steps.map(s => ({
                ...s,
                id: Math.random().toString(36).substr(2, 9)
            }));

            await mockService.createCampaign({
                name,
                description,
                steps: stepsWithIds,
                is_active: true
            });
            setIsCreateMode(false);
            setName('');
            setDescription('');
            setSteps([{ delay_days: 0, template_id: '' }]);
            loadData();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6">
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Automation Campaigns</h1>
                    <p className="mt-1 text-sm text-gray-500">Create Drip Sequences (e.g., Step 1 -> Wait 10 Days -> Step 2)</p>
                </div>
                {!isCreateMode && (
                    <button
                        onClick={() => setIsCreateMode(true)}
                        className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        New Campaign
                    </button>
                )}
            </div>

            {isCreateMode ? (
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Create Sequence</h3>
                    
                    <div className="grid grid-cols-1 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Campaign Name</label>
                            <input 
                                type="text" 
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" 
                                placeholder="e.g., 30-Day Nurture Sequence"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <input 
                                type="text" 
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" 
                                placeholder="Short description..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">Steps</label>
                        {steps.map((step, idx) => (
                            <div key={idx} className="flex items-center space-x-4 bg-gray-50 p-4 rounded-md border border-gray-200">
                                <div className="flex-shrink-0">
                                    <span className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-bold">
                                        {idx + 1}
                                    </span>
                                </div>
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">Wait (Days)</label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Clock className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <input
                                                type="number"
                                                min="0"
                                                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2"
                                                placeholder="0 = Immediate"
                                                value={step.delay_days}
                                                onChange={(e) => updateStep(idx, 'delay_days', parseInt(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">Send Template</label>
                                        <select
                                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                            value={step.template_id}
                                            onChange={(e) => updateStep(idx, 'template_id', e.target.value)}
                                        >
                                            <option value="">Select Template</option>
                                            {templates.filter(t => t.channel === Channel.SMS).map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                {steps.length > 1 && (
                                    <button onClick={() => handleRemoveStep(idx)} className="text-red-600 hover:text-red-800 p-2">
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 flex space-x-4">
                        <button onClick={handleAddStep} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
                            <Plus className="h-4 w-4 mr-1" /> Add Step
                        </button>
                    </div>

                    <div className="mt-8 flex justify-end space-x-3 border-t border-gray-200 pt-5">
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
                            Save Campaign
                         </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {campaigns.map(campaign => (
                        <div key={campaign.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                                        <PlayCircle className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 truncate">
                                            {campaign.name}
                                        </h3>
                                        <div className="text-sm text-gray-500">
                                            {campaign.steps.length} Steps
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <p className="text-sm text-gray-500">
                                        {campaign.description || "No description provided."}
                                    </p>
                                </div>
                                <div className="mt-4 flex items-center justify-between text-sm">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Active
                                    </span>
                                    <span className="text-gray-500">
                                        {campaign.active_leads_count} Leads Enrolled
                                    </span>
                                </div>
                                <div className="mt-4 border-t border-gray-100 pt-4">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sequence Preview</h4>
                                    <ul className="space-y-2">
                                        {campaign.steps.slice(0, 3).map((step, i) => {
                                            const tmpl = templates.find(t => t.id === step.template_id);
                                            return (
                                                <li key={i} className="text-xs text-gray-600 flex justify-between">
                                                    <span>Day {step.delay_days}:</span>
                                                    <span className="truncate w-32">{tmpl?.name || 'Unknown Template'}</span>
                                                </li>
                                            );
                                        })}
                                        {campaign.steps.length > 3 && <li className="text-xs text-gray-400">...and more</li>}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                    {campaigns.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                            <p className="text-gray-500">No campaigns created yet.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Campaigns;