/**
 * PaymentSuccessPage — Phase 18 (PayOS Integration)
 *
 * Trang này được PayOS redirect tới sau khi user hoàn tất giao dịch.
 * KHÔNG tự động kích hoạt gói chỉ dựa vào query params (quy tắc Phase 18 §6).
 *
 * Luồng xử lý:
 *  1. Đọc paymentId từ query params (PayOS trả về `id` hoặc `orderCode`)
 *  2. Hiển thị spinner "Đang xác nhận với ngân hàng..."
 *  3. Hook usePaymentListener: SignalR (subscription.activated) + Polling fallback
 *  4. Khi succeeded → modal chúc mừng → navigate về dashboard
 *  5. Khi failed/cancelled → thông báo lỗi + nút retry
 *  6. Khi timeout → thông báo và nút liên hệ
 */
import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  CheckCircle2,
  Loader2,
  XCircle,
  AlertTriangle,
  HeadphonesIcon,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AppPageHeader } from '../components/design-system/AppPageHeader';
import { useApp } from '../contexts/AppContext';
import { usePaymentListener } from '../../hooks/usePaymentListener';

const readParam = (params: URLSearchParams, name: string) => params.get(name) ?? '';

export const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: appState } = useApp();

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  /**
   * PayOS trả về các params: code, id, cancel, status, orderCode
   * `id` là Payment Link ID của PayOS, dùng làm paymentId để query backend.
   * Fallback: lấy từ sessionStorage nếu đã lưu trước khi redirect.
   */
  const paymentId = useMemo(() => {
    const fromUrl = readParam(params, 'id') || readParam(params, 'paymentId');
    if (fromUrl) return fromUrl;
    try {
      return sessionStorage.getItem('billing_pending_payment_id') ?? null;
    } catch {
      return null;
    }
  }, [params]);

  const contextType = readParam(params, 'contextType') ||
    (() => { try { return sessionStorage.getItem('billing_pending_context_type') ?? 'subscription'; } catch { return 'subscription'; } })();

  const accessToken = appState.accessToken ?? null;

  const { status, paymentData, isSignalRConnected, pollAttempt, retryCheck } = usePaymentListener({
    paymentId,
    accessToken,
    onSuccess: () => {
      // Xóa sessionStorage sau khi thành công
      try {
        sessionStorage.removeItem('billing_pending_payment_id');
        sessionStorage.removeItem('billing_pending_context_type');
      } catch { /* ignore */ }
    },
  });

  const handleGoToDashboard = () => {
    navigate(contextType === 'mentor_booking' ? '/mentor-bookings' : '/dashboard', { replace: true });
  };

  const handleRetry = () => {
    navigate('/goi-dich-vu', { replace: true });
  };

  const handleContact = () => {
    navigate('/tro-giup', { replace: true });
  };

  // ─── Trạng thái: Đang chờ xác nhận ───
  if (status === 'waiting') {
    return (
      <div className="mx-auto max-w-2xl space-y-6 pb-12">
        <AppPageHeader
          title="Đang xác nhận thanh toán"
          subtitle="Vui lòng không đóng trang này"
          icon={Loader2}
          iconGradient="from-blue-500 to-violet-600"
        />
        <Card className="space-y-6 p-8 text-center">
          <div className="relative mx-auto h-20 w-20">
            <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-25" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600">
              <Loader2 className="h-9 w-9 animate-spin text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">
              Đang xác nhận kết quả thanh toán với ngân hàng…
            </h2>
            <p className="text-sm text-gray-500">
              Hệ thống đang chờ xác nhận từ PayOS. Quá trình này thường mất dưới 30 giây.
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <div className="flex items-center justify-center gap-2">
              {isSignalRConnected ? (
                <>
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Kết nối realtime đang hoạt động</span>
                </>
              ) : (
                <>
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                  <span>Đang kiểm tra qua polling{pollAttempt > 0 ? ` (lần ${pollAttempt})` : '…'}</span>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ─── Trạng thái: Thành công ───
  if (status === 'succeeded') {
    return (
      <div className="mx-auto max-w-2xl space-y-6 pb-12">
        <AppPageHeader
          title="Thanh toán thành công"
          subtitle={contextType === 'mentor_booking' ? 'Lịch hẹn đã được xác nhận' : 'Gói cước đã được kích hoạt'}
          icon={CheckCircle2}
          iconGradient="from-emerald-500 to-green-600"
        />
        <Card className="space-y-6 p-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-600 shadow-lg shadow-emerald-200">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              {contextType === 'mentor_booking' ? 'Lịch hẹn đã được xác nhận!' : 'Gói cước đã kích hoạt!'}
            </h2>
            <p className="text-sm text-gray-500">
              {contextType === 'mentor_booking'
                ? 'Cảm ơn bạn đã đặt lịch. Mentor sẽ liên hệ sớm.'
                : 'Cảm ơn bạn đã nâng cấp. Bạn đã có thể sử dụng toàn bộ tính năng Premium.'}
            </p>
            {paymentData && (
              <p className="mt-1 text-xs text-gray-400">
                Mã giao dịch: {paymentData.checkoutSessionId}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              id="payment-success-goto-btn"
              onClick={handleGoToDashboard}
              className="btn-glow gap-2"
            >
              {contextType === 'mentor_booking' ? 'Xem lịch hẹn' : 'Bắt đầu sử dụng'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ─── Trạng thái: Timeout (chưa nhận được xác nhận) ───
  if (status === 'timeout') {
    return (
      <div className="mx-auto max-w-2xl space-y-6 pb-12">
        <AppPageHeader
          title="Chưa nhận được xác nhận"
          subtitle="Giao dịch đang được xử lý"
          icon={AlertTriangle}
          iconGradient="from-amber-500 to-orange-600"
        />
        <Card className="space-y-6 p-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
            <AlertTriangle className="h-10 w-10 text-white" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">
              Chưa nhận được xác nhận từ ngân hàng
            </h2>
            <p className="text-sm text-gray-500">
              Nếu bạn đã bị trừ tiền, giao dịch có thể đang được xử lý. Vui lòng kiểm tra lại sau vài phút hoặc liên hệ hỗ trợ.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              id="payment-timeout-retry-check-btn"
              variant="outline"
              onClick={retryCheck}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Kiểm tra lại
            </Button>
            <Button
              id="payment-timeout-contact-btn"
              variant="outline"
              onClick={handleContact}
              className="gap-2"
            >
              <HeadphonesIcon className="h-4 w-4" />
              Liên hệ hỗ trợ
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ─── Trạng thái: Thất bại / Huỷ / Hết hạn ───
  const isCancelled = status === 'cancelled';
  const title = isCancelled ? 'Giao dịch đã huỷ' : 'Thanh toán không thành công';
  const subtitle = isCancelled
    ? 'Bạn đã huỷ giao dịch trên cổng PayOS'
    : 'Đã có lỗi xảy ra trong quá trình xử lý thanh toán';

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      <AppPageHeader
        title={title}
        subtitle={subtitle}
        icon={XCircle}
        iconGradient="from-rose-500 to-red-600"
      />
      <Card className="space-y-6 p-8 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-red-600">
          <XCircle className="h-10 w-10 text-white" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">
            {isCancelled
              ? 'Bạn có thể chọn lại gói và thực hiện thanh toán bất cứ lúc nào.'
              : 'Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề tiếp tục xảy ra.'}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            id="payment-failed-retry-btn"
            onClick={handleRetry}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Chọn lại gói
          </Button>
          <Button
            id="payment-failed-contact-btn"
            variant="outline"
            onClick={handleContact}
            className="gap-2"
          >
            <HeadphonesIcon className="h-4 w-4" />
            Liên hệ hỗ trợ
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;

