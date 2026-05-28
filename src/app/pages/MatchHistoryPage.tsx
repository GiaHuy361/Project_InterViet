import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Clock, History, Search, Target, ChevronLeft, ChevronRight, BarChart3, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { AppPageHeader } from '../components/design-system/AppPageHeader';
import { formatLocalDate } from '../../utils/formatters';
import {
  cvMatchService,
  type MatchSessionDetail,
  type MatchSessionType,
  type MatchStatus
} from '../../services/cvMatchService';

function formatMatchStatus(status?: string): { label: string; className: string } {
  if (!status) return { label: 'Unknown', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };
  const lower = status.toLowerCase();

  if (lower === 'completed') {
    return { label: 'Hoàn thành', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' };
  } else if (lower === 'processing') {
    return { label: 'Đang xử lý', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' };
  } else if (lower === 'failed') {
    return { label: 'Lỗi', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' };
  } else if (lower === 'pending') {
    return { label: 'Chờ xử lý', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' };
  } else if (lower === 'partially_completed' || lower === 'partiallycompleted') {
    return { label: 'Hoàn thành 1 phần', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' };
  }

  return { label: status, className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };
}

export const MatchHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const sessionType: MatchSessionType = 'multi';
  const [sessions, setSessions] = useState<MatchSessionDetail[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / pageSize)), [pageSize, totalCount]);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await cvMatchService.listMatchSessions({
        page,
        pageSize,
        sessionType,
      });
      setSessions(response.items ?? []);
      setTotalCount(response.totalCount ?? response.items?.length ?? 0);
      if (response.page && response.page !== page) {
        setPage(response.page);
      }
    } catch {
      setSessions([]);
      setTotalCount(0);
      setError('Không tải được danh sách lịch sử so khớp.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sessionType]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  return (
    <div className="space-y-6 pb-12">
      <AppPageHeader
        title="Lịch sử so khớp CV"
        subtitle="Xem lại danh sách các lần so khớp CV trước đây"
        icon={History}
        iconGradient="from-violet-500 to-fuchsia-500"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
            <Button variant="outline" onClick={() => void loadSessions()} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Làm mới
            </Button>
          </div>
        }
      />

      <Card className="glass-card overflow-hidden border-slate-200/80 dark:border-slate-800/80 p-6 min-h-[400px]">
        {error ? (
          <div className="flex h-40 flex-col items-center justify-center text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => void loadSessions()}>Thử lại</Button>
          </div>
        ) : loading ? (
          <div className="flex h-40 flex-col items-center justify-center text-center">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-400 mb-2" />
            <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12">
            <History className="h-16 w-16 text-slate-200 dark:text-slate-700 mb-4" />
            <h3 className="text-xl font-bold mb-2">Chưa có lịch sử</h3>
            <p className="text-slate-500 max-w-sm mb-6">Bạn chưa thực hiện bất kỳ phiên so khớp CV nào. Hãy bắt đầu ngay.</p>
            <Button onClick={() => navigate('/multi-jd-matching')}>
              So khớp CV
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const statusFormat = formatMatchStatus(session.status);

              return (
                <Card key={session.sessionId} className="p-5 border-slate-200 hover:border-violet-300 dark:border-slate-700 dark:hover:border-violet-700 transition-colors bg-white/50 dark:bg-slate-900/50">
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          So khớp CV
                          <span className="text-sm font-normal text-slate-500">#{session.sessionId.substring(0, 8)}</span>
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusFormat.className}`}>
                          {statusFormat.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {session.requestedAt ? formatLocalDate(session.requestedAt) : 'N/A'}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Target className="w-4 h-4" />
                          {session.completedCount || 0}/{session.targetCount || 0} JD
                        </div>

                        {session.bestScore !== undefined && session.bestScore !== null && (
                          <div className={`flex items-center gap-1.5 font-medium ${
                            session.bestScore < 50
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            <BarChart3 className="w-4 h-4" />
                            Điểm cao nhất: {session.bestScore}%
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={() => navigate(`/matches/${session.sessionId}`)}
                      variant="secondary"
                      className="shrink-0"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Xem kết quả
                    </Button>
                  </div>
                </Card>
              );
            })}

            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-sm text-slate-500 mb-4 sm:mb-0">
                Trang {page} / {totalPages} (Tổng {totalCount} kết quả)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                >
                  Sau <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
