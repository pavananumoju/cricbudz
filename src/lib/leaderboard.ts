import { UserSquad } from '@/types';
import { getMatchDayIST } from './utils';

const IST_OFFSET = '+05:30';
const DAY_MS = 24 * 60 * 60 * 1000;

export interface WeekRange {
  start: Date; // IST 00:00:00 Monday, as a real instant
  end: Date;   // IST 23:59:59.999 Sunday, as a real instant
  startDay: string; // YYYY-MM-DD (IST calendar day)
  endDay: string;   // YYYY-MM-DD (IST calendar day)
}

// Adds `days` calendar days to a YYYY-MM-DD string via UTC-midnight
// arithmetic, so the result never depends on the machine's local timezone.
function addDaysToDayString(dayStr: string, days: number): string {
  const d = new Date(`${dayStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// 0=Sunday..6=Saturday for a YYYY-MM-DD string, independent of local timezone.
function dayOfWeek(dayStr: string): number {
  return new Date(`${dayStr}T00:00:00Z`).getUTCDay();
}

// Monday–Sunday week containing `date`, anchored to India Standard Time —
// the league's actual timezone — rather than the viewer's device timezone.
// Before this, week boundaries were computed with local Date getters
// (getDay/setHours), so a user whose device clock isn't set to IST could
// see a match land in a different week than the dashboard/fixtures/toggle
// (all of which key off the match's IST calendar day) agree it belongs to.
export function getWeekRange(date: Date): WeekRange {
  const dayStr = getMatchDayIST(date);
  const dow = dayOfWeek(dayStr);
  const diffToMonday = dow === 0 ? -6 : 1 - dow;

  const startDay = addDaysToDayString(dayStr, diffToMonday);
  const endDay = addDaysToDayString(startDay, 6);

  return {
    start: new Date(`${startDay}T00:00:00${IST_OFFSET}`),
    end: new Date(`${endDay}T23:59:59.999${IST_OFFSET}`),
    startDay,
    endDay,
  };
}

export function shiftWeek(range: WeekRange, deltaWeeks: number): WeekRange {
  return getWeekRange(new Date(range.start.getTime() + deltaWeeks * 7 * DAY_MS));
}

export function formatWeekLabel(range: WeekRange): string {
  const startLabel = range.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' });
  const endLabel = range.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata' });
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
