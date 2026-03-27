import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export const adminDb = getFirestore(admin.apps[0]!, process.env.FIRESTORE_DATABASE_ID || '(default)');
export const adminAuth = admin.auth();
