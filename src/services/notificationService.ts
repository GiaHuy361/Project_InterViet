import { apiClient } from '../lib/api/apiClient';

export interface NotificationItem {
  id: string;
  type?: string;
  title: string;
  message: string;
  priority?: 'low' | 'normal' | 'high' | 'critical' | string;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
  actionUrl?: string | null;
  source?: string | null;
  data?: Record<string, unknown> | null;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface NotificationPreferences {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  mentionEnabled: boolean;
  reportEnabled: boolean;
  billingEnabled: boolean;
}

export const notificationService = {
  listNotifications: (params?: { page?: number; pageSize?: number; unreadOnly?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.page !== undefined) searchParams.set('page', String(params.page));
    if (params?.pageSize !== undefined) searchParams.set('pageSize', String(params.pageSize));
    if (params?.unreadOnly !== undefined) searchParams.set('unreadOnly', String(params.unreadOnly));
    const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiClient.get<NotificationListResponse>(`/notifications${suffix}`);
  },

  getUnreadCount: () => apiClient.get<{ unreadCount: number }>('/notifications/unread-count'),

  markRead: (notificationId: string) => apiClient.patch<void>(`/notifications/${notificationId}/read`),

  markAllRead: () => apiClient.patch<void>('/notifications/read-all'),

  getPreferences: () => apiClient.get<NotificationPreferences>('/notifications/preferences'),

  updatePreferences: (payload: NotificationPreferences) =>
    apiClient.put<NotificationPreferences>('/notifications/preferences', payload),
};
