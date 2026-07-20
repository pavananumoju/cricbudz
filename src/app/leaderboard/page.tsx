'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, ChevronLeft, ChevronRight, Crown } from 'lucide-react';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import {
  getWeekRange,
  shiftWeek,
  formatWeekLabel,
  getWeekNumber,
  computeStandings,
  type StandingsEntry,
} from '@/lib/leaderboard';
import { getSquadsInDateRange, getEarliestMatchDate } from '@/services/dataService';
import { useDev } from '@/context/DevContext';
import { ErrorState } from '@/components/ui/ErrorState';
import { isPermissionDeniedError } from '@/lib/errors';

const MEDAL_STYLES: Record<number, { badge: string; row: string }> = {
  1: { badge: 'bg-accent text-white shadow-sm shadow-accent/30', row: 'bg-accent-tint/60 border-accent/30' },
  2: { badge: 'bg-slate-300 text-slate-800 dark:bg-slate-400 dark:text-slate-900', row: 'border-border' },
  3: { badge: 'bg-orange-300 text-orange-900 dark:bg-orange-400/80 dark:text-orange-950', row: 'border-border' },
};

function Avatar({ entry }: { entry: StandingsEntry }) {
  if (entry.photoURL) {
    return <Image src={entry.photoURL} alt="" fill sizes="80px" className="object-cover" unoptimized />;
  }
  return (
    <div className="w-full h-full flex items-center justify-center bg-primary-tint text-primary font-display font-black text-sm">
      {entry.displayName.charAt(0).toUpperCase()}
    </div>
  );
}

export default function LeaderboardPage() {
  const { getEffectiveNow } = useDev();
  const [weekRange, setWeekRange] = useState(() => getWeekRange(getEffectiveNow()));
  const [standings, setStandings] = useState<StandingsEntry[]>([]);
  const [seasonStart, setSeasonStart] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    // Non-critical: only used to display "Week N" — a failure here
    // shouldn't block the rest of the page, so it's logged, not surfaced.
    getEarliestMatchDate()
      .then((date) => setSeasonStart(date ? new Date(date) : null))
      .catch((err) => console.error('getEarliestMatchDate failed:', err));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getSquadsInDateRange(weekRange.startDay, weekRange.endDay)
      .then((squads) => {
        if (cancelled) return;
        setStandings(computeStandings(squads));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [weekRange.startDay, weekRange.endDay, retryToken]);

  const currentWeek = getWeekRange(getEffectiveNow());
  const isCurrentWeek = weekRange.startDay === currentWeek.startDay;
  const isWeekOver = weekRange.end.getTime() < getEffectiveNow().getTime();
  const weekNumber = seasonStart ? getWeekNumber(weekRange.start, seasonStart) : null;

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
          className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center active:scale-95 transition-transform shrink-0"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-center min-w-0">
          <div className="flex items-center justify-center flex-wrap gap-x-2 gap-y-1">
            <p className="font-display font-black text-base uppercase italic tracking-tight whitespace-nowrap min-w-0 pr-0.5">
              {weekNumber !== null ? `Week ${weekNumber}` : 'This Week'}
            </p>
            {isCurrentWeek && (
              <Badge variant="success" dot className="shrink-0">
                Live
              </Badge>
            )}
          </div>
          <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-0.5">{formatWeekLabel(weekRange)}</p>
        </div>
        <button
          onClick={() => setWeekRange((r) => shiftWeek(r, 1))}
          disabled={isCurrentWeek}
          aria-label="Next week"
          className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30 disabled:pointer-events-none shrink-0"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          permissionDenied={isPermissionDeniedError(error)}
          onRetry={() => setRetryToken((t) => t + 1)}
        />
      ) : standings.length === 0 ? (
        <Card className="text-center py-16 border-dashed">
          <Trophy className="w-10 h-10 text-muted/40 mx-auto mb-3" />
          <h3 className="text-base font-display font-black uppercase italic text-muted mb-1">No Scores Yet</h3>
          <p className="text-muted max-w-xs mx-auto text-xs leading-relaxed">
            Nobody has a finalized match this week yet. Standings appear once an admin finalizes scoring for a match.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {standings.map((entry, idx) => {
            const medal = MEDAL_STYLES[entry.rank];
            const isFirst = entry.rank === 1;
            return (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx, 8) * 0.03 }}
              >
                <Card
                  className={cn(
                    'p-3.5 flex items-center gap-3',
                    medal ? medal.row : 'border-border'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-display font-black text-sm',
                      medal ? medal.badge : 'bg-surface-hover text-muted'
                    )}
                  >
                    {isFirst ? <Crown size={15} className="fill-current" /> : entry.rank}
                  </div>

                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-border shrink-0 relative">
                    <Avatar entry={entry} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-display font-black text-sm uppercase italic tracking-tight truncate">{entry.displayName}</h4>
                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-0.5">
                      {isWeekOver && isFirst
                        ? 'Winner'
                        : isWeekOver && entry.rank <= 3
                        ? 'Runner-up'
                        : `${entry.matchesScored} match${entry.matchesScored === 1 ? '' : 'es'} scored`}
                    </p>
                  </div>

                  <span className={cn('font-display font-black text-lg shrink-0', isFirst ? 'text-accent' : 'text-foreground')}>
                    {entry.points.toLocaleString()}
                  </span>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
