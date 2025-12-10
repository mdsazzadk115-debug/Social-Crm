
import React, { useState } from 'react';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

// --- CONFIGURATION ---
// CHANGE THIS PASSWORD TO WHATEVER YOU WANT
const APP_PASSWORD = "admin"; 

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === APP_PASSWORD) {
      onLogin();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 300);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 font-inter">
      <div className={`bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-gray-200 transition-transform ${shake ? 'translate-x-2' : ''} ${shake ? '-translate-x-2' : ''}`}>
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Social Ads Expert</h1>
          <p className="text-sm text-gray-500 mt-2">Please enter access code to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
            <input
              type="password"
              autoFocus
              className={`w-full border rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${error ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-300'}`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
            />
          </div>

          {error && (
            <div className="flex items-center text-red-600 text-xs font-medium animate-pulse">
              <AlertCircle className="h-3 w-3 mr-1.5" />
              Incorrect password. Please try again.
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-md transition-all flex items-center justify-center group"
          >
            Access Dashboard
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
        
        <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">Restricted Access System</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
