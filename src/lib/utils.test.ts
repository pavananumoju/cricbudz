import { describe, it, expect } from 'vitest';
import { cn, getMatchTimeStatus, getTeamLogo, getMatchDayIST, shortPlayerName, SQUAD_LOCK_WINDOW_MS, ASSUMED_MATCH_DURATION_MS } from './utils';

describe('cn', () => {
  it('merges class names and resolves Tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });

  // Regression: our custom `text-meta`/`text-micro` font-size tokens must be
  // recognized as font-sizes, not colors — otherwise tailwind-merge drops them
  // when combined with a text color and the element reverts to the 16px default
  // (this is what broke the bottom-nav labels and draft screens).
  it('keeps custom font-size tokens when merged with a text color', () => {
    expect(cn('text-micro', 'text-muted')).toBe('text-micro text-muted');
    expect(cn('text-meta', 'text-success')).toBe('text-meta text-success');
  });

  it('still resolves conflicts between two custom font-size tokens', () => {
    expect(cn('text-micro', 'text-meta')).toBe('text-meta');
  });
});

describe('getMatchTimeStatus', () => {
  const matchStart = new Date('2026-05-15T14:00:00.000Z');

  it('is open well before the lock window', () => {
    const now = new Date(matchStart.getTime() - 60 * 60 * 1000); // 1h before
    expect(getMatchTimeStatus(matchStart, now)).toBe('open');
  });

  it('is open exactly at the lock-window boundary (not yet inside it)', () => {
    const now = new Date(matchStart.getTime() - SQUAD_LOCK_WINDOW_MS - 1);
    expect(getMatchTimeStatus(matchStart, now)).toBe('open');
  });

  it('is locked just inside the 30-minute pre-toss window', () => {
    const now = new Date(matchStart.getTime() - SQUAD_LOCK_WINDOW_MS + 1);
    expect(getMatchTimeStatus(matchStart, now)).toBe('locked');
  });

  it('is locked right at match start', () => {
    expect(getMatchTimeStatus(matchStart, matchStart)).toBe('locked');
  });

  it('is locked shortly after match start (assumed still in progress)', () => {
    const now = new Date(matchStart.getTime() + 60 * 60 * 1000); // 1h in
    expect(getMatchTimeStatus(matchStart, now)).toBe('locked');
  });

  it('is completed once the assumed match duration has elapsed', () => {
    const now = new Date(matchStart.getTime() + ASSUMED_MATCH_DURATION_MS);
    expect(getMatchTimeStatus(matchStart, now)).toBe('completed');
  });

  it('is completed long after the match', () => {
    const now = new Date(matchStart.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days later
    expect(getMatchTimeStatus(matchStart, now)).toBe('completed');
  });

  it('accepts an ISO string as well as a Date', () => {
    expect(getMatchTimeStatus(matchStart.toISOString(), new Date(matchStart.getTime() - 60 * 60 * 1000))).toBe('open');
  });
});

describe('getMatchDayIST', () => {
  it('returns the same calendar day for a typical IPL evening start (14:00 UTC = 19:30 IST)', () => {
    expect(getMatchDayIST('2026-04-15T14:00:00.000Z')).toBe('2026-04-15');
  });

  it('returns the same calendar day for a typical IPL afternoon start (10:00 UTC = 15:30 IST)', () => {
    expect(getMatchDayIST('2026-04-15T10:00:00.000Z')).toBe('2026-04-15');
  });

  it('rolls over to the next IST calendar day for a late-UTC-evening timestamp', () => {
    // 19:00 UTC Sunday = 00:30 IST Monday.
    expect(getMatchDayIST('2026-04-19T19:00:00.000Z')).toBe('2026-04-20');
  });

  it('is independent of the machine local timezone (accepts a Date too)', () => {
    const original = process.env.TZ;
    try {
      process.env.TZ = 'America/Los_Angeles';
      expect(getMatchDayIST(new Date('2026-04-19T19:00:00.000Z'))).toBe('2026-04-20');
    } finally {
      process.env.TZ = original;
    }
  });
});

describe('shortPlayerName', () => {
  it('renders an initial plus surname for a normal two-part name', () => {
    expect(shortPlayerName('Rohit Sharma')).toBe('R Sharma');
    expect(shortPlayerName('Virat Kohli')).toBe('V Kohli');
  });

  it('distinguishes two players who share a surname', () => {
    expect(shortPlayerName('Hardik Pandya')).toBe('H Pandya');
    expect(shortPlayerName('Krunal Pandya')).toBe('K Pandya');
  });

  it('collapses multiple given names into their initials, keeping the surname', () => {
    expect(shortPlayerName('Krishnappa Gowtham Nair')).toBe('KG Nair');
  });

  it('returns a single-token name unchanged', () => {
    expect(shortPlayerName('Rashid')).toBe('Rashid');
  });

  it('handles extra/leading/trailing whitespace', () => {
    expect(shortPlayerName('  MS   Dhoni  ')).toBe('M Dhoni');
  });

  it('returns an empty string for empty/nullish input', () => {
    expect(shortPlayerName('')).toBe('');
    expect(shortPlayerName(undefined)).toBe('');
    expect(shortPlayerName(null)).toBe('');
  });
});

describe('getTeamLogo', () => {
  it('prefers a logoId-based URL when provided', () => {
    expect(getTeamLogo('RCB', 12345)).toContain('c12345');
  });

  it('falls back to the known-team map when no logoId is given', () => {
    expect(getTeamLogo('MI')).toContain('mumbai-indians');
  });

  it('falls back to a generated avatar for unknown teams', () => {
    expect(getTeamLogo('ZZZ')).toContain('ui-avatars.com');
  });
});
