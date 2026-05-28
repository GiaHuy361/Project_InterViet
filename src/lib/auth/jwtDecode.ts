/**
 * JWT Decode Utility for INTER-VIET
 *
 * Decodes JWT payload to extract role and other claims.
 * No external library needed — uses native base64url decoding.
 *
 * IMPORTANT: This is client-side decoding for UI/routing only.
 * All actual authorization is enforced by the backend.
 */

/**
 * System roles matching backend C# roles.
 * - 'user' (Candidate): default role for registered users
 * - 'support' (Support Staff): customer support role
 * - 'admin' (Administrator): full system access
 */
export type SystemRole = 'user' | 'support' | 'admin' | 'mentor';

/** Standard JWT payload fields + custom claims */
export interface JwtPayload {
  /** Subject (user ID) */
  sub?: string;
  /** Email */
  email?: string;
  /** Full name */
  name?: string;
  /** Role claim — may be 'role' or ASP.NET URI claim */
  role?: string;
  /** Expiration time (Unix timestamp) */
  exp?: number;
  /** Issued at (Unix timestamp) */
  iat?: number;
  /** Not before (Unix timestamp) */
  nbf?: number;
  /** Issuer */
  iss?: string;
  /** Audience */
  aud?: string | string[];
  /** JWT ID */
  jti?: string;
  /** Any additional claims */
  [key: string]: unknown;
}

/**
 * Known claim names for role in ASP.NET / custom JWT.
 * Checked in order — first match wins.
 */
const ROLE_CLAIM_NAMES = [
  'role',
  'roleCode',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
] as const;

/**
 * Valid system roles set for fast lookup
 */
const VALID_ROLES = new Set<string>(['user', 'support', 'admin', 'mentor']);

/**
 * Decode base64url string to UTF-8 string.
 * Handles the base64url → base64 conversion (replacing - and _ chars, adding padding).
 */
function base64UrlDecode(str: string): string {
  // Replace base64url chars with standard base64 chars
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if needed
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }

  // Decode base64 to binary string, then to UTF-8
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Decode the payload section of a JWT token.
 *
 * @param token - The full JWT string (header.payload.signature)
 * @returns Decoded payload object, or null if decoding fails
 *
 * @example
 * ```ts
 * const payload = decodeJwtPayload(accessToken);
 * if (payload) {
 *   console.log(payload.sub, payload.email, payload.role);
 * }
 * ```
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('[jwtDecode] Invalid JWT format: expected 3 parts, got', parts.length);
      return null;
    }

    const payloadJson = base64UrlDecode(parts[1]);
    return JSON.parse(payloadJson) as JwtPayload;
  } catch (error) {
    console.warn('[jwtDecode] Failed to decode JWT payload:', error);
    return null;
  }
}

/**
 * Extract the system role from a JWT token.
 *
 * Checks multiple claim names in priority order:
 * 1. `role`
 * 2. `roleCode`
 * 3. ASP.NET default role claim URI
 *
 * @param token - The full JWT string
 * @returns The system role, defaults to 'user' if not found or invalid
 *
 * @example
 * ```ts
 * const role = getRoleFromToken(accessToken);
 * // 'user' | 'support' | 'admin'
 * ```
 */
export function getRoleFromToken(token: string): SystemRole {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return 'user';
  }

  // Check each known claim name for a role value
  for (const claimName of ROLE_CLAIM_NAMES) {
    const value = payload[claimName];
    if (typeof value === 'string') {
      const normalized = value.toLowerCase().trim();
      if (VALID_ROLES.has(normalized)) {
        return normalized as SystemRole;
      }
    }
    // Handle case where role is an array (ASP.NET can emit arrays)
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') {
          const normalized = item.toLowerCase().trim();
          if (VALID_ROLES.has(normalized)) {
            return normalized as SystemRole;
          }
        }
      }
    }
  }

  // Default to 'user' (candidate) if no role claim found
  return 'user';
}

/**
 * Check if the JWT token is expired.
 *
 * @param token - The full JWT string
 * @param bufferSeconds - Optional buffer in seconds before actual expiry (default: 30)
 * @returns true if expired or could not determine expiry
 */
export function isTokenExpired(token: string, bufferSeconds = 30): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return true;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp - bufferSeconds <= nowSeconds;
}
