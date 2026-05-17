import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Loader2, Mail, CheckCircle } from 'lucide-react';
import { forgotPassword } from '../../services/authService';
import { ApiError } from '../../lib/api/apiError';
import { validateEmail } from '../../lib/auth/validation';
import { notifyError, notifySuccess } from '../utils/notify';
import { AuthFormCard } from '../components/design-system/AuthFormCard';
import { AuthAlert } from '../components/auth/AuthAlert';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { AUTH_PLACEHOLDERS } from '../constants/authPlaceholders';

const SUCCESS_MESSAGE =
  'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      notifyError(emailError);
      return;
    }

    setLoading(true);

    try {
      await forgotPassword({ email: email.trim() });
      setSent(true);
      notifySuccess(SUCCESS_MESSAGE);
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.code === 'NETWORK_ERROR' || err.isServerError() || err.status === 503)
      ) {
        const msg = err.getUserMessage();
        setError(msg);
        notifyError(msg);
      } else {
        setSent(true);
        notifySuccess(SUCCESS_MESSAGE);
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthFormCard
        badge="Bảo mật"
        title="Kiểm tra email"
        subtitle="Chúng tôi đã xử lý yêu cầu của bạn"
      >
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <AuthAlert message={SUCCESS_MESSAGE} variant="success" />
          <p className="mb-6 text-sm text-slate-600">
            Vui lòng kiểm tra hộp thư và làm theo hướng dẫn trong email. Liên kết có thể nằm trong thư mục spam.
          </p>
          <Button
            type="button"
            className="btn-glow h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 font-semibold"
            onClick={() => navigate('/dang-nhap')}
          >
            Về trang đăng nhập
          </Button>
        </div>
      </AuthFormCard>
    );
  }

  return (
    <AuthFormCard
      badge="Khôi phục"
      title="Quên mật khẩu"
      subtitle="Nhập email để nhận liên kết đặt lại mật khẩu"
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
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="email"
              type="email"
              className="input-premium pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={AUTH_PLACEHOLDERS.email}
              required
            />
          </div>
        </section>

        <Button
          type="submit"
          className="btn-glow h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 font-semibold shadow-lg shadow-blue-500/25"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Gửi liên kết
        </Button>
      </form>
    </AuthFormCard>
  );
};
