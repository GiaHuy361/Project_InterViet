import { apiClient } from '../lib/api/apiClient';

export type AdminTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | string;

export interface AdminSupportMessage {
  id: string;
  senderType: string;
  senderUserId?: string | null;
  messageBody: string;
  createdAt: string;
  isInternalNote?: boolean;
}

export interface AdminSupportTicket {
  id: string;
  ticketNumber: string;
  category: string;
  priority: string;
  subject: string;
  status: AdminTicketStatus;
  description?: string;
  assignedTo?: string | null;
  createdAt: string;
  closedAt?: string | null;
  lastMessageAt?: string | null;
  messages?: AdminSupportMessage[];
}

export interface AdminSupportTicketListResponse {
  total: number;
  page: number;
  pageSize: number;
  items: AdminSupportTicket[];
}

export function listAdminSupportTickets(params?: {
  status?: string;
  category?: string;
  priority?: string;
  userId?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminSupportTicketListResponse> {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.category) search.set('category', params.category);
  if (params?.priority) search.set('priority', params.priority);
  if (params?.userId) search.set('userId', params.userId);
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.pageSize != null) search.set('pageSize', String(params.pageSize));

  const q = search.toString();
  return apiClient.get<AdminSupportTicketListResponse>(`/admin/support/tickets${q ? `?${q}` : ''}`);
}

export function getAdminSupportTicketDetail(ticketId: string): Promise<AdminSupportTicket> {
  return apiClient.get<AdminSupportTicket>(`/admin/support/tickets/${encodeURIComponent(ticketId)}`);
}

export function assignAdminSupportTicket(ticketId: string, assignedTo: string): Promise<{ message: string; status: string; assignedTo: string }> {
  return apiClient.post(`/admin/support/tickets/${encodeURIComponent(ticketId)}/assign`, { assignedTo });
}

export function postAdminSupportMessage(ticketId: string, payload: { messageBody: string; isInternalNote?: boolean }) {
  return apiClient.post(`/admin/support/tickets/${encodeURIComponent(ticketId)}/messages`, payload);
}

export function overrideAdminSupportTicketStatus(ticketId: string, status: string) {
  return apiClient.post(`/admin/support/tickets/${encodeURIComponent(ticketId)}/status`, { status });
}

export default {
  listAdminSupportTickets,
  getAdminSupportTicketDetail,
  assignAdminSupportTicket,
  postAdminSupportMessage,
  overrideAdminSupportTicketStatus,
};
