import { apiClient } from '../lib/api/apiClient';
import { normalizeApiList } from '../lib/api/responseHelpers';

export type JobDescriptionId = string;

export interface JobDescriptionListParams {
  page?: number;
  pageSize?: number;
}

export interface JobDescriptionPayload {
  title: string;
  companyName?: string;
  location?: string;
  salaryText?: string;
  sourceUrl?: string;
  postedAt?: string;
  rawText: string;
}

export interface JobDescriptionSummary extends JobDescriptionPayload {
  id: string;
  userId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobDescriptionDetail extends JobDescriptionSummary {
  parsed?: unknown;
}

function buildQuery(params?: JobDescriptionListParams): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    searchParams.set(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function createJobDescription(payload: JobDescriptionPayload): Promise<JobDescriptionDetail> {
  return apiClient.post<JobDescriptionDetail>('/job-descriptions', payload);
}

export async function getJobDescriptions(params?: JobDescriptionListParams): Promise<JobDescriptionSummary[]> {
  return apiClient.get<JobDescriptionSummary[]>(`/job-descriptions${buildQuery(params)}`);
}

export async function safeGetJobDescriptions(params?: JobDescriptionListParams): Promise<JobDescriptionSummary[]> {
  return normalizeApiList<JobDescriptionSummary>(await getJobDescriptions(params));
}

export async function getJobDescriptionDetail(id: JobDescriptionId): Promise<JobDescriptionDetail> {
  return apiClient.get<JobDescriptionDetail>(`/job-descriptions/${id}`);
}

export async function updateJobDescription(
  id: JobDescriptionId,
  payload: JobDescriptionPayload
): Promise<JobDescriptionDetail> {
  return apiClient.put<JobDescriptionDetail>(`/job-descriptions/${id}`, payload);
}

export async function deleteJobDescription(id: JobDescriptionId): Promise<void> {
  return apiClient.delete<void>(`/job-descriptions/${id}`);
}
