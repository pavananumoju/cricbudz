import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Player, Match, UserSquad, VisibilitySettings } from '@/types';
import { CRICKET_CONFIG } from '@/config/cricket';
import { ApiError } from '@/lib/errors';

// The season's first synced match's date — used to number leaderboard
// weeks ("Week 1", "Week 2", ...) relative to when the season actually
// started, rather than an arbitrary ISO calendar week number. Scoped to
// the current series so a past season's matches don't push "Week 1" back.
//
// Errors propagate to the caller instead of being swallowed here — a
// permission/network failure must be visibly distinguishable from "no
// matches synced yet" (an empty snapshot, which legitimately returns null).
export async function getEarliestMatchDate(): Promise<string | null> {
  const q = query(
    collection(db, 'matches'),
    where('seriesId', '==', CRICKET_CONFIG.IPL_SERIES_ID),
    orderBy('date', 'asc'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return (snap.docs[0].data() as Match).date;
}

// Scoped to the current series (CRICKET_CONFIG.IPL_SERIES_ID) so fixtures
// from a past season synced earlier don't leak into the current one's
// match list/leaderboard week count.
export async function getMatches(): Promise<Match[]> {
  const q = query(
    collection(db, 'matches'),
    where('seriesId', '==', CRICKET_CONFIG.IPL_SERIES_ID),
    orderBy('date', 'asc')
  );

  const snap = await getDocs(q);

  return snap.docs.map(
    d => d.data() as Match
  );
}

export async function getMatchById(
  id: string
): Promise<Match | undefined> {
  const snap = await getDoc(
    doc(db, 'matches', id)
  );

  if (snap.exists()) {
    return snap.data() as Match;
  }

  return undefined;
}

export async function getPlayersByTeams(
  team1: string,
  team2: string
): Promise<Player[]> {
  // Exact team short name match (RCB, MI, CSK etc.)
  const q1 = query(
    collection(db, 'players'),
    where('team', '==', team1)
  );

  const q2 = query(
    collection(db, 'players'),
    where('team', '==', team2)
  );

  const [s1, s2] = await Promise.all([
    getDocs(q1),
    getDocs(q2),
  ]);

  return [
    ...s1.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name || '',
        team: data.team || '',
        teamId: data.teamId,
        role: data.role || '',
        price: data.price || 0,
        imageId: data.imageId,
        battingStyle: data.battingStyle,
        bowlingStyle: data.bowlingStyle,
        points: data.points
      } as Player;
    }),
    ...s2.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name || '',
        team: data.team || '',
        teamId: data.teamId,
        role: data.role || '',
        price: data.price || 0,
        imageId: data.imageId,
        battingStyle: data.battingStyle,
        bowlingStyle: data.bowlingStyle,
        points: data.points
      } as Player;
    }),
  ];
}

export async function saveUserSquad(squad: Omit<UserSquad, 'userId' | 'createdAt' | 'matchDay' | 'userDisplayName' | 'userPhotoURL'>) {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const squadId = `${user.uid}_${squad.matchId}`;
  await setDoc(doc(db, 'userSquads', squadId), {
    ...squad,
    // Left as a UTC-day slice, NOT getMatchDayIST(): firestore.rules'
    // matchesSourceOfTruth() enforces matchDay as a literal prefix of
    // matchTimestamp (a full ISO/UTC string) via regex, and rules has no
    // timezone-aware date function to check an IST day instead. Safe in
    // practice — IPL matches only ever start at 10:00 or 14:00 UTC
    // (15:30/19:30 IST), so this UTC slice always equals the IST day for
    // real match data (verified against all synced matches) — but an
    // arbitrary UTC timestamp late in the evening would diverge, so don't
    // swap this specific derivation for getMatchDayIST() without also
    // updating the rule.
    matchDay: squad.matchTimestamp.slice(0, 10),
    userId: user.uid,
    userDisplayName: user.displayName || null,
    userPhotoURL: user.photoURL || null,
    createdAt: Date.now()
  });
}

export async function deleteUserSquad(matchId: string) {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');

  const squadId = `${userId}_${matchId}`;
  await deleteDoc(doc(db, 'userSquads', squadId));
}

export async function getUserSquads(): Promise<UserSquad[]> {
  const userId = auth.currentUser?.uid;
  if (!userId) return [];

  const q = query(collection(db, 'userSquads'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as UserSquad);
}

// Returns every user's squad for a match, filtered by the same visibility
// policy the Firestore rule expresses (own squad, or others' once toss has
// passed / the visibility toggle isn't active for that day). Goes through
// GET /api/matches/[matchId]/squads (server-side, Admin SDK) rather than a
// direct Firestore query: a raw client query can't be proven safe by
// Firestore's rules engine for a match on the visibility toggle's own day,
// even once toss has passed for it, because hasTossPassed() depends on a
// per-document field no query filter can usefully pin (see firestore.rules
// and rules-tests/ for the full reasoning). The route reimplements the
// same policy in code, using the real match doc and the server clock.
export async function getSquadsForMatch(matchId: string): Promise<UserSquad[]> {
  const user = auth.currentUser;
  if (!user) return [];
  const token = await user.getIdToken();
  const res = await fetch(`/api/matches/${matchId}/squads`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new ApiError(`GET /api/matches/${matchId}/squads failed: ${res.status}`, res.status);
  const data = (await res.json()) as { squads: UserSquad[] };
  return data.squads;
}

// Every scored squad whose matchDay falls within [startDay, endDay]
// (inclusive, both YYYY-MM-DD) — used to compute a week's leaderboard.
// Goes through GET /api/leaderboard (server-side, Admin SDK) rather than a
// direct Firestore query: this matchDay RANGE filter can't be proven
// against the submission-visibility toggle's per-document Firestore rule
// (see firestore.rules / rules-tests/), so a client-side query for it is
// rejected outright on any day the toggle is on. See the route's comment
// for how it applies the equivalent policy in code instead.
export async function getSquadsInDateRange(startDay: string, endDay: string): Promise<UserSquad[]> {
  const user = auth.currentUser;
  if (!user) return [];
  const token = await user.getIdToken();
  const res = await fetch(`/api/leaderboard?startDay=${startDay}&endDay=${endDay}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new ApiError(`GET /api/leaderboard failed: ${res.status}`, res.status);
  const data = (await res.json()) as { squads: UserSquad[] };
  return data.squads;
}

export async function getVisibilitySettings(): Promise<VisibilitySettings | null> {
  const snap = await getDoc(doc(db, 'settings', 'visibility'));
  return snap.exists() ? (snap.data() as VisibilitySettings) : null;
}

export async function setVisibilitySettings(settings: VisibilitySettings) {
  const user = auth.currentUser;
  await setDoc(doc(db, 'settings', 'visibility'), {
    ...settings,
    updatedBy: user?.uid ?? null,
    updatedAt: Date.now(),
  });
}
