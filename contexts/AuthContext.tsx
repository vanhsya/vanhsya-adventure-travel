import React, { createContext, useCallback, useContext, useState } from 'react';
import { AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  favorites: string[];
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (payload: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    emirate?: string;
    consentEmail?: boolean;
    consentWhatsapp?: boolean;
  }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<{ ok: boolean; error?: string }>;
  toggleFavorite: (itemSlug: string, itemType?: string) => Promise<boolean>;
  isFavorite: (itemSlug: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const hydrateFavorites = useCallback(async (authToken: string) => {
    try {
      const res = await fetch('/api/favorites', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const slugs = Array.isArray(data.favorites)
          ? data.favorites.map((item: any) => (typeof item === 'string' ? item : item?.item_slug)).filter(Boolean)
          : [];
        setFavorites(slugs);
      }
    } catch {
      // ignore non-critical favorite fetch failure
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { ok: false, error: data.error || 'Invalid credentials.' };
        }
        setToken(data.token);
        setUser(data.user);
        await hydrateFavorites(data.token);
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error while signing in.' };
      } finally {
        setLoading(false);
      }
    },
    [hydrateFavorites]
  );

  const register = useCallback(
    async (payload: {
      fullName: string;
      email: string;
      password: string;
      phone?: string;
      emirate?: string;
      consentEmail?: boolean;
      consentWhatsapp?: boolean;
    }) => {
      setLoading(true);
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          return { ok: false, error: data.error || 'Could not register account.' };
        }
        setToken(data.token);
        setUser(data.user);
        setFavorites([]);
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error while creating account.' };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // ignore network failure on logout
      }
    }
    setToken(null);
    setUser(null);
    setFavorites([]);
  }, [token]);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) setUser(data.user);
        await hydrateFavorites(token);
      } else if (res.status === 401) {
        setToken(null);
        setUser(null);
        setFavorites([]);
      }
    } catch {
      // ignore
    }
  }, [token, hydrateFavorites]);

  const updateProfile = useCallback(
    async (updates: Partial<AuthUser>) => {
      if (!token) return { ok: false, error: 'Please sign in first.' };
      try {
        const res = await fetch('/api/auth/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        });
        const data = await res.json();
        if (!res.ok) {
          return { ok: false, error: data.error || 'Could not update profile.' };
        }
        if (data.user) setUser(data.user);
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error updating profile.' };
      }
    },
    [token]
  );

  const toggleFavorite = useCallback(
    async (itemSlug: string, itemType = 'experience') => {
      if (!token) {
        let nextSaved = false;
        setFavorites((prev) => {
          const exists = prev.includes(itemSlug);
          nextSaved = !exists;
          return exists ? prev.filter((s) => s !== itemSlug) : [...prev, itemSlug];
        });
        return nextSaved;
      }
      try {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ itemSlug, itemType }),
        });
        if (res.ok) {
          const data = await res.json();
          const saved = Boolean(data.saved);
          setFavorites((prev) =>
            saved ? (prev.includes(itemSlug) ? prev : [...prev, itemSlug]) : prev.filter((s) => s !== itemSlug)
          );
          return saved;
        }
      } catch {
        // ignore
      }
      return false;
    },
    [token]
  );

  const isFavorite = useCallback((itemSlug: string) => favorites.includes(itemSlug), [favorites]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        favorites,
        loading,
        login,
        register,
        logout,
        refreshProfile,
        updateProfile,
        toggleFavorite,
        isFavorite,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
