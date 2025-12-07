import React, { useEffect, useState } from 'react';
// @ts-ignore
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, MessageSquare, Menu, X, LogOut, Send, FileText, ShoppingBag, CheckSquare, FileText as FileInvoice, Zap, ScrollText, Calculator, MessageCircle, Target, Coins, Bell, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { mockService } from '../services/mockService';
import { BigFish } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const location = useLocation();
  const { currency, toggleCurrency, formatCurrency } = useCurrency();
  
  // Task Reminder State
  const [showReminder, setShowReminder] = useState(false);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);

  // Low Balance Alert State
  const [showLowBalancePopup, setShowLowBalancePopup] = useState(false);
  const [lowBalanceClients, setLowBalanceClients] = useState<BigFish[]>([]);

  // Check on mount/location change
  useEffect(() => {
      checkTaskReminders();
      checkLowBalance();
      // Run Automation Check (Heartbeat)
      mockService.triggerAutomationCheck();
      
      // Optional: Poll every 60 seconds if the tab is open
      const interval = setInterval(() => {
          mockService.triggerAutomationCheck();
      }, 60000);
      return () => clearInterval(interval);
  }, [location.pathname]);

  const checkTaskReminders = async () => {
      const tasks = await mockService.getTasks();
      const dueTasks = tasks.filter(t => !t.is_completed && t.due_date);
      
      if (dueTasks.length > 0) {
          const now = Date.now();
          const lastShown = localStorage.getItem('last_task_reminder_ts');
          const THREE_HOURS = 3 * 60 * 60 * 1000;

          if (!lastShown || (now - parseInt(lastShown)) > THREE_HOURS) {
              setPendingTasksCount(dueTasks.length);
              setShowReminder(true);
              localStorage.setItem('last_task_reminder_ts', now.toString());
              
              // Auto hide tasks after 5 seconds
              setTimeout(() => setShowReminder(false), 5000);
          }
      }
  };

  const checkLowBalance = async () => {
      const fish = await mockService.getBigFish();
      // Filter: Active Pool AND Balance < 20
      const lowBal = fish.filter(f => f.status === 'Active Pool' && (f.balance || 0) < 20);
      
      if (lowBal.length > 0) {
          const now = Date.now();
          const lastShown = localStorage.getItem('last_low_bal_popup_ts');
          // Cooldown: Show every 1 hour (to avoid spamming on every navigation)
          const ONE_HOUR = 1 * 60 * 60 * 1000;

          if (!lastShown || (now - parseInt(lastShown)) > ONE_HOUR) {
              setLowBalanceClients(lowBal);
              setShowLowBalancePopup(true);
              localStorage.setItem('last_low_bal_popup_ts', now.toString());
          }
      }
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Big Fish 🐟', href: '/big-fish', icon: null, special: true }, 
    { name: 'Sales Goals', href: '/sales-goals', icon: Target }, 
    { name: 'Leads', href: '/leads', icon: Users },
    { name: 'Won Clients', href: '/won-leads', icon: CheckCircle },
    { name: 'Messaging', href: '/messaging', icon: Send },
    { name: 'Message Baba', href: '/message-baba', icon: MessageCircle }, 
    { name: 'Online Customers', href: '/customers', icon: ShoppingBag }, 
    { name: 'Daily Tasks', href: '/tasks', icon: CheckSquare }, 
    { name: 'Invoices', href: '/invoices', icon: FileInvoice }, 
    { name: 'Calculators', href: '/calculators', icon: Calculator },
    { name: 'Ad Swipe File', href: '/ad-swipe', icon: Sparkles },
    { name: 'Letterhead', href: '/letterhead', icon: ScrollText }, 
    { name: 'Quick Msgs', href: '/snippets', icon: Zap }, 
    { name: 'Forms', href: '/forms', icon: FileText },
    { name: 'Templates', href: '/templates', icon: MessageSquare },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 flex font-inter relative">
      
      {/* 1. TASK REMINDER POPUP */}
      {showReminder && !showLowBalancePopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
              <div className="bg-white border-t-8 border-amber-500 shadow-2xl rounded-xl p-8 max-w-xl w-full relative animate-scale-up">
                  <div className="flex items-start gap-6">
                      <div className="p-4 bg-amber-100 rounded-full text-amber-600 shrink-0">
                          <Bell className="h-10 w-10 animate-wiggle" />
                      </div>
                      <div className="flex-1">
                          <h4 className="text-2xl font-bold text-gray-900 mb-2">Reminder: Daily Tasks!</h4>
                          <p className="text-lg text-gray-600">
                              You have <span className="font-extrabold text-amber-600 text-2xl">{pendingTasksCount}</span> scheduled tasks pending.
                          </p>
                          <div className="mt-6 flex gap-4">
                              <Link to="/tasks" onClick={() => setShowReminder(false)} className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-colors flex items-center">
                                  <CheckSquare className="h-5 w-5 mr-2"/> Check List
                              </Link>
                              <button onClick={() => setShowReminder(false)} className="px-6 py-2.5 rounded-lg font-medium text-gray-500 hover:bg-gray-100 transition-colors">Close</button>
                          </div>
                      </div>
                      <button onClick={() => setShowReminder(false)} className="text-gray-400 hover:text-gray-600 absolute top-4 right-4"><X className="h-6 w-6" /></button>
                  </div>
                  <div className="absolute bottom-0 left-0 h-1.5 bg-amber-100 w-full rounded-b-xl overflow-hidden">
                      <div className="h-full bg-amber-500 animate-shrink-width" style={{width: '100%'}}></div>
                  </div>
              </div>
          </div>
      )}

      {/* 2. LOW BALANCE POPUP (Higher Priority) */}
      {showLowBalancePopup && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white border-t-8 border-red-500 shadow-2xl rounded-xl p-0 max-w-lg w-full relative animate-scale-up overflow-hidden flex flex-col max-h-[80vh]">
                  {/* Header */}
                  <div className="p-6 bg-red-50 border-b border-red-100 flex items-start gap-4">
                      <div className="p-3 bg-red-100 rounded-full text-red-600 shrink-0">
                          <AlertTriangle className="h-8 w-8 animate-pulse" />
                      </div>
                      <div>
                          <h4 className="text-xl font-bold text-gray-900">⚠️ Low Balance Alert</h4>
                          <p className="text-sm text-red-600 font-medium mt-1">
                              {lowBalanceClients.length} clients have less than $20 balance.
                          </p>
                      </div>
                      <button onClick={() => setShowLowBalancePopup(false)} className="ml-auto text-gray-400 hover:text-red-500 transition-colors">
                          <X className="h-6 w-6" />
                      </button>
                  </div>

                  {/* List Body */}
                  <div className="p-0 overflow-y-auto flex-1 bg-white">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                              <tr>
                                  <th className="px-6 py-3">Client Name</th>
                                  <th className="px-6 py-3 text-right">Balance</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {lowBalanceClients.map(client => (
                                  <tr key={client.id} className="hover:bg-red-50 transition-colors">
                                      <td className="px-6 py-3">
                                          <p className="font-bold text-gray-800">{client.name}</p>
                                          <p className="text-xs text-gray-500">{client.phone}</p>
                                      </td>
                                      <td className="px-6 py-3 text-right">
                                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded font-mono font-bold border border-red-200">
                                              {formatCurrency(client.balance || 0)}
                                          </span>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  {/* Footer */}
                  <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                      <Link 
                        to="/big-fish" 
                        onClick={() => setShowLowBalancePopup(false)}
                        className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors"
                      >
                          Manage Clients
                      </Link>
                      <button 
                        onClick={() => setShowLowBalancePopup(false)} 
                        className="bg-white border border-gray-300 text-gray-700 px-5 py-2 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors"
                      >
                          Close Alert
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Sidebar for Desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-indigo-50/50 bg-white shadow-[0_0_15px_rgba(0,0,0,0.03)] z-20">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center h-16 flex-shrink-0 px-6 bg-white border-b border-gray-50">
             <h1 className="text-xl font-extrabold text-indigo-600 tracking-tight flex items-center">
               🚀 <span className="ml-2 text-slate-800">Social Ads Expert</span>
             </h1>
          </div>
          <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
            {navigation.map((item) => {
              if (item.special) {
                  return (
                    <Link
                        key={item.name}
                        to={item.href}
                        className={`group flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${
                            isActive(item.href) 
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' 
                            : 'bg-white text-gray-600 hover:bg-indigo-50/50 hover:shadow-sm border border-transparent'
                        }`}
                    >
                         <span className="mr-3 text-xl animate-swim inline-block">🐋</span>
                         <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent uppercase tracking-widest text-xs">{item.name}</span>
                    </Link>
                  );
              }
              const Icon = item.icon!;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-4 py-2.5 text-sm font-medium rounded-r-full mr-2 transition-all duration-300 ease-out border-l-4 hover:translate-x-1 ${
                    active
                      ? 'bg-indigo-50/60 text-indigo-700 border-indigo-600'
                      : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
                  }`}
                >
                  <Icon 
                    className={`mr-3 flex-shrink-0 h-5 w-5 transition-all duration-300 ${
                        active 
                        ? 'text-indigo-600 scale-110' 
                        : 'text-slate-400 group-hover:text-indigo-500 group-hover:scale-110 group-hover:rotate-6'
                    }`} 
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="flex-shrink-0 flex border-t border-gray-50 p-4 bg-gray-50/30">
            <div className="flex items-center w-full">
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">Admin User</p>
                <button className="text-xs font-medium text-gray-400 hover:text-red-500 flex items-center mt-1 transition-colors group">
                  <LogOut className="h-3 w-3 mr-1 group-hover:-translate-x-1 transition-transform" /> Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-10 bg-white h-16 flex items-center justify-between px-4 shadow-sm border-b border-gray-200">
        <span className="text-indigo-600 font-bold text-lg flex items-center">🚀 Social Ads</span>
        <div className="flex items-center gap-3">
            <button 
                onClick={toggleCurrency}
                className={`flex items-center px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    currency === 'USD' 
                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                    : 'bg-green-50 text-green-700 border-green-200'
                }`}
            >
                {currency === 'USD' ? '🇺🇸 USD' : '🇧🇩 BDT'}
            </button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 p-2">
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-gray-600 bg-opacity-75 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
             <div className="h-16 flex items-center px-6 bg-indigo-600">
                 <h1 className="text-xl font-bold text-white">Menu</h1>
             </div>
             <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                        isActive(item.href) ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.icon ? <item.icon className={`mr-4 h-5 w-5 ${isActive(item.href) ? 'text-indigo-600' : 'text-gray-400'}`} /> : <span className="mr-4 text-xl">🐟</span>}
                    {item.name}
                  </Link>
                ))}
             </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="md:ml-64 flex-1 flex flex-col w-full transition-all duration-300">
        
        {/* Desktop Header Bar for Switcher */}
        <div className="hidden md:flex justify-end items-center px-8 py-3 bg-white border-b border-gray-50">
            <button 
                onClick={toggleCurrency}
                className={`flex items-center px-4 py-1.5 rounded-full text-sm font-bold transition-all border shadow-sm hover:shadow-md ${
                    currency === 'USD' 
                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                    : 'bg-green-50 text-green-700 border-green-200'
                }`}
                title="Click to switch currency"
            >
                <Coins className="h-4 w-4 mr-2"/>
                {currency === 'USD' ? 'Display: USD ($)' : `Display: BDT (৳) @ 145`}
            </button>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 mt-16 md:mt-0">
          {children}
        </main>
      </div>
      
      <style>{`
        @keyframes shrink-width {
            from { width: 100%; }
            to { width: 0%; }
        }
        .animate-shrink-width {
            animation: shrink-width 5s linear forwards;
        }
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
        }
        @keyframes scale-up {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up {
            animation: scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default Layout;