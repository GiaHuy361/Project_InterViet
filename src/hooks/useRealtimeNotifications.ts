import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationRealtimeService, NotificationPayload, UnreadCountPayload } from '../lib/realtime/notificationRealtimeService';
import { notificationService } from '../services/notificationService';

export function useRealtimeNotifications(accessToken: string | null | undefined) {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(false);
  const fallbackIntervalRef = useRef<number | ReturnType<typeof setTimeout> | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      if (response && response.unreadCount !== undefined) {
        setUnreadCount(response.unreadCount);
      }
    } catch (error) {
      console.error('Lỗi khi fetch số lượng thông báo chưa đọc (Fallback Polling):', error);
    }
  }, []);

  const startFallbackPolling = useCallback(() => {
    if (!fallbackIntervalRef.current) {
      console.log('Kích hoạt Fallback Polling (mỗi 45 giây)');
      // Fetch ngay lập tức lần đầu
      fetchUnreadCount();
      fallbackIntervalRef.current = setInterval(fetchUnreadCount, 45000);
    }
  }, [fetchUnreadCount]);

  const stopFallbackPolling = useCallback(() => {
    if (fallbackIntervalRef.current) {
      console.log('Tắt Fallback Polling');
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!accessToken) {
      notificationRealtimeService.stopConnection();
      stopFallbackPolling();
      setIsRealtimeConnected(false);
      setUnreadCount(0);
      return;
    }

    // Luôn fetch lần đầu khi login
    fetchUnreadCount();

    const handleNotificationCreated = (notification: NotificationPayload) => {
      // You can trigger a toast notification here
      // toast.info(notification.title, { description: notification.message });
    };

    const handleCountChanged = (data: UnreadCountPayload) => {
      setUnreadCount(data.unreadCount);
    };

    const handleDisconnected = () => {
      setIsRealtimeConnected(false);
      startFallbackPolling();
    };

    notificationRealtimeService.startConnection(
      accessToken,
      handleNotificationCreated,
      handleCountChanged,
      handleDisconnected
    );
    
    // Check if connected successfully after a short delay
    setTimeout(() => {
      if (notificationRealtimeService.isConnected()) {
        setIsRealtimeConnected(true);
        stopFallbackPolling();
      } else {
        startFallbackPolling();
      }
    }, 3000);

    return () => {
      notificationRealtimeService.stopConnection();
      stopFallbackPolling();
    };
  }, [accessToken, fetchUnreadCount, startFallbackPolling, stopFallbackPolling]);

  return {
    unreadCount,
    setUnreadCount, // In case we want to manually decrease it after reading
    isRealtimeConnected,
  };
}
