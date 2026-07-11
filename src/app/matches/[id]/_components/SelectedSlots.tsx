'use client';

import { User, Zap, X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { Player } from '@/types';
import { cn } from '@/lib/utils';

interface SelectedSlotsProps {
  selectedPlayers: Player[];
  mvpId: string | null;
  onRemove: (id: string) => void;
  onSetMvp: (id: string) => void;
  getTeamBrand: (team: string) => any;
  locked?: boolean;
}

function SlotImage({ player, brand }: { player: Player; brand: any }) {
  const [imgError, setImgError] = useState(false);
  
  const numericId = player.imageId ? String(player.imageId).trim() : String(player.id).trim();
  const imageSource = `https://static.cricbuzz.com/a/img/v1/152x152/i1/c${numericId}/i.jpg`;
  const fallbackSource = `https://i.cricketcb.com/stats/img/faceImages/${numericId}.jpg`;

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  if (imgError || !numericId || numericId === 'undefined') {
    return (
      <span className={cn("font-display font-black text-[10px] tracking-wider", brand.textClass)}>
        {getInitials(player.name)}
      </span>
    );
  }

  return (
    <Image 
      src={imageSource} 
      alt="" 
      fill 
      sizes="40px" 
      className="object-cover object-top rounded-lg" 
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        if (target.src !== fallbackSource) {
          target.src = fallbackSource;
        } else {
          setImgError(true);
        }
      }}
      unoptimized 
    />
  );
}

export default function SelectedSlots({
  selectedPlayers,
  mvpId,
  onRemove,
  onSetMvp,
  getTeamBrand,
  locked
 }: SelectedSlotsProps) {
  return (
    <div className="w-full flex md:flex-col gap-2 no-scrollbar">
      {[0, 1, 2].map((index) => {
        const player = selectedPlayers[index];
        const isAssignedMvp = player && mvpId === player.id;
        const playerBrand = player ? getTeamBrand(player.team) : null;

        return (
          <div 
            key={index} 
            className={cn(
              "relative flex-1 md:flex-none h-12 rounded-xl border transition-all flex items-center justify-between px-3",
              player
                ? isAssignedMvp
                  ? "bg-accent-tint border-accent/40 shadow-sm"
                  : "bg-surface border-border shadow-sm"
                : "bg-surface-hover/50 border-dashed border-border"
            )}
          >
            {player && playerBrand ? (
              <>
                <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                  <div className={cn(
                    "w-7 h-7 rounded-lg bg-surface-hover border relative overflow-hidden flex-shrink-0 flex items-center justify-center",
                    playerBrand.borderClass
                  )}>
                    <SlotImage player={player} brand={playerBrand} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-display font-black text-[11px] uppercase tracking-tight italic truncate text-foreground leading-tight pr-2">
                      {player.name}
                    </h4>
                    <span className={cn(
                      "text-[8px] font-mono tracking-widest font-black uppercase",
                      playerBrand.textClass
                    )}>
                      {player.team}
                    </span>
                  </div>
                </div>

                {locked ? (
                  isAssignedMvp && (
                    <div className="w-6 h-6 rounded-lg bg-accent text-white flex items-center justify-center flex-shrink-0 ml-auto">
                      <Zap size={11} className="fill-current" />
                    </div>
                  )
                ) : (
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
                    <button
                      type="button"
                      onClick={() => onSetMvp(player.id)}
                      className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                        isAssignedMvp
                          ? "bg-accent text-white shadow-sm"
                          : "bg-surface-hover text-muted hover:bg-accent-tint hover:text-accent"
                      )}
                    >
                      <Zap size={11} className={isAssignedMvp ? "fill-current" : ""} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemove(player.id)}
                      className="w-6 h-6 rounded-lg bg-surface-hover hover:bg-danger-tint text-muted hover:text-danger flex items-center justify-center transition-all"
                    >
                      <X size={11} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 mx-auto text-muted/60">
                <User size={10} />
                <span className="font-display font-black text-[8px] uppercase tracking-widest italic">Trio Slot 0{index + 1}</span>
              </div>
            )}
            {isAssignedMvp && (
              <div className="absolute -top-1.5 -right-1.5 bg-accent text-white px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter italic shadow-sm z-10">
                MVP
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}