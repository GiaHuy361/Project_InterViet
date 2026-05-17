import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { AppPageHeader } from '../components/design-system/AppPageHeader';
import { Target } from 'lucide-react';
import { PageState } from '../components/phase2/PageState';
import * as matchingService from '../../services/matchingService';
import { safeParseJsonArray } from '../../lib/parsers/jsonSafeParse';
import { getPhase3UserMessage } from '../../lib/api/phase3Errors';
import { createApiError } from '../../lib/api/apiError';

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

export const MatchSessionsPage: React.FC = () => {
  const { sessionId } = useParams();
  const [sessions, setSessions] = useState<matchingService.MatchSessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<matchingService.MatchSessionDetail | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const list = await matchingService.safeGetMatchSessions();
      setSessions(list);
      const persistedSessionId = window.localStorage.getItem('interviet:lastMatchSessionId');
      const activeSessionId = sessionId || persistedSessionId || list[0]?.sessionId;
      if (activeSessionId) {
        const nextDetail = await matchingService.getMatchSessionDetail(activeSessionId);
        setDetail(nextDetail);
        setSelectedSessionId(activeSessionId);
        window.localStorage.setItem('interviet:lastMatchSessionId', activeSessionId);
      }
    } catch (err) {
      toast.error(getPhase3UserMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [sessionId]);

  useEffect(() => {
    if (detail?.sessionId) {
      window.localStorage.setItem('interviet:lastMatchSessionId', detail.sessionId);
    }
  }, [detail?.sessionId]);

  useEffect(() => {
    if (selectedSessionId) {
      window.localStorage.setItem('interviet:lastMatchSessionId', selectedSessionId);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    if (!detail?.sessionId) return;
    const status = String(detail.status ?? '').trim().toLowerCase();
    if (!['pending', 'processing'].includes(status)) return;
    const timer = window.setInterval(async () => {
      try {
        const latest = await matchingService.getMatchSessionDetail(detail.sessionId);
        setDetail(latest);
        if (['completed', 'failed', 'cancelled'].includes(String(latest.status ?? '').trim().toLowerCase())) {
          window.clearInterval(timer);
        }
      } catch (err) {
        window.clearInterval(timer);
        toast.error(createApiError(err).getUserMessage());
      }
    }, 4000);
    return () => window.clearInterval(timer);
  }, [detail?.sessionId, detail?.status]);

  const results = detail?.targets ?? [];

  return (
    <div className="space-y-6 pb-12">
      <AppPageHeader
        title="Match Sessions"
        subtitle="Danh sách phiên matching và kết quả"
        icon={Target}
        iconGradient="from-emerald-500 to-teal-600"
      />

      {detail && (
        <Card className="overflow-hidden border-slate-200/80 bg-white/90 p-0 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="border-b border-slate-200/80 bg-gradient-to-r from-sky-50 via-white to-violet-50 px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-900">Session detail</h2>
            <p className="text-sm text-slate-500">Chi tiết phiên đang chọn</p>
          </div>
          <div className="space-y-4 p-6 text-sm text-slate-600">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Trạng thái</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{statusLabel(detail.status)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Session</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{detail.sessionType || '-'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Best score</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{detail.bestScore ?? '-'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Average score</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{detail.averageScore ?? '-'}</p>
              </div>
            </div>
            <p className="text-sm text-slate-500">Progress: {detail.completedCount ?? 0}/{detail.targetCount ?? 0}</p>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={result.targetId ?? result.jobDescriptionId ?? index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{result.jobTitle || result.companyName || `Target ${index + 1}`}</p>
                      <p className="text-sm text-slate-500">{result.status ? statusLabel(result.status) : 'Chưa có trạng thái'}</p>
                    </div>
                    <Badge variant="secondary">{result.totalScore ?? '-'}</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <div><strong>Matched:</strong> {safeParseJsonArray<string>(result.matchedSkillsJson, []).join(', ') || '-'}</div>
                    <div><strong>Missing:</strong> {safeParseJsonArray<string>(result.missingSkillsJson, []).join(', ') || '-'}</div>
                    <div className="md:col-span-2"><strong>Recommendations:</strong> {safeParseJsonArray<string>(result.suggestionsJson, []).join(', ') || '-'}</div>
                  </div>
                  {result.summaryText && <p className="mt-3 text-sm text-slate-600">{result.summaryText}</p>}
                  {result.completedAt && <p className="mt-2 text-xs text-slate-500">Completed at: {result.completedAt}</p>}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
