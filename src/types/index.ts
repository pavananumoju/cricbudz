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
  role: PlayerRole;
  price: number;
  points?: number;
}

export interface Match {
  id: string;
  team1: string;
  team2: string;
  date: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  tossStatus?: string;
  venue: string;
}

export interface UserSquad {
  userId: string;
  matchId: string;
  players: string[]; // Player IDs (exactly 3)
  mvpId: string;     // Player ID
  locked: boolean;
  createdAt: number;
  totalPoints?: number;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  points: number;
  rank: number;
}
