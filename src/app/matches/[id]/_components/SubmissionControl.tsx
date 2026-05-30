'use client';

import { ShieldAlert, ChevronRight, Info, Check } from 'lucide-react';
import { Player } from '@/types';
import { cn } from '@/lib/utils';

interface SubmissionControlProps {
  canSubmit: boolean;
  statusMessage: string;
  saving: boolean;
  selectedPlayers: Player[];
  mvpId: string | null;
  onSave: () => void;
}

export default function SubmissionControl({
  canSubmit,
  statusMessage,
  saving,
  selectedPlayers,
  mvpId,
  onSave
}: SubmissionControlProps) {
  return (
    <div className="p-8 rounded-[36px] bg-white/2 border border-white/5 transition-all sticky top-[280px]">
      <h3 className="font-display font-black text-xl uppercase tracking-tight italic mb-4">Submission Control</h3>
      
      <div className={cn(
        "flex gap-3 items-start p-4 rounded-2xl border text-xs font-medium leading-relaxed italic mb-6",
        canSubmit ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200" : "bg-black/40 border-white/5 text-gray-400"
      )}>
        <ShieldAlert size={18} className={cn("flex-shrink-0 mt-0.5", canSubmit ? "text-emerald-400" : "text-amber-400")} />
        <p className={canSubmit ? "text-emerald-200" : "text-amber-200/80"}>{statusMessage}</p>
      </div>

      <button
        onClick={onSave}
        disabled={saving || !canSubmit}
        className={cn(
          "w-full py-5 rounded-2xl font-display font-black text-md uppercase tracking-tight transition-all flex items-center justify-center gap-3",
          canSubmit 
            ? "bg-white text-black hover:bg-gray-100 active:scale-[0.98]" 
            : "bg-white/5 text-white/20 cursor-not-allowed"
        )}
      >
        {saving ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            Lock Trio Selection
            <ChevronRight size={16} />
          </>
        )}
      </button>

      <div className="mt-6 border-t border-white/5 pt-6 space-y-4">
        <h4 className="font-display font-black text-xs uppercase tracking-wider text-gray-400 flex items-center gap-2">
          <Info size={14} className="text-blue-500" /> Arena Selection Checklist
        </h4>
        <ul className="text-[11px] font-medium text-gray-500 space-y-2">
          <li className={cn("flex items-center gap-2", selectedPlayers.length === 3 ? "text-emerald-400" : "")}>
            <Check size={12} /> Pick exactly 3 active players total
          </li>
          <li className={cn("flex items-center gap-2", new Set(selectedPlayers.map(p => p.team)).size === 2 ? "text-emerald-400" : "")}>
            <Check size={12} /> Minimum 1 player from each franchise pool
          </li>
          <li className={cn("flex items-center gap-2", mvpId ? "text-emerald-400" : "")}>
            <Check size={12} /> Nominate exactly 1 team MVP
          </li>
        </ul>
      </div>
    </div>
  );
}