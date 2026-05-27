import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AppPageHeader } from '../components/design-system/AppPageHeader';

type PaymentLandingState = {
  successToast?: string;
  targetPath?: string;
};

const readParam = (params: URLSearchParams, name: string) => params.get(name) ?? '';

export const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as PaymentLandingState | null) ?? null;

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const contextType = readParam(params, 'contextType') || 'subscription';
  const bookingId = readParam(params, 'bookingId');
  const targetPathFromState = state?.targetPath;

  const targetPath = useMemo(() => {
    if (targetPathFromState) return targetPathFromState;
    if (contextType === 'mentor_booking') {
      return bookingId ? `/mentor-bookings/${bookingId}` : '/dashboard';
    }
    return '/dashboard';
  }, [bookingId, contextType, targetPathFromState]);

  useEffect(() => {
    const message = state?.successToast || (contextType === 'mentor_booking' ? 'Lịch hẹn đã được xác nhận' : 'Gói cước đã được kích hoạt');
    toast.success(message);

    const timeoutId = window.setTimeout(() => {
      navigate(targetPath, { replace: true });
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [contextType, navigate, state?.successToast, targetPath]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      <AppPageHeader
        title="Thanh toán thành công"
        subtitle={contextType === 'mentor_booking' ? 'Đang chuyển tới trang lịch hẹn...' : 'Đang chuyển tới dashboard...' }
        icon={CheckCircle2}
        iconGradient="from-emerald-500 to-green-600"
      />
      <Card className="space-y-4 p-6 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Giao dịch đã được ghi nhận</h2>
          <p className="mt-2 text-sm text-gray-500">
            Hệ thống sẽ tự động điều hướng theo context thanh toán.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Đang chuyển hướng...</span>
        </div>
        <Button variant="outline" onClick={() => navigate(targetPath, { replace: true })}>
          Đi ngay
        </Button>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;
