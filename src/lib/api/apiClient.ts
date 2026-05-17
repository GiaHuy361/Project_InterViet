/**
 * API Client for INTER-VIET Backend
 */

import { ApiError } from './apiError';
import type {
  ApiEnvelope,
  ProblemDetails,
  ApiRequestOptions,
  AuthResponse,
} from './apiTypes';
import {
  TOKEN_KEYS,
  clearAuthStorage,
  saveAuthFromResponse,
  loadAuthFromStorage,
} from '../auth/tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.warn('[apiClient] VITE_API_BASE_URL is not set');
}

type InternalRequestOptions = ApiRequestOptions & {
  _retried?: boolean;
};

type AuthFailureHandler = () => void;

function debugHttp(method: string, url: string, response: Response, bodyText: string): void {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[api:http]', { method, url, status: response.status, ok: response.ok, statusText: response.statusText, bodyText });
  }
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;
  private onAuthFailure: AuthFailureHandler | null = null;

  constructor() {
    this.loadTokensFromStorage();
  }

  public setAuthFailureHandler(handler: AuthFailureHandler | null): void {
    this.onAuthFailure = handler;
  }

  private loadTokensFromStorage(): void {
    const stored = loadAuthFromStorage();
    this.accessToken = stored.accessToken;
    this.refreshToken = stored.refreshToken;
  }

  public setAuthToken(accessToken: string, refreshToken?: string): void {
    this.accessToken = accessToken;
    if (refreshToken) this.refreshToken = refreshToken;
    try {
      localStorage.setItem(TOKEN_KEYS.accessToken, accessToken);
      if (refreshToken) localStorage.setItem(TOKEN_KEYS.refreshToken, refreshToken);
    } catch {
      // ignore
    }
  }

  public clearAuthToken(): void {
    this.accessToken = null;
    this.refreshToken = null;
    clearAuthStorage();
  }

  public getAccessToken(): string | null { return this.accessToken; }
  public getRefreshToken(): string | null { return this.refreshToken; }

  private async request<T>(method: string, url: string, body?: unknown, options: InternalRequestOptions = {}): Promise<T> {
    const { skipAuth = false, rawResponse = false, signal, _retried = false } = options;
    const base = API_BASE_URL || 'http://localhost:5000/api/v1';
    const fullUrl = url.startsWith('http') ? url : `${base}${url}`;

    const headers: Record<string, string> = {};
    if (!skipAuth && this.accessToken) headers['Authorization'] = `Bearer ${this.accessToken}`;
    if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';

    const config: RequestInit = { method, headers, signal };
    if (body !== undefined) config.body = body instanceof FormData ? body : JSON.stringify(body);

    try {
      const response = await fetch(fullUrl, config);
      if (response.status === 401 && !skipAuth && !_retried && !url.includes('/auth/refresh') && !url.includes('/auth/login') && !url.includes('/auth/register')) {
        const newToken = await this.handleTokenRefresh();
        if (newToken) return this.request<T>(method, url, body, { ...options, _retried: true });
        this.clearAuthToken();
        this.onAuthFailure?.();
        throw new ApiError({ status: 401, code: 'Auth.SessionExpired', message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
      }
      return this.parseResponse<T>(method, fullUrl, response, rawResponse);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Không thể kết nối máy chủ. Vui lòng thử lại sau.' });
    }
  }

  private async parseResponse<T>(method: string, fullUrl: string, response: Response, rawResponse: boolean): Promise<T> {
    if (rawResponse) return response as unknown as T;

    if (response.status === 204 || response.status === 205) {
      if (!response.ok) throw new ApiError({ status: response.status, code: 'HTTP_ERROR', message: response.statusText || 'Có lỗi xảy ra.' });
      return undefined as T;
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    let data: unknown = null;
    let bodyText = '';

    if (isJson) {
      try {
        bodyText = await response.text();
        data = bodyText ? JSON.parse(bodyText) : null;
      } catch {
        debugHttp(method, fullUrl, response, bodyText);
        throw new ApiError({ status: response.status, code: 'UNKNOWN_RESPONSE', message: 'Phản hồi máy chủ không hợp lệ.' });
      }
    } else {
      bodyText = await response.text();
      if (bodyText) {
        try {
          data = JSON.parse(bodyText);
        } catch {
          debugHttp(method, fullUrl, response, bodyText);
          if (!response.ok) throw new ApiError({ status: response.status, code: 'UNKNOWN_RESPONSE', message: 'Phản hồi máy chủ không hợp lệ.' });
          return bodyText as unknown as T;
        }
      }
    }

    debugHttp(method, fullUrl, response, bodyText);

    if (this.isApiEnvelope(data)) {
      if (data.success) return data.data as T;
      throw new ApiError({ status: response.status, code: data.error?.code || 'API_ERROR', message: data.error?.message || 'Có lỗi xảy ra.', details: data.error?.details, requestId: data.meta?.requestId });
    }

    if (this.isProblemDetails(data)) {
      throw this.parseProblemDetails(data, response.status);
    }

    if (!response.ok && typeof data === 'object' && data !== null && ('errors' in data || 'detail' in data)) {
      throw this.parseProblemDetails({ status: response.status, title: (data as { title?: string }).title, detail: (data as { detail?: string }).detail, errors: (data as { errors?: Record<string, string[]> }).errors, traceId: (data as { traceId?: string }).traceId }, response.status);
    }

    if (!response.ok) {
      const fallbackMessage = typeof data === 'object' && data !== null && 'message' in data && typeof (data as { message: unknown }).message === 'string' ? (data as { message: string }).message : response.statusText || 'Có lỗi xảy ra.';
      throw new ApiError({ status: response.status, code: 'HTTP_ERROR', message: fallbackMessage });
    }

    return data as T;
  }

  private isApiEnvelope(data: unknown): data is ApiEnvelope<unknown> {
    return typeof data === 'object' && data !== null && 'success' in data;
  }

  private isProblemDetails(data: unknown): data is ProblemDetails {
    return typeof data === 'object' && data !== null && ('title' in data || 'detail' in data || 'status' in data);
  }

  private parseProblemDetails(problem: ProblemDetails, status: number): ApiError {
    const message = problem.detail || problem.title || 'Có lỗi xảy ra.';
    return new ApiError({ status, code: 'HTTP_ERROR', message, details: problem.errors, requestId: problem.traceId });
  }

  private async handleTokenRefresh(): Promise<string | null> {
    if (this.isRefreshing && this.refreshPromise) return this.refreshPromise;
    if (!this.refreshToken) return null;

    this.isRefreshing = true;
    this.refreshPromise = this.request<AuthResponse>('/auth/refresh', { refreshToken: this.refreshToken }, { skipAuth: true })
      .then((response) => {
        const newAccessToken = response.accessToken;
        const newRefreshToken = response.refreshToken ?? this.refreshToken ?? undefined;
        if (newAccessToken) this.setAuthToken(newAccessToken, newRefreshToken);
        return newAccessToken;
      })
      .catch(() => null)
      .finally(() => {
        this.isRefreshing = false;
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  public get<T>(url: string, options?: InternalRequestOptions): Promise<T> { return this.request<T>('GET', url, undefined, options); }
  public post<T>(url: string, body?: unknown, options?: InternalRequestOptions): Promise<T> { return this.request<T>('POST', url, body, options); }
  public put<T>(url: string, body?: unknown, options?: InternalRequestOptions): Promise<T> { return this.request<T>('PUT', url, body, options); }
  public patch<T>(url: string, body?: unknown, options?: InternalRequestOptions): Promise<T> { return this.request<T>('PATCH', url, body, options); }
  public delete<T>(url: string, options?: InternalRequestOptions): Promise<T> { return this.request<T>('DELETE', url, undefined, options); }
  public upload<T>(url: string, formData: FormData, options?: InternalRequestOptions): Promise<T> { return this.request<T>('POST', url, formData, options); }
}

export const apiClient = new ApiClient();
