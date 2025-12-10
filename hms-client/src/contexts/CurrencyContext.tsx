import React, { createContext, useContext, useState, ReactNode } from 'react';

type Currency = 'USD' | 'CNY' | 'JPY' | 'EUR' | 'GBP' | 'KRW' | 'SGD' | 'HKD' | 'THB' | 'AUD' | 'CAD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (curr: Currency) => void;
  formatPrice: (amount: number) => string;
  convertPrice: (amount: number) => number;
}

// Exchange rates (simplified - in production, fetch from API)
const exchangeRates: Record<Currency, number> = {
  USD: 1.0,
  CNY: 7.2,
  JPY: 150.0,
  EUR: 0.92,
  GBP: 0.79,
  KRW: 1300.0,
  SGD: 1.35,
  HKD: 7.8,
  THB: 35.0,
  AUD: 1.5,
  CAD: 1.35,
};

const currencySymbols: Record<Currency, string> = {
  USD: '$',
  CNY: '¥',
  JPY: '¥',
  EUR: '€',
  GBP: '£',
  KRW: '₩',
  SGD: 'S$',
  HKD: 'HK$',
  THB: '฿',
  AUD: 'A$',
  CAD: 'C$',
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const stored = localStorage.getItem('currency') as Currency;
    const validCurrencies: Currency[] = ['USD', 'CNY', 'JPY', 'EUR', 'GBP', 'KRW', 'SGD', 'HKD', 'THB', 'AUD', 'CAD'];
    return stored && validCurrencies.includes(stored) ? stored : 'USD';
  });

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr);
    localStorage.setItem('currency', curr);
  };

  const convertPrice = (amount: number): number => {
    // Convert from USD to selected currency
    return amount * exchangeRates[currency];
  };

  const formatPrice = (amount: number): string => {
    const converted = convertPrice(amount);
    const symbol = currencySymbols[currency];
    
    if (currency === 'CNY' || currency === 'JPY' || currency === 'KRW' || currency === 'THB') {
      // For these currencies, show whole numbers
      return `${symbol}${Math.round(converted).toLocaleString()}`;
    }
    
    // For others, show 2 decimal places
    return `${symbol}${converted.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, convertPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};

