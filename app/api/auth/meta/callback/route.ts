import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { encrypt } from '@/lib/encryption';
import { fetchMetaLongLivedToken, fetchMetaPages } from '@/lib/meta';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  try {
    // 1. Exchange code for short-lived token
    const clientId = process.env.META_CLIENT_ID;
    const clientSecret = process.env.META_CLIENT_SECRET;
    const redirectUri = `${process.env.APP_URL}/api/auth/meta/callback`;

    const tokenResponse = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&redirect_uri=${redirectUri}&client_secret=${clientSecret}&code=${code}`);
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error?.message || 'Failed to exchange code');
    }

    const shortLivedToken = tokenData.access_token;

    // 2. Exchange for long-lived token
    const longLivedToken = await fetchMetaLongLivedToken(shortLivedToken);

    // 3. Fetch pages and linked IG accounts
    const pages = await fetchMetaPages(longLivedToken);
    const pageWithIG = pages.find(p => p.instagram_business_account);

    if (!pageWithIG || !pageWithIG.instagram_business_account) {
      throw new Error('No Instagram Professional account found linked to your Facebook Pages');
    }

    // 4. Encrypt token and update user profile
    // Note: In a real app, we'd need to know WHICH user this is.
    // Since we're in a popup, we can use a state parameter or session.
    // For this MVP, we'll assume the user is authenticated and we'll use a placeholder or 
    // better yet, we'll return a success page that tells the parent to refresh.
    // BUT we need the userId. We'll use the 'state' parameter to pass the userId.
    
    const encryptedToken = encrypt(longLivedToken);
    
    // For now, we'll just return a success script that sends the data back to the parent
    // The parent will then call an API to save the token.
    
    return new NextResponse(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS',
                data: {
                  accessToken: "${encryptedToken}",
                  instagramAccountId: "${pageWithIG.instagram_business_account.id}",
                  instagramUsername: "${pageWithIG.instagram_business_account.username}",
                  instagramPageId: "${pageWithIG.id}"
                }
              }, '*');
              window.close();
            } else {
              window.location.href = '/dashboard/settings';
            }
          </script>
          <p>Authentication successful. Saving your account details...</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error: any) {
    console.error('OAuth Callback Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
