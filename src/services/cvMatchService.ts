import { apiClient } from '../lib/api/apiClient';

export type ParseStatus = 'Queued' | 'Processing' | 'Parsed' | 'Failed';
export type MatchSessionType = 'Single' | 'Multi' | 'single' | 'multi';
export type MatchStatus =
  | 'Pending'
  | 'Processing'
  | 'Completed'
  | 'PartiallyCompleted'
  | 'Failed'
  | 'Cancelled'
  | 'pending'
  | 'processing'
  | 'completed'
  | 'partially_completed'
  | 'failed'
  | 'cancelled';

export interface ResumeItem {
  resumeId: string;
  title: string;
  originalFileName: string;
  fileSizeBytes: number;
  parseStatus: ParseStatus | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeParseJob {
  jobId: string;
  resumeId: string;
  status: string;
  provider?: string;
  correlationId?: string;
  errorCode?: string | null;
  errorMessage?: string | null;
  salaryText?: string | null;
  sourceUrl?: string | null;
  postedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  retryCount?: number;
  requestedAt?: string;
  completedAt?: string | null;
}

export interface JobDescriptionPayload {
  title: string;
  companyName: string;
  location: string;
  salaryText: string;
  sourceUrl: string;
  rawText: string;
  postedAt: string;
}

export interface ResumeDetail extends ResumeItem {
  versionNumber?: number;
  latestVersionId?: string;
  fileExtension?: string;
  contentType?: string;
  processingError?: string | null;
  latestParseJob?: ResumeParseJob | null;
  parsedData?: Record<string, unknown>;
}

export interface ResumeListParams {
  page?: number;
  pageSize?: number;
  status?: ParseStatus | string;
  isActive?: boolean;
}

export interface ResumeListResponse {
  items: ResumeItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface JobDescriptionItem {
  id: string;
  title: string;
  companyName: string;
  location: string;
  rawText: string;
  salaryText?: string | null;
  sourceUrl?: string | null;
  postedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MatchResult {
  totalScore: number;
  technicalScore: number;
  experienceScore: number;
  educationScore: number;
  languageScore: number;
  summaryText: string;
  matchedSkillsJson?: string | null;
  missingSkillsJson?: string | null;
  strengthsJson?: string | null;
  weaknessesJson?: string | null;
  suggestionsJson?: string | null;
}

export interface MatchTarget {
  targetId: string;
  jobDescriptionId: string;
  jobTitle?: string | null;
  companyName?: string | null;
  status: MatchStatus;
  totalScore: number;
  technicalScore?: number | null;
  experienceScore?: number | null;
  educationScore?: number | null;
  languageScore?: number | null;
  summaryText?: string | null;
  matchedSkillsJson?: string | null;
  missingSkillsJson?: string | null;
  strengthsJson?: string | null;
  weaknessesJson?: string | null;
  suggestionsJson?: string | null;
  completedAt?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
}

export interface MatchSessionDetail {
  sessionId: string;
  resumeId?: string;
  resumeVersionId?: string;
  jobDescriptionId?: string | null;
  sessionType: MatchSessionType;
  status: MatchStatus;
  requestedAt?: string;
  completedAt?: string | null;
  targetCount?: number;
  completedCount?: number;
  failedCount?: number;
  errorCode?: string | null;
  errorMessage?: string | null;
  bestScore?: number | null;
  averageScore?: number | null;
  result: MatchResult | null;
  targets: MatchTarget[] | null;
}

export interface MatchSessionPage {
  items: MatchSessionDetail[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export type StartMatchResponse =
  | MatchSessionPage
  | {
      sessionId: string;
      status: MatchStatus;
    };

export type StartSingleMatchResponse = StartMatchResponse;

export const cvMatchService = {
  uploadResume: (file: File, title?: string) => {
    const formData = new FormData();
    formData.append('File', file);
    if (title?.trim()) formData.append('Title', title.trim());
    return apiClient.upload<ResumeItem>('/resumes', formData);
  },

  listResumes: (params?: ResumeListParams) => {
    const search = new URLSearchParams();
    if (params?.page != null) search.set('page', String(params.page));
    if (params?.pageSize != null) search.set('pageSize', String(params.pageSize));
    if (params?.status) search.set('status', params.status);
    if (params?.isActive != null) search.set('isActive', String(params.isActive));
    const qs = search.toString();
    return apiClient.get<ResumeListResponse>(`/resumes${qs ? `?${qs}` : ''}`);
  },

  getResumeDetail: (resumeId: string) => apiClient.get<ResumeDetail>(`/resumes/${resumeId}`),

  createJobDescription: (payload: {
    title: string;
    companyName: string;
    location: string;
    rawText: string;
    sourceUrl?: string;
    salaryText?: string;
    postedAt?: string;
  }) => apiClient.post<JobDescriptionItem>('/job-descriptions', payload),

  updateJobDescription: (jobDescriptionId: string, payload: JobDescriptionPayload) =>
    apiClient.put<JobDescriptionItem>(`/job-descriptions/${jobDescriptionId}`, payload),

  deleteJobDescription: (jobDescriptionId: string) =>
    apiClient.delete<void>(`/job-descriptions/${jobDescriptionId}`),

  listJobDescriptions: () =>
    apiClient.get<{ items: JobDescriptionItem[]; totalCount: number }>('/job-descriptions?page=1&pageSize=100'),

  startSingleMatch: (resumeId: string, jobDescriptionId: string) =>
    apiClient.post<StartMatchResponse>('/matches', {
      resumeId,
      jobDescriptionId,
    }),

  startMultiMatch: (payload: { resumeId: string; jobDescriptionIds: string[]; title: string }) =>
    apiClient.post<StartMatchResponse>('/matches/multi', payload),

  getMatchSessionDetail: (sessionId: string) => apiClient.get<MatchSessionDetail>(`/matches/${sessionId}`),

  listMatchSessions: (params?: { page?: number; pageSize?: number; sessionType?: MatchSessionType }) => {
    const search = new URLSearchParams();
    if (params?.page != null) search.set('page', String(params.page));
    if (params?.pageSize != null) search.set('pageSize', String(params.pageSize));
    if (params?.sessionType) search.set('sessionType', params.sessionType);
    const qs = search.toString();
    return apiClient.get<MatchSessionPage>(`/matches${qs ? `?${qs}` : ''}`);
  },

  downloadResume: (resumeId: string) => apiClient.get<Response>(`/resumes/${resumeId}/download`, { rawResponse: true }),
};
