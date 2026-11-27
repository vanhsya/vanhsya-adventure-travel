import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getCookie, setCookie } from '../utils/cookies';
import { LANGS, CURRENCIES } from '../constants';
import { Booking, TripReview } from '../types';

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
  reviews: TripReview[];
  addReview: (review: TripReview) => void;
  deleteReview: (reviewId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getInitialCurrency = (): string => {
  const cookieCurrency = getCookie('currency');
  if (cookieCurrency && CURRENCIES.includes(cookieCurrency)) {
    return cookieCurrency;
  }
  return 'AED';
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

  // Only persist genuine user bookings created in the session — zero invented bookings
  const [bookings, setBookings] = useState<Booking[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('vanhsya-user-bookings');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  // Only persist genuine user-submitted reviews — zero invented testimonials
  const [reviews, setReviews] = useState<TripReview[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('vanhsya-user-reviews');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-theme', theme);
    localStorage.setItem('vanhsya-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('vanhsya-user-bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('vanhsya-user-reviews', JSON.stringify(reviews));
  }, [reviews]);

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
  };

  const addBooking = (booking: Booking) => {
    setBookings((prev) => [booking, ...prev]);
  };

  const addReview = (review: TripReview) => {
    setReviews((prev) => {
      const filtered = prev.filter((r) => r.bookingId !== review.bookingId);
      return [review, ...filtered];
    });
  };

  const deleteReview = (reviewId: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        currency,
        setCurrency,
        theme,
        setTheme,
        bookings,
        addBooking,
        reviews,
        addReview,
        deleteReview,
      }}
    >
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
