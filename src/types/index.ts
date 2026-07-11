export enum PlayerRole {
  BATSMAN = "BATSMAN",
  BOWLER = "BOWLER",
  ALL_ROUNDER = "ALL_ROUNDER",
  WICKET_KEEPER = "WICKET_KEEPER",
}

export interface Player {
  id: string;
  name: string;
  team: string;
  role: string | PlayerRole;
  price: number;
  imageId?: number;
  battingStyle?: string;
  bowlingStyle?: string;
  points?: number;
}

export interface Match {
  id: string;
  team1: string;
  team1Id?: number;
  team1LogoId?: number;
  team2: string;
  team2Id?: number;
  team2LogoId?: number;
  date: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | string;
  tossStatus?: string;
  venue: string;
  matchDesc?: string;
  // Set by POST /api/finalize-match once an admin finalizes scoring.
  scoring?: {
    finalizedAt: string;
    motmPlayerId: string | null;
    playerPoints: Record<string, number>;
  };
}

export interface UserSquad {
  id?: string;
  userId: string;
  matchId: string;
  players: string[]; // Player IDs (Must be exactly 3)
  mvpId: string;     // Must point to one of the selected Player IDs
  createdAt: number;
  totalPoints?: number;
  // Denormalized from the match at save time so Firestore rules can
  // evaluate toss-time/visibility without an extra document read.
  matchTimestamp: string; // match.date (ISO string)
  matchDay: string;       // matchTimestamp truncated to YYYY-MM-DD
  // Denormalized from the authenticated user at save time — the client
  // SDK has no way to look up another user's profile by uid otherwise.
  userDisplayName: string | null;
  userPhotoURL: string | null;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  points: number;
  rank: number;
}

export interface VisibilitySettings {
  hideUntilToss: boolean;
  date: string; // YYYY-MM-DD — the single day this hide rule applies to
}