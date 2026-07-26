import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Our @theme (globals.css) adds custom font-size tokens `text-meta` (12px) and
// `text-micro` (11px). Stock tailwind-merge doesn't know these are font-sizes,
// so it treats e.g. `text-micro` as a text *color* and drops it when merged
// with a real color like `text-muted` — silently reverting the label to the
// 16px browser default (this is what blew up the bottom-nav labels). Register
// them in the font-size group so merging keeps both the size and the color.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["meta", "micro"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Squads lock 30 minutes before the official match start.
export const SQUAD_LOCK_WINDOW_MS = 30 * 60 * 1000;
// We don't sync live ball-by-ball match state, so "completed" is inferred
// from a typical T20 match's toss-to-finish duration, with a buffer.
export const ASSUMED_MATCH_DURATION_MS = 4 * 60 * 60 * 1000;

export type MatchTimeStatus = 'open' | 'locked' | 'completed';

export function getMatchTimeStatus(matchDate: string | Date, now: Date = new Date()): MatchTimeStatus {
  const start = new Date(matchDate).getTime();
  const nowTime = now.getTime();
  if (nowTime >= start + ASSUMED_MATCH_DURATION_MS) return 'completed';
  if (start - nowTime < SQUAD_LOCK_WINDOW_MS) return 'locked';
  return 'open';
}

// Canonical "what calendar day is this" for the whole app — India Standard
// Time, the league's actual timezone, rather than UTC or the viewer's
// device timezone. Before this, matchDay (dataService), the dashboard's
// "Today's Arena", fixtures' auto-scroll, and the visibility toggle's match
// day each derived "today" differently (UTC slice, UTC Intl format, device
// local time), which agree by coincidence for IPL's evening start times but
// can disagree for a user traveling abroad or a typo'd admin date.
export function getMatchDayIST(input: string | Date | number): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(input));
}

// Trio chips everywhere used to render a bare surname (`name.split(' ').pop()`),
// so two "Sharma"s or two "Pandya"s in the same match were indistinguishable in
// the Squad Room and on the dashboard. Produce an initial-plus-surname short form
// ("Rohit Sharma" -> "R Sharma") instead; callers keep the full name on
// title/aria-label so the disambiguation is available to sighted and assistive
// users alike. A single-token name is returned unchanged.
export function shortPlayerName(fullName: string | undefined | null): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? '';
  const surname = parts[parts.length - 1];
  const initials = parts
    .slice(0, -1)
    .map((p) => p[0].toUpperCase())
    .join('');
  return `${initials} ${surname}`;
}

export function getTeamLogo(teamCode: string, logoId?: number): string {
  if (logoId) {
    return `https://static.cricbuzz.com/a/img/v1/72x72/i1/c${logoId}/team.jpg`;
  }
  
  const logos: Record<string, string> = {
    'RCB': 'https://static.cricbuzz.com/a/img/v1/72x72/i1/c860061/royal-challengers-bangalore.jpg',
    'MI': 'https://static.cricbuzz.com/a/img/v1/72x72/i1/c860060/mumbai-indians.jpg',
    'CSK': 'https://static.cricbuzz.com/a/img/v1/72x72/i1/c860058/chennai-super-kings.jpg',
    'KKR': 'https://static.cricbuzz.com/a/img/v1/72x72/i1/c860059/kolkata-knight-riders.jpg',
    'SRH': 'https://static.cricbuzz.com/a/img/v1/72x72/i1/c860066/sunrisers-hyderabad.jpg',
    'DC': 'https://static.cricbuzz.com/a/img/v1/72x72/i1/c860062/delhi-capitals.jpg',
    'PBKS': 'https://static.cricbuzz.com/a/img/v1/72x72/i1/c860065/punjab-kings.jpg',
    'RR': 'https://static.cricbuzz.com/a/img/v1/72x72/i1/c860055/rajasthan-royals.jpg',
    'GT': 'https://static.cricbuzz.com/a/img/v1/72x72/i1/c860068/gujarat-titans.jpg',
    'LSG': 'https://static.cricbuzz.com/a/img/v1/72x72/i1/c860070/lucknow-super-giants.jpg',
  };
  return logos[teamCode] || `https://ui-avatars.com/api/?name=${teamCode}&background=random`;
}
