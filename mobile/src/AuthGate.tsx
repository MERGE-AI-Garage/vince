// ABOUTME: Guards the Brand Lens mobile app behind Supabase Google OAuth authentication
// ABOUTME: Uses Capacitor Browser (SFSafariViewController on iOS) for OAuth

import React, { useState, useEffect } from 'react';
import { Browser } from '@capacitor/browser';
import { App as CapApp } from '@capacitor/app';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }).catch((err) => {
      console.error('[AuthGate] Failed to get session:', err);
      setError('Unable to connect. Check your network and try again.');
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Listen for deep link callback after OAuth completes
    const deepLinkListener = CapApp.addListener('appUrlOpen', async ({ url }) => {
      if (url.includes('auth/callback') || url.includes('access_token')) {
        await Browser.close();

        const hashPart = url.includes('#') ? url.split('#')[1] : '';
        const params = new URLSearchParams(hashPart);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) {
            console.error('[AuthGate] Failed to set session:', sessionError);
            setError('Authentication failed. Please try again.');
          }
        }
        setSigningIn(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      deepLinkListener.then(l => l.remove());
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setError('');

    try {
      const redirectUrl = 'brandlens://auth/callback';

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (oauthError || !data.url) {
        throw oauthError || new Error('Failed to get auth URL');
      }

      // Open in SFSafariViewController — Google allows OAuth here (not in WKWebView)
      await Browser.open({ url: data.url, presentationStyle: 'popover' });
    } catch (err: any) {
      console.error('[AuthGate] Google sign-in failed:', err);
      setError(err.message || 'Google sign in failed');
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <style>{`@keyframes authSpinnerSpin { to { transform: rotate(360deg); } }`}</style>
        <div style={styles.spinner} />
        <p style={styles.text}>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={styles.container}>
        <h2 style={styles.heading}>Brand Lens</h2>
        <p style={styles.subtext}>Sign in with your Google account</p>
        {error && <p style={styles.error}>{error}</p>}
        <button
          onClick={handleGoogleSignIn}
          disabled={signingIn}
          style={styles.button}
        >
          {signingIn ? (
            'Signing in...'
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <>
      <div style={styles.signOutBar}>
        <button onClick={handleSignOut} style={styles.signOutButton}>Sign out</button>
      </div>
      {children}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '24px',
    background: '#0f0a1e',
    color: '#e0e0e0',
    fontFamily: 'system-ui, sans-serif',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#a855f7',
    marginBottom: '4px',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  subtext: {
    fontSize: '14px',
    color: '#9ca3af',
    marginBottom: '24px',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px 24px',
    borderRadius: '8px',
    border: '1px solid #374151',
    background: '#1e1632',
    color: '#e0e0e0',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    maxWidth: '300px',
    minHeight: '48px',
  },
  error: {
    color: '#ef4444',
    fontSize: '13px',
    margin: '0 0 16px 0',
    maxWidth: '300px',
    textAlign: 'center' as const,
  },
  text: {
    color: '#9ca3af',
    fontSize: '14px',
  },
  spinner: {
    width: '28px',
    height: '28px',
    border: '3px solid #374151',
    borderTopColor: '#a855f7',
    borderRadius: '50%',
    marginBottom: '12px',
    animation: 'authSpinnerSpin 0.8s linear infinite',
  },
  signOutBar: {
    position: 'absolute' as const,
    top: 'env(safe-area-inset-top, 0px)',
    right: 0,
    zIndex: 50,
    padding: '8px 12px',
  },
  signOutButton: {
    background: 'none',
    border: 'none',
    color: '#6b7280',
    fontSize: '12px',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: '4px 8px',
  },
};
