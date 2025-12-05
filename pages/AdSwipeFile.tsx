
import React, { useState, useEffect } from 'react';
import { mockService } from '../services/mockService';
import { AdInspiration } from '../types';
import { Plus, Trash2, ExternalLink, Image as ImageIcon, Filter, X, Sparkles } from 'lucide-react';

const CATEGORIES = ['All', 'Real Estate', 'Fashion', 'E-commerce', 'Service', 'Software', 'Food', 'Other'];

const AdSwipeFile: React.FC = () => {
    const [ads, setAds] = useState<AdInspiration[]>([]);
    const [filterCategory, setFilterCategory] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form State
    const [newAd, setNewAd] = useState({
        title: '',
        url: '',
        image_url: '',
        category: 'Other',
        notes: ''
    });

    useEffect(() => {
        loadAds();
    }, []);

    const loadAds = () => {
        mockService.getAdInspirations().then(setAds);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!newAd.title || !newAd.url) return alert("Title and URL are required.");
        
        await mockService.addAdInspiration(newAd);
        setIsModalOpen(false);
        setNewAd({ title: '', url: '', image_url: '', category: 'Other', notes: '' });
        loadAds();
    };

    const handleDelete = async (id: string) => {
        if(confirm("Remove this ad from your collection?")) {
            await mockService.deleteAdInspiration(id);
            loadAds();
        }
    };

    const filteredAds = ads.filter(ad => filterCategory === 'All' || ad.category === filterCategory);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Sparkles className="mr-2 h-6 w-6 text-purple-600" /> Ad Swipe File
                    </h1>
                    <p className="text-sm text-gray-500">Cure creative block by saving best performing ads here.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-indigo-700 flex items-center"
                >
                    <Plus className="h-4 w-4 mr-2" /> Add Inspiration
                </button>
            </div>

            {/* CATEGORY FILTER */}
            <div className="flex flex-wrap gap-2 pb-2">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                            filterCategory === cat 
                            ? 'bg-purple-100 text-purple-700 border-purple-200' 
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* MASONRY GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAds.map(ad => (
                    <div key={ad.id} className="group bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col">
                        {/* Image Preview */}
                        <div className="h-48 bg-gray-100 relative overflow-hidden">
                            {ad.image_url ? (
                                <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                    <ImageIcon className="h-10 w-10 mb-2 opacity-50"/>
                                    <span className="text-xs">No Preview Image</span>
                                </div>
                            )}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleDelete(ad.id)} className="p-1.5 bg-white rounded-full text-red-500 shadow-sm hover:bg-red-50">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="absolute top-2 left-2">
                                <span className="bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
                                    {ad.category}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 flex flex-col flex-1">
                            <h3 className="font-bold text-gray-900 mb-1 truncate" title={ad.title}>{ad.title}</h3>
                            <p className="text-xs text-gray-500 mb-3 line-clamp-2 flex-1">{ad.notes || "No notes added."}</p>
                            
                            <a 
                                href={ad.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="mt-auto w-full flex items-center justify-center bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-700 py-2 rounded-lg text-xs font-bold border border-gray-200 hover:border-purple-200 transition-colors"
                            >
                                <ExternalLink className="h-3 w-3 mr-1.5" /> View Ad Link
                            </a>
                        </div>
                    </div>
                ))}
                {filteredAds.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-xl border-2 border-dashed border-gray-300">
                        <Sparkles className="h-10 w-10 mx-auto mb-2 opacity-30"/>
                        <p>No inspiration found in this category.</p>
                    </div>
                )}
            </div>

            {/* ADD MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
                            <h3 className="text-white font-bold flex items-center">
                                <Sparkles className="mr-2 h-5 w-5 text-yellow-300"/> Save New Ad
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white"><X className="h-5 w-5"/></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ad Title / Hook</label>
                                <input 
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="e.g. 50% Off Summer Sale Video"
                                    value={newAd.title}
                                    onChange={e => setNewAd({...newAd, title: e.target.value})}
                                    autoFocus
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ad Link (FB/Insta/Library)</label>
                                <input 
                                    type="url"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="https://facebook.com/ads/..."
                                    value={newAd.url}
                                    onChange={e => setNewAd({...newAd, url: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-purple-500 focus:border-purple-500"
                                        value={newAd.category}
                                        onChange={e => setNewAd({...newAd, category: e.target.value})}
                                    >
                                        {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Image URL (Optional)</label>
                                    <input 
                                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="https://..."
                                        value={newAd.image_url}
                                        onChange={e => setNewAd({...newAd, image_url: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Why is this good?</label>
                                <textarea 
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-purple-500 focus:border-purple-500 h-20"
                                    placeholder="Great hook, clear CTA, nice colors..."
                                    value={newAd.notes}
                                    onChange={e => setNewAd({...newAd, notes: e.target.value})}
                                />
                            </div>

                            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg shadow-md transition-colors">
                                Save Inspiration
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdSwipeFile;
