import type { User } from '@/types';
import { mockUser } from '@/data/mockData';

export interface Credentials {
  email: string;
  password: string;
}

export interface SignUpData extends Credentials {
  name: string;
}

export class AuthError extends Error {}

const SESSION_KEY = 'lacvay-auth-session';
const PROFILES_KEY = 'lacvay-auth-profiles';

/**
 * Mock authentication backed by localStorage.
 *
 * Credentials are never verified or stored here — that is the job of Firebase
 * Authentication. Only the display profile is persisted so the mock session can
 * be restored on reload. Swap the bodies of these functions for Firebase Auth
 * calls (`signInWithEmailAndPassword`, `createUserWithEmailAndPassword`,
 * `signOut`) and the rest of the app keeps working unchanged.
 */

const delay = (ms = 550) => new Promise((resolve) => setTimeout(resolve, ms));

function readProfiles(): Record<string, User> {
  try {
    return JSON.parse(localStorage.getItem(PROFILES_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeProfile(user: User) {
  const profiles = readProfiles();
  profiles[user.email.toLowerCase()] = user;
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

function avatarFor(seed: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
}

export function validateName(name: string): string | null {
  if (!name.trim()) return 'Name is required';
  if (name.trim().length < 2) return 'Enter your full name';
  return null;
}

export const authService = {
  async signIn({ email, password }: Credentials): Promise<User> {
    const error = validateEmail(email) ?? validatePassword(password);
    if (error) throw new AuthError(error);

    await delay();

    const key = email.toLowerCase();
    const existing = readProfiles()[key];
    const user: User =
      existing ?? {
        id: key,
        name: email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        email,
        avatarUrl: avatarFor(key),
      };

    writeProfile(user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  async signUp({ name, email, password }: SignUpData): Promise<User> {
    const error = validateName(name) ?? validateEmail(email) ?? validatePassword(password);
    if (error) throw new AuthError(error);

    await delay();

    const key = email.toLowerCase();
    if (readProfiles()[key]) {
      throw new AuthError('An account with this email already exists');
    }

    const user: User = { id: key, name: name.trim(), email, avatarUrl: avatarFor(key) };
    writeProfile(user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  async signInAsGuest(): Promise<User> {
    await delay(250);
    localStorage.setItem(SESSION_KEY, JSON.stringify(mockUser));
    return mockUser;
  },

  async signOut(): Promise<void> {
    localStorage.removeItem(SESSION_KEY);
  },

  getSession(): User | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  },
};
