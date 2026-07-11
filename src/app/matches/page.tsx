'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getMatches } from '@/services/dataService';
import { Match } from '@/types';
import Link from 'next/link';
import { Trophy, Zap, MapPin, Calendar, ChevronRight, Lock, CheckCircle2 } from 'lucide-react';
import { cn, getTeamLogo, getMatchTimeStatus } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDev } from '@/context/DevContext';

const VENUES: Record<string, { city: string; stadium: string }> = {
  'Eden Gardens': { city: 'Kolkata', stadium: 'Eden Gardens' },
  'Wankhede Stadium': { city: 'Mumbai', stadium: 'Wankhede Stadium' },
  'M. Chinnaswamy Stadium': { city: 'Bengaluru', stadium: 'M. Chinnaswamy Stadium' },
  'MA Chidambaram Stadium': { city: 'Chennai', stadium: 'MA Chidambaram Stadium' },
  'Narendra Modi Stadium': { city: 'Ahmedabad', stadium: 'Narendra Modi Stadium' },
  'Arun Jaitley Stadium': { city: 'Delhi', stadium: 'Arun Jaitley Stadium' },
  'Rajiv Gandhi International Stadium': { city: 'Hyderabad', stadium: 'RGIS' },
  'Sawai Mansingh Stadium': { city: 'Jaipur', stadium: 'Sawai Mansingh Stadium' },
  'Himachal Pradesh Cricket Association Stadium': { city: 'Dharamshala', stadium: 'HPCA Stadium' },
  'Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium': { city: 'Lucknow', stadium: 'Ekana Stadium' },
  'I.S. Bindra Stadium': { city: 'Mohali', stadium: 'IS Bindra Stadium' },
};

function getVenueDetails(venue: string | undefined | null) {
  if (!venue) return { city: 'TBD', stadium: '' };
  for (const key in VENUES) {
    if (venue.includes(key)) return VENUES[key];
  }
  return { city: venue, stadium: '' };
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const { getEffectiveNow } = useDev();

  useEffect(() => {
    const fetchMatches = async () => {
      const data = await getMatches();
      const hasRealMatches = data.some((m) => !['1', '2', '3'].includes(m.id));
      setMatches(hasRealMatches ? data.filter((m) => !['1', '2', '3'].includes(m.id)) : data);
      setLoading(false);
    };
    fetchMatches();
  }, []);

  if (loading) {
    return (
      <div className="px-4 space-y-3">
        <Skeleton className="h-8 w-48 mb-3" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 space-y-6 pb-4">
      <header className="space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-tint border border-primary/20 text-primary font-mono text-[10px] uppercase tracking-widest font-black">
          <Zap size={11} className="fill-current" />
          Live Fixtures
        </div>
        <h1 className="text-3xl font-display font-black uppercase tracking-tighter italic leading-none">
          Battlegrounds
        </h1>
        <p className="text-sm text-muted font-medium">Pick a match, build your 3-player trio, name your MVP.</p>
      </header>

      {matches.length === 0 ? (
        <Card className="text-center py-16 border-dashed">
          <Trophy className="w-10 h-10 text-muted/40 mx-auto mb-3" />
          <h3 className="text-base font-display font-black uppercase italic text-muted mb-1">The Stadium is Quiet</h3>
          <p className="text-muted max-w-xs mx-auto text-xs leading-relaxed">
            No matches found. If you&apos;re an admin, try Sync Fixtures from the profile menu.
          </p>
        </Card>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">
            {matches.map((match, idx) => {
              const venue = getVenueDetails(match.venue);
              const timeStatus = match.date ? getMatchTimeStatus(match.date, getEffectiveNow()) : 'open';
              const isCompleted = timeStatus === 'completed';
              const isLocked = timeStatus === 'locked';
              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx, 6) * 0.04 }}
                >
                  <Link href={`/matches/${match.id}`}>
                    <Card className={cn('p-4 active:scale-[0.99] transition-transform', isCompleted && 'opacity-60')}>
                      {(isCompleted || isLocked) && (
                        <div className="flex justify-end mb-2 -mt-1">
                          <Badge variant={isCompleted ? 'neutral' : 'danger'}>
                            {isCompleted ? <CheckCircle2 size={10} /> : <Lock size={10} />}
                            {isCompleted ? 'Completed' : 'Locked'}
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-center justify-center gap-5 pb-3 mb-3 border-b border-border">
                        <div className="flex flex-col items-center gap-1.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={getTeamLogo(match.team1, match.team1LogoId)} alt={match.team1} className="w-12 h-12 object-contain drop-shadow-sm" />
                          <span className="text-[10px] font-black text-muted italic uppercase tracking-widest">{match.team1}</span>
                        </div>
                        <span className="text-[10px] font-black text-muted/60 italic uppercase">VS</span>
                        <div className="flex flex-col items-center gap-1.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={getTeamLogo(match.team2, match.team2LogoId)} alt={match.team2} className="w-12 h-12 object-contain drop-shadow-sm" />
                          <span className="text-[10px] font-black text-muted italic uppercase tracking-widest">{match.team2}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-bold text-muted">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-primary" />
                          {match.date
                            ? new Date(match.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
                            : 'TBD'}
                        </span>
                        <span className="flex items-center gap-1.5 min-w-0 max-w-[55%]">
                          <MapPin size={12} className="text-primary shrink-0" />
                          <span className="truncate">{venue.city}</span>
                        </span>
                        <ChevronRight size={14} className="text-muted/60 shrink-0" />
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
