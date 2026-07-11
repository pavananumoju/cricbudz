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
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Player, Match, UserSquad, VisibilitySettings } from '@/types';

export async function getMatches(): Promise<Match[]> {
  try {
    const q = query(
      collection(db, 'matches'),
      orderBy('date', 'asc')
    );

    const snap = await getDocs(q);

    const matches = snap.docs.map(
      d => d.data() as Match
    );

    console.log(
      `Fetched ${matches.length} matches`
    );

    return matches;
  } catch (err) {
    console.error(
      'getMatches error:',
      err
    );

    return [];
  }
}

export async function getMatchById(
  id: string
): Promise<Match | undefined> {
  try {
    const snap = await getDoc(
      doc(db, 'matches', id)
    );

    if (snap.exists()) {
      return snap.data() as Match;
    }

    return undefined;
  } catch (err) {
    console.error(
      'getMatchById error:',
      err
    );

    return undefined;
  }
}

export async function getPlayers(): Promise<Player[]> {
  try {
    const snap = await getDocs(collection(db, 'players'));
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as Player));
  } catch (err) {
    console.error('getPlayers error:', err);
    return [];
  }
}

export async function getPlayersByTeams(
  team1: string,
  team2: string
): Promise<Player[]> {
  try {
    console.log(
      `Fetching players for teams: ${team1}, ${team2}`
    );

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

    const players = [
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

    console.log(
      `Fetched ${players.length} players`
    );

    return players;
  } catch (err) {
    console.error(
      'getPlayersByTeams error:',
      err
    );

    return [];
  }
}

export async function saveUserSquad(squad: Omit<UserSquad, 'userId' | 'createdAt' | 'matchDay' | 'userDisplayName' | 'userPhotoURL'>) {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const squadId = `${user.uid}_${squad.matchId}`;
  await setDoc(doc(db, 'userSquads', squadId), {
    ...squad,
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
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return [];

    const q = query(collection(db, 'userSquads'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as UserSquad);
  } catch (err) {
    console.error('getUserSquads error:', err);
    return [];
  }
}

// Returns every user's squad for a match. Firestore rules silently exclude
// squads the current user isn't allowed to see yet (own squad, or others'
// once toss has passed / the visibility toggle isn't active for that day) —
// this never throws for a partially-visible result set.
export async function getSquadsForMatch(matchId: string): Promise<UserSquad[]> {
  try {
    const q = query(collection(db, 'userSquads'), where('matchId', '==', matchId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as UserSquad);
  } catch (err) {
    console.error('getSquadsForMatch error:', err);
    return [];
  }
}

// Every scored squad whose matchDay falls within [startDay, endDay]
// (inclusive, both YYYY-MM-DD) — used to compute a week's leaderboard.
// Firestore rules apply the same per-document visibility as any other
// userSquads read, but a *scored* squad only exists once its match is
// completed, which is always past toss — so these are visible to everyone
// regardless of the submission-visibility toggle.
export async function getSquadsInDateRange(startDay: string, endDay: string): Promise<UserSquad[]> {
  try {
    const q = query(
      collection(db, 'userSquads'),
      where('matchDay', '>=', startDay),
      where('matchDay', '<=', endDay)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as UserSquad);
  } catch (err) {
    console.error('getSquadsInDateRange error:', err);
    return [];
  }
}

export async function getVisibilitySettings(): Promise<VisibilitySettings | null> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'visibility'));
    return snap.exists() ? (snap.data() as VisibilitySettings) : null;
  } catch (err) {
    console.error('getVisibilitySettings error:', err);
    return null;
  }
}

export async function setVisibilitySettings(settings: VisibilitySettings) {
  await setDoc(doc(db, 'settings', 'visibility'), settings);
}
