import type { User, UserRole } from '@/types';

export function getUserRole(user: User | null | undefined): UserRole {
  return user?.role ?? 'traveler';
}

export function isTranspoPartner(user: User | null | undefined): boolean {
  return getUserRole(user) === 'transpo_partner';
}

export function getHomePath(user: User | null | undefined): '/' | '/partner' {
  return isTranspoPartner(user) ? '/partner' : '/';
}
