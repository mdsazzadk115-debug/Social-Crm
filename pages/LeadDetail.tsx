
import React, { useEffect, useState } from 'react';
// @ts-ignore
import { useParams } from 'react-router-dom';
import { Phone, User, Facebook, Globe, MessageCircle, Zap, Send, Copy, Briefcase, DollarSign, Target, ShoppingBag, AlertCircle, ShieldCheck, FileText, CheckSquare, Wallet, TrendingUp } from 'lucide-react';
import { mockService } from '../services/mockService';
import { Lead, Interaction, LeadStatus, Channel, MessageDirection, MessageTemplate } from '../types';
import { STATUS_LABELS, INDUSTRIES } from '../constants';

const LeadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      Promise.all([
        mockService.getLeadById(id),
        mockService.getInteractions(id),
        mockService.getTemplates()
      ]).then(([l, i, t]) => {
        setLead(l || null);
        setInteractions(i);
        setTemplates(t);
        setLoading(false);
      });
    }
  }, [id]);

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!lead) return;
    await mockService.updateLeadStatus(lead.id, newStatus);
    setLead({ ...lead, status: newStatus });
  };

  const handleIndustryChange = async (newIndustry: string) => {
    if (!lead) return;
    await mockService.updateLeadIndustry(lead.id, newIndustry);
    setLead({ ...lead, industry: newIndustry });
  };

  // --- QUICK REPLY HANDLER ---
  const handleQuickReply = (templateBody: string) => {
      if(!lead) return;

      // 1. Format Number
      let num = lead.primary_phone.replace(/[^\d]/g, '');
      if(num.startsWith('01')) num = '88' + num;
      else if(num.startsWith('1')) num = '880' + num;

      // 2. Personalize
      const msg = templateBody.replace(/\[Name\]/g, lead.full_name);

      // 3. Open WhatsApp Web
      const url = `https://web.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');

      // 4. Log Interaction (Automatic)
      mockService.addLeadInteraction(lead.id, {
          type: 'WHATSAPP',
          date: new Date().toISOString(),
          notes: `Sent via WhatsApp: "${msg.substring(0, 30)}..."`,
      }).then(() => {
          // Force refresh
          mockService.getLeadById(lead.id).then(l => setLead(l || null));
      });
  };

  const getInteractionIcon = (type: string) => {
      switch(type) {
          case 'CALL': return <Phone className="h-4 w-4"/>;
          case 'WHATSAPP': return <MessageCircle className="h-4 w-4"/>;
          case 'EMAIL': return <Send className="h-4 w-4"/>;
          case 'INVOICE': return <FileText className="h-4 w-4"/>;
          case 'TASK': return <CheckSquare className="h-4 w-4"/>;
          case 'BALANCE': return <Wallet className="h-4 w-4"/>;
          case 'SALE': return <TrendingUp className="h-4 w-4"/>;
          default: return <MessageCircle className="h-4 w-4"/>;
      }
  };

  const getInteractionColor = (type: string) => {
      switch(type) {
          case 'INVOICE': return 'bg-orange-100 text-orange-600 border-orange-200';
          case 'TASK': return 'bg-yellow-100 text-yellow-600 border-yellow-200';
          case 'BALANCE': return 'bg-purple-100 text-purple-600 border-purple-200';
          case 'SALE': return 'bg-green-100 text-green-600 border-green-200';
          case 'WHATSAPP': return 'bg-green-50 text-green-600 border-green-200';
          default: return 'bg-gray-100 text-gray-600 border-gray-200';
      }
  };

  if (loading) return <div>Loading...</div>;
  if (!lead) return <div>Lead not found</div>;

  const smsTemplates = templates.filter(t => t.channel === Channel.SMS);

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 font-inter">
      
      {/* Left Column: Lead Info */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <User className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="overflow-hidden">
              <h2 className="text-xl font-bold text-gray-900 truncate" title={lead.full_name}>{lead.full_name || 'Unknown'}</h2>
              <div className="flex flex-wrap gap-1 mt-1">
                  <p className="text-gray-500 text-sm">{lead.source === 'facebook_messenger' ? 'Messenger' : 'Manual / Form'}</p>
                  {lead.onboarding_data && (
                      <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold border border-yellow-200 flex items-center">
                          <ShieldCheck className="h-3 w-3 mr-1"/> Guarantee
                      </span>
                  )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={lead.status}
                onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {Object.keys(STATUS_LABELS).map(key => (
                  <option key={key} value={key}>{STATUS_LABELS[key as LeadStatus]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Industry</label>
              <select
                value={lead.industry || ''}
                onChange={(e) => handleIndustryChange(e.target.value)}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
              >
                <option value="">- Select Industry -</option>
                {INDUSTRIES.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    {lead.primary_phone}
                </div>
                <button 
                    onClick={() => {navigator.clipboard.writeText(lead.primary_phone); alert("Copied!");}}
                    className="text-gray-400 hover:text-indigo-600"
                >
                    <Copy className="h-3 w-3"/>
                </button>
              </div>
              {lead.facebook_profile_link && (
                <div className="flex items-center text-sm text-blue-600">
                  <Facebook className="h-4 w-4 mr-2" />
                  <a href={lead.facebook_profile_link} target="_blank" rel="noreferrer" className="hover:underline truncate">Facebook Profile / Page Link</a>
                </div>
              )}
              {lead.website_url && (
                <div className="flex items-center text-sm text-gray-600">
                  <Globe className="h-4 w-4 mr-2" />
                  <a href={lead.website_url} target="_blank" rel="noreferrer" className="hover:underline truncate">{lead.website_url}</a>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Metadata</h4>
                <div className="text-xs text-gray-500">
                    <p>Created: {new Date(lead.created_at).toLocaleDateString()}</p>
                    <p>Last Activity: {new Date(lead.last_activity_at).toLocaleDateString()}</p>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Quick Reply & History */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* NEW: Onboarding Data Card (Sales Guarantee Details) - TOP PRIORITY DISPLAY */}
        {lead.onboarding_data && (
            <div className="bg-white shadow-md rounded-xl border-2 border-yellow-400 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <ShieldCheck size={100} className="text-yellow-600"/>
                </div>
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 px-4 py-3 border-b border-yellow-200 flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="p-1.5 bg-yellow-100 rounded-full mr-3 border border-yellow-300">
                            <Briefcase className="h-5 w-5 text-yellow-700"/>
                        </div>
                        <h3 className="font-bold text-yellow-900 text-lg">Sales Guarantee Information</h3>
                    </div>
                    <span className="text-[10px] bg-yellow-500 text-white px-3 py-1 rounded-full font-bold uppercase shadow-sm">Form Submitted</span>
                </div>
                
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                    
                    {/* 1. Business Status (Current Plan) */}
                    <div className="col-span-1 md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center border-b border-gray-200 pb-2">
                            <AlertCircle className="h-3 w-3 mr-1 text-indigo-500"/> বর্তমান ব্যবসার অবস্থা (Current Situation)
                        </p>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {lead.onboarding_data.current_plan || 'N/A'}
                        </p>
                    </div>

                    {/* 2. Previous Budget */}
                    <div className="flex flex-col p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-white rounded-full text-blue-600 shadow-sm"><DollarSign className="h-4 w-4"/></div>
                            <p className="text-xs font-bold text-blue-800 uppercase">আগের বাজেট (Prev. Budget)</p>
                        </div>
                        <p className="text-lg font-bold text-gray-900 pl-8">{lead.onboarding_data.monthly_avg_budget || 'N/A'}</p>
                    </div>

                    {/* 3. Product Price */}
                    <div className="flex flex-col p-4 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-white rounded-full text-green-600 shadow-sm"><ShoppingBag className="h-4 w-4"/></div>
                            <p className="text-xs font-bold text-green-800 uppercase">প্রোডাক্ট প্রাইস (Price)</p>
                        </div>
                        <p className="text-lg font-bold text-gray-900 pl-8">{lead.onboarding_data.product_price || 'N/A'}</p>
                    </div>

                    {/* 4. Future Plan */}
                    <div className="flex flex-col p-4 bg-orange-50 rounded-lg border border-orange-100 col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-white rounded-full text-orange-600 shadow-sm"><Target className="h-4 w-4"/></div>
                            <p className="text-xs font-bold text-orange-800 uppercase">ফিউচার প্ল্যান (Future Plan)</p>
                        </div>
                        <p className="text-md font-medium text-gray-800 pl-8">{lead.onboarding_data.marketing_budget_willingness || 'N/A'}</p>
                    </div>
                </div>
            </div>
        )}

        {/* QUICK REPLY ACTIONS */}
        <div className="bg-white shadow rounded-lg overflow-hidden border border-indigo-100">
            <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex justify-between items-center">
                <h3 className="font-bold text-indigo-900 flex items-center">
                    <Zap className="h-4 w-4 mr-2 text-indigo-600 fill-indigo-600"/> Quick Reply Actions
                </h3>
                <span className="text-xs text-indigo-600 bg-white px-2 py-0.5 rounded-full font-bold">WhatsApp Web</span>
            </div>
            <div className="p-4">
                <p className="text-xs text-gray-500 mb-3">Click a template to open WhatsApp with the message pre-filled.</p>
                {smsTemplates.length === 0 ? (
                    <p className="text-sm text-center text-gray-400 py-2">No templates found. Create some in "Templates" page.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {smsTemplates.map(t => (
                            <button
                                key={t.id}
                                onClick={() => handleQuickReply(t.body)}
                                className="text-left p-3 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all group flex items-start"
                            >
                                <MessageCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2 group-hover:scale-110 transition-transform"/>
                                <div>
                                    <span className="block text-sm font-bold text-gray-800 group-hover:text-green-800">{t.name}</span>
                                    <span className="block text-xs text-gray-500 line-clamp-1 mt-0.5">{t.body}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
                
                <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500"
                            placeholder="Or type a custom message..."
                            onKeyDown={(e) => {
                                if(e.key === 'Enter') {
                                    handleQuickReply((e.target as HTMLInputElement).value);
                                    (e.target as HTMLInputElement).value = '';
                                }
                            }}
                        />
                        <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                            <Send className="h-4 w-4"/>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Timeline / Activity History (Consolidated) */}
        <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Activity History (CRM)</h3>
            <div className="flow-root">
                <ul className="-mb-8">
                    {(!lead.interactions || lead.interactions.length === 0) && (
                        <li className="text-gray-500 text-sm text-center py-4">No interactions yet. Start by sending a message or creating a task!</li>
                    )}
                    {lead.interactions?.map((interaction, idx) => (
                        <li key={interaction.id}>
                            <div className="relative pb-8">
                                {idx !== (lead.interactions?.length || 0) - 1 ? (
                                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                                ) : null}
                                <div className="relative flex space-x-3">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getInteractionColor(interaction.type)}`}>
                                        {getInteractionIcon(interaction.type)}
                                    </div>
                                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">
                                                {interaction.type}
                                                <span className="font-normal text-gray-500 ml-2 text-xs">
                                                    {new Date(interaction.date).toLocaleDateString()}
                                                </span>
                                            </p>
                                            <div className="mt-1 text-sm text-gray-700 bg-gray-50 p-2 rounded-md border border-gray-100">
                                                {interaction.notes}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetail;
