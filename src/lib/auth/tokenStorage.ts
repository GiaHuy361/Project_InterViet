/**
 * Auth token storage — keys per Phase 1 spec
 */

import type { AuthResponse } from '../api/apiTypes';

export const TOKEN_KEYS = {
  accessToken: 'interviet.accessToken',
  refreshToken: 'interviet.refreshToken',
  accessTokenExpiry: 'interviet.accessTokenExpiry',
  refreshTokenExpiry: 'interviet.refreshTokenExpiry',
  authUser: 'interviet.authUser',
} as const;

export type StoredAuthUser = {
  userId: string;
  email: string;
  fullName: string;
  status: string;
  emailVerified: boolean;
};

export type StoredAuthTokens = {
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiry: string | null;
  refreshTokenExpiry: string | null;
  authUser: StoredAuthUser | null;
};

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore quota / private mode
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function saveAuthFromResponse(response: AuthResponse): void {
  safeSet(TOKEN_KEYS.accessToken, response.accessToken);
  safeSet(TOKEN_KEYS.refreshToken, response.refreshToken);
  safeSet(TOKEN_KEYS.accessTokenExpiry, response.accessTokenExpiry);
  safeSet(TOKEN_KEYS.refreshTokenExpiry, response.refreshTokenExpiry);

  const authUser: StoredAuthUser = {
    userId: response.userId,
    email: response.email,
    fullName: response.fullName,
    status: response.status,
    emailVerified: response.emailVerified,
  };
  safeSet(TOKEN_KEYS.authUser, JSON.stringify(authUser));
}

export function loadAuthFromStorage(): StoredAuthTokens {
  const authUserRaw = safeGet(TOKEN_KEYS.authUser);
  let authUser: StoredAuthUser | null = null;

  if (authUserRaw) {
    try {
      authUser = JSON.parse(authUserRaw) as StoredAuthUser;
    } catch {
      authUser = null;
    }
  }

  return {
    accessToken: safeGet(TOKEN_KEYS.accessToken),
    refreshToken: safeGet(TOKEN_KEYS.refreshToken),
    accessTokenExpiry: safeGet(TOKEN_KEYS.accessTokenExpiry),
    refreshTokenExpiry: safeGet(TOKEN_KEYS.refreshTokenExpiry),
    authUser,
  };
}

export function clearAuthStorage(): void {
  Object.values(TOKEN_KEYS).forEach(safeRemove);
}

export function updateEmailVerified(verified: boolean): void {
  const raw = safeGet(TOKEN_KEYS.authUser);
  if (!raw) return;

  try {
    const user = JSON.parse(raw) as StoredAuthUser;
    user.emailVerified = verified;
    safeSet(TOKEN_KEYS.authUser, JSON.stringify(user));
  } catch {
    // ignore
  }
}
