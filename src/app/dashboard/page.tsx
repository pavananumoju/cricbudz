'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Trophy,
  Zap,
  ChevronRight,
  PlusCircle,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { cn, getTeamLogo, getMatchTimeStatus, getMatchDayIST } from '@/lib/utils';
import { getUserSquads, getMatches, deleteUserSquad } from '@/services/dataService';
import { UserSquad, Match } from '@/types';
import { useDev } from '@/context/DevContext';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { isPermissionDeniedError } from '@/lib/errors';

export default function Dashboard() {
  const { getEffectiveNow } = useDev();
  const { isAdmin } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [squads, setSquads] = useState<(UserSquad & { match?: Match })[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const handleDeleteDraft = async (matchId: string) => {
    if (confirmDeleteId !== matchId) {
      setConfirmDeleteId(matchId);
      return;
    }
    setDeletingId(matchId);
    try {
      await deleteUserSquad(matchId);
      setSquads((prev) => prev.filter((s) => s.matchId !== matchId));
      toast.success('Draft removed.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove draft. Try again.');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    const toastId = toast.loading('Refining fixtures...');
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/sync', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Synced ${data.totalFound || 0} matches`, { id: toastId });
        if (data.warning) toast.warning(data.warning, { duration: 10000 });
        setTimeout(() => window.location.reload(), 1200);
      } else {
        toast.error('Sync error: ' + (data.message || data.error || 'Server error'), { id: toastId });
      }
    } catch {
      toast.error('Network error during sync', { id: toastId });
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

      setError(null);
      try {
        const [userSquads, fetchedMatches] = await Promise.all([
          getUserSquads(),
          getMatches(),
        ]);

        setAllMatches(fetchedMatches);

        const enrichedSquads = userSquads
          .map((s) => ({
            ...s,
            match: fetchedMatches.find((m) => m.id === s.matchId),
          }))
          .sort((a, b) => {
            const dateA = a.match ? new Date(a.match.date).getTime() : 0;
            const dateB = b.match ? new Date(b.match.date).getTime() : 0;
            return dateA - dateB;
          });

        setSquads(enrichedSquads);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, retryToken]);

  const getMatchLabel = (match: Match) => {
    const d = new Date(match.date);
    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const suffix = `${month} ${day}, ${year}, ${dayName}`;

    let base = '';

    if (match.matchDesc) {
      const desc = match.matchDesc.toLowerCase();
      if (desc.includes('match')) {
        const matchNum = desc.match(/\d+/);
        base = matchNum ? `MATCH ${matchNum[0]}` : match.matchDesc.toUpperCase();
      } else if (desc.includes('qualifier') || desc.includes('eliminator') || desc.includes('final')) {
        base = match.matchDesc.toUpperCase();
      }
    }

    if (!base) {
      const sameDayMatches = allMatches
        .filter((m) => new Date(m.date).toDateString() === d.toDateString())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (sameDayMatches.length > 1) {
        const idx = sameDayMatches.findIndex((m) => m.id === match.id);
        base = `${month.toUpperCase()} ${day} (#${idx + 1})`;
      } else {
        base = `${month.toUpperCase()} ${day}`;
      }
    }

    return { base, suffix };
  };

  if (loading) {
    return (
      <div className="px-4 space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-52 w-full rounded-3xl" />
        <Skeleton className="h-52 w-full rounded-3xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 pt-2">
        <ErrorState
          permissionDenied={isPermissionDeniedError(error)}
          onRetry={() => setRetryToken((t) => t + 1)}
        />
      </div>
    );
  }

  const effectiveNow = getEffectiveNow();
  const nowTime = effectiveNow.getTime();

  const effectiveDateStr = getMatchDayIST(effectiveNow);
  const todaysMatches = allMatches
    .filter((m) => {
      if (!m.date) return false;
      return getMatchDayIST(m.date) === effectiveDateStr;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const todaysArenaData = todaysMatches.map((m) => {
    const squad = squads.find((s) => s.matchId === m.id);
    return { match: m, squad: squad || null };
  });

  const activeSquad =
    squads.find((s) => {
      if (!s.match) return false;
      const mDate = new Date(s.match.date).getTime();
      return mDate > nowTime - 4 * 60 * 60 * 1000;
    }) ||
    squads.find((s) => !!s.match) ||
    squads[0];

  const displayData =
    todaysArenaData.length > 0
      ? todaysArenaData
      : activeSquad && activeSquad.match
        ? [{ match: activeSquad.match, squad: activeSquad }]
        : [];

  const shownMatchIds = todaysArenaData.length > 0 ? todaysArenaData.map((d) => d.match.id) : [activeSquad?.matchId];
  const remainingSquads = squads.filter((s) => !shownMatchIds.includes(s.matchId));

  return (
    <div className="px-4 space-y-8 pb-4">
      <header className="flex items-start justify-between gap-3 pt-2">
        <div className="space-y-1.5">
          <Badge variant="success" dot>
            Live Feed
          </Badge>
          <h1 className="text-2xl font-display font-black uppercase tracking-tighter italic leading-none">
            Hey, <span className="text-primary">{user?.displayName?.split(' ')[0] || 'Strategist'}</span>
          </h1>
        </div>

        <div className="flex gap-2 shrink-0">
          <Card className="px-3 py-2 flex flex-col items-center min-w-[64px]">
            <span className="text-[8px] font-black text-muted uppercase tracking-widest leading-none mb-1">Trios</span>
            <span className="text-base font-display font-black italic">{squads.length}</span>
          </Card>
          <div className="px-3 py-2 rounded-3xl bg-primary flex flex-col items-center min-w-[64px] shadow-sm shadow-primary/20">
            <span className="text-[8px] font-black text-primary-foreground/70 uppercase tracking-widest leading-none mb-1">MVPs</span>
            <span className="text-base font-display font-black italic text-primary-foreground">
              {squads.filter((s) => !!s.mvpId).length}
            </span>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-black text-lg uppercase tracking-tighter italic">
            {todaysArenaData.length > 0 ? "Today's Arena" : 'Primary Draft'}
          </h2>
          <Link href="/matches" className="text-[10px] font-black text-muted hover:text-primary uppercase tracking-widest flex items-center gap-1 transition-colors">
            All <ChevronRight size={12} />
          </Link>
        </div>

        {displayData.length === 0 ? (
          <Card className="h-40 border-dashed flex flex-col items-center justify-center text-center px-6">
            <PlusCircle className="w-8 h-8 text-muted/50 mb-2" />
            <h3 className="font-display font-black text-sm uppercase italic text-muted mb-1">Ready for Kickoff?</h3>
            <p className="text-[11px] text-muted mb-3 max-w-xs leading-relaxed">
              No active trios found. Pick a match to start drafting.
            </p>
            <Link
              href="/matches"
              className="bg-foreground text-background px-5 py-2 rounded-xl font-display font-black text-[10px] uppercase tracking-tight"
            >
              Browse Matches
            </Link>
          </Card>
        ) : (
          <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
            {displayData.map((data, idx) => {
              if (!data.match) return null;
              const timeStatus = getMatchTimeStatus(data.match.date, effectiveNow);
              const isCompleted = timeStatus === 'completed';
              const isLocked = timeStatus !== 'open';
              const hasSquad = !!data.squad;
              const label = getMatchLabel(data.match);

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => router.push(`/matches/${data.match.id}`)}
                  className="active:scale-[0.99] transition-transform"
                >
                  <Card className="p-5">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-primary uppercase tracking-wider leading-none">{label.base}</p>
                        <p className="text-[9px] font-bold text-muted uppercase tracking-wider mt-1 truncate">{label.suffix}</p>
                      </div>
                      <Badge variant={isCompleted ? 'neutral' : isLocked ? 'danger' : 'success'} dot={!isCompleted}>
                        {isCompleted ? 'Completed' : isLocked ? 'Locked' : 'Live'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-center gap-6 mb-5 py-3 bg-surface-hover rounded-2xl">
                      <div className="flex flex-col items-center gap-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getTeamLogo(data.match.team1, data.match.team1LogoId)}
                          alt={data.match.team1}
                          className="w-12 h-12 object-contain drop-shadow-sm"
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted">{data.match.team1}</span>
                      </div>
                      <span className="text-muted font-black italic text-xs">VS</span>
                      <div className="flex flex-col items-center gap-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getTeamLogo(data.match.team2, data.match.team2LogoId)}
                          alt={data.match.team2}
                          className="w-12 h-12 object-contain drop-shadow-sm"
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted">{data.match.team2}</span>
                      </div>
                    </div>

                    {data.squad ? (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {data.squad.players.map((pId, pIdx) => {
                          const playerName = data.squad!.playerNames?.[pIdx];
                          const isMvp = data.squad!.mvpId === pId;
                          return (
                            <Badge key={pIdx} variant={isMvp ? 'mvp' : 'neutral'}>
                              {isMvp && <Zap size={9} className="fill-current" />}
                              {playerName ? playerName.split(' ').pop() : '...'}
                            </Badge>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted mb-4">
                        <PlusCircle size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest italic">No Trio Selected</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-muted">
                        {new Date(data.match.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </span>
                      {!isLocked ? (
                        <Link
                          href={`/matches/${data.match.id}`}
                          className="bg-foreground text-background px-4 py-2 rounded-xl font-display font-black text-[10px] uppercase tracking-tight"
                        >
                          {hasSquad ? 'Edit Trio' : 'Draft Trio'}
                        </Link>
                      ) : (
                        <span className="text-[9px] text-muted italic">{isCompleted ? 'Completed' : 'Finalized'}</span>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display font-black text-lg uppercase tracking-tighter italic">Quick Links</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Link href="/matches" className="flex items-center gap-3 p-4 rounded-2xl bg-surface border border-border">
            <div className="w-9 h-9 rounded-xl bg-success-tint flex items-center justify-center shrink-0">
              <PlusCircle className="w-4 h-4 text-success" />
            </div>
            <div className="min-w-0">
              <span className="block font-display font-black text-xs uppercase">Fixtures</span>
              <span className="text-[8px] font-bold text-muted uppercase tracking-widest">Browse all</span>
            </div>
          </Link>

          <Link href="/leaderboard" className="flex items-center gap-3 p-4 rounded-2xl bg-surface border border-border">
            <div className="w-9 h-9 rounded-xl bg-accent-tint flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4 text-accent" />
            </div>
            <div className="min-w-0">
              <span className="block font-display font-black text-xs uppercase">Ranks</span>
              <span className="text-[8px] font-bold text-muted uppercase tracking-widest">Global board</span>
            </div>
          </Link>

          {isAdmin && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="col-span-2 lg:col-span-4 flex items-center gap-3 p-4 rounded-2xl bg-surface border border-primary/20 text-left disabled:opacity-60"
            >
              <div className="w-9 h-9 rounded-xl bg-primary-tint flex items-center justify-center shrink-0">
                <RefreshCw className={cn('w-4 h-4 text-primary', syncing && 'animate-spin')} />
              </div>
              <div className="min-w-0">
                <span className="block font-display font-black text-xs uppercase">Sync Fixtures</span>
                <span className="text-[8px] font-bold text-primary uppercase tracking-widest">Admin only</span>
              </div>
            </button>
          )}
        </div>
      </section>

      {remainingSquads.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display font-black text-xs uppercase tracking-widest text-muted italic">Other Drafts</h2>
          <div className="space-y-2.5 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-2.5">
            {remainingSquads.map((s, i) => {
              const label = s.match ? getMatchLabel(s.match) : null;
              const canDelete = !s.match || getMatchTimeStatus(s.match.date, effectiveNow) === 'open';
              const isConfirming = confirmDeleteId === s.matchId;
              return (
                <Card key={i} className="flex items-center justify-between p-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    {s.match && (
                      <div className="flex -space-x-2 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getTeamLogo(s.match.team1, s.match.team1LogoId)} alt={s.match.team1} className="w-7 h-7 rounded-full border-2 border-surface object-contain bg-surface-hover" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getTeamLogo(s.match.team2, s.match.team2LogoId)} alt={s.match.team2} className="w-7 h-7 rounded-full border-2 border-surface object-contain bg-surface-hover" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest truncate">{label ? label.base : `Draft #${s.matchId}`}</p>
                      <p className="font-display font-black text-xs italic uppercase truncate">
                        {s.match ? s.match.matchDesc || `${s.match.team1} vs ${s.match.team2}` : 'Unknown Match'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteDraft(s.matchId)}
                        onBlur={() => setConfirmDeleteId((id) => (id === s.matchId ? null : id))}
                        disabled={deletingId === s.matchId}
                        className={cn(
                          'flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-50',
                          isConfirming
                            ? 'text-danger border-danger/40 bg-danger-tint'
                            : 'text-muted border-border hover:text-danger hover:border-danger/30'
                        )}
                      >
                        <Trash2 size={11} />
                        {isConfirming ? 'Confirm?' : ''}
                      </button>
                    )}
                    <Link
                      href={`/matches/${s.matchId}`}
                      className="text-[9px] font-black text-primary uppercase tracking-widest px-3 py-1.5 rounded-lg border border-primary/20 shrink-0"
                    >
                      View
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
