/**
 * PaymentCancelPage — Phase 18 (PayOS Integration)
 *
 * Trang này được PayOS redirect tới khi user nhấn "Hủy" trên cổng thanh toán.
 * PayOS trả về: code, id, cancel=true, status=CANCELLED, orderCode
 *
 * Quy tắc Phase 18 §6: KHÔNG tin tưởng status từ URL, chỉ hiển thị UI huỷ.
 */
import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { XCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AppPageHeader } from '../components/design-system/AppPageHeader';

const readParam = (params: URLSearchParams, name: string) => params.get(name) ?? '';

export const PaymentCancelPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const contextType = readParam(params, 'contextType') || 'subscription';
  const selectedPlan = readParam(params, 'selectedPlan');

  // PayOS trả về `id` là Payment Link ID khi cancel
  const paymentLinkId = readParam(params, 'id') || readParam(params, 'paymentId');
  const orderCode = readParam(params, 'orderCode');

  const returnPath = contextType === 'mentor_booking' ? '/network' : '/goi-dich-vu';

  const handleRetry = () => {
    navigate(returnPath, {
      replace: true,
      state: selectedPlan ? { selectedPlan, contextType } : undefined,
    });
  };

  const handleGoBack = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      <AppPageHeader
        title="Thanh toán đã huỷ"
        subtitle="Bạn có thể thử lại bất cứ lúc nào"
        icon={XCircle}
        iconGradient="from-rose-500 to-red-600"
      />

      <Card className="space-y-6 p-8 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-red-600">
          <XCircle className="h-10 w-10 text-white" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Giao dịch không được hoàn tất</h2>
          <p className="text-sm text-gray-500">
            {contextType === 'mentor_booking'
              ? 'Bạn đã huỷ thanh toán cho lịch hẹn. Bạn có thể đặt lịch lại bất cứ lúc nào.'
              : 'Bạn đã huỷ thanh toán. Gói cước của bạn không thay đổi.'}
          </p>
          {(paymentLinkId || orderCode) && (
            <p className="text-xs text-gray-400">
              {orderCode ? `Mã đơn hàng: ${orderCode}` : `Mã giao dịch: ${paymentLinkId}`}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Lưu ý: Bạn chưa bị trừ tiền. Giao dịch đã được huỷ an toàn.
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            id="payment-cancel-retry-btn"
            onClick={handleRetry}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {contextType === 'mentor_booking' ? 'Đặt lịch lại' : 'Chọn lại gói'}
          </Button>
          <Button
            id="payment-cancel-back-btn"
            variant="outline"
            onClick={handleGoBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Về Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PaymentCancelPage;
