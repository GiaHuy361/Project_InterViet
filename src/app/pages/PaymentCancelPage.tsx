import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { XCircle, Loader2 } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AppPageHeader } from '../components/design-system/AppPageHeader';

type PaymentLandingState = {
  cancelToast?: string;
  returnPath?: string;
};

const readParam = (params: URLSearchParams, name: string) => params.get(name) ?? '';

export const PaymentCancelPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as PaymentLandingState | null) ?? null;

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const contextType = readParam(params, 'contextType') || 'subscription';
  const selectedPlan = readParam(params, 'selectedPlan');
  const returnTo = state?.returnPath || readParam(params, 'returnTo') || '/goi-dich-vu';

  useEffect(() => {
    toast.info('Thanh toán đã bị hủy');

    const timeoutId = window.setTimeout(() => {
      navigate(returnTo, { replace: true, state: selectedPlan ? { selectedPlan, contextType } : undefined });
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [contextType, navigate, returnTo, selectedPlan]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      <AppPageHeader
        title="Thanh toán đã hủy"
        subtitle="Đang quay trở lại màn hình trước đó..."
        icon={XCircle}
        iconGradient="from-rose-500 to-red-600"
      />
      <Card className="space-y-4 p-6 text-center">
        <XCircle className="mx-auto h-14 w-14 text-rose-500" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Giao dịch không được hoàn tất</h2>
          <p className="mt-2 text-sm text-gray-500">
            Bạn có thể thử lại hoặc quay về trang gói dịch vụ.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Đang chuyển hướng...</span>
        </div>
        <Button variant="outline" onClick={() => navigate(returnTo, { replace: true })}>
          Quay lại ngay
        </Button>
      </Card>
    </div>
  );
};

export default PaymentCancelPage;
