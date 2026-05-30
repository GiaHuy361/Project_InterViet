/**
 * PaymentRealtimeService — Phase 18
 *
 * Lắng nghe các sự kiện thanh toán realtime qua SignalR Hub `/hubs/notifications`.
 * Hub endpoint giống với notification hub (cùng kết nối, nhiều sự kiện).
 *
 * Sự kiện theo dõi:
 *   - `payment.updated`       — Trạng thái đơn hàng thay đổi (succeeded | failed)
 *   - `subscription.activated` — Gói cước đã được kích hoạt thành công trên DB
 */

import * as signalR from '@microsoft/signalr';

/** Payload cho sự kiện `payment.updated` */
export interface PaymentUpdatedPayload {
  paymentId: string;
  orderCode: number;
  status: 'succeeded' | 'failed' | string;
  provider: string;
  subscriptionId?: string;
}

/** Payload cho sự kiện `subscription.activated` */
export interface SubscriptionActivatedPayload {
  paymentId: string;
  orderCode: number;
  status: 'succeeded' | string;
  provider: string;
  subscriptionId: string;
}

type PaymentUpdatedHandler = (payload: PaymentUpdatedPayload) => void;
type SubscriptionActivatedHandler = (payload: SubscriptionActivatedPayload) => void;
type DisconnectedHandler = (error?: Error) => void;

class PaymentRealtimeService {
  private connection: signalR.HubConnection | null = null;
  private isConnecting = false;

  /**
   * Khởi động kết nối SignalR và đăng ký lắng nghe các sự kiện thanh toán.
   *
   * @param accessToken   JWT access token để xác thực Hub
   * @param onPaymentUpdated       Callback khi `payment.updated` nhận được
   * @param onSubscriptionActivated Callback khi `subscription.activated` nhận được
   * @param onDisconnected         Callback khi kết nối bị ngắt
   */
  public startConnection(
    accessToken: string,
    onPaymentUpdated: PaymentUpdatedHandler,
    onSubscriptionActivated: SubscriptionActivatedHandler,
    onDisconnected?: DisconnectedHandler
  ): void {
    if (this.connection || this.isConnecting) return;

    this.isConnecting = true;

    const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'https://api.interviet.vn';
    const hubUrl = `${baseUrl}/hubs/notifications`;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => accessToken,
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount === 0) return 2000;
          if (retryContext.previousRetryCount === 1) return 5000;
          if (retryContext.previousRetryCount === 2) return 10000;
          return 30000;
        },
      })
      .build();

    // Lắng nghe sự kiện trạng thái đơn hàng thay đổi
    this.connection.on('payment.updated', (payload: PaymentUpdatedPayload) => {
      console.log('💳 [PaymentRealtime] payment.updated:', payload);
      onPaymentUpdated(payload);
    });

    // Lắng nghe sự kiện kích hoạt Subscription thành công
    this.connection.on('subscription.activated', (payload: SubscriptionActivatedPayload) => {
      console.log('🎉 [PaymentRealtime] subscription.activated:', payload);
      onSubscriptionActivated(payload);
    });

    this.connection.onclose((error) => {
      console.warn('❌ [PaymentRealtime] Kết nối SignalR bị đóng:', error);
      this.connection = null;
      this.isConnecting = false;
      if (onDisconnected) onDisconnected(error);
    });

    this.connection.onreconnected(() => {
      console.log('🔄 [PaymentRealtime] Đã kết nối lại SignalR.');
    });

    this.connection
      .start()
      .then(() => {
        console.log('✔ [PaymentRealtime] Đã kết nối SignalR Payment Hub.');
        this.isConnecting = false;
      })
      .catch((err: Error) => {
        console.error('❌ [PaymentRealtime] Kết nối SignalR thất bại:', err);
        this.isConnecting = false;
        this.connection = null;
        if (onDisconnected) onDisconnected(err);
      });
  }

  /** Ngắt kết nối và cleanup listeners */
  public stopConnection(): void {
    if (this.connection) {
      this.connection.off('payment.updated');
      this.connection.off('subscription.activated');
      void this.connection.stop().then(() => {
        this.connection = null;
        this.isConnecting = false;
        console.log('🔌 [PaymentRealtime] Đã ngắt kết nối SignalR.');
      });
    }
  }

  public isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }
}

export const paymentRealtimeService = new PaymentRealtimeService();
export default paymentRealtimeService;
