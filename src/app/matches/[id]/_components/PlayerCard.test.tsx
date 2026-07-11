import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PlayerCard from './PlayerCard';
import { Player } from '@/types';

const brand = { textClass: 'text-primary', bgClass: '', borderClass: 'border-primary/30', accentColor: '#4f46e5' };

const player: Player = {
  id: '123',
  name: 'Virat Kohli',
  team: 'RCB',
  role: 'BATSMAN',
  price: 10.5,
};

describe('PlayerCard', () => {
  it('calls onSelect when clicked and not disabled', () => {
    const onSelect = vi.fn();
    render(<PlayerCard player={player} brand={brand} isSelected={false} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('shows a plus affordance when not selected and not disabled', () => {
    render(<PlayerCard player={player} brand={brand} isSelected={false} onSelect={vi.fn()} />);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('is disabled and does not fire onSelect when disabled=true', () => {
    const onSelect = vi.fn();
    render(<PlayerCard player={player} brand={brand} isSelected={false} disabled onSelect={onSelect} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders the player name and price', () => {
    render(<PlayerCard player={player} brand={brand} isSelected={false} onSelect={vi.fn()} />);
    expect(screen.getByText('Virat Kohli')).toBeInTheDocument();
    expect(screen.getByText('₹10.5M')).toBeInTheDocument();
  });
});
