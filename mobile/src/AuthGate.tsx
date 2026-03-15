// ABOUTME: Guards the Vince mobile app behind Supabase email/password authentication
// ABOUTME: Uses Capacitor Preferences storage via the swapped Supabase mobile client

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setError('');

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
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
        <style>{`@keyframes authSpin { to { transform: rotate(360deg); } }`}</style>
        <div style={styles.spinner} />
      </div>
    );
  }

  if (!session) {
    return (
      <div style={styles.container}>
        {/* V mark */}
        <div style={styles.orbWrap}>
          <div style={styles.orb}>
            <svg width="36" height="32" viewBox="0 0 36 32" fill="none">
              <path d="M 4 3 L 18 29" stroke="rgba(255,255,255,0.9)" strokeWidth="3.5" strokeLinecap="round"/>
              <path d="M 32 3 L 18 29" stroke="rgba(255,255,255,0.9)" strokeWidth="3.5" strokeLinecap="round"/>
              <circle cx="18" cy="29" r="2.5" fill="white"/>
            </svg>
          </div>
        </div>

        <h1 style={styles.heading}>Vince</h1>
        <p style={styles.subtext}>Creative Director</p>

        <form onSubmit={handleSignIn} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={styles.input}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" disabled={signingIn || !email || !password} style={styles.button}>
            {signingIn ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '32px 24px',
    background: 'radial-gradient(ellipse at 50% 38%, #2d1158 0%, #1a0840 25%, #0f0a1e 55%, #080510 100%)',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  orbWrap: {
    position: 'relative' as const,
    marginBottom: 28,
  },
  orb: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 33% 30%, #d8b4fe, #a855f7 45%, #6d28d9)',
    boxShadow: '0 0 40px rgba(168, 85, 247, 0.4), 0 0 80px rgba(168, 85, 247, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 32,
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: 8,
    margin: '0 0 4px',
  },
  subtext: {
    fontSize: 10,
    fontWeight: 500,
    color: '#c084fc',
    textTransform: 'uppercase' as const,
    letterSpacing: 4,
    margin: '0 0 36px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
    width: '100%',
    maxWidth: 320,
  },
  input: {
    padding: '14px 16px',
    borderRadius: 10,
    border: '1px solid rgba(168, 85, 247, 0.3)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#ffffff',
    fontSize: 16,
    outline: 'none',
    WebkitAppearance: 'none' as any,
  },
  button: {
    padding: '14px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 4,
    minHeight: 52,
  },
  error: {
    color: '#f87171',
    fontSize: 13,
    margin: 0,
    textAlign: 'center' as const,
  },
  spinner: {
    width: 28,
    height: 28,
    border: '3px solid rgba(168, 85, 247, 0.2)',
    borderTopColor: '#a855f7',
    borderRadius: '50%',
    animation: 'authSpin 0.8s linear infinite',
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
    fontSize: 12,
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: '4px 8px',
  },
};
