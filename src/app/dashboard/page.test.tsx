import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Match, UserSquad } from '@/types';
import Dashboard from './page';

const mockRouter = { push: vi.fn(), back: vi.fn(), replace: vi.fn() };
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('@/lib/firebase', () => ({
  auth: { currentUser: { uid: 'user-1' } },
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, cb: (u: unknown) => void) => {
    cb({ uid: 'user-1', displayName: 'Test User' });
    return () => {};
  },
}));

vi.mock('@/context/DevContext', () => ({
  useDev: () => ({ getEffectiveNow: () => new Date('2026-04-25T10:00:00.000Z') }),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ isAdmin: false }),
}));

const getUserSquads = vi.fn();
const getMatches = vi.fn();
const deleteUserSquad = vi.fn();

vi.mock('@/services/dataService', () => ({
  getUserSquads: (...args: unknown[]) => getUserSquads(...args),
  getMatches: (...args: unknown[]) => getMatches(...args),
  deleteUserSquad: (...args: unknown[]) => deleteUserSquad(...args),
}));

const MOCK_MATCH: Match = {
  id: 'match-1',
  team1: 'MI',
  team2: 'CSK',
  date: '2026-04-25T14:00:00.000Z',
  status: 'UPCOMING',
  venue: 'Wankhede Stadium',
};

const MOCK_SQUAD: UserSquad = {
  userId: 'user-1',
  matchId: 'match-1',
  players: ['p1', 'p2', 'p3'],
  playerNames: ['Virat Kohli', 'Rohit Sharma', 'Jasprit Bumrah'],
  mvpId: 'p1',
  createdAt: Date.now(),
  matchTimestamp: MOCK_MATCH.date,
  matchDay: '2026-04-25',
  userDisplayName: 'Test User',
  userPhotoURL: null,
};

describe('Dashboard — trio surnames from denormalized playerNames', () => {
  beforeEach(() => {
    getMatches.mockResolvedValue([MOCK_MATCH]);
    getUserSquads.mockResolvedValue([MOCK_SQUAD]);
    deleteUserSquad.mockResolvedValue(undefined);
  });

  it('renders trio surnames from squad.playerNames without fetching the players collection', async () => {
    render(<Dashboard />);

    await waitFor(() => expect(screen.getByText('Kohli')).toBeInTheDocument());
    expect(screen.getByText('Sharma')).toBeInTheDocument();
    expect(screen.getByText('Bumrah')).toBeInTheDocument();
  });

  it('falls back to "..." for a pre-migration squad with no playerNames yet', async () => {
    getUserSquads.mockResolvedValue([{ ...MOCK_SQUAD, playerNames: undefined }]);
    render(<Dashboard />);

    await waitFor(() => expect(screen.getAllByText('...').length).toBe(3));
  });
});
