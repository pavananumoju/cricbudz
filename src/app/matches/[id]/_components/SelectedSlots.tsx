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
  
  // Align targeting to check for specific image token mappings first
  const numericId = player.imageId ? String(player.imageId).trim() : String(player.id).trim();
  const imageSource = `https://i.cricketcb.com/stats/img/faceImages/${numericId}.jpg`;

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
      onError={() => setImgError(true)}
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
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-2.5 my-6">
      {[0, 1, 2].map((index) => {
        const player = selectedPlayers[index];
        const isAssignedMvp = player && mvpId === player.id;
        const playerBrand = player ? getTeamBrand(player.team) : null;

        return (
          <div 
            key={index} 
            className={cn(
              "relative h-16 rounded-xl border transition-all flex items-center justify-between px-5",
              player 
                ? isAssignedMvp 
                  ? "bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-600/10 border-amber-500/40 shadow-md shadow-amber-950/20"
                  : "bg-white/5 border-white/10"
                : "bg-black/20 border-dashed border-white/5"
            )}
          >
            {player && playerBrand ? (
              <>
                <div className="grid grid-cols-[auto_1fr] items-center gap-4 min-w-0 flex-1 pr-6">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black opacity-20 text-gray-400">0{index + 1}</span>
                    <div className={cn(
                      "w-10 h-10 rounded-xl bg-black/40 border relative overflow-hidden flex-shrink-0 flex items-center justify-center",
                      playerBrand.borderClass
                    )}>
                      <SlotImage player={player} brand={playerBrand} />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between min-w-0 w-full gap-6">
                    <h4 className="font-display font-black text-sm uppercase tracking-tight italic truncate text-gray-100 flex-1">
                      {player.name}
                    </h4>
                    <span className={cn(
                      "text-[10px] font-mono tracking-widest font-black px-2.5 py-0.5 rounded uppercase flex-shrink-0 transition-all ml-auto shadow-sm",
                      playerBrand.textClass,
                      playerBrand.bgClass
                    )}>
                      {player.team}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onSetMvp(player.id)}
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                      isAssignedMvp 
                        ? "bg-amber-500 text-black shadow-md shadow-amber-500/20" 
                        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-amber-400"
                    )}
                  >
                    <Zap size={14} className={isAssignedMvp ? "fill-current" : ""} />
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => onRemove(player.id)}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 flex items-center justify-center transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 mx-auto text-white/10">
                <User size={14} />
                <span className="font-display font-black text-[10px] uppercase tracking-widest italic">Empty Trio Slot</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}