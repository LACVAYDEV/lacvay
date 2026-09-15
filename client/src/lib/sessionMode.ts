export type SessionMode = 'user' | 'admin';

const KEY = 'lacvay-session-mode';

export function readSessionMode(): SessionMode | null {
  const value = sessionStorage.getItem(KEY);
  return value === 'user' || value === 'admin' ? value : null;
}

export function writeSessionMode(mode: SessionMode): void {
  sessionStorage.setItem(KEY, mode);
}

export function clearSessionMode(): void {
  sessionStorage.removeItem(KEY);
}
