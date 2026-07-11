import { SCORING_RULES, MVP_MULTIPLIER } from './scoringRules';

export interface RawPlayerStats {
  runs: number;
  wickets: number;
  catches: number;
  runouts: number;
  stumpings: number;
  dotBalls: number;
}

export function emptyStats(): RawPlayerStats {
  return { runs: 0, wickets: 0, catches: 0, runouts: 0, stumpings: 0, dotBalls: 0 };
}

interface ScorecardBatsman {
  name: string;
  runs?: number;
  outdec?: string;
}
interface ScorecardBowler {
  name: string;
  wickets?: number;
  dots?: number;
}
interface ScorecardInnings {
  batsman?: ScorecardBatsman[];
  bowler?: ScorecardBowler[];
}
export interface ScorecardResponse {
  scorecard?: ScorecardInnings[];
  ismatchcomplete?: boolean;
}

// Maps a normalized player name (as it appears for the two playing squads)
// to our Firestore player id. Fielder credit comes from free-text parsing
// of `outdec`, so this is a best-effort name match, not guaranteed-correct
// for every scorecard formatting quirk.
//
// Cricbuzz's own data is internally inconsistent about this: in a real
// match, a player's own batting row said "Philip Salt" while the *same*
// match's dismissal text for other batsmen credited catches to "Phil
// Salt" — an exact match on the full name alone misses this. `surnames`
// is a same-shape fallback map keyed by last-name-only, used only when
// it's unambiguous (exactly one player in the two squads shares that
// surname), to recover cases like this without risking a wrong credit
// when two players share a surname.
export interface PlayerNameLookup {
  full: Map<string, string>;
  surnames: Map<string, string>;
}

export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function lastWord(name: string): string {
  const parts = normalizeName(name).split(' ');
  return parts[parts.length - 1];
}

export function buildPlayerNameLookup(players: { id: string; name: string }[]): PlayerNameLookup {
  const full = new Map<string, string>();
  const surnameCounts = new Map<string, number>();
  const surnames = new Map<string, string>();

  for (const p of players) {
    full.set(normalizeName(p.name), p.id);
    const surname = lastWord(p.name);
    surnameCounts.set(surname, (surnameCounts.get(surname) ?? 0) + 1);
    surnames.set(surname, p.id);
  }
  // Only keep surname entries that are unique across the two squads —
  // an ambiguous surname is worse than no fallback match at all.
  for (const [surname, count] of surnameCounts) {
    if (count > 1) surnames.delete(surname);
  }

  return { full, surnames };
}

function resolvePlayerId(lookup: PlayerNameLookup, name: string): string | undefined {
  return lookup.full.get(normalizeName(name)) ?? lookup.surnames.get(lastWord(name));
}

function creditFielder(
  statsById: Map<string, RawPlayerStats>,
  lookup: PlayerNameLookup,
  fielderName: string,
  kind: 'catches' | 'runouts' | 'stumpings'
) {
  const id = resolvePlayerId(lookup, fielderName);
  if (!id) return;
  const stats = statsById.get(id) ?? emptyStats();
  stats[kind] += 1;
  statsById.set(id, stats);
}

// Parses a batsman's dismissal text and credits the fielder(s) involved.
// Handles "c Fielder b Bowler", "c & b Bowler" (caught and bowled),
// "st Keeper b Bowler", and "run out (Fielder)" / "run out (F1/F2)" for a
// multi-fielder run-out (each named fielder gets full run-out credit —
// a deliberate simplification, not a 50/50 split). Bowled, lbw, not out,
// hit wicket, and retired-hurt correctly award no fielding credit.
export function creditDismissal(
  statsById: Map<string, RawPlayerStats>,
  lookup: PlayerNameLookup,
  outdec: string | undefined
) {
  if (!outdec) return;
  const text = outdec.trim();

  let m = text.match(/^c\s*(?:&|and)\s*b\s+(.+)$/i);
  if (m) {
    creditFielder(statsById, lookup, m[1], 'catches');
    return;
  }

  m = text.match(/^c\s+(.+?)\s+b\s+.+$/i);
  if (m) {
    creditFielder(statsById, lookup, m[1], 'catches');
    return;
  }

  m = text.match(/^st\s+(.+?)\s+b\s+.+$/i);
  if (m) {
    creditFielder(statsById, lookup, m[1], 'stumpings');
    return;
  }

  m = text.match(/^run\s*out\s*\((.+?)\)$/i);
  if (m) {
    m[1]
      .split(/[/,]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((fielder) => creditFielder(statsById, lookup, fielder, 'runouts'));
  }
}

export function parseScorecard(scorecard: ScorecardResponse, lookup: PlayerNameLookup): Map<string, RawPlayerStats> {
  const statsById = new Map<string, RawPlayerStats>();

  for (const inning of scorecard.scorecard ?? []) {
    for (const batsman of inning.batsman ?? []) {
      const id = resolvePlayerId(lookup, batsman.name);
      if (id) {
        const stats = statsById.get(id) ?? emptyStats();
        stats.runs += batsman.runs ?? 0;
        statsById.set(id, stats);
      }
      creditDismissal(statsById, lookup, batsman.outdec);
    }

    for (const bowler of inning.bowler ?? []) {
      const id = resolvePlayerId(lookup, bowler.name);
      if (!id) continue;
      const stats = statsById.get(id) ?? emptyStats();
      stats.wickets += bowler.wickets ?? 0;
      stats.dotBalls += bowler.dots ?? 0;
      statsById.set(id, stats);
    }
  }

  return statsById;
}

// Half-century/century and 3-/5-wicket-haul bonuses don't stack — only the
// higher threshold reached is awarded.
export function calculatePlayerPoints(stats: RawPlayerStats, isMotm: boolean): number {
  let points = 0;
  points += stats.runs * SCORING_RULES.RUN;
  points += stats.wickets * SCORING_RULES.WICKET;
  points += stats.catches * SCORING_RULES.CATCH;
  points += stats.runouts * SCORING_RULES.RUNOUT;
  points += stats.stumpings * SCORING_RULES.STUMPING;
  points += stats.dotBalls * SCORING_RULES.DOT_BALL;

  if (stats.runs >= 100) points += SCORING_RULES.CENTURY;
  else if (stats.runs >= 50) points += SCORING_RULES.HALF_CENTURY;

  if (stats.wickets >= 5) points += SCORING_RULES.FIVE_WICKET_HAUL;
  else if (stats.wickets >= 3) points += SCORING_RULES.THREE_WICKET_HAUL;

  if (isMotm) points += SCORING_RULES.MAN_OF_THE_MATCH;

  return points;
}

// A user's match score = sum of their 3 players' points, with the MVP's
// contribution doubled.
export function calculateSquadScore(players: string[], mvpId: string, playerPoints: Map<string, number>): number {
  return players.reduce((total, playerId) => {
    const base = playerPoints.get(playerId) ?? 0;
    return total + (playerId === mvpId ? base * MVP_MULTIPLIER : base);
  }, 0);
}
