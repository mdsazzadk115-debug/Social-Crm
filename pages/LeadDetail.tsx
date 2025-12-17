
import React, { useEffect, useState } from 'react';
// @ts-ignore
import { useParams } from 'react-router-dom';
import { Phone, User, Facebook, Globe, MessageCircle, Zap, Send, Copy, Briefcase, DollarSign, Target, ShoppingBag, AlertCircle, ShieldCheck, FileText, CheckSquare, Wallet, TrendingUp } from 'lucide-react';
import { mockService } from '../services/mockService';
import { Lead, LeadStatus, Channel, MessageTemplate } from '../types';
import { STATUS_LABELS, INDUSTRIES } from '../constants';

const LeadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      Promise.all([
        mockService.getLeadById(id),
        mockService.getTemplates()
      ]).then(([l, t]) => {
        setLead(l || null);
        setTemplates(t);
        setLoading(false);
      });
    }
  }, [id]);

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!lead) return;
    await mockService.updateLeadStatus(lead.id, newStatus);
    mockService.getLeadById(lead.id).then(setLead);
  };

  const handleQuickReply = (templateBody: string) => {
      if(!lead) return;
      let num = lead.primary_phone.replace(/[^\d]/g, '');
      if(num.startsWith('01')) num = '88' + num;
      else if(num.startsWith('1')) num = '880' + num;

      const msg = templateBody.replace(/\[Name\]/g, lead.full_name);
      const url = `https://web.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');

      mockService.addLeadInteraction(lead.id, {
          type: 'WHATSAPP',
          date: new Date().toISOString(),
          notes: `WhatsApp Sent: "${msg.substring(0, 40)}..."`,
      }).then(() => mockService.getLeadById(lead.id).then(setLead));
  };

  const getInteractionIcon = (type: string) => {
      switch(type) {
          case 'CALL': return <Phone className="h-4 w-4"/>;
          case 'WHATSAPP': return <MessageCircle className="h-4 w-4"/>;
          case 'SMS': return <Smartphone className="h-4 w-4"/>;
          case 'INVOICE': return <FileText className="h-4 w-4"/>;
          case 'TASK': return <CheckSquare className="h-4 w-4"/>;
          case 'BALANCE': return <Wallet className="h-4 w-4"/>;
          case 'SALE': return <TrendingUp className="h-4 w-4"/>;
          default: return <Zap className="h-4 w-4"/>;
      }
  };

  const getInteractionColor = (type: string) => {
      switch(type) {
          case 'INVOICE': return 'bg-orange-100 text-orange-600 border-orange-200';
          case 'TASK': return 'bg-yellow-100 text-yellow-600 border-yellow-200';
          case 'BALANCE': return 'bg-purple-100 text-purple-600 border-purple-200';
          case 'SALE': return 'bg-green-100 text-green-600 border-green-200';
          case 'WHATSAPP': return 'bg-green-50 text-green-600 border-green-200';
          case 'SMS': return 'bg-blue-50 text-blue-600 border-blue-200';
          default: return 'bg-gray-100 text-gray-600 border-gray-200';
      }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading details...</div>;
  if (!lead) return <div className="p-8 text-center text-red-500">Lead not found</div>;

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 font-inter">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <User className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{lead.full_name}</h2>
              <span className="text-xs text-gray-500">ID: {lead.id}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Lead Status</label>
              <select
                value={lead.status}
                onChange={(e) => handleStatusChange(e.target.value as any)}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm text-sm"
              >
                {Object.keys(STATUS_LABELS).map(key => (
                  <option key={key} value={key}>{STATUS_LABELS[key as any]}</option>
                ))}
              </select>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2" /> {lead.primary_phone}
              </div>
              {lead.facebook_profile_link && (
                <div className="flex items-center text-sm text-blue-600">
                  <Facebook className="h-4 w-4 mr-2" />
                  <a href={lead.facebook_profile_link} target="_blank" rel="noreferrer" className="hover:underline truncate">Facebook Profile</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white shadow rounded-lg overflow-hidden border border-indigo-50">
            <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex justify-between items-center">
                <h3 className="font-bold text-indigo-900 flex items-center"><Zap className="h-4 w-4 mr-2"/> Quick Actions</h3>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templates.filter(t => t.channel === 'sms').slice(0, 4).map(t => (
                    <button
                        key={t.id}
                        onClick={() => handleQuickReply(t.body)}
                        className="text-left p-3 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all flex items-start"
                    >
                        <MessageCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2"/>
                        <div>
                            <span className="block text-sm font-bold text-gray-800">{t.name}</span>
                            <span className="block text-[10px] text-gray-500 line-clamp-1">{t.body}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <History className="h-5 w-5 mr-2 text-indigo-600"/> Activity History & Timeline
            </h3>
            <div className="flow-root">
                <ul className="-mb-8">
                    {(!lead.interactions || lead.interactions.length === 0) && (
                        <p className="text-center text-gray-400 py-4 text-sm italic">No activities recorded for this lead yet.</p>
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
                                                <span className="font-normal text-gray-400 ml-2 text-xs">
                                                    {new Date(interaction.date).toLocaleString()}
                                                </span>
                                            </p>
                                            <div className="mt-1 text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
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

const History = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
);

const Smartphone = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
);

export default LeadDetail;
