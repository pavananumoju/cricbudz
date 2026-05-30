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
  getTeamBrand
 }: SelectedSlotsProps) {
  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-1.5 md:gap-2 my-2 md:my-4">
      {[0, 1, 2].map((index) => {
        const player = selectedPlayers[index];
        const isAssignedMvp = player && mvpId === player.id;
        const playerBrand = player ? getTeamBrand(player.team) : null;

        return (
          <div 
            key={index} 
            className={cn(
              "relative h-10 md:h-12 rounded-xl border transition-all flex items-center justify-between px-3 md:px-4",
              player 
                ? isAssignedMvp 
                  ? "bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-950/20"
                  : "bg-white/5 border-white/10"
                : "bg-black/20 border-dashed border-white/5"
            )}
          >
            {player && playerBrand ? (
              <>
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1 pr-2">
                  <div className={cn(
                    "w-7 h-7 md:w-8 md:h-8 rounded-lg bg-black/40 border relative overflow-hidden flex-shrink-0 flex items-center justify-center",
                    playerBrand.borderClass
                  )}>
                    <SlotImage player={player} brand={playerBrand} />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <h4 className="font-display font-black text-[10px] md:text-[11px] uppercase tracking-tight italic truncate text-gray-100 leading-tight pr-1">
                      {player.name}
                    </h4>
                    <span className={cn(
                      "text-[7px] md:text-[8px] font-mono tracking-widest font-black uppercase transition-all",
                      playerBrand.textClass
                    )}>
                      {player.team}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onSetMvp(player.id)}
                    className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                      isAssignedMvp 
                        ? "bg-amber-500 text-black shadow-md shadow-amber-500/20" 
                        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-amber-400"
                    )}
                  >
                    <Zap size={11} className={isAssignedMvp ? "fill-current" : ""} />
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => onRemove(player.id)}
                    className="w-6 h-6 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 flex items-center justify-center transition-all"
                  >
                    <X size={11} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 mx-auto text-white/5">
                <User size={10} />
                <span className="font-display font-black text-[8px] uppercase tracking-widest italic">Trio Slot 0{index + 1}</span>
              </div>
            )}
            {isAssignedMvp && (
              <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter italic shadow-lg z-10">
                MVP
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}