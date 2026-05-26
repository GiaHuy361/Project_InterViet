import { apiClient } from '../lib/api/apiClient';

export interface ReportShareRequest {
  title: string;
  description: string;
  expiresAt: string;
  allowPdfDownload: boolean;
}

export interface ReportShareItem {
  shareId: string;
  userId?: string;
  ownerEmail?: string;
  ownerFullName?: string;
  reportType: 'interview' | 'match' | string;
  resourceId: string;
  title: string;
  isActive: boolean;
  allowPdfDownload: boolean;
  viewCount?: number;
  createdAt?: string;
  expiresAt?: string | null;
  revokedAt?: string | null;
  tokenPreview?: string | null;
  shareToken?: string;
  shareUrl?: string;
  apiUrl?: string;
}

export interface SharedReportResponse {
  token: string;
  title: string;
  description?: string | null;
  allowPdfDownload: boolean;
  reportType: 'interview' | 'match' | string;
  createdAt?: string;
  expiresAt?: string | null;
  viewCount?: number;
  summary?: string | null;
  data?: unknown;
}

export const reportShareService = {
  createInterviewReportShare: (interviewId: string, payload: ReportShareRequest) =>
    apiClient.post<ReportShareItem>(`/interviews/${interviewId}/report/share`, payload),

  listInterviewReportShares: (interviewId: string) =>
    apiClient.get<{ items: ReportShareItem[] }>(`/interviews/${interviewId}/report/shares`),

  deleteInterviewReportShare: (interviewId: string, shareId: string) =>
    apiClient.delete<void>(`/interviews/${interviewId}/report/shares/${shareId}`),

  createMatchReportShare: (sessionId: string, payload: ReportShareRequest) =>
    apiClient.post<ReportShareItem>(`/matches/${sessionId}/report/share`, payload),

  listMatchReportShares: (sessionId: string) =>
    apiClient.get<{ items: ReportShareItem[] }>(`/matches/${sessionId}/report/shares`),

  deleteMatchReportShare: (sessionId: string, shareId: string) =>
    apiClient.delete<void>(`/matches/${sessionId}/report/shares/${shareId}`),

  getSharedReport: (token: string) =>
    apiClient.get<SharedReportResponse>(`/reports/shared/${token}`, { skipAuth: true }),

  exportSharedReportPdf: (token: string) =>
    apiClient.get<Response>(`/reports/shared/${token}/export-pdf`, {
      skipAuth: true,
      rawResponse: true,
    }),
};
