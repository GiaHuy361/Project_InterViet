import { apiClient } from '../lib/api/apiClient';

export type InterviewMode = 'text' | 'voice' | 'hybrid';
export type InterviewStatus =
  | 'live'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'abandoned';

export type InterviewType = 'technical' | 'behavioral' | 'case_study' | 'general';
export type InterviewerMode = 'professional' | 'friendly' | 'strict';
export type InterviewLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'manager';

export type AiModelValue =
  | 'gpt-4o-mini'
  | 'gpt-4o'
  | 'gemini-3-flash-preview'
  | 'gemini-3.1-pro'
  | 'standard'
  | 'basic'
  | 'advanced';

const LEGACY_AI_MODEL_TO_TIER: Record<string, 'basic' | 'standard' | 'advanced'> = {
  'gpt-4o-mini': 'basic',
  'gpt-3.5-turbo': 'basic',
  'gpt-4o': 'standard',
  'gpt-4o-realtime': 'standard',
  'claude-3-opus': 'advanced',
  'gemini-1.5-pro': 'advanced',
  'mixtral-8x7b': 'advanced',
  'gemini-3-flash-preview': 'basic',
  'gemini-3.1-pro': 'advanced',
};

export const normalizeAiModelTier = (value?: string | null): 'basic' | 'standard' | 'advanced' => {
  if (!value) return 'basic';
  if (value === 'basic' || value === 'standard' || value === 'advanced') return value;
  return LEGACY_AI_MODEL_TO_TIER[value] ?? 'basic';
};

export interface InterviewQuotaResponse {
  featureKey: string;
  canCreate: boolean;
  limitValue: number | null;
  usedToday: number | null;
  remainingValue: number | null;
  isUnlimited: boolean;
  planKey: string | null;
  message: string | null;
}

export interface InterviewQuestion {
  questionId: string;
  questionNumber: number;
  questionText: string;
  questionType: string;
  difficulty: string;
  expectedAnswerPoints?: string[] | null;
  askedAt?: string | null;
  hasAnswer?: boolean;
}

export interface InterviewAnswer {
  answerId: string;
  questionId: string;
  answerText: string;
  answeredAt: string | null;
  audioFileUrl?: string | null;
  audioDurationSeconds?: number | null;
  answerScore?: number | null;
  feedback?: string | null;
  clarityScore?: number | null;
  relevanceScore?: number | null;
  completenessScore?: number | null;
}

export interface InterviewScoreBreakdown {
  dimension: string;
  score: number | null;
  maxScore: number | null;
  comment?: string | null;
}

export interface InterviewFeedbackItem {
  category: string;
  title: string;
  detail: string;
  severity?: string | null;
}

export interface InterviewReport {
  overallScore: number | null;
  confidenceScore?: number | null;
  clarityScore?: number | null;
  relevanceScore?: number | null;
  paceScore?: number | null;
  strengths?: string[] | null;
  weaknesses?: string[] | null;
  recommendations?: string[] | null;
  scoreBreakdowns?: InterviewScoreBreakdown[] | null;
  feedbackItems?: InterviewFeedbackItem[] | null;
  modelVersion?: string | null;
  schemaVersion?: string | null;
}

export interface InterviewSession {
  id: string;
  position: string;
  level: InterviewLevel | string;
  interviewType: InterviewType | string;
  goal?: string | null;
  durationMinutes: number;
  mode: InterviewMode;
  interviewerMode: InterviewerMode | string;
  aiModel: AiModelValue | string;
  status: InterviewStatus | string;
  aiModelRaw?: string | null;
  totalExpectedQuestions?: number | null;
  answeredCount?: number | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  overallScore?: number | null;
  questions?: InterviewQuestion[] | null;
  answers?: InterviewAnswer[] | null;
  report?: InterviewReport | null;
}

export interface CreateInterviewRequest {
  position: string;
  level: InterviewLevel;
  interviewType: InterviewType;
  goal?: string | null;
  durationMinutes: number;
  mode: InterviewMode;
  interviewerMode: InterviewerMode;
  aiModel: AiModelValue;
}

export interface StartInterviewResponse {
  sessionId: string;
  status: string;
  question: InterviewQuestion | null;
  answeredCount?: number;
  totalExpectedQuestions?: number;
  isIdempotent?: boolean;
}

export interface SubmitMessageRequest {
  questionId?: string | null;
  answerText?: string | null;
  audioFileUrl: null;
  audioDurationSeconds: null;
}

export interface SubmitMessageResponse {
  sessionId: string;
  answeredQuestionId: string;
  answeredCount?: number;
  totalExpectedQuestions?: number;
  canComplete?: boolean;
  nextQuestion: InterviewQuestion | null;
  isCompleted: boolean;
}

export interface CompleteInterviewResponse {
  sessionId?: string;
  status?: string;
  report?: InterviewReport | null;
}

export interface InterviewListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  mode?: string;
  search?: string;
  sort?: string;
}

export interface InterviewStatsResponse {
  totalSessions: number;
  completedSessions: number;
  averageScore?: number | null;
  bestScore?: number | null;
  totalAnsweredQuestions?: number | null;
  totalPracticeMinutes?: number | null;
  totalMinutes?: number | null;
  recentSessions?: InterviewSession[] | null;
}

type RawCreateInterviewSessionResponse = {
  sessionId: string;
  status: string;
  position: string;
  level: string;
  interviewType: string;
  goal?: string | null;
  durationMinutes: number;
  mode: string;
  interviewerMode: string;
  aiModel: string;
  createdAt: string;
};

type RawStartInterviewResponse = {
  sessionId: string;
  status: string;
  startedAt?: string;
  firstQuestion?: RawInterviewQuestionResponse | null;
};

type RawSubmitMessageResponse = {
  sessionId: string;
  answerId: string;
  status: string;
  hasNextQuestion: boolean;
  nextQuestion?: RawInterviewQuestionResponse | null;
};

type RawInterviewSessionListItem = {
  sessionId: string;
  status: string;
  position: string;
  level: string;
  interviewType: string;
  mode: string;
  aiModel?: string | null;
  durationMinutes: number;
  questionCount: number;
  answeredCount: number;
  overallScore?: number | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
};

type RawInterviewSessionDetailResponse = {
  sessionId: string;
  status: string;
  position: string;
  level: string;
  interviewType: string;
  goal?: string | null;
  durationMinutes: number;
  mode: string;
  interviewerMode?: string | null;
  aiModel?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  totalExpectedQuestions: number;
  answeredCount: number;
  questions?: RawInterviewQuestionResponse[] | null;
  report?: RawInterviewReportResponse | null;
};

type RawInterviewQuestionResponse = {
  questionId: string;
  questionNumber: number;
  questionType: string;
  questionText: string;
  difficulty?: string | null;
  expectedAnswerPoints?: string[] | null;
  askedAt?: string | null;
  hasAnswer?: boolean;
  answer?: RawInterviewAnswerResponse | null;
};

type RawInterviewAnswerResponse = {
  answerId: string;
  answerText?: string | null;
  audioFileUrl?: string | null;
  audioDurationSeconds?: number | null;
  answerScore?: number | null;
  feedback?: string | null;
  clarityScore?: number | null;
  relevanceScore?: number | null;
  completenessScore?: number | null;
  answeredAt?: string | null;
};

type RawInterviewReportResponse = {
  overallScore?: number | null;
  confidenceScore?: number | null;
  clarityScore?: number | null;
  relevanceScore?: number | null;
  paceScore?: number | null;
  strengths?: string[] | null;
  weaknesses?: string[] | null;
  recommendations?: string[] | null;
  scoreBreakdowns?: unknown[] | null;
  feedbackItems?: unknown[] | null;
  modelVersion?: string | null;
  schemaVersion?: string | null;
};

type RawGetMyInterviewsResult = {
  items: RawInterviewSessionListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
};

type RawInterviewStatsResponse = {
  totalSessions: number;
  completedSessions: number;
  averageScore?: number | null;
  bestScore?: number | null;
  totalMinutes?: number | null;
  recentSessions?: RawInterviewSessionListItem[] | null;
};

export interface StartInterviewRealtimeRequest {
  mode: 'voice' | 'hybrid';
  aiModel: AiModelValue | string;
  voice?: string | null;
  language?: string | null;
  enableTranscript?: boolean;
}

export interface StartInterviewRealtimeResponse {
  sessionId: string;
  realtimeSessionId: string;
  status: string;
  provider?: string | null;
  model?: string | null;
  providerSessionId?: string | null;
  connectUrl?: string | null;
  clientSecret?: string | null;
  instructions?: string | null;
  expiresAt?: string | null;
  startedAt?: string | null;
  isIdempotent?: boolean;
}

export interface EndInterviewRealtimeRequest {
  realtimeSessionId: string;
  reason?: string | null;
}

export interface EndInterviewRealtimeResponse {
  sessionId: string;
  realtimeSessionId: string;
  status: string;
  endedAt?: string | null;
  message?: string | null;
}

export interface FinalizeRealtimeQaPair {
  questionNumber: number;
  questionText: string;
  answerText?: string | null;
  questionType?: string | null;
  difficulty?: string | null;
  askedAt?: string | null;
  answeredAt?: string | null;
}

export interface FinalizeInterviewRealtimeRequest {
  realtimeSessionId: string;
  transcriptText?: string | null;
  qaPairs: FinalizeRealtimeQaPair[];
  modelVersion?: string | null;
  schemaVersion?: string | null;
}

export interface FinalizeInterviewRealtimeResponse {
  sessionId: string;
  realtimeSessionId: string;
  status: string;
  savedQuestionCount: number;
  savedAnswerCount: number;
  canComplete: boolean;
  isIdempotent: boolean;
  message?: string | null;
}

export interface InterviewRealtimeEvent {
  eventId: string;
  sequenceNumber: number;
  eventType: string;
  role?: string | null;
  text?: string | null;
  providerEventId?: string | null;
  occurredAt: string;
}

export interface InterviewRealtimeSession {
  realtimeSessionId: string;
  status: string;
  provider?: string | null;
  model?: string | null;
  connectUrl?: string | null;
  expiresAt?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  errorCode?: string | null;
  createdAt: string;
}

export interface GetInterviewRealtimeResponse {
  sessionId: string;
  activeRealtimeSession?: InterviewRealtimeSession | null;
  events: InterviewRealtimeEvent[];
  totalEvents: number;
}

const mapScoreBreakdown = (item: unknown): InterviewScoreBreakdown | null => {
  if (!item || typeof item !== 'object') {
    return null;
  }
  const obj = item as Record<string, unknown>;
  const dimension =
    typeof obj.dimension === 'string'
      ? obj.dimension
      : typeof obj.name === 'string'
        ? obj.name
        : '';
  const score = typeof obj.score === 'number' ? obj.score : null;
  const maxScore =
    typeof obj.maxScore === 'number'
      ? obj.maxScore
      : typeof obj.max === 'number'
        ? obj.max
        : null;
  const comment =
    typeof obj.comment === 'string'
      ? obj.comment
      : typeof obj.feedback === 'string'
        ? obj.feedback
        : null;

  return { dimension, score, maxScore, comment };
};

const mapFeedbackItem = (item: unknown): InterviewFeedbackItem | null => {
  if (!item || typeof item !== 'object') {
    if (typeof item === 'string') {
      return { category: 'general', title: 'Feedback', detail: item };
    }
    return null;
  }
  const obj = item as Record<string, unknown>;
  const category = typeof obj.category === 'string' ? obj.category : 'general';
  const title =
    typeof obj.title === 'string'
      ? obj.title
      : typeof obj.dimension === 'string'
        ? obj.dimension
        : 'Feedback';
  const detail =
    typeof obj.detail === 'string'
      ? obj.detail
      : typeof obj.comment === 'string'
        ? obj.comment
        : '';

  return { category, title, detail };
};

const mapReport = (report?: RawInterviewReportResponse | null): InterviewReport | null => {
  if (!report) return null;
  const breakdowns = Array.isArray(report.scoreBreakdowns)
    ? report.scoreBreakdowns.map(mapScoreBreakdown).filter(Boolean)
    : [];
  const feedback = Array.isArray(report.feedbackItems)
    ? report.feedbackItems.map(mapFeedbackItem).filter(Boolean)
    : [];

  return {
    overallScore: report.overallScore ?? null,
    confidenceScore: report.confidenceScore ?? null,
    clarityScore: report.clarityScore ?? null,
    relevanceScore: report.relevanceScore ?? null,
    paceScore: report.paceScore ?? null,
    strengths: report.strengths ?? null,
    weaknesses: report.weaknesses ?? null,
    recommendations: report.recommendations ?? null,
    scoreBreakdowns: breakdowns.length > 0 ? (breakdowns as InterviewScoreBreakdown[]) : null,
    feedbackItems: feedback.length > 0 ? (feedback as InterviewFeedbackItem[]) : null,
    modelVersion: report.modelVersion ?? null,
    schemaVersion: report.schemaVersion ?? null,
  };
};

const mapQuestion = (question: RawInterviewQuestionResponse): InterviewQuestion => ({
  questionId: question.questionId,
  questionNumber: question.questionNumber,
  questionText: question.questionText,
  questionType: question.questionType,
  difficulty: question.difficulty ?? '',
  expectedAnswerPoints: question.expectedAnswerPoints ?? [],
  askedAt: question.askedAt ?? null,
  hasAnswer: question.hasAnswer ?? false,
});

const mapAnswer = (questionId: string, answer: RawInterviewAnswerResponse): InterviewAnswer => ({
  answerId: answer.answerId,
  questionId,
  answerText: answer.answerText ?? '',
  answeredAt: answer.answeredAt ?? null,
  audioFileUrl: answer.audioFileUrl ?? null,
  audioDurationSeconds: answer.audioDurationSeconds ?? null,
  answerScore: answer.answerScore ?? null,
  feedback: answer.feedback ?? null,
  clarityScore: answer.clarityScore ?? null,
  relevanceScore: answer.relevanceScore ?? null,
  completenessScore: answer.completenessScore ?? null,
});

const mapDetail = (detail: RawInterviewSessionDetailResponse): InterviewSession => {
  const questions = detail.questions?.map(mapQuestion) ?? [];
  const answers = detail.questions
    ? detail.questions
        .filter((q) => q.answer)
        .map((q) => mapAnswer(q.questionId, q.answer as RawInterviewAnswerResponse))
    : [];

  return {
    id: detail.sessionId,
    position: detail.position,
    level: detail.level,
    interviewType: detail.interviewType,
    goal: detail.goal ?? null,
    durationMinutes: detail.durationMinutes,
    mode: detail.mode as InterviewMode,
    interviewerMode: detail.interviewerMode ?? '',
    aiModel: normalizeAiModelTier(detail.aiModel),
    aiModelRaw: detail.aiModel ?? null,
    status: detail.status,
    totalExpectedQuestions: detail.totalExpectedQuestions,
    answeredCount: detail.answeredCount,
    createdAt: detail.createdAt,
    startedAt: detail.startedAt ?? null,
    completedAt: detail.completedAt ?? null,
    errorCode: detail.errorCode ?? null,
    errorMessage: detail.errorMessage ?? null,
    overallScore: detail.report?.overallScore ?? null,
    questions,
    answers,
    report: mapReport(detail.report),
  };
};

const mapListItem = (item: RawInterviewSessionListItem): InterviewSession => ({
  id: item.sessionId,
  position: item.position,
  level: item.level,
  interviewType: item.interviewType,
  goal: null,
  durationMinutes: item.durationMinutes,
  mode: item.mode as InterviewMode,
  interviewerMode: '',
  aiModel: normalizeAiModelTier(item.aiModel),
  status: item.status,
  totalExpectedQuestions: item.questionCount,
  answeredCount: item.answeredCount,
  createdAt: item.createdAt,
  startedAt: item.startedAt ?? null,
  completedAt: item.completedAt ?? null,
  overallScore: item.overallScore ?? null,
  questions: [],
  answers: [],
  report: null,
  aiModelRaw: item.aiModel ?? null,
});

export async function checkQuota(): Promise<InterviewQuotaResponse> {
  return apiClient.post<InterviewQuotaResponse>('/interviews/check-quota');
}

export async function createInterview(
  payload: CreateInterviewRequest
): Promise<InterviewSession> {
  const raw = await apiClient.post<RawCreateInterviewSessionResponse>('/interviews', payload);
  return {
    id: raw.sessionId,
    position: raw.position,
    level: raw.level,
    interviewType: raw.interviewType,
    goal: raw.goal ?? null,
    durationMinutes: raw.durationMinutes,
    mode: raw.mode as InterviewMode,
    interviewerMode: raw.interviewerMode,
    aiModel: normalizeAiModelTier(raw.aiModel),
    aiModelRaw: raw.aiModel ?? null,
    status: raw.status,
    totalExpectedQuestions: null,
    answeredCount: 0,
    createdAt: raw.createdAt,
    startedAt: null,
    completedAt: null,
    overallScore: null,
    questions: [],
    answers: [],
    report: null,
  };
}

export async function startInterview(id: string): Promise<StartInterviewResponse> {
  const raw = await apiClient.post<RawStartInterviewResponse>(`/interviews/${id}/start`, {});
  return {
    sessionId: raw.sessionId,
    status: raw.status,
    question: raw.firstQuestion ? mapQuestion(raw.firstQuestion) : null,
  };
}

export async function submitMessage(
  id: string,
  payload: SubmitMessageRequest
): Promise<SubmitMessageResponse> {
  const raw = await apiClient.post<RawSubmitMessageResponse>(
    `/interviews/${id}/messages`,
    payload
  );
  const detail = await getInterview(id);
  const nextQuestion = raw.nextQuestion ? mapQuestion(raw.nextQuestion) : null;
  const canComplete = !raw.hasNextQuestion || (detail.answeredCount ?? 0) > 0;
  const isCompleted = !raw.hasNextQuestion;

  return {
    sessionId: raw.sessionId,
    answeredQuestionId: raw.answerId,
    answeredCount: detail.answeredCount ?? undefined,
    totalExpectedQuestions: detail.totalExpectedQuestions ?? undefined,
    canComplete,
    nextQuestion,
    isCompleted,
  };
}

export async function completeInterview(
  id: string
): Promise<CompleteInterviewResponse> {
  return apiClient.post<CompleteInterviewResponse>(
    `/interviews/${id}/complete`,
    {}
  );
}

export async function getInterviews(
  params?: InterviewListParams
): Promise<InterviewSession[]> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.pageSize != null) search.set('pageSize', String(params.pageSize));
  if (params?.status) search.set('status', params.status);
  if (params?.mode) search.set('mode', params.mode);
  if (params?.search) search.set('search', params.search);
  if (params?.sort) search.set('sort', params.sort);
  const qs = search.toString();
  const data = await apiClient.get<RawGetMyInterviewsResult | RawInterviewSessionListItem[]>(
    `/interviews${qs ? `?${qs}` : ''}`
  );

  const items = Array.isArray(data) ? data : data.items;
  return items.map(mapListItem);
}

export async function getInterview(id: string): Promise<InterviewSession> {
  const detail = await apiClient.get<RawInterviewSessionDetailResponse>(`/interviews/${id}`);
  return mapDetail(detail);
}

export async function getStats(): Promise<InterviewStatsResponse> {
  const raw = await apiClient.get<RawInterviewStatsResponse>('/interviews/stats');
  return {
    totalSessions: raw.totalSessions,
    completedSessions: raw.completedSessions,
    averageScore: raw.averageScore ?? null,
    bestScore: raw.bestScore ?? null,
    totalAnsweredQuestions: null,
    totalPracticeMinutes: null,
    totalMinutes: raw.totalMinutes ?? null,
    recentSessions: raw.recentSessions ? raw.recentSessions.map(mapListItem) : null,
  };
}

export async function deleteInterview(id: string): Promise<void> {
  await apiClient.delete<void>(`/interviews/${id}`);
}

export async function startInterviewRealtime(
  id: string,
  payload: StartInterviewRealtimeRequest
): Promise<StartInterviewRealtimeResponse> {
  return apiClient.post<StartInterviewRealtimeResponse>(
    `/interviews/${id}/realtime/start`,
    payload
  );
}

export async function endInterviewRealtime(
  id: string,
  payload: EndInterviewRealtimeRequest
): Promise<EndInterviewRealtimeResponse> {
  return apiClient.post<EndInterviewRealtimeResponse>(
    `/interviews/${id}/realtime/end`,
    payload
  );
}

export async function getInterviewRealtime(
  id: string,
  eventPage = 1,
  eventPageSize = 50
): Promise<GetInterviewRealtimeResponse> {
  const search = new URLSearchParams();
  search.set('eventPage', String(eventPage));
  search.set('eventPageSize', String(eventPageSize));
  return apiClient.get<GetInterviewRealtimeResponse>(
    `/interviews/${id}/realtime?${search.toString()}`
  );
}

export async function finalizeInterviewRealtime(
  id: string,
  payload: FinalizeInterviewRealtimeRequest
): Promise<FinalizeInterviewRealtimeResponse> {
  return apiClient.post<FinalizeInterviewRealtimeResponse>(
    `/interviews/${id}/realtime/finalize`,
    payload
  );
}
