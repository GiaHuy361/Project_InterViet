import { apiClient } from '../lib/api/apiClient';
import { normalizeApiList } from '../lib/api/responseHelpers';

export type MatchSessionId = string;

export interface SingleMatchPayload {
  resumeId: string;
  jobDescriptionId: string;
}

export interface MultiMatchPayload {
  resumeId: string;
  jobDescriptionIds: string[];
}

export interface MatchListParams {
  page?: number;
  pageSize?: number;
}

export interface SingleMatchResult {
  id?: string;
  totalScore?: number | null;
  technicalScore?: number | null;
  experienceScore?: number | null;
  educationScore?: number | null;
  languageScore?: number | null;
  matchBand?: string | null;
  summaryText?: string | null;
  matchedSkillsJson?: string | null;
  missingSkillsJson?: string | null;
  strengthsJson?: string | null;
  weaknessesJson?: string | null;
  suggestionsJson?: string | null;
  createdAt?: string | null;
}

export interface MultiMatchTarget {
  targetId?: string;
  jobDescriptionId?: string;
  jobTitle?: string | null;
  companyName?: string | null;
  status?: string | null;
  totalScore?: number | null;
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
}

export interface MatchSessionDetail {
  sessionId: string;
  resumeId?: string;
  resumeVersionId?: string;
  jobDescriptionId?: string;
  sessionType?: string;
  status?: string;
  requestedAt?: string | null;
  completedAt?: string | null;
  result?: SingleMatchResult | null;
  targetCount?: number | null;
  completedCount?: number | null;
  failedCount?: number | null;
  bestScore?: number | null;
  averageScore?: number | null;
  targets?: MultiMatchTarget[];
  errorMessage?: string | null;
}

export interface MatchSessionListItem {
  sessionId: string;
  sessionType?: string | null;
  status?: string | null;
  targetCount?: number | null;
  completedCount?: number | null;
  failedCount?: number | null;
  bestScore?: number | null;
  averageScore?: number | null;
  requestedAt?: string | null;
  completedAt?: string | null;
}

export interface MatchSessionListResponse {
  items?: MatchSessionListItem[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
}

function buildQuery(params?: MatchListParams): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    searchParams.set(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function createSingleMatch(payload: SingleMatchPayload): Promise<{ sessionId: string; status: string }> {
  return apiClient.post<{ sessionId: string; status: string }>('/matches', payload);
}

export async function createMultiMatch(payload: MultiMatchPayload): Promise<{ sessionId: string; status: string }> {
  return apiClient.post<{ sessionId: string; status: string }>('/matches/multi', payload);
}

export async function getMatchSessions(params?: MatchListParams): Promise<MatchSessionListResponse> {
  return apiClient.get<MatchSessionListResponse>(`/matches${buildQuery(params)}`);
}

export async function safeGetMatchSessions(params?: MatchListParams): Promise<MatchSessionListItem[]> {
  const response = await getMatchSessions(params);
  return normalizeApiList<MatchSessionListItem>(response.items ?? []);
}

export async function getMatchSessionDetail(sessionId: MatchSessionId): Promise<MatchSessionDetail> {
  return apiClient.get<MatchSessionDetail>(`/matches/${sessionId}`);
}
