import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getIPLSeries, getTeamPlayers } from '@/lib/rapidapi';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/adminAuth';
import { CRICKET_CONFIG } from '@/config/cricket';

export async function GET(req: Request) {
  const authResult = await requireAdmin(req);
  if ('error' in authResult) return authResult.error;

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

  const startedAt = Date.now();

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
        // Cricbuzz returns seriesId as a number; CRICKET_CONFIG.IPL_SERIES_ID
        // is a string, and season-scoped queries filter on equality against
        // it — coerce to string here so newly-synced matches match that type.
        seriesId: info.seriesId != null ? String(info.seriesId) : info.seriesId,
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
    // Surfaced in the response so a Cricbuzz shape change (e.g. `player` key
    // renamed) shows up as a visible warning instead of silently syncing a
    // team with zero players.
    const teamsWithNoPlayers: string[] = [];

    console.log(`Starting sync for all ${matchesToSync.length} matches in series...`);

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Accumulate every match doc write into as few batches as possible
    // (Firestore caps a single batch at 500 operations) instead of one
    // round-trip per match.
    for (let i = 0; i < matchesToSync.length; i += 500) {
      const chunk = matchesToSync.slice(i, i + 500);
      const matchBatch = adminDb.batch();

      for (const match of chunk) {
        const t1Ident = match.team1Short || match.team1;
        const t2Ident = match.team2Short || match.team2;

        matchBatch.set(
          adminDb.collection('matches').doc(match.id),
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
        syncedMatchShortNames.push(`${t1Ident} vs ${t2Ident}`);
      }

      await matchBatch.commit();
      console.log(`Committed ${chunk.length} matches`);
    }

    // Syncs one team's roster. Prices are only assigned to players seen for
    // the first time — there's no real pricing model yet, but re-randomizing
    // every existing player's price on every sync made prices look broken.
    async function syncTeamPlayers(teamId: number, teamIdent: string) {
      if (syncedTeams.has(teamId)) return;

      console.log(`Fetching players for team ${teamId} (${teamIdent})`);
      await sleep(1500); // Wait 1.5s to avoid rate limit
      const teamPlayers = await getTeamPlayers(teamId);
      console.log(`Players found for ${teamIdent}:`, teamPlayers?.player?.length || 0);

      if (!teamPlayers || !teamPlayers.player) {
        teamsWithNoPlayers.push(teamIdent);
        return;
      }

      const playerIds: string[] = teamPlayers.player
        .filter((p: any) => p.id)
        .map((p: any) => p.id.toString());
      const existingIds = new Set<string>();
      if (playerIds.length > 0) {
        const existingDocs = await adminDb.getAll(
          ...playerIds.map(id => adminDb.collection('players').doc(id))
        );
        existingDocs.forEach(doc => {
          if (doc.exists) existingIds.add(doc.id);
        });
      }

      const playerBatch = adminDb.batch();
      let role = 'PLAYER';

      for (const p of teamPlayers.player) {
        // Category sub-header parser validation
        if (!p.id) {
          role = p.name || 'PLAYER';
          continue;
        }

        const playerId = p.id.toString();
        const playerRef = adminDb.collection('players').doc(playerId);
        const data: Record<string, unknown> = {
          id: playerId,
          name: p.name,
          role,
          teamId,
          team: teamIdent, // Safely fallback on clean short name identifier
          battingStyle: p.battingStyle || null,
          bowlingStyle: p.bowlingStyle || null,
          imageId: p.imageId || null,
          updatedAt: new Date().toISOString(),
        };
        if (!existingIds.has(playerId)) {
          data.price = 8 + Math.random() * 3;
        }
        playerBatch.set(playerRef, data, { merge: true });
      }

      await playerBatch.commit();
      syncedTeams.add(teamId);
      console.log(`Synced players for ${teamIdent}`);
    }

    for (const match of matchesToSync) {
      console.log(`Syncing ${match.matchDesc}: ${match.team1} vs ${match.team2}`);

      const t1Ident = match.team1Short || match.team1;
      const t2Ident = match.team2Short || match.team2;

      if (match.team1Id && match.team1 !== 'TBC') {
        await syncTeamPlayers(match.team1Id, t1Ident);
      }
      if (match.team2Id && match.team2 !== 'TBC') {
        await syncTeamPlayers(match.team2Id, t2Ident);
      }
    }

    const warning = teamsWithNoPlayers.length > 0
      ? `Cricbuzz returned no players for: ${[...new Set(teamsWithNoPlayers)].join(', ')}. ` +
        `Their player-list response shape may have changed — check before relying on synced squads for these teams.`
      : undefined;
    if (warning) console.warn(warning);

    const durationMs = Date.now() - startedAt;
    console.log(`Sync completed in ${durationMs}ms`);

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedMatchShortNames.length} IPL ${CRICKET_CONFIG.IPL_SEASON} fixtures.`,
      matchesSynced: syncedMatchShortNames,
      totalFound: matches.length,
      warning,
      durationMs,
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