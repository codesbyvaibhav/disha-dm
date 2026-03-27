'use client';

import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { 
  Instagram, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Shield, 
  Key, 
  Mail, 
  User as UserIcon,
  ExternalLink
} from 'lucide-react';
import { handleFirestoreError, OperationType } from '@/lib/firestore-utils';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  instagramAccountId?: string;
  instagramPageId?: string;
  instagramUsername?: string;
  createdAt: any;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const docRef = doc(db, 'users', user?.uid!);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setProfile({ id: snap.id, ...snap.data() } as any);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${user?.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectInstagram = async () => {
    setConnecting(true);
    try {
      // 1. Fetch the OAuth URL from our server
      const response = await fetch('/api/auth/meta/url');
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();

      // 2. Open the OAuth PROVIDER's URL directly in popup
      const authWindow = window.open(
        url,
        'meta_oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        alert('Please allow popups for this site to connect your account.');
        return;
      }

      // 3. Listen for success message from popup
      const handleMessage = async (event: MessageEvent) => {
        const origin = event.origin;
        if (!origin.endsWith('.run.app') && !origin.includes('localhost')) return;
        
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          const { accessToken, instagramAccountId, instagramUsername, instagramPageId } = event.data.data;
          
          try {
            const res = await fetch('/api/users/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user?.uid,
                instagramAccountId,
                instagramUsername,
                instagramPageId,
                accessToken
              })
            });

            if (res.ok) {
              fetchProfile();
            } else {
              console.error('Failed to update profile');
            }
          } catch (error) {
            console.error('Error updating profile:', error);
          }
          
          window.removeEventListener('message', handleMessage);
        }
      };
      window.addEventListener('message', handleMessage);
    } catch (error) {
      console.error('OAuth error:', error);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Settings</h1>
          <p className="text-slate-500">Manage your account and connected platforms.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-indigo-600" /> Profile Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl text-slate-900 font-medium">
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  {profile?.displayName || 'User'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl text-slate-900 font-medium">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {profile?.email}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Instagram className="w-5 h-5 text-pink-600" /> Instagram Connection
              </h3>
              {profile?.instagramAccountId && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </span>
              )}
            </div>

            {profile?.instagramAccountId ? (
              <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold">
                      {profile.instagramUsername?.[0].toUpperCase() || 'I'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">@{profile.instagramUsername || 'Connected Account'}</p>
                      <p className="text-xs text-slate-500">ID: {profile.instagramAccountId}</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleConnectInstagram}
                    className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${connecting ? 'animate-spin' : ''}`} />
                    Reconnect
                  </button>
                </div>

                {profile.instagramUsername && (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Instagram Profile Link</label>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 truncate font-medium text-slate-900 bg-white px-4 py-2 rounded-lg border border-slate-200">
                        https://www.instagram.com/{profile.instagramUsername}
                      </div>
                      <a 
                        href={`https://www.instagram.com/${profile.instagramUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-700 font-bold text-sm flex items-center gap-1 shrink-0 px-4 py-2 hover:bg-indigo-50 rounded-xl transition-all"
                      >
                        Visit <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-4 bg-blue-50 text-blue-700 rounded-xl text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>
                    Your connection is active. We are monitoring comments on your professional account. 
                    If you change your password or revoke permissions, you&apos;ll need to reconnect.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-pink-50 rounded-3xl flex items-center justify-center text-pink-600 mx-auto mb-6">
                  <Instagram className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">Connect your Instagram</h4>
                <p className="text-slate-500 max-w-sm mx-auto mb-8">
                  Link your Instagram Professional account to start automating your comment replies and DMs.
                </p>
                <button 
                  onClick={handleConnectInstagram}
                  disabled={connecting}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
                >
                  {connecting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Instagram className="w-5 h-5" />}
                  Connect Instagram Professional
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" /> Security
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Key className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">API Access</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full uppercase">Secure</span>
              </div>
              <p className="text-xs text-slate-400">
                Your Instagram tokens are encrypted at rest using AES-256 encryption. We never store raw tokens.
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-indigo-600" /> Resources
            </h3>
            <div className="space-y-3">
              <a href="#" className="block text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Documentation</a>
              <a href="#" className="block text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Privacy Policy</a>
              <a href="#" className="block text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Terms of Service</a>
              <a href="#" className="block text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Meta API Status</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
