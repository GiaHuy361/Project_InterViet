import { ApiError } from './apiError';

export function getPhase3UserMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403 && error.code === 'Quota.Exceeded') {
      return 'Bạn đã dùng hết lượt trong gói hiện tại.';
    }
    if (error.status === 503) {
      return 'Dịch vụ AI/CV hiện tạm thời không khả dụng. Vui lòng thử lại sau.';
    }
    return error.getUserMessage();
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Có lỗi xảy ra. Vui lòng thử lại.';
}

export function isPhase3QuotaExceeded(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403 && error.code === 'Quota.Exceeded';
}

export function isPhase3ServiceUnavailable(error: unknown): boolean {
  return error instanceof ApiError && error.status === 503;
}
