import { NextResponse } from 'next/server';
import { getIPLSeries, getTeamPlayers } from '@/lib/rapidapi';
import { adminDb } from '@/lib/firebase-admin';
import { CRICKET_CONFIG } from '@/config/cricket';

export async function GET() {
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

  if (!RAPIDAPI_KEY) {
    return NextResponse.json(
      {
        error: 'RAPIDAPI_KEY is missing.',
        instructions: 'Add RAPIDAPI_KEY in .env.local',
      },
      { status: 400 }
    );
  }

  try {
    console.log('Fetching IPL 2026 schedule...');
    const data = await getIPLSeries();
    const matches: any[] = [];

    // Parse IPL series response
    const matchDetails = data.matchDetails || [];
    console.log(`Found ${matchDetails.length} match days`);

    matchDetails.forEach((day: any) => {
      const dayMatches = day.matchDetailsMap?.match || [];

      dayMatches.forEach((m: any) => {
        const info = m.matchInfo;
        if (!info) return;

        matches.push({
          id: info.matchId.toString(),
          seriesId: info.seriesId,
          team1Id: info.team1?.teamId,
          team2Id: info.team2?.teamId,
          team1: info.team1?.teamName || 'TBD',
          team1Short: info.team1?.teamSName || 'TBD',
          team2: info.team2?.teamName || 'TBD',
          team2Short: info.team2?.teamSName || 'TBD',
          date: info.startDate
            ? new Date(parseInt(info.startDate)).toISOString()
            : new Date().toISOString(),
          venue: info.venueInfo?.ground || 'Unknown Venue',
          city: info.venueInfo?.city || 'Unknown',
          status: info.state || 'Upcoming',
          matchDesc: info.matchDesc || '',
          seriesName: info.seriesName || 'Indian Premier League 2026',
        });
      });
    });

    console.log(`Extracted ${matches.length} IPL matches`);

    if (matches.length === 0) {
      return NextResponse.json(
        { message: 'No IPL matches found.', debug: data },
        { status: 404 }
      );
    }

    // Only future/upcoming matches
    const now = new Date();
    const upcomingMatches = matches.filter(m => new Date(m.date) >= now);

    upcomingMatches.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const matchesToSync = upcomingMatches;
    const syncedMatchShortNames: string[] = [];
    const syncedTeams = new Set<number>();

    console.log(`Starting sync for ${matchesToSync.length} matches...`);

    for (const match of matchesToSync) {
      console.log(`Syncing ${match.matchDesc}: ${match.team1} vs ${match.team2}`);

      const batch = adminDb.batch();
      const matchRef = adminDb.collection('matches').doc(match.id);

      const t1Ident = match.team1Short || match.team1;
      const t2Ident = match.team2Short || match.team2;

      batch.set(
        matchRef,
        {
          id: match.id,
          seriesId: match.seriesId,
          team1Id: match.team1Id,
          team2Id: match.team2Id,
          team1: t1Ident,
          team2: t2Ident,
          date: match.date,
          venue: match.venue,
          city: match.city,
          status: match.status,
          matchDesc: match.matchDesc,
          seriesName: match.seriesName,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      try {
        await batch.commit();
        syncedMatchShortNames.push(`${t1Ident} vs ${t2Ident}`);
        console.log(`Successfully committed match ${match.id}`);

        // Sync team1 players
        if (match.team1Id && match.team1 !== 'TBC' && !syncedTeams.has(match.team1Id)) {
          console.log(`Fetching players for team ${match.team1Id} (${t1Ident})`);
          const teamPlayers = await getTeamPlayers(match.team1Id);
          console.log(`Players found for ${match.team1}:`, teamPlayers?.player?.length || 0);
          
          if (teamPlayers && teamPlayers.player) {
            const playerBatch = adminDb.batch();
            let t1Role = 'PLAYER'; // Scoped strictly to team 1 transaction block

            for (const p of teamPlayers.player) {
              // Category sub-header parser validation
              if (!p.id) {
                t1Role = p.name || 'PLAYER';
                continue;
              }

              const playerRef = adminDb.collection('players').doc(p.id.toString());
              playerBatch.set(
                playerRef,
                {
                  id: p.id.toString(),
                  name: p.name,
                  role: t1Role,
                  teamId: match.team1Id,
                  team: t1Ident, // Safely fallback on clean short name identifier
                  battingStyle: p.battingStyle || null,
                  bowlingStyle: p.bowlingStyle || null,
                  imageId: p.imageId || null,
                  price: 8 + Math.random() * 3,
                  updatedAt: new Date().toISOString(),
                },
                { merge: true }
              );
            }
            await playerBatch.commit();
            syncedTeams.add(match.team1Id);
            console.log(`Synced players for ${match.team1}`);
          }
        }

        // Sync team2 players
        if (match.team2Id && match.team2 !== 'TBC' && !syncedTeams.has(match.team2Id)) {
          console.log(`Fetching players for team ${match.team2Id} (${t2Ident})`);
          const teamPlayers = await getTeamPlayers(match.team2Id);
          console.log(`Players found for ${match.team2}:`, teamPlayers?.player?.length || 0);

          if (teamPlayers && teamPlayers.player) {
            const playerBatch = adminDb.batch();
            let t2Role = 'PLAYER'; // Scoped strictly to team 2 transaction block

            for (const p of teamPlayers.player) {
              // Category sub-header parser validation
              if (!p.id) {
                t2Role = p.name || 'PLAYER';
                continue;
              }

              const playerRef = adminDb.collection('players').doc(p.id.toString());
              playerBatch.set(
                playerRef,
                {
                  id: p.id.toString(),
                  name: p.name,
                  role: t2Role,
                  teamId: match.team2Id,
                  team: t2Ident, // Safely fallback on clean short name identifier
                  battingStyle: p.battingStyle || null,
                  bowlingStyle: p.bowlingStyle || null,
                  imageId: p.imageId || null,
                  price: 8 + Math.random() * 3,
                  updatedAt: new Date().toISOString(),
                },
                { merge: true }
              );
            }
            await playerBatch.commit();
            syncedTeams.add(match.team2Id);
            console.log(`Synced players for ${match.team2}`);
          }
        }
      } catch (err) {
        console.error(`Batch commit failed for ${match.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedMatchShortNames.length} IPL ${CRICKET_CONFIG.IPL_SEASON} fixtures.`,
      matchesSynced: syncedMatchShortNames,
    });
  } catch (error: any) {
    console.error('Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}