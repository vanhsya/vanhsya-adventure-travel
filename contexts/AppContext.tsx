
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getCookie, setCookie } from '../utils/cookies';
import { LANGS, CURRENCIES } from '../constants';
import { Booking } from '../types';

type Theme = 'light' | 'dark';

interface AppContextType {
  lang: string;
  setLang: (lang: string) => void;
  currency: string;
  setCurrency: (currency: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getInitialCurrency = (): string => {
  const cookieCurrency = getCookie('currency');
  if (cookieCurrency && CURRENCIES.includes(cookieCurrency)) {
    return cookieCurrency;
  }
  return 'USD';
};

const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'VNS-88421',
    tourId: 1,
    tourTitle: 'Dubai Desert Safari: Red Dune Adventure',
    tourSlug: 'dubai-desert-safari',
    tourImage: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?q=80&w=2787&auto=format&fit=crop',
    date: 'Dec 12, 2024',
    status: 'upcoming',
    price: 75,
    currency: 'USD'
  },
  {
    id: 'VNS-77210',
    tourId: 12,
    tourTitle: 'Iceland Northern Lights Expedition',
    tourSlug: 'iceland-northern-lights-expedition',
    tourImage: 'https://images.unsplash.com/photo-1476610182048-b716b8518aae?q=80&w=2070&auto=format&fit=crop',
    date: 'Oct 15, 2023',
    status: 'completed',
    price: 950,
    currency: 'USD'
  }
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<string>(() => {
    const cookieLang = getCookie('lang');
    return cookieLang && LANGS.includes(cookieLang) ? cookieLang : 'en';
  });

  const [currency, setCurrencyState] = useState<string>(getInitialCurrency);

  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('vanhsya-theme') as Theme) || 'dark';
    }
    return 'dark';
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vanhsya-bookings');
      return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
    }
    return INITIAL_BOOKINGS;
  });

  // Sync theme to DOM and LocalStorage
  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-theme', theme);
    localStorage.setItem('vanhsya-theme', theme);
  }, [theme]);

  // Sync bookings to LocalStorage
  useEffect(() => {
    localStorage.setItem('vanhsya-bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    const cookieCurrency = getCookie('currency');
    if (!cookieCurrency && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude } = position.coords;
        if (latitude > 35 && latitude < 70) {
           setCurrency('EUR');
        }
      }, () => {
        setCurrencyState(getInitialCurrency());
      }, {
        timeout: 5000,
      });
    }
  }, []);

  const setLang = (newLang: string) => {
    setLangState(newLang);
    setCookie('lang', newLang);
  };

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
    setCookie('currency', newCurrency);
    // Reload is used to ensure all components recalculate prices based on the new rate
    window.location.reload();
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const addBooking = (booking: Booking) => {
    setBookings(prev => [booking, ...prev]);
  };
  
  return (
    <AppContext.Provider value={{ lang, setLang, currency, setCurrency, theme, setTheme, bookings, addBooking }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
