'use client';

import { ArrowLeft, User, Zap, X } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Player } from '@/types';
import { cn } from '@/lib/utils';

interface StickyHeaderProps {
  team1: string;
  team2: string;
  team1Brand: any;
  team2Brand: any;
  selectedPlayers: Player[];
  mvpId: string | null;
  uiFeedback: { type: 'error' | 'info'; message: string } | null;
  onBack: () => void;
  onRemovePlayer: (id: string) => void;
  onSetMvp: (id: string) => void;
  getTeamBrand: (team: string) => any;
}

export default function StickySelectionHeader({
  team1,
  team2,
  team1Brand,
  team2Brand,
  selectedPlayers,
  mvpId,
  uiFeedback,
  onBack,
  onRemovePlayer,
  onSetMvp,
  getTeamBrand
}: StickyHeaderProps) {
  return (
    <div className="sticky top-0 z-50 bg-[#0a0a0b]/95 backdrop-blur-md border-b border-white/5 shadow-2xl shadow-black/60">
      <div className="container mx-auto px-4 py-5 max-w-7xl">
        
        <div className="flex items-center justify-between gap-4 mb-4 relative">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="font-display font-black text-xl uppercase italic tracking-tighter leading-none">
                <span className={team1Brand.textClass}>{team1}</span> <span className="text-gray-600">vs</span> <span className={team2Brand.textClass}>{team2}</span>
              </h2>
              <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-0.5">Trio Selection Arena</p>
            </div>
          </div>

          {uiFeedback && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="absolute left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl text-xs text-red-400 font-semibold shadow-lg shadow-black/20"
            >
              {uiFeedback.message}
            </motion.div>
          )}

          <div className="text-right hidden sm:block">
            <span className="text-xs font-mono font-black text-gray-500 uppercase tracking-widest">Draft Progress</span>
            <p className="text-sm font-display font-black text-blue-400 italic">{selectedPlayers.length} / 3 Picked</p>
          </div>
        </div>

        <div className="flex justify-center w-full">
          <div className="w-full max-w-2xl flex flex-col gap-2.5">
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
                            "w-10 h-10 rounded-xl bg-black/40 border relative overflow-hidden flex-shrink-0 flex items-center justify-center p-1",
                            playerBrand.borderClass
                          )}>
                            <Image 
                              src={player.imageId && String(player.imageId).trim() !== "" ? `https://www.cricbuzz.com/a/img/v1/152x152/i1/${String(player.imageId).trim()}/player-profile.jpg` : `https://www.cricbuzz.com/a/img/v1/100x100/i1/${playerBrand.imageId}.webp`
                                } 
                              alt="" fill sizes="40px" className="object-contain p-0.5 rounded-lg" unoptimized 
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between min-w-0 w-full gap-6 pr-4">
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
                          title="Designate as MVP"
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
                          onClick={() => onRemovePlayer(player.id)}
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
        </div>

      </div>
    </div>
  );
}