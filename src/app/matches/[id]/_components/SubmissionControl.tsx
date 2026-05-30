'use client';

import { ShieldAlert, ChevronRight, Info, Check, PlusCircle } from 'lucide-react';
import { Player } from '@/types';
import { cn } from '@/lib/utils';

interface SubmissionControlProps {
  canSubmit: boolean;
  statusMessage: string;
  saving: boolean;
  isLocked?: boolean;
  recommending?: boolean;
  selectedPlayers: Player[];
  mvpId: string | null;
  onSave: () => void;
  onAiRecommend?: () => void;
}

export default function SubmissionControl({
  canSubmit,
  statusMessage,
  saving,
  isLocked,
  recommending,
  selectedPlayers,
  mvpId,
  onSave,
  onAiRecommend
}: SubmissionControlProps) {
  return (
    <div className="flex flex-col gap-3 md:gap-4 transition-all">
      {/* Compact Status on Mobile */}
      <div className={cn(
          "flex gap-2 items-center p-2 md:p-3 rounded-xl border text-[9px] md:text-[10px] font-medium leading-tight italic",
          canSubmit ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200" : 
          isLocked ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-black/40 border-white/5 text-gray-400"
        )}>
          <ShieldAlert size={12} className={cn("flex-shrink-0", canSubmit ? "text-emerald-400" : "text-amber-400")} />
          <p className={cn("truncate md:whitespace-normal", canSubmit ? "text-emerald-200" : isLocked ? "text-red-400" : "text-amber-200/80")}>{statusMessage}</p>
        </div>

        {!isLocked && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onAiRecommend}
              disabled={recommending || saving}
              className="py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-display font-black text-[9px] uppercase tracking-widest hover:bg-blue-500/20 transition-all flex items-center justify-center gap-1.5 md:gap-2 group"
            >
              {recommending ? (
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <PlusCircle size={11} className="group-hover:rotate-90 transition-transform" />
                  AI Assist
                </>
              )}
            </button>

            <button
              onClick={onSave}
              disabled={saving || !canSubmit}
              className={cn(
                "py-2.5 rounded-xl font-display font-black text-[10px] uppercase tracking-tight transition-all flex items-center justify-center gap-1.5 md:gap-2",
                canSubmit 
                  ? "bg-white text-black hover:bg-gray-100 active:scale-[0.98]" 
                  : "bg-white/5 text-white/20 cursor-not-allowed"
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
          </div>
        )}

        <div className="border-t border-white/5 pt-2.5">
          <ul className="flex md:grid md:grid-cols-2 lg:grid-cols-1 items-center gap-x-4 gap-y-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <li className={cn("flex items-center gap-1.5 text-[9px] md:text-[10px] font-medium whitespace-nowrap", selectedPlayers.length === 3 ? "text-emerald-400" : "text-gray-500")}>
              <Check size={10} className={selectedPlayers.length === 3 ? "opacity-100" : "opacity-30"} /> 
              <span className="md:inline">3 Players</span>
            </li>
            <li className={cn("flex items-center gap-1.5 text-[9px] md:text-[10px] font-medium whitespace-nowrap", new Set(selectedPlayers.map(p => p.team)).size === 2 ? "text-emerald-400" : "text-gray-500")}>
              <Check size={10} className={new Set(selectedPlayers.map(p => p.team)).size === 2 ? "opacity-100" : "opacity-30"} /> 
              <span className="md:inline">2 Teams</span>
            </li>
            <li className={cn("flex items-center gap-1.5 text-[9px] md:text-[10px] font-medium whitespace-nowrap", mvpId ? "text-emerald-400" : "text-gray-500")}>
              <Check size={10} className={mvpId ? "opacity-100" : "opacity-30"} /> 
              <span className="md:inline">Trio MVP</span>
            </li>
          </ul>
        </div>
      </div>
  );
}