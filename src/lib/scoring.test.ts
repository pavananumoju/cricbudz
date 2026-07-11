import { describe, it, expect } from 'vitest';
import {
  buildPlayerNameLookup,
  creditDismissal,
  parseScorecard,
  calculatePlayerPoints,
  calculateSquadScore,
  emptyStats,
  validateScorecardResponse,
  type PlayerNameLookup,
} from './scoring';
import { SCORING_RULES, MVP_MULTIPLIER } from './scoringRules';

const players = [
  { id: 'p-head', name: 'Travis Head' },
  { id: 'p-abhishek', name: 'Abhishek Sharma' },
  { id: 'p-kishan', name: 'Ishan Kishan' },
  { id: 'p-klaasen', name: 'Heinrich Klaasen' },
  { id: 'p-duffy', name: 'Jacob Duffy' },
  { id: 'p-bhuvi', name: 'Bhuvneshwar Kumar' },
  { id: 'p-salt', name: 'Phil Salt' },
  { id: 'p-kohli', name: 'Virat Kohli' },
];

function lookup(): PlayerNameLookup {
  return buildPlayerNameLookup(players);
}

describe('creditDismissal', () => {
  it('credits a catch to the fielder, not the bowler', () => {
    const stats = new Map();
    creditDismissal(stats, lookup(), 'c Phil Salt b Jacob Duffy');
    expect(stats.get('p-salt')?.catches).toBe(1);
    expect(stats.get('p-duffy')).toBeUndefined();
  });

  it('credits a caught-and-bowled to the bowler as the fielder', () => {
    const stats = new Map();
    creditDismissal(stats, lookup(), 'c & b Jacob Duffy');
    expect(stats.get('p-duffy')?.catches).toBe(1);
  });

  it('credits a stumping to the keeper', () => {
    const stats = new Map();
    creditDismissal(stats, lookup(), 'st Phil Salt b Jacob Duffy');
    expect(stats.get('p-salt')?.stumpings).toBe(1);
  });

  it('credits a single-fielder run-out', () => {
    const stats = new Map();
    creditDismissal(stats, lookup(), 'run out (Phil Salt)');
    expect(stats.get('p-salt')?.runouts).toBe(1);
  });

  it('credits every named fielder on a multi-fielder run-out', () => {
    const stats = new Map();
    creditDismissal(stats, lookup(), 'run out (Ishan Kishan/Heinrich Klaasen)');
    expect(stats.get('p-kishan')?.runouts).toBe(1);
    expect(stats.get('p-klaasen')?.runouts).toBe(1);
  });

  it('awards no fielding credit for a bowled dismissal', () => {
    const stats = new Map();
    creditDismissal(stats, lookup(), 'b Jacob Duffy');
    expect(stats.size).toBe(0);
  });

  it('awards no fielding credit for lbw', () => {
    const stats = new Map();
    creditDismissal(stats, lookup(), 'lbw b Jacob Duffy');
    expect(stats.size).toBe(0);
  });

  it('is a no-op for "not out" (undefined outdec)', () => {
    const stats = new Map();
    creditDismissal(stats, lookup(), undefined);
    expect(stats.size).toBe(0);
  });

  it('silently skips a fielder name that has no match in the lookup', () => {
    const stats = new Map();
    expect(() => creditDismissal(stats, lookup(), 'c Someone Unknown b Jacob Duffy')).not.toThrow();
    expect(stats.size).toBe(0);
  });
});

describe('surname fallback matching', () => {
  it('falls back to a unique surname match when the full name differs (Cricbuzz itself is inconsistent about this)', () => {
    // Real example: a player's own batting row said "Philip Salt", but the
    // same match's dismissal text for other batsmen credited catches to
    // "Phil Salt". Exact full-name matching alone misses this.
    const roster = [{ id: 'p-salt', name: 'Philip Salt' }];
    const stats = new Map();
    creditDismissal(stats, buildPlayerNameLookup(roster), 'c Phil Salt b Someone');
    expect(stats.get('p-salt')?.catches).toBe(1);
  });

  it('does not use the surname fallback when it is ambiguous (two players share a surname)', () => {
    const roster = [
      { id: 'p-salt-1', name: 'Philip Salt' },
      { id: 'p-salt-2', name: 'Jordan Salt' },
    ];
    const stats = new Map();
    creditDismissal(stats, buildPlayerNameLookup(roster), 'c Phil Salt b Someone');
    expect(stats.size).toBe(0);
  });

  it('resolves via exact full-name match even when the surname alone would be ambiguous', () => {
    const roster = [
      { id: 'p-exact', name: 'Phil Salt' },
      { id: 'p-other', name: 'Jordan Salt' },
    ];
    const stats = new Map();
    creditDismissal(stats, buildPlayerNameLookup(roster), 'c Phil Salt b Someone');
    expect(stats.get('p-exact')?.catches).toBe(1);
    expect(stats.get('p-other')).toBeUndefined();
  });
});

describe('parseScorecard', () => {
  it('tallies runs, wickets, dot balls, and fielding credit across innings', () => {
    const scorecard = {
      ismatchcomplete: true,
      scorecard: [
        {
          batsman: [
            { name: 'Travis Head', runs: 11, outdec: 'c Phil Salt b Jacob Duffy' },
            { name: 'Abhishek Sharma', runs: 7, outdec: 'c Ishan Kishan b Jacob Duffy' },
            { name: 'Ishan Kishan', runs: 80, outdec: 'not out' },
          ],
          bowler: [
            { name: 'Jacob Duffy', wickets: 2, dots: 8 },
            { name: 'Bhuvneshwar Kumar', wickets: 0, dots: 5 },
          ],
        },
      ],
    };

    const stats = parseScorecard(scorecard, lookup());

    expect(stats.get('p-head')?.runs).toBe(11);
    expect(stats.get('p-duffy')?.wickets).toBe(2);
    expect(stats.get('p-duffy')?.dotBalls).toBe(8);
    expect(stats.get('p-salt')?.catches).toBe(1);
    expect(stats.get('p-kishan')?.catches).toBe(1);
    expect(stats.get('p-kishan')?.runs).toBe(80);
    expect(stats.get('p-bhuvi')?.dotBalls).toBe(5);
  });

  it('accumulates stats for a player appearing across two innings', () => {
    const scorecard = {
      scorecard: [
        { bowler: [{ name: 'Jacob Duffy', wickets: 2, dots: 4 }] },
        { bowler: [{ name: 'Jacob Duffy', wickets: 1, dots: 3 }] },
      ],
    };
    const stats = parseScorecard(scorecard, lookup());
    expect(stats.get('p-duffy')?.wickets).toBe(3);
    expect(stats.get('p-duffy')?.dotBalls).toBe(7);
  });

  it('returns an empty map for an empty scorecard', () => {
    expect(parseScorecard({}, lookup()).size).toBe(0);
  });
});

describe('calculatePlayerPoints', () => {
  it('scores base runs/wickets/fielding without any bonuses', () => {
    const stats = { ...emptyStats(), runs: 30, wickets: 1, catches: 1 };
    const expected = 30 * SCORING_RULES.RUN + 1 * SCORING_RULES.WICKET + 1 * SCORING_RULES.CATCH;
    expect(calculatePlayerPoints(stats, false)).toBe(expected);
  });

  it('awards the half-century bonus at exactly 50 runs', () => {
    const stats = { ...emptyStats(), runs: 50 };
    expect(calculatePlayerPoints(stats, false)).toBe(50 * SCORING_RULES.RUN + SCORING_RULES.HALF_CENTURY);
  });

  it('awards only the century bonus at 100+ runs, not both', () => {
    const stats = { ...emptyStats(), runs: 100 };
    const points = calculatePlayerPoints(stats, false);
    expect(points).toBe(100 * SCORING_RULES.RUN + SCORING_RULES.CENTURY);
    expect(points).not.toBe(100 * SCORING_RULES.RUN + SCORING_RULES.CENTURY + SCORING_RULES.HALF_CENTURY);
  });

  it('awards only the 5-wicket-haul bonus at 5+ wickets, not both', () => {
    const stats = { ...emptyStats(), wickets: 5 };
    const points = calculatePlayerPoints(stats, false);
    expect(points).toBe(5 * SCORING_RULES.WICKET + SCORING_RULES.FIVE_WICKET_HAUL);
  });

  it('awards the 3-wicket-haul bonus at exactly 3 wickets', () => {
    const stats = { ...emptyStats(), wickets: 3 };
    expect(calculatePlayerPoints(stats, false)).toBe(3 * SCORING_RULES.WICKET + SCORING_RULES.THREE_WICKET_HAUL);
  });

  it('adds the Man of the Match bonus when flagged', () => {
    const stats = { ...emptyStats(), runs: 10 };
    const withMotm = calculatePlayerPoints(stats, true);
    const withoutMotm = calculatePlayerPoints(stats, false);
    expect(withMotm - withoutMotm).toBe(SCORING_RULES.MAN_OF_THE_MATCH);
  });
});

describe('calculateSquadScore', () => {
  it('sums the 3 players points with the MVP doubled', () => {
    const playerPoints = new Map([
      ['a', 20],
      ['b', 30],
      ['c', 10],
    ]);
    const score = calculateSquadScore(['a', 'b', 'c'], 'b', playerPoints);
    expect(score).toBe(20 + 30 * MVP_MULTIPLIER + 10);
  });

  it('treats a player with no recorded stats as 0 points', () => {
    const playerPoints = new Map([['a', 20]]);
    const score = calculateSquadScore(['a', 'unknown-player', 'also-unknown'], 'a', playerPoints);
    expect(score).toBe(20 * MVP_MULTIPLIER);
  });
});

describe('validateScorecardResponse', () => {
  it('accepts a well-formed Cricbuzz scorecard response', () => {
    const raw = {
      scorecard: [
        {
          batsman: [{ name: 'Travis Head', runs: 34, outdec: 'c Kohli b Bumrah' }],
          bowler: [{ name: 'Bhuvneshwar Kumar', wickets: 2, dots: 12 }],
        },
      ],
      ismatchcomplete: true,
    };
    expect(() => validateScorecardResponse(raw)).not.toThrow();
    expect(validateScorecardResponse(raw)).toEqual(raw);
  });

  it('accepts extra unknown fields Cricbuzz might add later (passthrough)', () => {
    const raw = {
      scorecard: [{ batsman: [{ name: 'Travis Head', runs: 34, someNewField: 'xyz' }] }],
      ismatchcomplete: true,
      brandNewTopLevelField: 42,
    };
    expect(() => validateScorecardResponse(raw)).not.toThrow();
  });

  it('throws a clear error naming the field when a depended-on field changes type', () => {
    const raw = {
      scorecard: [{ batsman: [{ name: 'Travis Head', runs: '34 not a number' }] }],
    };
    expect(() => validateScorecardResponse(raw)).toThrow(/scorecard\.0\.batsman\.0\.runs/);
  });

  it('throws a clear error when the response is a totally different shape', () => {
    expect(() => validateScorecardResponse({ someUnrelatedApiChange: true })).not.toThrow();
    expect(() => validateScorecardResponse('not even an object')).toThrow(
      /Cricbuzz's scorecard response no longer matches the shape this app expects/
    );
  });
});
