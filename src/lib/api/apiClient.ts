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
    if (refreshToken) {
      this.refreshToken = refreshToken;
    }

    try {
      localStorage.setItem(TOKEN_KEYS.accessToken, accessToken);
      if (refreshToken) {
        localStorage.setItem(TOKEN_KEYS.refreshToken, refreshToken);
      }
    } catch {
      // ignore
    }
  }

  public clearAuthToken(): void {
    this.accessToken = null;
    this.refreshToken = null;
    clearAuthStorage();
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public getRefreshToken(): string | null {
    return this.refreshToken;
  }

  private async request<T>(
    method: string,
    url: string,
    body?: unknown,
    options: InternalRequestOptions = {}
  ): Promise<T> {
    const { skipAuth = false, rawResponse = false, signal, _retried = false } = options;

    const base = API_BASE_URL || 'http://localhost:5000/api/v1';
    const fullUrl = url.startsWith('http') ? url : `${base}${url}`;

    const headers: Record<string, string> = {};

    if (!skipAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const config: RequestInit = {
      method,
      headers,
      signal,
    };

    if (body !== undefined) {
      config.body = body instanceof FormData ? body : JSON.stringify(body);
    }

    try {
      const response = await fetch(fullUrl, config);

      if (
        response.status === 401 &&
        !skipAuth &&
        !_retried &&
        !url.includes('/auth/refresh') &&
        !url.includes('/auth/login') &&
        !url.includes('/auth/register')
      ) {
        const newToken = await this.handleTokenRefresh();
        if (newToken) {
          return this.request<T>(method, url, body, {
            ...options,
            _retried: true,
          });
        }

        this.clearAuthToken();
        this.onAuthFailure?.();

        throw new ApiError({
          status: 401,
          code: 'Auth.SessionExpired',
          message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        });
      }

      return this.parseResponse<T>(response, rawResponse);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError({
        status: 0,
        code: 'NETWORK_ERROR',
        message: 'Không thể kết nối máy chủ. Vui lòng kiểm tra backend.',
      });
    }
  }

  private async parseResponse<T>(response: Response, rawResponse: boolean): Promise<T> {
    if (rawResponse) {
      return response as unknown as T;
    }

    if (response.status === 204 || response.status === 205) {
      if (!response.ok) {
        throw new ApiError({
          status: response.status,
          code: 'HTTP_ERROR',
          message: response.statusText || 'Có lỗi xảy ra.',
        });
      }
      return undefined as T;
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    let data: unknown = null;

    if (isJson) {
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : null;
      } catch {
        throw new ApiError({
          status: response.status,
          code: 'UNKNOWN_RESPONSE',
          message: 'Phản hồi máy chủ không hợp lệ.',
        });
      }
    } else {
      const text = await response.text();
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          if (!response.ok) {
            throw new ApiError({
              status: response.status,
              code: 'UNKNOWN_RESPONSE',
              message: 'Phản hồi máy chủ không hợp lệ.',
            });
          }
          return text as unknown as T;
        }
      }
    }

    if (this.isApiEnvelope(data)) {
      if (data.success) {
        return data.data as T;
      }

      throw new ApiError({
        status: response.status,
        code: data.error?.code || 'API_ERROR',
        message: data.error?.message || 'Có lỗi xảy ra.',
        details: data.error?.details,
        requestId: data.meta?.requestId,
      });
    }

    if (this.isProblemDetails(data)) {
      throw this.parseProblemDetails(data, response.status);
    }

    if (
      !response.ok &&
      typeof data === 'object' &&
      data !== null &&
      ('errors' in data || 'detail' in data)
    ) {
      throw this.parseProblemDetails(
        {
          status: response.status,
          title: (data as { title?: string }).title,
          detail: (data as { detail?: string }).detail,
          errors: (data as { errors?: Record<string, string[]> }).errors,
          traceId: (data as { traceId?: string }).traceId,
        },
        response.status
      );
    }

    if (!response.ok) {
      const fallbackMessage =
        typeof data === 'object' &&
        data !== null &&
        'message' in data &&
        typeof (data as { message: unknown }).message === 'string'
          ? (data as { message: string }).message
          : response.statusText || 'Có lỗi xảy ra.';

      throw new ApiError({
        status: response.status,
        code: 'HTTP_ERROR',
        message: fallbackMessage,
      });
    }

    return data as T;
  }

  private isApiEnvelope(data: unknown): data is ApiEnvelope<unknown> {
    return (
      typeof data === 'object' &&
      data !== null &&
      'success' in data &&
      typeof (data as ApiEnvelope<unknown>).success === 'boolean'
    );
  }

  private isProblemDetails(data: unknown): data is ProblemDetails {
    if (typeof data !== 'object' || data === null) return false;
    const obj = data as ProblemDetails;
    const hasStatus = typeof obj.status === 'number';
    const hasErrors =
      obj.errors != null && typeof obj.errors === 'object';
    const hasProblemShape =
      hasErrors || typeof obj.title === 'string' || typeof obj.type === 'string';
    return hasStatus ? hasProblemShape : hasErrors;
  }

  private parseProblemDetails(details: ProblemDetails, status: number): ApiError {
    let message =
      details.detail ||
      details.title ||
      'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';

    if (details.errors) {
      const errorMessages: string[] = [];
      for (const messages of Object.values(details.errors)) {
        errorMessages.push(...messages);
      }
      if (errorMessages.length > 0) {
        message = errorMessages.join(' ');
      }
    }

    return new ApiError({
      status: details.status ?? status,
      code: 'VALIDATION_ERROR',
      message,
      details: details.errors,
      requestId: details.traceId,
    });
  }

  private async handleTokenRefresh(): Promise<string | null> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.refreshToken) {
      return null;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      return await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<string | null> {
    const base = API_BASE_URL || 'http://localhost:5000/api/v1';

    try {
      const response = await fetch(`${base}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        return null;
      }

      const data: unknown = await response.json();

      if (this.isApiEnvelope(data) && data.success && data.data) {
        const authData = data.data as AuthResponse;
        if (authData.accessToken) {
          this.setAuthToken(authData.accessToken, authData.refreshToken);
          saveAuthFromResponse(authData);
          return authData.accessToken;
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  public get<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>('GET', url, undefined, options);
  }

  public post<T>(url: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>('POST', url, body, options);
  }

  public put<T>(url: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>('PUT', url, body, options);
  }

  public patch<T>(url: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>('PATCH', url, body, options);
  }

  public delete<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>('DELETE', url, undefined, options);
  }

  public upload<T>(url: string, formData: FormData, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>('POST', url, formData, options);
  }
}

export const apiClient = new ApiClient();
export { ApiClient };
