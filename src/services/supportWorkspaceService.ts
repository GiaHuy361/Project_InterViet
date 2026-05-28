import { apiClient } from '../lib/api/apiClient';
import type { SupportDashboardSummary, SupportWorkspaceListResponse, SupportWorkspaceTicket, SupportWorkspaceMessage, SupportWorkspaceContactRequest, SupportWorkspaceContactRequestListResponse } from '../lib/api/publicTypes';

export const getSupportDashboardSummary = async (): Promise<SupportDashboardSummary> => {
  return apiClient.get<SupportDashboardSummary>('/support/workspace/dashboard/summary');
};

export const getSupportTickets = async (params: {
  status?: string;
  category?: string;
  priority?: string;
  assignedToMe?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<SupportWorkspaceListResponse> => {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set('status', params.status);
  if (params.category) searchParams.set('category', params.category);
  if (params.priority) searchParams.set('priority', params.priority);
  if (params.assignedToMe !== undefined) searchParams.set('assignedToMe', String(params.assignedToMe));
  if (params.search) searchParams.set('search', params.search);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));

  const qs = searchParams.toString();
  return apiClient.get<SupportWorkspaceListResponse>(`/support/workspace/tickets${qs ? `?${qs}` : ''}`);
};

export const getSupportTicketDetail = async (id: string): Promise<SupportWorkspaceTicket> => {
  return apiClient.get<SupportWorkspaceTicket>(`/support/workspace/tickets/${encodeURIComponent(id)}`);
};

export const assignTicketToSelf = async (id: string): Promise<{ ticketId: string; ticketNumber: string; assignedTo: string; status: string }> => {
  return apiClient.post<{ ticketId: string; ticketNumber: string; assignedTo: string; status: string }>(
    `/support/workspace/tickets/${encodeURIComponent(id)}/assign-self`,
    {}
  );
};

export const addTicketMessage = async (id: string, payload: { messageBody: string; isInternalNote: boolean }): Promise<SupportWorkspaceMessage> => {
  return apiClient.post<SupportWorkspaceMessage>(`/support/workspace/tickets/${encodeURIComponent(id)}/messages`, payload);
};

export const updateTicketStatus = async (id: string, status: string): Promise<{ previousStatus: string; currentStatus: string }> => {
  return apiClient.post<{ previousStatus: string; currentStatus: string }>(
    `/support/workspace/tickets/${encodeURIComponent(id)}/status`,
    { status }
  );
};


export const getContactRequests = async (params: {
  status?: string;
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<SupportWorkspaceContactRequestListResponse> => {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set('status', params.status);
  if (params.category) searchParams.set('category', params.category);
  if (params.search) searchParams.set('search', params.search);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));

  const qs = searchParams.toString();
  return apiClient.get<SupportWorkspaceContactRequestListResponse>(`/support/workspace/contact-requests${qs ? `?${qs}` : ''}`);
};

export const getContactRequestDetail = async (id: string): Promise<SupportWorkspaceContactRequest> => {
  return apiClient.get<SupportWorkspaceContactRequest>(`/support/workspace/contact-requests/${encodeURIComponent(id)}`);
};

export const updateContactRequestStatus = async (id: string, status: string): Promise<{ previousStatus: string; currentStatus: string }> => {
  return apiClient.post<{ previousStatus: string; currentStatus: string }>(
    `/support/workspace/contact-requests/${encodeURIComponent(id)}/status`,
    { status }
  );
};

export default {
  getSupportDashboardSummary,
  getSupportTickets,
  getSupportTicketDetail,
  assignTicketToSelf,
  addTicketMessage,
  updateTicketStatus,
  getContactRequests,
  getContactRequestDetail,
  updateContactRequestStatus,
};
