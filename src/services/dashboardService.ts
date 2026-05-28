import { apiClient } from '../lib/api/apiClient';
import type {
  DashboardSummaryResponse,
  ActivityLogResponse,
  UsageSummaryResponse,
  QuotaSnapshotResponse,
  DashboardActivityParams,
  DashboardUsageParams,
  RecentResumesListResponse,
  RecentJobDescriptionsResponse,
} from '../lib/api/dashboardTypes';

export async function getSummary(): Promise<DashboardSummaryResponse> {
  return apiClient.get<DashboardSummaryResponse>('/dashboard/summary');
}

export async function getActivity(
  params?: DashboardActivityParams
): Promise<ActivityLogResponse> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.pageSize != null) search.set('pageSize', String(params.pageSize));
  const qs = search.toString();
  return apiClient.get<ActivityLogResponse>(
    `/dashboard/activity${qs ? `?${qs}` : ''}`
  );
}

export async function getUsage(
  params?: DashboardUsageParams
): Promise<UsageSummaryResponse> {
  const search = new URLSearchParams();
  if (params?.from) search.set('from', params.from);
  if (params?.to) search.set('to', params.to);
  const qs = search.toString();
  return apiClient.get<UsageSummaryResponse>(
    `/dashboard/usage${qs ? `?${qs}` : ''}`
  );
}

export async function getQuota(): Promise<QuotaSnapshotResponse> {
  return apiClient.get<QuotaSnapshotResponse>('/dashboard/quota');
}

export async function getRecentResumes(): Promise<RecentResumesListResponse> {
  return apiClient.get<RecentResumesListResponse>('/resumes');
}

export async function getRecentJobDescriptions(
  params?: { page?: number; pageSize?: number }
): Promise<RecentJobDescriptionsResponse> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.pageSize != null) search.set('pageSize', String(params.pageSize));
  const qs = search.toString();
  return apiClient.get<RecentJobDescriptionsResponse>(
    `/job-descriptions${qs ? `?${qs}` : ''}`
  );
}
