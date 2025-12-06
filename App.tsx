import React from 'react';
// @ts-ignore
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LeadList from './pages/LeadList';
import LeadDetail from './pages/LeadDetail';
import Templates from './pages/Templates';
// Campaigns import removed
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

const App: React.FC = () => {
  return (
    <CurrencyProvider>
      <Router>
        <Routes>
          {/* Public Routes (No Layout) */}
          <Route path="/f/:id" element={<PublicForm />} />
          <Route path="/portal/:id" element={<ClientPortal />} /> 

          {/* Admin Routes (With Layout) */}
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/big-fish" element={<Layout><BigFishPage /></Layout>} /> 
          <Route path="/sales-goals" element={<Layout><SalesGoals /></Layout>} />
          <Route path="/leads" element={<Layout><LeadList /></Layout>} />
          <Route path="/leads/:id" element={<Layout><LeadDetail /></Layout>} />
          <Route path="/won-leads" element={<Layout><WonLeads /></Layout>} />
          <Route path="/messaging" element={<Layout><Messaging /></Layout>} />
          <Route path="/message-baba" element={<Layout><MessageBaba /></Layout>} />
          <Route path="/ad-swipe" element={<Layout><AdSwipeFile /></Layout>} />
          {/* Campaigns route removed */}
          <Route path="/customers" element={<Layout><OnlineCustomers /></Layout>} /> 
          <Route path="/tasks" element={<Layout><DailyTasks /></Layout>} /> 
          <Route path="/invoices" element={<Layout><Invoices /></Layout>} /> 
          <Route path="/calculators" element={<Layout><Calculators /></Layout>} />
          <Route path="/letterhead" element={<Layout><Letterhead /></Layout>} /> 
          <Route path="/snippets" element={<Layout><QuickMessages /></Layout>} /> 
          <Route path="/forms" element={<Layout><Forms /></Layout>} />
          <Route path="/templates" element={<Layout><Templates /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </CurrencyProvider>
  );
};

export default App;