import { NextResponse } from 'next/server';
import { adminDb, adminAuth, serverTimestamp } from '@/lib/firebase-admin';

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
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const userRecord = await adminAuth.getUser(userId).catch(() => null);

    if (!userRecord) {
      return NextResponse.json(
        { error: 'Invalid userId' },
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