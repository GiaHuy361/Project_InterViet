import React, { useCallback, useMemo, useRef, useState } from 'react';
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
import {
  cvMatchService,
  type JobDescriptionItem,
  type MatchSessionDetail,
  type ResumeItem,
  type StartSingleMatchResponse,
} from '../../services/cvMatchService';
import { useAsyncPolling } from '../../hooks/useAsyncPolling';
import { safeParseJson } from '../../utils/safeParseJson';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.jpg', '.jpeg', '.png'];

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
  const [cvTitle, setCvTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jdTitle, setJdTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [jdRawText, setJdRawText] = useState('');

  const [resume, setResume] = useState<ResumeItem | null>(null);
  const [jobDescription, setJobDescription] = useState<JobDescriptionItem | null>(null);
  const [sessionDetail, setSessionDetail] = useState<MatchSessionDetail | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);

  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isCreatingJd, setIsCreatingJd] = useState(false);
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
      toast.success('Phân tích hoàn tất.');
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
  const suggestions = useMemo(() => extractList(sessionDetail?.result?.suggestionsJson), [sessionDetail]);
  const canStartMatch = Boolean(resume?.resumeId && jobDescription?.id);

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

    toast.error('Có lỗi không xác định.');
  };

  const clearMatchState = () => {
    stopPolling();
    setSessionDetail(null);
    activeSessionIdRef.current = null;
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
    setResume(null);
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
      setResume(uploadedResume);
      toast.success('Upload CV thành công.');
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
    if (!resume || !jobDescription) {
      toast.error('Vui lòng upload CV và tạo JD trước khi so khớp.');
      return;
    }

    setIsStartingMatch(true);
    clearMatchState();

    try {
      const matchResponse = await cvMatchService.startSingleMatch(resume.resumeId, jobDescription.id);
      const matchSession = getSessionFromStartResponse(matchResponse);

      if (!matchSession?.sessionId) {
        toast.error('Không nhận được phiên so khớp từ hệ thống.');
        return;
      }

      activeSessionIdRef.current = matchSession.sessionId;
      setSessionDetail(matchSession);

      if (isFinalMatchStatus(matchSession.status)) {
        if (getNormalizedStatus(matchSession.status) === 'completed') {
          toast.success('Phân tích hoàn tất.');
        }
        return;
      }

      const initialDetail = await cvMatchService.getMatchSessionDetail(matchSession.sessionId);
      setSessionDetail(initialDetail);

      if (isFinalMatchStatus(initialDetail.status)) {
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
            {isUploadingResume ? 'Đang upload CV...' : 'Upload CV'}
          </Button>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Label>Job Description</Label>
            {jobDescription && (
              <Badge className="bg-green-100 text-green-800">
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
            className="min-h-[180px] max-h-[420px] resize-y overflow-y-auto overflow-x-hidden break-words [overflow-wrap:anywhere]"
            placeholder="Nội dung JD (tối thiểu 50 ký tự)..."
          />

          {jobDescription && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
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
          <p className="text-sm text-gray-500">Cần upload CV và tạo JD thành công trước khi gọi API matching.</p>
        </div>
        <Button onClick={handleStartMatch} disabled={!canStartMatch || isStartingMatch || isPolling}>
          <Link2 className="mr-2" size={16} />
          {isStartingMatch || isPolling ? 'Đang so khớp...' : 'So khớp'}
        </Button>
      </Card>

      {(isPolling || (sessionDetail && !isFinalMatchStatus(sessionDetail.status))) && (
        <Card className="p-4 flex items-center gap-2">
          <Sparkles size={16} className="text-blue-600" />
          <span className="text-sm">Đang phân tích mức độ phù hợp...</span>
          <Badge variant="outline">{sessionDetail?.status ?? 'Processing'}</Badge>
        </Card>
      )}

      {getNormalizedStatus(sessionDetail?.status) === 'failed' && (
        <Card className="p-4 flex items-start gap-2 border-red-300">
          <AlertCircle size={16} className="text-red-500 mt-0.5" />
          <div>
            <p className="font-medium text-red-700">Phiên so khớp thất bại</p>
            <p className="text-sm text-red-600">{sessionDetail.errorMessage ?? 'Vui lòng thử lại.'}</p>
          </div>
        </Card>
      )}

      {getNormalizedStatus(sessionDetail?.status) === 'completed' && primaryMatch && (
        <div className="space-y-4">
          <Card className="p-6">
            <p className="text-sm text-gray-500">Điểm tổng</p>
            <p className="text-4xl font-bold text-blue-600">{totalScore.toFixed(2)}%</p>
            <p className="mt-2 text-sm text-gray-700">{primaryMatch.summaryText || 'Không có tóm tắt.'}</p>
            {resume && <p className="mt-3 text-xs text-gray-500">CV: {resume.title} ({resume.originalFileName})</p>}
          </Card>

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
            <p className="font-semibold">Kỹ năng phù hợp</p>
            <div className="flex flex-wrap gap-2">
              {matchedSkills.length === 0 && <p className="text-sm text-gray-500">Không có dữ liệu</p>}
              {matchedSkills.map((skill) => (
                <Badge key={skill} className="bg-green-100 text-green-800">
                  {skill}
                </Badge>
              ))}
            </div>

            <p className="font-semibold pt-2">Kỹ năng còn thiếu</p>
            <div className="flex flex-wrap gap-2">
              {missingSkills.length === 0 && <p className="text-sm text-gray-500">Không có dữ liệu</p>}
              {missingSkills.map((skill) => (
                <Badge key={skill} className="bg-orange-100 text-orange-800">
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
