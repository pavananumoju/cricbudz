'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { getMatchById, getPlayersByTeams, saveUserSquad } from '@/services/dataService';
import { Player, Match } from '@/types';
import { cn } from '@/lib/utils';

// Component Imports
import PlayerCard from './_components/PlayerCard';
import SelectedSlots from './_components/SelectedSlots';
import SubmissionControl from './_components/SubmissionControl';

const SQUAD_TARGET_SIZE = 3;

const TEAM_BRANDS: Record<string, { imageId: string; textClass: string; bgClass: string; borderClass: string; accentColor: string }> = {
  MI: { imageId: 'mi', textClass: 'text-blue-400', bgClass: 'bg-blue-500/10', borderClass: 'border-blue-500/30', accentColor: '#004ba0' },
  CSK: { imageId: 'csk', textClass: 'text-yellow-400', bgClass: 'bg-yellow-500/10', borderClass: 'border-yellow-500/30', accentColor: '#fdb913' },
  RCB: { imageId: 'rcb', textClass: 'text-red-500', bgClass: 'bg-red-500/10', borderClass: 'border-red-500/30', accentColor: '#d11d26' },
  SRH: { imageId: 'srh', textClass: 'text-orange-500', bgClass: 'bg-orange-500/10', borderClass: 'border-orange-500/30', accentColor: '#f26522' },
  DC: { imageId: 'dc', textClass: 'text-blue-600', bgClass: 'bg-blue-600/10', borderClass: 'border-blue-600/30', accentColor: '#000080' },
  KKR: { imageId: 'kkr', textClass: 'text-purple-400', bgClass: 'bg-purple-500/10', borderClass: 'border-purple-500/30', accentColor: '#3a225d' },
  PBKS: { imageId: 'pbks', textClass: 'text-rose-400', bgClass: 'bg-rose-500/10', borderClass: 'border-rose-500/30', accentColor: '#ed1b24' },
  RR: { imageId: 'rr', textClass: 'text-pink-400', bgClass: 'bg-pink-500/10', borderClass: 'border-pink-500/30', accentColor: '#ea1a85' },
  LSG: { imageId: 'lsg', textClass: 'text-cyan-400', bgClass: 'bg-cyan-500/10', borderClass: 'border-cyan-500/30', accentColor: '#1c1c1c' },
  GT: { imageId: 'gt', textClass: 'text-slate-200', bgClass: 'bg-slate-500/10', borderClass: 'border-slate-500/30', accentColor: '#1b2133' },
};

function getTeamBrand(teamShortName: string) {
  return TEAM_BRANDS[teamShortName.toUpperCase()] || { 
    imageId: '152655', 
    textClass: 'text-blue-400', 
    bgClass: 'bg-blue-500/10', 
    borderClass: 'border-blue-500/30',
    accentColor: '#3b82f6'
  };
}

export default function SquadDraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [match, setMatch] = useState<Match | null>(null);
  const [team1Players, setTeam1Players] = useState<Player[]>([]);
  const [team2Players, setTeam2Players] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [mvpId, setMvpId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recommending, setRecommending] = useState(false);
  const [uiFeedback, setUiFeedback] = useState<{ type: 'error' | 'info'; message: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const matchData = await getMatchById(id);
      if (matchData) {
        setMatch(matchData);
        const players = await getPlayersByTeams(matchData.team1, matchData.team2);
        setTeam1Players(players.filter(p => p.team.toUpperCase() === matchData.team1.toUpperCase()));
        setTeam2Players(players.filter(p => p.team.toUpperCase() === matchData.team2.toUpperCase()));
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const getAiRecommendation = async () => {
    setRecommending(true);
    setUiFeedback(null);
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          players: [...team1Players, ...team2Players],
          matchInfo: `${match?.team1} vs ${match?.team2}`
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Apply recommendation
      const allPlayers = [...team1Players, ...team2Players];
      const recommended = allPlayers.filter(p => data.selectedPlayerIds.includes(p.id));
      setSelectedPlayers(recommended);
      setMvpId(data.mvpId);
      setUiFeedback({ type: 'info', message: `AI Suggested: ${data.reasoning}` });
    } catch (error: any) {
      console.error(error);
      setUiFeedback({ type: 'error', message: error.message || 'AI Recommendation failed.' });
    } finally {
      setRecommending(false);
    }
  };

  const selectPlayer = (player: Player) => {
    setUiFeedback(null);
    if (selectedPlayers.find(p => p.id === player.id)) {
      removePlayer(player.id);
      return;
    }
    if (selectedPlayers.length >= SQUAD_TARGET_SIZE) {
      setUiFeedback({ type: 'error', message: 'Trio slots are full. Remove a player first.' });
      return;
    }
    if (selectedPlayers.length === SQUAD_TARGET_SIZE - 1) {
      const currentTeams = selectedPlayers.map(p => p.team.toUpperCase());
      if (currentTeams[0] === currentTeams[1] && currentTeams[0] === player.team.toUpperCase()) {
        setUiFeedback({ 
          type: 'error', 
          message: `Selection Blocked! You must add a player from ${player.team.toUpperCase() === match?.team1.toUpperCase() ? match?.team2 : match?.team1} to meet the dual-franchise rule.` 
        });
        return;
      }
    }
    setSelectedPlayers([...selectedPlayers, player]);
  };

  const removePlayer = (id: string) => {
    setSelectedPlayers(selectedPlayers.filter(p => p.id !== id));
    if (mvpId === id) setMvpId(null);
    setUiFeedback(null);
  };

  const checkStatusDetails = (): { canSubmit: boolean; message: string } => {
    if (selectedPlayers.length < SQUAD_TARGET_SIZE) {
      return { canSubmit: false, message: `Add ${SQUAD_TARGET_SIZE - selectedPlayers.length} more player(s) to complete your trio.` };
    }
    if (new Set(selectedPlayers.map(p => p.team.toUpperCase())).size < 2) {
      return { canSubmit: false, message: 'Invalid selection rule. Your trio must include at least 1 player from each franchise.' };
    }
    if (!mvpId) {
      return { canSubmit: false, message: 'Nominate your Trio MVP by highlighting the lightning bolt icon on your selections.' };
    }
    return { canSubmit: true, message: 'Your Trio Draft looks solid! Ready to deploy to the live tracking boards.' };
  };

  const handleSave = async () => {
    const status = checkStatusDetails();
    if (!status.canSubmit) return;
    setSaving(true);
    try {
      await saveUserSquad({
        matchId: id,
        players: selectedPlayers.map(p => p.id),
        mvpId: mvpId!,
      });
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      setUiFeedback({ type: 'error', message: 'Network write timeout: Failed to lock choices into Firestore.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !match) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { canSubmit, message: statusMessage } = checkStatusDetails();
  const team1Brand = getTeamBrand(match.team1);
  const team2Brand = getTeamBrand(match.team2);

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white font-sans pb-16 selection:bg-blue-500/30">
      
      {/* STICKY HEADER - MUCH MORE COMPACT */}
      <div className="sticky top-0 z-40 bg-[#0a0a0b]/90 backdrop-blur-md border-b border-white/5 shadow-xl">
        <div className="container mx-auto px-4 py-3 max-w-7xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()} 
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all group"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
              </button>
              <div>
                <h2 className="font-display font-black text-xl uppercase italic tracking-tighter leading-none">
                  <span className={team1Brand.textClass}>{match.team1}</span> 
                  <span className="text-gray-600 px-2">VS</span> 
                  <span className={team2Brand.textClass}>{match.team2}</span>
                </h2>
                <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-0.5">Trio Selection Arena</p>
              </div>
            </div>

            {uiFeedback && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }} 
                className={cn(
                  "hidden md:block px-4 py-2 rounded-xl text-xs font-semibold shadow-lg backdrop-blur-md",
                  uiFeedback.type === 'error' ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                )}
              >
                {uiFeedback.message}
              </motion.div>
            )}

            <div className="text-right">
              <span className="text-[10px] font-mono font-black text-gray-500 uppercase tracking-widest leading-none">Picks</span>
              <p className="text-lg font-display font-black text-blue-400 italic leading-none mt-1">{selectedPlayers.length} / 3</p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* PLAYERS COLUMN - LEFT AND CENTER */}
          <div className="lg:col-span-8 order-2 lg:order-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Team 1 Pool */}
              <div className="space-y-4">
                <div 
                  style={{ 
                    borderLeft: `3px solid ${team1Brand.accentColor}`,
                    background: `linear-gradient(to right, ${team1Brand.accentColor}10, transparent)`
                  }}
                  className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between sticky top-[80px] z-20 backdrop-blur-xl"
                >
                  <h3 className={cn("font-display font-black text-xl uppercase tracking-tight italic", team1Brand.textClass)}>
                    {match.team1} Pool
                  </h3>
                  <span className="text-[11px] font-mono font-black opacity-40">{team1Players.length} Players</span>
                </div>
                <div className="space-y-2">
                  {team1Players.map((player) => (
                    <PlayerCard 
                      key={player.id}
                      player={player}
                      brand={team1Brand}
                      isSelected={!!selectedPlayers.find(p => p.id === player.id)}
                      onSelect={() => selectPlayer(player)}
                    />
                  ))}
                </div>
              </div>

              {/* Team 2 Pool */}
              <div className="space-y-4">
                <div 
                  style={{ 
                    borderLeft: `3px solid ${team2Brand.accentColor}`,
                    background: `linear-gradient(to right, ${team2Brand.accentColor}10, transparent)`
                  }}
                  className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between sticky top-[80px] z-20 backdrop-blur-xl"
                >
                  <h3 className={cn("font-display font-black text-xl uppercase tracking-tight italic", team2Brand.textClass)}>
                    {match.team2} Pool
                  </h3>
                  <span className="text-[11px] font-mono font-black opacity-40">{team2Players.length} Players</span>
                </div>
                <div className="space-y-2">
                  {team2Players.map((player) => (
                    <PlayerCard 
                      key={player.id}
                      player={player}
                      brand={team2Brand}
                      isSelected={!!selectedPlayers.find(p => p.id === player.id)}
                      onSelect={() => selectPlayer(player)}
                    />
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* STICKY SIDEBAR - RIGHT */}
          <div className="lg:col-span-4 order-1 lg:order-2">
            <div className="lg:sticky lg:top-[80px] space-y-4">
              
              {/* Entire Draft Management Card */}
              <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-sm">
                <div className="p-6">
                  <h3 className="font-display font-black text-sm uppercase tracking-widest italic text-gray-400 mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    Current Trio Draft
                  </h3>
                  
                  <div className="mb-6">
                    <SelectedSlots 
                      selectedPlayers={selectedPlayers}
                      mvpId={mvpId}
                      onRemove={removePlayer}
                      onSetMvp={setMvpId}
                      getTeamBrand={getTeamBrand}
                    />
                  </div>

                  <SubmissionControl 
                    canSubmit={canSubmit}
                    statusMessage={statusMessage}
                    saving={saving}
                    recommending={recommending}
                    selectedPlayers={selectedPlayers}
                    mvpId={mvpId}
                    onSave={handleSave}
                    onAiRecommend={getAiRecommendation}
                  />
                </div>
              </div>

              {/* Tips/Rules Card */}
              <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 hidden lg:block">
                <h4 className="text-[10px] font-mono font-black text-blue-400 uppercase tracking-widest mb-2">Draft Mastery Tip</h4>
                <p className="text-[11px] text-blue-200/60 leading-relaxed italic">
                  Nominate your Trio MVP wisely. That player earns 2x points for every performance metric. 
                  Balanced selections across both teams minimize risk.
                </p>
              </div>

              {/* Mobile Feedback */}
              {uiFeedback && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "md:hidden p-4 rounded-2xl text-xs font-bold text-center",
                    uiFeedback.type === 'error' ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  )}
                >
                  {uiFeedback.message}
                </motion.div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}