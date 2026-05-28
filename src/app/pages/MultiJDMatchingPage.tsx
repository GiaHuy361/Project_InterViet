import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { AppPageHeader } from '../components/design-system/AppPageHeader';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { AlertCircle, CheckCircle2, FileText, Link2, Sparkles, Target, Upload, History } from 'lucide-react';
import { toast } from 'sonner';
import { ApiError } from '../../lib/api/apiError';
import { useApp } from '../contexts/AppContext';
import {
  cvMatchService,
  type JobDescriptionItem,
  type MatchSessionDetail,
  type MatchTarget,
  type ResumeItem,
  type StartMatchResponse,
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
const MULTI_JD_MATCH_POLLING_STORAGE_KEY = 'interviet.multi-jd-matching.polling-state';
type MultiJDMatchPollingSnapshot = PollingSessionSnapshot<MatchSessionDetail> & {
  cvTitle: string;
  selectedResumeId: string | null;
  matchTitle: string;
  selectedJobDescriptionIds: string[];
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

function getSessionFromStartResponse(response: StartMatchResponse): MatchSessionDetail | null {
  if ('items' in response) {
    return response.items[0] ?? null;
  }

  return {
    sessionId: response.sessionId,
    sessionType: 'Multi',
    status: response.status,
    errorCode: null,
    errorMessage: null,
    result: null,
    targets: null,
  };
}

export const MultiJDMatchingPage: React.FC = () => {
  const navigate = useNavigate();
  const hasRestoredPollingRef = useRef(false);
  const { addNotification, syncNotifications } = useApp();
  const [cvTitle, setCvTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [matchTitle, setMatchTitle] = useState('');
  const [jobDescriptions, setJobDescriptions] = useState<JobDescriptionItem[]>([]);
  const [selectedJobDescriptionIds, setSelectedJobDescriptionIds] = useState<string[]>([]);

  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = useState<MatchSessionDetail | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [lastNotifiedStatus, setLastNotifiedStatus] = useState<string | null>(null);
  const [isRestored, setIsRestored] = useState(false);
  const activeSessionIdRef = useRef<string | null>(null);
  const selectedResumeIdRef = useRef<string | null>(null);

  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  const [isLoadingJds, setIsLoadingJds] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
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
      title: 'Nhiều JD: Kết quả so khớp đã sẵn sàng',
      message: 'Phiên so khớp nhiều JD đã hoàn tất. Mở lại trang Multi JD Matching để xem chi tiết.',
      type: 'success',
      read: false,
      actionUrl: '/multi-jd-matching',
      metadata: {
        source: 'multi-jd-matching',
        status,
      },
    });
    toast.success('Phân tích đa JD hoàn tất.');
    // Sync notifications from backend so badge/inbox reflect server-side notifications
    void syncNotifications().catch(() => undefined);
  }, [addNotification]);

  const selectedResume = useMemo(
    () => resumes.find((item) => item.resumeId === selectedResumeId) ?? null,
    [resumes, selectedResumeId]
  );

  const { isPolling, startPolling, stopPolling } = useAsyncPolling<MatchSessionDetail>({
    fetchFn: fetchMatchSession,
    getStatusFn: (data) => data.status,
    intervalMs: MATCH_POLL_INTERVAL_MS,
    onSuccess: (data) => {
      setSessionDetail(data);
      setCurrentSessionId(null);

      const status = getNormalizedStatus(data.status);
      setLastNotifiedStatus(status);

      clearPollingSessionSnapshot(MULTI_JD_MATCH_POLLING_STORAGE_KEY);

      notifyFinalStatus(status);
    },
    onFailure: (error) => {
      setCurrentSessionId(null);
      clearPollingSessionSnapshot(MULTI_JD_MATCH_POLLING_STORAGE_KEY);

      const message = error instanceof Error ? error.message : 'Có lỗi khi polling kết quả.';
      toast.error(message);
    },
  });

  const selectedJdCount = selectedJobDescriptionIds.length;
  const canStartMatch = Boolean(selectedResume?.resumeId && selectedJdCount > 0);

  const sortedTargets = useMemo(() => {
    const targets = sessionDetail?.targets ?? [];
    return [...targets].sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0));
  }, [sessionDetail]);

  const avgScore = useMemo(() => {
    if (sortedTargets.length === 0) return 0;
    const total = sortedTargets.reduce((sum, item) => sum + (item.totalScore ?? 0), 0);
    return total / sortedTargets.length;
  }, [sortedTargets]);

  const totalTargets = sessionDetail?.targetCount ?? sortedTargets.length;
  const completedTargets = sessionDetail?.completedCount ?? 0;
  const failedTargets = sessionDetail?.failedCount ?? 0;

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
    clearPollingSessionSnapshot(MULTI_JD_MATCH_POLLING_STORAGE_KEY);
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

  const loadJobDescriptions = useCallback(async () => {
    setIsLoadingJds(true);
    try {
      const response = await cvMatchService.listJobDescriptions();
      setJobDescriptions(response.items ?? []);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoadingJds(false);
    }
  }, []);

  useEffect(() => {
    void loadResumes();
    void loadJobDescriptions();
  }, [loadResumes, loadJobDescriptions]);

  useEffect(() => {
    selectedResumeIdRef.current = selectedResumeId;
  }, [selectedResumeId]);

  useEffect(() => {
    if (hasRestoredPollingRef.current) return;
    hasRestoredPollingRef.current = true;

    const restorePollingState = async () => {
      const snapshot =
        readPollingSessionSnapshot<MatchSessionDetail>(
          MULTI_JD_MATCH_POLLING_STORAGE_KEY,
        ) as MultiJDMatchPollingSnapshot | null;

      if (!snapshot) {
        setIsRestored(true);
        return;
      }

      setCvTitle(snapshot.cvTitle ?? '');
      setSelectedResumeId(snapshot.selectedResumeId ?? null);
      setMatchTitle(snapshot.matchTitle ?? '');
      setSelectedJobDescriptionIds(snapshot.selectedJobDescriptionIds ?? []);
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
          activeSessionIdRef.current = snapshot.activeSessionId;

          const refreshedDetail = await cvMatchService.getMatchSessionDetail(
            snapshot.activeSessionId,
          );

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
  }, [notifyFinalStatus, startPolling, setCurrentSessionId]);

  useEffect(() => {
    if (!isRestored) return;

    writePollingSessionSnapshot(MULTI_JD_MATCH_POLLING_STORAGE_KEY, {
      activeSessionId,
      sessionDetail,
      lastNotifiedStatus,
      cvTitle,
      selectedResumeId,
      matchTitle,
      selectedJobDescriptionIds,
    });
  }, [
    activeSessionId,
    cvTitle,
    isRestored,
    lastNotifiedStatus,
    matchTitle,
    selectedJobDescriptionIds,
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
      } else {
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

  const toggleJobDescription = (id: string) => {
    setSelectedJobDescriptionIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
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

  const handleStartMultiMatch = async () => {
    if (!selectedResume?.resumeId || selectedJobDescriptionIds.length === 0) {
      toast.error('Vui lòng chọn 1 CV và chọn ít nhất 1 JD trước khi so khớp.');
      return;
    }

    setIsStartingMatch(true);
    clearMatchState();

    try {
      const response = await cvMatchService.startMultiMatch({
        resumeId: selectedResume.resumeId,
        jobDescriptionIds: selectedJobDescriptionIds,
        title: matchTitle.trim() || `Multi JD Match - ${new Date().toLocaleString('vi-VN')}`,
      });
      const matchSession = getSessionFromStartResponse(response);

      if (!matchSession?.sessionId) {
        toast.error('Không nhận được phiên so khớp từ hệ thống.');
        return;
      }

      activeSessionIdRef.current = matchSession.sessionId;
      setCurrentSessionId(matchSession.sessionId);
      setSessionDetail(matchSession);

      if (isFinalMatchStatus(matchSession.status)) {
        if (['completed', 'partially_completed'].includes(getNormalizedStatus(matchSession.status))) {
          const status = getNormalizedStatus(matchSession.status);
          setLastNotifiedStatus(status);
          notifyFinalStatus(status);
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
      toast.info('Đang phân tích mức độ phù hợp với nhiều JD...');
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsStartingMatch(false);
    }
  };

  const renderTargetCard = (target: MatchTarget) => {
    const matchedSkills = extractList(target.matchedSkillsJson);
    const missingSkills = extractList(target.missingSkillsJson);
    const strengths = extractList(target.strengthsJson);
    const weaknesses = extractList(target.weaknessesJson);
    const jd = jobDescriptions.find((item) => item.id === target.jobDescriptionId);

    return (
      <Card key={target.targetId} className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">{target.jobTitle || jd?.title || 'Không rõ tiêu đề JD'}</p>
            <p className="text-sm text-gray-500">{target.companyName || jd?.companyName || 'Không rõ công ty'}</p>
          </div>
          <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">{(target.totalScore ?? 0).toFixed(2)}%</Badge>
        </div>

        {target.summaryText && <p className="text-sm text-gray-700">{target.summaryText}</p>}

        <div className="space-y-2">
          <p className="text-sm font-medium">Kỹ năng phù hợp</p>
          <div className="flex flex-wrap gap-2">
            {matchedSkills.length === 0 && <p className="text-sm text-gray-500">Không có dữ liệu</p>}
            {matchedSkills.map((skill) => (
              <Badge key={skill} className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                {skill}
              </Badge>
            ))}
          </div>

          <p className="text-sm font-medium pt-1">Kỹ năng còn thiếu</p>
          <div className="flex flex-wrap gap-2">
            {missingSkills.length === 0 && <p className="text-sm text-gray-500">Không có dữ liệu</p>}
            {missingSkills.map((skill) => (
              <Badge key={skill} className="bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300">
                {skill}
              </Badge>
            ))}
          </div>

          <p className="text-sm font-medium pt-1">Điểm mạnh</p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {strengths.length === 0 && <li>Không có dữ liệu</li>}
            {strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <p className="text-sm font-medium pt-1">Điểm yếu</p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {weaknesses.length === 0 && <li>Không có dữ liệu</li>}
            {weaknesses.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </Card>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <AppPageHeader
        title="So khớp đa JD"
        subtitle="Upload CV một lần, chọn nhiều JD và chạy matching đồng thời."
        icon={Target}
        iconGradient="from-emerald-500 to-teal-600"
        actions={
          <Button variant="outline" onClick={() => navigate('/match-history')}>
            <History className="w-4 h-4 mr-2" />
            Xem lịch sử
          </Button>
        }
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4 dark:bg-slate-900/50 border dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <Label>Chọn CV</Label>
            {selectedResume && (
              <Badge className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                <CheckCircle2 className="mr-1" size={14} />
                Đã chọn
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">Danh sách CV từ hệ thống</p>
              <Button variant="outline" size="sm" onClick={loadResumes} disabled={isLoadingResumes || isPolling}>
                Tải lại
              </Button>
            </div>
            <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
              {isLoadingResumes && <p className="text-sm text-gray-500 dark:text-gray-400">Đang tải danh sách CV...</p>}
              {!isLoadingResumes && resumes.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có CV nào.</p>}
              {resumes.map((item) => (
                <label
                  key={item.resumeId}
                  className="flex items-start gap-3 rounded-md border dark:border-slate-700 p-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="selected-resume-multi"
                    checked={selectedResumeId === item.resumeId}
                    onChange={() => {
                      setSelectedResumeId(item.resumeId);
                      clearMatchState();
                    }}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.title || item.originalFileName}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{item.originalFileName}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Label>Upload CV mới (tùy chọn)</Label>
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

        <Card className="p-6 space-y-4 dark:bg-slate-900/50 border dark:border-slate-800">
          <div className="flex items-center justify-between">
            <Label>Chọn Job Description</Label>
            <Button variant="outline" size="sm" onClick={loadJobDescriptions} disabled={isLoadingJds || isPolling}>
              Tải lại danh sách
            </Button>
          </div>

          <Input
            value={matchTitle}
            onChange={(event) => setMatchTitle(event.target.value)}
            placeholder="Tiêu đề phiên matching (tùy chọn)"
          />

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Đã chọn <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedJdCount}</span> JD
          </p>

          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {isLoadingJds && <p className="text-sm text-gray-500 dark:text-gray-400">Đang tải danh sách JD...</p>}
            {!isLoadingJds && jobDescriptions.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Không có JD nào trong hệ thống.</p>
            )}

            {jobDescriptions.map((jd) => (
              <label key={jd.id} className="flex items-start gap-3 rounded-md border dark:border-slate-700 p-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedJobDescriptionIds.includes(jd.id)}
                  onChange={() => toggleJobDescription(jd.id)}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{jd.title}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {jd.companyName} • {jd.location}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between dark:bg-slate-900/50 border dark:border-slate-800">
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">Bắt đầu so khớp đa JD</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Cần chọn đúng 1 CV và chọn ít nhất 1 JD trước khi gọi API matching.</p>
        </div>
        <Button onClick={handleStartMultiMatch} disabled={!canStartMatch || isStartingMatch || isPolling}>
          <Link2 className="mr-2" size={16} />
          {isStartingMatch || isPolling ? 'Đang so khớp...' : 'So khớp nhiều JD'}
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

      {['completed', 'partially_completed'].includes(getNormalizedStatus(sessionDetail?.status)) && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <Card className="p-4">
              <p className="text-xs text-gray-500">Số JD đã so khớp</p>
              <p className="text-2xl font-semibold">{totalTargets}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500">Điểm trung bình</p>
              <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{avgScore.toFixed(2)}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500">Điểm cao nhất</p>
              <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{(sessionDetail?.bestScore ?? 0).toFixed(2)}%</p>
            </Card>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-4">
              <p className="text-xs text-gray-500">Resume ID</p>
              <p className="text-sm font-medium break-all">{sessionDetail?.resumeId ?? 'N/A'}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500">Resume Version</p>
              <p className="text-sm font-medium break-all">{sessionDetail?.resumeVersionId ?? 'N/A'}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500">Hoàn thành</p>
              <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{completedTargets}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500">Thất bại</p>
              <p className="text-2xl font-semibold text-red-600 dark:text-red-400">{failedTargets}</p>
            </Card>
          </div>

          <Card className="p-4">
            <p className="text-xs text-gray-500">Trạng thái session</p>
            <p className="text-lg font-semibold">{sessionDetail?.status ?? 'Unknown'}</p>
          </Card>

          {sortedTargets.length === 0 && (
            <Card className="p-6 text-sm text-gray-600">Không có target nào trong kết quả session.</Card>
          )}

          <div className="grid lg:grid-cols-2 gap-4">{sortedTargets.map(renderTargetCard)}</div>
        </div>
      )}

      {selectedResume && (
        <Card className="p-4 text-xs text-gray-500 flex items-center gap-2">
          <FileText size={14} />
          CV hiện tại: {selectedResume.title} ({selectedResume.originalFileName})
        </Card>
      )}
    </div>
  );
};




