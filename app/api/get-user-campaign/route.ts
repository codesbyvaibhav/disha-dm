import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  try {
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

    const campaign = snapshot.docs[0].data();

    return NextResponse.json({
      keywords: campaign.keywords || [],
      matchType: campaign.matchType || 'contains',
      replyTemplate: campaign.replyTemplate || '',
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}