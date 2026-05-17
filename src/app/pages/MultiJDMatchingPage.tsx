import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { CheckCircle, Loader2, Target } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { AppPageHeader } from '../components/design-system/AppPageHeader';
import * as resumeService from '../../services/resumeService';
import * as jobDescriptionService from '../../services/jobDescriptionService';
import * as matchingService from '../../services/matchingService';
import { createApiError } from '../../lib/api/apiError';
import { safeParseJsonArray } from '../../lib/parsers/jsonSafeParse';
import { getPhase3UserMessage } from '../../lib/api/phase3Errors';

const FINAL_STATUSES = ['completed', 'failed', 'cancelled'];

function statusLabel(status?: string | null): string {
  switch (String(status ?? '').trim().toLowerCase()) {
    case 'pending': return 'Đang chờ xử lý';
    case 'processing': return 'Đang matching';
    case 'completed': return 'Hoàn tất';
    case 'failed': return 'Thất bại';
    case 'cancelled': return 'Đã hủy';
    default: return status ?? 'Chưa xác định';
  }
}

function normalizeList<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  return [];
}

export const MultiJDMatchingPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState<resumeService.ResumeSummary[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<jobDescriptionService.JobDescriptionSummary[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [session, setSession] = useState<matchingService.MatchSessionDetail | null>(null);
  const [sessionId, setSessionId] = useState('');

  const selectedResume = useMemo(() => resumes.find((item) => (item as any).resumeId === selectedResumeId || item.id === selectedResumeId) ?? null, [resumes, selectedResumeId]);

  const load = async () => {
    setLoading(true);
    try {
      const [resumeListRaw, jdListRaw] = await Promise.all([
        resumeService.safeGetResumes(),
        jobDescriptionService.safeGetJobDescriptions(),
      ]);
      const resumeList = normalizeList<resumeService.ResumeSummary>(resumeListRaw);
      const jdList = normalizeList<jobDescriptionService.JobDescriptionSummary>(jdListRaw);
      setResumes(resumeList);
      setJobDescriptions(jdList);
      setSelectedResumeId((prev) => prev || ((resumeList.find((item) => item.isActive) as any)?.resumeId || resumeList.find((item) => item.isActive)?.id || (resumeList[0] as any)?.resumeId || resumeList[0]?.id || ''));
    } catch (err) {
      toast.error(getPhase3UserMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    if (!sessionId) return;
    let mounted = true;
    const timer = window.setInterval(async () => {
      try {
        const detail = await matchingService.getMatchSessionDetail(sessionId);
        if (!mounted) return;
        setSession(detail);
        if (FINAL_STATUSES.includes(String(detail.status ?? '').toLowerCase())) {
          window.clearInterval(timer);
        }
      } catch (err) {
        window.clearInterval(timer);
        toast.error(createApiError(err).getUserMessage());
      }
    }, 4000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [sessionId]);

  const toggleJob = (id: string) => {
    setSelectedJobIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleMatch = async () => {
    if (!selectedResumeId || selectedJobIds.length === 0) {
      toast.error('Vui lòng chọn CV và ít nhất một JD trước khi so khớp.');
      return;
    }

    try {
      const detail = await matchingService.createMultiMatch({
        resumeId: selectedResumeId,
        jobDescriptionIds: selectedJobIds,
      });
      const createdSessionId = (detail as { sessionId?: string; id?: string }).sessionId || (detail as { sessionId?: string; id?: string }).id || '';
      setSessionId(createdSessionId);
      setSession(detail);
      if (createdSessionId) {
        window.localStorage.setItem('interviet:lastMatchSessionId', createdSessionId);
        navigate(`/matches/${createdSessionId}`);
      }
    } catch (err) {
      const apiError = createApiError(err);
      if (apiError.status === 403 && apiError.code === 'Quota.Exceeded') {
        toast.error('Bạn đã dùng hết lượt trong gói hiện tại.');
        navigate('/goi-dich-vu');
        return;
      }
      toast.error(getPhase3UserMessage(err));
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <AppPageHeader title="Đối sánh nhiều mô tả công việc" subtitle="Chọn CV và nhiều mô tả công việc để tạo phiên đối sánh" icon={Target} iconGradient="from-emerald-500 to-teal-600" />
      <Card className="p-6">
        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">CV</label>
              <select className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3" value={selectedResumeId} onChange={(e) => setSelectedResumeId(e.target.value)}>
                {resumes.map((item) => {
                  const resumeId = (item as any).resumeId || item.id;
                  return <option key={resumeId} value={resumeId}>{item.title || item.originalFileName || resumeId}{item.isActive ? ' (đang dùng)' : ''}</option>;
                })}
              </select>
            </div>

            {selectedResume && <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-700"><strong>CV đã chọn:</strong> {selectedResume.title || selectedResume.originalFileName || selectedResume.id}</div>}

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="text-sm font-medium">Mô tả công việc</label>
                <span className="text-xs text-muted-foreground">Đã chọn {selectedJobIds.length} mô tả công việc</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {jobDescriptions.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground md:col-span-2">Bạn chưa có mô tả công việc nào. Hãy thêm mô tả công việc đầu tiên để đối sánh với CV.</div>
                ) : jobDescriptions.map((jd) => {
                  const selected = selectedJobIds.includes(jd.id);
                  return (
                    <button
                      key={jd.id}
                      type="button"
                      onClick={() => toggleJob(jd.id)}
                      className={`rounded-xl border p-4 text-left transition-colors ${selected ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium">{jd.title}</p>
                          <p className="text-sm text-muted-foreground">{jd.companyName || jd.location || ''}</p>
                        </div>
                        {selected && <CheckCircle className="text-emerald-600" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => void handleMatch()}>Bắt đầu đối sánh nhiều JD</Button>
              <Button variant="outline" onClick={() => navigate('/matches')}>Xem lịch sử đối sánh</Button>
            </div>

            {session && (
              <Card className="p-4">
                <p className="font-medium">Phiên: {session.id}</p>
                <p className="text-sm text-muted-foreground">Trạng thái: {statusLabel(session.status)}</p>
                <p className="text-sm text-muted-foreground">Số kết quả: {session.results?.length ?? 0}</p>
                {session.results?.length ? (
                  <div className="mt-3 space-y-2 text-sm">
                    {session.results.map((result, index) => (
                      <div key={result.id ?? index} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <span>{result.jobTitle || result.companyName || `Mô tả công việc ${index + 1}`}</span>
                          <Badge variant="secondary">{result.overallScore ?? result.totalScore ?? '-'}</Badge>
                        </div>
                        <p className="text-muted-foreground">{statusLabel(result.status)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Số kỹ năng phù hợp: {safeParseJsonArray<string>(result.matchedSkillsJson, []).length}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </Card>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
