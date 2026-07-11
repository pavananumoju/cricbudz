'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type ThemePreference = 'light' | 'dark' | null; // null = follow system
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: ResolvedTheme;
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'ipl_theme_preference';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: ResolvedTheme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(null);
  const [theme, setTheme] = useState<ResolvedTheme>('light');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference;
    const initialPreference = stored === 'light' || stored === 'dark' ? stored : null;
    setPreferenceState(initialPreference);

    const resolved = initialPreference ?? getSystemTheme();
    setTheme(resolved);
    applyTheme(resolved);

    if (!initialPreference) {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = () => {
        const next = getSystemTheme();
        setTheme(next);
        applyTheme(next);
      };
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
  }, []);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    const resolved = pref ?? getSystemTheme();
    setTheme(resolved);
    applyTheme(resolved);
    if (pref) {
      localStorage.setItem(STORAGE_KEY, pref);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setPreference(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setPreference]);

  return (
    <ThemeContext.Provider value={{ theme, preference, setPreference, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
