export interface MetaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export interface MetaLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface MetaPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: {
    id: string;
    username: string;
  };
}

export async function fetchMetaLongLivedToken(shortLivedToken: string): Promise<string> {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: process.env.META_CLIENT_ID!,
    client_secret: process.env.META_CLIENT_SECRET!,
    fb_exchange_token: shortLivedToken,
  });

  const response = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch long-lived token');
  }
  const data: MetaLongLivedTokenResponse = await response.json();
  return data.access_token;
}

export async function fetchMetaPages(accessToken: string): Promise<MetaPage[]> {
  const response = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=name,access_token,instagram_business_account{id,username}&access_token=${accessToken}`);
  if (!response.ok) {
    throw new Error('Failed to fetch pages');
  }
  const data = await response.json();
  return data.data;
}

export async function sendInstagramDM(recipientId: string, message: string, accessToken: string) {
  const response = await fetch(`https://graph.facebook.com/v19.0/me/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: message },
      access_token: accessToken,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to send DM');
  }
  return response.json();
}

export async function sendInstagramPrivateReply(commentId: string, message: string, accessToken: string) {
  const response = await fetch(`https://graph.facebook.com/v19.0/${commentId}/replies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: message,
      access_token: accessToken,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to send private reply');
  }
  return response.json();
}
