import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/types';

const ADMIN_EMAILS_KEY = 'lacvay-admin-emails';

function parseEnvAdmins(): string[] {
  const raw = import.meta.env.VITE_ADMIN_EMAILS ?? '';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function readPromotedAdmins(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(ADMIN_EMAILS_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.map((e) => String(e).toLowerCase()) : [];
  } catch {
    return [];
  }
}

export function getAdminEmails(): string[] {
  return [...new Set([...parseEnvAdmins(), ...readPromotedAdmins()])];
}

export function isAdminUser(user: User | null | undefined): boolean {
  if (!user?.email) return false;
  const email = user.email.toLowerCase();
  if (user.user_metadata?.role === 'admin') return true;
  return getAdminEmails().includes(email);
}

export function isAdminAccount(
  user: User | null | undefined,
  profile: Pick<UserProfile, 'email'> & { role?: string | null } | null | undefined,
): boolean {
  if (profile?.role === 'admin') return true;
  return isAdminUser(user);
}

/** @deprecated Use adminService.setUserAdmin with Supabase profile.role */
export function setUserAdmin(email: string, isAdmin: boolean): void {
  const normalized = email.trim().toLowerCase();
  const envAdmins = parseEnvAdmins();
  if (envAdmins.includes(normalized) && !isAdmin) return;

  const promoted = readPromotedAdmins().filter((e) => e !== normalized);
  if (isAdmin) promoted.push(normalized);
  localStorage.setItem(ADMIN_EMAILS_KEY, JSON.stringify(promoted));
}

export function isEnvAdmin(email: string): boolean {
  return parseEnvAdmins().includes(email.trim().toLowerCase());
}
