'use client';

import React, { useEffect, useState } from 'react';
import { useDev } from '@/context/DevContext';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { Calendar, Save, Trash2, Settings, AlertCircle, EyeOff, Users, ShieldCheck, DatabaseBackup } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getVisibilitySettings, setVisibilitySettings } from '@/services/dataService';
import { cn } from '@/lib/utils';

interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAdmin: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const { dateOverride, setDateOverride, getEffectiveNow } = useDev();
  const [inputValue, setInputValue] = useState(dateOverride || '');

  const [visEnabled, setVisEnabled] = useState(false);
  const [visDate, setVisDate] = useState('');
  const [visLoading, setVisLoading] = useState(true);
  const [visSaving, setVisSaving] = useState(false);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [togglingUid, setTogglingUid] = useState<string | null>(null);
  const [backingUp, setBackingUp] = useState(false);

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

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/users', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
      } else {
        toast.error(data.error || 'Failed to load users.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Network error loading users.');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  if (loading || !isAdmin) return null;

  const handleToggleAdmin = async (target: AdminUser) => {
    const nextIsAdmin = !target.isAdmin;
    setTogglingUid(target.uid);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ uid: target.uid, isAdmin: nextIsAdmin }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.uid === target.uid ? { ...u, isAdmin: nextIsAdmin } : u)));
        toast.success(`${target.displayName || target.email} is ${nextIsAdmin ? 'now an admin' : 'no longer an admin'}.`);
      } else {
        toast.error(data.error || 'Failed to update admin status.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Network error updating admin status.');
    } finally {
      setTogglingUid(null);
    }
  };

  const handleBackup = async () => {
    setBackingUp(true);
    const toastId = toast.loading('Exporting backup...');
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/backup', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Backup failed.', { id: toastId });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cricbudz-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded.', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Network error during backup.', { id: toastId });
    } finally {
      setBackingUp(false);
    }
  };

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

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <Users size={17} className="text-primary" />
            <h2 className="font-display font-black text-sm uppercase tracking-tight italic">Registered Users</h2>
          </div>

          {usersLoading ? (
            <p className="text-xs text-muted">Loading...</p>
          ) : users.length === 0 ? (
            <p className="text-xs text-muted">No registered users yet.</p>
          ) : (
            <div className="space-y-2">
              {users.map((u) => {
                const isSelf = u.uid === user?.uid;
                return (
                  <div
                    key={u.uid}
                    className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-surface-hover"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-display font-black text-xs uppercase tracking-tight truncate">
                          {u.displayName || u.email || u.uid}
                        </h4>
                        {isSelf && <span className="text-[8px] font-black text-muted uppercase tracking-widest">(You)</span>}
                      </div>
                      <p className="text-[10px] text-muted truncate mt-0.5">{u.email}</p>
                    </div>
                    {u.isAdmin && (
                      <Badge variant="primary" className="shrink-0">
                        <ShieldCheck size={10} />
                        Admin
                      </Badge>
                    )}
                    <Button
                      onClick={() => handleToggleAdmin(u)}
                      variant={u.isAdmin ? 'destructive' : 'secondary'}
                      size="sm"
                      disabled={togglingUid === u.uid || (isSelf && u.isAdmin)}
                      className="shrink-0"
                    >
                      {togglingUid === u.uid ? '...' : u.isAdmin ? 'Revoke' : 'Grant Admin'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <DatabaseBackup size={17} className="text-primary" />
            <h2 className="font-display font-black text-sm uppercase tracking-tight italic">Data Backup</h2>
          </div>
          <p className="text-[11px] text-muted leading-relaxed font-medium mb-4">
            Downloads every collection (matches, players, squads, settings) as one JSON file to your device.
            Keep it somewhere safe — if Firestore data is ever lost, this file can restore it.
          </p>
          <Button onClick={handleBackup} size="md" disabled={backingUp} className="w-full">
            {backingUp ? 'Exporting...' : 'Download Backup'}
          </Button>
        </Card>
      </motion.div>
    </div>
  );
}
