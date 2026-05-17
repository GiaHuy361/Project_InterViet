import React, { useState } from 'react';
import { Link } from 'react-router';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { notifyError, notifyFromError, notifySuccess } from '../../utils/notify';
import { Button } from '../ui/button';

export const EmailVerificationBanner: React.FC = () => {
  const { state, resendVerificationEmail } = useApp();
  const [loading, setLoading] = useState(false);
  if (!state.isAuthenticated || !state.user || state.user.verified) {
    return null;
  }

  const handleResend = async () => {
    if (!state.user?.email) return;

    setLoading(true);

    try {
      await resendVerificationEmail(state.user.email);
      notifySuccess('Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư.');
    } catch (err) {
      notifyFromError(err, 'Có lỗi khi gửi lại email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium text-amber-900">
            Bạn cần xác thực email để sử dụng đầy đủ tính năng.
          </p>
          <p className="text-sm text-amber-800">
            Vui lòng kiểm tra hộp thư tại <strong>{state.user.email}</strong> hoặc{' '}
            <Link to="/xac-minh-email" className="font-medium underline">
              mở trang xác thực
            </Link>
            .
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={loading}
            className="border-amber-300 bg-white"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gửi lại email xác thực
          </Button>
        </div>
      </div>
    </div>
  );
};
