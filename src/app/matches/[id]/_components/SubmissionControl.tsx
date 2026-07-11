'use client';

import { ShieldAlert, ChevronRight, Check } from 'lucide-react';
import { Player } from '@/types';
import { cn } from '@/lib/utils';

interface SubmissionControlProps {
  canSubmit: boolean;
  statusMessage: string;
  saving: boolean;
  isLocked?: boolean;
  selectedPlayers: Player[];
  mvpId: string | null;
  onSave: () => void;
}

export default function SubmissionControl({
  canSubmit,
  statusMessage,
  saving,
  isLocked,
  selectedPlayers,
  mvpId,
  onSave,
}: SubmissionControlProps) {
  return (
    <div className="flex flex-col gap-3 md:gap-4 transition-all">
      {/* Compact Status on Mobile */}
      <div className={cn(
          "flex gap-2 items-center p-2.5 rounded-xl border text-[10px] font-medium leading-tight italic",
          canSubmit ? "bg-success-tint border-success/20 text-success" :
          isLocked ? "bg-danger-tint border-danger/20 text-danger" : "bg-surface-hover border-border text-muted"
        )}>
          <ShieldAlert size={13} className={cn("flex-shrink-0", canSubmit ? "text-success" : isLocked ? "text-danger" : "text-warning")} />
          <p>{statusMessage}</p>
        </div>

        {!isLocked && (
          <button
            onClick={onSave}
            disabled={saving || !canSubmit}
            className={cn(
              "py-3 rounded-xl font-display font-black text-xs uppercase tracking-tight transition-all flex items-center justify-center gap-2 active:scale-[0.98]",
              canSubmit
                ? "bg-foreground text-background shadow-sm"
                : "bg-surface-hover text-muted cursor-not-allowed"
            )}
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Lock Trio
                <ChevronRight size={13} />
              </>
            )}
          </button>
        )}

        <div className="border-t border-border pt-2.5">
          <ul className="flex items-center gap-x-4 gap-y-1.5 overflow-x-auto no-scrollbar pb-1">
            <li className={cn("flex items-center gap-1.5 text-[10px] font-medium whitespace-nowrap", selectedPlayers.length === 3 ? "text-success" : "text-muted")}>
              <Check size={10} className={selectedPlayers.length === 3 ? "opacity-100" : "opacity-30"} />
              3 Players
            </li>
            <li className={cn("flex items-center gap-1.5 text-[10px] font-medium whitespace-nowrap", new Set(selectedPlayers.map(p => p.team)).size === 2 ? "text-success" : "text-muted")}>
              <Check size={10} className={new Set(selectedPlayers.map(p => p.team)).size === 2 ? "opacity-100" : "opacity-30"} />
              2 Teams
            </li>
            <li className={cn("flex items-center gap-1.5 text-[10px] font-medium whitespace-nowrap", mvpId ? "text-success" : "text-muted")}>
              <Check size={10} className={mvpId ? "opacity-100" : "opacity-30"} />
              Trio MVP
            </li>
          </ul>
        </div>
      </div>
  );
}