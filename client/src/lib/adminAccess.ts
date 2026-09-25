import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/types';

/** Admin access is determined only by Supabase `profiles.role` (or auth metadata fallback). */
export function isAdminAccount(
  user: User | null | undefined,
  profile: Pick<UserProfile, 'email'> & { role?: string | null } | null | undefined,
): boolean {
  if (profile?.role === 'admin') return true;
  if (user?.user_metadata?.role === 'admin') return true;
  return false;
}
