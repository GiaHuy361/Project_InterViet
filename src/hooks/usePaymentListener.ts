/**
 * usePaymentListener — Phase 18
 *
 * Hook kết hợp SignalR realtime + Polling fallback để theo dõi kết quả thanh toán.
 *
 * Thứ tự ưu tiên:
 *   1. SignalR `subscription.activated` → kết quả nhanh nhất
 *   2. Polling GET /billing/payments/{id} mỗi 5s (tối đa 20 lần ≈ 100 giây)
 *   3. Timeout → hiển thị UI thủ công
 *
 * Quy tắc (Phase 18 docs §9):
 *   - KHÔNG tự động kích hoạt gói chỉ dựa vào query params URL
 *   - LUÔN xác nhận qua API Backend trước khi chuyển UI sang trạng thái thành công
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { paymentRealtimeService } from '../lib/realtime/paymentRealtimeService';
import { getPaymentById, type PaymentStatusResponse } from '../services/billingService';

export type PaymentListenerStatus =
  | 'waiting'    // Đang chờ xác nhận từ PayOS/Backend
  | 'succeeded'  // Thanh toán thành công, subscription đã kích hoạt
  | 'failed'     // Thanh toán thất bại
  | 'cancelled'  // Giao dịch đã huỷ
  | 'expired'    // Phiên giao dịch hết hạn
  | 'timeout';   // Timeout chờ quá lâu, chưa nhận được xác nhận

/** Các trạng thái terminal — dừng polling khi gặp */
const TERMINAL_STATUSES = new Set<string>(['succeeded', 'failed', 'cancelled', 'expired']);

/** Polling mỗi 5 giây, tối đa 20 lần (100 giây) → sau đó timeout */
const POLL_INTERVAL_MS = 5000;
const POLL_MAX_ATTEMPTS = 20;

export interface UsePaymentListenerOptions {
  /** paymentId nhận được từ checkout response hoặc query param của PayOS */
  paymentId: string | null;
  /** JWT access token để xác thực SignalR */
  accessToken: string | null | undefined;
  /** Callback khi subscription được kích hoạt thành công */
  onSuccess?: (data?: PaymentStatusResponse) => void;
  /** Callback khi thanh toán thất bại / huỷ / hết hạn */
  onFailed?: (status: string) => void;
  /** Callback khi timeout (quá 100s chưa có kết quả) */
  onTimeout?: () => void;
}

export interface UsePaymentListenerResult {
  status: PaymentListenerStatus;
  paymentData: PaymentStatusResponse | null;
  isSignalRConnected: boolean;
  pollAttempt: number;
  /** Cho phép retry polling thủ công */
  retryCheck: () => void;
}

export function usePaymentListener({
  paymentId,
  accessToken,
  onSuccess,
  onFailed,
  onTimeout,
}: UsePaymentListenerOptions): UsePaymentListenerResult {
  const [status, setStatus] = useState<PaymentListenerStatus>('waiting');
  const [paymentData, setPaymentData] = useState<PaymentStatusResponse | null>(null);
  const [isSignalRConnected, setIsSignalRConnected] = useState(false);
  const [pollAttempt, setPollAttempt] = useState(0);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptCountRef = useRef(0);
  const isTerminatedRef = useRef(false);

  /**
   * Xử lý kết quả terminal: dừng polling, cập nhật status, gọi callback
   */
  const handleTerminal = useCallback(
    (newStatus: string, data?: PaymentStatusResponse) => {
      if (isTerminatedRef.current) return;
      isTerminatedRef.current = true;

      // Dừng polling
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }

      // Dừng SignalR
      paymentRealtimeService.stopConnection();
      setIsSignalRConnected(false);

      if (data) setPaymentData(data);

      if (newStatus === 'succeeded') {
        setStatus('succeeded');
        onSuccess?.(data);
      } else if (newStatus === 'timeout') {
        setStatus('timeout');
        onTimeout?.();
      } else {
        setStatus(newStatus as PaymentListenerStatus);
        onFailed?.(newStatus);
      }
    },
    [onSuccess, onFailed, onTimeout]
  );

  /**
   * Gọi một lần polling để kiểm tra trạng thái từ Backend
   */
  const pollOnce = useCallback(async () => {
    if (!paymentId || isTerminatedRef.current) return;

    attemptCountRef.current += 1;
    setPollAttempt(attemptCountRef.current);

    // Kiểm tra giới hạn
    if (attemptCountRef.current > POLL_MAX_ATTEMPTS) {
      handleTerminal('timeout');
      return;
    }

    try {
      const data = await getPaymentById(paymentId);
      if (isTerminatedRef.current) return;

      if (TERMINAL_STATUSES.has(data.status)) {
        handleTerminal(data.status, data);
      }
    } catch (err) {
      // Không dừng polling vì lỗi mạng nhất thời — tiếp tục thử
      console.error('[usePaymentListener] Lỗi polling:', err);
    }
  }, [paymentId, handleTerminal]);

  /**
   * Cho phép retry thủ công từ UI
   */
  const retryCheck = useCallback(() => {
    if (!paymentId) return;
    void pollOnce();
  }, [paymentId, pollOnce]);

  // ──────────────────────────────────────────────────
  // Effect: Khởi động SignalR + Polling khi có paymentId
  // ──────────────────────────────────────────────────
  useEffect(() => {
    if (!paymentId) return;

    isTerminatedRef.current = false;
    attemptCountRef.current = 0;
    setPollAttempt(0);
    setStatus('waiting');
    setPaymentData(null);

    // ─── Polling ngay lập tức lần đầu ───
    void pollOnce();

    // ─── Bắt đầu polling interval ───
    pollIntervalRef.current = setInterval(() => {
      void pollOnce();
    }, POLL_INTERVAL_MS);

    // ─── Kết nối SignalR nếu có token ───
    if (accessToken) {
      paymentRealtimeService.startConnection(
        accessToken,
        // payment.updated
        (payload) => {
          if (payload.paymentId !== paymentId) return;
          console.log('[usePaymentListener] SignalR payment.updated:', payload.status);
          if (payload.status === 'failed') {
            handleTerminal('failed');
          }
          // succeeded sẽ được xử lý bởi subscription.activated
        },
        // subscription.activated
        (payload) => {
          if (payload.paymentId !== paymentId) return;
          console.log('[usePaymentListener] SignalR subscription.activated ✅');
          // Lấy dữ liệu đầy đủ từ API để confirm
          void getPaymentById(paymentId)
            .then((data) => handleTerminal('succeeded', data))
            .catch(() => handleTerminal('succeeded'));
        },
        // onDisconnected
        () => {
          setIsSignalRConnected(false);
          // Polling đã chạy, không cần làm gì thêm
        }
      );

      // Kiểm tra kết nối sau 3s
      const checkConnected = setTimeout(() => {
        setIsSignalRConnected(paymentRealtimeService.isConnected());
      }, 3000);

      return () => {
        clearTimeout(checkConnected);
      };
    }

    // Cleanup
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      paymentRealtimeService.stopConnection();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId, accessToken]);

  return {
    status,
    paymentData,
    isSignalRConnected,
    pollAttempt,
    retryCheck,
  };
}
