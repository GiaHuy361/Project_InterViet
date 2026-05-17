/**
 * API Types for INTER-VIET Backend Integration
 *
 * Backend C# API: http://localhost:5000/api/v1
 * Swagger: http://localhost:5000/swagger
 */

// API Response Envelope (C# backend standard format)
export type ApiEnvelope<T> = {
  success: boolean;
  message?: string | null;
  data?: T | null;
  meta?: {
    requestId?: string;
    timestamp?: string;
  } | null;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  } | null;
};

// ASP.NET ProblemDetails format
export type ProblemDetails = {
  type?: string;
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string[]>;
  traceId?: string;
};

// API Error Shape
export type ApiErrorShape = {
  status: number;
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
};

// API Request Options
export interface ApiRequestOptions {
  skipAuth?: boolean;
  rawResponse?: boolean;
  signal?: AbortSignal;
}

// Auth Response Types (EXACT BACKEND CONTRACT)
// All auth endpoints (login, register, refresh, google-login) return flat AuthResponse

export interface AuthResponse {
  userId: string;
  email: string;
  fullName: string;
  status: string; // 'free' | 'trial' | 'premium' | etc.
  accessToken: string;
  accessTokenExpiry: string; // ISO 8601 datetime
  refreshToken: string;
  refreshTokenExpiry: string; // ISO 8601 datetime
  emailVerified: boolean;
}

// Alias for clarity
export type LoginResponse = AuthResponse;
export type RegisterResponse = AuthResponse;
export type RefreshResponse = AuthResponse;
export type GoogleLoginResponse = AuthResponse;

// Auth Request Payloads (EXACT BACKEND CONTRACT)

export interface LoginRequest {
  email: string;
  password: string;
  deviceName?: string; // Optional, e.g. "Chrome on Windows"
}

export interface RegisterRequest {
  fullName: string; // Required
  email: string;
  password: string;
  // NO confirmPassword - frontend validates but doesn't send to backend
  // NO firstName/lastName - backend uses fullName
}

export interface RefreshRequest {
  refreshToken: string;
  // NO accessToken - backend doesn't need it
}

export interface LogoutRequest {
  refreshToken: string;
  // NO Authorization header needed - endpoint is AllowAnonymous
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string; // From email link query param
  newPassword: string;
  // NO email - backend gets it from token
  // NO confirmPassword - frontend validates but doesn't send
}

export interface VerifyEmailRequest {
  token: string; // From email link query param
  // NO email - backend gets it from token
}

export interface ResendVerificationEmailRequest {
  email: string;
}

export interface GoogleLoginRequest {
  idToken: string; // Google credential response.credential
  deviceName?: string; // Optional
}

// Session Management Types
export interface UserSession {
  sessionId: string;
  deviceName: string;
  ipAddress: string;
  createdAt: string;
  lastSeenAt: string;
  isCurrent: boolean;
}
