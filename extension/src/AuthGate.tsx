// ABOUTME: Guards the extension UI behind Supabase email/password authentication
// ABOUTME: Consistent with mobile and web app sign-in experience

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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

  const handleSignIn = async () => {
    if (!email.trim() || !password) return;
    setSigningIn(true);
    setError('');
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) throw signInError;
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
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
        <p style={styles.subtext}>Sign in to your account</p>
        {error && <p style={styles.error}>{error}</p>}
        <div style={{ width: '100%', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            style={styles.input}
            onKeyDown={e => e.key === 'Enter' && handleSignIn()}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            style={styles.input}
            onKeyDown={e => e.key === 'Enter' && handleSignIn()}
          />
          <button onClick={handleSignIn} disabled={signingIn || !email.trim() || !password} style={styles.button}>
            {signingIn ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
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
    background: '#0d0d0d',
    color: 'var(--ext-text)',
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
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(234, 232, 227, 0.2)',
    background: 'rgba(234, 232, 227, 0.07)',
    color: '#EAE8E3',
    fontSize: '14px',
    fontFamily: 'Epilogue, system-ui, sans-serif',
    outline: 'none',
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
