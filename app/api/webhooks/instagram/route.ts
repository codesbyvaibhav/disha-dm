import { NextResponse } from 'next/server';
import { adminDb, adminAuth, serverTimestamp } from '@/lib/firebase-admin';
import { decrypt } from '@/lib/encryption';
import { sendInstagramPrivateReply } from '@/lib/meta';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    console.log('Webhook verified');
    return new Response(challenge, { status: 200 });
  } else {
    return new Response('Forbidden', { status: 403 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  console.log('Webhook payload received:', JSON.stringify(body, null, 2));

  // 1. Check if it's an Instagram comment event
  if (body.object === 'instagram') {
    for (const entry of body.entry) {
      const igAccountId = entry.id;
      
      // Find the user associated with this IG account
      const userSnap = await adminDb.collection('users')
        .where('instagramAccountId', '==', igAccountId)
        .limit(1)
        .get();

      if (userSnap.empty) {
        console.log('No user found for IG account:', igAccountId);
        continue;
      }

      const userDoc = userSnap.docs[0];
      const userData = userDoc.data();
      const userId = userDoc.id;
      const accessToken = decrypt(userData.instagramAccessToken);

      for (const change of entry.changes) {
        if (change.field === 'comments') {
          const comment = change.value;
          const commentId = comment.id;
          const commentText = comment.text;
          const commenterUsername = comment.from.username;
          const commenterId = comment.from.id;
          const mediaId = comment.media.id;

          // 2. Find active campaigns for this user
          const campaignsSnap = await adminDb.collection('campaigns')
            .where('userId', '==', userId)
            .where('isActive', '==', true)
            .get();

          if (campaignsSnap.empty) {
            console.log('No active campaigns for user:', userId);
            continue;
          }

          for (const campaignDoc of campaignsSnap.docs) {
            const campaign = campaignDoc.data();
            const campaignId = campaignDoc.id;

            // 3. Match keywords
            const matchedKeyword = campaign.keywords.find((k: string) => {
              if (campaign.matchType === 'exact') {
                return commentText.toLowerCase() === k.toLowerCase();
              } else {
                return commentText.toLowerCase().includes(k.toLowerCase());
              }
            });

            if (matchedKeyword) {
              // 4. Check for duplicates (prevent multiple sends for same commenter on same media)
              const existingLeadSnap = await adminDb.collection('leads')
                .where('userId', '==', userId)
                .where('commenterId', '==', commenterId)
                .where('mediaId', '==', mediaId)
                .where('campaignId', '==', campaignId)
                .limit(1)
                .get();

              if (!existingLeadSnap.empty) {
                console.log('Duplicate lead detected for commenter:', commenterUsername);
                continue;
              }

              // 5. Send private reply / DM
              try {
                await sendInstagramPrivateReply(commentId, campaign.replyTemplate, accessToken);
                
                // 6. Log lead
                await adminDb.collection('leads').add({
                  userId,
                  campaignId,
                  commenterUsername,
                  commenterId,
                  commentText,
                  matchedKeyword,
                  mediaId,
                  status: 'sent',
                  createdAt: new Date()
                });

                // 7. Audit log
                await adminDb.collection('logs').add({
                  userId,
                  action: 'REPLY_SENT',
                  details: `Sent reply to @${commenterUsername} for comment: "${commentText}"`,
                  createdAt: new Date()
                });

              } catch (error: any) {
                console.error('Error sending reply:', error);
                
                // Log failure
                await adminDb.collection('leads').add({
                  userId,
                  campaignId,
                  commenterUsername,
                  commenterId,
                  commentText,
                  matchedKeyword,
                  mediaId,
                  status: 'failed',
                  failureReason: error.message,
                  createdAt: new Date()
                });
              }
            }
          }
        }
      }
    }
  }

  return NextResponse.json({ success: true });
}
