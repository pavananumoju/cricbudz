'use client';

import Link from 'next/link';
import { Moon, Sun, LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';

export function ProfileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <Sheet open={open} onClose={onClose} title="Profile">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-primary-tint border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
          {user?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
          ) : (
            <User size={20} className="text-primary" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-display font-black text-sm uppercase tracking-tight text-foreground truncate">
            {user?.displayName || 'Strategist'}
          </p>
          <p className="text-xs text-muted truncate">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-surface-hover text-foreground"
        >
          <span className="flex items-center gap-3 text-sm font-bold">
            {theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
            Appearance
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted">
            {theme === 'dark' ? 'Dark' : 'Light'}
          </span>
        </button>

        {isAdmin && (
          <Link
            href="/admin"
            onClick={onClose}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-surface-hover text-foreground text-sm font-bold"
          >
            <Settings size={17} />
            Dev Control Center
          </Link>
        )}
      </div>

      <Button variant="destructive" className="w-full mt-6" onClick={() => logout()}>
        <LogOut size={16} />
        Logout
      </Button>
    </Sheet>
  );
}
