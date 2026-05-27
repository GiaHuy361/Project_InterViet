import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppPageHeader } from '../components/design-system/AppPageHeader';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { AlertCircle, BriefcaseBusiness, CheckCircle2, FileText, Link2, Sparkles, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { ApiError } from '../../lib/api/apiError';
import { useApp } from '../contexts/AppContext';
import {
  cvMatchService,
  type JobDescriptionItem,
  type MatchSessionDetail,
  type ResumeItem,
  type StartSingleMatchResponse,
} from '../../services/cvMatchService';
import { useAsyncPolling } from '../../hooks/useAsyncPolling';
import {
  type PollingSessionSnapshot,
  clearPollingSessionSnapshot,
  readPollingSessionSnapshot,
  writePollingSessionSnapshot,
} from '../../utils/pollingSessionStorage';
import { safeParseJson } from '../../utils/safeParseJson';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.jpg', '.jpeg', '.png'];
const MATCH_POLL_INTERVAL_MS = 5000;
const RESUME_PARSE_POLL_INTERVAL_MS = 3000;
const RESUME_PARSE_TIMEOUT_MS = 180000;
const CV_MATCH_POLLING_STORAGE_KEY = 'interviet.cv-matching.polling-state';

type CVMatchPollingSnapshot = PollingSessionSnapshot<MatchSessionDetail> & {
  cvTitle: string;
  selectedResumeId: string | null;
  jobDescription: JobDescriptionItem | null;
  jdTitle: string;
  companyName: string;
  location: string;
  jdRawText: string;
};

function extractList(value?: string | null): string[] {
  if (!value) return [];
  const parsed = safeParseJson<unknown>(value, value);

  if (Array.isArray(parsed)) return parsed.map(String);
  if (typeof parsed === 'string') {
    return parsed
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getNormalizedStatus(status?: string | null): string {
  return status?.trim().toLowerCase() ?? '';
}

function isFinalMatchStatus(status?: string | null): boolean {
  return ['completed', 'partially_completed', 'failed', 'cancelled'].includes(getNormalizedStatus(status));
}

function isResumeParsed(status?: string | null): boolean {
  return getNormalizedStatus(status) === 'parsed';
}

function isResumeParseFailed(status?: string | null): boolean {
  return ['failed', 'cancelled'].includes(getNormalizedStatus(status));
}

function getSessionFromStartResponse(response: StartSingleMatchResponse): MatchSessionDetail | null {
  if ('items' in response) {
    return response.items[0] ?? null;
  }

  return {
    sessionId: response.sessionId,
    sessionType: 'Single',
    status: response.status,
    errorCode: null,
    errorMessage: null,
    result: null,
    targets: null,
  };
}

export const CVMatchingPage: React.FC = () => {
  const { addNotification, syncNotifications } = useApp();
  const [cvTitle, setCvTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jdTitle, setJdTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [jdRawText, setJdRawText] = useState('');

  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState<JobDescriptionItem | null>(null);
  const [sessionDetail, setSessionDetail] = useState<MatchSessionDetail | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [lastNotifiedStatus, setLastNotifiedStatus] = useState<string | null>(null);
  const [isRestored, setIsRestored] = useState(false);
  const activeSessionIdRef = useRef<string | null>(null);
  const selectedResumeIdRef = useRef<string | null>(null);

  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isCreatingJd, setIsCreatingJd] = useState(false);
  const [isStartingMatch, setIsStartingMatch] = useState(false);

  const fetchMatchSession = useCallback(async () => {
    if (!activeSessionIdRef.current) throw new Error('Missing session id');
    return cvMatchService.getMatchSessionDetail(activeSessionIdRef.current);
  }, []);

  const setCurrentSessionId = useCallback((sessionId: string | null) => {
    activeSessionIdRef.current = sessionId;
    setActiveSessionId(sessionId);
  }, []);

  const notifyFinalStatus = useCallback((status: string) => {
    if (['failed', 'cancelled'].includes(status)) {
      toast.error('Phiên so khớp thất bại. Vui lòng thử lại.');
      return;
    }

    addNotification({
      title: 'CV + JD: Kết quả đối sánh đã sẵn sàng',
      message: 'Phiên so khớp CV và JD đã hoàn tất. Mở lại trang CV Matching để xem chi tiết.',
      type: 'success',
      read: false,
      actionUrl: '/cv-matching',
      metadata: {
        source: 'cv-matching',
        status,
      },
    });
    toast.success('Phân tích hoàn tất.');
    // Sync notifications to ensure badge/inbox reflect server state
    void syncNotifications().catch(() => undefined);
  }, [addNotification]);

  const { isPolling, startPolling, stopPolling } = useAsyncPolling<MatchSessionDetail>({
    fetchFn: fetchMatchSession,
    getStatusFn: (data) => data.status,
    intervalMs: MATCH_POLL_INTERVAL_MS,
    onSuccess: (data) => {
      setSessionDetail(data);
      setCurrentSessionId(null);
      const status = getNormalizedStatus(data.status);
      setLastNotifiedStatus(status);
      notifyFinalStatus(status);
    },
    onFailure: (error) => {
      const message = error instanceof Error ? error.message : 'Có lỗi khi polling kết quả.';
      toast.error(message);
    },
  });

  const primaryTarget = sessionDetail?.targets?.[0] ?? null;
  const primaryMatch = sessionDetail?.result ?? primaryTarget;
  const totalScore = primaryMatch?.totalScore ?? 0;
  const scoreBreakdown = [
    { label: 'Kỹ thuật', value: primaryMatch?.technicalScore },
    { label: 'Kinh nghiệm', value: primaryMatch?.experienceScore },
    { label: 'Học vấn', value: primaryMatch?.educationScore },
    { label: 'Ngôn ngữ', value: primaryMatch?.languageScore },
  ].filter((item): item is { label: string; value: number } => typeof item.value === 'number');
  const missingSkills = useMemo(() => extractList(primaryMatch?.missingSkillsJson), [primaryMatch]);
  const matchedSkills = useMemo(() => extractList(primaryMatch?.matchedSkillsJson), [primaryMatch]);
  const strengths = useMemo(() => extractList(primaryMatch?.strengthsJson), [primaryMatch]);
  const weaknesses = useMemo(() => extractList(primaryMatch?.weaknessesJson), [primaryMatch]);
  const suggestions = useMemo(() => extractList(primaryMatch?.suggestionsJson), [primaryMatch]);
  const selectedResume = useMemo(
    () => resumes.find((item) => item.resumeId === selectedResumeId) ?? null,
    [resumes, selectedResumeId]
  );
  const canStartMatch = Boolean(selectedResume?.resumeId && jobDescription?.id);

  const handleApiError = (error: unknown) => {
    if (error instanceof ApiError) {
      if (error.status === 403 && error.code === 'Quota.Exceeded') {
        toast.error('Bạn đã sử dụng hết lượt trong gói hiện tại. Vui lòng nâng cấp gói.');
        return;
      }

      if (error.status === 503 || error.code === 'Service.Unavailable') {
        toast.error('Dịch vụ AI/CV tạm thời không khả dụng. Vui lòng thử lại sau vài phút.');
        return;
      }

      toast.error(error.message);
      return;
    }

    if (error instanceof Error) {
      toast.error(error.message);
      return;
    }

    toast.error('Có lỗi không xác định.');
  };

  const clearMatchState = () => {
    stopPolling();
    setSessionDetail(null);
    setLastNotifiedStatus(null);
    setCurrentSessionId(null);
    clearPollingSessionSnapshot(CV_MATCH_POLLING_STORAGE_KEY);
  };
  const loadResumes = useCallback(async () => {
    setIsLoadingResumes(true);
    try {
      const response = await cvMatchService.listResumes();
      const items = response.items ?? [];
      setResumes(items);
      const currentSelectedResumeId = selectedResumeIdRef.current;
      if (currentSelectedResumeId && !items.some((item) => item.resumeId === currentSelectedResumeId)) {
        setSelectedResumeId(null);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoadingResumes(false);
    }
  }, []);

  useEffect(() => {
    selectedResumeIdRef.current = selectedResumeId;
  }, [selectedResumeId]);

  useEffect(() => {
    void loadResumes();
  }, [loadResumes]);

  useEffect(() => {
    const restorePollingState = async () => {
      const snapshot = readPollingSessionSnapshot<MatchSessionDetail>(CV_MATCH_POLLING_STORAGE_KEY) as CVMatchPollingSnapshot | null;

      if (!snapshot) {
        setIsRestored(true);
        return;
      }

      setCvTitle(snapshot.cvTitle ?? '');
      setSelectedResumeId(snapshot.selectedResumeId ?? null);
      setJobDescription(snapshot.jobDescription ?? null);
      setJdTitle(snapshot.jdTitle ?? '');
      setCompanyName(snapshot.companyName ?? '');
      setLocation(snapshot.location ?? '');
      setJdRawText(snapshot.jdRawText ?? '');
      setSessionDetail(snapshot.sessionDetail ?? null);
      setLastNotifiedStatus(snapshot.lastNotifiedStatus ?? null);
      setCurrentSessionId(snapshot.activeSessionId ?? null);

      const savedStatus = getNormalizedStatus(snapshot.sessionDetail?.status);
      if (snapshot.sessionDetail && isFinalMatchStatus(savedStatus)) {
        if (snapshot.lastNotifiedStatus !== savedStatus) {
          notifyFinalStatus(savedStatus);
          setLastNotifiedStatus(savedStatus);
        }
        setCurrentSessionId(null);
        setIsRestored(true);
        return;
      }

      if (snapshot.activeSessionId) {
        try {
          const refreshedDetail = await cvMatchService.getMatchSessionDetail(snapshot.activeSessionId);
          setSessionDetail(refreshedDetail);

          const refreshedStatus = getNormalizedStatus(refreshedDetail.status);
          if (isFinalMatchStatus(refreshedStatus)) {
            setCurrentSessionId(null);
            if (snapshot.lastNotifiedStatus !== refreshedStatus) {
              notifyFinalStatus(refreshedStatus);
              setLastNotifiedStatus(refreshedStatus);
            }
          } else {
            startPolling();
          }
        } catch (error) {
          handleApiError(error);
        }
      }

      setIsRestored(true);
    };

    void restorePollingState();
  }, [notifyFinalStatus, startPolling]);

  useEffect(() => {
    if (!isRestored) return;

    writePollingSessionSnapshot(CV_MATCH_POLLING_STORAGE_KEY, {
      activeSessionId,
      sessionDetail,
      lastNotifiedStatus,
      cvTitle,
      selectedResumeId,
      jobDescription,
      jdTitle,
      companyName,
      location,
      jdRawText,
    });
  }, [
    activeSessionId,
    companyName,
    cvTitle,
    isRestored,
    jdRawText,
    jdTitle,
    jobDescription,
    lastNotifiedStatus,
    location,
    selectedResumeId,
    sessionDetail,
  ]);

  const refreshPollingState = useCallback(async () => {
    const sessionId = activeSessionIdRef.current;
    if (!sessionId) return;

    try {
      const refreshedDetail = await cvMatchService.getMatchSessionDetail(sessionId);
      setSessionDetail(refreshedDetail);

      const refreshedStatus = getNormalizedStatus(refreshedDetail.status);
      if (isFinalMatchStatus(refreshedStatus)) {
        stopPolling();
        setCurrentSessionId(null);
        if (lastNotifiedStatus !== refreshedStatus) {
          notifyFinalStatus(refreshedStatus);
          setLastNotifiedStatus(refreshedStatus);
        }
      } else if (!isPolling) {
        startPolling();
      }
    } catch (error) {
      handleApiError(error);
    }
  }, [isPolling, lastNotifiedStatus, notifyFinalStatus, startPolling, stopPolling]);

  useEffect(() => {
    if (!isRestored) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      if (!activeSessionIdRef.current) return;
      if (isFinalMatchStatus(sessionDetail?.status)) return;

      void refreshPollingState();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRestored, refreshPollingState, sessionDetail?.status]);

  const waitForResumeParsed = async (resumeId: string): Promise<ResumeItem> => {
    const startedAt = Date.now();

    while (Date.now() - startedAt <= RESUME_PARSE_TIMEOUT_MS) {
      const detail = await cvMatchService.getResumeDetail(resumeId);

      if (isResumeParsed(detail.parseStatus)) {
        return detail;
      }

      if (isResumeParseFailed(detail.parseStatus)) {
        throw new Error('AI phân tích CV thất bại. Vui lòng thử lại với file khác.');
      }

      await new Promise((resolve) => window.setTimeout(resolve, RESUME_PARSE_POLL_INTERVAL_MS));
    }

    throw new Error('Hết thời gian chờ AI phân tích CV. Vui lòng thử lại sau.');
  };

  const resetJobDescription = () => {
    setJobDescription(null);
    clearMatchState();
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      toast.error('Định dạng file không hợp lệ. Chỉ hỗ trợ PDF, DOCX, JPG, JPEG, PNG.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File vượt quá 10MB.');
      return;
    }

    setSelectedFile(file);
    clearMatchState();
  };

  const handleUploadResume = async () => {
    if (!selectedFile) {
      toast.error('Vui lòng chọn file CV.');
      return;
    }

    setIsUploadingResume(true);
    clearMatchState();

    try {
      const uploadedResume = await cvMatchService.uploadResume(selectedFile, cvTitle);
      const parsedResume = isResumeParsed(uploadedResume.parseStatus)
        ? uploadedResume
        : await waitForResumeParsed(uploadedResume.resumeId);

      setSelectedResumeId(parsedResume.resumeId);
      await loadResumes();
      toast.success('Upload và phân tích CV thành công.');
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleCreateJobDescription = async () => {
    if (jdTitle.trim().length < 3 || companyName.trim().length < 2 || !location.trim() || jdRawText.trim().length < 50) {
      toast.error('Vui lòng nhập đầy đủ thông tin JD (nội dung tối thiểu 50 ký tự).');
      return;
    }

    setIsCreatingJd(true);
    clearMatchState();

    try {
      const createdJobDescription = await cvMatchService.createJobDescription({
        title: jdTitle.trim(),
        companyName: companyName.trim(),
        location: location.trim(),
        rawText: jdRawText.trim(),
      });

      setJobDescription(createdJobDescription);
      toast.success('Tạo JD thành công.');
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsCreatingJd(false);
    }
  };

  const handleStartMatch = async () => {
    if (!selectedResume?.resumeId || !jobDescription) {
      toast.error('Vui lòng chọn 1 CV và tạo JD trước khi so khớp.');
      return;
    }

    setIsStartingMatch(true);
    clearMatchState();

    try {
      const matchResponse = await cvMatchService.startSingleMatch(selectedResume.resumeId, jobDescription.id);
      const matchSession = getSessionFromStartResponse(matchResponse);

      if (!matchSession?.sessionId) {
        toast.error('Không nhận được phiên so khớp từ hệ thống.');
        return;
      }

      activeSessionIdRef.current = matchSession.sessionId;
      setCurrentSessionId(matchSession.sessionId);
      setSessionDetail(matchSession);

      if (isFinalMatchStatus(matchSession.status)) {
        if (getNormalizedStatus(matchSession.status) === 'completed') {
          setLastNotifiedStatus(getNormalizedStatus(matchSession.status));
          notifyFinalStatus(getNormalizedStatus(matchSession.status));
        }
        setCurrentSessionId(null);
        return;
      }

      const initialDetail = await cvMatchService.getMatchSessionDetail(matchSession.sessionId);
      setSessionDetail(initialDetail);

      if (isFinalMatchStatus(initialDetail.status)) {
        setCurrentSessionId(null);
        const status = getNormalizedStatus(initialDetail.status);
        setLastNotifiedStatus(status);
        notifyFinalStatus(status);
        return;
      }

      startPolling();
      toast.info('Đang phân tích mức độ phù hợp...');
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsStartingMatch(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <AppPageHeader
        title="CV + JD Matching"
        subtitle="Upload CV, tạo JD và so khớp để nhận điểm phù hợp cùng gợi ý cải thiện."
        icon={FileText}
        iconGradient="from-blue-500 to-cyan-500"
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Label>Chọn CV</Label>
            {selectedResume && (
              <Badge className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                <CheckCircle2 className="mr-1" size={14} />
                Đã upload
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">Danh sách CV từ hệ thống</p>
              <Button variant="outline" size="sm" onClick={loadResumes} disabled={isLoadingResumes || isPolling}>
                Tải lại
              </Button>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {isLoadingResumes && <p className="text-sm text-gray-500">Đang tải danh sách CV...</p>}
              {!isLoadingResumes && resumes.length === 0 && <p className="text-sm text-gray-500">Chưa có CV nào.</p>}
              {resumes.map((item) => (
                <label
                  key={item.resumeId}
                  className="flex items-start gap-3 rounded-md border p-3 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="selected-resume-single"
                    checked={selectedResumeId === item.resumeId}
                    onChange={() => {
                      setSelectedResumeId(item.resumeId);
                      clearMatchState();
                    }}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-medium">{item.title || item.originalFileName}</p>
                    <p className="text-xs text-gray-600">{item.originalFileName}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Input value={cvTitle} onChange={(event) => setCvTitle(event.target.value)} placeholder="Tiêu đề CV (tùy chọn)" />
          <Input type="file" onChange={onFileChange} />
          <p className="text-xs text-gray-500">Hỗ trợ: .pdf, .docx, .jpg, .jpeg, .png | Tối đa 10MB</p>

          {selectedResume && (
            <div className="rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 p-3 text-sm text-green-800 dark:text-green-300">
              {selectedResume.title} ({selectedResume.originalFileName})
            </div>
          )}

          <Button onClick={handleUploadResume} disabled={!selectedFile || isUploadingResume || isPolling}>
            <Upload className="mr-2" size={16} />
            {isUploadingResume ? 'Đang upload và phân tích CV...' : 'Upload CV'}
          </Button>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Label>Job Description</Label>
            {jobDescription && (
              <Badge className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                <CheckCircle2 className="mr-1" size={14} />
                Đã tạo JD
              </Badge>
            )}
          </div>

          <Input
            value={jdTitle}
            onChange={(event) => {
              setJdTitle(event.target.value);
              resetJobDescription();
            }}
            placeholder="Ví dụ: Senior Backend Engineer"
          />

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              value={companyName}
              onChange={(event) => {
                setCompanyName(event.target.value);
                resetJobDescription();
              }}
              placeholder="Công ty"
            />
            <Input
              value={location}
              onChange={(event) => {
                setLocation(event.target.value);
                resetJobDescription();
              }}
              placeholder="Địa điểm"
            />
          </div>

          <Textarea
            value={jdRawText}
            onChange={(event) => {
              setJdRawText(event.target.value);
              resetJobDescription();
            }}
            wrap="soft"
            className="min-h-[180px] max-h-[420px] resize-y overflow-y-auto overflow-x-hidden break-words"
            placeholder="Nội dung JD (tối thiểu 50 ký tự)..."
          />

          {jobDescription && (
            <div className="rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 p-3 text-sm text-green-800 dark:text-green-300">
              {jobDescription.title} - {jobDescription.companyName}
            </div>
          )}

          <Button onClick={handleCreateJobDescription} disabled={isCreatingJd || isPolling}>
            <BriefcaseBusiness className="mr-2" size={16} />
            {isCreatingJd ? 'Đang tạo JD...' : 'Tạo JD'}
          </Button>
        </Card>
      </div>

      <Card className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold">So khớp CV và JD</p>
          <p className="text-sm text-gray-500">Chọn một CV và tạo JD để bắt đầu so khớp</p>
        </div>
        <Button onClick={handleStartMatch} disabled={!canStartMatch || isStartingMatch || isPolling}>
          <Link2 className="mr-2" size={16} />
          {isStartingMatch || isPolling ? 'Đang so khớp...' : 'So khớp'}
        </Button>
      </Card>

      {(isPolling || (sessionDetail && !isFinalMatchStatus(sessionDetail.status))) && (
        <Card className="p-4 flex items-center gap-2">
          <Sparkles size={16} className="text-blue-600 dark:text-blue-400" />
          <span className="text-sm">Đang phân tích mức độ phù hợp...</span>
          <Badge variant="outline">{sessionDetail?.status ?? 'Processing'}</Badge>
        </Card>
      )}

      {getNormalizedStatus(sessionDetail?.status) === 'failed' && sessionDetail && (
        <Card className="p-4 flex items-start gap-2 border-red-300">
          <AlertCircle size={16} className="text-red-500 mt-0.5" />
          <div>
            <p className="font-medium text-red-700 dark:text-red-400">Phiên so khớp thất bại</p>
            <p className="text-sm text-red-600 dark:text-red-400">{sessionDetail.errorMessage ?? 'Vui lòng thử lại.'}</p>
          </div>
        </Card>
      )}

      {['completed', 'partially_completed'].includes(getNormalizedStatus(sessionDetail?.status)) && primaryMatch && (
        <div className="space-y-4">
          <Card className="p-6">
            <p className="text-sm text-gray-500">Điểm tổng</p>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{totalScore.toFixed(2)}%</p>
            <p className="mt-2 text-sm text-gray-700">{primaryMatch.summaryText || 'Không có tóm tắt.'}</p>
            {selectedResume && (
              <p className="mt-3 text-xs text-gray-500">
                CV: {selectedResume.title} ({selectedResume.originalFileName})
              </p>
            )}
          </Card>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-4">
              <p className="text-xs text-gray-500">Trạng thái session</p>
              <p className="text-lg font-semibold">{sessionDetail?.status ?? 'Unknown'}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500">Resume ID</p>
              <p className="text-sm font-medium break-all">{sessionDetail?.resumeId ?? 'N/A'}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500">Resume Version</p>
              <p className="text-sm font-medium break-all">{sessionDetail?.resumeVersionId ?? 'N/A'}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500">Target count</p>
              <p className="text-2xl font-semibold">{sessionDetail?.targetCount ?? 0}</p>
            </Card>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-4">
              <p className="text-xs text-gray-500">Hoàn thành</p>
              <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{sessionDetail?.completedCount ?? 0}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500">Thất bại</p>
              <p className="text-2xl font-semibold text-red-600 dark:text-red-400">{sessionDetail?.failedCount ?? 0}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500">Điểm cao nhất</p>
              <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{(sessionDetail?.bestScore ?? 0).toFixed(2)}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500">Điểm trung bình</p>
              <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{(sessionDetail?.averageScore ?? 0).toFixed(2)}%</p>
            </Card>
          </div>

          {scoreBreakdown.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {scoreBreakdown.map((item) => (
                <Card key={item.label} className="p-4">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-2xl font-semibold">{item.value.toFixed(0)}%</p>
                </Card>
              ))}
            </div>
          )}

          <Card className="p-6 space-y-3">
            <p className="font-semibold">Điểm mạnh</p>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {strengths.length === 0 && <li>Không có dữ liệu</li>}
              {strengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <p className="font-semibold pt-2">Điểm yếu</p>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {weaknesses.length === 0 && <li>Không có dữ liệu</li>}
              {weaknesses.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>

          <Card className="p-6 space-y-3">
            <p className="font-semibold">Kỹ năng phù hợp</p>
            <div className="flex flex-wrap gap-2">
              {matchedSkills.length === 0 && <p className="text-sm text-gray-500">Không có dữ liệu</p>}
              {matchedSkills.map((skill) => (
                <Badge key={skill} className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                  {skill}
                </Badge>
              ))}
            </div>

            <p className="font-semibold pt-2">Kỹ năng còn thiếu</p>
            <div className="flex flex-wrap gap-2">
              {missingSkills.length === 0 && <p className="text-sm text-gray-500">Không có dữ liệu</p>}
              {missingSkills.map((skill) => (
                <Badge key={skill} className="bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300">
                  {skill}
                </Badge>
              ))}
            </div>

            <p className="font-semibold pt-2">Gợi ý cải thiện</p>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {suggestions.length === 0 && <li>Không có dữ liệu</li>}
              {suggestions.map((suggestion) => (
                <li key={suggestion}>{suggestion}</li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
};





