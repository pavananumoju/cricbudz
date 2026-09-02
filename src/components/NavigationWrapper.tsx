'use client';

import { useAuth } from '@/context/AuthContext';
import { useDev } from '@/context/DevContext';
import { TopBar } from '@/components/TopBar';
import { BottomNav } from '@/components/BottomNav';
import { DevOverrideBanner } from '@/components/DevOverrideBanner';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

// The trio-draft flow (/matches/[id]) is a focused task screen — it renders
// its own header + sticky action bar and hides the global chrome so the two
// bottom bars don't stack on top of each other.
const DRAFT_ROUTE = /^\/matches\/[^/]+$/;

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { dateOverride } = useDev();
  const pathname = usePathname();

  if (loading) return <>{children}</>;

  const isDraftPage = DRAFT_ROUTE.test(pathname);
  const showChrome = !!user && pathname !== '/' && !isDraftPage;

  // DevOverrideBanner is fixed at top:0 / z-50 / h-9. When it's showing, the
  // fixed TopBar drops to top-9 and every content wrapper gains a matching
  // pt-9 so nothing hides behind it. (AUDIT.md P2-5.)
  const hasBanner = !!dateOverride;
  const bannerPad = hasBanner ? 'pt-9' : '';

  if (isDraftPage) {
    return (
      <>
        <DevOverrideBanner />
        <div className={bannerPad}>{children}</div>
      </>
    );
  }

  return (
    <>
      <DevOverrideBanner />
      {showChrome && <TopBar bannerActive={hasBanner} />}
      <div
        className={cn(
          showChrome ? 'max-w-md md:max-w-2xl lg:max-w-5xl mx-auto pt-14 pb-24 lg:pb-10 min-h-screen' : '',
          bannerPad
        )}
      >
        {children}
      </div>
      {showChrome && <BottomNav />}
    </>
  );
}
