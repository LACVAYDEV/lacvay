import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { supabase } from '@/lib/supabase';
import { isAdminAccount } from '@/lib/adminAccess';
import { clearSessionMode, readSessionMode, writeSessionMode, type SessionMode } from '@/lib/sessionMode';

type UserProfile = Database['public']['Tables']['profiles']['Row'];



interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Account has admin privileges (role or env email). */
  isAdmin: boolean;
  /** Currently acting in admin mode (after explicit choice). */
  isAdminMode: boolean;
  /** Admin who has not picked user vs admin mode yet this session. */
  needsModeChoice: boolean;
  sessionMode: SessionMode | null;
  chooseSessionMode: (mode: SessionMode) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionMode, setSessionMode] = useState<SessionMode | null>(() => readSessionMode());

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('Error fetching user profile:', error);
        }
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        fetchProfile(initialSession.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        fetchProfile(nextSession.user.id);
      } else {
        setProfile(null);
        clearSessionMode();
        setSessionMode(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const isAdmin = isAdminAccount(user, profile);
  const isAdminMode = isAdmin && sessionMode === 'admin';
  const needsModeChoice = isAdmin && sessionMode === null;

  const chooseSessionMode = useCallback((mode: SessionMode) => {
    writeSessionMode(mode);
    setSessionMode(mode);
  }, []);



  const signInWithEmail = async (email: string, password: string) => {
    const mode = readSessionMode() || 'user';
    writeSessionMode(mode);
    setSessionMode(mode);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const mode = readSessionMode() || 'user';
    writeSessionMode(mode);
    setSessionMode(mode);
    
    // Use the current origin, or fallback to production if not localhost
    const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const redirectUrl = isLocalDev 
      ? `http://${window.location.host}`
      : window.location.origin;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    clearSessionMode();
    setSessionMode(null);
    setUser(null);
    setProfile(null);
    setSession(null);
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        refreshProfile,
        isAdmin,
        isAdminMode,
        needsModeChoice,
        sessionMode,
        chooseSessionMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
