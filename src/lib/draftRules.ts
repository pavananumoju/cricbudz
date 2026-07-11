import { Player } from '@/types';

export const SQUAD_TARGET_SIZE = 3;

export interface SquadValidationResult {
  canSubmit: boolean;
  message: string;
}

export interface MatchLockStatus {
  isLocked: boolean;
  isCompleted: boolean;
}

// Returns an error message if adding `candidate` as the final (3rd) pick
// would leave the trio with all 3 players from one franchise; null if fine.
export function checkDualFranchiseViolation(
  selectedPlayers: Player[],
  candidate: Player,
  team1: string,
  team2: string
): string | null {
  if (selectedPlayers.length !== SQUAD_TARGET_SIZE - 1) return null;
  const currentTeams = selectedPlayers.map((p) => p.team.toUpperCase());
  if (currentTeams[0] !== currentTeams[1]) return null;
  if (currentTeams[0] !== candidate.team.toUpperCase()) return null;
  const otherTeam = candidate.team.toUpperCase() === team1.toUpperCase() ? team2 : team1;
  return `Add a player from ${otherTeam} to meet the dual-franchise rule.`;
}

// Exactly 3 players, from exactly 2 teams, one tagged MVP, before lock.
export function validateSquad(
  selectedPlayers: Player[],
  mvpId: string | null,
  status: MatchLockStatus
): SquadValidationResult {
  if (status.isCompleted) {
    return { canSubmit: false, message: 'This match is complete. No further changes are permitted.' };
  }
  if (status.isLocked) {
    return { canSubmit: false, message: 'This arena is locked. No further changes are permitted.' };
  }
  if (selectedPlayers.length < SQUAD_TARGET_SIZE) {
    return { canSubmit: false, message: `Add ${SQUAD_TARGET_SIZE - selectedPlayers.length} more player(s) to complete your trio.` };
  }
  if (new Set(selectedPlayers.map((p) => p.team.toUpperCase())).size < 2) {
    return { canSubmit: false, message: 'Your trio must include at least 1 player from each franchise.' };
  }
  if (!mvpId) {
    return { canSubmit: false, message: 'Nominate your Trio MVP with the lightning bolt icon.' };
  }
  return { canSubmit: true, message: 'Your Trio Draft looks solid! Ready to deploy.' };
}
