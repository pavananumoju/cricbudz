import { describe, it, expect, vi, afterEach } from 'vitest';
import { withTimeout, TimeoutError, isPermissionDeniedError, ApiError } from './errors';

afterEach(() => {
  vi.useRealTimers();
});

describe('withTimeout (AUDIT.md P1-9)', () => {
  it('resolves with the value when the promise settles before the deadline', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 50)).resolves.toBe('ok');
  });

  it('rejects with a TimeoutError when the promise hangs past the deadline', async () => {
    vi.useFakeTimers();
    const hang = new Promise((resolve) => setTimeout(resolve, 60_000));
    const raced = withTimeout(hang, 12_000);
    const assertion = expect(raced).rejects.toBeInstanceOf(TimeoutError);
    await vi.advanceTimersByTimeAsync(12_000);
    await assertion;
  });

  it('propagates the original rejection unchanged', async () => {
    const boom = new Error('boom');
    await expect(withTimeout(Promise.reject(boom), 50)).rejects.toBe(boom);
  });
});

describe('isPermissionDeniedError', () => {
  it('is false for a TimeoutError (so the UI shows the generic connection retry, not "no access")', () => {
    expect(isPermissionDeniedError(new TimeoutError())).toBe(false);
  });

  it('is true for a 403 ApiError', () => {
    expect(isPermissionDeniedError(new ApiError('nope', 403))).toBe(true);
  });
});
