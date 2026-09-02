'use client';

import { AlertTriangle } from 'lucide-react';
import { useDev } from '@/context/DevContext';

// Surfaces an active Dev Control Center date override on every page, not
// just /admin. Without this, an override left on from a prior testing
// session is invisible: the client silently treats matches as open/locked
// based on the fake date while Firestore rules still enforce the real
// server clock, producing confusing "can't edit" (no override, real clock
// already past a match) or "save fails" (override says pre-toss, rules
// disagree) symptoms depending on which device still has it set.
export function DevOverrideBanner() {
  const { dateOverride, setDateOverride } = useDev();

  if (!dateOverride) return null;

  // Fixed on top at z-50 (above TopBar's z-40) with a known height (h-9) so
  // NavigationWrapper can offset the TopBar and page content by exactly that
  // much. It used to render as a plain flow block behind the fixed TopBar and
  // was invisible on every chrome page. (AUDIT.md P2-5.)
  return (
    <div className="fixed top-0 inset-x-0 z-50 h-9 bg-warning-tint border-b border-warning/30 px-3 flex items-center justify-center gap-2 text-center overflow-hidden">
      <AlertTriangle size={13} className="text-warning shrink-0" />
      <p className="text-meta font-black uppercase tracking-wide text-warning truncate">
        Dev date override: {dateOverride}
      </p>
      <button
        onClick={() => setDateOverride(null)}
        className="text-meta font-black uppercase tracking-wide text-warning underline underline-offset-2 shrink-0"
      >
        Clear
      </button>
    </div>
  );
}
