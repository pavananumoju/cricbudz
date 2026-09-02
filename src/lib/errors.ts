import { FirebaseError } from 'firebase/app';

// Thrown by dataService.ts's API-backed reads (getSquadsForMatch,
// getSquadsInDateRange) so callers can distinguish an auth/permission
// failure from a generic network/server error, the same way a direct
// Firestore call's FirebaseError.code already lets them.
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// A read that blew past its client-side deadline. Firestore's getDoc/getDocs
// can't be aborted and — worse under experimentalForceLongPolling, which is
// slow to notice a dropped connection — can hang indefinitely, leaving a
// full-screen spinner with no "you're offline" signal. Racing every read
// against this turns that hang into the normal ErrorState retry. (AUDIT.md P1-9.)
export class TimeoutError extends Error {
  constructor(message = 'The request timed out. Check your connection and try again.') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export const READ_TIMEOUT_MS = 12_000;

export function withTimeout<T>(promise: Promise<T>, ms: number = READ_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError()), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer)) as Promise<T>;
}

// True for Firestore's permission-denied rejection (a rules bug or an
// auth/claim problem — the failure signature behind a past incident where
// this looked identical to honest emptiness) or the 401/403 our own
// Bearer-token API routes return for the same class of problem.
export function isPermissionDeniedError(err: unknown): boolean {
  if (err instanceof FirebaseError) return err.code === 'permission-denied';
  if (err instanceof ApiError) return err.status === 401 || err.status === 403;
  return false;
}
