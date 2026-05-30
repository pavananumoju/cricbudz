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
    accentColor: string;
  };
  isSelected: boolean;
  onSelect: () => void;
}

export default function PlayerCard({ player, brand, isSelected, onSelect }: PlayerCardProps) {
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

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 p-2 rounded-xl border transition-all text-left group overflow-hidden relative",
        isSelected ? "bg-white/5 border-white/10 shadow-lg shadow-black/20" : "bg-white/2 border-white/5 hover:bg-white/5"
      )}
    >
      <div className={cn(
        "w-9 h-9 rounded-lg bg-black/40 border overflow-hidden relative flex-shrink-0 flex items-center justify-center",
        brand.borderClass
      )}>
        {!imgError && numericId && numericId !== 'undefined' ? (
          <Image 
            src={imageSource} 
            alt={player.name} 
            fill 
            sizes="36px" 
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
        ) : (
          <span className={cn("font-display font-black text-[9px] tracking-wider", brand.textClass)}>
            {getInitials(player.name)}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <h4 className="font-display font-black text-xs uppercase tracking-tight italic truncate leading-tight">{player.name}</h4>
        <div className="flex items-center gap-2">
          <span className="text-[7px] font-black text-white/30 uppercase tracking-widest">{player.role}</span>
          <span className="w-0.5 h-0.5 rounded-full bg-white/10" />
          <span className="text-[8px] font-mono font-bold text-gray-500">₹{player.price.toFixed(1)}M</span>
        </div>
      </div>

      <div 
        className={cn(
          "w-6 h-6 rounded-lg flex items-center justify-center transition-all bg-white/5 group-hover:scale-110",
          isSelected ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 group-hover:text-blue-400"
        )}
      >
        {isSelected ? (
          <Check size={12} strokeWidth={4} />
        ) : (
          <Plus size={12} />
        )}
      </div>

      <div 
        style={{ backgroundColor: brand.accentColor }} 
        className="absolute left-0 top-0 bottom-0 w-1 opacity-80" 
      />
    </button>
  );
}