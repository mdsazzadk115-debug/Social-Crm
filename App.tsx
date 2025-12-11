
import React, { useState, useEffect } from 'react';
// @ts-ignore
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import LoginScreen from './components/LoginScreen'; 
import Dashboard from './pages/Dashboard';
import LeadList from './pages/LeadList';
import LeadDetail from './pages/LeadDetail';
import Templates from './pages/Templates';
import Messaging from './pages/Messaging';
import Forms from './pages/Forms';
import PublicForm from './pages/PublicForm';
import OnlineCustomers from './pages/OnlineCustomers';
import DailyTasks from './pages/DailyTasks';
import Invoices from './pages/Invoices';
import QuickMessages from './pages/QuickMessages';
import Letterhead from './pages/Letterhead';
import BigFishPage from './pages/BigFish'; 
import ClientPortal from './pages/ClientPortal'; 
import Calculators from './pages/Calculators'; 
import MessageBaba from './pages/MessageBaba';
import Settings from './pages/Settings';
import SalesGoals from './pages/SalesGoals';
import WonLeads from './pages/WonLeads';
import AdSwipeFile from './pages/AdSwipeFile';
import { CurrencyProvider } from './context/CurrencyContext';

// --- AUTH GUARD COMPONENT ---
const RequireAuth = ({ children }: { children: React.ReactNode }) => {
    const auth = localStorage.getItem('sae_auth');
    const location = useLocation();

    if (auth !== 'true') {
        // Redirect them to the /login page, but save the current location they were trying to go to
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

// --- LOGIN PAGE COMPONENT ---
const LoginPage = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        if(localStorage.getItem('sae_auth') === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = () => {
        localStorage.setItem('sae_auth', 'true');
        // Force reload/redirect to root to ensure clean state
        window.location.href = '#/';
        window.location.reload(); 
    };

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return <LoginScreen onLogin={handleLogin} />;
};

const App: React.FC = () => {
  return (
    <CurrencyProvider>
      <Router>
        <Routes>
          {/* --- PUBLIC ROUTES (No Password Required) --- */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/f/:id" element={<PublicForm />} />
          <Route path="/portal/:id" element={<ClientPortal />} /> 

          {/* --- PROTECTED ADMIN ROUTES (Password Required) --- */}
          <Route path="/" element={<RequireAuth><Layout><Dashboard /></Layout></RequireAuth>} />
          <Route path="/big-fish" element={<RequireAuth><Layout><BigFishPage /></Layout></RequireAuth>} /> 
          <Route path="/sales-goals" element={<RequireAuth><Layout><SalesGoals /></Layout></RequireAuth>} />
          <Route path="/leads" element={<RequireAuth><Layout><LeadList /></Layout></RequireAuth>} />
          <Route path="/leads/:id" element={<RequireAuth><Layout><LeadDetail /></Layout></RequireAuth>} />
          <Route path="/won-leads" element={<RequireAuth><Layout><WonLeads /></Layout></RequireAuth>} />
          <Route path="/messaging" element={<RequireAuth><Layout><Messaging /></Layout></RequireAuth>} />
          <Route path="/message-baba" element={<RequireAuth><Layout><MessageBaba /></Layout></RequireAuth>} />
          <Route path="/ad-swipe" element={<RequireAuth><Layout><AdSwipeFile /></Layout></RequireAuth>} />
          <Route path="/customers" element={<RequireAuth><Layout><OnlineCustomers /></Layout></RequireAuth>} /> 
          <Route path="/tasks" element={<RequireAuth><Layout><DailyTasks /></Layout></RequireAuth>} /> 
          <Route path="/invoices" element={<RequireAuth><Layout><Invoices /></Layout></RequireAuth>} /> 
          <Route path="/calculators" element={<RequireAuth><Layout><Calculators /></Layout></RequireAuth>} />
          <Route path="/letterhead" element={<RequireAuth><Layout><Letterhead /></Layout></RequireAuth>} /> 
          <Route path="/snippets" element={<RequireAuth><Layout><QuickMessages /></Layout></RequireAuth>} /> 
          <Route path="/forms" element={<RequireAuth><Layout><Forms /></Layout></RequireAuth>} />
          <Route path="/templates" element={<RequireAuth><Layout><Templates /></Layout></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><Layout><Settings /></Layout></RequireAuth>} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </CurrencyProvider>
  );
};

export default App;
