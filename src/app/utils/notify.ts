/**
 * Thông báo toàn app — toast góc phải (Sonner), có animation
 */
import { toast, type ExternalToast } from 'sonner';
import { ApiError } from '../../lib/api/apiError';

const defaults: ExternalToast = {
  duration: 4500,
};

export function notifySuccess(message: string, options?: ExternalToast) {
  return toast.success(message, { ...defaults, ...options });
}

export function notifyError(message: string, options?: ExternalToast) {
  return toast.error(message, { ...defaults, ...options });
}

export function notifyInfo(message: string, options?: ExternalToast) {
  return toast.info(message, { ...defaults, ...options });
}

export function notifyWarning(message: string, options?: ExternalToast) {
  return toast.warning(message, { ...defaults, ...options });
}

export function notifyLoading(message: string, options?: ExternalToast) {
  return toast.loading(message, { ...defaults, ...options });
}

export function notifyFromError(
  err: unknown,
  fallback = 'Có lỗi xảy ra. Vui lòng thử lại.'
) {
  if (err instanceof ApiError) {
    notifyError(err.getUserMessage());
    return;
  }
  if (err instanceof Error && err.message) {
    notifyError(err.message);
    return;
  }
  notifyError(fallback);
}

/** @deprecated Dùng notifySuccess / notifyError — giữ để migrate dần */
export { toast };
