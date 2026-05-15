export const MOCK_TEAMS = ["RCB", "CSK", "MI", "GT", "KKR", "RR", "SRH", "LSG", "DC", "PBKS"];

export const MOCK_MATCHES = [
  { id: '1', team1: 'RCB', team2: 'CSK', date: '2026-03-20T19:30:00Z', venue: 'Chinnaswamy Stadium', status: 'UPCOMING' },
  { id: '2', team1: 'MI', team2: 'GT', date: '2026-03-21T19:30:00Z', venue: 'Wankhede Stadium', status: 'UPCOMING' },
  { id: '3', team1: 'KKR', team2: 'RR', date: '2026-03-22T19:30:00Z', venue: 'Eden Gardens', status: 'UPCOMING' },
];

export const MOCK_PLAYERS = [
  // RCB
  { id: 'p1', name: 'Virat Kohli', team: 'RCB', role: 'BAT', price: 10.5 },
  { id: 'p2', name: 'Faf du Plessis', team: 'RCB', role: 'BAT', price: 9.5 },
  { id: 'p3', name: 'Glenn Maxwell', team: 'RCB', role: 'ALL-ROUND', price: 10.0 },
  { id: 'p4', name: 'Mohammed Siraj', team: 'RCB', role: 'BOWL', price: 9.0 },
  
  // CSK
  { id: 'p5', name: 'MS Dhoni', team: 'CSK', role: 'WK', price: 10.0 },
  { id: 'p6', name: 'Ruturaj Gaikwad', team: 'CSK', role: 'BAT', price: 10.0 },
  { id: 'p7', name: 'Ravindra Jadeja', team: 'CSK', role: 'ALL-ROUND', price: 10.5 },
  { id: 'p8', name: 'Deepak Chahar', team: 'CSK', role: 'BOWL', price: 8.5 },

  // MI
  { id: 'p9', name: 'Rohit Sharma', team: 'MI', role: 'BAT', price: 10.5 },
  { id: 'p10', name: 'Jasprit Bumrah', team: 'MI', role: 'BOWL', price: 11.0 },
  { id: 'p11', name: 'Hardik Pandya', team: 'MI', role: 'ALL-ROUND', price: 10.0 },
  { id: 'p12', name: 'Suryakumar Yadav', team: 'MI', role: 'BAT', price: 10.0 },

  // GT
  { id: 'p13', name: 'Shubman Gill', team: 'GT', role: 'BAT', price: 10.0 },
  { id: 'p14', name: 'Rashid Khan', team: 'GT', role: 'BOWL', price: 10.5 },
];
