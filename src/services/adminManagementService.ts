import { apiClient } from '../lib/api/apiClient';

export interface AdminDashboardSummaryResponse {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  activeSubscriptions: number;
  totalSubscriptionRevenue: number;
  totalPayments: number;
  totalMockRevenue: number;
  totalResumesOptimized: number;
  totalMatchingSessions: number;
  totalInterviewSessions: number;
  totalMentorBookings: number;
  totalBookingRevenue: number;
  totalReportShares: number;
  supportTicketsByStatus: {
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
}

export interface AdminUserSummary {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface AdminUserDetailResponse {
  userSummary: AdminUserSummary;
  profileSummary?: {
    headline?: string | null;
    bio?: string | null;
    yearsOfExperience?: string | number | null;
    skills?: string[];
    specialties?: { id: string; code: string; name: string; description?: string }[];
  } | null;
  currentSubscription?: {
    subscriptionId: string;
    planKey: string;
    status: string;
    startsAt?: string | null;
    endsAt?: string | null;
  } | null;
  quotaSummary?: {
    dailyMatchUsed: number;
    dailyMatchLimit: number;
    dailyInterviewUsed: number;
    dailyInterviewLimit: number;
    dailyOptimizeUsed: number;
    dailyOptimizeLimit: number;
  } | null;
  recentPayments?: Array<{
    paymentId: string;
    amount: number;
    currency: string;
    status: string;
    purpose?: string;
    createdAt: string;
  }> | null;
  recentBookings?: Array<{
    bookingId: string;
    mentorName: string;
    serviceType: string;
    status: string;
    amount: number;
    currency: string;
    startsAt: string;
  }> | null;
  supportTicketCount?: number;
}

export interface AdminUserListResponse {
  total: number;
  page: number;
  pageSize: number;
  items: AdminUserSummary[];
}

export function getAdminDashboardSummary(): Promise<AdminDashboardSummaryResponse> {
  return apiClient.get<AdminDashboardSummaryResponse>('/admin/dashboard/summary');
}

export function listAdminUsers(params?: {
  search?: string;
  role?: string;
  status?: string;
  emailVerified?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<AdminUserListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.role) searchParams.set('role', params.role);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.emailVerified != null) searchParams.set('emailVerified', String(params.emailVerified));
  if (params?.page != null) searchParams.set('page', String(params.page));
  if (params?.pageSize != null) searchParams.set('pageSize', String(params.pageSize));

  const qs = searchParams.toString();
  return apiClient.get<AdminUserListResponse>(`/admin/users${qs ? `?${qs}` : ''}`);
}

export function getAdminUserDetail(userId: string): Promise<AdminUserDetailResponse> {
  return apiClient.get<AdminUserDetailResponse>(`/admin/users/${encodeURIComponent(userId)}`);
}

export function updateAdminUserStatus(
  userId: string,
  status: 'active' | 'suspended' | 'disabled'
): Promise<{ message: string; email: string; previousStatus: string; currentStatus: string }> {
  return apiClient.patch(`/admin/users/${encodeURIComponent(userId)}/status`, { status });
}

export function updateAdminUserRoles(
  userId: string,
  roles: string[]
): Promise<{ message: string; previousRoles: string[]; currentRoles: string[] }> {
  return apiClient.patch(`/admin/users/${encodeURIComponent(userId)}/roles`, { roles });
}

export default {
  getAdminDashboardSummary,
  listAdminUsers,
  getAdminUserDetail,
  updateAdminUserStatus,
  updateAdminUserRoles,
};