import { cert, getApps, initializeApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

function getAdminApp(): App {
  if (getApps().length === 0) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('FIREBASE_PRIVATE_KEY is missing');
    }

    // Clean up the private key
    let formattedKey = privateKey.trim();
    
    // Remove surrounding quotes if they exist
    if ((formattedKey.startsWith('"') && formattedKey.endsWith('"')) || 
        (formattedKey.startsWith("'") && formattedKey.endsWith("'"))) {
      formattedKey = formattedKey.substring(1, formattedKey.length - 1);
    }
    
    // Replace escaped newlines with actual newlines
    formattedKey = formattedKey.replace(/\\n/g, '\n');

    return initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: formattedKey,
      }),
    });
  }
  return getApps()[0];
}

export function getAdminDb(): Firestore {
  const databaseId = process.env.FIREBASE_DATABASE_ID || '(default)';
  return getFirestore(getAdminApp(), databaseId);
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}
