import { apiClient } from '../lib/api/apiClient';
import type { MentorSummary } from './mentorService';

export interface AdminMentorListResponse {
  total: number;
  page: number;
  pageSize: number;
  items: AdminMentorSummary[];
}

export interface AdminMentorSummary extends MentorSummary {
  userId: string;
  isVerified: boolean;
  status: string;
}

export interface AdminMentorFilters {
  search?: string;
  isVerified?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * 22. Lấy toàn bộ danh sách Mentor trong hệ thống để duyệt
 */
export function listAdminMentors(filters?: AdminMentorFilters): Promise<AdminMentorListResponse> {
  const searchParams = new URLSearchParams();
  if (filters?.search) searchParams.set('search', filters.search);
  if (filters?.isVerified !== undefined) searchParams.set('isVerified', String(filters.isVerified));
  if (filters?.page != null) searchParams.set('page', String(filters.page));
  if (filters?.pageSize != null) searchParams.set('pageSize', String(filters.pageSize));

  const qs = searchParams.toString();
  return apiClient.get<AdminMentorListResponse>(`/mentor/admin/mentors${qs ? `?${qs}` : ''}`);
}

/**
 * 23. Phê duyệt duyệt / Hủy duyệt hồ sơ chuyên gia
 */
export function verifyMentor(id: string, verify: boolean): Promise<any> {
  return apiClient.post(`/mentor/admin/mentors/${encodeURIComponent(id)}/verify?verify=${verify}`, {});
}

/**
 * 24. Đóng / Mở hoạt động hồ sơ Mentor
 */
export function updateMentorStatus(id: string, status: 'active' | 'inactive'): Promise<any> {
  return apiClient.post(`/mentor/admin/mentors/${encodeURIComponent(id)}/status?status=${status}`, {});
}

export default {
  listAdminMentors,
  verifyMentor,
  updateMentorStatus,
};
