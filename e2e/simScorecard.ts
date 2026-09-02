// Builds a synthetic-but-schema-valid Cricbuzz scorecard for the two sim
// teams (SRH vs RCB), used by e2e/multiuser.spec.ts's finalize-match phase
// so the real scoring -> leaderboard pipeline runs deterministically without
// touching the live RapidAPI. seed.ts writes the output to
// e2e/fixtures/scorecards/. Names match SIM_ROSTER exactly.
//
// It is deliberately shaped to exercise every scoring rule: a century, two
// fifties, a 3-wicket haul, a 5-wicket haul, catches, a run-out, a stumping,
// and a substitute-fielder catch ("c sub (Name) b Bowler").

interface Batsman { name: string; runs: number; outdec?: string }
interface Bowler { name: string; wickets: number; dots: number }
interface Innings { batsman: Batsman[]; bowler: Bowler[] }
export interface SimScorecard { scorecard: Innings[]; ismatchcomplete: true }

const SRH_RUNS = [102, 74, 55, 41, 33, 26, 19, 12, 7, 3, 0]; // Alpha..Kilo
const RCB_RUNS = [88, 50, 44, 30, 22, 17, 11, 6, 2, 1, 0];

const LETTERS = [
  'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliet', 'Kilo',
];

export function buildSimScorecard(): SimScorecard {
  const srhBat: Batsman[] = SRH_RUNS.map((runs, i) => ({ name: `SRH ${LETTERS[i]}`, runs }));
  // Dismissals in innings 1 credit RCB fielders.
  srhBat[1].outdec = 'c RCB Bravo b RCB Alpha';
  srhBat[2].outdec = 'run out (RCB Charlie)';
  srhBat[3].outdec = 'c sub (RCB Papa) b RCB Alpha'; // substitute-fielder catch
  srhBat[4].outdec = 'st RCB Delta b RCB Echo';
  srhBat[0].outdec = 'not out';

  const rcbBowl: Bowler[] = [
    { name: 'RCB Alpha', wickets: 3, dots: 0 }, // 3-wkt haul
    { name: 'RCB Bravo', wickets: 2, dots: 0 },
    { name: 'RCB Charlie', wickets: 1, dots: 0 },
    { name: 'RCB Delta', wickets: 0, dots: 0 },
  ];

  const rcbBat: Batsman[] = RCB_RUNS.map((runs, i) => ({ name: `RCB ${LETTERS[i]}`, runs }));
  rcbBat[1].outdec = 'c SRH Bravo b SRH Alpha';
  rcbBat[2].outdec = 'run out (SRH Charlie)';
  rcbBat[3].outdec = 'c SRH Delta b SRH Alpha';
  rcbBat[0].outdec = 'not out';

  const srhBowl: Bowler[] = [
    { name: 'SRH Alpha', wickets: 5, dots: 0 }, // 5-wkt haul
    { name: 'SRH Bravo', wickets: 2, dots: 0 },
    { name: 'SRH Charlie', wickets: 1, dots: 0 },
    { name: 'SRH Delta', wickets: 0, dots: 0 },
  ];

  return {
    scorecard: [
      { batsman: srhBat, bowler: rcbBowl },
      { batsman: rcbBat, bowler: srhBowl },
    ],
    ismatchcomplete: true,
  };
}
