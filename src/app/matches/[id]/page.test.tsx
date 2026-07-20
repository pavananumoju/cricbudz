import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { FirebaseError } from 'firebase/app';
import { Match } from '@/types';
import SquadDraftPage from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/lib/firebase', () => ({
  auth: { currentUser: null },
  db: {},
}));

vi.mock('@/context/DevContext', () => ({
  useDev: () => ({ getEffectiveNow: () => new Date('2026-04-20T10:00:00.000Z') }),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'user-1' }, isAdmin: false }),
}));

const MOCK_MATCH: Match = {
  id: 'match-1',
  team1: 'MI',
  team2: 'CSK',
  date: '2026-04-25T14:00:00.000Z',
  status: 'UPCOMING',
  venue: 'Wankhede Stadium',
};

const getMatchById = vi.fn();
const getPlayersByTeams = vi.fn();
const getUserSquads = vi.fn();
const getSquadsForMatch = vi.fn();
const getVisibilitySettings = vi.fn();
const saveUserSquad = vi.fn();

vi.mock('@/services/dataService', () => ({
  getMatchById: (...args: unknown[]) => getMatchById(...args),
  getPlayersByTeams: (...args: unknown[]) => getPlayersByTeams(...args),
  getUserSquads: (...args: unknown[]) => getUserSquads(...args),
  getSquadsForMatch: (...args: unknown[]) => getSquadsForMatch(...args),
  getVisibilitySettings: (...args: unknown[]) => getVisibilitySettings(...args),
  saveUserSquad: (...args: unknown[]) => saveUserSquad(...args),
}));

describe('SquadDraftPage — Squad Room error handling', () => {
  beforeEach(() => {
    getMatchById.mockResolvedValue(MOCK_MATCH);
    getPlayersByTeams.mockResolvedValue([]);
    getUserSquads.mockResolvedValue([]);
    getVisibilitySettings.mockResolvedValue(null);
  });

  it('shows a Squad Room error state — not the "no trios" empty state — when the squads read fails', async () => {
    getSquadsForMatch.mockRejectedValue(new Error('network down'));
    render(<SquadDraftPage params={Promise.resolve({ id: 'match-1' })} />);

    await waitFor(() => expect(screen.getByText("Couldn't Load")).toBeInTheDocument());
    expect(screen.queryByText('No other trios submitted for this match yet.')).not.toBeInTheDocument();
  });

  it('shows distinct permission-denied copy in Squad Room for a permission-denied failure', async () => {
    getSquadsForMatch.mockRejectedValue(new FirebaseError('permission-denied', 'Missing or insufficient permissions.'));
    render(<SquadDraftPage params={Promise.resolve({ id: 'match-1' })} />);

    await waitFor(() => expect(screen.getByText("Can't Access This")).toBeInTheDocument());
    expect(screen.getByText("You don't have access to this right now.")).toBeInTheDocument();
  });

  it('still shows the normal empty state when the read legitimately succeeds with no other squads', async () => {
    getSquadsForMatch.mockResolvedValue([]);
    render(<SquadDraftPage params={Promise.resolve({ id: 'match-1' })} />);

    await waitFor(() => expect(screen.getByText('No other trios submitted for this match yet.')).toBeInTheDocument());
    expect(screen.queryByText("Couldn't Load")).not.toBeInTheDocument();
  });
});
