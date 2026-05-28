import { apiClient } from '../lib/api/apiClient';

export type SupportTicketCategory = 'technical' | 'billing' | 'feature' | 'other' | string;
export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent' | string;
export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | string;
export type SupportMessageSenderType = 'user' | 'support' | 'admin' | string;

export interface SupportTicketMessage {
  id: string;
  senderType: SupportMessageSenderType;
  senderUserId?: string | null;
  messageBody: string;
  createdAt: string;
  isInternalNote?: boolean;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  subject: string;
  status: SupportTicketStatus;
  description: string;
  assignedTo?: string | null;
  createdAt: string;
  closedAt?: string | null;
  lastMessageAt?: string | null;
  messages: SupportTicketMessage[];
}

export interface SupportTicketListResponse {
  total: number;
  page: number;
  pageSize: number;
  items: SupportTicket[];
}

export interface CreateSupportTicketPayload {
  subject: string;
  description: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
}

export interface SendSupportTicketMessagePayload {
  messageBody: string;
}

export interface CloseSupportTicketResponse {
  message: string;
}

export function createSupportTicket(payload: CreateSupportTicketPayload): Promise<SupportTicket> {
  return apiClient.post<SupportTicket>('/support/tickets', payload);
}

export function listSupportTickets(params?: {
  page?: number;
  pageSize?: number;
}): Promise<SupportTicketListResponse> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.pageSize != null) search.set('pageSize', String(params.pageSize));
  const query = search.toString();

  return apiClient.get<SupportTicketListResponse>(`/support/tickets${query ? `?${query}` : ''}`);
}

export function getSupportTicketDetail(ticketId: string): Promise<SupportTicket> {
  return apiClient.get<SupportTicket>(`/support/tickets/${encodeURIComponent(ticketId)}`);
}

export function sendSupportTicketMessage(
  ticketId: string,
  payload: SendSupportTicketMessagePayload
): Promise<SupportTicketMessage> {
  return apiClient.post<SupportTicketMessage>(`/support/tickets/${encodeURIComponent(ticketId)}/messages`, payload);
}

export function closeSupportTicket(ticketId: string): Promise<CloseSupportTicketResponse> {
  return apiClient.post<CloseSupportTicketResponse>(`/support/tickets/${encodeURIComponent(ticketId)}/close`);
}
