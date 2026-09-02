import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@/types';
import { authService, type Credentials, type SignUpData } from '@/services/authService';

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  isAuthenticated: boolean;
  signIn: (credentials: Credentials) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
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
    setUser(await authService.signIn(credentials));
  }, []);

  const signUp = useCallback(async (data: SignUpData) => {
    setUser(await authService.signUp(data));
  }, []);

  const signInAsGuest = useCallback(async () => {
    setUser(await authService.signInAsGuest());
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        initializing,
        isAuthenticated: user !== null,
        signIn,
        signUp,
        signInAsGuest,
        signOut,
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
