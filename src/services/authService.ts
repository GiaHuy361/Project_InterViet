/**
 * Auth Service for INTER-VIET
 *
 * EXACT BACKEND CONTRACT IMPLEMENTATION
 * All endpoints match C# backend exactly
 */

import { apiClient } from '../lib/api/apiClient';
import type {
  LoginRequest,
  RegisterRequest,
  RefreshRequest,
  LogoutRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  ResendVerificationEmailRequest,
  GoogleLoginRequest,
  AuthResponse,
  UserSession,
} from '../lib/api/apiTypes';

/**
 * Register new candidate account
 * POST /auth/register
 * Request: { fullName, email, password }
 * Response: AuthResponse with tokens (user is logged in immediately)
 */
export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>(
    '/auth/register',
    payload,
    { skipAuth: true }
  );
}

/**
 * Login with email and password
 * POST /auth/login
 * Request: { email, password, deviceName? }
 * Response: AuthResponse with tokens
 */
export async function login(payload: LoginRequest): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>(
    '/auth/login',
    payload,
    { skipAuth: true }
  );
}

/**
 * Refresh access token
 * POST /auth/refresh
 * Request: { refreshToken }
 * Response: New AuthResponse with rotated tokens
 */
export async function refresh(payload: RefreshRequest): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>(
    '/auth/refresh',
    payload,
    { skipAuth: true }
  );
}

/**
 * Logout (revoke refresh token)
 * POST /auth/logout
 * Request: { refreshToken }
 * Response: 204 No Content
 * Note: Endpoint is AllowAnonymous, no Authorization header needed
 */
export async function logout(payload: LogoutRequest): Promise<void> {
  try {
    await apiClient.post<void>('/auth/logout', payload, { skipAuth: true });
  } catch (error) {
    // Ignore logout errors - clear local state anyway
    console.warn('Logout API call failed:', error);
  }
}

/**
 * Login with Google
 * POST /auth/google-login
 * Request: { idToken, deviceName? }
 * Response: AuthResponse (auto-register if new account)
 */
export async function googleLogin(payload: GoogleLoginRequest): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>(
    '/auth/google-login',
    payload,
    { skipAuth: true }
  );
}

/**
 * Request password reset email
 * POST /auth/forgot-password
 * Request: { email }
 * Response: Always 200 (doesn't leak if email exists)
 */
export async function forgotPassword(payload: ForgotPasswordRequest): Promise<void> {
  await apiClient.post<void>(
    '/auth/forgot-password',
    payload,
    { skipAuth: true }
  );
}

/**
 * Reset password with token
 * POST /auth/reset-password
 * Request: { token, newPassword }
 * Response: 204 No Content
 */
export async function resetPassword(payload: ResetPasswordRequest): Promise<void> {
  await apiClient.post<void>(
    '/auth/reset-password',
    payload,
    { skipAuth: true }
  );
}

/**
 * Verify email with token
 * POST /auth/verify-email
 * Request: { token }
 * Response: 204 No Content
 */
export async function verifyEmail(payload: VerifyEmailRequest): Promise<void> {
  await apiClient.post<void>(
    '/auth/verify-email',
    payload,
    { skipAuth: true }
  );
}

/**
 * Resend verification email
 * POST /auth/resend-verification-email
 * Request: { email }
 * Response: 200
 */
export async function resendVerificationEmail(payload: ResendVerificationEmailRequest): Promise<void> {
  await apiClient.post<void>(
    '/auth/resend-verification-email',
    payload,
    { skipAuth: true }
  );
}

/**
 * Get active sessions (future feature)
 * GET /auth/sessions
 */
export async function getSessions(): Promise<UserSession[]> {
  return apiClient.get<UserSession[]>('/auth/sessions');
}

/**
 * Revoke specific session (future feature)
 * DELETE /auth/sessions/{id}
 */
export async function revokeSession(sessionId: string): Promise<void> {
  await apiClient.delete<void>(`/auth/sessions/${sessionId}`);
}

export const authService = {
  register,
  login,
  refresh,
  logout,
  googleLogin,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  getSessions,
  revokeSession,
};
