import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sheet } from './Sheet';

// motion/react's AnimatePresence renders synchronously in jsdom; drag props are
// no-ops here, so these tests exercise the a11y behaviour we added (item #9):
// dialog semantics, Escape-to-close, focus-in, and the close/backdrop handlers.
describe('Sheet (accessibility)', () => {
  it('exposes dialog semantics with an accessible name from the title', () => {
    render(
      <Sheet open onClose={vi.fn()} title="Profile">
        <button>Logout</button>
      </Sheet>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Profile');
  });

  it('closes when Escape is pressed', () => {
    const onClose = vi.fn();
    render(
      <Sheet open onClose={onClose} title="Profile">
        <button>Logout</button>
      </Sheet>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes via the labelled close button', () => {
    const onClose = vi.fn();
    render(
      <Sheet open onClose={onClose} title="Profile">
        <button>Logout</button>
      </Sheet>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('moves focus into the dialog on open (focus trap entry point)', () => {
    render(
      <Sheet open onClose={vi.fn()} title="Profile">
        <button>Logout</button>
      </Sheet>
    );
    // The dialog container itself receives focus so the first Tab lands inside.
    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  it('renders nothing when closed', () => {
    render(
      <Sheet open={false} onClose={vi.fn()} title="Profile">
        <button>Logout</button>
      </Sheet>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
