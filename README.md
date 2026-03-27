# DishaDM - Instagram Automation SaaS

DishaDM is a powerful SaaS MVP that automates Instagram DMs and private replies based on post comments. It helps creators and businesses turn engagement into leads automatically.

## Core Features
- **Meta OAuth Integration**: Securely connect Instagram Professional accounts.
- **Keyword Triggering**: Automatically reply to comments containing specific keywords (e.g., "price", "link").
- **Lead Capture**: Automatically store commenter data as leads.
- **Dashboard**: Manage campaigns, view leads, and track activity.
- **Security**: Encrypted tokens at rest and secure webhook verification.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Framer Motion.
- **Backend**: Next.js API Routes, Node.js.
- **Database**: Firebase Firestore.
- **Authentication**: Firebase Auth (Google Login).
- **Icons**: Lucide React.

## Setup Instructions

### 1. Meta App Configuration
1. Create a Meta App at [developers.facebook.com](https://developers.facebook.com).
2. Add **Facebook Login for Business** and **Instagram Graph API** products.
3. Configure your **OAuth Redirect URI**:
   - Development: `https://ais-dev-rtukdzqy7f5ux2huuksw73-571692445064.asia-east1.run.app/api/auth/meta/callback`
   - Production: `https://ais-pre-rtukdzqy7f5ux2huuksw73-571692445064.asia-east1.run.app/api/auth/meta/callback`
4. Set up **Webhooks**:
   - Object: `instagram`
   - Callback URL: `https://<YOUR_APP_URL>/api/webhooks/instagram`
   - Verify Token: Your custom `META_VERIFY_TOKEN`.
   - Subscribe to `comments` field.

### 2. Environment Variables
Configure the following secrets in your AI Studio environment:
- `META_CLIENT_ID`: Your Meta App ID.
- `META_CLIENT_SECRET`: Your Meta App Secret.
- `META_VERIFY_TOKEN`: A random string for webhook verification.
- `ENCRYPTION_KEY`: A 32-character string for AES encryption.

### 3. Database Rules
The `firestore.rules` are already deployed. They ensure that users can only access their own data.

## Business Logic
- **Duplicates**: The system checks for existing leads for the same `commenterId` and `mediaId` to prevent spamming.
- **Keywords**: Supports both "Exact Match" and "Contains" logic.
- **Security**: Instagram access tokens are encrypted before being stored in Firestore.

## Developer Notes
- Webhook verification uses the `hub.verify_token` sent by Meta.
- Private replies are sent using the `/comment_id/replies` endpoint.
- Leads are captured in real-time as webhooks arrive.
