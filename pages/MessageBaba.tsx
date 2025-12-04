




import React, { useState, useEffect } from 'react';
import { mockService } from '../services/mockService';
import { MessengerConversation } from '../types';
import { MessageCircle, Search, User, Phone, Send, ExternalLink, Link, Clock, AlertCircle, Lock, Settings, CheckCircle } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';

const MessageBaba: React.FC = () => {
    const [conversations, setConversations] = useState<MessengerConversation[]>([]);
    const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
    const [filterText, setFilterText] = useState('');
    
    // Simulator State
    const [simMessage, setSimMessage] = useState('');
    const [simName, setSimName] = useState('');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000); // Poll for updates every 5s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if(toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const loadData = () => {
        mockService.getMessengerConversations().then(data => {
            setConversations(data);
            if (!selectedConvId && data.length > 0) {
                // setSelectedConvId(data[0].id); // Optional: auto-select first
            }
        });
    };

    const handleSimulate = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!simMessage) return;
        
        await mockService.simulateIncomingMessage(simMessage, simName || 'Facebook User');
        
        // Simple logic to guess if lead was touched (for UI feedback)
        const hasPhone = simMessage.match(/(?:\+88|88)?(01[3-9]\d{8})/);
        if (hasPhone) {
            setToastMessage(`✅ Success! Lead Processed for ${hasPhone[0]}`);
        } else {
            setToastMessage(`Message received (No phone detected)`);
        }

        setSimMessage('');
        loadData();
    };

    const selectedConv = conversations.find(c => c.id === selectedConvId);

    const filteredConversations = conversations.filter(c => 
        c.customer_name.toLowerCase().includes(filterText.toLowerCase()) ||
        (c.customer_phone && c.customer_phone.includes(filterText))
    );

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] relative">
            
            {/* Toast Notification */}
            {toastMessage && (
                <div className="absolute top-4 right-4 z-50 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-xl flex items-center animate-bounce">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-400"/>
                    <span className="font-bold text-sm">{toastMessage}</span>
                </div>
            )}

            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <span className="bg-blue-600 text-white p-1.5 rounded-lg mr-3"><MessageCircle className="h-6 w-6"/></span>
                        Message Baba
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Read-only view of Messenger. Auto-detects phones & creates leads.</p>
                </div>
                <RouterLink to="/settings" className="flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium shadow-sm transition-colors">
                    <Settings className="h-4 w-4 mr-2"/> Configure API
                </RouterLink>
            </div>

            <div className="flex flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                
                {/* LEFT: CONVERSATION LIST */}
                <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
                    <div className="p-4 border-b border-gray-200 bg-white">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"/>
                            <input 
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Search name or phone..."
                                value={filterText}
                                onChange={e => setFilterText(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                        {filteredConversations.length === 0 && (
                            <div className="p-6 text-center text-gray-400 text-sm">No conversations found.</div>
                        )}
                        {filteredConversations.map(conv => (
                            <div 
                                key={conv.id}
                                onClick={() => setSelectedConvId(conv.id)}
                                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors ${selectedConvId === conv.id ? 'bg-blue-100 border-l-4 border-l-blue-600' : 'bg-white'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`text-sm font-bold truncate ${selectedConvId === conv.id ? 'text-blue-900' : 'text-gray-900'}`}>
                                        {conv.customer_name}
                                    </h3>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                        {new Date(conv.last_updated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                
                                {conv.customer_phone ? (
                                    <div className="flex items-center text-green-600 text-xs font-mono font-bold mb-1">
                                        <Phone className="h-3 w-3 mr-1"/> {conv.customer_phone}
                                    </div>
                                ) : (
                                    <div className="flex items-center text-gray-400 text-xs italic mb-1">
                                        No phone detected
                                    </div>
                                )}

                                <p className="text-xs text-gray-500 truncate">{conv.last_message}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: CHAT DETAILS */}
                <div className="flex-1 flex flex-col bg-white relative">
                    {selectedConv ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                        {selectedConv.customer_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">{selectedConv.customer_name}</h2>
                                        {selectedConv.customer_phone ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-mono text-green-700 font-bold flex items-center">
                                                    <Phone className="h-3 w-3 mr-1"/> {selectedConv.customer_phone}
                                                </span>
                                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Lead Linked</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-orange-600 flex items-center">
                                                <AlertCircle className="h-3 w-3 mr-1"/> Waiting for phone number...
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-xs text-gray-400">
                                    Read-Only View
                                </div>
                            </div>

                            {/* Chat Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                                {selectedConv.messages.map((msg, idx) => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'page' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                                            msg.sender === 'page' 
                                            ? 'bg-blue-600 text-white rounded-br-none' 
                                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                                        }`}>
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                            <p className={`text-[10px] mt-1 text-right ${msg.sender === 'page' ? 'text-blue-200' : 'text-gray-400'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* No Reply Box (Disabled) */}
                            <div className="p-4 border-t border-gray-200 bg-gray-100 text-center">
                                <p className="text-sm text-gray-500 flex items-center justify-center">
                                    <Lock className="h-4 w-4 mr-2"/> Replies must be sent from Facebook Inbox.
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <MessageCircle className="h-16 w-16 mb-4 opacity-20"/>
                            <p>Select a conversation to view history</p>
                        </div>
                    )}

                    {/* SIMULATOR (Debug Tool) */}
                    <div className="absolute bottom-4 right-4 w-80 bg-white border border-yellow-300 shadow-xl rounded-lg overflow-hidden z-10">
                        <div className="bg-yellow-100 px-4 py-2 border-b border-yellow-200 flex justify-between items-center">
                            <h4 className="font-bold text-xs text-yellow-800 uppercase">⚡ Simulator (Debug)</h4>
                        </div>
                        <form onSubmit={handleSimulate} className="p-3 space-y-2">
                            <input 
                                className="w-full border rounded p-1.5 text-xs" 
                                placeholder="Customer Name (Optional)" 
                                value={simName}
                                onChange={e => setSimName(e.target.value)}
                            />
                            <textarea 
                                className="w-full border rounded p-1.5 text-xs h-16" 
                                placeholder="Type a message (e.g. My number is 017...)" 
                                value={simMessage}
                                onChange={e => setSimMessage(e.target.value)}
                            />
                            <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold py-2 rounded">
                                Simulate Incoming Message
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageBaba;
