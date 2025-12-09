import React, { useState, useEffect } from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { Search, ChevronRight, ChevronLeft, Download, Phone, Briefcase, User, AlertCircle, Globe, MessageCircle, PenTool, Calendar, FileText, Plus, X, Save, ArrowUpDown, Star, Facebook, Edit2 } from 'lucide-react';
import { mockService } from '../services/mockService';
import { Lead, LeadStatus, LeadSource } from '../types';
import { STATUS_LABELS, STATUS_COLORS, INDUSTRIES } from '../constants';

const ITEMS_PER_PAGE = 50;

const LeadList: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc'>('date_desc');
  
  // Date Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Note Modal State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNoteLeadId, setEditingNoteLeadId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // Settings Modal for Industries
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [industriesList, setIndustriesList] = useState<string[]>(INDUSTRIES);
  const [newIndustryName, setNewIndustryName] = useState('');

  // Manual Lead Entry Modal
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [newLeadData, setNewLeadData] = useState({
      full_name: '',
      primary_phone: '',
      industry: '',
      source: LeadSource.MANUAL,
      status: LeadStatus.NEW,
      service_category: 'Facebook Marketing',
      facebook_profile_link: '',
      website_url: ''
  });

  // Edit Lead Modal
  const [isEditLeadOpen, setIsEditLeadOpen] = useState(false);
  const [editingLeadData, setEditingLeadData] = useState<Partial<Lead>>({});

  useEffect(() => {
    loadLeads();
    loadIndustries();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterIndustry, filterSource, filterStatus, showFavoritesOnly, startDate, endDate]);

  const loadLeads = async () => {
    setLoading(true);
    const data = await mockService.getLeads();
    setLeads(data);
    setLoading(false);
  };

  const loadIndustries = async () => {
      const list = await mockService.getIndustries();
      setIndustriesList(list);
  };

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
      const updatedLeads = leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l);
      setLeads(updatedLeads);
      await mockService.updateLeadStatus(leadId, newStatus);
  };

  const handleIndustryChange = async (leadId: string, newIndustry: string) => {
      const updatedLeads = leads.map(l => l.id === leadId ? { ...l, industry: newIndustry } : l);
      setLeads(updatedLeads);
      await mockService.updateLeadIndustry(leadId, newIndustry);
  };

  const handleStarToggle = async (leadId: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const updatedLeads = leads.map(l => l.id === leadId ? { ...l, is_starred: !l.is_starred } : l);
      setLeads(updatedLeads);
      await mockService.toggleLeadStar(leadId);
  };

  // WhatsApp Logic
  const handleWhatsApp = (lead: Lead) => {
      let num = lead.primary_phone.replace(/\D/g, '');
      if(num.startsWith('01')) num = '88' + num;
      
      const text = `Hi ${lead.full_name}, welcome to Social Ads Expert! Saw your interest in ${lead.service_category || lead.industry || 'our services'}. How can we help?`;
      const url = `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
  };

  // Note Handlers
  const openNoteModal = (lead: Lead) => {
      setEditingNoteLeadId(lead.id);
      setEditingNoteText(lead.quick_note || '');
      setIsNoteModalOpen(true);
  };

  const saveNote = async () => {
      if(editingNoteLeadId) {
          const updatedLeads = leads.map(l => l.id === editingNoteLeadId ? { ...l, quick_note: editingNoteText } : l);
          setLeads(updatedLeads);
          await mockService.updateLeadNote(editingNoteLeadId, editingNoteText);
          setIsNoteModalOpen(false);
          setEditingNoteLeadId(null);
      }
  };

  // Industry Management
  const handleAddIndustry = async () => {
      if(!newIndustryName) return;
      await mockService.addIndustry(newIndustryName);
      setNewIndustryName('');
      loadIndustries();
  };

  const handleDeleteIndustry = async (name: string) => {
      if(confirm(`Remove "${name}" from list?`)) {
          await mockService.deleteIndustry(name);
          loadIndustries();
      }
  };

  // Manual Lead Entry
  const handleAddLead = async () => {
      if(!newLeadData.full_name || !newLeadData.primary_phone) return alert("Name and Phone are required");
      await mockService.createLead(newLeadData);
      setIsAddLeadOpen(false);
      // Reset form
      setNewLeadData({
          full_name: '',
          primary_phone: '',
          industry: '',
          source: LeadSource.MANUAL,
          status: LeadStatus.NEW,
          service_category: 'Facebook Marketing',
          facebook_profile_link: '',
          website_url: ''
      });
      loadLeads();
  };

  // Edit Lead Logic
  const openEditLeadModal = (lead: Lead) => {
      setEditingLeadData({
          id: lead.id,
          full_name: lead.full_name,
          primary_phone: lead.primary_phone,
          facebook_profile_link: lead.facebook_profile_link,
          website_url: lead.website_url,
          industry: lead.industry
      });
      setIsEditLeadOpen(true);
  };

  const handleEditLeadSave = async () => {
      if (!editingLeadData.id) return;
      
      await mockService.updateLead(editingLeadData.id, editingLeadData);
      
      // Local Update
      const updatedLeads = leads.map(l => l.id === editingLeadData.id ? { ...l, ...editingLeadData } : l);
      setLeads(updatedLeads as Lead[]);
      
      setIsEditLeadOpen(false);
      setEditingLeadData({});
  };

  const isRecent = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      return diffInHours < 24;
  };

  // Stats Logic
  const stats = {
      total: leads.length,
      favorites: leads.filter(l => l.is_starred).length,
      new: leads.filter(l => l.status === LeadStatus.NEW).length,
      attempted: leads.filter(l => l.status === LeadStatus.ATTEMPTED_CONTACT).length,
      interested: leads.filter(l => l.status === LeadStatus.INTERESTED).length,
      hot: leads.filter(l => l.status === LeadStatus.HOT).length,
      lost: leads.filter(l => l.status === LeadStatus.CLOSED_LOST || l.status === LeadStatus.COLD).length,
  };

  const industryCounts: Record<string, number> = {};
  industriesList.forEach(ind => industryCounts[ind] = 0);
  leads.forEach(l => { if (l.industry && industryCounts[l.industry] !== undefined) industryCounts[l.industry]++; });

  const sourceCounts: Record<string, number> = {
      [LeadSource.FACEBOOK_MESSENGER]: 0, [LeadSource.WEBSITE]: 0, [LeadSource.MANUAL]: 0, [LeadSource.IMPORT]: 0, [LeadSource.FORM]: 0
  };
  leads.forEach(l => { if (sourceCounts[l.source] !== undefined) sourceCounts[l.source]++; else sourceCounts[LeadSource.MANUAL]++; });

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || lead.primary_phone.includes(searchTerm);
    const matchesIndustry = filterIndustry === 'all' || lead.industry === filterIndustry;
    const matchesSource = filterSource === 'all' || lead.source === filterSource;
    const matchesFavorites = !showFavoritesOnly || lead.is_starred;
    
    // Date Filtering
    const leadDate = new Date(lead.created_at);
    // Reset time part for accurate date comparison
    leadDate.setHours(0, 0, 0, 0);
    
    let matchesDate = true;
    if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchesDate = matchesDate && leadDate >= start;
    }
    if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && leadDate <= end;
    }

    if (showFavoritesOnly) return matchesFavorites && matchesSearch && matchesIndustry && matchesSource && matchesDate;

    if (filterStatus === 'all') return matchesSearch && matchesIndustry && matchesSource && matchesDate;
    if (filterStatus === 'lost_group') return (lead.status === LeadStatus.CLOSED_LOST || lead.status === LeadStatus.COLD) && matchesSearch && matchesIndustry && matchesSource && matchesDate;
    return lead.status === filterStatus && matchesSearch && matchesIndustry && matchesSource && matchesDate;
  }).sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortBy === 'date_desc' ? dateB - dateA : dateA - dateB;
  });

  const totalPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE);
  const displayedLeads = filteredLeads.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleDownload = async (e: React.MouseEvent, data: Lead[], filename: string) => {
    e.stopPropagation();
    if (data.length === 0) return alert("No leads to download.");

    const ids = data.map(l => l.id);
    await mockService.incrementDownloadCount(ids);
    
    const updatedLeads = leads.map(l => ids.includes(l.id) ? { ...l, download_count: (l.download_count || 0) + 1 } : l);
    setLeads(updatedLeads);

    const csvContent = [
        ['Name', 'Phone', 'Facebook', 'Website', 'Note', 'Industry', 'Source', 'Status', 'Date Added'],
        ...data.map(l => [`"${l.full_name}"`, `"${l.primary_phone}"`, `"${l.facebook_profile_link || ''}"`, `"${l.website_url || ''}"`, `"${l.quick_note || ''}"`, `"${l.industry || ''}"`, `"${l.source}"`, `"${l.status}"`, `"${new Date(l.created_at).toLocaleDateString()}"`])
    ].map(e => e.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatCardClass = (statusKey: string, baseColor: string) => {
      const isActive = filterStatus === statusKey && !showFavoritesOnly;
      return `cursor-pointer p-4 rounded-xl border-2 transition-all shadow-sm flex items-center justify-between group relative ${
          isActive ? `bg-${baseColor}-50 border-${baseColor}-500 ring-1 ring-${baseColor}-500` : `bg-white border-transparent hover:border-${baseColor}-200 hover:shadow-md`
      }`;
  };

  return (
    <div className="space-y-6 font-inter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👥 Lead Management</h1>
          <p className="text-sm text-gray-500">Track, filter and manage your leads efficiently.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setIsAddLeadOpen(true)} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-2" /> Add New Lead
            </button>
            <button onClick={(e) => handleDownload(e, filteredLeads, 'visible_leads')} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Download className="h-4 w-4 mr-2" /> Export View
            </button>
        </div>
      </div>

      {/* --- STATS ROW --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div onClick={() => { setFilterStatus('all'); setFilterSource('all'); setFilterIndustry('all'); setSearchTerm(''); setShowFavoritesOnly(false); setStartDate(''); setEndDate(''); }} className={`cursor-pointer p-4 rounded-xl border-2 transition-all shadow-sm flex items-center justify-between group relative ${filterStatus === 'all' && !showFavoritesOnly ? 'bg-slate-50 border-slate-400 ring-1 ring-slate-400' : 'bg-white border-transparent hover:border-slate-300 hover:shadow-md'}`}>
              <div><p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Leads</p><p className="text-2xl font-extrabold text-gray-800 mt-1">{stats.total}</p></div>
              <button onClick={(e) => handleDownload(e, leads, 'all_leads')} className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors" title="Download All"><Download className="h-4 w-4"/></button>
          </div>

          <div onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setFilterStatus('all'); }} className={`cursor-pointer p-4 rounded-xl border-2 transition-all shadow-sm flex items-center justify-between group relative ${showFavoritesOnly ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-400' : 'bg-white border-transparent hover:border-amber-200 hover:shadow-md'}`}>
              <div><p className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center">Favorites <Star className="h-3 w-3 ml-1 fill-amber-500 text-amber-500"/></p><p className="text-2xl font-extrabold text-amber-600 mt-1">{stats.favorites}</p></div>
              <button onClick={(e) => handleDownload(e, leads.filter(l => l.is_starred), 'favorites_leads')} className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-amber-200 text-amber-400 hover:text-amber-700 transition-colors" title="Download Favorites"><Download className="h-4 w-4"/></button>
          </div>
          
          <div onClick={() => { setFilterStatus(filterStatus === LeadStatus.NEW ? 'all' : LeadStatus.NEW); setShowFavoritesOnly(false); }} className={getStatCardClass(LeadStatus.NEW, 'blue')}>
              <div><p className="text-xs font-bold text-gray-500 uppercase tracking-wider">New Leads</p><p className="text-2xl font-extrabold text-blue-600 mt-1">{stats.new}</p></div>
              <button onClick={(e) => handleDownload(e, leads.filter(l => l.status === LeadStatus.NEW), 'new_leads')} className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-blue-200 text-blue-400 hover:text-blue-700 transition-colors" title="Download New"><Download className="h-4 w-4"/></button>
          </div>
          
          <div onClick={() => { setFilterStatus(filterStatus === LeadStatus.ATTEMPTED_CONTACT ? 'all' : LeadStatus.ATTEMPTED_CONTACT); setShowFavoritesOnly(false); }} className={getStatCardClass(LeadStatus.ATTEMPTED_CONTACT, 'yellow')}>
              <div><p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Attempted</p><p className="text-2xl font-extrabold text-yellow-600 mt-1">{stats.attempted}</p></div>
              <button onClick={(e) => handleDownload(e, leads.filter(l => l.status === LeadStatus.ATTEMPTED_CONTACT), 'attempted_leads')} className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-yellow-200 text-yellow-400 hover:text-yellow-700 transition-colors" title="Download Attempted"><Download className="h-4 w-4"/></button>
          </div>
          
          <div onClick={() => { setFilterStatus(filterStatus === LeadStatus.INTERESTED ? 'all' : LeadStatus.INTERESTED); setShowFavoritesOnly(false); }} className={getStatCardClass(LeadStatus.INTERESTED, 'indigo')}>
              <div><p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Interested</p><p className="text-2xl font-extrabold text-indigo-600 mt-1">{stats.interested}</p></div>
              <button onClick={(e) => handleDownload(e, leads.filter(l => l.status === LeadStatus.INTERESTED), 'interested_leads')} className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-indigo-200 text-indigo-400 hover:text-indigo-700 transition-colors" title="Download Interested"><Download className="h-4 w-4"/></button>
          </div>
          
          <div onClick={() => { setFilterStatus(filterStatus === LeadStatus.HOT ? 'all' : LeadStatus.HOT); setShowFavoritesOnly(false); }} className={getStatCardClass(LeadStatus.HOT, 'orange')}>
              <div><p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hot Leads</p><p className="text-2xl font-extrabold text-orange-600 mt-1">{stats.hot}</p></div>
              <button onClick={(e) => handleDownload(e, leads.filter(l => l.status === LeadStatus.HOT), 'hot_leads')} className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-orange-200 text-orange-400 hover:text-orange-700 transition-colors" title="Download Hot"><Download className="h-4 w-4"/></button>
          </div>
          
          <div onClick={() => { setFilterStatus(filterStatus === 'lost_group' ? 'all' : 'lost_group'); setShowFavoritesOnly(false); }} className={`cursor-pointer p-4 rounded-xl border-2 transition-all shadow-sm flex items-center justify-between group relative ${filterStatus === 'lost_group' && !showFavoritesOnly ? 'bg-red-50 border-red-500 ring-1 ring-red-500' : 'bg-white border-transparent hover:border-red-200 hover:shadow-md'}`}>
              <div><p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lost / Cold</p><p className="text-2xl font-extrabold text-red-600 mt-1">{stats.lost}</p></div>
              <button onClick={(e) => handleDownload(e, leads.filter(l => l.status === LeadStatus.CLOSED_LOST || l.status === LeadStatus.COLD), 'lost_leads')} className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-red-200 text-red-400 hover:text-red-700 transition-colors" title="Download Lost"><Download className="h-4 w-4"/></button>
          </div>
      </div>

      {/* --- FILTER BOARD --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div>
                    <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm" placeholder="Search leads by name or phone number..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                
                {/* DATE FILTER */}
                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                    <div className="bg-indigo-50 p-1.5 rounded-md text-indigo-600">
                        <Calendar className="h-4 w-4" />
                    </div>
                    <div className="flex gap-2 items-center text-sm">
                        <input 
                            type="date" 
                            className="border-none text-xs text-gray-600 font-medium focus:ring-0 p-0"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            title="Start Date"
                        />
                        <span className="text-gray-400">-</span>
                        <input 
                            type="date" 
                            className="border-none text-xs text-gray-600 font-medium focus:ring-0 p-0"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            title="End Date"
                        />
                    </div>
                    {(startDate || endDate) && (
                        <button onClick={() => {setStartDate(''); setEndDate('');}} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500"><X className="h-3 w-3"/></button>
                    )}
                </div>

                {/* SORTING */}
                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm min-w-[200px]">
                    <div className="bg-indigo-50 p-1.5 rounded-md text-indigo-600">
                        <ArrowUpDown className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col flex-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase leading-none">Sort By</span>
                        <select 
                            className="border-none text-sm focus:ring-0 text-gray-800 font-bold py-0 pl-0 pr-6 cursor-pointer bg-transparent leading-none"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                        >
                            <option value="date_desc">Newest First (নতুন আগে)</option>
                            <option value="date_asc">Oldest First (পুরাতন আগে)</option>
                        </select>
                    </div>
                </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 p-2">
              <div className="p-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center"><Globe className="h-3 w-3 mr-1 text-indigo-500"/> By Source</h4>
                  <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => setFilterSource('all')} 
                        className={`px-3 py-1 rounded text-[10px] font-bold border transition-colors ${filterSource === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                      >
                          All Sources
                      </button>
                      {Object.values(LeadSource).map(src => (
                          <button key={src} onClick={() => setFilterSource(filterSource === src ? 'all' : src)} className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors ${filterSource === src ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                              {src === LeadSource.FACEBOOK_MESSENGER ? 'Messenger' : src} <span className="ml-1 opacity-60">({sourceCounts[src] || 0})</span>
                          </button>
                      ))}
                  </div>
              </div>
              
              <div className="p-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center"><Briefcase className="h-3 w-3 mr-1 text-indigo-500"/> By Industry / Category</h4>
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
                      <button 
                        onClick={() => setFilterIndustry('all')} 
                        className={`px-3 py-1 rounded text-[10px] font-bold border transition-colors ${filterIndustry === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                      >
                          All Industries
                      </button>
                      {industriesList.map(ind => (
                          <button key={ind} onClick={() => setFilterIndustry(filterIndustry === ind ? 'all' : ind)} className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors ${filterIndustry === ind ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                              {ind.split('(')[0]} <span className="ml-1 opacity-60">({industryCounts[ind] || 0})</span>
                          </button>
                      ))}
                      <button onClick={() => setIsSettingsOpen(true)} className="px-2 py-1 rounded text-[10px] font-medium border border-dashed border-gray-300 text-gray-400 hover:text-indigo-600 hover:border-indigo-300 flex items-center">
                          <Plus className="h-3 w-3 mr-1"/> Manage
                      </button>
                  </div>
              </div>
          </div>
      </div>

      {/* --- LEAD LIST --- */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
        <div className="hidden md:flex px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <div className="w-8 text-center">Fav</div>
            <div className="flex-1">Profile & Contact</div>
            <div className="w-20 text-center">Links</div>
            <div className="w-32">Source</div>
            <div className="w-32">Industry</div>
            <div className="w-24">Date Added</div>
            <div className="w-32">Status</div>
            <div className="w-16 text-center">DL Count</div>
            <div className="w-24 text-right">Actions</div>
        </div>

        <ul className="divide-y divide-gray-200">
          {loading ? (
             <li className="px-6 py-12 text-center text-gray-500"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>Loading leads...</li>
          ) : displayedLeads.length === 0 ? (
             <li className="px-6 py-12 text-center text-gray-500 flex flex-col items-center"><AlertCircle className="h-10 w-10 text-gray-300 mb-2" />No leads found.</li>
          ) : (
            displayedLeads.map((lead) => {
                const recent = isRecent(lead.created_at);
                return (
              <li key={lead.id} className={`group hover:bg-gray-50 transition-colors ${recent ? 'bg-indigo-50/20' : ''}`}>
                  <div className="px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                    
                    <div className="md:w-8 flex justify-center items-center">
                        <button 
                            onClick={(e) => handleStarToggle(lead.id, e)}
                            className={`p-1.5 rounded-full transition-all duration-200 hover:scale-110 ${lead.is_starred ? 'text-amber-400 hover:text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}
                            title={lead.is_starred ? "Remove from Favorites" : "Add to Favorites"}
                        >
                            <Star className={`h-5 w-5 ${lead.is_starred ? 'fill-current' : ''}`} />
                        </button>
                    </div>

                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600">
                            <User className="h-4 w-4"/>
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <Link to={`/leads/${lead.id}`} className="text-sm font-bold text-indigo-600 truncate hover:underline">{lead.full_name}</Link>
                                {recent && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-100 text-green-700 animate-pulse">NEW</span>}
                            </div>
                            <div className="flex items-center text-xs text-gray-500 font-mono">
                                <Phone className="h-3 w-3 mr-1"/> {lead.primary_phone}
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleWhatsApp(lead); }}
                                    className="ml-2 text-green-500 hover:text-green-700 p-0.5 rounded hover:bg-green-50 transition-colors"
                                    title="Open in WhatsApp"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-center md:w-20 gap-2">
                        {lead.facebook_profile_link ? (
                            <a href={lead.facebook_profile_link} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800" title="Facebook Profile">
                                <Facebook className="h-4 w-4"/>
                            </a>
                        ) : (
                            <span className="text-gray-300"><Facebook className="h-4 w-4"/></span>
                        )}
                        
                        {lead.website_url ? (
                            <a href={lead.website_url} target="_blank" rel="noreferrer" className="text-emerald-600 hover:text-emerald-800" title="Website">
                                <Globe className="h-4 w-4"/>
                            </a>
                        ) : (
                            <span className="text-gray-300"><Globe className="h-4 w-4"/></span>
                        )}
                    </div>

                    <div className="flex items-center md:w-32 text-xs text-gray-500">
                        {lead.source === LeadSource.FACEBOOK_MESSENGER ? <MessageCircle className="h-3 w-3 mr-1 text-blue-500"/> : <PenTool className="h-3 w-3 mr-1 text-gray-400"/>}
                        <span className="truncate">{lead.source === 'facebook_messenger' ? 'Messenger' : lead.source}</span>
                    </div>

                    <div className="flex items-center md:w-32">
                        <select value={lead.industry || ''} onChange={(e) => handleIndustryChange(lead.id, e.target.value)} className="bg-transparent border-none p-0 text-xs text-gray-600 cursor-pointer focus:ring-0 truncate w-full">
                            <option value="">No Industry</option>
                            {industriesList.map(ind => <option key={ind} value={ind}>{ind.split('(')[0]}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center md:w-24 text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1 text-gray-400"/>
                        {new Date(lead.created_at).toLocaleDateString()}
                    </div>

                    <div className="md:w-32 flex-shrink-0">
                        <select value={lead.status} onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)} className={`block w-full py-1 pl-2 pr-6 text-[10px] font-bold rounded-full border-0 cursor-pointer focus:ring-0 ${STATUS_COLORS[lead.status]}`}>
                            {Object.keys(STATUS_LABELS).map(key => <option key={key} value={key} className="bg-white text-gray-900">{STATUS_LABELS[key as LeadStatus]}</option>)}
                        </select>
                    </div>

                    <div className="md:w-16 flex justify-center">
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${lead.download_count > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`} title="Number of times exported">
                            {lead.download_count || 0}
                        </span>
                    </div>

                    <div className="relative group/note flex-shrink-0 md:w-24 flex justify-end gap-1">
                        <button 
                            onClick={() => openEditLeadModal(lead)} 
                            className="p-2 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Edit Info"
                        >
                            <Edit2 className="h-4 w-4" />
                        </button>
                        
                        <button onClick={() => openNoteModal(lead)} className={`p-2 rounded-full transition-colors ${lead.quick_note ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}`}>
                            {lead.quick_note ? <FileText className="h-4 w-4 fill-amber-100" /> : <Plus className="h-4 w-4" />}
                        </button>
                        {lead.quick_note && (
                            <div className="absolute right-8 top-1/2 -translate-x-0 -translate-y-1/2 hidden group-hover/note:block w-64 bg-yellow-50 text-gray-800 text-xs p-3 rounded-lg shadow-xl border border-yellow-200 z-50">
                                <div className="font-bold mb-1 text-yellow-700">Note:</div>
                                {lead.quick_note}
                            </div>
                        )}
                    </div>

                  </div>
              </li>
            )})
          )}
        </ul>

        {filteredLeads.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-700">Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredLeads.length)}</span> of <span className="font-medium">{filteredLeads.length}</span> results</p>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="h-5 w-5"/></button>
                      <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="h-5 w-5"/></button>
                  </nav>
              </div>
          </div>
        )}
      </div>

      {/* NOTE EDIT MODAL */}
      {isNoteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="bg-white rounded-lg w-full max-w-sm shadow-xl overflow-hidden">
                  <div className="bg-amber-50 px-4 py-3 border-b border-amber-100 flex justify-between items-center">
                      <h3 className="font-bold text-amber-800 flex items-center"><FileText className="h-4 w-4 mr-2"/> Quick Note</h3>
                      <button onClick={() => setIsNoteModalOpen(false)} className="text-amber-700 hover:text-amber-900"><X className="h-5 w-5"/></button>
                  </div>
                  <div className="p-4">
                      <textarea 
                        className="w-full border border-gray-300 rounded-md p-3 text-sm h-32 focus:ring-amber-500 focus:border-amber-500" 
                        placeholder="Add important details about this lead..." 
                        value={editingNoteText} 
                        onChange={e => setEditingNoteText(e.target.value)}
                        autoFocus
                      />
                  </div>
                  <div className="px-4 py-3 bg-gray-50 flex justify-end gap-2">
                      <button onClick={() => setIsNoteModalOpen(false)} className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded">Cancel</button>
                      <button onClick={saveNote} className="px-4 py-1.5 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded shadow-sm flex items-center">
                          <Save className="h-3 w-3 mr-1.5"/> Save Note
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* INDUSTRY SETTINGS MODAL */}
      {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
                  <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
                      <h3 className="font-bold text-gray-800">Manage Industries</h3>
                      <button onClick={() => setIsSettingsOpen(false)}><X className="h-5 w-5 text-gray-500"/></button>
                  </div>
                  <div className="p-4">
                      <div className="flex gap-2 mb-4">
                          <input 
                            type="text" 
                            className="flex-1 border border-gray-300 rounded-md p-2 text-sm text-gray-900"
                            placeholder="New Industry Name"
                            value={newIndustryName}
                            onChange={e => setNewIndustryName(e.target.value)}
                          />
                          <button onClick={handleAddIndustry} className="bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-bold hover:bg-indigo-700">Add</button>
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                          {industriesList.map(ind => (
                              <div key={ind} className="flex justify-between items-center p-2 bg-white rounded border border-gray-200 text-sm shadow-sm hover:border-indigo-200 transition-colors">
                                  <span className="text-gray-800 font-medium">{ind}</span>
                                  <button onClick={() => handleDeleteIndustry(ind)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded"><X className="h-4 w-4"/></button>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MANUAL LEAD ENTRY MODAL */}
      {isAddLeadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-indigo-600 rounded-t-lg">
                      <h3 className="font-bold text-white flex items-center"><Plus className="h-5 w-5 mr-2"/> Add New Lead</h3>
                      <button onClick={() => setIsAddLeadOpen(false)}><X className="h-5 w-5 text-white/80 hover:text-white"/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                          <input 
                            className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500" 
                            placeholder="Customer Name"
                            value={newLeadData.full_name}
                            onChange={e => setNewLeadData({...newLeadData, full_name: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                          <input 
                            className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500 font-mono" 
                            placeholder="017..."
                            value={newLeadData.primary_phone}
                            onChange={e => setNewLeadData({...newLeadData, primary_phone: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Profile Link</label>
                          <input 
                            className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500" 
                            placeholder="https://facebook.com/..."
                            value={newLeadData.facebook_profile_link}
                            onChange={e => setNewLeadData({...newLeadData, facebook_profile_link: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                          <input 
                            className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500" 
                            placeholder="https://example.com"
                            value={newLeadData.website_url}
                            onChange={e => setNewLeadData({...newLeadData, website_url: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                          <select 
                            className="w-full border border-gray-300 rounded-md p-2.5 text-sm"
                            value={newLeadData.industry}
                            onChange={e => setNewLeadData({...newLeadData, industry: e.target.value})}
                          >
                              <option value="">Select Industry</option>
                              {industriesList.map(i => <option key={i} value={i}>{i.split('(')[0]}</option>)}
                          </select>
                      </div>
                      <div className="pt-2">
                          <button onClick={handleAddLead} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg shadow-sm">
                              Create Lead
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* EDIT LEAD MODAL */}
      {isEditLeadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
                      <h3 className="font-bold text-gray-800 flex items-center"><Edit2 className="h-4 w-4 mr-2"/> Edit Contact Info</h3>
                      <button onClick={() => setIsEditLeadOpen(false)}><X className="h-5 w-5 text-gray-500 hover:text-gray-700"/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                          <input 
                            className="w-full border border-gray-300 rounded-md p-2.5 text-sm" 
                            value={editingLeadData.full_name || ''}
                            onChange={e => setEditingLeadData({...editingLeadData, full_name: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                          <input 
                            className="w-full border border-gray-300 rounded-md p-2.5 text-sm font-mono" 
                            value={editingLeadData.primary_phone || ''}
                            onChange={e => setEditingLeadData({...editingLeadData, primary_phone: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Profile</label>
                          <input 
                            className="w-full border border-gray-300 rounded-md p-2.5 text-sm" 
                            value={editingLeadData.facebook_profile_link || ''}
                            onChange={e => setEditingLeadData({...editingLeadData, facebook_profile_link: e.target.value})}
                            placeholder="https://"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                          <input 
                            className="w-full border border-gray-300 rounded-md p-2.5 text-sm" 
                            value={editingLeadData.website_url || ''}
                            onChange={e => setEditingLeadData({...editingLeadData, website_url: e.target.value})}
                            placeholder="https://"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                          <select 
                            className="w-full border border-gray-300 rounded-md p-2.5 text-sm"
                            value={editingLeadData.industry || ''}
                            onChange={e => setEditingLeadData({...editingLeadData, industry: e.target.value})}
                          >
                              <option value="">Select Industry</option>
                              {industriesList.map(i => <option key={i} value={i}>{i.split('(')[0]}</option>)}
                          </select>
                      </div>
                      <div className="pt-2 flex gap-3">
                          <button onClick={() => setIsEditLeadOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-2.5 rounded-lg">Cancel</button>
                          <button onClick={handleEditLeadSave} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg shadow-sm">
                              Update Lead
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default LeadList;