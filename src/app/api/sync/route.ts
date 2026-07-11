import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getIPLSeries, getTeamPlayers } from '@/lib/rapidapi';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { CRICKET_CONFIG } from '@/config/cricket';

export async function GET(req: Request) {
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

  const adminDb = getAdminDb();
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

    // Parse IPL series response - handles both matchDetails and seriesMatches formats
    const matchDetails = data.matchDetails || [];
    const seriesMatches = data.seriesMatches || [];
    
    console.log(`Found ${matchDetails.length} match groups in matchDetails, ${seriesMatches.length} in seriesMatches`);

    // Standard format
    matchDetails.forEach((day: any) => {
      const dayMatches = day.matchDetailsMap?.match || [];
      dayMatches.forEach((m: any) => {
        const info = m.matchInfo;
        if (!info) return;
        processMatch(info);
      });
    });

    // Alternative format: Some series responses have seriesMatches -> seriesAdWrapper -> matches
    seriesMatches.forEach((wrapper: any) => {
      const dayMatches = wrapper.seriesAdWrapper?.matches || [];
      dayMatches.forEach((m: any) => {
        const info = m.matchInfo;
        if (!info) return;
        processMatch(info);
      });
    });

    // Another format: seriesMatches -> matches
    seriesMatches.forEach((wrapper: any) => {
      if (wrapper.matches) {
        wrapper.matches.forEach((m: any) => {
          const info = m.matchInfo;
          if (info) processMatch(info);
        });
      }
    });

    function processMatch(info: any) {
      if (!info || !info.matchId) return;
      const matchIdStr = info.matchId.toString();

      // Avoid duplicates
      if (matches.some(m => m.id === matchIdStr)) return;

      matches.push({
        id: matchIdStr,
        seriesId: info.seriesId,
        team1Id: info.team1?.teamId,
        team1LogoId: info.team1?.imageId,
        team2Id: info.team2?.teamId,
        team2LogoId: info.team2?.imageId,
        team1: info.team1?.teamName || 'TBD',
        team1Short: info.team1?.teamSName || 'TBD',
        team2: info.team2?.teamName || 'TBD',
        team2Short: info.team2?.teamSName || 'TBD',
        date: info.startDate
          ? new Date(parseInt(info.startDate)).toISOString()
          : new Date().toISOString(),
        venue: info.venueInfo?.ground || 'Unknown Venue',
        city: info.venueInfo?.city || 'Unknown',
        status: info.state?.toUpperCase() || 'UPCOMING',
        matchDesc: info.matchDesc || '',
        seriesName: info.seriesName || 'Indian Premier League 2026',
      });
    }

    console.log(`Extracted ${matches.length} IPL matches total`);

    if (matches.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: 'No IPL matches found in API response for series ' + CRICKET_CONFIG.IPL_SERIES_ID, 
          debug: {
            hasMatchDetails: !!data.matchDetails,
            hasSeriesMatches: !!data.seriesMatches,
            raw: Object.keys(data)
          } 
        },
        { status: 404 }
      );
    }

    // Sync all matches from the series, not just upcoming ones
    // Matches are sorted by date
    matches.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const matchesToSync = matches;
    const syncedMatchShortNames: string[] = [];
    const syncedTeams = new Set<number>();

    console.log(`Starting sync for all ${matchesToSync.length} matches in series...`);

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
          team1LogoId: match.team1LogoId,
          team2Id: match.team2Id,
          team2LogoId: match.team2LogoId,
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
          await sleep(1500); // Wait 1.5s to avoid rate limit
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
          await sleep(1500); // Wait 1.5s to avoid rate limit
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
      totalFound: matches.length,
      debug: {
        matchesFound: matches.map(m => m.matchDesc),
        hasMatchDetails: !!data.matchDetails,
        hasSeriesMatches: !!data.seriesMatches
      }
    });
  } catch (error: any) {
    console.error('Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}