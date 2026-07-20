// Single source of truth for fantasy point values — used by both the
// /rules display page and the actual scoring engine (src/lib/scoring.ts),
// so the two can never drift apart.
//
// "Direct Hit" was originally a separate category (10pts) from a regular
// Runout (5pts), but Cricbuzz's scorecard data has no field distinguishing
// a direct-hit run-out from an assisted one — so it's folded into Runout.
// Man of the Match isn't exposed by the API either; it's entered manually
// by the admin when finalizing a match (see src/lib/scoring.ts).
export const SCORING_RULES = {
  RUN: 1,
  WICKET: 10,
  RUNOUT: 5,
  CATCH: 5,
  STUMPING: 5,
  DOT_BALL: 1,
  HALF_CENTURY: 5,
  CENTURY: 10,
  THREE_WICKET_HAUL: 10,
  FIVE_WICKET_HAUL: 20,
  MAN_OF_THE_MATCH: 10,
} as const;

export const MVP_MULTIPLIER = 2;

export const SCORING_RULES_DISPLAY: { subject: string; points: number }[] = [
  { subject: '1 Run', points: SCORING_RULES.RUN },
  { subject: '1 Wicket', points: SCORING_RULES.WICKET },
  { subject: '1 Runout (incl. direct hit)', points: SCORING_RULES.RUNOUT },
  { subject: '1 Catch', points: SCORING_RULES.CATCH },
  { subject: '1 Stumping', points: SCORING_RULES.STUMPING },
  { subject: '1 Dot Ball *', points: SCORING_RULES.DOT_BALL },
  { subject: 'Half Century', points: SCORING_RULES.HALF_CENTURY },
  { subject: 'Century', points: SCORING_RULES.CENTURY },
  { subject: '3 Wicket Haul', points: SCORING_RULES.THREE_WICKET_HAUL },
  { subject: '5 Wicket Haul', points: SCORING_RULES.FIVE_WICKET_HAUL },
  { subject: 'Man of the Match', points: SCORING_RULES.MAN_OF_THE_MATCH },
];

// The rule is real and does apply when the data exists — but Cricbuzz's
// scorecard rarely populates a bowler's dot-ball count at this API tier
// (observed as 0 across real completed matches during development), so
// this line may sit unused most weeks rather than being broken. Rendered
// as a footnote on /rules next to the "*" above rather than removing the
// line, since the rule itself isn't wrong.
export const DOT_BALL_FOOTNOTE =
  "* Dot balls depend on ball-by-ball data Cricbuzz rarely provides for this competition, so this line may not score even in a real match.";
