'use client';

import React, { useEffect, useState } from 'react';
import { useDev } from '@/context/DevContext';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Save, Trash2, Settings, AlertCircle, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getVisibilitySettings, setVisibilitySettings } from '@/services/dataService';
import { cn } from '@/lib/utils';

export default function AdminPage() {
  const router = useRouter();
  const { isAdmin, loading } = useAuth();
  const { dateOverride, setDateOverride, getEffectiveNow } = useDev();
  const [inputValue, setInputValue] = useState(dateOverride || '');

  const [visEnabled, setVisEnabled] = useState(false);
  const [visDate, setVisDate] = useState('');
  const [visLoading, setVisLoading] = useState(true);
  const [visSaving, setVisSaving] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) router.replace('/dashboard');
  }, [loading, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    getVisibilitySettings().then((settings) => {
      setVisEnabled(settings?.hideUntilToss ?? false);
      setVisDate(settings?.date || getEffectiveNow().toISOString().slice(0, 10));
      setVisLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  if (loading || !isAdmin) return null;

  const handleSaveVisibility = async () => {
    setVisSaving(true);
    try {
      await setVisibilitySettings({ hideUntilToss: visEnabled, date: visDate });
      toast.success('Visibility settings saved.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save visibility settings.');
    } finally {
      setVisSaving(false);
    }
  };

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
            <Button onClick={handleSave} size="md" className="px-4" aria-label="Save date override">
              <Save size={15} />
            </Button>
            <Button onClick={handleClear} variant="destructive" size="md" className="px-3.5" title="Clear Override" aria-label="Clear date override">
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

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <EyeOff size={17} className="text-primary" />
            <h2 className="font-display font-black text-sm uppercase tracking-tight italic">Submission Visibility</h2>
          </div>

          {visLoading ? (
            <p className="text-xs text-muted">Loading...</p>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setVisEnabled((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-surface-hover mb-4"
              >
                <div className="text-left">
                  <span className="block text-sm font-bold text-foreground">Hide trios until toss</span>
                  <span className="block text-[10px] text-muted mt-0.5">
                    Stops users copying each other&apos;s picks on a critical day
                  </span>
                </div>
                <span
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors shrink-0 ml-3',
                    visEnabled ? 'bg-primary' : 'bg-border'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                      visEnabled && 'translate-x-5'
                    )}
                  />
                </span>
              </button>

              <label htmlFor="vis-date" className="block text-[9px] font-black uppercase tracking-[0.2em] text-muted mb-2">
                Applies to (YYYY-MM-DD)
              </label>
              <div className="flex gap-2 mb-4">
                <input
                  id="vis-date"
                  type="text"
                  placeholder="e.g. 2026-04-18"
                  value={visDate}
                  onChange={(e) => setVisDate(e.target.value)}
                  className="flex-1 min-w-0 bg-surface-hover border border-border rounded-2xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-primary/50 transition-colors"
                />
                <Button onClick={handleSaveVisibility} size="md" className="px-4" disabled={visSaving} aria-label="Save visibility settings">
                  <Save size={15} />
                </Button>
              </div>

              <div className="p-3.5 rounded-2xl bg-warning-tint border border-warning/20 flex gap-3">
                <AlertCircle size={17} className="text-warning shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted leading-relaxed font-medium">
                  Only affects the named day&apos;s not-yet-toss matches. Past and already-tossed matches are
                  always visible to everyone. No need to remember to turn this off — it&apos;s automatically
                  inert on any other day.
                </p>
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
