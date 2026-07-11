'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface DevContextType {
  dateOverride: string | null;
  setDateOverride: (date: string | null) => void;
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

  return (
    <DevContext.Provider value={{ dateOverride, setDateOverride }}>
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
