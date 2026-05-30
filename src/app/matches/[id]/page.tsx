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

const TEAM_BRANDS: Record<string, { imageId: string; textClass: string; bgClass: string; borderClass: string }> = {
  MI: { imageId: 'mi', textClass: 'text-blue-400', bgClass: 'bg-blue-500/10', borderClass: 'border-blue-500/30' },
  CSK: { imageId: 'csk', textClass: 'text-amber-400', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-500/30' },
  RCB: { imageId: 'rcb', textClass: 'text-red-400', bgClass: 'bg-red-500/10', borderClass: 'border-red-500/30' },
  SRH: { imageId: 'srh', textClass: 'text-orange-400', bgClass: 'bg-orange-500/10', borderClass: 'border-orange-500/30' },
  DC: { imageId: 'dc', textClass: 'text-blue-400', bgClass: 'bg-blue-500/10', borderClass: 'border-blue-500/30' },
  KKR: { imageId: 'kkr', textClass: 'text-purple-400', bgClass: 'bg-purple-500/10', borderClass: 'border-purple-500/30' },
  PBKS: { imageId: 'pbks', textClass: 'text-red-400', bgClass: 'bg-red-500/10', borderClass: 'border-red-500/30' },
  RR: { imageId: 'rr', textClass: 'text-pink-400', bgClass: 'bg-pink-500/10', borderClass: 'border-pink-500/30' },
  LSG: { imageId: 'lsg', textClass: 'text-cyan-400', bgClass: 'bg-cyan-500/10', borderClass: 'border-cyan-500/30' },
  GT: { imageId: 'gt', textClass: 'text-yellow-500', bgClass: 'bg-yellow-500/10', borderClass: 'border-yellow-500/30' },
};

function getTeamBrand(teamShortName: string) {
  return TEAM_BRANDS[teamShortName.toUpperCase()] || { 
    imageId: '152655', 
    textClass: 'text-blue-400', 
    bgClass: 'bg-blue-500/10', 
    borderClass: 'border-blue-500/30' 
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
        createdAt: Date.now()
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
      
      {/* HEADER HERO AREA */}
      <div className="container mx-auto px-4 pt-8 pb-4 max-w-7xl">
        <div className="flex items-center justify-between gap-4 relative">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="font-display font-black text-xl uppercase italic tracking-tighter leading-none">
                <span className={team1Brand.textClass}>{match.team1}</span> <span className="text-gray-600">vs</span> <span className={team2Brand.textClass}>{match.team2}</span>
              </h2>
              <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-0.5">Trio Selection Arena</p>
            </div>
          </div>

          {uiFeedback && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="absolute left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl text-xs text-red-400 font-semibold shadow-lg shadow-black/20 z-30"
            >
              {uiFeedback.message}
            </motion.div>
          )}

          <div className="text-right">
            <span className="text-xs font-mono font-black text-gray-500 uppercase tracking-widest">Draft Progress</span>
            <p className="text-sm font-display font-black text-blue-400 italic">{selectedPlayers.length} / 3 Picked</p>
          </div>
        </div>

        {/* Selected Draft Multi-Row Slots Wrapper */}
        <SelectedSlots 
          selectedPlayers={selectedPlayers}
          mvpId={mvpId}
          onRemove={removePlayer}
          onSetMvp={setMvpId}
          getTeamBrand={getTeamBrand}
        />
      </div>

      {/* LOWER PLAYGROUND ROSTER GRIDS */}
      <main className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="grid grid-cols-12 gap-8">
          
          <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team 1 Column */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#0a0a0b]/80 border border-white/5 flex items-center justify-between sticky top-[10px] z-20 backdrop-blur-sm">
                <h3 className={cn("font-display font-black text-lg uppercase tracking-tight italic", team1Brand.textClass)}>
                  {match.team1} Pool
                </h3>
                <span className="text-[10px] font-mono font-black opacity-40">{team1Players.length} Available</span>
              </div>
              <div className="space-y-3">
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

            {/* Team 2 Column */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#0a0a0b]/80 border border-white/5 flex items-center justify-between sticky top-[10px] z-20 backdrop-blur-sm">
                <h3 className={cn("font-display font-black text-lg uppercase tracking-tight italic", team2Brand.textClass)}>
                  {match.team2} Pool
                </h3>
                <span className="text-[10px] font-mono font-black opacity-40">{team2Players.length} Available</span>
              </div>
              <div className="space-y-3">
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

          {/* Right Action Lock Bar */}
          <div className="col-span-12 lg:col-span-4">
            <SubmissionControl 
              canSubmit={canSubmit}
              statusMessage={statusMessage}
              saving={saving}
              selectedPlayers={selectedPlayers}
              mvpId={mvpId}
              onSave={handleSave}
            />
          </div>

        </div>
      </main>
    </div>
  );
}