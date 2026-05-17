import { toast } from 'sonner';

/**
 * Safe navigate utility to prevent external navigation
 * Only allows internal routes starting with "/"
 */
export const safeNavigate = (
  url: string,
  navigate: (path: string) => void
): void => {
  // Check if URL is external (contains http/https or domain)
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('www.') ||
    url.includes('://') ||
    (!url.startsWith('/') && url.includes('.'))
  ) {
    // Block external navigation
    toast.error('Liên kết không hợp lệ. Vui lòng dùng điều hướng trong ứng dụng.');
    console.warn('[SafeNavigate] Blocked external URL:', url);
    return;
  }

  // Safe internal route - proceed with navigation
  if (url.startsWith('/')) {
    navigate(url);
  } else {
    toast.error('Đường dẫn không hợp lệ.');
    console.warn('[SafeNavigate] Invalid route:', url);
  }
};
