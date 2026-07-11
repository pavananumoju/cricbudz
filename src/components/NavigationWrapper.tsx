'use client';

import { useAuth } from '@/context/AuthContext';
import { TopBar } from '@/components/TopBar';
import { BottomNav } from '@/components/BottomNav';
import { usePathname } from 'next/navigation';

// The trio-draft flow (/matches/[id]) is a focused task screen — it renders
// its own header + sticky action bar and hides the global chrome so the two
// bottom bars don't stack on top of each other.
const DRAFT_ROUTE = /^\/matches\/[^/]+$/;

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) return <>{children}</>;

  const isDraftPage = DRAFT_ROUTE.test(pathname);
  const showChrome = !!user && pathname !== '/' && !isDraftPage;

  if (isDraftPage) return <>{children}</>;

  return (
    <>
      {showChrome && <TopBar />}
      <div className={showChrome ? 'max-w-md md:max-w-2xl lg:max-w-5xl mx-auto pt-14 pb-24 lg:pb-10 min-h-screen' : ''}>{children}</div>
      {showChrome && <BottomNav />}
    </>
  );
}
