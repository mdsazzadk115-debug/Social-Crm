
import React, { createContext, useContext, useState, useEffect } from 'react';

type CurrencyType = 'USD' | 'BDT';

interface CurrencyContextType {
  currency: CurrencyType;
  toggleCurrency: () => void;
  formatCurrency: (amount: number) => string;
  exchangeRate: number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<CurrencyType>('USD');
  const EXCHANGE_RATE = 145; // Fixed Rate as per requirement

  // Persist selection
  useEffect(() => {
    const saved = localStorage.getItem('app_currency');
    if (saved === 'USD' || saved === 'BDT') {
      setCurrency(saved);
    }
  }, []);

  const toggleCurrency = () => {
    setCurrency(prev => {
      const newCurr = prev === 'USD' ? 'BDT' : 'USD';
      localStorage.setItem('app_currency', newCurr);
      return newCurr;
    });
  };

  const formatCurrency = (amount: number) => {
    // Input 'amount' is always expected to be in USD
    if (currency === 'USD') {
      return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      const bdtAmount = amount * EXCHANGE_RATE;
      return `৳${bdtAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, toggleCurrency, formatCurrency, exchangeRate: EXCHANGE_RATE }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
