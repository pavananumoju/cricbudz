'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { getWeekRange, shiftWeek, formatWeekLabel, computeStandings, type StandingsEntry } from '@/lib/leaderboard';
import { getSquadsInDateRange } from '@/services/dataService';
import { useDev } from '@/context/DevContext';

function Avatar({ entry, className }: { entry: StandingsEntry; className: string }) {
  if (entry.photoURL) {
    return <Image src={entry.photoURL} alt="" fill sizes="80px" className="object-cover" unoptimized />;
  }
  return (
    <div className={cn('w-full h-full flex items-center justify-center bg-primary-tint text-primary font-display font-black', className)}>
      {entry.displayName.charAt(0).toUpperCase()}
    </div>
  );
}

export default function LeaderboardPage() {
  const { getEffectiveNow } = useDev();
  const [weekRange, setWeekRange] = useState(() => getWeekRange(getEffectiveNow()));
  const [standings, setStandings] = useState<StandingsEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getSquadsInDateRange(weekRange.startDay, weekRange.endDay).then((squads) => {
      setStandings(computeStandings(squads));
      setLoading(false);
    });
  }, [weekRange.startDay, weekRange.endDay]);

  const currentWeek = getWeekRange(getEffectiveNow());
  const isCurrentWeek = weekRange.startDay === currentWeek.startDay;
  const isWeekOver = weekRange.end.getTime() < getEffectiveNow().getTime();

  const [first, second, third] = [standings[0], standings[1], standings[2]];
  const podium = [second, first, third].filter(Boolean);
  const rest = standings.slice(3);

  return (
    <div className="px-4 space-y-6 pb-4 lg:max-w-2xl lg:mx-auto">
      <header className="space-y-2 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-tint border border-accent/20 text-accent font-mono text-[10px] uppercase tracking-widest font-black">
          <Trophy size={11} />
          Halla Bol!
        </div>
        <h1 className="text-3xl font-display font-black tracking-tighter uppercase italic leading-none">
          Weekly <span className="text-accent">League</span>
        </h1>
        <p className="text-muted text-sm font-medium">
          {isWeekOver ? 'Final standings for the week.' : 'Live standings — the week isn’t over yet.'}
        </p>
      </header>

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setWeekRange((r) => shiftWeek(r, -1))}
          aria-label="Previous week"
          className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center active:scale-95 transition-transform"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <p className="text-xs font-display font-black uppercase tracking-tight">{formatWeekLabel(weekRange)}</p>
          {isCurrentWeek && <p className="text-[9px] text-accent font-black uppercase tracking-widest mt-0.5">This Week</p>}
        </div>
        <button
          onClick={() => setWeekRange((r) => shiftWeek(r, 1))}
          disabled={isCurrentWeek}
          aria-label="Next week"
          className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>
      ) : standings.length === 0 ? (
        <Card className="text-center py-16 border-dashed">
          <Trophy className="w-10 h-10 text-muted/40 mx-auto mb-3" />
          <h3 className="text-base font-display font-black uppercase italic text-muted mb-1">No Scores Yet</h3>
          <p className="text-muted max-w-xs mx-auto text-xs leading-relaxed">
            Nobody has a finalized match this week yet. Standings appear once an admin finalizes scoring for a match.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2.5 items-end">
            {podium.map((entry) => {
              const isFirst = entry.rank === 1;
              return (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: isFirst ? 0.05 : 0.15 }}
                >
                  <Card
                    className={cn(
                      'text-center relative overflow-hidden',
                      isFirst ? 'p-4 pt-6 border-accent/40 shadow-md' : 'p-3 pt-5'
                    )}
                  >
                    {isFirst && <Medal size={22} className="absolute top-2.5 right-2.5 text-accent" />}
                    <div
                      className={cn(
                        'mx-auto mb-2.5 rounded-2xl overflow-hidden border-2 relative',
                        isFirst ? 'w-14 h-14 border-accent' : 'w-11 h-11 border-border'
                      )}
                    >
                      <Avatar entry={entry} className="text-sm" />
                    </div>
                    <h3 className={cn('font-display font-black truncate', isFirst ? 'text-sm' : 'text-xs')}>{entry.displayName}</h3>
                    <p className="text-muted text-[8px] font-bold uppercase tracking-widest mt-0.5 mb-2">
                      {isWeekOver ? (isFirst ? 'Winner' : 'Runner-up') : `#${entry.rank}`}
                    </p>
                    <div
                      className={cn(
                        'rounded-xl font-display font-black',
                        isFirst ? 'bg-accent text-white py-2 text-sm' : 'bg-surface-hover text-muted py-1.5 text-xs'
                      )}
                    >
                      {entry.points.toLocaleString()}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {rest.length > 0 && (
            <Card className="overflow-hidden">
              <div className="divide-y divide-border">
                {rest.map((entry, idx) => (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + idx * 0.03 }}
                    className="flex items-center gap-3 p-3.5"
                  >
                    <span className="w-6 text-center font-display font-black text-sm text-muted/50 shrink-0">{entry.rank}</span>
                    <div className="w-9 h-9 rounded-xl overflow-hidden border border-border shrink-0 relative">
                      <Avatar entry={entry} className="text-xs" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-display font-black text-xs uppercase truncate">{entry.displayName}</h4>
                    </div>
                    <span className="font-display font-black text-sm shrink-0 w-14 text-right">{entry.points.toLocaleString()}</span>
                  </motion.div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
