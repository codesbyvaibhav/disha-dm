import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  const { userId, instagramAccountId, instagramUsername, instagramPageId, accessToken } = await request.json();

  if (!userId || !instagramAccountId || !accessToken) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    await adminDb.collection('users').doc(userId).update({
      instagramAccountId,
      instagramUsername,
      instagramPageId,
      instagramAccessToken: accessToken,
      updatedAt: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update Profile Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
