// ABOUTME: Auth context for Brand Lens.
// ABOUTME: Provides user session, profile, and authentication state.

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type UserRole = 'admin' | 'board_admin' | 'user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  profile: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Effect 1: Listen to auth state changes — ONLY set session/user, no async DB calls
  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        console.log('[Auth] event:', _event, 'session:', !!session);
        setSession(session);
        setUser(session?.user ?? null);

        // If no session, we're done loading — no data to fetch
        if (!session) {
          setUserRole(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Safety timeout — if onAuthStateChange never fires, unblock the app
    const timeout = setTimeout(() => {
      if (mounted) {
        console.warn('[Auth] Safety timeout — unblocking app');
        setLoading(false);
      }
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  // Effect 2: When user changes, fetch role and profile in a SEPARATE tick
  // This avoids the Supabase gotcha of making DB calls inside onAuthStateChange
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const fetchData = async () => {
      try {
        const [roleResult, profileResult] = await Promise.all([
          supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle(),
        ]);

        if (cancelled) return;

        setUserRole((roleResult.data?.role as UserRole) || 'user');
        setProfile(profileResult.data || null);
      } catch (err) {
        console.error('[Auth] Failed to fetch user data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => { cancelled = true; };
  }, [user?.id]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      return { error };
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, userRole, loading, signIn, signOut, profile }}>
      {children}
    </AuthContext.Provider>
  );
};
