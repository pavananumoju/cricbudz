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

// True for Firestore's permission-denied rejection (a rules bug or an
// auth/claim problem — the failure signature behind a past incident where
// this looked identical to honest emptiness) or the 401/403 our own
// Bearer-token API routes return for the same class of problem.
export function isPermissionDeniedError(err: unknown): boolean {
  if (err instanceof FirebaseError) return err.code === 'permission-denied';
  if (err instanceof ApiError) return err.status === 401 || err.status === 403;
  return false;
}
