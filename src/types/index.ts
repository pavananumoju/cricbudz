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
}

export interface UserSquad {
  id?: string;
  userId: string;
  matchId: string;
  players: string[]; // Player IDs (Must be exactly 3)
  mvpId: string;     // Must point to one of the selected Player IDs
  createdAt: number;
  totalPoints?: number;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  points: number;
  rank: number;
}