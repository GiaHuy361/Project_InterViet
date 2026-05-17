import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import { Button } from '../components/ui/button';
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import * as authService from '../../services/authService';
import { ApiError } from '../../lib/api/apiError';
import { notifyError, notifyFromError, notifySuccess } from '../utils/notify';
import { AuthFormCard } from '../components/design-system/AuthFormCard';
import { AuthStatusView } from '../components/design-system/AuthStatusView';
import { AuthAlert } from '../components/auth/AuthAlert';

export const VerifyEmailPage: React.FC = () => {
  const { state, verifyEmail } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'pending'>('pending');
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      handleVerifyToken(token);
      return;
    }

    const isPendingRoute =
      location.pathname.includes('xac-minh-email') ||
      (state.isAuthenticated && state.user && !state.user.verified);

    if (isPendingRoute) {
      setStatus('pending');
    } else {
      setStatus('error');
      const msg = 'Link xác thực không hợp lệ.';
      setError(msg);
      notifyError(msg);
    }
  }, [searchParams, location.pathname, state.isAuthenticated, state.user]);

  const handleVerifyToken = async (token: string) => {
    setStatus('verifying');
    setError('');

    try {
      await verifyEmail(token);
      setStatus('success');
      notifySuccess('Email đã xác thực thành công.');

      setTimeout(() => {
        if (state.isAuthenticated) {
          navigate('/dashboard');
        } else {
          navigate('/dang-nhap');
        }
      }, 2000);
    } catch (err) {
      setStatus('error');

      let msg = 'Có lỗi xảy ra khi xác thực email. Vui lòng thử lại.';
      if (err instanceof ApiError) {
        if (err.code === 'VerifyEmail.TokenExpired') {
          msg = 'Link xác thực đã hết hạn. Vui lòng yêu cầu gửi lại email xác thực.';
        } else if (err.code === 'VerifyEmail.TokenNotFound') {
          msg = 'Link xác thực không hợp lệ. Vui lòng kiểm tra lại email hoặc yêu cầu gửi lại.';
        } else {
          msg = err.getUserMessage();
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
      notifyError(msg);
    }
  };

  const handleResendEmail = async () => {
    if (!state.user?.email) {
      const msg = 'Không tìm thấy email. Vui lòng đăng nhập lại.';
      setError(msg);
      notifyError(msg);
      return;
    }

    setResendLoading(true);
    setResendSuccess(false);
    setError('');

    try {
      await authService.resendVerificationEmail({ email: state.user.email });
      setResendSuccess(true);
      notifySuccess('Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư.');
    } catch (err) {
      notifyFromError(err, 'Có lỗi khi gửi lại email. Vui lòng thử lại.');
      if (err instanceof ApiError) {
        setError(err.getUserMessage());
      } else {
        setError('Có lỗi khi gửi lại email. Vui lòng thử lại.');
      }
    } finally {
      setResendLoading(false);
    }
  };

  if (status === 'verifying') {
    return (
      <AuthStatusView
        badge="Xác thực"
        title="Đang xác thực..."
        subtitle="Vui lòng đợi trong giây lát"
        tone="loading"
        icon={Loader2}
        loading
      />
    );
  }

  if (status === 'success') {
    return (
      <AuthStatusView
        badge="Thành công"
        title="Email đã xác thực!"
        subtitle="Đang chuyển hướng..."
        tone="success"
        icon={CheckCircle}
      />
    );
  }

  if (status === 'error') {
    return (
      <AuthStatusView
        badge="Lỗi"
        title="Xác thực không thành công"
        tone="error"
        icon={AlertCircle}
        alertMessage={error}
        alertVariant="error"
      >
        <motion.div className="mt-2 space-y-3">
          {state.user?.email && (
            <Button
              className="btn-glow h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 font-semibold"
              onClick={handleResendEmail}
              disabled={resendLoading}
            >
              {resendLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gửi lại email xác thực
            </Button>
          )}
          <Button variant="outline" className="w-full rounded-xl" onClick={() => navigate('/dang-nhap')}>
            Quay lại đăng nhập
          </Button>
        </motion.div>
      </AuthStatusView>
    );
  }

  return (
    <AuthFormCard
      badge="Hộp thư"
      title="Kiểm tra email của bạn"
      subtitle="Chúng tôi đã gửi link xác thực đến địa chỉ email đăng ký"
    >
      {state.user && !state.user.verified && (
        <AuthAlert
          message="Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản."
          variant="success"
        />
      )}

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-6 flex justify-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-violet-100">
          <Mail className="h-8 w-8 text-blue-600" />
        </div>
      </motion.div>

      <p className="mb-6 text-center text-sm text-slate-600">
        Link đã gửi tới{' '}
        <strong className="text-slate-900">{state.user?.email || 'email của bạn'}</strong>
      </p>

      {resendSuccess && (
        <AuthAlert message="Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư." variant="success" />
      )}
      {error && <AuthAlert message={error} variant="error" />}

      <div className="space-y-4">
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-800">Hướng dẫn</p>
          <ol className="list-inside list-decimal space-y-2 text-sm text-slate-600">
            <li>Kiểm tra hộp thư đến</li>
            <li>Tìm email từ INTER-VIET</li>
            <li>Nhấp link xác thực trong email</li>
          </ol>
        </div>

        {state.user?.email && (
          <Button
            variant="outline"
            className="w-full rounded-xl border-slate-200"
            onClick={handleResendEmail}
            disabled={resendLoading}
          >
            {resendLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gửi lại email xác thực
          </Button>
        )}

        <Button variant="ghost" className="w-full rounded-xl text-slate-600" onClick={() => navigate('/dang-nhap')}>
          Quay lại đăng nhập
        </Button>
      </div>
    </AuthFormCard>
  );
};
