'use client';

import { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getMatchById, getPlayersByTeams, Match, Player, saveUserSquad } from '@/services/dataService';
import { useRouter } from 'next/navigation';
import { 
  Trophy, 
  ArrowLeft, 
  Plus, 
  Check, 
  Users, 
  ShieldAlert,
  Zap,
  DollarSign,
  ChevronRight,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const SALARY_CAP = 100;
const TEAM_SIZE = 11;

export default function SquadDraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [match, setMatch] = useState<Match | null>(null);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [mvpId, setMvpId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('All');
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const matchData = await getMatchById(id);
      if (matchData) {
        setMatch(matchData);
        const players = await getPlayersByTeams(matchData.team1, matchData.team2);
        setAvailablePlayers(players);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const togglePlayer = (player: Player) => {
    if (selectedPlayers.find(p => p.id === player.id)) {
      setSelectedPlayers(selectedPlayers.filter(p => p.id !== player.id));
      if (mvpId === player.id) setMvpId(null);
    } else {
      if (selectedPlayers.length < TEAM_SIZE) {
        const totalCost = selectedPlayers.reduce((sum, p) => sum + p.price, 0) + player.price;
        if (totalCost <= SALARY_CAP) {
          setSelectedPlayers([...selectedPlayers, player]);
        } else {
          alert('Salary cap exceeded!');
        }
      }
    }
  };

  const currentSalary = selectedPlayers.reduce((sum, p) => sum + p.price, 0);
  const remainingSalary = SALARY_CAP - currentSalary;

  const handleSave = async () => {
    if (selectedPlayers.length !== TEAM_SIZE) return;
    if (!mvpId) return;
    
    setSaving(true);
    try {
      await saveUserSquad({
        matchId: id,
        userId: '', // Set by dataService
        players: selectedPlayers.map(p => p.id),
        mvpId: mvpId,
        createdAt: Date.now()
      });
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      alert('Failed to save squad');
    } finally {
      setSaving(false);
    }
  };

  const getTeamColor = (team: string) => {
    const colors: Record<string, string> = {
      CSK: '#fdb913',
      RCB: '#d11d26',
      MI: '#004ba0',
      KKR: '#3a225d',
      GT: '#1b2133',
      RR: '#ea1a85',
      SRH: '#f26522',
      LSG: '#1c1c1c',
      DC: '#000080',
      PBKS: '#ed1b24',
      IND: '#004ba0',
      AUS: '#ffcd00',
      ENG: '#ce1126',
      PAK: '#01411c',
      SA: '#007a4d',
      NZ: '#000000',
      SL: '#000080',
      AFG: '#0052ff',
      BAN: '#006a4e',
      WI: '#7b0041',
    };
    
    if (colors[team]) return colors[team];
    let hash = 0;
    for (let i = 0; i < team.length; i++) {
        hash = team.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  };

  if (loading || !match) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredPlayers = filter === 'All' 
    ? availablePlayers 
    : availablePlayers.filter(p => {
        const role = p.role.toLowerCase();
        const f = filter.toLowerCase();
        if (f === 'batsman') return role.includes('bat') || role.includes('wk');
        if (f === 'bowler') return role.includes('bowl');
        if (f === 'all-rounder') return role.includes('all');
        if (f === 'wicketkeeper') return role.includes('wk') || role.includes('keeper');
        return role.includes(f);
    });

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white font-sans overflow-x-hidden">
      <div className="fixed top-0 left-0 w-full h-[40vh] bg-gradient-to-b from-blue-600/20 to-transparent pointer-events-none -z-10" />

      <nav className="container mx-auto px-6 py-8 flex items-center justify-between">
        <button onClick={() => router.back()} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all group">
          <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <div className="flex flex-col items-center">
           <h2 className="font-display font-black text-2xl uppercase italic tracking-tighter leading-none">
             {match.team1} <span className="text-blue-500">vs</span> {match.team2}
           </h2>
           <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Arena Draft Mode</span>
        </div>
        <div className="flex items-center gap-4">
           <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Rem. Salary</span>
              <span className="text-xl font-display font-black text-blue-500 italic">${remainingSalary.toFixed(1)}</span>
           </div>
           <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center rotate-3 border-2 border-white/20">
             <Trophy size={20} />
           </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-12 gap-10">
          {/* Player Selection */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex gap-2 bg-white/2 p-2 rounded-[24px] border border-white/5 overflow-x-auto no-scrollbar">
                {['All', 'Batsman', 'Bowler', 'All-rounder', 'Wicketkeeper'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "px-6 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                      filter === f ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-white/5"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="flex gap-4">
                <div className="px-6 py-3 rounded-[24px] bg-white/2 border border-white/5 flex items-center gap-3">
                  <Users size={16} className="text-blue-500" />
                  <span className="font-display font-black text-lg italic">{selectedPlayers.length} / {TEAM_SIZE}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredPlayers.map((player) => {
                  const isSelected = selectedPlayers.find(p => p.id === player.id);
                  return (
                    <motion.button
                      layout
                      key={player.id}
                      onClick={() => togglePlayer(player)}
                      className={cn(
                        "group relative flex items-center gap-4 p-4 rounded-[28px] border transition-all text-left",
                        isSelected 
                          ? "bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/20" 
                          : "bg-white/2 border-white/5 hover:bg-white/5"
                      )}
                    >
                      <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/10 overflow-hidden relative flex-shrink-0">
                         {player.image ? (
                           <Image src={player.image} alt={player.name} fill className="object-cover" referrerPolicy="no-referrer" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center font-display font-black text-xl opacity-20">{player.name[0]}</div>
                         )}
                         <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-[8px] font-black" style={{ color: getTeamColor(player.team) }}>
                           {player.team[0]}
                         </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                         <h4 className="font-display font-black text-lg uppercase tracking-tight italic truncate">{player.name}</h4>
                         <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{player.role}</p>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="font-display font-black text-lg italic text-blue-400 group-hover:text-white transition-colors">${player.price.toFixed(1)}</span>
                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                            <Check size={14} className="text-blue-600" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-all">
                            <Plus size={14} className="text-gray-500 group-hover:text-blue-500" />
                          </div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Squad Summary / MVP Selection */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
             <div className={cn(
               "p-10 rounded-[48px] border transition-all sticky top-10",
               selectedPlayers.length === TEAM_SIZE ? "bg-emerald-600 border-emerald-500" : "bg-white/2 border-white/5"
             )}>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-black text-3xl uppercase tracking-tight italic">Draft Status</h3>
                    {selectedPlayers.length === TEAM_SIZE && <Zap className="text-white fill-current" />}
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-white/10 pb-4">
                       <span className="font-mono text-[9px] font-black text-white/50 uppercase tracking-[0.2em]">Capacity</span>
                       <span className="font-display font-black text-2xl italic">{selectedPlayers.length} / {TEAM_SIZE}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/10 pb-4">
                       <span className="font-mono text-[9px] font-black text-white/50 uppercase tracking-[0.2em]">Salary Cost</span>
                       <span className="font-display font-black text-2xl italic">${currentSalary.toFixed(1)}</span>
                    </div>
                  </div>

                  {selectedPlayers.length === TEAM_SIZE && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6 pt-4"
                    >
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/60 uppercase tracking-widest flex items-center gap-2">
                          <Trophy size={12} className="text-yellow-400" />
                          Appoint Arena Captain (2x Points)
                        </label>
                        <select 
                          value={mvpId || ''} 
                          onChange={(e) => setMvpId(e.target.value)}
                          className="w-full bg-black/40 border border-white/20 rounded-[20px] px-6 py-4 font-display font-black uppercase text-sm italic outline-none focus:border-white transition-all appearance-none cursor-pointer"
                        >
                          <option value="" disabled>Select MVP</option>
                          {selectedPlayers.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <button 
                        onClick={handleSave}
                        disabled={saving || !mvpId}
                        className="w-full bg-white text-black py-6 rounded-[28px] font-display font-black text-lg uppercase tracking-tight transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
                      >
                        {saving ? (
                          <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            Finalize Squad
                            <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    </motion.div>
                  )}

                  {selectedPlayers.length < TEAM_SIZE && (
                    <div className="pt-6 flex items-start gap-3 opacity-50 px-2">
                      <ShieldAlert size={20} className="flex-shrink-0" />
                      <p className="text-[11px] font-medium leading-relaxed italic">
                        Select {TEAM_SIZE - selectedPlayers.length} more players to finalize your squad for this match.
                      </p>
                    </div>
                  )}
                </div>
             </div>

             {/* Tips Section */}
             <div className="p-10 rounded-[48px] bg-white/2 border border-white/5 space-y-6">
                <h4 className="font-display font-black text-xl uppercase tracking-tight italic flex items-center gap-2">
                  <Info size={16} className="text-blue-500" />
                  Arena Tips
                </h4>
                <div className="space-y-4 text-xs font-medium text-gray-500 leading-relaxed">
                  <p>• Pick a balance of players from both teams to hedge your points.</p>
                  <p>• Pitch conditions in <span className="text-white font-bold">{match.venue}</span> generally favor {match.venue.length % 2 === 0 ? 'seamers' : 'spinners'}.</p>
                  <p>• Your Captain (MVP) earns double points. Choose wisely!</p>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
