import type { User } from '@supabase/supabase-js';

const SETTINGS_KEY_PREFIX = 'lacvay-preferences';

export interface StoredPreferences {
  language: 'en';
  theme: 'light';
  notifications: boolean;
  location: boolean;
}

export const defaultPreferences: StoredPreferences = {
  language: 'en',
  theme: 'light',
  notifications: true,
  location: true,
};

export function getPreferencesStorageKey(userId?: string): string {
  return `${SETTINGS_KEY_PREFIX}-${userId ?? 'guest'}`;
}

export function readPreferences(user: User | null): StoredPreferences {
  const accountPreferences = user?.user_metadata?.preferences as Partial<StoredPreferences> | undefined;
  let localPreferences: Partial<StoredPreferences> = {};
  const settingsKey = getPreferencesStorageKey(user?.id);
  const stored = localStorage.getItem(settingsKey);

  if (stored) {
    try {
      localPreferences = JSON.parse(stored) as Partial<StoredPreferences>;
    } catch {
      localStorage.removeItem(settingsKey);
    }
  }

  const preferences = { ...defaultPreferences, ...localPreferences, ...accountPreferences };
  return {
    language: 'en',
    theme: 'light',
    notifications: Boolean(preferences.notifications),
    location: Boolean(preferences.location),
  };
}
