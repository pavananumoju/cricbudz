import { describe, it, expect } from 'vitest';
import { checkDualFranchiseViolation, validateSquad, SQUAD_TARGET_SIZE } from './draftRules';
import { Player } from '@/types';

function mkPlayer(id: string, team: string): Player {
  return { id, name: `Player ${id}`, team, role: 'BATSMAN', price: 9 };
}

describe('checkDualFranchiseViolation', () => {
  it('allows the 1st and 2nd pick from any team, no violation possible yet', () => {
    expect(checkDualFranchiseViolation([], mkPlayer('1', 'SRH'), 'SRH', 'RCB')).toBeNull();
    expect(checkDualFranchiseViolation([mkPlayer('1', 'SRH')], mkPlayer('2', 'SRH'), 'SRH', 'RCB')).toBeNull();
  });

  it('blocks a 3rd pick that would make all 3 players the same team', () => {
    const selected = [mkPlayer('1', 'SRH'), mkPlayer('2', 'SRH')];
    const violation = checkDualFranchiseViolation(selected, mkPlayer('3', 'SRH'), 'SRH', 'RCB');
    expect(violation).toContain('RCB');
  });

  it('allows a 3rd pick from the other team', () => {
    const selected = [mkPlayer('1', 'SRH'), mkPlayer('2', 'SRH')];
    expect(checkDualFranchiseViolation(selected, mkPlayer('3', 'RCB'), 'SRH', 'RCB')).toBeNull();
  });

  it('allows a 3rd pick when the first two are already from different teams', () => {
    const selected = [mkPlayer('1', 'SRH'), mkPlayer('2', 'RCB')];
    expect(checkDualFranchiseViolation(selected, mkPlayer('3', 'SRH'), 'SRH', 'RCB')).toBeNull();
  });

  it('is case-insensitive on team codes', () => {
    const selected = [mkPlayer('1', 'srh'), mkPlayer('2', 'SRH')];
    const violation = checkDualFranchiseViolation(selected, mkPlayer('3', 'Srh'), 'SRH', 'RCB');
    expect(violation).not.toBeNull();
  });
});

describe('validateSquad', () => {
  const openStatus = { isLocked: false, isCompleted: false };

  it('requires 3 players', () => {
    const result = validateSquad([mkPlayer('1', 'SRH')], null, openStatus);
    expect(result.canSubmit).toBe(false);
    expect(result.message).toContain('more player');
  });

  it('requires at least 2 franchises', () => {
    const selected = [mkPlayer('1', 'SRH'), mkPlayer('2', 'SRH'), mkPlayer('3', 'SRH')];
    const result = validateSquad(selected, '1', openStatus);
    expect(result.canSubmit).toBe(false);
    expect(result.message).toContain('franchise');
  });

  it('requires an MVP once the trio is otherwise valid', () => {
    const selected = [mkPlayer('1', 'SRH'), mkPlayer('2', 'SRH'), mkPlayer('3', 'RCB')];
    const result = validateSquad(selected, null, openStatus);
    expect(result.canSubmit).toBe(false);
    expect(result.message).toContain('MVP');
  });

  it('passes with 3 players, 2 franchises, and an MVP', () => {
    const selected = [mkPlayer('1', 'SRH'), mkPlayer('2', 'SRH'), mkPlayer('3', 'RCB')];
    const result = validateSquad(selected, '1', openStatus);
    expect(result.canSubmit).toBe(true);
  });

  it('blocks submission once locked, even with an otherwise-valid trio', () => {
    const selected = [mkPlayer('1', 'SRH'), mkPlayer('2', 'SRH'), mkPlayer('3', 'RCB')];
    const result = validateSquad(selected, '1', { isLocked: true, isCompleted: false });
    expect(result.canSubmit).toBe(false);
    expect(result.message).toContain('locked');
  });

  it('reports "complete" (not "locked") once the match is completed', () => {
    const selected = [mkPlayer('1', 'SRH'), mkPlayer('2', 'SRH'), mkPlayer('3', 'RCB')];
    const result = validateSquad(selected, '1', { isLocked: true, isCompleted: true });
    expect(result.canSubmit).toBe(false);
    expect(result.message).toContain('complete');
  });

  it('exports a target size of 3', () => {
    expect(SQUAD_TARGET_SIZE).toBe(3);
  });
});
