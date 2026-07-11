'use client';

import React, { useEffect, useState } from 'react';
import { useDev } from '@/context/DevContext';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Save, Trash2, Settings, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AdminPage() {
  const router = useRouter();
  const { isAdmin, loading } = useAuth();
  const { dateOverride, setDateOverride } = useDev();
  const [inputValue, setInputValue] = useState(dateOverride || '');

  useEffect(() => {
    if (!loading && !isAdmin) router.replace('/dashboard');
  }, [loading, isAdmin, router]);

  if (loading || !isAdmin) return null;

  const handleSave = () => {
    if (!inputValue) {
      setDateOverride(null);
      router.push('/dashboard');
    } else {
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      if (regex.test(inputValue)) {
        setDateOverride(inputValue);
        router.push('/dashboard');
      } else {
        alert('Please use YYYY-MM-DD format');
      }
    }
  };

  const handleClear = () => {
    setInputValue('');
    setDateOverride(null);
  };

  return (
    <div className="px-4 space-y-6 pb-4 lg:max-w-xl lg:mx-auto">
      <header className="flex items-center gap-3 pt-2">
        <div className="p-2 bg-accent-tint rounded-xl border border-accent/20">
          <Settings size={18} className="text-accent" />
        </div>
        <div>
          <h1 className="font-display font-black text-xl uppercase tracking-tight italic leading-none">Dev Control Center</h1>
          <p className="text-muted text-xs font-medium mt-1">Override system parameters for testing.</p>
        </div>
      </header>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <Calendar size={17} className="text-primary" />
            <h2 className="font-display font-black text-sm uppercase tracking-tight italic">System Date Override</h2>
          </div>

          <label htmlFor="date-override" className="block text-[9px] font-black uppercase tracking-[0.2em] text-muted mb-2">
            Override Date (YYYY-MM-DD)
          </label>
          <div className="flex gap-2 mb-4">
            <input
              id="date-override"
              type="text"
              placeholder="e.g. 2026-05-17"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 min-w-0 bg-surface-hover border border-border rounded-2xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-primary/50 transition-colors"
            />
            <Button onClick={handleSave} size="md" className="px-4">
              <Save size={15} />
            </Button>
            <Button onClick={handleClear} variant="destructive" size="md" className="px-3.5" title="Clear Override">
              <Trash2 size={15} />
            </Button>
          </div>

          <div className="p-3.5 rounded-2xl bg-warning-tint border border-warning/20 flex gap-3">
            <AlertCircle size={17} className="text-warning shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted leading-relaxed font-medium">
              Simulates the selected date app-wide (hours/minutes still track the real clock).
              Current: <span className="text-primary font-mono font-bold">{dateOverride || 'System date'}</span>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
