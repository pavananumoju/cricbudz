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
import { getUserSquads, UserSquad } from '@/services/dataService';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [squads, setSquads] = useState<UserSquad[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const router = useRouter();

  const isAdmin = user?.email === 'pavananumoju@gmail.com';

  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus('Traversing Stadiums...');
    try {
      const res = await fetch('/api/sync');
      let data;
      try {
        data = await res.json();
      } catch (e) {
        data = { error: 'Invalid response from server' };
      }

      if (res.ok && data.success) {
        setSyncStatus(`Successfully synced ${data.matchesSynced?.length || 0} fixtures!`);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const errorMsg = data.message || data.error || `Server returned ${res.status}`;
        setSyncStatus('Sync error: ' + errorMsg);
        setTimeout(() => setSyncStatus(null), 6000);
      }
    } catch (error) {
      console.error(error);
      setSyncStatus('Network Error. Is your server running?');
      setTimeout(() => setSyncStatus(null), 4000);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!u) router.push('/');
      setUser(u);
    });

    const fetchSquads = async () => {
      const data = await getUserSquads();
      setSquads(data);
      setLoading(false);
    };

    fetchSquads();
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white font-sans selection:bg-blue-500 overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Sidebar Desktop */}
      <div className="fixed left-0 top-0 bottom-0 w-24 border-r border-white/5 bg-black/40 backdrop-blur-xl z-50 flex flex-col items-center py-10 gap-10">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center rotate-3">
          <Trophy className="text-white w-6 h-6" />
        </div>
        
        <div className="flex flex-col gap-6">
          <Link href="/dashboard" className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 transition-all">
            <LayoutDashboard className="w-5 h-5" />
          </Link>
          <Link href="/matches" className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
            <Zap className="w-5 h-5 text-gray-500 hover:text-white" />
          </Link>
          <Link href="#" className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
            <Users className="w-5 h-5 text-gray-500 hover:text-white" />
          </Link>
        </div>

        <div className="mt-auto">
          <button onClick={() => auth.signOut()} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-red-500/20 group transition-all">
             <Settings className="w-5 h-5 text-gray-500 group-hover:text-red-500" />
          </button>
        </div>
      </div>

      <main className="ml-24 p-10 max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-end mb-16">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-[10px] uppercase tracking-widest font-black">
              <Zap size={12} className="fill-current" />
              Stadium Connection Active
            </div>
            <h1 className="text-6xl font-display font-black uppercase tracking-tighter italic leading-none">
              Welcome Back, <br />
              <span className="text-blue-500">{user?.displayName?.split(' ')[0]}</span>
            </h1>
          </div>
          
          <div className="bg-white/2 border border-white/5 rounded-[32px] p-2 flex gap-2">
            <div className="px-6 py-4 rounded-[24px] bg-black/40 border border-white/5 flex flex-col items-center">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Rank</span>
              <span className="text-2xl font-display font-black italic">--</span>
            </div>
            <div className="px-6 py-4 rounded-[24px] bg-blue-600 flex flex-col items-center shadow-lg shadow-blue-500/20">
              <span className="text-[10px] font-black text-white/60 uppercase tracking-widest leading-none mb-1">Credits</span>
              <span className="text-2xl font-display font-black italic">100</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-10">
          {/* Active Campaigns */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-black text-3xl uppercase tracking-tight italic">Your Active Drafts</h2>
              <Link href="/matches" className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                View Matches <ChevronRight size={14} />
              </Link>
            </div>

            {squads.length === 0 ? (
              <div className="aspect-[21/9] rounded-[48px] bg-white/2 border border-white/5 border-dashed flex flex-col items-center justify-center p-12 text-center group">
                <PlusCircle className="w-16 h-16 text-gray-700 mb-6 group-hover:text-blue-500 transition-colors" />
                <h3 className="font-display font-black text-2xl uppercase tracking-tight italic mb-2">No Active Squads</h3>
                <p className="text-gray-500 max-w-sm mb-8">You haven&apos;t participated in any arena matches yet. Start by entering a stadium.</p>
                <Link href="/matches" className="bg-white text-black px-8 py-4 rounded-full font-display font-black text-sm uppercase tracking-tight active:scale-95 transition-all">
                  Join Match
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {squads.map((squad, i) => (
                   <div key={i} className="p-8 rounded-[40px] bg-white/2 border border-white/5 hover:bg-white/5 transition-all group relative overflow-hidden">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                          <Users className="text-blue-500" />
                        </div>
                        <span className="font-mono text-[10px] text-gray-500 uppercase font-black">Draft ID: {squad.matchId}</span>
                      </div>
                      <h3 className="font-display font-black text-2xl uppercase tracking-tighter italic mb-4">Ultimate XI</h3>
                      <div className="flex items-center gap-4 text-xs font-black uppercase text-gray-400">
                        <span className="flex items-center gap-2"><Clock size={14} className="text-blue-500" /> 2d Remaining</span>
                        <span className="flex items-center gap-2 underline text-blue-500 decoration-2 underline-offset-4 cursor-pointer hover:text-white transition-colors">Edit Squad</span>
                      </div>
                   </div>
                 ))}
              </div>
            )}

            {/* Quick Actions */}
            <div className="pt-12 space-y-6">
                <h2 className="font-display font-black text-3xl uppercase tracking-tight italic">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/matches" className="w-full flex items-center justify-between p-6 rounded-[28px] bg-white/2 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-left group">
                  <div className="flex items-center gap-4">
                    <PlusCircle className="w-6 h-6 text-blue-500" />
                    <div className="flex flex-col">
                      <span className="font-display font-black text-lg uppercase tracking-tight">Enter Live Stadium</span>
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mt-1">Join upcoming matches</span>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </Link>

                {isAdmin && (
                  <button 
                    onClick={handleSync}
                    disabled={syncing}
                    className="w-full flex items-center justify-between p-6 rounded-[28px] bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 hover:border-blue-500/40 transition-all text-left group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-4">
                      <Zap className={cn("w-6 h-6 text-blue-500", syncing && "animate-pulse")} />
                      <div className="flex flex-col">
                        <span className="font-display font-black text-lg uppercase tracking-tight">
                          {syncing ? 'REFINING ARENA...' : 'REFRESH LIVE ARENA'}
                        </span>
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mt-1">
                          {syncStatus || 'Admin Power'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-blue-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </button>
                )}

                <button className="w-full flex items-center justify-between p-6 rounded-[28px] bg-white/2 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-left group">
                  <div className="flex items-center gap-4">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    <div className="flex flex-col">
                      <span className="font-display font-black text-lg uppercase tracking-tight">Top Strategists</span>
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mt-1">View worldwide rankings</span>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
                </div>
            </div>
          </div>

          {/* Stats / Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
             <div className="p-10 rounded-[48px] bg-blue-600 relative overflow-hidden group shadow-2xl shadow-blue-500/20">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <Trophy size={120} />
                </div>
                <div className="relative z-10 space-y-6">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <Zap className="text-white w-6 h-6" />
                  </div>
                  <h3 className="font-display font-black text-4xl uppercase tracking-tighter italic leading-none">The Path to <br /> Glory</h3>
                  <p className="text-white/70 text-sm font-medium leading-relaxed">Win 5 matches this season to unlock the <span className="text-white font-black underline underline-offset-4 decoration-2">Titan Badge</span> and entry to the Masters League.</p>
                  <button className="w-full bg-black py-4 rounded-full font-display font-black text-xs uppercase tracking-widest hover:scale-95 transition-all">View Mission</button>
                </div>
             </div>

             <div className="p-10 rounded-[48px] bg-white/2 border border-white/5 space-y-8">
                <h3 className="font-display font-black text-2xl uppercase tracking-tight italic">Arena Stats</h3>
                <div className="space-y-6">
                  {[
                    { label: "Matches Played", val: "0" },
                    { label: "Win Rate", val: "0%" },
                    { label: "Draft Score", val: "0" }
                  ].map((stat, i) => (
                    <div key={i} className="flex justify-between items-end border-b border-white/5 pb-4">
                        <span className="font-mono text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{stat.label}</span>
                        <span className="font-display font-black text-2xl uppercase tracking-tight italic">{stat.val}</span>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}