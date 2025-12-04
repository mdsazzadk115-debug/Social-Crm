import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Phone, User, Facebook, Globe } from 'lucide-react';
import { mockService } from '../services/mockService';
import { Lead, Interaction, LeadStatus, MessageTemplate, Channel, MessageDirection } from '../types';
import { STATUS_LABELS, INDUSTRIES } from '../constants';

const LeadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      Promise.all([
        mockService.getLeadById(id),
        mockService.getInteractions(id)
      ]).then(([l, i]) => {
        setLead(l || null);
        setInteractions(i);
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

  if (loading) return <div>Loading...</div>;
  if (!lead) return <div>Lead not found</div>;

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Column: Lead Info */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <User className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{lead.full_name || 'Unknown'}</h2>
              <p className="text-gray-500 text-sm">{lead.source === 'facebook_messenger' ? 'From Messenger' : 'Manual Entry'}</p>
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
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2" />
                {lead.primary_phone}
              </div>
              {lead.facebook_profile_link && (
                <div className="flex items-center text-sm text-blue-600">
                  <Facebook className="h-4 w-4 mr-2" />
                  <a href={lead.facebook_profile_link} target="_blank" rel="noreferrer" className="hover:underline truncate">Facebook Profile</a>
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

      {/* Right Column: Interaction History (Send SMS Removed) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Timeline */}
        <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Activity History</h3>
            <div className="flow-root">
                <ul className="-mb-8">
                    {interactions.length === 0 && <li className="text-gray-500 text-sm text-center py-4">No interactions yet.</li>}
                    {interactions.map((interaction, idx) => (
                        <li key={interaction.id}>
                            <div className="relative pb-8">
                                {idx !== interactions.length - 1 ? (
                                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                                ) : null}
                                <div className="relative flex space-x-3">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                        interaction.direction === MessageDirection.OUTGOING ? 'bg-blue-500' : 'bg-green-500'
                                    }`}>
                                        {interaction.channel === Channel.SMS ? (
                                            <span className="text-white text-xs font-bold">SMS</span>
                                        ) : (
                                            <Facebook className="h-4 w-4 text-white" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                        <div>
                                            <p className="text-sm text-gray-500">
                                                {interaction.direction === MessageDirection.OUTGOING ? 'Sent to' : 'Received from'}{' '}
                                                <span className="font-medium text-gray-900">Lead</span>
                                            </p>
                                            <div className="mt-1 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                                                {interaction.content}
                                            </div>
                                        </div>
                                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                            <time dateTime={interaction.created_at}>
                                                {new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(interaction.created_at))}
                                            </time>
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