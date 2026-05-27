import { apiClient } from '../lib/api/apiClient';

export interface AdminPaymentRecord {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  currencyCode: string;
  status: 'succeeded' | 'failed' | 'pending' | string;
  purpose: 'subscription_plan' | 'mentor_booking' | string;
  provider: 'vnpay' | 'momo' | 'stripe' | 'payos' | string;
  createdAt: string;
}

export interface AdminInvoiceRecord {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  currencyCode: string;
  status: 'draft' | 'open' | 'paid' | 'void' | string;
  purpose: 'subscription_plan' | 'mentor_booking' | string;
  createdAt: string;
}

export interface AdminSubscriptionRecord {
  id: string;
  userId: string;
  userEmail: string;
  planKey: string;
  status: 'active' | 'expired' | 'cancelled' | string;
  startsAt: string;
  endsAt: string;
}

export interface AdminMentorBookingRecord {
  bookingId: string;
  userId: string;
  candidateEmail: string;
  mentorName: string;
  serviceType: string;
  status: 'pending_payment' | 'confirmed' | 'cancelled' | 'completed' | string;
  priceAmount: number;
  currencyCode: string;
  startsAt: string;
  endsAt: string;
  paymentStatus: string;
}

export interface AdminReportShareRecord {
  shareId: string;
  userId: string;
  ownerEmail: string;
  ownerFullName: string;
  reportType: 'interview' | 'match' | string;
  resourceId: string;
  title: string;
  isActive: boolean;
  allowPdfDownload: boolean;
  viewCount: number;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string | null;
  tokenPreview: string;
}

export interface AdminPaginatedResponse<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}

export function listAdminPayments(params?: {
  status?: string;
  purpose?: string;
  provider?: string;
  userId?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminPaginatedResponse<AdminPaymentRecord>> {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.purpose) search.set('purpose', params.purpose);
  if (params?.provider) search.set('provider', params.provider);
  if (params?.userId) search.set('userId', params.userId);
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.pageSize != null) search.set('pageSize', String(params.pageSize));
  const qs = search.toString();
  return apiClient.get<AdminPaginatedResponse<AdminPaymentRecord>>(`/admin/billing/payments${qs ? `?${qs}` : ''}`);
}

export function listAdminInvoices(params?: {
  status?: string;
  purpose?: string;
  userId?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminPaginatedResponse<AdminInvoiceRecord>> {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.purpose) search.set('purpose', params.purpose);
  if (params?.userId) search.set('userId', params.userId);
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.pageSize != null) search.set('pageSize', String(params.pageSize));
  const qs = search.toString();
  return apiClient.get<AdminPaginatedResponse<AdminInvoiceRecord>>(`/admin/billing/invoices${qs ? `?${qs}` : ''}`);
}

export function listAdminSubscriptions(params?: {
  status?: string;
  userId?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminPaginatedResponse<AdminSubscriptionRecord>> {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.userId) search.set('userId', params.userId);
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.pageSize != null) search.set('pageSize', String(params.pageSize));
  const qs = search.toString();
  return apiClient.get<AdminPaginatedResponse<AdminSubscriptionRecord>>(`/admin/subscriptions${qs ? `?${qs}` : ''}`);
}

export function listAdminMentorBookings(params?: {
  status?: string;
  mentorId?: string;
  userId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminPaginatedResponse<AdminMentorBookingRecord>> {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.mentorId) search.set('mentorId', params.mentorId);
  if (params?.userId) search.set('userId', params.userId);
  if (params?.from) search.set('from', params.from);
  if (params?.to) search.set('to', params.to);
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.pageSize != null) search.set('pageSize', String(params.pageSize));
  const qs = search.toString();
  return apiClient.get<AdminPaginatedResponse<AdminMentorBookingRecord>>(`/admin/mentor-bookings${qs ? `?${qs}` : ''}`);
}

export function listAdminReportShares(params?: {
  reportType?: string;
  userId?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<AdminPaginatedResponse<AdminReportShareRecord>> {
  const search = new URLSearchParams();
  if (params?.reportType) search.set('reportType', params.reportType);
  if (params?.userId) search.set('userId', params.userId);
  if (params?.isActive != null) search.set('isActive', String(params.isActive));
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.pageSize != null) search.set('pageSize', String(params.pageSize));
  const qs = search.toString();
  return apiClient.get<AdminPaginatedResponse<AdminReportShareRecord>>(`/admin/reports/shares${qs ? `?${qs}` : ''}`);
}

export default {
  listAdminPayments,
  listAdminInvoices,
  listAdminSubscriptions,
  listAdminMentorBookings,
  listAdminReportShares,
};