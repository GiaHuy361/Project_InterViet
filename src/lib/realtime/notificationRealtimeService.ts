import * as signalR from '@microsoft/signalr';

export interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCountPayload {
  unreadCount: number;
}

class NotificationRealtimeService {
  private connection: signalR.HubConnection | null = null;
  private isConnecting: boolean = false;

  public startConnection(
    accessToken: string,
    onNotificationCreated: (notification: NotificationPayload) => void,
    onCountChanged: (data: UnreadCountPayload) => void,
    onDisconnected?: (error?: Error) => void
  ) {
    if (this.connection || this.isConnecting) return;

    this.isConnecting = true;
    
    // In a real environment, you might read the API base URL from env vars.
    // Assuming the base URL is the same domain or configured via proxy.
    // For now we use the absolute URL provided in docs or relative if proxied.
    const baseUrl = import.meta.env.VITE_API_URL || 'https://api.interviet.vn';
    const hubUrl = `${baseUrl}/hubs/notifications`;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => accessToken,
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: retryContext => {
          if (retryContext.previousRetryCount === 0) return 2000;
          if (retryContext.previousRetryCount === 1) return 5000;
          if (retryContext.previousRetryCount === 2) return 10000;
          return 30000;
        }
      })
      .build();

    this.connection.on('notification.created', (payload: NotificationPayload) => {
      console.log('⚡ Nhận thông báo realtime mới:', payload);
      onNotificationCreated(payload);
    });

    this.connection.on('notification.unread_count_changed', (data: UnreadCountPayload) => {
      console.log('🔔 Cập nhật số thông báo chưa đọc mới:', data.unreadCount);
      onCountChanged(data);
    });

    this.connection.onclose((error) => {
      console.warn('❌ Kết nối SignalR bị đóng:', error);
      if (onDisconnected) onDisconnected(error);
    });

    this.connection
      .start()
      .then(() => {
        console.log('✔ Đã kết nối thành công tới SignalR Notification Hub.');
        this.isConnecting = false;
      })
      .catch(err => {
        console.error('❌ Kết nối SignalR thất bại:', err);
        this.isConnecting = false;
        if (onDisconnected) onDisconnected(err);
      });
  }

  public stopConnection() {
    if (this.connection) {
      this.connection.stop().then(() => {
        this.connection = null;
        this.isConnecting = false;
        console.log('🔌 Đã ngắt kết nối SignalR.');
      });
    }
  }

  public isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }
}

export const notificationRealtimeService = new NotificationRealtimeService();
export default notificationRealtimeService;
