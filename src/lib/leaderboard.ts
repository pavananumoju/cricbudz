import { UserSquad } from '@/types';

export interface WeekRange {
  start: Date; // Monday 00:00:00 local
  end: Date;   // Sunday 23:59:59.999 local
  startDay: string; // YYYY-MM-DD
  endDay: string;   // YYYY-MM-DD
}

// Monday–Sunday week containing `date`. JS's getDay() is 0=Sunday..6=Saturday,
// so Monday-start requires shifting Sunday to the end of the previous week.
export function getWeekRange(date: Date): WeekRange {
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + diffToMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return {
    start,
    end,
    startDay: toDayString(start),
    endDay: toDayString(end),
  };
}

export function shiftWeek(range: WeekRange, deltaWeeks: number): WeekRange {
  const shifted = new Date(range.start);
  shifted.setDate(shifted.getDate() + deltaWeeks * 7);
  return getWeekRange(shifted);
}

export function formatWeekLabel(range: WeekRange): string {
  const startLabel = range.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endLabel = range.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startLabel} – ${endLabel}`;
}

// "Week 1" = the Monday-Sunday week containing the season's first match,
// counting forward from there — not the ISO calendar week number, which
// wouldn't mean anything to a user ("Week 20"?). `seasonStart` is any date
// within the season's first match week (the earliest synced match's date).
export function getWeekNumber(weekStart: Date, seasonStart: Date): number {
  const seasonFirstWeekStart = getWeekRange(seasonStart).start;
  const diffMs = weekStart.getTime() - seasonFirstWeekStart.getTime();
  const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
  return diffWeeks + 1;
}

function toDayString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface StandingsEntry {
  userId: string;
  displayName: string;
  photoURL: string | null;
  points: number;
  rank: number;
  matchesScored: number;
}

// Sums totalPoints per user across every *scored* squad in the range —
// squads with no totalPoints yet (match not finalized) simply don't
// contribute, rather than being counted as zero-and-included.
export function computeStandings(squads: UserSquad[]): StandingsEntry[] {
  const byUser = new Map<string, StandingsEntry>();

  for (const squad of squads) {
    if (squad.totalPoints === undefined) continue;
    const existing = byUser.get(squad.userId);
    if (existing) {
      existing.points += squad.totalPoints;
      existing.matchesScored += 1;
    } else {
      byUser.set(squad.userId, {
        userId: squad.userId,
        displayName: squad.userDisplayName || 'Strategist',
        photoURL: squad.userPhotoURL,
        points: squad.totalPoints,
        rank: 0,
        matchesScored: 1,
      });
    }
  }

  const sorted = [...byUser.values()].sort((a, b) => b.points - a.points);
  sorted.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });
  return sorted;
}
