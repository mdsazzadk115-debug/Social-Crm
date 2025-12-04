
import React, { useState, useEffect } from 'react';
import { mockService } from '../services/mockService';
import { Customer } from '../types';
import { UploadCloud, Search, Trash2, ShoppingBag, Download, Filter, Plus, X } from 'lucide-react';

const OnlineCustomers: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    
    // Upload State
    const [inputNumbers, setInputNumbers] = useState('');
    const [selectedUploadCategory, setSelectedUploadCategory] = useState('');
    const [processing, setProcessing] = useState(false);
    const [stats, setStats] = useState({ added: 0, duplicates: 0 });
    const [showStats, setShowStats] = useState(false);

    // Filter/View State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');

    // Category Management State
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isManagingCats, setIsManagingCats] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        mockService.getCustomers().then(setCustomers);
        mockService.getCustomerCategories().then(cats => {
            setCategories(cats);
            if (cats.length > 0 && !selectedUploadCategory) {
                setSelectedUploadCategory(cats[0]);
            }
        });
    };

    const handleUpload = async () => {
        if (!inputNumbers.trim()) return;
        if (!selectedUploadCategory) return alert("Please select a category (e.g. Dress, Bag)");

        setProcessing(true);
        setShowStats(false);
        
        const rawLines = inputNumbers.split(/[\n,]/).map(s => s.trim()).filter(s => s);
        
        const addedCount = await mockService.addBulkCustomers(rawLines, selectedUploadCategory);
        
        const duplicateCount = rawLines.length - addedCount;
        setStats({ added: addedCount, duplicates: duplicateCount });
        setShowStats(true);
        setInputNumbers('');
        setProcessing(false);
        loadData();
    };

    const handleDelete = async (id: string) => {
        if(confirm("Delete this customer?")) {
            await mockService.deleteCustomer(id);
            loadData();
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName) return;
        await mockService.addCustomerCategory(newCategoryName);
        setNewCategoryName('');
        loadData();
    };

    const handleDeleteCategory = async (cat: string) => {
        if (confirm(`Delete category "${cat}"?`)) {
            await mockService.deleteCustomerCategory(cat);
            loadData();
        }
    };

    const handleExportFiltered = () => {
        const dataToExport = filtered.map(c => ({
            Phone: c.phone,
            Category: c.category || 'General',
            DateAdded: new Date(c.date_added).toLocaleDateString()
        }));

        if (dataToExport.length === 0) return alert("No data to export.");

        const csvContent = [
            Object.keys(dataToExport[0]).join(','),
            ...dataToExport.map(row => Object.values(row).map(val => `"${val}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `customers_${filterCategory}_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filtered = customers.filter(c => {
        const matchesSearch = c.phone.includes(searchTerm) || c.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || c.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">🛍️ Online Customers</h1>
                    <p className="text-sm text-gray-500">Database of customers who purchased online.</p>
                </div>
                <div className="flex gap-2">
                     <button 
                        onClick={() => setIsManagingCats(!isManagingCats)}
                        className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
                     >
                         {isManagingCats ? 'Done Managing' : 'Manage Categories'}
                     </button>
                    <div className="bg-indigo-100 px-4 py-2 rounded-lg text-indigo-700 font-bold flex items-center">
                        <ShoppingBag className="h-5 w-5 mr-2" />
                        Total: {customers.length}
                    </div>
                </div>
            </div>

            {/* Category Manager (Toggle) */}
            {isManagingCats && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Manage Product Categories</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {categories.map(cat => (
                            <span key={cat} className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-white border border-gray-300 text-gray-700">
                                {cat}
                                <button onClick={() => handleDeleteCategory(cat)} className="ml-1.5 text-gray-400 hover:text-red-500"><X className="h-3 w-3"/></button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2 max-w-sm">
                        <input 
                            type="text" 
                            className="flex-1 border border-gray-300 rounded text-sm px-2 py-1"
                            placeholder="New Category (e.g. Watch)"
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                        />
                        <button onClick={handleAddCategory} className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700">Add</button>
                    </div>
                </div>
            )}

            {/* Upload Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-bold text-gray-700">Paste Phone Numbers (Daily Input)</label>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Select Product/Category:</span>
                        <select 
                            className="border border-gray-300 rounded-md text-sm py-1 pl-2 pr-8 focus:ring-indigo-500 focus:border-indigo-500"
                            value={selectedUploadCategory}
                            onChange={e => setSelectedUploadCategory(e.target.value)}
                        >
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <textarea 
                        className="flex-1 border border-gray-300 rounded-md p-3 text-sm font-mono h-32 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder={`01712345678\n01887654321\n(Paste from Excel column)`}
                        value={inputNumbers}
                        onChange={e => setInputNumbers(e.target.value)}
                    />
                    <div className="flex flex-col justify-end min-w-[200px]">
                        <button 
                            onClick={handleUpload}
                            disabled={processing || !inputNumbers}
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 w-full"
                        >
                            <UploadCloud className="h-5 w-5 mr-2" />
                            {processing ? 'Processing...' : 'Upload Numbers'}
                        </button>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            Will add to category: <strong>{selectedUploadCategory}</strong>
                        </p>
                    </div>
                </div>
                {showStats && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700 flex gap-4">
                        <span><strong>{stats.added}</strong> new customers added to {selectedUploadCategory}.</span>
                        <span><strong>{stats.duplicates}</strong> duplicates ignored.</span>
                    </div>
                )}
            </div>

            {/* List Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50">
                    <div className="flex items-center gap-3">
                         <h3 className="font-medium text-gray-900">Database</h3>
                         <div className="h-6 w-px bg-gray-300"></div>
                         
                         {/* Filter Dropdown */}
                         <div className="relative">
                             <select
                                className="appearance-none bg-white border border-gray-300 rounded-md pl-8 pr-8 py-1.5 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                value={filterCategory}
                                onChange={e => setFilterCategory(e.target.value)}
                             >
                                 <option value="All">All Categories</option>
                                 {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                             </select>
                             <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none"/>
                         </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input 
                                type="text" 
                                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm"
                                placeholder="Search phone..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={handleExportFiltered}
                            className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-sm hover:bg-gray-50"
                            title="Download CSV"
                        >
                            <Download className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto max-h-[500px]">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date Added</th>
                                <th className="px-6 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-500">No customers found.</td></tr>
                            ) : (
                                filtered.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 text-sm font-medium text-gray-900 font-mono">{c.phone}</td>
                                        <td className="px-6 py-3 text-sm">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {c.category || 'General'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-500">
                                            {new Date(c.date_added).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-600">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
export default OnlineCustomers;
