'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trophy, ChevronUp, Lock, CheckCircle2, EyeOff, Users, Zap } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  getMatchById,
  getPlayersByTeams,
  saveUserSquad,
  getUserSquads,
  getSquadsForMatch,
  getVisibilitySettings,
} from '@/services/dataService';
import { Player, Match, UserSquad } from '@/types';
import { cn, getMatchTimeStatus } from '@/lib/utils';
import { SQUAD_TARGET_SIZE, checkDualFranchiseViolation, validateSquad } from '@/lib/draftRules';
import { useDev } from '@/context/DevContext';
import { useAuth } from '@/context/AuthContext';
import { Sheet } from '@/components/ui/Sheet';
import { Card } from '@/components/ui/Card';

import PlayerCard from './_components/PlayerCard';
import SelectedSlots from './_components/SelectedSlots';
import SubmissionControl from './_components/SubmissionControl';

const TEAM_BRANDS: Record<string, { imageId: string; textClass: string; bgClass: string; borderClass: string; accentColor: string }> = {
  MI: { imageId: 'mi', textClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-500/10', borderClass: 'border-blue-500/30', accentColor: '#004ba0' },
  CSK: { imageId: 'csk', textClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-500/30', accentColor: '#fdb913' },
  RCB: { imageId: 'rcb', textClass: 'text-red-600 dark:text-red-400', bgClass: 'bg-red-500/10', borderClass: 'border-red-500/30', accentColor: '#d11d26' },
  SRH: { imageId: 'srh', textClass: 'text-orange-600 dark:text-orange-400', bgClass: 'bg-orange-500/10', borderClass: 'border-orange-500/30', accentColor: '#f26522' },
  DC: { imageId: 'dc', textClass: 'text-indigo-600 dark:text-indigo-400', bgClass: 'bg-indigo-500/10', borderClass: 'border-indigo-500/30', accentColor: '#000080' },
  KKR: { imageId: 'kkr', textClass: 'text-purple-600 dark:text-purple-400', bgClass: 'bg-purple-500/10', borderClass: 'border-purple-500/30', accentColor: '#3a225d' },
  PBKS: { imageId: 'pbks', textClass: 'text-rose-600 dark:text-rose-400', bgClass: 'bg-rose-500/10', borderClass: 'border-rose-500/30', accentColor: '#ed1b24' },
  RR: { imageId: 'rr', textClass: 'text-pink-600 dark:text-pink-400', bgClass: 'bg-pink-500/10', borderClass: 'border-pink-500/30', accentColor: '#ea1a85' },
  LSG: { imageId: 'lsg', textClass: 'text-cyan-600 dark:text-cyan-400', bgClass: 'bg-cyan-500/10', borderClass: 'border-cyan-500/30', accentColor: '#1c1c1c' },
  GT: { imageId: 'gt', textClass: 'text-slate-600 dark:text-slate-300', bgClass: 'bg-slate-500/10', borderClass: 'border-slate-500/30', accentColor: '#1b2133' },
};

function getTeamBrand(teamShortName: string) {
  return TEAM_BRANDS[teamShortName.toUpperCase()] || {
    imageId: '152655',
    textClass: 'text-primary',
    bgClass: 'bg-primary/10',
    borderClass: 'border-primary/30',
    accentColor: '#4f46e5',
  };
}

export default function SquadDraftPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const { getEffectiveNow } = useDev();
  const { user } = useAuth();
  const [match, setMatch] = useState<Match | null>(null);
  const [team1Players, setTeam1Players] = useState<Player[]>([]);
  const [team2Players, setTeam2Players] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [mvpId, setMvpId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [otherSquads, setOtherSquads] = useState<UserSquad[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [visibilityHiddenToday, setVisibilityHiddenToday] = useState(false);
  const router = useRouter();

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const [matchData, allUserSquads] = await Promise.all([getMatchById(id), getUserSquads()]);

      if (matchData) {
        setMatch(matchData);
        const playersByTeams = await getPlayersByTeams(matchData.team1, matchData.team2);
        const t1 = playersByTeams.filter((p) => p.team.toUpperCase() === matchData.team1.toUpperCase());
        const t2 = playersByTeams.filter((p) => p.team.toUpperCase() === matchData.team2.toUpperCase());
        setTeam1Players(t1);
        setTeam2Players(t2);
        setAllPlayers(playersByTeams);

        const existingSquad = allUserSquads.find((s) => s.matchId === id);
        if (existingSquad) {
          const selected = playersByTeams.filter((p) => existingSquad.players.includes(p.id));
          setSelectedPlayers(selected);
          setMvpId(existingSquad.mvpId);
        }

        const [squadsForMatch, visibility] = await Promise.all([getSquadsForMatch(id), getVisibilitySettings()]);
        setOtherSquads(squadsForMatch.filter((s) => s.userId !== user?.uid));
        const matchDay = matchData.date.slice(0, 10);
        setVisibilityHiddenToday(!!visibility?.hideUntilToss && visibility.date === matchDay);
      }
      setLoading(false);
    };
    fetchData();
  }, [id, user?.uid]);

  const timeStatus = match ? getMatchTimeStatus(match.date, getEffectiveNow()) : 'open';
  const isCompleted = timeStatus === 'completed';
  const isLocked = timeStatus !== 'open';
  // Toss = the moment "locked" begins. Once locked, the toggle no longer
  // matters — everyone can see everyone's trio for this match.
  const othersHidden = visibilityHiddenToday && !isLocked;

  const selectPlayer = (player: Player) => {
    if (isLocked) return;
    if (selectedPlayers.find((p) => p.id === player.id)) {
      removePlayer(player.id);
      return;
    }
    if (selectedPlayers.length >= SQUAD_TARGET_SIZE) {
      toast.error('Trio slots are full. Remove a player first.');
      return;
    }
    if (match) {
      const violation = checkDualFranchiseViolation(selectedPlayers, player, match.team1, match.team2);
      if (violation) {
        toast.error(violation);
        return;
      }
    }
    setSelectedPlayers([...selectedPlayers, player]);
  };

  const removePlayer = (id: string) => {
    if (isLocked) return;
    setSelectedPlayers(selectedPlayers.filter((p) => p.id !== id));
    if (mvpId === id) setMvpId(null);
  };

  const handleSetMvp = (playerId: string) => {
    if (isLocked) return;
    setMvpId(playerId);
  };

  const checkStatusDetails = (): { canSubmit: boolean; message: string } =>
    validateSquad(selectedPlayers, mvpId, { isLocked, isCompleted });

  const handleSave = async () => {
    const status = checkStatusDetails();
    if (!status.canSubmit || !id) return;
    setSaving(true);
    try {
      await saveUserSquad({
        matchId: id,
        players: selectedPlayers.map((p) => p.id),
        mvpId: mvpId!,
        matchTimestamp: match!.date,
      });
      toast.success('Trio locked in!');
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save your squad. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-6">
        <Trophy className="w-12 h-12 text-muted/40 mb-4" />
        <h3 className="text-lg font-display font-black uppercase italic text-muted mb-2">Match Not Found</h3>
        <p className="text-muted max-w-xs mx-auto text-sm leading-relaxed mb-6">
          This fixture doesn&apos;t exist or hasn&apos;t been synced yet.
        </p>
        <button
          onClick={() => router.push('/matches')}
          className="bg-foreground text-background px-5 py-2.5 rounded-xl font-display font-black text-[10px] uppercase tracking-tight"
        >
          Back to Fixtures
        </button>
      </div>
    );
  }

  const { canSubmit, message: statusMessage } = checkStatusDetails();
  const team1Brand = getTeamBrand(match.team1);
  const team2Brand = getTeamBrand(match.team2);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-28 lg:pb-10 selection:bg-primary/30">
      <div className="sticky top-0 z-40 bg-surface/95 backdrop-blur-xl border-b border-border pt-safe">
        <div className="max-w-md md:max-w-3xl lg:max-w-6xl mx-auto px-3 py-3 flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-surface-hover flex items-center justify-center shrink-0 active:scale-95 transition-transform"
          >
            <ArrowLeft size={17} />
          </button>
          <div className="flex-1 min-w-0 text-center">
            <h2 className="font-display font-black text-sm lg:text-base uppercase italic tracking-tight truncate">
              <span className={team1Brand.textClass}>{match.team1}</span>
              <span className="text-muted px-1.5">vs</span>
              <span className={team2Brand.textClass}>{match.team2}</span>
            </h2>
            <p className="text-[9px] text-muted font-bold tracking-widest uppercase">Trio Selection</p>
          </div>
          {isCompleted ? (
            <div className="flex items-center gap-1 shrink-0 text-muted">
              <CheckCircle2 size={13} />
              <span className="text-[10px] font-display font-black uppercase tracking-tight">Completed</span>
            </div>
          ) : isLocked ? (
            <div className="flex items-center gap-1 shrink-0 text-danger">
              <Lock size={13} />
              <span className="text-[10px] font-display font-black uppercase tracking-tight">Locked</span>
            </div>
          ) : (
            <div className="text-right shrink-0 w-11">
              <p className="text-[8px] font-mono font-black text-muted uppercase leading-none">Picks</p>
              <p className="text-sm font-display font-black text-primary italic leading-none mt-1">{selectedPlayers.length}/3</p>
            </div>
          )}
        </div>
        {isCompleted ? (
          <div className="bg-surface-hover border-t border-border">
            <div className="max-w-md md:max-w-3xl lg:max-w-6xl mx-auto px-3 py-1.5 flex items-center justify-center gap-1.5">
              <CheckCircle2 size={11} className="text-muted shrink-0" />
              <p className="text-[9px] font-bold text-muted uppercase tracking-wide">
                Match completed — your final trio is shown below
              </p>
            </div>
          </div>
        ) : isLocked ? (
          <div className="bg-danger-tint border-t border-danger/20">
            <div className="max-w-md md:max-w-3xl lg:max-w-6xl mx-auto px-3 py-1.5 flex items-center justify-center gap-1.5">
              <Lock size={11} className="text-danger shrink-0" />
              <p className="text-[9px] font-bold text-danger uppercase tracking-wide">
                Arena locked — no further changes permitted
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <main className="max-w-md md:max-w-3xl lg:max-w-6xl mx-auto px-3 py-4">
        <div className="grid grid-cols-2 lg:grid-cols-[1fr_1fr_340px] gap-3 lg:gap-5">
          <div className="space-y-2">
            <div
              style={{ borderLeft: `3px solid ${team1Brand.accentColor}` }}
              className="px-3 py-2.5 rounded-xl bg-surface border border-border flex items-center justify-between"
            >
              <span className={cn('font-display font-black text-[11px] uppercase italic truncate', team1Brand.textClass)}>{match.team1}</span>
              <span className="text-[9px] font-mono font-black text-muted shrink-0">{team1Players.length}</span>
            </div>
            <div className="space-y-1.5">
              {team1Players.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  brand={team1Brand}
                  isSelected={!!selectedPlayers.find((p) => p.id === player.id)}
                  disabled={isLocked}
                  onSelect={() => selectPlayer(player)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div
              style={{ borderLeft: `3px solid ${team2Brand.accentColor}` }}
              className="px-3 py-2.5 rounded-xl bg-surface border border-border flex items-center justify-between"
            >
              <span className={cn('font-display font-black text-[11px] uppercase italic truncate', team2Brand.textClass)}>{match.team2}</span>
              <span className="text-[9px] font-mono font-black text-muted shrink-0">{team2Players.length}</span>
            </div>
            <div className="space-y-1.5">
              {team2Players.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  brand={team2Brand}
                  isSelected={!!selectedPlayers.find((p) => p.id === player.id)}
                  disabled={isLocked}
                  onSelect={() => selectPlayer(player)}
                />
              ))}
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24 bg-surface border border-border rounded-2xl p-4">
              <h3 className="font-display font-black text-sm uppercase italic tracking-tight mb-3">
                Your Trio
              </h3>
              <SelectedSlots
                selectedPlayers={selectedPlayers}
                mvpId={mvpId}
                onRemove={removePlayer}
                onSetMvp={handleSetMvp}
                getTeamBrand={getTeamBrand}
                locked={isLocked}
              />
              <div className="mt-4">
                <SubmissionControl
                  canSubmit={canSubmit}
                  statusMessage={statusMessage}
                  saving={saving}
                  isLocked={isLocked}
                  selectedPlayers={selectedPlayers}
                  mvpId={mvpId}
                  onSave={handleSave}
                />
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-muted" />
            <h3 className="font-display font-black text-sm uppercase italic tracking-tight">Squad Room</h3>
          </div>

          {othersHidden ? (
            <Card className="p-5 flex items-center gap-3 border-dashed">
              <EyeOff size={16} className="text-muted shrink-0" />
              <p className="text-xs text-muted leading-relaxed">
                Other players&apos; trios are hidden until toss for this match. They&apos;ll appear here automatically once toss passes.
              </p>
            </Card>
          ) : otherSquads.length === 0 ? (
            <Card className="p-5 text-center border-dashed">
              <p className="text-xs text-muted">No other trios submitted for this match yet.</p>
            </Card>
          ) : (
            <div className="space-y-2.5 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-2.5 sm:space-y-0">
              {otherSquads.map((squad) => (
                <Card key={squad.userId} className="p-3.5">
                  <div className="flex items-center gap-2 mb-2.5 pb-2.5 border-b border-border">
                    <div className="w-6 h-6 rounded-full bg-primary-tint border border-primary/20 overflow-hidden shrink-0 flex items-center justify-center">
                      {squad.userPhotoURL ? (
                        <Image src={squad.userPhotoURL} alt="" width={24} height={24} className="w-full h-full object-cover" unoptimized />
                      ) : (
                        <span className="text-[9px] font-black text-primary">{(squad.userDisplayName || '?').charAt(0)}</span>
                      )}
                    </div>
                    <span className="text-xs font-display font-black uppercase truncate">
                      {squad.userDisplayName || 'Strategist'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {squad.players.map((pid) => {
                      const player = allPlayers.find((p) => p.id === pid);
                      const isMvp = squad.mvpId === pid;
                      return (
                        <span
                          key={pid}
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight',
                            isMvp ? 'bg-accent-tint text-accent' : 'bg-surface-hover text-muted'
                          )}
                        >
                          {isMvp && <Zap size={9} className="fill-current" />}
                          {player ? player.name.split(' ').pop() : '...'}
                        </span>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <button
        onClick={() => setSheetOpen(true)}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t pb-safe transition-colors lg:hidden',
          isCompleted
            ? 'bg-surface/95 border-border active:bg-surface-hover'
            : isLocked
            ? 'bg-danger-tint/90 border-danger/20'
            : 'bg-surface/95 border-border active:bg-surface-hover'
        )}
      >
        <div className="max-w-md mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {isCompleted ? (
              <CheckCircle2 size={14} className="text-muted" />
            ) : isLocked ? (
              <Lock size={14} className="text-danger" />
            ) : (
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={cn('w-2 h-2 rounded-full', selectedPlayers[i] ? 'bg-primary' : 'bg-border')}
                  />
                ))}
              </div>
            )}
            <span className={cn('text-xs font-display font-black uppercase tracking-tight', isLocked && !isCompleted && 'text-danger')}>
              {isCompleted ? 'Match Completed' : isLocked ? 'Arena Locked' : `${selectedPlayers.length}/3 Selected ${mvpId ? '· MVP Set' : ''}`}
            </span>
          </div>
          <span className={cn('text-xs font-display font-black flex items-center gap-1', isLocked && !isCompleted ? 'text-danger' : 'text-primary')}>
            {isLocked ? 'View' : 'Review'}
            <ChevronUp size={15} />
          </span>
        </div>
      </button>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Your Trio">
        <SelectedSlots
          selectedPlayers={selectedPlayers}
          mvpId={mvpId}
          onRemove={removePlayer}
          onSetMvp={handleSetMvp}
          getTeamBrand={getTeamBrand}
          locked={isLocked}
        />
        <div className="mt-4">
          <SubmissionControl
            canSubmit={canSubmit}
            statusMessage={statusMessage}
            saving={saving}
            isLocked={isLocked}
            selectedPlayers={selectedPlayers}
            mvpId={mvpId}
            onSave={handleSave}
          />
        </div>
      </Sheet>
    </div>
  );
}
