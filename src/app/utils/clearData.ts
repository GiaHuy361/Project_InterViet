/**
 * Utility to clear all application data from localStorage
 */

import { TOKEN_KEYS, clearAuthStorage } from '../../lib/auth/tokenStorage';

const STORAGE_KEYS = [
  'interviet_app_state',
  'interviet_events',
  ...Object.values(TOKEN_KEYS),
];

function maskToken(value: string | null): string {
  if (!value) return '(trống)';
  if (value.length <= 8) return '****';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function clearAllData(): boolean {
  try {
    STORAGE_KEYS.forEach((key) => {
      localStorage.removeItem(key);
    });
    clearAuthStorage();
    return true;
  } catch (error) {
    console.error('Lỗi khi xóa dữ liệu:', error);
    return false;
  }
}

export function clearAndReload(): void {
  if (clearAllData()) {
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }
}

export function showCurrentData(): void {
  console.log('Dữ liệu INTER-VIET (token đã mask):');

  STORAGE_KEYS.forEach((key) => {
    const raw = localStorage.getItem(key);

    if (key.includes('Token') && raw) {
      console.log(`${key}:`, maskToken(raw));
      return;
    }

    if (raw) {
      try {
        console.log(`${key}:`, JSON.parse(raw));
      } catch {
        console.log(`${key}:`, raw);
      }
    } else {
      console.log(`${key}: (trống)`);
    }
  });
}

if (typeof window !== 'undefined') {
  (window as Window & {
    clearInterVietData?: () => boolean;
    clearInterVietDataAndReload?: () => void;
    showInterVietData?: () => void;
  }).clearInterVietData = clearAllData;
  (window as Window & { clearInterVietDataAndReload?: () => void }).clearInterVietDataAndReload =
    clearAndReload;
  (window as Window & { showInterVietData?: () => void }).showInterVietData = showCurrentData;
}
