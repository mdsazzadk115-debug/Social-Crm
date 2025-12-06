import React, { useState, useEffect, useRef } from 'react';
import { mockService } from '../services/mockService';
import { MessengerConversation } from '../types';
import { MessageCircle, Search, Phone, ExternalLink, AlertCircle, Lock, Settings, CheckCircle, Send, Zap } from 'lucide-react';
// @ts-ignore
import { Link as RouterLink } from 'react-router-dom';

const MessageBaba: React.FC = () => {
    const [conversations, setConversations] = useState<MessengerConversation[]>([]);
    const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
    const [filterText, setFilterText] = useState('');
    
    // Simulator State
    const [simMessage, setSimMessage] = useState('');
    const [simName, setSimName] = useState('');
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 3000); // Poll every 3s for live feel
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if(toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    useEffect(() => {
        scrollToBottom();
    }, [selectedConvId, conversations]);

    const loadData = async () => {
        const data = await mockService.getMessengerConversations();
        // Sort by last updated
        const sorted = [...data].sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime());
        setConversations(sorted);
        
        // Auto-select first if none selected
        if (!selectedConvId && sorted.length > 0) {
            // setSelectedConvId(sorted[0].id);
        }
    };

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSimulate = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!simMessage) return;
        
        const sender = simName || (selectedConvId ? conversations.find(c => c.id === selectedConvId)?.customer_name : 'New User') || 'Facebook User';
        
        await mockService.simulateIncomingMessage(simMessage, sender);
        
        // Regex Feedback Logic
        const hasPhone = simMessage.match(/(?:\+88|88)?01[3-9]\d{8}/);
        if (hasPhone) {
            setToastMessage(`🎉 Lead Captured! Phone: ${hasPhone[0]}`);
        } else {
            setToastMessage(`Message Sent (No Phone Detected)`);
        }

        setSimMessage('');
        if(!selectedConvId) {
            // If new conversation started, reload immediately to find it
            setTimeout(() => {
                loadData();
            }, 500);
        } else {
            loadData();
        }
    };

    const selectedConv = conversations.find(c => c.id === selectedConvId);

    const filteredConversations = conversations.filter(c => 
        c.customer_name.toLowerCase().includes(filterText.toLowerCase()) ||
        (c.customer_phone && c.customer_phone.includes(filterText))
    );

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] relative font-inter">
            
            {/* Toast Notification */}
            {toastMessage && (
                <div className="absolute top-4 right-1/2 translate-x-1/2 z-[60] bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center animate-bounce-slow border border-gray-700">
                    {toastMessage.includes('Captured') ? <CheckCircle className="h-5 w-5 mr-2 text-green-400"/> : <MessageCircle className="h-5 w-5 mr-2 text-blue-400"/>}
                    <span className="font-bold text-sm">{toastMessage}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <span className="bg-blue-600 text-white p-1.5 rounded-lg mr-3 shadow-sm"><MessageCircle className="h-6 w-6"/></span>
                        Message Baba
                    </h1>
                    <p className="text-xs text-gray-500 mt-1 ml-1">Messenger Simulator & Regex Parser Tester</p>
                </div>
                <div className="flex gap-2">
                    <RouterLink to="/settings" className="flex items-center bg-white border border-gray-300 text-gray-600 px-3 py-1.5 rounded-md hover:bg-gray-50 text-xs font-bold shadow-sm transition-colors">
                        <Settings className="h-3 w-3 mr-1.5"/> API Config
                    </RouterLink>
                </div>
            </div>

            <div className="flex flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm h-full">
                
                {/* LEFT: CONVERSATION LIST */}
                <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
                    <div className="p-3 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"/>
                            <input 
                                className="w-full pl-9 pr-3 py-2 border border-gray-200 bg-gray-50 rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="Search Messenger..."
                                value={filterText}
                                onChange={e => setFilterText(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                        {filteredConversations.length === 0 && (
                            <div className="p-8 text-center text-gray-400 text-xs">
                                <p>No conversations yet.</p>
                                <p className="mt-2">Use the Simulator to start a chat!</p>
                            </div>
                        )}
                        {filteredConversations.map(conv => (
                            <div 
                                key={conv.id}
                                onClick={() => setSelectedConvId(conv.id)}
                                className={`p-3 mx-2 my-1 rounded-lg cursor-pointer transition-all flex gap-3 group ${selectedConvId === conv.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                            >
                                <div className="relative">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                                        {conv.customer_name.charAt(0)}
                                    </div>
                                    {conv.is_lead_linked && (
                                        <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full">
                                            <CheckCircle className="h-4 w-4 text-green-500 fill-current bg-white rounded-full"/>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <h3 className={`text-sm font-bold truncate ${selectedConvId === conv.id ? 'text-blue-900' : 'text-gray-900'}`}>
                                            {conv.customer_name}
                                        </h3>
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                            {new Date(conv.last_updated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    
                                    <p className={`text-xs truncate ${selectedConvId === conv.id ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                                        {conv.messages[conv.messages.length - 1]?.content || 'No messages'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: CHAT DETAILS */}
                <div className="flex-1 flex flex-col bg-white relative">
                    {selectedConv ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-16 px-6 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm z-10">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                                        {selectedConv.customer_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-gray-900">{selectedConv.customer_name}</h2>
                                        {selectedConv.customer_phone ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500 flex items-center">
                                                    <Phone className="h-3 w-3 mr-1"/> {selectedConv.customer_phone}
                                                </span>
                                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold border border-green-200">
                                                    LEAD LINKED
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-orange-500 flex items-center font-medium bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 w-fit">
                                                <AlertCircle className="h-3 w-3 mr-1"/> No phone detected
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                                        <Phone className="h-5 w-5"/>
                                    </button>
                                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                                        <ExternalLink className="h-5 w-5"/>
                                    </button>
                                </div>
                            </div>

                            {/* Chat Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
                                {selectedConv.messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'page' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] group`}>
                                            <div className={`px-4 py-2.5 shadow-sm text-sm leading-relaxed ${
                                                msg.sender === 'page' 
                                                ? 'bg-blue-600 text-white rounded-2xl rounded-br-none' 
                                                : 'bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-bl-none'
                                            }`}>
                                                {msg.content}
                                            </div>
                                            <p className={`text-[10px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${msg.sender === 'page' ? 'text-right text-gray-400' : 'text-left text-gray-400'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Read-Only Footer (Real Input is disabled) */}
                            <div className="p-4 border-t border-gray-200 bg-white">
                                <div className="relative">
                                    <input 
                                        disabled 
                                        className="w-full bg-gray-100 border-none rounded-full py-3 px-4 text-sm text-gray-500 cursor-not-allowed"
                                        placeholder="Replies are disabled in Simulator Mode..."
                                    />
                                    <Lock className="absolute right-4 top-3 h-5 w-5 text-gray-400"/>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                            <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <MessageCircle className="h-12 w-12 text-gray-300"/>
                            </div>
                            <p className="font-medium text-gray-400">Select a conversation to inspect</p>
                        </div>
                    )}

                    {/* SIMULATOR (Debug Tool) - Fixed at Bottom Right */}
                    <div className="absolute bottom-6 right-6 w-80 bg-white border-2 border-yellow-400 shadow-2xl rounded-xl overflow-hidden z-20 animate-slide-up">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 px-4 py-3 flex justify-between items-center">
                            <h4 className="font-bold text-sm text-white uppercase flex items-center text-shadow">
                                <Zap className="h-4 w-4 mr-1 fill-white"/> Customer Simulator
                            </h4>
                            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded backdrop-blur-sm">Debug</span>
                        </div>
                        <form onSubmit={handleSimulate} className="p-4 space-y-3 bg-yellow-50/50">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Simulated User</label>
                                <input 
                                    className="w-full border border-gray-300 rounded-md p-2 text-xs focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none" 
                                    placeholder={selectedConv ? selectedConv.customer_name : "New Customer Name..."}
                                    value={simName}
                                    onChange={e => setSimName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Message Content</label>
                                <textarea 
                                    className="w-full border border-gray-300 rounded-md p-2 text-xs h-20 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none resize-none font-mono" 
                                    placeholder="Type a message... (e.g. My number is 017...)" 
                                    value={simMessage}
                                    onChange={e => setSimMessage(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={!simMessage}
                                className="w-full bg-gray-900 hover:bg-black text-white text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="h-3 w-3 mr-2"/> Send as Customer
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageBaba;