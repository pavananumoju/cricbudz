'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, Trophy, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/matches', icon: CalendarDays, label: 'Matches' },
  { href: '/leaderboard', icon: Trophy, label: 'Ranks' },
  { href: '/rules', icon: BookOpen, label: 'Rules' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl border-t border-border pb-safe lg:hidden">
      <div className="max-w-md mx-auto grid grid-cols-4">
        {links.map((link) => {
          const isActive =
            pathname === link.href || (link.href === '/matches' && pathname.startsWith('/matches'));
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center justify-center gap-1 py-2.5 group"
            >
              <link.icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                className={cn(
                  'transition-colors',
                  isActive ? 'text-primary' : 'text-muted group-active:text-foreground'
                )}
              />
              <span
                className={cn(
                  'text-[9px] font-black uppercase tracking-widest transition-colors',
                  isActive ? 'text-primary' : 'text-muted'
                )}
              >
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
