import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getMatchScorecard } from '@/lib/rapidapi';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/adminAuth';
import {
  buildPlayerNameLookup,
  parseScorecard,
  calculatePlayerPoints,
  calculateSquadScore,
  validateScorecardResponse,
  type ScorecardResponse,
} from '@/lib/scoring';

export async function POST(req: Request) {
  const authResult = await requireAdmin(req);
  if ('error' in authResult) return authResult.error;

  let body: { matchId?: string; motmPlayerId?: string | null; force?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { matchId, motmPlayerId, force } = body;
  if (!matchId) {
    return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
  }

  const adminDb = getAdminDb();

  const matchSnap = await adminDb.collection('matches').doc(matchId).get();
  if (!matchSnap.exists) {
    return NextResponse.json({ error: `Match ${matchId} not found` }, { status: 404 });
  }
  const match = matchSnap.data() as { team1: string; team2: string };

  let scorecard: ScorecardResponse;
  try {
    const raw = await getMatchScorecard(matchId);
    scorecard = validateScorecardResponse(raw);
  } catch (error) {
    console.error('Scorecard fetch/validation failed:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch scorecard from RapidAPI';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Require an explicit `true`, not just "not false" — a missing/undefined
  // ismatchcomplete field is not proof the match is done, and scoring a
  // half-played match would silently write wrong points. `force: true`
  // is the deliberate override for the rare legitimate case (an abandoned
  // or rain-shortened match Cricbuzz never flags as complete).
  if (scorecard?.ismatchcomplete !== true && !force) {
    return NextResponse.json(
      {
        error:
          'Cricbuzz has not confirmed this match is complete (ismatchcomplete is false or missing). ' +
          'Finalize once it has actually ended, or retry with force to override for an edge case like an abandoned match.',
      },
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
  const { stats: rawStatsById, unmatched } = parseScorecard(scorecard, lookup);
  const hasUnmatched = unmatched.batsmen.length > 0 || unmatched.bowlers.length > 0 || unmatched.fielders.length > 0;

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
      warnings: hasUnmatched ? unmatched : null,
    },
  });

  batch.set(adminDb.collection('auditLog').doc(), {
    action: 'finalize_match',
    actorUid: authResult.uid,
    matchId,
    motmPlayerId: motmPlayerId ?? null,
    at: new Date().toISOString(),
  });

  await batch.commit();

  return NextResponse.json({
    success: true,
    matchId,
    squadsUpdated,
    playerPoints,
    unmatched,
  });
}
