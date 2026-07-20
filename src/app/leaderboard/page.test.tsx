import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ApiError } from '@/lib/errors';
import LeaderboardPage from './page';

vi.mock('@/context/DevContext', () => ({
  useDev: () => ({ getEffectiveNow: () => new Date('2026-04-20T10:00:00.000Z') }),
}));

const getSquadsInDateRange = vi.fn();
const getEarliestMatchDate = vi.fn();
vi.mock('@/services/dataService', () => ({
  getSquadsInDateRange: (...args: unknown[]) => getSquadsInDateRange(...args),
  getEarliestMatchDate: (...args: unknown[]) => getEarliestMatchDate(...args),
}));

describe('LeaderboardPage error handling', () => {
  beforeEach(() => {
    getEarliestMatchDate.mockResolvedValue(null);
  });

  it('shows a generic error state — not the empty state — when the squads read fails', async () => {
    getSquadsInDateRange.mockRejectedValue(new Error('network down'));
    render(<LeaderboardPage />);

    await waitFor(() => expect(screen.getByText("Couldn't Load")).toBeInTheDocument());
    expect(screen.queryByText('No Scores Yet')).not.toBeInTheDocument();
  });

  it('shows distinct permission-denied copy for a 401 from GET /api/leaderboard (the actual failure shape this page can hit)', async () => {
    getSquadsInDateRange.mockRejectedValue(new ApiError('GET /api/leaderboard failed: 401', 401));
    render(<LeaderboardPage />);

    await waitFor(() => expect(screen.getByText("Can't Access This")).toBeInTheDocument());
    expect(screen.getByText("You don't have access to this right now.")).toBeInTheDocument();
    expect(screen.queryByText('No Scores Yet')).not.toBeInTheDocument();
  });

  it('still shows the normal empty state for a legitimately empty (successful) result', async () => {
    getSquadsInDateRange.mockResolvedValue([]);
    render(<LeaderboardPage />);

    await waitFor(() => expect(screen.getByText('No Scores Yet')).toBeInTheDocument());
    expect(screen.queryByText("Couldn't Load")).not.toBeInTheDocument();
  });
});
