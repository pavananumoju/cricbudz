import { describe, it, expect } from 'vitest';
import { cn, getMatchTimeStatus, getTeamLogo, SQUAD_LOCK_WINDOW_MS, ASSUMED_MATCH_DURATION_MS } from './utils';

describe('cn', () => {
  it('merges class names and resolves Tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
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
