import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppPageHeader } from '../components/design-system/AppPageHeader';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { AlertCircle, CheckCircle2, FileText, Link2, Sparkles, Target, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { ApiError } from '../../lib/api/apiError';
import {
  cvMatchService,
  type JobDescriptionItem,
  type MatchSessionDetail,
  type MatchTarget,
  type ResumeItem,
  type StartMatchResponse,
} from '../../services/cvMatchService';
import { useAsyncPolling } from '../../hooks/useAsyncPolling';
import { safeParseJson } from '../../utils/safeParseJson';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.jpg', '.jpeg', '.png'];
const RESUME_PARSE_POLL_INTERVAL_MS = 3000;
const RESUME_PARSE_TIMEOUT_MS = 180000;

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
  return ['completed', 'failed', 'cancelled'].includes(getNormalizedStatus(status));
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
  const [cvTitle, setCvTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [matchTitle, setMatchTitle] = useState('');
  const [jobDescriptions, setJobDescriptions] = useState<JobDescriptionItem[]>([]);
  const [selectedJobDescriptionIds, setSelectedJobDescriptionIds] = useState<string[]>([]);

  const [resume, setResume] = useState<ResumeItem | null>(null);
  const [sessionDetail, setSessionDetail] = useState<MatchSessionDetail | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);

  const [isLoadingJds, setIsLoadingJds] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isStartingMatch, setIsStartingMatch] = useState(false);

  const fetchMatchSession = useCallback(async () => {
    if (!activeSessionIdRef.current) throw new Error('Missing session id');
    return cvMatchService.getMatchSessionDetail(activeSessionIdRef.current);
  }, []);

  const { isPolling, startPolling, stopPolling } = useAsyncPolling<MatchSessionDetail>({
    fetchFn: fetchMatchSession,
    getStatusFn: (data) => data.status,
    onSuccess: (data) => {
      setSessionDetail(data);
      toast.success('Phân tích đa JD hoàn tất.');
    },
    onFailure: (error) => {
      const message = error instanceof Error ? error.message : 'Có lỗi khi polling kết quả.';
      toast.error(message);
    },
  });

  const selectedJdCount = selectedJobDescriptionIds.length;
  const canStartMatch = Boolean(resume?.resumeId && selectedJdCount > 0);

  const sortedTargets = useMemo(() => {
    const targets = sessionDetail?.targets ?? [];
    return [...targets].sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0));
  }, [sessionDetail]);

  const avgScore = useMemo(() => {
    if (sortedTargets.length === 0) return 0;
    const total = sortedTargets.reduce((sum, item) => sum + (item.totalScore ?? 0), 0);
    return total / sortedTargets.length;
  }, [sortedTargets]);

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
    activeSessionIdRef.current = null;
  };

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
    void loadJobDescriptions();
  }, [loadJobDescriptions]);

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
    setResume(null);
    clearMatchState();
  };

  const toggleJobDescription = (id: string) => {
    clearMatchState();
    setSelectedJobDescriptionIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleUploadResume = async () => {
    if (!selectedFile) {
      toast.error('Vui lòng chọn file CV.');
      return;
    }

    setIsUploadingResume(true);
    setResume(null);
    clearMatchState();

    try {
      const uploadedResume = await cvMatchService.uploadResume(selectedFile, cvTitle);
      const parsedResume = isResumeParsed(uploadedResume.parseStatus)
        ? uploadedResume
        : await waitForResumeParsed(uploadedResume.resumeId);

      setResume(parsedResume);
      toast.success('Upload và phân tích CV thành công.');
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleStartMultiMatch = async () => {
    if (!resume?.resumeId || selectedJobDescriptionIds.length === 0) {
      toast.error('Vui lòng upload CV và chọn ít nhất 1 JD trước khi so khớp.');
      return;
    }

    setIsStartingMatch(true);
    clearMatchState();

    try {
      const response = await cvMatchService.startMultiMatch({
        resumeId: resume.resumeId,
        jobDescriptionIds: selectedJobDescriptionIds,
        title: matchTitle.trim() || `Multi JD Match - ${new Date().toLocaleString('vi-VN')}`,
      });
      const matchSession = getSessionFromStartResponse(response);

      if (!matchSession?.sessionId) {
        toast.error('Không nhận được phiên so khớp từ hệ thống.');
        return;
      }

      activeSessionIdRef.current = matchSession.sessionId;
      setSessionDetail(matchSession);

      if (isFinalMatchStatus(matchSession.status)) {
        if (getNormalizedStatus(matchSession.status) === 'completed') {
          toast.success('Phân tích đa JD hoàn tất.');
        }
        return;
      }

      const initialDetail = await cvMatchService.getMatchSessionDetail(matchSession.sessionId);
      setSessionDetail(initialDetail);

      if (isFinalMatchStatus(initialDetail.status)) {
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
    const jd = jobDescriptions.find((item) => item.id === target.jobDescriptionId);

    return (
      <Card key={target.targetId} className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">{target.jobTitle || jd?.title || 'Không rõ tiêu đề JD'}</p>
            <p className="text-sm text-gray-500">{target.companyName || jd?.companyName || 'Không rõ công ty'}</p>
          </div>
          <Badge className="bg-blue-100 text-blue-800">{(target.totalScore ?? 0).toFixed(2)}%</Badge>
        </div>

        {target.summaryText && <p className="text-sm text-gray-700">{target.summaryText}</p>}

        <div className="space-y-2">
          <p className="text-sm font-medium">Kỹ năng phù hợp</p>
          <div className="flex flex-wrap gap-2">
            {matchedSkills.length === 0 && <p className="text-sm text-gray-500">Không có dữ liệu</p>}
            {matchedSkills.map((skill) => (
              <Badge key={skill} className="bg-green-100 text-green-800">
                {skill}
              </Badge>
            ))}
          </div>

          <p className="text-sm font-medium pt-1">Kỹ năng còn thiếu</p>
          <div className="flex flex-wrap gap-2">
            {missingSkills.length === 0 && <p className="text-sm text-gray-500">Không có dữ liệu</p>}
            {missingSkills.map((skill) => (
              <Badge key={skill} className="bg-orange-100 text-orange-800">
                {skill}
              </Badge>
            ))}
          </div>
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
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Label>Upload CV</Label>
            {resume && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="mr-1" size={14} />
                Đã upload
              </Badge>
            )}
          </div>

          <Input value={cvTitle} onChange={(event) => setCvTitle(event.target.value)} placeholder="Tiêu đề CV (tùy chọn)" />
          <Input type="file" onChange={onFileChange} />
          <p className="text-xs text-gray-500">Hỗ trợ: .pdf, .docx, .jpg, .jpeg, .png | Tối đa 10MB</p>

          {resume && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              {resume.title} ({resume.originalFileName})
            </div>
          )}

          <Button onClick={handleUploadResume} disabled={!selectedFile || isUploadingResume || isPolling}>
            <Upload className="mr-2" size={16} />
            {isUploadingResume ? 'Đang upload và phân tích CV...' : 'Upload CV'}
          </Button>
        </Card>

        <Card className="p-6 space-y-4">
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

          <p className="text-sm text-gray-600">
            Đã chọn <span className="font-semibold">{selectedJdCount}</span> JD
          </p>

          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {isLoadingJds && <p className="text-sm text-gray-500">Đang tải danh sách JD...</p>}
            {!isLoadingJds && jobDescriptions.length === 0 && (
              <p className="text-sm text-gray-500">Không có JD nào trong hệ thống.</p>
            )}

            {jobDescriptions.map((jd) => (
              <label key={jd.id} className="flex items-start gap-3 rounded-md border p-3 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedJobDescriptionIds.includes(jd.id)}
                  onChange={() => toggleJobDescription(jd.id)}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium">{jd.title}</p>
                  <p className="text-xs text-gray-600">
                    {jd.companyName} • {jd.location}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold">Bắt đầu so khớp đa JD</p>
          <p className="text-sm text-gray-500">Cần upload CV và chọn ít nhất 1 JD trước khi gọi API matching.</p>
        </div>
        <Button onClick={handleStartMultiMatch} disabled={!canStartMatch || isStartingMatch || isPolling}>
          <Link2 className="mr-2" size={16} />
          {isStartingMatch || isPolling ? 'Đang so khớp...' : 'So khớp nhiều JD'}
        </Button>
      </Card>

      {(isPolling || (sessionDetail && !isFinalMatchStatus(sessionDetail.status))) && (
        <Card className="p-4 flex items-center gap-2">
          <Sparkles size={16} className="text-blue-600" />
          <span className="text-sm">Đang phân tích mức độ phù hợp...</span>
          <Badge variant="outline">{sessionDetail?.status ?? 'Processing'}</Badge>
        </Card>
      )}

      {getNormalizedStatus(sessionDetail?.status) === 'failed' && sessionDetail && (
        <Card className="p-4 flex items-start gap-2 border-red-300">
          <AlertCircle size={16} className="text-red-500 mt-0.5" />
          <div>
            <p className="font-medium text-red-700">Phiên so khớp thất bại</p>
            <p className="text-sm text-red-600">{sessionDetail.errorMessage ?? 'Vui lòng thử lại.'}</p>
          </div>
        </Card>
      )}

      {getNormalizedStatus(sessionDetail?.status) === 'completed' && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <Card className="p-4">
              <p className="text-xs text-gray-500">Số JD đã so khớp</p>
              <p className="text-2xl font-semibold">{sortedTargets.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500">Điểm trung bình</p>
              <p className="text-2xl font-semibold text-blue-600">{avgScore.toFixed(2)}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500">Điểm cao nhất</p>
              <p className="text-2xl font-semibold text-emerald-600">{(sessionDetail.bestScore ?? 0).toFixed(2)}%</p>
            </Card>
          </div>

          {sortedTargets.length === 0 && (
            <Card className="p-6 text-sm text-gray-600">Không có target nào trong kết quả session.</Card>
          )}

          <div className="grid lg:grid-cols-2 gap-4">{sortedTargets.map(renderTargetCard)}</div>
        </div>
      )}

      {resume && (
        <Card className="p-4 text-xs text-gray-500 flex items-center gap-2">
          <FileText size={14} />
          CV hiện tại: {resume.title} ({resume.originalFileName})
        </Card>
      )}
    </div>
  );
};
