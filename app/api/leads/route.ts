import { NextResponse } from 'next/server';
import { adminDb, serverTimestamp } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      userId,
      commenterUsername,
      commentText,
      matchedKeyword,
      mediaId,
      status = 'pending',
    } = body;

    if (!userId || !commenterUsername || !commentText || !matchedKeyword || !mediaId) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          debug: {
            userId,
            commenterUsername,
            commentText,
            matchedKeyword,
            mediaId,
          },
        },
        { status: 400 }
      );
    }

    const userDoc = await adminDb.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'Invalid userId - user doc not found in Firestore' },
        { status: 400 }
      );
    }

    const docRef = await adminDb.collection('leads').add({
      userId,
      commenterUsername,
      commentText,
      matchedKeyword,
      mediaId,
      status,
      source: 'instagram',
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}