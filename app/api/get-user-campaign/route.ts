import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const snapshot = await adminDb
    .collection('campaigns')
    .where('userId', '==', userId)
    .limit(1)
    .get();

    return NextResponse.json({
      debug: {
        userId,
        empty: snapshot.empty,
        size: snapshot.size,
        projectId: process.env.FIREBASE_PROJECT_ID || null,
        databaseId: process.env.FIRESTORE_DATABASE_ID || null,
      },
      data: snapshot.empty ? null : snapshot.docs[0].data(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to fetch campaign',
        details: error?.message || String(error),
        projectId: process.env.FIREBASE_PROJECT_ID || null,
        databaseId: process.env.FIRESTORE_DATABASE_ID || null,
      },
      { status: 500 }
    );
  }
}