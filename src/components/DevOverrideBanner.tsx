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

  return (
    <div className="bg-warning-tint border-b border-warning/30 px-3 py-2 flex items-center justify-center gap-2 text-center">
      <AlertTriangle size={13} className="text-warning shrink-0" />
      <p className="text-[10px] font-black uppercase tracking-wide text-warning">
        Dev date override active on this device: {dateOverride}
      </p>
      <button
        onClick={() => setDateOverride(null)}
        className="text-[10px] font-black uppercase tracking-wide text-warning underline underline-offset-2 shrink-0"
      >
        Clear
      </button>
    </div>
  );
}
