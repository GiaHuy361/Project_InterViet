import { apiClient } from '../lib/api/apiClient';
import type { 
  MentorWorkspaceDashboardSummary, 
  MentorProfile, 
  UpdateMentorProfileRequest,
  MentorWorkspaceBookingItem,
  MentorWorkspaceBookingListResponse,
  MentorAvailabilitySlot,
  UpdateMentorAvailabilityRequest
} from '../lib/api/publicTypes';

export const getMentorDashboardSummary = async (): Promise<MentorWorkspaceDashboardSummary> => {
  return apiClient.get<MentorWorkspaceDashboardSummary>('/mentor/dashboard/summary');
};

export const getMentorProfile = async (): Promise<MentorProfile> => {
  return apiClient.get<MentorProfile>('/mentor/profile');
};

export const updateMentorProfile = async (data: UpdateMentorProfileRequest): Promise<MentorProfile> => {
  return apiClient.put<MentorProfile>('/mentor/profile', data);
};

export const getMentorBookings = async (params: {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<MentorWorkspaceBookingListResponse> => {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set('status', params.status);
  if (params.search) searchParams.set('search', params.search);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));

  const qs = searchParams.toString();
  return apiClient.get<MentorWorkspaceBookingListResponse>(`/mentor/bookings${qs ? `?${qs}` : ''}`);
};

export const getMentorBookingDetail = async (id: string): Promise<MentorWorkspaceBookingItem> => {
  return apiClient.get<MentorWorkspaceBookingItem>(`/mentor/bookings/${encodeURIComponent(id)}`);
};

export const updateMentorBookingStatus = async (id: string, payload: { status: string; cancelReason?: string }): Promise<{ previousStatus: string; currentStatus: string }> => {
  return apiClient.post<{ previousStatus: string; currentStatus: string }>(
    `/mentor/bookings/${encodeURIComponent(id)}/status`,
    payload
  );
};

export const getMentorAvailability = async (): Promise<MentorAvailabilitySlot[]> => {
  return apiClient.get<MentorAvailabilitySlot[]>('/mentor/availability');
};

export const updateMentorAvailability = async (payload: UpdateMentorAvailabilityRequest): Promise<{ clearedCount: number; addedCount: number }> => {
  return apiClient.put<{ clearedCount: number; addedCount: number }>('/mentor/availability', payload);
};

export default {
  getMentorDashboardSummary,
  getMentorProfile,
  updateMentorProfile,
  getMentorBookings,
  getMentorBookingDetail,
  updateMentorBookingStatus,
  getMentorAvailability,
  updateMentorAvailability,
};
