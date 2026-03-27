import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.META_CLIENT_ID;
  const redirectUri = `${process.env.APP_URL}/api/auth/meta/callback`;
  
  // Scopes needed for Instagram Professional
  const scopes = [
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_metadata',
    'instagram_basic',
    'instagram_manage_comments',
    'instagram_manage_messages',
    'public_profile',
    'email'
  ].join(',');

  const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&response_type=code`;

  return NextResponse.json({ url });
}
