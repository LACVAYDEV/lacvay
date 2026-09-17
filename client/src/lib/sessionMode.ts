export type SessionMode = 'user' | 'admin';

const KEY = 'lacvay-session-mode';

export function readSessionMode(): SessionMode | null {
  try {
    const value = localStorage.getItem(KEY) || sessionStorage.getItem(KEY);
    return value === 'user' || value === 'admin' ? value : null;
  } catch {
    return null;
  }
}

export function writeSessionMode(mode: SessionMode): void {
  try {
    localStorage.setItem(KEY, mode);
    sessionStorage.setItem(KEY, mode);
  } catch (e) {
    console.error('Failed to save session mode:', e);
  }
}

export function clearSessionMode(): void {
  try {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
  } catch (e) {
    console.error('Failed to clear session mode:', e);
  }
}
