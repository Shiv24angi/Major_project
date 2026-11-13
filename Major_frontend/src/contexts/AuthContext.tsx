import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseService';
import { navigateTo, getPresetRoutePath } from '../shared/preset-site-routing';

export interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  role?: 'investor' | 'founder' | 'analyst';
  provider?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: AuthError | Error | null; data?: any }>;
  signInWithGithub: (redirectTo?: string) => Promise<{ error: AuthError | Error | null; data?: any }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | Error | null; data?: any }>;
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | Error | null; data?: any }>;
  signOut: () => Promise<{ error: AuthError | Error | null }>;
  loginAsDemoUser: (role?: 'investor' | 'founder') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_STORAGE_KEY = 'venturelens_demo_user';
const AUTH_REDIRECT_STORAGE_KEY = 'venturelens_auth_redirect';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Extract display profile
  const profile = useMemo<UserProfile | null>(() => {
    if (!user) return null;
    const meta = user.user_metadata || {};
    return {
      id: user.id,
      email: user.email,
      name:
        meta.full_name ||
        meta.name ||
        meta.user_name ||
        user.email?.split('@')[0] ||
        'Venture Analyst',
      avatarUrl: meta.avatar_url || meta.picture || '',
      role: meta.role || 'investor',
      provider: user.app_metadata?.provider || 'email',
    };
  }, [user]);

  useEffect(() => {
    let mounted = true;

    // 1. Check for active Supabase session
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[AuthContext] Session retrieval error:', error.message);
        }

        if (data?.session) {
          if (mounted) {
            setSession(data.session);
            setUser(data.session.user);
          }

          // Handle post-OAuth redirect if stored
          const postRedirect = sessionStorage.getItem(AUTH_REDIRECT_STORAGE_KEY);
          if (postRedirect) {
            sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
            const currentPath = getPresetRoutePath();
            if (currentPath === 'login' || currentPath === 'auth' || currentPath === 'signup' || !currentPath) {
              setTimeout(() => {
                navigateTo(postRedirect);
              }, 100);
            }
          }
          return;
        }

        // 2. Check for local demo user session if no live Supabase session
        const savedDemo = localStorage.getItem(DEMO_USER_STORAGE_KEY);
        if (savedDemo) {
          try {
            const parsed = JSON.parse(savedDemo);
            if (mounted) {
              setUser(parsed);
            }
          } catch (e) {
            localStorage.removeItem(DEMO_USER_STORAGE_KEY);
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Initialization exception:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // 3. Listen to Supabase auth state changes (OAuth redirects, tokens, sign in, sign out)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);

      if (event === 'SIGNED_IN' && currentSession) {
        // Clear local demo flag if real login occurs
        localStorage.removeItem(DEMO_USER_STORAGE_KEY);

        const postRedirect = sessionStorage.getItem(AUTH_REDIRECT_STORAGE_KEY);
        if (postRedirect) {
          sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
          setTimeout(() => {
            navigateTo(postRedirect);
          }, 100);
        }
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Determine the clean redirect URL for OAuth provider callbacks
   */
  const getOAuthRedirectUrl = (intendedRoute = 'new-analysis'): string => {
    sessionStorage.setItem(AUTH_REDIRECT_STORAGE_KEY, intendedRoute);
    const origin = window.location.origin;
    const pathname = window.location.pathname.replace(/\/+$/, '');
    // Supabase will redirect to this origin/path, and our hash router / onAuthStateChange will pick it up
    return `${origin}${pathname}/`;
  };

  /**
   * Google OAuth sign-in via Supabase
   */
  const signInWithGoogle = async (redirectTo = 'new-analysis') => {
    try {
      const redirectUrl = getOAuthRedirectUrl(redirectTo);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      return { data, error };
    } catch (err: any) {
      console.error('[AuthContext] Google OAuth error:', err);
      return { error: err, data: null };
    }
  };

  /**
   * GitHub OAuth sign-in via Supabase
   */
  const signInWithGithub = async (redirectTo = 'new-analysis') => {
    try {
      const redirectUrl = getOAuthRedirectUrl(redirectTo);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: redirectUrl,
          scopes: 'read:user user:email',
        },
      });

      return { data, error };
    } catch (err: any) {
      console.error('[AuthContext] GitHub OAuth error:', err);
      return { error: err, data: null };
    }
  };

  /**
   * Email and Password Sign In
   */
  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data?.user) {
        setUser(data.user);
        setSession(data.session);
        localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      }

      return { data, error };
    } catch (err: any) {
      return { error: err, data: null };
    }
  };

  /**
   * Email and Password Sign Up
   */
  const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0],
          },
        },
      });

      if (!error && data?.user) {
        setUser(data.user);
        setSession(data.session);
        localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      }

      return { data, error };
    } catch (err: any) {
      return { error: err, data: null };
    }
  };

  /**
   * Sign Out
   */
  const signOut = async () => {
    try {
      localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
      setUser(null);
      setSession(null);
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  /**
   * Demo bypass user for quick local testing before OAuth keys are configured
   */
  const loginAsDemoUser = (role: 'investor' | 'founder' = 'investor') => {
    const demoUser: any = {
      id: 'demo_user_01',
      app_metadata: { provider: 'demo' },
      user_metadata: {
        full_name: role === 'investor' ? 'Alex Mercer (Partner)' : 'Sarah Chen (Founder)',
        role,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      },
      email: role === 'investor' ? 'alex.mercer@venturecapital.io' : 'sarah.chen@innovatestartup.co',
      created_at: new Date().toISOString(),
    };

    localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(demoUser));
    setUser(demoUser);

    const postRedirect = sessionStorage.getItem(AUTH_REDIRECT_STORAGE_KEY) || 'new-analysis';
    sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
    navigateTo(postRedirect);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isAuthenticated: !!user,
        signInWithGoogle,
        signInWithGithub,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        loginAsDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
