import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@/types';
import { authService, type Credentials, type SignUpData } from '@/services/authService';
import { isTranspoPartner } from '@/lib/auth';

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  isAuthenticated: boolean;
  isTranspoPartner: boolean;
  signIn: (credentials: Credentials) => Promise<User>;
  signUp: (data: SignUpData) => Promise<User>;
  signInAsGuest: () => Promise<User>;
  signInAsPartner: () => Promise<User>;
  signOut: () => Promise<void>;
  updateUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    setUser(authService.getSession());
    setInitializing(false);
  }, []);

  const signIn = useCallback(async (credentials: Credentials) => {
    const next = await authService.signIn(credentials);
    setUser(next);
    return next;
  }, []);

  const signUp = useCallback(async (data: SignUpData) => {
    const next = await authService.signUp(data);
    setUser(next);
    return next;
  }, []);

  const signInAsGuest = useCallback(async () => {
    const next = await authService.signInAsGuest();
    setUser(next);
    return next;
  }, []);

  const signInAsPartner = useCallback(async () => {
    const next = await authService.signInAsPartner();
    setUser(next);
    return next;
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
  }, []);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      authService.persistUser(next);
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        initializing,
        isAuthenticated: user !== null,
        isTranspoPartner: isTranspoPartner(user),
        signIn,
        signUp,
        signInAsGuest,
        signInAsPartner,
        signOut,
        updateUser,
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
