import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

// Shared by every admin-only API route (sync, finalize-match, admin/users)
// so the auth check only has to be gotten right in one place.
export async function requireAdmin(req: Request): Promise<{ uid: string } | { error: NextResponse }> {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return { error: NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 }) };
  }
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    if (decoded.admin !== true) {
      return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) };
    }
    return { uid: decoded.uid };
  } catch {
    return { error: NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }) };
  }
}
