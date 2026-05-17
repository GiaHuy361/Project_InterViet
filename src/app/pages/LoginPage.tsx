import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useApp } from '../contexts/AppContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Loader2 } from 'lucide-react';
import { validateEmail } from '../../lib/auth/validation';
import { notifyError, notifySuccess } from '../utils/notify';
import { getLoginErrorMessage } from '../../lib/auth/authMessages';
import { AuthFormCard } from '../components/design-system/AuthFormCard';
import { FormField } from '../components/design-system/FormField';
import { AuthAlert } from '../components/auth/AuthAlert';
import { AUTH_PLACEHOLDERS } from '../constants/authPlaceholders';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const getDeviceName = (): string => {
  const ua = navigator.userAgent;
  let browser = 'Chrome';
  let os = 'Windows';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS')) os = 'iOS';
  return `${browser} on ${os}`;
};

export const LoginPage: React.FC = () => {
  const { login, googleLogin } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      notifyError(emailError);
      return;
    }
    if (!password.trim()) {
      notifyError('Vui lòng nhập mật khẩu.');
      return;
    }

    setLoading(true);
    setFormError('');
    try {
      await login(email, password, getDeviceName());
      notifySuccess('Đăng nhập thành công!');
      navigate(searchParams.get('returnUrl') || '/dashboard');
    } catch (err) {
      const msg = getLoginErrorMessage(err);
      setFormError(msg);
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      notifyError('Không nhận được thông tin từ Google.');
      return;
    }
    setGoogleLoading(true);
    setFormError('');
    try {
      await googleLogin(credentialResponse.credential, getDeviceName());
      notifySuccess('Đăng nhập Google thành công!');
      navigate(searchParams.get('returnUrl') || '/dashboard');
    } catch (err) {
      const msg = getLoginErrorMessage(err);
      setFormError(msg);
      notifyError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthFormCard
      badge="Ứng viên"
      title="Chào mừng trở lại"
      subtitle="Đăng nhập để tiếp tục hành trình sự nghiệp"
      footer={
        <p className="text-center text-sm text-slate-600">
          Chưa có tài khoản?{' '}
          <Link to="/dang-ky" className="font-semibold text-blue-600 hover:text-blue-700">
            Đăng ký miễn phí
          </Link>
        </p>
      }
    >
      <AuthAlert message={formError} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField index={0} className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            className="input-premium"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={AUTH_PLACEHOLDERS.email}
            required
          />
        </FormField>

        <FormField index={1} className="space-y-2">
          <Label htmlFor="password">Mật khẩu</Label>
          <Input
            id="password"
            type="password"
            className="input-premium"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={AUTH_PLACEHOLDERS.password}
            required
          />
        </FormField>

        <FormField index={2} className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-slate-600">
            <input type="checkbox" className="rounded border-slate-300" />
            Ghi nhớ đăng nhập
          </label>
          <Link to="/quen-mat-khau" className="font-medium text-blue-600 hover:text-blue-700">
            Quên mật khẩu?
          </Link>
        </FormField>

        <Button
          type="submit"
          className="btn-glow h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-base font-semibold shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-violet-700"
          disabled={loading || googleLoading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Đăng nhập
        </Button>
      </form>

      <section className="mt-8">
        <section className="relative mb-6">
          <span className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </span>
          <span className="relative flex justify-center text-xs uppercase tracking-wider text-slate-400">
            <span className="bg-white/80 px-3">Hoặc</span>
          </span>
        </section>

        {GOOGLE_CLIENT_ID ? (
          <section className="flex flex-col items-center gap-3">
            {googleLoading && (
              <span className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50/80 py-3 text-sm text-blue-800">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang đăng nhập với Google...
              </span>
            )}
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                notifyError('Đăng nhập Google thất bại.');
              }}
              text="signin_with"
              size="large"
              width="384"
            />
          </section>
        ) : (
          <Button type="button" variant="outline" className="w-full rounded-xl" disabled>
            Google Login đang được cấu hình
          </Button>
        )}
      </section>
    </AuthFormCard>
  );
};
