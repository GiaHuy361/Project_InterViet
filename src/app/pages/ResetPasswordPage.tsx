import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Loader2, CheckCircle } from 'lucide-react';
import { resetPassword } from '../../services/authService';
import { ApiError } from '../../lib/api/apiError';
import {
  validatePassword,
  validateConfirmPassword,
} from '../../lib/auth/validation';
import { useApp } from '../contexts/AppContext';
import { notifyError, notifySuccess } from '../utils/notify';
import { AuthFormCard } from '../components/design-system/AuthFormCard';
import { AuthAlert } from '../components/auth/AuthAlert';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export const ResetPasswordPage: React.FC = () => {
  const { logout } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      notifyError(passwordError);
      return;
    }

    const confirmError = validateConfirmPassword(password, confirmPassword);
    if (confirmError) {
      setError(confirmError);
      notifyError(confirmError);
      return;
    }

    if (!token) {
      const msg = 'Link đặt lại mật khẩu không hợp lệ.';
      setError(msg);
      notifyError(msg);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await resetPassword({ token, newPassword: password });
      await logout();
      setSuccess(true);
      notifySuccess('Mật khẩu đã được cập nhật.');
      setTimeout(() => navigate('/dang-nhap'), 2000);
    } catch (err: unknown) {
      let msg = 'Có lỗi xảy ra. Vui lòng thử lại.';
      if (err instanceof ApiError) {
        msg = err.getUserMessage();
        if (err.code === 'ResetPassword.TokenExpired') {
          msg = 'Link đặt lại mật khẩu đã hết hạn.';
        } else if (err.code === 'ResetPassword.TokenNotFound') {
          msg = 'Link đặt lại mật khẩu không hợp lệ.';
        }
      }
      setError(msg);
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthFormCard badge="Hoàn tất" title="Mật khẩu đã được cập nhật" subtitle="Đang chuyển đến trang đăng nhập">
        <div className="py-4 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <p className="text-sm text-slate-600">Vui lòng đăng nhập lại bằng mật khẩu mới.</p>
        </div>
      </AuthFormCard>
    );
  }

  if (!token) {
    return (
      <AuthFormCard badge="Lỗi" title="Link không hợp lệ" subtitle="Không tìm thấy token trong liên kết">
        <AuthAlert message="Link đặt lại mật khẩu không hợp lệ." />
        <Button type="button" variant="outline" className="mt-4 w-full rounded-xl" asChild>
          <Link to="/quen-mat-khau">Yêu cầu link mới</Link>
        </Button>
      </AuthFormCard>
    );
  }

  return (
    <AuthFormCard
      badge="Bảo mật"
      title="Đặt lại mật khẩu"
      subtitle="Nhập mật khẩu mới cho tài khoản"
      footer={
        <p className="text-center text-sm text-slate-600">
          <Link to="/dang-nhap" className="font-semibold text-blue-600 hover:text-blue-700">
            Quay lại đăng nhập
          </Link>
        </p>
      }
    >
      <AuthAlert message={error} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="space-y-2">
          <Label htmlFor="password">Mật khẩu mới</Label>
          <Input
            id="password"
            type="password"
            className="input-premium"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            minLength={8}
            required
          />
          <p className="text-xs text-slate-500">Tối thiểu 8 ký tự, chữ HOA, thường và số</p>
        </section>

        <section className="space-y-2">
          <Label htmlFor="confirm">Xác nhận mật khẩu</Label>
          <Input
            id="confirm"
            type="password"
            className="input-premium"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            minLength={8}
            required
          />
        </section>

        <Button
          type="submit"
          className="btn-glow h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 font-semibold shadow-lg shadow-blue-500/25"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Đặt lại mật khẩu
        </Button>
      </form>
    </AuthFormCard>
  );
};
