/**
 * Shared frontend validation for auth forms
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return 'Vui lòng nhập email.';
  if (!EMAIL_REGEX.test(trimmed)) return 'Email không hợp lệ. Vui lòng kiểm tra lại.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password.trim()) return 'Vui lòng nhập mật khẩu.';

  if (password.length < 8) {
    return 'Mật khẩu phải có ít nhất 8 ký tự.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Mật khẩu phải có ít nhất 1 chữ HOA.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Mật khẩu phải có ít nhất 1 chữ thường.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Mật khẩu phải có ít nhất 1 chữ số.';
  }
  return null;
}

export function validateFullName(fullName: string): string | null {
  if (!fullName.trim()) return 'Vui lòng nhập họ và tên.';
  return null;
}

export function validateConfirmPassword(
  password: string,
  confirmPassword: string
): string | null {
  if (!confirmPassword.trim()) return 'Vui lòng xác nhận mật khẩu.';
  if (password !== confirmPassword) return 'Mật khẩu xác nhận không khớp.';
  return null;
}
