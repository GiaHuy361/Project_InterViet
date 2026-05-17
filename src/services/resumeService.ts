import { apiClient } from '../lib/api/apiClient';
import { normalizeApiList } from '../lib/api/responseHelpers';
import { logApiAction } from '../lib/api/apiDebug';

export type ResumeId = string;

export interface ResumeListParams {
  page?: number;
  pageSize?: number;
}

export interface ResumeUploadPayload {
  file: File;
  title?: string;
}

export interface ResumeSummary {
  resumeId: string;
  title?: string | null;
  originalFileName?: string | null;
  fileName?: string | null;
  fileSizeBytes?: number | null;
  contentType?: string | null;
  parseStatus?: string | null;
  isActive?: boolean;
  createdAt?: string | null;
}

export interface ResumeDetail extends ResumeSummary {
  uploadedAt?: string | null;
  parsedAt?: string | null;
  failedReason?: string | null;
  parseConfidenceScore?: number | null;
  personalInfo?: unknown;
  skillsJson?: string | null;
  experiencesJson?: string | null;
  educationsJson?: string | null;
  languagesJson?: string | null;
  certificationsJson?: string | null;
  projectsJson?: string | null;
  warningsJson?: string | null;
  rawText?: string | null;
  parsedMetadata?: unknown;
}

export interface ProcessingJob {
  jobId?: string;
  resumeId?: string;
  status?: string;
  provider?: string;
  errorMessage?: string | null;
  requestedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

function buildQuery(params?: ResumeListParams): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    searchParams.set(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function normalizeResumeDetail(detail: ResumeDetail): ResumeDetail {
  const parsedData = (detail as { parsedData?: Partial<ResumeDetail> } | null)?.parsedData;
  if (!parsedData || typeof parsedData !== 'object') return detail;
  return {
    ...detail,
    ...parsedData,
    parseConfidenceScore: parsedData.parseConfidenceScore ?? detail.parseConfidenceScore,
    skillsJson: parsedData.skillsJson ?? detail.skillsJson,
    experiencesJson: parsedData.experiencesJson ?? detail.experiencesJson,
    educationsJson: parsedData.educationsJson ?? detail.educationsJson,
    languagesJson: parsedData.languagesJson ?? detail.languagesJson,
    certificationsJson: parsedData.certificationsJson ?? detail.certificationsJson,
    projectsJson: parsedData.projectsJson ?? detail.projectsJson,
    warningsJson: parsedData.warningsJson ?? detail.warningsJson,
    rawText: parsedData.rawText ?? detail.rawText,
  } as ResumeDetail;
}

export async function uploadResume(payload: ResumeUploadPayload): Promise<ResumeDetail> {
  const formData = new FormData();
  formData.append('File', payload.file);
  if (payload.title?.trim()) formData.append('Title', payload.title.trim());
  return normalizeResumeDetail(await apiClient.upload<ResumeDetail>('/resumes', formData));
}

export async function getResumes(params?: ResumeListParams): Promise<ResumeSummary[]> {
  return apiClient.get<ResumeSummary[]>(`/resumes${buildQuery(params)}`);
}

export async function safeGetResumes(params?: ResumeListParams): Promise<ResumeSummary[]> {
  return normalizeApiList<ResumeSummary>(await getResumes(params));
}

export async function getActiveResume(): Promise<ResumeDetail | null> {
  try {
    return await apiClient.get<ResumeDetail>('/resumes/active');
  } catch (error) {
    return null;
  }
}

export async function getResume(id: ResumeId): Promise<ResumeDetail> {
  return normalizeResumeDetail(await apiClient.get<ResumeDetail>(`/resumes/${id}`));
}

export async function setActiveResume(id: ResumeId): Promise<void> {
  logApiAction('resume.setActive', { id });
  return apiClient.patch<void>(`/resumes/${id}/active`);
}

export async function deleteResume(id: ResumeId): Promise<void> {
  logApiAction('resume.delete', { id });
  return apiClient.delete<void>(`/resumes/${id}`);
}

export async function reprocessResume(id: ResumeId): Promise<{ jobId?: string; resumeId?: string; status?: string }> {
  logApiAction('resume.reprocess', { id });
  return apiClient.post<{ jobId?: string; resumeId?: string; status?: string }>(`/resumes/${id}/reprocess`);
}

export async function getProcessingJobs(id: ResumeId): Promise<ProcessingJob[]> {
  return apiClient.get<ProcessingJob[]>(`/resumes/${id}/processing-jobs`);
}

export async function downloadResume(id: ResumeId): Promise<Response> {
  return apiClient.get<Response>(`/resumes/${id}/download`, { rawResponse: true });
}
