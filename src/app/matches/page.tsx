'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getMatches, Match } from '@/services/dataService';
import Link from 'next/link';
import { 
  Trophy, 
  ArrowLeft, 
  Zap, 
  MapPin, 
  Calendar,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      const data = await getMatches();
      // Filter out mock matches if we have actual live synced matches
      const hasRealMatches = data.some(m => !['1', '2', '3'].includes(m.id));
      if (hasRealMatches) {
        setMatches(data.filter(m => !['1', '2', '3'].includes(m.id)));
      } else {
        setMatches(data);
      }
      setLoading(false);
    };
    fetchMatches();
  }, []);

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
    
    // Simple hash for unknown teams
    let hash = 0;
    for (let i = 0; i < team.length; i++) {
        hash = team.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white font-sans overflow-x-hidden pb-32">
      {/* Dynamic Background */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-blue-600/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full" />
      </div>

      <nav className="container mx-auto px-6 py-10 flex items-center justify-between">
        <Link href="/dashboard" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all group active:scale-90">
          <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center rotate-3 border-2 border-white/20">
            <Trophy className="text-white w-6 h-6" />
          </div>
          <span className="font-display font-black text-2xl uppercase tracking-tighter italic">Arena</span>
        </div>
        <div className="w-12 h-12 hidden md:block" />
      </nav>

      <main className="container mx-auto px-6 pt-10">
        <div className="max-w-4xl mx-auto mb-20 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-[10px] uppercase tracking-widest font-black">
            <Zap size={12} className="fill-current animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            Live Stadium Entry
          </div>
          <h1 className="text-7xl font-display font-black uppercase tracking-tighter italic leading-[0.8]">
            Upcoming <br />
            <span className="text-blue-500">Battlegrounds</span>
          </h1>
          <p className="text-xl text-gray-400 font-medium max-w-xl">
            Select a match to start your draft. Pick a match and build your 3-player squad. Choose one MVP to lead your lineup.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
  <div className="grid gap-4">
    <AnimatePresence mode="popLayout">
      {matches.map((match, idx) => (
        <motion.div
          key={match.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.04 }}
        >
          <Link
            href={`/matches/${match.id}`}
            className="group block rounded-3xl bg-white/[0.03] border border-white/10 hover:border-blue-500/30 hover:bg-white/[0.05] transition-all overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4">
              {/* Teams */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Team 1 */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black shadow-lg shrink-0"
                    style={{
                      backgroundColor: getTeamColor(match.team1),
                      color: '#fff',
                    }}
                  >
                    {match.team1[0]}
                  </div>

                  <span className="font-black text-base md:text-lg truncate">
                    {match.team1}
                  </span>
                </div>

                {/* VS */}
                <div className="text-xs font-black text-gray-500 shrink-0 px-1">
                  VS
                </div>

                {/* Team 2 */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black shadow-lg shrink-0"
                    style={{
                      backgroundColor: getTeamColor(match.team2),
                      color: '#fff',
                    }}
                  >
                    {match.team2[0]}
                  </div>

                  <span className="font-black text-base md:text-lg truncate">
                    {match.team2}
                  </span>
                </div>
              </div>

              {/* Match Info */}
              <div className="hidden md:flex items-center gap-5 text-xs text-gray-400 font-medium shrink-0">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-blue-500" />
                  {new Date(match.date).toLocaleDateString(
                    'en-US',
                    {
                      day: 'numeric',
                      month: 'short',
                    }
                  )}
                </div>

                <div className="flex items-center gap-2 max-w-[180px] truncate">
                  <MapPin size={14} className="text-blue-500 shrink-0" />
                  <span className="truncate">
                    {match.venue}
                  </span>
                </div>

                <ChevronRight
                  size={18}
                  className="text-gray-500 group-hover:translate-x-1 transition-transform"
                />
              </div>
            </div>

            {/* Mobile Info Row */}
            <div className="md:hidden border-t border-white/5 px-5 py-2 flex items-center justify-between text-[11px] text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                {new Date(match.date).toLocaleDateString(
                  'en-US',
                  {
                    day: 'numeric',
                    month: 'short',
                  }
                )}
              </div>

              <div className="flex items-center gap-1 truncate ml-3">
                <MapPin size={12} />
                <span className="truncate">
                  {match.venue}
                </span>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
</div>
      </main>
    </div>
  );
}
