export interface PollingSessionSnapshot<T> {
  activeSessionId: string | null;
  sessionDetail: T | null;
  lastNotifiedStatus: string | null;
  [key: string]: unknown;
}

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

export function readPollingSessionSnapshot<T>(storageKey: string): PollingSessionSnapshot<T> | null {
  if (!canUseSessionStorage()) return null;

  try {
    const rawValue = window.sessionStorage.getItem(storageKey);
    if (!rawValue) return null;
    return JSON.parse(rawValue) as PollingSessionSnapshot<T>;
  } catch {
    return null;
  }
}

export function writePollingSessionSnapshot<T>(storageKey: string, snapshot: PollingSessionSnapshot<T>): void {
  if (!canUseSessionStorage()) return;

  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(snapshot));
  } catch {
    // Ignore storage quota / serialization errors.
  }
}

export function clearPollingSessionSnapshot(storageKey: string): void {
  if (!canUseSessionStorage()) return;

  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {
    // Ignore storage errors.
  }
}