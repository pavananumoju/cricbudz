'use client';

import { Check, Plus, Lock } from 'lucide-react';
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
  disabled?: boolean;
  onSelect: () => void;
}

export default function PlayerCard({ player, brand, isSelected, disabled, onSelect }: PlayerCardProps) {
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
      disabled={disabled}
      aria-disabled={disabled}
      aria-pressed={isSelected}
      aria-label={`${player.name}${isSelected ? ' (selected)' : ''}`}
      className={cn(
        "w-full flex items-center gap-3 p-2 lg:p-2.5 rounded-xl border transition-all text-left group overflow-hidden relative",
        disabled ? "cursor-not-allowed" : "active:scale-[0.98]",
        isSelected
          ? "bg-surface-hover border-border shadow-sm"
          : cn("bg-surface border-border/70 shadow-sm", !disabled && "hover:bg-surface-hover"),
        disabled && !isSelected && "opacity-50"
      )}
    >
      <div className={cn(
        "w-9 h-9 lg:w-10 lg:h-10 rounded-lg bg-surface-hover border overflow-hidden relative flex-shrink-0 flex items-center justify-center",
        brand.borderClass,
        disabled && !isSelected && "grayscale"
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
          <span className={cn("font-display font-black text-micro tracking-wider", brand.textClass)}>
            {getInitials(player.name)}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 pr-2">
        <h4 title={player.name} className="font-display font-black text-xs lg:text-[13px] uppercase tracking-tight italic truncate leading-tight pr-2 text-foreground">{player.name}</h4>
        <div className="flex items-center gap-2">
          {/* No salary cap / budget in this game — `player.price` is randomized
              at sync and unused by draft rules or scoring, so showing it as a
              "₹9.4M" value falsely implied a spend constraint. (AUDIT.md P1-1 / P3-9.) */}
          <span className="text-meta font-black text-muted uppercase tracking-widest">{player.role}</span>
        </div>
      </div>

      <div
        className={cn(
          "w-6 h-6 rounded-lg flex items-center justify-center transition-all bg-surface-hover shrink-0",
          !disabled && "group-hover:scale-110",
          isSelected
            ? "bg-primary text-primary-foreground shadow-sm"
            : disabled
            ? "text-muted/40"
            : "text-muted group-hover:text-primary group-hover:bg-primary-tint"
        )}
      >
        {isSelected ? (
          <Check size={12} strokeWidth={4} />
        ) : disabled ? (
          <Lock size={11} />
        ) : (
          <Plus size={12} />
        )}
      </div>

      <div
        style={{ backgroundColor: brand.accentColor }}
        className={cn("absolute left-0 top-0 bottom-0 w-1", disabled && !isSelected ? "opacity-30" : "opacity-80")}
      />
    </button>
  );
}