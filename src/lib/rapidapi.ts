const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'cricbuzz-cricket.p.rapidapi.com';
import { CRICKET_CONFIG } from '@/config/cricket';

async function rapidFetch(endpoint: string) {
  if (!RAPIDAPI_KEY) {
    throw new Error('RAPIDAPI_KEY is not defined in environment variables');
  }

  const url = `https://${RAPIDAPI_HOST}/${endpoint}`;
  console.log('Calling URL:', url);
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': RAPIDAPI_HOST,
    },
  });

  if (!response.ok) {
  const text = await response.text();

  throw new Error(
    `RapidAPI request failed: ${response.status} ${response.statusText} - ${text}`
  );
}

  const text = await response.text();

if (!text) {
  return {};
}

try {
  return JSON.parse(text);
} catch (err) {
  console.error(
    'Failed to parse response:',
    text
  );
  throw err;
}
}

export async function getIPLSeries() {
  return rapidFetch(
    `series/v1/${CRICKET_CONFIG.IPL_SERIES_ID}`
  );
}

export async function getMatchSquads(matchId: string) {
  return rapidFetch(`m-id/v1/squads/${matchId}`);
}

export async function getTeamPlayers(
  teamId: number
) {
  return rapidFetch(
    `teams/v1/${teamId}/players`
  );
}