import { ApiError } from '../api/apiError';

/** Login-specific error copy per Phase 1 spec */
export function getLoginErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === 'Auth.InvalidCredentials' || err.status === 401) {
      return 'Email hoặc mật khẩu không đúng.';
    }
    if (err.status === 400 || err.code === 'VALIDATION_ERROR') {
      return 'Dữ liệu đăng nhập không hợp lệ. Vui lòng kiểm tra lại.';
    }
    if (err.code === 'NETWORK_ERROR') {
      return 'Không thể kết nối máy chủ. Vui lòng kiểm tra backend.';
    }
    if (err.status === 500 || err.status === 503 || err.isServerError()) {
      return 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.';
    }
    return err.getUserMessage();
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return 'Đăng nhập thất bại. Vui lòng thử lại.';
}
