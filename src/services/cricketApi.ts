import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Match, Player, PlayerRole } from "@/types";

export async function syncMatchesFromCricbuzz(): Promise<void> {
  const apiKey = process.env.RAPIDAPI_KEY || process.env.NEXT_PUBLIC_RAPIDAPI_KEY;
  if (!apiKey) {
    console.error("RAPIDAPI_KEY not found");
    // For demo/dev, we could seed mock data if API is missing
    return;
  }

  try {
    // Note: In a real app, this should be a server-side call
    const url = 'https://cricbuzz-cricket.p.rapidapi.com/matches/v1/recent';
    const response = await fetch(url, {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com'
      }
    });

    const data = await response.json();
    console.log("Cricbuzz Data:", data);

    // Placeholder: Process and save to 'Matches' collection in Firestore
    // For each match in data.typeMatches...
  } catch (error) {
    console.error("Sync failed:", error);
  }
}

/**
 * Seeds the database with some initial data for testing
 */
export async function seedDatabase(): Promise<void> {
  const matches = [
    {
      id: 'match1',
      team1: 'CSK',
      team2: 'MI',
      date: '2026-05-15T19:30:00Z',
      status: 'UPCOMING',
      venue: 'Wankhede Stadium, Mumbai',
    },
    {
      id: 'match2',
      team1: 'RCB',
      team2: 'KKR',
      date: '2026-05-16T19:30:00Z',
      status: 'UPCOMING',
      venue: 'M. Chinnaswamy Stadium, Bengaluru',
    },
  ];

  const players = [
    { id: 'p1', name: 'MS Dhoni', team: 'CSK', role: PlayerRole.WICKET_KEEPER, price: 10 },
    { id: 'p2', name: 'Ruturaj Gaikwad', team: 'CSK', role: PlayerRole.BATSMAN, price: 9.5 },
    { id: 'p3', name: 'Ravindra Jadeja', team: 'CSK', role: PlayerRole.ALL_ROUNDER, price: 9 },
    { id: 'p4', name: 'Rohit Sharma', team: 'MI', role: PlayerRole.BATSMAN, price: 10 },
    { id: 'p5', name: 'Jasprit Bumrah', team: 'MI', role: PlayerRole.BOWLER, price: 9.5 },
    { id: 'p6', name: 'Hardik Pandya', team: 'MI', role: PlayerRole.ALL_ROUNDER, price: 9 },
    { id: 'p7', name: 'Virat Kohli', team: 'RCB', role: PlayerRole.BATSMAN, price: 10.5 },
    { id: 'p8', name: 'Glenn Maxwell', team: 'RCB', role: PlayerRole.ALL_ROUNDER, price: 9.5 },
    { id: 'p9', name: 'Mohammed Siraj', team: 'RCB', role: PlayerRole.BOWLER, price: 8.5 },
  ];

  // Save matches
  for (const m of matches) {
    await setDoc(doc(db, "Matches", m.id), m);
  }

  // Save players
  for (const p of players) {
    await setDoc(doc(db, "Players", p.id), p);
  }
  
  console.log("Database seeded successfully!");
}
