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
  inAppNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  billingNotificationsEnabled: boolean;
  resumeNotificationsEnabled: boolean;
  matchingNotificationsEnabled: boolean;
  interviewNotificationsEnabled: boolean;
  mentorNotificationsEnabled: boolean;
  systemNotificationsEnabled: boolean;
  // Backward-compatible aliases used by older UI sections.
  inAppEnabled?: boolean;
  emailEnabled?: boolean;
  mentionEnabled?: boolean;
  reportEnabled?: boolean;
  billingEnabled?: boolean;
}

export const notificationService = {
  listNotifications: (params?: { page?: number; pageSize?: number; isRead?: boolean; type?: string; priority?: string; unreadOnly?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.page !== undefined) searchParams.set('page', String(params.page));
    if (params?.pageSize !== undefined) searchParams.set('pageSize', String(params.pageSize));
    if (params?.isRead !== undefined) searchParams.set('isRead', String(params.isRead));
    if (params?.type) searchParams.set('type', params.type);
    if (params?.priority) searchParams.set('priority', params.priority);
    if (params?.unreadOnly !== undefined) searchParams.set('isRead', String(!params.unreadOnly));
    const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiClient.get<NotificationListResponse>(`/notifications${suffix}`);
  },

  getUnreadCount: () => apiClient.get<{ unreadCount: number }>('/notifications/unread-count'),

  markRead: (notificationId: string) => apiClient.patch<void>(`/notifications/${notificationId}/read`),

  markAllRead: (payload?: { type?: string }) => apiClient.patch<void>('/notifications/read-all', payload || {}),

  getPreferences: () => apiClient.get<NotificationPreferences>('/notifications/preferences'),

  updatePreferences: (payload: NotificationPreferences) =>
    apiClient.put<NotificationPreferences>('/notifications/preferences', payload),

  deleteNotification: (id: string) => apiClient.delete<void>(`/notifications/${encodeURIComponent(id)}`),
};
