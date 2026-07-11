import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getAdminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/adminAuth';

// Every collection a restore needs to fully reconstruct the app's data.
// Keep this list in sync with scripts/restore-firestore.mjs.
const BACKED_UP_COLLECTIONS = ['matches', 'players', 'userSquads', 'settings'];

export async function GET(req: Request) {
  const authResult = await requireAdmin(req);
  if ('error' in authResult) return authResult.error;

  const adminDb = getAdminDb();
  const data: Record<string, Record<string, unknown>> = {};

  for (const collectionName of BACKED_UP_COLLECTIONS) {
    const snap = await adminDb.collection(collectionName).get();
    const docs: Record<string, unknown> = {};
    snap.docs.forEach((doc) => {
      docs[doc.id] = doc.data();
    });
    data[collectionName] = docs;
  }

  const backup = {
    exportedAt: new Date().toISOString(),
    collections: data,
  };

  return new NextResponse(JSON.stringify(backup, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="cricbudz-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
