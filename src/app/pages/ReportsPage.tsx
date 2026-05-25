import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { BarChart3, Trash2 } from 'lucide-react';
import {
  deleteInterview,
  getInterview,
  getInterviews,
  getStats,
  type InterviewReport,
  type InterviewSession,
  type InterviewStatsResponse,
} from '../../services/interviewService';
import { eventTracker } from '../utils/eventTracker';
import { ApiError } from '@/lib/api/apiError';
import { toast } from '../utils/notify';
import { AppPageHeader } from '../components/design-system/AppPageHeader';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ConfirmDialog } from './AppPages';

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [stats, setStats] = useState<InterviewStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const formatLabel = (value?: string) =>
    value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : '';

  const statusLabelMap: Record<string, string> = {
    completed: 'Hoàn thành',
    processing: 'Đang xử lý',
    live: 'Đang diễn ra',
    failed: 'Thất bại',
    cancelled: 'Đã hủy',
    abandoned: 'Bỏ dở',
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [list, listStats] = await Promise.all([getInterviews(), getStats()]);
        setInterviews(list);
        setStats(listStats);
        if (list.length > 0) {
          eventTracker.track('report_view');
        }
      } catch (err) {
        const apiErr = err instanceof ApiError ? err : null;
        setError(apiErr?.getUserMessage() || 'Không thể tải lịch sử báo cáo.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const handleDelete = async (interviewId: string) => {
    try {
      await deleteInterview(interviewId);
      setInterviews((prev) => prev.filter((item) => item.id !== interviewId));
      if (deleteTargetId === interviewId) {
        setDeleteTargetId(null);
      }
      toast.success('Đã xóa phiên phỏng vấn.');
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      toast.error(apiErr?.getUserMessage() || 'Không thể xóa phiên phỏng vấn.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <AppPageHeader
        title="Lịch sử báo cáo"
        subtitle="Tất cả các phiên phỏng vấn của bạn"
        icon={BarChart3}
        iconGradient="from-violet-500 to-purple-600"
        actions={
          <Button onClick={() => navigate('/phong-van-setup')}>Phỏng vấn mới</Button>
        }
      />

      {loading && <Card className="glass-card p-6">Đang tải báo cáo...</Card>}

      {error && (
        <Card className="border-red-200 bg-red-50 text-red-700 p-4">
          <div className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button variant="outline" onClick={() => navigate(0)}>
              Thử lại
            </Button>
          </div>
        </Card>
      )}

      {!loading && !error && stats && (
        <Card className="p-6">
          <h3 className="font-bold mb-4">Thống kê nhanh</h3>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span>Tổng phiên</span>
              <strong>{stats.totalSessions}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Đã hoàn thành</span>
              <strong>{stats.completedSessions}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Điểm trung bình</span>
              <strong>{stats.averageScore ?? '—'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Điểm cao nhất</span>
              <strong>{stats.bestScore ?? '—'}</strong>
            </div>
          </div>
        </Card>
      )}

      {!loading && !error && interviews.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Chưa có báo cáo nào</h3>
          <p className="text-gray-600 mb-6">Bắt đầu phỏng vấn đầu tiên của bạn</p>
          <Button onClick={() => navigate('/phong-van-setup')}>
            Bắt đầu phỏng vấn
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {interviews.map((interview) => (
            <Card key={interview.id} className="glass-card hover-lift p-6 space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={interview.status === 'completed' ? 'default' : 'secondary'}>
                      {statusLabelMap[interview.status] || interview.status}
                    </Badge>
                    <Badge variant="outline">{interview.mode.toUpperCase()}</Badge>
                    <Badge variant="secondary">{formatLabel(interview.level)}</Badge>
                    <Badge variant="secondary">{formatLabel(interview.interviewType)}</Badge>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold mb-1 truncate">{interview.position}</h3>
                    <p className="text-sm text-gray-600">
                      AI model: <span className="font-medium">{interview.aiModelRaw || interview.aiModel || 'N/A'}</span>
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 text-sm">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-gray-500">Số câu hỏi</p>
                      <p className="font-semibold text-gray-900">{interview.totalExpectedQuestions ?? 0}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-gray-500">Đã trả lời</p>
                      <p className="font-semibold text-gray-900">{interview.answeredCount ?? 0}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-gray-500">Điểm tổng</p>
                      <p className="font-semibold text-blue-600">{interview.overallScore ?? '—'}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-gray-500">Tỷ lệ hoàn thành</p>
                      <p className="font-semibold text-gray-900">
                        {interview.totalExpectedQuestions
                          ? `${Math.round(((interview.answeredCount ?? 0) / interview.totalExpectedQuestions) * 100)}%`
                          : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 text-xs text-gray-600">
                    <div className="rounded-xl border bg-white p-3">
                      <p className="text-gray-500 mb-1">Ngày tạo</p>
                      <p className="font-medium text-gray-900">{new Date(interview.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                    <div className="rounded-xl border bg-white p-3">
                      <p className="text-gray-500 mb-1">Bắt đầu</p>
                      <p className="font-medium text-gray-900">
                        {interview.startedAt ? new Date(interview.startedAt).toLocaleString('vi-VN') : 'Chưa bắt đầu'}
                      </p>
                    </div>
                    <div className="rounded-xl border bg-white p-3">
                      <p className="text-gray-500 mb-1">Hoàn tất</p>
                      <p className="font-medium text-gray-900">
                        {interview.completedAt ? new Date(interview.completedAt).toLocaleString('vi-VN') : 'Chưa hoàn tất'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row lg:flex-col items-center lg:items-end gap-3 lg:gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-3xl font-extrabold text-blue-600">{interview.overallScore ?? '—'}</div>
                    <div className="text-xs text-gray-600">điểm</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/phong-van-report/${interview.id}`)}>
                      Xem báo cáo
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTargetId(interview.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        title="Xóa phiên phỏng vấn"
        description="Bạn có chắc chắn muốn xóa phiên phỏng vấn này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
        onConfirm={() => {
          if (deleteTargetId) {
            void handleDelete(deleteTargetId);
          }
        }}
      />
    </div>
  );
};