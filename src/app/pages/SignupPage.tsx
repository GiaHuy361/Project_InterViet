import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ApiError } from '../../lib/api/apiError';
import { notifyError, notifyFromError, notifySuccess } from '../utils/notify';
import { useApp } from '../contexts/AppContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Loader2, CheckCircle } from 'lucide-react';
import {
  validateEmail,
  validateFullName,
  validatePassword,
  validateConfirmPassword,
} from '../../lib/auth/validation';
import { AuthFormCard } from '../components/design-system/AuthFormCard';
import { FormField } from '../components/design-system/FormField';
import { AuthAlert } from '../components/auth/AuthAlert';
import { AUTH_PLACEHOLDERS } from '../constants/authPlaceholders';

export const SignupPage: React.FC = () => {
  const { signup } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameError = validateFullName(name);
    if (nameError) return notifyError(nameError);
    const emailError = validateEmail(email);
    if (emailError) return notifyError(emailError);
    const passwordError = validatePassword(password);
    if (passwordError) return notifyError(passwordError);
    const confirmError = validateConfirmPassword(password, confirmPassword);
    if (confirmError) return notifyError(confirmError);

    setLoading(true);
    setFormError('');
    try {
      const response = await signup(email, password, name);
      if (!response.emailVerified) {
        notifySuccess('Đăng ký thành công! Vui lòng kiểm tra email để xác thực.');
        navigate('/xac-minh-email');
      } else {
        notifySuccess('Đăng ký thành công!');
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.getUserMessage() : 'Đăng ký thất bại. Vui lòng thử lại.';
      setFormError(msg);
      notifyFromError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFormCard
      badge="Miễn phí"
      title="Tạo tài khoản"
      subtitle="Bắt đầu tối ưu sự nghiệp ngay hôm nay"
      footer={
        <p className="text-center text-sm text-slate-600">
          Đã có tài khoản?{' '}
          <Link to="/dang-nhap" className="font-semibold text-blue-600 hover:text-blue-700">
            Đăng nhập
          </Link>
        </p>
      }
    >
      <AuthAlert message={formError} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField index={0} className="space-y-2">
          <Label htmlFor="name">Họ và tên</Label>
          <Input id="name" className="input-premium" value={name} onChange={(e) => setName(e.target.value)} placeholder={AUTH_PLACEHOLDERS.fullName} required />
        </FormField>
        <FormField index={1} className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" className="input-premium" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={AUTH_PLACEHOLDERS.email} required />
        </FormField>
        <FormField index={2} className="space-y-2">
          <Label htmlFor="password">Mật khẩu</Label>
          <Input id="password" type="password" className="input-premium" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={AUTH_PLACEHOLDERS.password} required minLength={8} />
          <p className="text-xs text-slate-500">Tối thiểu 8 ký tự, chữ HOA, thường và số</p>
        </FormField>
        <FormField index={3} className="space-y-2">
          <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
          <Input id="confirmPassword" type="password" className="input-premium" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={AUTH_PLACEHOLDERS.confirmPassword} required minLength={8} />
        </FormField>
        <Button
          type="submit"
          className="btn-glow h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 font-semibold shadow-lg shadow-blue-500/25"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Tạo tài khoản
        </Button>
      </form>

      <ul className="mt-6 space-y-2.5 border-t border-slate-100 pt-6">
        {['3 lần tối ưu CV miễn phí', '1 phiên phỏng vấn AI miễn phí', 'Không cần thẻ tín dụng'].map((text) => (
          <li key={text} className="flex items-center gap-2 text-sm text-slate-600">
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
            {text}
          </li>
        ))}
      </ul>
    </AuthFormCard>
  );
};
