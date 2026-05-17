/**
 * API Error Class for INTER-VIET
 *
 * Handles API errors with user-friendly messages
 */

import type { ApiErrorShape } from './apiTypes';

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly requestId?: string;

  constructor(error: ApiErrorShape) {
    super(error.message);
    this.name = 'ApiError';
    this.status = error.status;
    this.code = error.code;
    this.details = error.details;
    this.requestId = error.requestId;

    // Maintain proper stack trace (only available in V8)
    const errorConstructor = Error as ErrorConstructor & {
      captureStackTrace?: (targetObject: object, constructorOpt?: Function) => void;
    };
    if (errorConstructor.captureStackTrace) {
      errorConstructor.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Get user-friendly error message based on error code or HTTP status
   */
  public getUserMessage(): string {
    // Check for specific error codes first
    const codeMessage = getMessageForErrorCode(this.code);
    if (codeMessage) {
      return codeMessage;
    }

    // Return backend message if available
    if (this.message && this.message !== 'Unknown error') {
      return this.message;
    }

    // Fallback to status-based messages
    return getDefaultMessageForStatus(this.status);
  }

  /**
   * Check if error is specific code
   */
  public isCode(code: string): boolean {
    return this.code === code;
  }

  /**
   * Check if error is authentication error
   */
  public isAuthError(): boolean {
    return this.status === 401 || this.code.includes('Auth');
  }

  /**
   * Check if error is validation error
   */
  public isValidationError(): boolean {
    return this.status === 400;
  }

  /**
   * Check if error is permission error
   */
  public isPermissionError(): boolean {
    return this.status === 403;
  }

  /**
   * Check if error is not found
   */
  public isNotFoundError(): boolean {
    return this.status === 404;
  }

  /**
   * Check if error is server error
   */
  public isServerError(): boolean {
    return this.status >= 500;
  }
}

/**
 * Get user-friendly message for specific error codes
 */
function getMessageForErrorCode(code: string): string | null {
  const errorCodeMap: Record<string, string> = {
    // Auth errors
    'Auth.InvalidCredentials': 'Email hoặc mật khẩu không đúng.',
    'Auth.AccountSuspended': 'Tài khoản đã bị khóa.',

    // Register errors
    'Register.EmailTaken': 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.',

    // Google login errors
    'GoogleLogin.InvalidToken': 'Google token không hợp lệ.',
    'GoogleLogin.UnverifiedEmail': 'Email Google chưa được xác thực.',
    'GoogleLogin.AccountDeleted': 'Tài khoản đã bị xóa.',

    // Verify email errors
    'VerifyEmail.TokenNotFound': 'Link xác thực không hợp lệ.',
    'VerifyEmail.TokenExpired': 'Link xác thực đã hết hạn.',

    // Reset password errors
    'ResetPassword.TokenNotFound': 'Link đặt lại mật khẩu không hợp lệ.',
    'ResetPassword.TokenExpired': 'Link đặt lại mật khẩu đã hết hạn.',

    // Refresh token errors
    'RefreshToken.Invalid': 'Phiên đăng nhập không hợp lệ.',
    'RefreshToken.Revoked': 'Phiên đăng nhập đã bị thu hồi.',
    'RefreshToken.Expired': 'Phiên đăng nhập đã hết hạn.',

    // Phase 3 domain errors
    'Quota.Exceeded': 'Bạn đã dùng hết lượt trong gói hiện tại.',
    'AI.ServiceUnavailable': 'Dịch vụ AI/CV hiện tạm thời không khả dụng. Vui lòng thử lại sau.',
    'AI.CVServiceUnavailable': 'Dịch vụ AI/CV hiện tạm thời không khả dụng. Vui lòng thử lại sau.',
    'CV.ServiceUnavailable': 'Dịch vụ AI/CV hiện tạm thời không khả dụng. Vui lòng thử lại sau.',
    'Match.ServiceUnavailable': 'Dịch vụ AI/CV hiện tạm thời không khả dụng. Vui lòng thử lại sau.',
    'MatchSession.NotFound': 'Không tìm thấy phiên matching.',
    'Resume.NotFound': 'Không tìm thấy CV.',
    'JobDescription.NotFound': 'Không tìm thấy JD.',

    // Network errors
    'NETWORK_ERROR': 'Không thể kết nối máy chủ. Vui lòng thử lại sau.',
    'UNKNOWN_RESPONSE': 'Phản hồi từ máy chủ không hợp lệ.',
  };

  return errorCodeMap[code] || null;
}

/**
 * Get default user-friendly message for HTTP status
 */
function getDefaultMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
    case 401:
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    case 403:
      return 'Bạn không có quyền thực hiện thao tác này hoặc đã vượt giới hạn gói hiện tại.';
    case 404:
      return 'Không tìm thấy dữ liệu.';
    case 409:
      return 'Trạng thái hiện tại không cho phép thao tác này. Vui lòng tải lại dữ liệu.';
    case 429:
      return 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.';
    case 500:
      return 'Có lỗi hệ thống. Vui lòng thử lại.';
    case 503:
      return 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.';
    default:
      if (status >= 500) {
        return 'Có lỗi hệ thống. Vui lòng thử lại.';
      }
      return 'Có lỗi xảy ra. Vui lòng thử lại.';
  }
}

/**
 * Create ApiError from unknown error
 */
export function createApiError(error: unknown, status: number = 500): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new ApiError({
      status,
      code: 'UNKNOWN_ERROR',
      message: error.message,
    });
  }

  return new ApiError({
    status,
    code: 'UNKNOWN_ERROR',
    message: 'Có lỗi không xác định xảy ra.',
  });
}
