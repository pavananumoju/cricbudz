'use client';

import { Check, Plus } from 'lucide-react';
import Image from 'next/image';
import { Player } from '@/types';
import { cn } from '@/lib/utils';

interface PlayerPoolsProps {
  team1Name: string;
  team2Name: string;
  team1Brand: any;
  team2Brand: any;
  team1Players: Player[];
  team2Players: Player[];
  selectedPlayers: Player[];
  onSelectPlayer: (player: Player) => void;
}

export default function PlayerRosterPools({
  team1Name,
  team2Name,
  team1Brand,
  team2Brand,
  team1Players,
  team2Players,
  selectedPlayers,
  onSelectPlayer
}: PlayerPoolsProps) {
  
  const renderPlayerCard = (player: Player, brand: any) => {
    const isSelected = !!selectedPlayers.find(p => p.id === player.id);
    return (
      <button
        key={player.id}
        onClick={() => onSelectPlayer(player)}
        className={cn(
          "w-full flex items-center gap-4 p-3.5 rounded-2xl border transition-all text-left group",
          isSelected ? "bg-blue-600/20 border-blue-500/50" : "bg-white/2 border-white/5 hover:bg-white/5"
        )}
      >
        <div className={cn(
          "w-12 h-12 rounded-xl bg-black/40 border overflow-hidden relative flex-shrink-0 flex items-center justify-center p-1",
          brand.borderClass
        )}>
          <Image 
            src={player.imageId && String(player.imageId).trim() !== "" ? `https://www.cricbuzz.com/a/img/v1/152x152/i1/${String(player.imageId).trim()}/player-profile.jpg` : `https://www.cricbuzz.com/a/img/v1/100x100/i1/${brand.imageId}.webp`
            } 
            alt="" fill sizes="48px" className="object-contain p-0.5 rounded-xl" unoptimized 
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-display font-black text-md uppercase tracking-tight italic truncate">{player.name}</h4>
          <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mt-0.5">{player.role}</p>
        </div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-white/5">
          {isSelected ? <Check size={14} className="text-blue-400" /> : <Plus size={14} className="text-gray-500 group-hover:text-blue-400" />}
        </div>
      </button>
    );
  };

  return (
    <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Franchise Column Left Track */}
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-white/2 border border-white/5 flex items-center justify-between sticky top-[320px] md:top-[280px] z-20 backdrop-blur-sm bg-[#0a0a0b]/80">
          <h3 className={cn("font-display font-black text-lg uppercase tracking-tight italic", team1Brand.textClass)}>
            {team1Name} Pool
          </h3>
          <span className="text-[10px] font-mono font-black opacity-40">{team1Players.length} Available</span>
        </div>
        <div className="space-y-3">
          {team1Players.map((player) => renderPlayerCard(player, team1Brand))}
        </div>
      </div>

      {/* Franchise Column Right Track */}
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-white/2 border border-white/5 flex items-center justify-between sticky top-[320px] md:top-[280px] z-20 backdrop-blur-sm bg-[#0a0a0b]/80">
          <h3 className={cn("font-display font-black text-lg uppercase tracking-tight italic", team2Brand.textClass)}>
            {team2Name} Pool
          </h3>
          <span className="text-[10px] font-mono font-black opacity-40">{team2Players.length} Available</span>
        </div>
        <div className="space-y-3">
          {team2Players.map((player) => renderPlayerCard(player, team2Brand))}
        </div>
      </div>
    </div>
  );
}