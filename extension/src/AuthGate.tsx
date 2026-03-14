// ABOUTME: Guards the brand guidelines UI behind Supabase Google OAuth authentication
// ABOUTME: Uses chrome.identity.launchWebAuthFlow() for the Google sign-in popup

import React, { useState, useEffect } from 'react';
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

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

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setError('');

    try {
      const redirectUrl = chrome.identity.getRedirectURL();

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

      // Chrome's identity API handles the Google sign-in popup
      const responseUrl = await new Promise<string>((resolve, reject) => {
        chrome.identity.launchWebAuthFlow(
          { url: data.url, interactive: true },
          (callbackUrl) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else if (callbackUrl) {
              resolve(callbackUrl);
            } else {
              reject(new Error('No callback URL received'));
            }
          }
        );
      });

      // Supabase puts tokens in the URL hash after OAuth redirect
      const hashParams = new URLSearchParams(new URL(responseUrl).hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (!accessToken || !refreshToken) {
        throw new Error('Missing tokens in auth response');
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) throw sessionError;
    } catch (err: any) {
      console.error('[AuthGate] Google sign-in failed:', err);
      setError(err.message || 'Google sign in failed');
    } finally {
      setSigningIn(false);
    }
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
        <h2 style={styles.heading}>Vince</h2>
        <p style={styles.subtext}>Sign in with your account</p>
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
      {children}
      <button onClick={handleSignOut} style={styles.signOutButton} title="Sign out">
        Sign out
      </button>
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
    background: '#133B34',
    color: '#EAE8E3',
    fontFamily: 'Epilogue, system-ui, sans-serif',
  },
  heading: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#8b5cf6',
    marginBottom: '4px',
    fontFamily: 'Fraunces, serif',
  },
  subtext: {
    fontSize: '13px',
    color: '#EAE8E3',
    opacity: 0.7,
    marginBottom: '20px',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 24px',
    borderRadius: '6px',
    border: '1px solid rgba(234, 232, 227, 0.2)',
    background: 'rgba(234, 232, 227, 0.1)',
    color: '#EAE8E3',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    maxWidth: '280px',
    fontFamily: 'Epilogue, system-ui, sans-serif',
  },
  error: {
    color: '#ef4444',
    fontSize: '12px',
    margin: '0 0 12px 0',
    maxWidth: '280px',
    textAlign: 'center',
  },
  text: {
    color: '#EAE8E3',
    opacity: 0.7,
    fontSize: '14px',
  },
  spinner: {
    width: '24px',
    height: '24px',
    border: '3px solid rgba(234, 232, 227, 0.2)',
    borderTopColor: '#8b5cf6',
    borderRadius: '50%',
    marginBottom: '12px',
    animation: 'authSpinnerSpin 0.8s linear infinite',
  },
  signOutButton: {
    position: 'fixed',
    bottom: 8,
    right: 8,
    zIndex: 50,
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    fontSize: '10px',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: '2px 4px',
  },
};
