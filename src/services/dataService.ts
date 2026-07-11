import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Player, Match, UserSquad } from '@/types';

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

export async function saveUserSquad(squad: Omit<UserSquad, 'userId' | 'createdAt'>) {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');
  
  const squadId = `${userId}_${squad.matchId}`;
  await setDoc(doc(db, 'userSquads', squadId), {
    ...squad,
    userId,
    createdAt: Date.now()
  });
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
