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
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({
        keywords: [],
        matchType: 'contains',
        replyTemplate: '',
      });
    }

    const doc = snapshot.docs[0].data();

    return NextResponse.json({
      keywords: doc.keywords || [],
      matchType: doc.matchType || 'contains',
      replyTemplate: doc.replyTemplate || '',
    });

  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}