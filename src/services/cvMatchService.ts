import { apiClient } from '../lib/api/apiClient';

export type ParseStatus = 'Queued' | 'Processing' | 'Parsed' | 'Failed';
export type MatchSessionType = 'Single' | 'Multi' | 'single' | 'multi';
export type MatchStatus =
  | 'Pending'
  | 'Processing'
  | 'Completed'
  | 'Failed'
  | 'Cancelled'
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ResumeItem {
  resumeId: string;
  title: string;
  originalFileName: string;
  fileSizeBytes: number;
  parseStatus: ParseStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobDescriptionItem {
  id: string;
  title: string;
  companyName: string;
  location: string;
  rawText: string;
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

  listResumes: () => apiClient.get<{ items: ResumeItem[]; totalCount: number }>('/resumes?page=1&pageSize=20'),

  getResumeDetail: (resumeId: string) => apiClient.get<ResumeItem & { parsedData?: Record<string, unknown> }>(`/resumes/${resumeId}`),

  createJobDescription: (payload: {
    title: string;
    companyName: string;
    location: string;
    rawText: string;
    sourceUrl?: string;
    salaryText?: string;
    postedAt?: string;
  }) => apiClient.post<JobDescriptionItem>('/job-descriptions', payload),

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

  downloadResume: (resumeId: string) => apiClient.get<Response>(`/resumes/${resumeId}/download`, { rawResponse: true }),
};
