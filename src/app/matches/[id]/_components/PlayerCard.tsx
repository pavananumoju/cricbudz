'use client';

import { Check, Plus } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { Player } from '@/types';
import { cn } from '@/lib/utils';

interface PlayerCardProps {
  player: Player;
  brand: {
    textClass: string;
    bgClass: string;
    borderClass: string;
  };
  isSelected: boolean;
  onSelect: () => void;
}

export default function PlayerCard({ player, brand, isSelected, onSelect }: PlayerCardProps) {
  const [imgError, setImgError] = useState(false);

  // Extract the true Cricbuzz identifier. 
  // If player.imageId exists in your schema, use it. Otherwise, clean up player.id
  const numericId = player.imageId ? String(player.imageId).trim() : String(player.id).trim();
  
  // High-performance image path targeting Cricbuzz legacy asset CDN
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

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-4 p-3.5 rounded-2xl border transition-all text-left group",
        isSelected ? "bg-blue-600/20 border-blue-500/50" : "bg-white/2 border-white/5 hover:bg-white/5"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-xl bg-black/40 border overflow-hidden relative flex-shrink-0 flex items-center justify-center",
        brand.borderClass
      )}>
        {!imgError && numericId && numericId !== 'undefined' ? (
          <Image 
            src={imageSource} 
            alt={player.name} 
            fill 
            sizes="48px" 
            className="object-cover object-top rounded-xl" 
            onError={() => setImgError(true)}
            unoptimized 
          />
        ) : (
          <span className={cn("font-display font-black text-xs tracking-wider", brand.textClass)}>
            {getInitials(player.name)}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-display font-black text-md uppercase tracking-tight italic truncate">{player.name}</h4>
        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mt-0.5">{player.role}</p>
      </div>

      <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-white/5">
        {isSelected ? (
          <Check size={14} className="text-blue-400" />
        ) : (
          <Plus size={14} className="text-gray-500 group-hover:text-blue-400" />
        )}
      </div>
    </button>
  );
}