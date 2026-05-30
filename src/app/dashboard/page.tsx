'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import Link from 'next/link';
import { 
  Trophy, 
  Zap, 
  ChevronRight, 
  Users, 
  LayoutDashboard, 
  Settings,
  PlusCircle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getUserSquads, getMatches, getPlayers } from '@/services/dataService';
import { UserSquad, Match, Player } from '@/types';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [squads, setSquads] = useState<(UserSquad & { match?: Match })[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const router = useRouter();

  const isAdmin = user?.email === 'pavananumoju@gmail.com';

  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus('Refining Fixtures...');
    try {
      const res = await fetch('/api/sync');
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncStatus(`Updated ${data.matchesSynced?.length || 0} fixtures`);
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setSyncStatus('Sync error: ' + (data.message || 'Server error'));
        setTimeout(() => setSyncStatus(null), 4000);
      }
    } catch (error) {
      setSyncStatus('Network Error');
      setTimeout(() => setSyncStatus(null), 3000);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        router.push('/');
        return;
      }

      try {
        const [userSquads, allMatches, allPlayers] = await Promise.all([
          getUserSquads(),
          getMatches(),
          getPlayers()
        ]);
        
        setPlayers(allPlayers);

        // Filter out matches that are long past (e.g. > 1 day ago) for the main view
        const now = Date.now();
        const enrichedSquads = userSquads
          .map(s => ({
            ...s,
            match: allMatches.find(m => m.id === s.matchId)
          }))
          .sort((a, b) => {
            const dateA = a.match ? new Date(a.match.date).getTime() : 0;
            const dateB = b.match ? new Date(b.match.date).getTime() : 0;
            return dateA - dateB;
          });
        
        setSquads(enrichedSquads);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Find the next upcoming/active squad
  const now = Date.now();
  const activeSquad = squads.find(s => {
    if (!s.match) return false;
    const mDate = new Date(s.match.date).getTime();
    return mDate > now - (4 * 60 * 60 * 1000); // Show matches starting in the future or which started < 4h ago
  }) || squads[0];

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white font-sans selection:bg-blue-500 overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed top-0 right-0 w-[400px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Sidebar Desktop - Even slimmer */}
      <div className="fixed left-0 top-0 bottom-0 w-16 border-r border-white/5 bg-black/40 backdrop-blur-xl z-50 flex flex-col items-center py-6 gap-6">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center -rotate-3 mb-2 shadow-lg shadow-blue-500/20">
          <Trophy className="text-white w-4 h-4" />
        </div>
        
        <div className="flex flex-col gap-3">
          <Link href="/dashboard" className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 transition-all">
            <LayoutDashboard className="w-3.5 h-3.5" />
          </Link>
          <Link href="/matches" className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all group">
            <Zap className="w-3.5 h-3.5 text-gray-500 group-hover:text-white" />
          </Link>
          <Link href="/leaderboard" className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all group">
            <Users className="w-3.5 h-3.5 text-gray-500 group-hover:text-white" />
          </Link>
        </div>

        <div className="mt-auto">
          <button onClick={() => auth.signOut()} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-red-500/10 group transition-all">
             <Settings className="w-3.5 h-3.5 text-gray-500 group-hover:text-red-500" />
          </button>
        </div>
      </div>

      <main className="ml-16 p-6 lg:p-10 max-w-6xl mx-auto">
        {/* Header - More compact */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[8px] uppercase tracking-widest font-black">
              <Zap size={8} className="fill-current" />
              Live Feed Connected
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-black uppercase tracking-tighter italic leading-none">
              Welcome, <span className="text-blue-500">{user?.displayName?.split(' ')[0]}</span>
            </h1>
          </div>
          
          <div className="flex gap-2">
            <div className="px-4 py-2 rounded-xl bg-white/2 border border-white/5 flex flex-col items-center min-w-[70px]">
              <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Rank</span>
              <span className="text-lg font-display font-black italic">#1.4k</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-blue-600 flex flex-col items-center min-w-[70px] shadow-lg shadow-blue-500/10 border border-blue-400/20">
              <span className="text-[8px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">Credits</span>
              <span className="text-lg font-display font-black italic">1,250</span>
            </div>
          </div>
        </header>

        <div className="space-y-10">
          {/* Focused Squad Section */}
          <section className="space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-xl uppercase tracking-tighter italic">Primary Draft</h2>
                {squads.length > 1 && (
                  <span className="bg-white/5 text-gray-500 text-[8px] font-black px-1.5 py-0.5 rounded border border-white/5">+{squads.length - 1} Others</span>
                )}
              </div>
              <Link href="/matches" className="text-[9px] font-black text-gray-500 hover:text-blue-500 uppercase tracking-[0.2em] flex items-center gap-1.5 transition-all group">
                All Fixtures <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {!activeSquad ? (
              <div className="h-40 rounded-2xl bg-white/2 border border-white/5 border-dashed flex flex-col items-center justify-center text-center px-6">
                <PlusCircle className="w-8 h-8 text-gray-800 mb-2" />
                <h3 className="font-display font-black text-base uppercase italic text-gray-500 mb-1">Ready for Kickoff?</h3>
                <p className="text-[10px] text-gray-600 mb-3 max-w-xs leading-relaxed">No active trios found. Select an upcoming match to start drafting.</p>
                <Link href="/matches" className="bg-white text-black px-5 py-2 rounded-lg font-display font-black text-[10px] uppercase tracking-tight hover:bg-blue-500 hover:text-white transition-all">
                  Browse Matches
                </Link>
              </div>
            ) : (
              <div 
                onClick={() => router.push(`/matches/${activeSquad.matchId}`)}
                className="relative group cursor-pointer active:scale-[0.99] transition-transform"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-pink-500 rounded-[2rem] opacity-20 blur group-hover:opacity-30 transition-opacity" />
                <div className="relative p-7 rounded-[2rem] bg-black/60 border border-white/10 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="px-2 py-1 bg-blue-500/10 rounded-md border border-blue-500/20">
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Next Clash</span>
                      </div>
                      <span className="font-mono text-[9px] text-gray-600">ID: {activeSquad.matchId}</span>
                    </div>

                    <h3 className="font-display font-black text-4xl uppercase tracking-tighter italic leading-none mb-3">
                      {activeSquad.match ? (
                        <>
                          <span className={cn(
                            "transition-colors",
                            activeSquad.match.team1 === 'LSG' ? "text-cyan-400" : 
                            activeSquad.match.team1 === 'CSK' ? "text-yellow-400" :
                            activeSquad.match.team1 === 'MI' ? "text-blue-400" :
                            "text-blue-400"
                          )}>{activeSquad.match.team1}</span>
                          <span className="text-gray-800 px-3 opacity-50 select-none">VS</span>
                          <span className={cn(
                            "transition-colors",
                            activeSquad.match.team2 === 'MI' ? "text-blue-400" :
                            activeSquad.match.team2 === 'GT' ? "text-slate-200" :
                            activeSquad.match.team2 === 'SRH' ? "text-orange-500" :
                            "text-pink-400"
                          )}>{activeSquad.match.team2}</span>
                        </>
                      ) : 'Unknown Match'}
                    </h3>

                    <div className="flex items-center gap-4">
                      <div className="flex flex-wrap gap-2">
                         {activeSquad.players.map((pId, idx) => {
                           const player = players.find(p => p.id === pId);
                           const isMvp = activeSquad.mvpId === pId;
                           return (
                             <div key={idx} className={cn(
                               "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all",
                               isMvp ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-white/5 border-white/5 text-gray-400"
                             )}>
                               {isMvp && <Zap size={10} className="fill-current" />}
                               <span className="text-[10px] font-black uppercase tracking-tight">
                                 {player ? player.name.split(' ').pop() : `Player ${idx+1}`}
                               </span>
                             </div>
                           );
                         })}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 min-w-[120px]">
                    {(() => {
                      const mDate = activeSquad.match ? new Date(activeSquad.match.date).getTime() : 0;
                      const tLeft = mDate - Date.now();
                      const isLocked = tLeft < 30 * 60 * 1000;
                      
                      return (
                        <>
                          <div className={cn(
                            "px-4 py-2 rounded-xl flex items-center gap-2 border text-[10px] font-black uppercase tracking-widest italic",
                            isLocked ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          )}>
                            <Clock size={12} />
                            {isLocked ? 'LOCKED' : 'EDITABLE'}
                          </div>
                          
                          {!isLocked ? (
                            <Link 
                              href={`/matches/${activeSquad.matchId}`}
                              className="w-full bg-white text-black py-2.5 rounded-xl text-center font-display font-black text-[11px] uppercase tracking-tight hover:bg-blue-600 hover:text-white transition-all shadow-xl shadow-black/20"
                            >
                              Edit Squad
                            </Link>
                          ) : (
                            <p className="text-[9px] text-gray-500 text-right leading-tight max-w-[100px] italic">
                              Squad submitted. Tuning in for the toss...
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Arena Navigation - Compact Grid */}
          <section className="space-y-5">
            <h2 className="font-display font-black text-xl uppercase tracking-tighter italic border-b border-white/5 pb-3">
              Quick Links
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Link href="/matches" className="flex items-center gap-3 p-4 rounded-xl bg-white/2 border border-white/5 hover:bg-white/5 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <PlusCircle className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <span className="block font-display font-black text-xs uppercase">Fixtures</span>
                  <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest leading-none">Enter Stadium</span>
                </div>
              </Link>

              <Link href="/leaderboard" className="flex items-center gap-3 p-4 rounded-xl bg-white/2 border border-white/5 hover:bg-white/5 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <span className="block font-display font-black text-xs uppercase">Ranks</span>
                  <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest leading-none">Global Board</span>
                </div>
              </Link>

              {isAdmin && (
                <button 
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex items-center gap-3 p-4 rounded-xl bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Zap className={cn("w-4 h-4 text-blue-400", syncing && "animate-pulse")} />
                  </div>
                  <div className="overflow-hidden">
                    <span className="block font-display font-black text-xs uppercase">Sync API</span>
                    <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest leading-none block truncate">
                      {syncStatus || 'Admin'}
                    </span>
                  </div>
                </button>
              )}
            </div>
          </section>

          {/* Historical / Other Drafts - Simple List */}
          {squads.length > 1 && (
             <section className="space-y-4">
               <h2 className="font-display font-black text-sm uppercase tracking-widest text-gray-600 italic">Remaining Drafts</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {squads.filter(s => s.matchId !== activeSquad?.matchId).map((s, i) => (
                   <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Match {s.matchId}</span>
                        <span className="font-display font-black text-sm italic uppercase">
                          {s.match ? `${s.match.team1} vs ${s.match.team2}` : 'Unknown Match'}
                        </span>
                      </div>
                      <Link 
                        href={`/matches/${s.matchId}`}
                        className="text-[9px] font-black text-blue-500 hover:text-white uppercase tracking-widest px-3 py-1.5 rounded-md border border-blue-500/10 hover:bg-blue-500 transition-all"
                      >
                        View
                      </Link>
                   </div>
                 ))}
               </div>
             </section>
          )}
        </div>
      </main>
    </div>
  )
}