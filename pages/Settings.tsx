import React, { useState, useEffect } from 'react';
import { mockService } from '../services/mockService';
import { SystemSettings } from '../types';
import { Save, Facebook, MessageSquare, Globe, Copy, Check, Info, Users, Layout, Workflow, RefreshCw, Lock, FileText, ExternalLink } from 'lucide-react';

const Settings: React.FC = () => {
    const [settings, setSettings] = useState<SystemSettings>({
        facebook_page_token: '',
        facebook_verify_token: '',
        sms_api_key: '',
        sms_sender_id: '',
        sms_base_url: '',
        timezone: 'Asia/Dhaka',
        portal_support_phone: '',
        portal_support_url: '',
        portal_fb_group: '',
        system_api_key: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'facebook' | 'sms' | 'portal' | 'general' | 'api'>('facebook');
    const [copied, setCopied] = useState(false);
    const [scriptCopied, setScriptCopied] = useState(false);

    useEffect(() => {
        mockService.getSystemSettings().then(data => {
            // Generate API key if missing
            if (!data.system_api_key) {
                data.system_api_key = 'lg_' + Math.random().toString(36).substr(2, 16);
                mockService.saveSystemSettings(data);
            }
            setSettings(data);
            setIsLoading(false);
        });
    }, []);

    const handleChange = (field: keyof SystemSettings, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        await mockService.saveSystemSettings(settings);
        alert('Settings saved successfully!');
    };

    const regenerateApiKey = async () => {
        if(confirm("Are you sure? This will invalidate the old key and break existing n8n connections.")) {
            const newKey = 'lg_' + Math.random().toString(36).substr(2, 16) + Math.random().toString(36).substr(2, 6);
            handleChange('system_api_key', newKey);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const copyScriptToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setScriptCopied(true);
        setTimeout(() => setScriptCopied(false), 2000);
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

    const webhookUrl = window.location.origin + '/api/v1/lead-ingest';

    // Google Apps Script Template
    const googleAppsScript = `
function onFormSubmit(e) {
  // --- CONFIGURATION ---
  var API_URL = "${webhookUrl}";
  var API_KEY = "${settings.system_api_key}";
  
  // Mapping: Google Form Question Title -> System Field
  // Change the values on the left to match your Google Form Questions exactly
  var fieldMapping = {
    "Name": "name",           // Form has a question "Name"
    "Full Name": "name",      // Alternative
    "Phone": "phone",         // Form has a question "Phone"
    "Mobile Number": "phone", // Alternative
    "Facebook Link": "fb_link",
    "Website": "website",
    "Message": "message",
    "Comments": "message",
    "Category": "category"    // For Service Category
  };
  
  // ---------------------
  
  try {
    var responses = e.namedValues;
    var payload = {};

    // Auto-map fields
    for (var question in responses) {
      if (fieldMapping[question]) {
        payload[fieldMapping[question]] = responses[question][0];
      }
    }

    // Default source
    payload["source"] = "Google Form";

    // Validation
    if (!payload["phone"]) {
      Logger.log("Skipping: No phone number found.");
      return;
    }

    var options = {
      'method' : 'post',
      'contentType': 'application/json',
      'headers': { 'x-api-key': API_KEY },
      'payload' : JSON.stringify(payload)
    };

    UrlFetchApp.fetch(API_URL, options);
    
  } catch (error) {
    Logger.log(error.toString());
  }
}
`.trim();

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">⚙️ Settings & Integrations</h1>
                    <p className="text-sm text-gray-500">Configure API keys, webhooks, and system preferences.</p>
                </div>
                <button 
                    onClick={handleSave}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 flex items-center font-medium shadow-sm"
                >
                    <Save className="h-4 w-4 mr-2" /> Save Changes
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* TABS */}
                <div className="flex border-b border-gray-200 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('facebook')}
                        className={`flex-1 py-4 px-4 text-sm font-medium text-center border-b-2 transition-colors flex items-center justify-center whitespace-nowrap ${activeTab === 'facebook' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Facebook className="h-4 w-4 mr-2"/> Facebook
                    </button>
                    <button
                        onClick={() => setActiveTab('api')}
                        className={`flex-1 py-4 px-4 text-sm font-medium text-center border-b-2 transition-colors flex items-center justify-center whitespace-nowrap ${activeTab === 'api' ? 'border-orange-500 text-orange-600 bg-orange-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Workflow className="h-4 w-4 mr-2"/> API & n8n
                    </button>
                    <button
                        onClick={() => setActiveTab('sms')}
                        className={`flex-1 py-4 px-4 text-sm font-medium text-center border-b-2 transition-colors flex items-center justify-center whitespace-nowrap ${activeTab === 'sms' ? 'border-green-600 text-green-600 bg-green-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <MessageSquare className="h-4 w-4 mr-2"/> SMS Gateway
                    </button>
                    <button
                        onClick={() => setActiveTab('portal')}
                        className={`flex-1 py-4 px-4 text-sm font-medium text-center border-b-2 transition-colors flex items-center justify-center whitespace-nowrap ${activeTab === 'portal' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Layout className="h-4 w-4 mr-2"/> Portal Support
                    </button>
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`flex-1 py-4 px-4 text-sm font-medium text-center border-b-2 transition-colors flex items-center justify-center whitespace-nowrap ${activeTab === 'general' ? 'border-gray-600 text-gray-600 bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Globe className="h-4 w-4 mr-2"/> General
                    </button>
                </div>

                {/* CONTENT */}
                <div className="p-8">
                    
                    {/* FACEBOOK TAB */}
                    {activeTab === 'facebook' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0"/>
                                <div className="text-sm text-blue-800">
                                    <p className="font-bold mb-1">How to connect:</p>
                                    <ol className="list-decimal ml-4 space-y-1">
                                        <li>Go to <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="underline">Facebook Developers Console</a>.</li>
                                        <li>Create an app and add "Messenger" product.</li>
                                        <li>Generate a <strong>Page Access Token</strong> and paste it below.</li>
                                        <li>Setup Webhook using the URL & Verify Token provided here.</li>
                                    </ol>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Page Access Token</label>
                                <input 
                                    type="password" 
                                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm font-mono focus:ring-blue-500 focus:border-blue-500"
                                    value={settings.facebook_page_token}
                                    onChange={(e) => handleChange('facebook_page_token', e.target.value)}
                                    placeholder="EAA..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Verify Token (Custom)</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm font-mono focus:ring-blue-500 focus:border-blue-500"
                                    value={settings.facebook_verify_token}
                                    onChange={(e) => handleChange('facebook_verify_token', e.target.value)}
                                    placeholder="my_secure_token"
                                />
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <label className="block text-sm font-bold text-gray-900 mb-2">Webhook Callback URL</label>
                                <div className="flex gap-2">
                                    <input 
                                        readOnly
                                        className="flex-1 bg-gray-100 border border-gray-300 rounded-md p-2.5 text-sm font-mono text-gray-600"
                                        value={window.location.origin + '/api/webhook'}
                                    />
                                    <button 
                                        onClick={() => copyToClipboard(window.location.origin + '/api/webhook')}
                                        className="bg-white border border-gray-300 px-4 rounded-md hover:bg-gray-50 flex items-center"
                                    >
                                        {copied ? <Check className="h-4 w-4 text-green-600"/> : <Copy className="h-4 w-4 text-gray-600"/>}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Paste this URL in the Facebook App Dashboard &gt; Messenger &gt; Settings &gt; Webhooks.</p>
                            </div>
                        </div>
                    )}

                    {/* API & N8N & GOOGLE FORMS TAB */}
                    {activeTab === 'api' && (
                        <div className="space-y-10">
                            
                            {/* SECTION 1: CREDENTIALS */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">1. System API Credentials</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL (POST)</label>
                                    <div className="flex gap-2">
                                        <input 
                                            readOnly
                                            type="text" 
                                            className="flex-1 bg-gray-50 border border-gray-300 rounded-md p-2.5 text-sm font-mono text-gray-600 select-all"
                                            value={webhookUrl}
                                        />
                                        <button 
                                            onClick={() => copyToClipboard(webhookUrl)}
                                            className="bg-white border border-gray-300 px-4 rounded-md hover:bg-gray-50 flex items-center"
                                        >
                                            <Copy className="h-4 w-4 text-gray-600"/>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">System API Key (Header: x-api-key)</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input 
                                                readOnly
                                                type="text" 
                                                className="w-full bg-gray-50 border border-gray-300 rounded-md p-2.5 text-sm font-mono text-gray-600"
                                                value={settings.system_api_key}
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <Lock className="h-4 w-4 text-gray-400"/>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => copyToClipboard(settings.system_api_key || '')}
                                            className="bg-white border border-gray-300 px-4 rounded-md hover:bg-gray-50 flex items-center"
                                            title="Copy Key"
                                        >
                                            <Copy className="h-4 w-4 text-gray-600"/>
                                        </button>
                                        <button 
                                            onClick={regenerateApiKey}
                                            className="bg-white border border-gray-300 px-4 rounded-md hover:bg-red-50 hover:text-red-600 flex items-center"
                                            title="Regenerate Key"
                                        >
                                            <RefreshCw className="h-4 w-4"/>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: GOOGLE FORMS INTEGRATION */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b pb-2">
                                    <FileText className="h-5 w-5 text-purple-600"/>
                                    <h3 className="text-lg font-bold text-gray-900">2. Google Forms Integration</h3>
                                </div>
                                
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mb-4">
                                    <p className="text-sm text-purple-900 font-medium">Instructions:</p>
                                    <ol className="list-decimal ml-5 text-sm text-purple-800 space-y-1 mt-2">
                                        <li>Open your Google Form.</li>
                                        <li>Click the 3 dots (top right) {'>'} <strong>Script Editor</strong>.</li>
                                        <li>Delete everything and paste the code below.</li>
                                        <li>Click <strong>Save</strong>, then click the <strong>Clock Icon (Triggers)</strong> on the left sidebar.</li>
                                        <li>Add Trigger: Function: <code>onFormSubmit</code>, Event Source: <code>From form</code>, Event Type: <code>On form submit</code>.</li>
                                        <li>Save and grant permissions. Done!</li>
                                    </ol>
                                </div>

                                <div className="relative">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Apps Script Code (Auto-Generated)</label>
                                    <textarea 
                                        readOnly
                                        className="w-full h-64 bg-gray-900 text-green-400 font-mono text-xs p-4 rounded-lg focus:outline-none"
                                        value={googleAppsScript}
                                    />
                                    <button 
                                        onClick={() => copyScriptToClipboard(googleAppsScript)}
                                        className="absolute top-8 right-4 bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded text-xs flex items-center border border-white/20 backdrop-blur-sm"
                                    >
                                        {scriptCopied ? <Check className="h-3 w-3 mr-1"/> : <Copy className="h-3 w-3 mr-1"/>}
                                        {scriptCopied ? 'Copied' : 'Copy Code'}
                                    </button>
                                </div>
                            </div>

                            {/* SECTION 3: N8N GUIDE */}
                            <div className="space-y-4 pt-4">
                                <div className="flex items-center gap-2 border-b pb-2">
                                    <Workflow className="h-5 w-5 text-orange-600"/>
                                    <h3 className="text-lg font-bold text-gray-900">3. n8n / Zapier Guide</h3>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                                        <div className="flex justify-between border-b border-gray-200 py-1">
                                            <span>Method:</span>
                                            <span className="font-mono font-bold text-gray-800">POST</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-200 py-1">
                                            <span>Authentication:</span>
                                            <span className="font-mono text-gray-800">Header Auth</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-200 py-1">
                                            <span>Header Name:</span>
                                            <span className="font-mono font-bold text-indigo-600">x-api-key</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-200 py-1">
                                            <span>Header Value:</span>
                                            <span className="font-mono text-gray-800">Your API Key</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">JSON Body Example</label>
                                        <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                                            <pre className="text-xs text-orange-300 font-mono">
{`{
  "name": "Karim Uddin",
  "phone": "01712345678",
  "email": "karim@example.com",
  "message": "Interested in package",
  "source": "n8n Automation",
  "category": "Facebook Marketing",
  "fb_link": "https://fb.com/..."
}`}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SMS TAB */}
                    {activeTab === 'sms' && (
                        <div className="space-y-6">
                            <p className="text-sm text-gray-600">Configure your local SMS Gateway provider details here.</p>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gateway API URL</label>
                                <input 
                                    type="url" 
                                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-green-500 focus:border-green-500"
                                    value={settings.sms_base_url}
                                    onChange={(e) => handleChange('sms_base_url', e.target.value)}
                                    placeholder="https://api.sms-provider.com/v3/send"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                                    <input 
                                        type="password" 
                                        className="w-full border border-gray-300 rounded-md p-2.5 text-sm font-mono focus:ring-green-500 focus:border-green-500"
                                        value={settings.sms_api_key}
                                        onChange={(e) => handleChange('sms_api_key', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sender ID</label>
                                    <input 
                                        type="text" 
                                        className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-green-500 focus:border-green-500"
                                        value={settings.sms_sender_id}
                                        onChange={(e) => handleChange('sms_sender_id', e.target.value)}
                                        placeholder="MyBrand"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PORTAL SUPPORT TAB */}
                    {activeTab === 'portal' && (
                        <div className="space-y-6">
                            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-6">
                                <h3 className="font-bold text-indigo-800 text-sm flex items-center mb-1">
                                    <Info className="h-4 w-4 mr-2"/> Global Portal Settings
                                </h3>
                                <p className="text-xs text-indigo-700">
                                    These details will appear in the "Need Support?" section of <strong>ALL</strong> client portals.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Support Phone / WhatsApp</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    value={settings.portal_support_phone || ''}
                                    onChange={(e) => handleChange('portal_support_phone', e.target.value)}
                                    placeholder="+88017..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Support Website / Helpdesk URL</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    value={settings.portal_support_url || ''}
                                    onChange={(e) => handleChange('portal_support_url', e.target.value)}
                                    placeholder="https://socialads.expert/support"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Private Facebook Group Link</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    value={settings.portal_fb_group || ''}
                                    onChange={(e) => handleChange('portal_fb_group', e.target.value)}
                                    placeholder="https://facebook.com/groups/..."
                                />
                            </div>
                        </div>
                    )}

                    {/* GENERAL TAB */}
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">System Timezone</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    value={settings.timezone}
                                    onChange={(e) => handleChange('timezone', e.target.value)}
                                >
                                    <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                                    <option value="UTC">UTC</option>
                                    <option value="America/New_York">America/New_York (EST)</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-2">All automations and logs will follow this timezone.</p>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Settings;