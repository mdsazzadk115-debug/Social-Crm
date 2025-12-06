import React, { useState, useEffect } from 'react';
// @ts-ignore
import { useParams } from 'react-router-dom';
import { mockService } from '../services/mockService';
import { LeadForm } from '../types';
import { INDUSTRIES } from '../constants';
import { CheckCircle, AlertCircle } from 'lucide-react';

const THEME_COLORS: Record<string, string> = {
    indigo: '#4f46e5',
    blue: '#2563eb',
    green: '#16a34a',
    red: '#dc2626',
    orange: '#ea580c',
    purple: '#9333ea',
    pink: '#db2777',
};

const PublicForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [form, setForm] = useState<LeadForm | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    
    // Form State
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        website: '',
        facebook: '',
        industry: ''
    });

    useEffect(() => {
        if(id) {
            mockService.getFormById(id).then(f => {
                setForm(f || null);
                setLoading(false);
            });
        }
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.name || !formData.phone) {
            setError('Please fill in required fields.');
            return;
        }

        try {
            if(form) {
                await mockService.submitLeadForm(form.id, formData);
                setSubmitted(true);
            }
        } catch(e) {
            setError('Something went wrong. Please try again.');
        }
    };

    if(loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
    
    if(!form) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
             <div className="text-center">
                 <h1 className="text-2xl font-bold text-gray-800">Form Not Found</h1>
                 <p className="text-gray-500 mt-2">The link you followed may be broken or the form has been removed.</p>
             </div>
        </div>
    );

    if(submitted) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center bg-green-100 mb-4`}>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
                <p className="text-gray-600">Your information has been received. Our team will contact you shortly.</p>
            </div>
        </div>
    );

    const themeColorKey = form.config.theme_color || 'indigo';
    const primaryColor = THEME_COLORS[themeColorKey] || THEME_COLORS['indigo'];

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-inter">
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="py-6 px-6 text-center" style={{ backgroundColor: primaryColor }}>
                    <h1 className="text-2xl font-bold text-white">{form.title}</h1>
                    {form.subtitle && <p className="mt-2 text-white text-opacity-90">{form.subtitle}</p>}
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative flex items-center" role="alert">
                            <AlertCircle className="h-4 w-4 mr-2"/>
                            <span className="block sm:inline text-sm">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Full Name <span className="text-red-500">*</span></label>
                            <input 
                                type="text"
                                required 
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="Your Name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phone Number <span className="text-red-500">*</span></label>
                            <input 
                                type="tel" 
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                placeholder="017..."
                            />
                        </div>

                        {form.config.include_website && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Website URL (Optional)</label>
                                <input 
                                    type="url" 
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={formData.website}
                                    onChange={e => setFormData({...formData, website: e.target.value})}
                                    placeholder="https://example.com"
                                />
                            </div>
                        )}

                        {form.config.include_facebook && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Facebook Profile Link (Optional)</label>
                                <input 
                                    type="url" 
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={formData.facebook}
                                    onChange={e => setFormData({...formData, facebook: e.target.value})}
                                    placeholder="https://facebook.com/..."
                                />
                            </div>
                        )}

                        {form.config.include_industry && (
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Business Industry</label>
                                <select 
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={formData.industry}
                                    onChange={e => setFormData({...formData, industry: e.target.value})}
                                >
                                    <option value="">-- Select Industry --</option>
                                    {INDUSTRIES.map(ind => (
                                        <option key={ind} value={ind}>{ind}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <button 
                                type="submit" 
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                                style={{ backgroundColor: primaryColor }}
                            >
                                Submit
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <div className="mt-8 text-center">
                 <p className="text-xs text-gray-400">Powered by LeadGenius BD</p>
            </div>
        </div>
    );
};

export default PublicForm;