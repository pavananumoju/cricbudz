import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getAdminAuth } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(req: Request) {
  const authResult = await requireAdmin(req);
  if ('error' in authResult) return authResult.error;

  const users: { uid: string; email: string | null; displayName: string | null; isAdmin: boolean }[] = [];
  let pageToken: string | undefined;
  do {
    const page = await getAdminAuth().listUsers(1000, pageToken);
    page.users.forEach((u) => {
      users.push({
        uid: u.uid,
        email: u.email ?? null,
        displayName: u.displayName ?? null,
        isAdmin: u.customClaims?.admin === true,
      });
    });
    pageToken = page.pageToken;
  } while (pageToken);

  users.sort((a, b) => (a.displayName || a.email || '').localeCompare(b.displayName || b.email || ''));

  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const authResult = await requireAdmin(req);
  if ('error' in authResult) return authResult.error;

  let body: { uid?: string; isAdmin?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { uid, isAdmin } = body;
  if (!uid || typeof isAdmin !== 'boolean') {
    return NextResponse.json({ error: 'uid and isAdmin (boolean) are required' }, { status: 400 });
  }
  if (uid === authResult.uid && !isAdmin) {
    return NextResponse.json({ error: "You can't revoke your own admin access from here." }, { status: 400 });
  }

  await getAdminAuth().setCustomUserClaims(uid, { admin: isAdmin });

  return NextResponse.json({ success: true, uid, isAdmin });
}
