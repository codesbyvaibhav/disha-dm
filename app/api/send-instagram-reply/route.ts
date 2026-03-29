import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      commentId,
      commentText,
      commenterUsername,
      matchedKeyword,
      replyTemplate,
    } = body;

    if (!userId || !commentId || !replyTemplate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const userSnap = await adminDb.collection('users').doc(userId).get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userSnap.data();
    const accessToken = userData?.instagramAccessToken;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Instagram access token missing' },
        { status: 400 }
      );
    }

    const metaUrl = `https://graph.facebook.com/v25.0/${commentId}/private_replies`;

    const metaRes = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: replyTemplate,
        access_token: accessToken,
      }),
    });

    const metaJson = await metaRes.json();

    await adminDb.collection('message_logs').add({
      userId,
      commentId,
      commentText: commentText || '',
      commenterUsername: commenterUsername || '',
      matchedKeyword: matchedKeyword || '',
      replyTemplate,
      success: metaRes.ok,
      provider: 'instagram_private_reply',
      response: metaJson,
      createdAt: new Date(),
    });

    if (!metaRes.ok) {
      return NextResponse.json(
        { error: 'Meta API failed', details: metaJson },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      provider: 'instagram_private_reply',
      response: metaJson,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Server error', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}