import admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const databaseId = process.env.FIRESTORE_DATABASE_ID;

if (!projectId || !clientEmail || !privateKey) {
  throw new Error('Missing Firebase Admin environment variables');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    projectId,
  });
}

const adminDb = admin.firestore();

if (databaseId) {
  adminDb.settings({ databaseId });
}

const adminAuth = admin.auth();
const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;

export { adminDb, adminAuth, serverTimestamp };