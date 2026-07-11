'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, User, LayoutDashboard, CalendarDays, BookOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ProfileSheet } from '@/components/ProfileSheet';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/matches', icon: CalendarDays, label: 'Matches' },
  { href: '/leaderboard', icon: Trophy, label: 'Ranks' },
  { href: '/rules', icon: BookOpen, label: 'Rules' },
];

export function TopBar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl border-b border-border pt-safe">
        <div className="max-w-md md:max-w-2xl lg:max-w-5xl mx-auto h-14 px-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center -rotate-3">
              <Trophy className="text-primary-foreground w-3.5 h-3.5" />
            </div>
            <span className="font-display font-black text-sm uppercase tracking-tight italic text-foreground">
              CricBudz
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href || (link.href === '/matches' && pathname.startsWith('/matches'));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-colors',
                    isActive ? 'bg-primary-tint text-primary' : 'text-muted hover:text-foreground hover:bg-surface-hover'
                  )}
                >
                  <link.icon size={15} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={() => setProfileOpen(true)}
            className="w-9 h-9 rounded-full bg-primary-tint border border-primary/20 flex items-center justify-center overflow-hidden shrink-0 active:scale-95 transition-transform"
          >
            {user?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={16} className="text-primary" />
            )}
          </button>
        </div>
      </header>

      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
