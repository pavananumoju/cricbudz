'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface DevContextType {
  dateOverride: string | null;
  setDateOverride: (date: string | null) => void;
  getEffectiveNow: () => Date;
}

const DevContext = createContext<DevContextType | undefined>(undefined);

export function DevProvider({ children }: { children: React.ReactNode }) {
  const [dateOverride, setDateOverrideState] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('ipl_date_override');
    if (stored) {
      setDateOverrideState(stored);
    }
  }, []);

  const setDateOverride = (date: string | null) => {
    setDateOverrideState(date);
    if (date) {
      localStorage.setItem('ipl_date_override', date);
    } else {
      localStorage.removeItem('ipl_date_override');
    }
  };

  const getEffectiveNow = () => {
    if (!dateOverride) return new Date();
    const now = new Date();
    const timeStr = now.toISOString().split('T')[1];
    return new Date(`${dateOverride}T${timeStr}`);
  };

  return (
    <DevContext.Provider value={{ dateOverride, setDateOverride, getEffectiveNow }}>
      {children}
    </DevContext.Provider>
  );
}

export function useDev() {
  const context = useContext(DevContext);
  if (context === undefined) {
    throw new Error('useDev must be used within a DevProvider');
  }
  return context;
}
