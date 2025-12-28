import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getCookie, setCookie } from '../utils/cookies';
import { LANGS, CURRENCIES } from '../constants';

type Theme = 'light' | 'dark';

interface AppContextType {
  lang: string;
  setLang: (lang: string) => void;
  currency: string;
  setCurrency: (currency: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getInitialCurrency = (): string => {
  const cookieCurrency = getCookie('currency');
  if (cookieCurrency && CURRENCIES.includes(cookieCurrency)) {
    return cookieCurrency;
  }
  return 'USD';
};

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


  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-theme', theme);
    localStorage.setItem('vanhsya-theme', theme);
  }, [theme]);


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
    window.location.reload();
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  }
  
  return (
    <AppContext.Provider value={{ lang, setLang, currency, setCurrency, theme, setTheme }}>
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