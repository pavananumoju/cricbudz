import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getMatchScorecard } from '@/lib/rapidapi';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { buildPlayerNameLookup, parseScorecard, calculatePlayerPoints, calculateSquadScore } from '@/lib/scoring';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
  }
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    if (decoded.admin !== true) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  let body: { matchId?: string; motmPlayerId?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { matchId, motmPlayerId } = body;
  if (!matchId) {
    return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
  }

  const adminDb = getAdminDb();

  const matchSnap = await adminDb.collection('matches').doc(matchId).get();
  if (!matchSnap.exists) {
    return NextResponse.json({ error: `Match ${matchId} not found` }, { status: 404 });
  }
  const match = matchSnap.data() as { team1: string; team2: string };

  let scorecard;
  try {
    scorecard = await getMatchScorecard(matchId);
  } catch (error) {
    console.error('Scorecard fetch failed:', error);
    return NextResponse.json({ error: 'Failed to fetch scorecard from RapidAPI' }, { status: 502 });
  }

  if (scorecard?.ismatchcomplete === false) {
    return NextResponse.json(
      { error: 'Cricbuzz reports this match is not yet complete. Finalize once it has actually ended.' },
      { status: 409 }
    );
  }

  const [team1Players, team2Players] = await Promise.all([
    adminDb.collection('players').where('team', '==', match.team1).get(),
    adminDb.collection('players').where('team', '==', match.team2).get(),
  ]);
  const players = [...team1Players.docs, ...team2Players.docs].map((d) => ({ id: d.id, name: d.data().name as string }));

  if (players.length === 0) {
    return NextResponse.json({ error: `No synced players found for ${match.team1}/${match.team2}` }, { status: 400 });
  }

  const lookup = buildPlayerNameLookup(players);
  const rawStatsById = parseScorecard(scorecard, lookup);

  const playerPoints: Record<string, number> = {};
  for (const player of players) {
    const stats = rawStatsById.get(player.id);
    if (!stats) continue;
    playerPoints[player.id] = calculatePlayerPoints(stats, player.id === motmPlayerId);
  }
  // The MOTM bonus applies even if they didn't otherwise register any raw
  // stat we tracked (rare, but possible for a bonus-point-only award).
  if (motmPlayerId && !(motmPlayerId in playerPoints)) {
    playerPoints[motmPlayerId] = calculatePlayerPoints({ runs: 0, wickets: 0, catches: 0, runouts: 0, stumpings: 0, dotBalls: 0 }, true);
  }

  const playerPointsMap = new Map(Object.entries(playerPoints));

  const squadsSnap = await adminDb.collection('userSquads').where('matchId', '==', matchId).get();
  const batch = adminDb.batch();
  let squadsUpdated = 0;
  squadsSnap.docs.forEach((doc) => {
    const squad = doc.data() as { players: string[]; mvpId: string };
    const totalPoints = calculateSquadScore(squad.players, squad.mvpId, playerPointsMap);
    batch.update(doc.ref, { totalPoints });
    squadsUpdated += 1;
  });

  batch.update(matchSnap.ref, {
    scoring: {
      finalizedAt: new Date().toISOString(),
      motmPlayerId: motmPlayerId ?? null,
      playerPoints,
    },
  });

  await batch.commit();

  return NextResponse.json({
    success: true,
    matchId,
    squadsUpdated,
    playerPoints,
  });
}
