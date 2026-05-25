import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useApp } from '../contexts/AppContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { eventTracker } from '../utils/eventTracker';
import { getFeedback } from '../components/FeedbackModal';
import { ContactSupportModal } from '../components/ContactSupportModal';
import { DowngradeConfirmModal } from '../components/DowngradeConfirmModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Download, ArrowLeft, Share2, Target,
  Bell, Mail, Activity, Trash2, AlertCircle, CheckCircle,
  FileText, BarChart3, MessageSquare, HelpCircle, Check, X, Sparkles
} from 'lucide-react';
import { Progress } from '../components/ui/progress';
import { 
  CANDIDATE_PLANS, 
  getPlanQuota, 
  getPlanActionType, 
  getPlanCTAText, 
  getPlanCTAVariant,
  type PlanActionType 
} from '../config/pricing';
import { toast } from 'sonner';
import { AppPageHeader } from '../components/design-system/AppPageHeader';
import { ApiError } from '../../lib/api/apiError';
import {
  deleteInterview,
  getInterview,
  getInterviews,
  getStats,
  type InterviewReport,
  type InterviewSession,
  type InterviewStatsResponse,
} from '../../services/interviewService';

interface InvoiceItem {
  id: string;
  date: string;
  amount: number;
  status: string;
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmVariant?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Hủy',
  onOpenChange,
  onConfirm,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600"
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// CV History Page
export const CVHistoryPage: React.FC = () => {
  const { state } = useApp();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-12">
      <AppPageHeader
        title="Lịch sử CV"
        subtitle="Tất cả các phiên bản CV đã tối ưu"
        icon={FileText}
        iconGradient="from-blue-500 to-cyan-500"
        actions={
          <Button onClick={() => navigate('/cv-matching')}>Tối ưu CV mới</Button>
        }
      />

      {state.cvVersions.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Chưa có CV nào</h3>
          <p className="text-gray-600 mb-6">Bắt đầu tối ưu CV đầu tiên của bạn</p>
          <Button onClick={() => navigate('/cv-matching')}>
            Tối ưu CV ngay
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {state.cvVersions.map(cv => (
            <Card key={cv.id} className="glass-card hover-lift p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-bold mb-1">{cv.name}</h3>
                  <p className="text-sm text-gray-600">
                    {cv.createdAt.toLocaleDateString('vi-VN')} • {cv.createdAt.toLocaleTimeString('vi-VN')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold">{cv.score}%</div>
                    <div className="text-xs text-gray-600">Matching</div>
                  </div>
                  <Button variant="outline" size="sm">
                    Xem chi tiết
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Interview Report Page
export const InterviewReportPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteInterview = async () => {
    if (!id) return;

    try {
      await deleteInterview(id);
      toast.success('Đã xóa phiên phỏng vấn.');
      navigate('/bao-cao');
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      toast.error(apiErr?.getUserMessage() || 'Không thể xóa phiên phỏng vấn.');
    }
  };

  useEffect(() => {
    if (!id) {
      navigate('/bao-cao');
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const detail = await getInterview(id);
        setSession(detail);
        setReport(detail.report || null);
      } catch (err) {
        const apiErr = err instanceof ApiError ? err : null;
        setError(apiErr?.getUserMessage() || 'Không thể tải báo cáo.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id, navigate]);

  const overallScore = report?.overallScore ?? null;
  const normalizedScore =
    overallScore == null ? null : overallScore > 10 ? overallScore / 10 : overallScore;
  const scoreLabel =
    normalizedScore == null
      ? 'Chưa có dữ liệu'
      : normalizedScore >= 8
        ? 'Xuất sắc'
        : normalizedScore >= 7
          ? 'Tốt'
          : 'Cần cải thiện';

  return (
    <div className="space-y-6 pb-12">
      <AppPageHeader
        title="Báo cáo phỏng vấn"
        subtitle={session ? `${session.position} — ${session.interviewType}` : 'Đang tải'}
        icon={BarChart3}
        iconGradient="from-violet-500 to-purple-600"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="hover-lift" onClick={() => navigate('/bao-cao')}>
              <ArrowLeft className="mr-2" size={16} />
              Quay lại danh sách báo cáo
            </Button>
            {id && (
              <Button variant="outline" className="hover-lift text-red-600 hover:text-red-700" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="mr-2" size={16} />
                Xóa
              </Button>
            )}
            {id && (
              <Button variant="outline" className="hover-lift" onClick={() => navigate(`/phong-van-chi-tiet/${id}`)}>
                <Share2 className="mr-2" size={16} />
                Chi tiết
              </Button>
            )}
          </div>
        }
      />

      {loading && <Card className="glass-card p-6">Đang tải báo cáo...</Card>}

      {error && (
        <Card className="border-red-200 bg-red-50 text-red-700 p-4">
          <div className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button variant="outline" onClick={() => id && navigate(0)}>
              Thử lại
            </Button>
          </div>
        </Card>
      )}

      {!loading && !error && !report && (
        <Card className="glass-card p-6">
          <p className="text-gray-700">Báo cáo chưa sẵn sàng. Vui lòng thử lại sau.</p>
          <div className="mt-4 flex gap-3">
            <Button variant="outline" onClick={() => id && navigate(`/phong-van-chi-tiet/${id}`)}>
              Xem chi tiết
            </Button>
            <Button onClick={() => navigate('/bao-cao')}>Quay lại lịch sử</Button>
          </div>
        </Card>
      )}

      {report && (
        <>
          <Card className="glass-card rounded-2xl p-8 text-center bg-gradient-to-b from-blue-50/50 to-white">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center justify-center gap-2">
              <Sparkles className="text-yellow-500" size={20} />
              Điểm tổng thể từ AI
            </h3>
            <div className="text-7xl font-extrabold text-blue-600 mb-4 animate-bounce">
              {overallScore ?? '—'}
            </div>
            <Badge className="text-lg px-6 py-1.5 bg-blue-600">
              {scoreLabel}
            </Badge>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4 text-gray-800">Điểm số chi tiết</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-4 rounded-xl text-center space-y-1">
                <span className="text-sm text-gray-500 font-medium">Confidence (Tự tin)</span>
                <div className="text-2xl font-bold text-slate-800">
                  {report.confidenceScore ?? '—'}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl text-center space-y-1">
                <span className="text-sm text-gray-500 font-medium">Clarity (Mạch lạc)</span>
                <div className="text-2xl font-bold text-slate-800">
                  {report.clarityScore ?? '—'}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl text-center space-y-1">
                <span className="text-sm text-gray-500 font-medium">Relevance (Liên quan)</span>
                <div className="text-2xl font-bold text-slate-800">
                  {report.relevanceScore ?? '—'}
                </div>
              </div>
            </div>
          </Card>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 border-green-100 bg-green-50/20">
              <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                👍 Ưu điểm (Strengths)
              </h3>
              {report.strengths && report.strengths.length > 0 ? (
                <ul className="space-y-2 text-sm text-gray-700">
                  {report.strengths.map((item, index) => (
                    <li key={`strength-${index}`} className="flex items-start gap-1">
                      <span className="text-green-600">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">Chưa có đánh giá</p>
              )}
            </Card>

            <Card className="p-6 border-red-100 bg-red-50/20">
              <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                👎 Điểm yếu (Weaknesses)
              </h3>
              {report.weaknesses && report.weaknesses.length > 0 ? (
                <ul className="space-y-2 text-sm text-gray-700">
                  {report.weaknesses.map((item, index) => (
                    <li key={`weakness-${index}`} className="flex items-start gap-1">
                      <span className="text-red-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">Chưa có đánh giá</p>
              )}
            </Card>

            <Card className="p-6 border-amber-100 bg-amber-50/20">
              <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                💡 Lời khuyên (Recommendations)
              </h3>
              {report.recommendations && report.recommendations.length > 0 ? (
                <ul className="space-y-2 text-sm text-gray-700">
                  {report.recommendations.map((item, index) => (
                    <li key={`recommend-${index}`} className="flex items-start gap-1">
                      <span className="text-amber-600">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">Chưa có đánh giá</p>
              )}
            </Card>
          </div>

          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-lg text-gray-800">Chi tiết các tiêu chí</h3>
            {report.scoreBreakdowns && report.scoreBreakdowns.length > 0 ? (
              <div className="space-y-4">
                {report.scoreBreakdowns.map((item, index) => (
                  <div key={`breakdown-${index}`} className="border-b pb-3 last:border-0 last:pb-0 space-y-1 text-sm">
                    <div className="flex justify-between items-center font-semibold text-gray-800">
                      <span>{item.dimension}</span>
                      <span>{item.score ?? '—'} / {item.maxScore ?? '—'}</span>
                    </div>
                    {item.comment && <p className="text-gray-600 text-xs italic">{item.comment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Chưa có đánh giá</p>
            )}
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-lg text-gray-800">Ý kiến phản hồi từ AI</h3>
            {report.feedbackItems && report.feedbackItems.length > 0 ? (
              <div className="grid gap-3">
                {report.feedbackItems.map((item, index) => (
                  <div key={`feedback-${index}`} className="p-3 border rounded-xl bg-slate-50/50 space-y-1">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span>{item.title}</span>
                      <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{item.detail}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Chưa có đánh giá</p>
            )}
          </Card>

            <Card className="p-6 space-y-4">
              <h3 className="font-bold text-lg text-gray-800">Thông tin phiên phỏng vấn</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-3">
                  <span className="text-gray-500">Trạng thái</span>
                  <strong>{session?.status ?? 'N/A'}</strong>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-3">
                  <span className="text-gray-500">Mode</span>
                  <strong>{session?.mode || 'N/A'}</strong>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-3">
                  <span className="text-gray-500">Interview mode</span>
                  <strong>{session?.interviewerMode || 'N/A'}</strong>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-3">
                  <span className="text-gray-500">AI model</span>
                  <strong>{session?.aiModelRaw || session?.aiModel || 'N/A'}</strong>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-3">
                  <span className="text-gray-500">Số câu hỏi dự kiến</span>
                  <strong>{session?.totalExpectedQuestions ?? 0}</strong>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-3">
                  <span className="text-gray-500">Đã trả lời</span>
                  <strong>{session?.answeredCount ?? 0}</strong>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-3">
                  <span className="text-gray-500">Ngày tạo</span>
                  <strong>{session?.createdAt ? new Date(session.createdAt).toLocaleString('vi-VN') : 'N/A'}</strong>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-3">
                  <span className="text-gray-500">Ngày hoàn tất</span>
                  <strong>{session?.completedAt ? new Date(session.completedAt).toLocaleString('vi-VN') : 'Chưa hoàn tất'}</strong>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="font-bold text-lg text-gray-800">Chi tiết kỹ thuật</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {/* <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-3">
                  <span className="text-gray-500">Pace score</span>
                  <strong>{report.paceScore ?? '—'}</strong>
                </div> */}
                <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-3">
                  <span className="text-gray-500">Model version</span>
                  <strong>{report.modelVersion ?? 'Chưa có dữ liệu'}</strong>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-3">
                  <span className="text-gray-500">Schema version</span>
                  <strong>{report.schemaVersion ?? 'Chưa có dữ liệu'}</strong>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-3">
                  <span className="text-gray-500">Session ID</span>
                  <strong className="break-all text-right">{session?.id ?? id ?? 'N/A'}</strong>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="font-bold text-lg text-gray-800">Tổng hợp câu hỏi & trả lời</h3>
              {session?.questions && session.questions.length > 0 ? (
                <div className="max-h-[520px] overflow-y-auto pr-2 space-y-4">
                  {session.questions.map((q) => {
                    const answer = session.answers?.find((a) => a.questionId === q.questionId);
                    return (
                      <div key={q.questionId} className="border rounded-xl p-4 bg-slate-50/40 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold">
                              {q.questionNumber}. {q.questionText}
                            </p>
                            <div className="text-xs text-gray-500 mt-1">
                              {q.questionType} • {q.difficulty} • {answer ? 'Đã trả lời' : 'Chưa trả lời'}
                            </div>
                          </div>
                        </div>

                        {q.expectedAnswerPoints && q.expectedAnswerPoints.length > 0 && (
                          <ul className="text-sm text-gray-600 space-y-1">
                            {q.expectedAnswerPoints.map((point, index) => (
                              <li key={`${q.questionId}-point-${index}`}>• {point}</li>
                            ))}
                          </ul>
                        )}

                        <div className="rounded-lg border bg-white p-3 text-sm text-gray-700">
                          <p className="font-medium mb-1">Câu trả lời</p>
                          <p>{answer?.answerText || 'Chưa có câu trả lời'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Chưa có dữ liệu</p>
              )}
            </Card>

          <div className="flex gap-3">
            <Button onClick={() => navigate('/phong-van-setup')}>
              Luyện lại
            </Button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Xóa phiên phỏng vấn"
        description="Bạn có chắc chắn muốn xóa phiên phỏng vấn này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        onOpenChange={setShowDeleteConfirm}
        onConfirm={() => void handleDeleteInterview()}
      />
    </div>
  );
};

// Reports Page
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

// Notifications Page
export const NotificationsPage: React.FC = () => {
  const { state, markNotificationRead } = useApp();

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <AppPageHeader
        title="Thông báo"
        subtitle="Cập nhật hoạt động và nhắc nhở từ hệ thống"
        icon={Bell}
        iconGradient="from-sky-500 to-blue-600"
      />

      {state.notifications.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Không có thông báo</h3>
          <p className="text-gray-600">Bạn đã xem hết thông báo</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {state.notifications.map(notification => (
            <Card 
              key={notification.id} 
              className={`p-6 cursor-pointer ${!notification.read ? 'bg-blue-50 border-blue-200' : ''}`}
              onClick={() => markNotificationRead(notification.id)}
            >
              <div className="flex items-start gap-3">
                <Bell className="flex-shrink-0 mt-1" size={20} />
                <div className="flex-1">
                  <h3 className="font-bold mb-1">{notification.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                  <p className="text-xs text-gray-500">
                    {notification.createdAt.toLocaleDateString('vi-VN')} {notification.createdAt.toLocaleTimeString('vi-VN')}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Settings Page
export const SettingsPage: React.FC = () => {
  const { state, updateUser } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState(state.user?.name || '');
  const [email, setEmail] = useState(state.user?.email || '');
  const [emailNotifs, setEmailNotifs] = useState(true);

  const handleSave = () => {
    updateUser({ name, email });
    alert('Đã lưu thay đổi!');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <AppPageHeader
        title="Cài đặt tài khoản"
        subtitle="Thông tin cá nhân, thông báo và bảo mật"
        icon={Activity}
        iconGradient="from-slate-600 to-slate-800"
      />

      <Card className="glass-card p-6">
        <h3 className="font-bold mb-4">Thông tin cá nhân</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Họ và tên</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button onClick={handleSave}>Lưu thay đổi</Button>
        </div>
      </Card>

      <Card className="glass-card p-6">
        <h3 className="font-bold mb-4">Thông báo</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Email thông báo</h4>
              <p className="text-sm text-gray-600">Nhận thông báo qua email</p>
            </div>
            <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
          </div>
        </div>
      </Card>
    </div>
  );
};

// Subscription Page
export const SubscriptionPage: React.FC = () => {
  const { state } = useApp();
  const navigate = useNavigate();
  const currentPlan = state.user?.subscriptionPlan || 'free';
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [selectedDowngradePlan, setSelectedDowngradePlan] = useState<string>('');
  const [downgradeLoading, setDowngradeLoading] = useState(false);

  // Scroll to comparison table
  const scrollToComparison = () => {
    const element = document.getElementById('upgrade-plans-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const currentPlanInfo = CANDIDATE_PLANS[currentPlan];
  const isPaidPlan = currentPlan !== 'free';

  const handleSelectPlan = (planId: string) => {
    if (planId === currentPlan) {
      return; // Already on this plan
    }
    
    const actionType = getPlanActionType(currentPlan, planId);
    
    if (actionType === 'downgrade') {
      // Show downgrade modal
      setSelectedDowngradePlan(planId);
      setShowDowngradeModal(true);
    } else {
      // Navigate to billing for upgrade or select
      navigate('/thanh-toan', { state: { selectedPlan: planId } });
    }
  };

  const handleDowngradeConfirm = () => {
    setDowngradeLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setDowngradeLoading(false);
      setShowDowngradeModal(false);
      toast.success(`Đã đặt lịch chuyển xuống ${CANDIDATE_PLANS[selectedDowngradePlan].name} vào kỳ tiếp theo`);
      eventTracker.track('plan_downgrade_scheduled', { 
        fromPlan: currentPlan,
        toPlan: selectedDowngradePlan 
      });
    }, 1500);
  };

  const quota = getPlanQuota(currentPlan);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      <h1 className="text-3xl font-bold">Gói dịch vụ</h1>

      {/* Current Plan Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Gói hiện tại</h3>
            <h2 className="text-3xl font-bold text-blue-600 mb-2">{currentPlanInfo.name}</h2>
            <p className="text-sm text-gray-600">{currentPlanInfo.description}</p>
          </div>
          <Badge className={`${isPaidPlan ? 'bg-blue-600' : 'bg-gray-400'} text-white px-4 py-2 text-sm`}>
            {currentPlanInfo.name}
          </Badge>
        </div>

        {/* Subscription Info */}
        {isPaidPlan && state.user?.subscriptionEndsAt && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>Gia hạn tự động:</strong> {state.user.subscriptionEndsAt.toLocaleDateString('vi-VN')}
            </p>
          </div>
        )}

        {/* Features */}
        <div className="mb-6">
          <h4 className="font-semibold mb-3 text-gray-700">Tính năng hiện tại:</h4>
          <div className="grid md:grid-cols-2 gap-2">
            {currentPlanInfo.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Usage Stats */}
        {currentPlan !== 'yearly' && state.user && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-3 text-gray-700">
              {currentPlan === 'free' ? 'Mức sử dụng (toàn bộ):' : 'Mức sử dụng hôm nay:'}
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Tối ưu CV</span>
                  <span className="font-medium">
                    {state.user.cvOptimizationsDaily}/
                    {currentPlan === 'free' ? 3 : currentPlan === 'monthly' ? 3 : 5} lần
                  </span>
                </div>
                <Progress 
                  value={(state.user.cvOptimizationsDaily / (currentPlan === 'free' ? 3 : currentPlan === 'monthly' ? 3 : 5)) * 100} 
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Phỏng vấn AI</span>
                  <span className="font-medium">
                    {state.user.interviewsDaily}/
                    {currentPlan === 'free' ? 1 : currentPlan === 'monthly' ? 1 : 3} lần
                  </span>
                </div>
                <Progress 
                  value={(state.user.interviewsDaily / (currentPlan === 'free' ? 1 : currentPlan === 'monthly' ? 1 : 3)) * 100} 
                />
              </div>
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="flex gap-3">
          {currentPlan === 'free' ? (
            <>
              <Button onClick={scrollToComparison}>
                Nâng cấp gói
              </Button>
              <Button variant="outline" onClick={scrollToComparison}>
                Xem bảng so sánh
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={scrollToComparison}>
                Xem các gói khác
              </Button>
              <Button variant="outline" onClick={() => navigate('/huy-goi')}>
                Hủy gói
              </Button>
              <Button variant="outline" onClick={() => navigate('/hoa-don')}>
                Xem hóa đơn
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Payment Details for Paid Plans */}
      {isPaidPlan && (
        <Card className="p-6">
          <h3 className="font-bold mb-4">Chi tiết thanh toán</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Gói đăng ký</span>
              <span className="font-semibold">{currentPlanInfo.name}</span>
            </div>
            {currentPlanInfo.cycle && (
              <div className="flex justify-between">
                <span className="text-gray-600">Chu kỳ thanh toán</span>
                <span className="font-semibold">{currentPlanInfo.cycle}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Giá/tháng</span>
              <span className="font-semibold">{currentPlanInfo.price.toLocaleString('vi-VN')}₫</span>
            </div>
            {currentPlanInfo.totalPrice && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng thanh toán</span>
                <span className="font-semibold">{currentPlanInfo.totalPrice.toLocaleString('vi-VN')}₫</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="text-gray-600">Phương thức thanh toán</span>
              <span className="font-semibold">
                {state.user?.paymentMethod === 'vnpay' ? 'VNPay' :
                 state.user?.paymentMethod === 'momo' ? 'MoMo' :
                 state.user?.paymentMethod === 'credit_card' ? 'Thẻ tín dụng' :
                 state.user?.paymentMethod === 'bank_transfer' ? 'Chuyển khoản' : 'Chưa thiết lập'}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Upgrade Plans Section */}
      <div id="upgrade-plans-section">
        <h2 className="text-2xl font-bold mb-6">
          {currentPlan === 'free' ? 'Các gói phù hợp với bạn' : 'Các gói nâng cấp'}
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Monthly Plan */}
          <Card className={`p-6 flex flex-col ${currentPlan === 'monthly' ? 'border-2 border-blue-600 shadow-lg' : ''}`}>
            {currentPlan === 'monthly' && (
              <div className="mb-4">
                <Badge className="bg-blue-600 text-white">Gói hiện tại</Badge>
              </div>
            )}
            <h3 className="text-xl font-bold mb-2">{CANDIDATE_PLANS['monthly'].name}</h3>
            <p className="text-sm text-gray-600 mb-4 min-h-[60px]">{CANDIDATE_PLANS['monthly'].description}</p>
            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{CANDIDATE_PLANS['monthly'].price.toLocaleString('vi-VN')}₫</span>
                <span className="text-gray-600">/tháng</span>
              </div>
            </div>
            {(() => {
              const actionType = getPlanActionType(currentPlan, 'monthly');
              const ctaText = getPlanCTAText(actionType, 'monthly');
              const ctaVariant = getPlanCTAVariant(actionType, false);
              return (
                <Button
                  className="w-full mb-4"
                  onClick={() => handleSelectPlan('monthly')}
                  disabled={actionType === 'current'}
                  variant={ctaVariant}
                >
                  {ctaText}
                </Button>
              );
            })()}
            <div className="space-y-2 flex-1 text-sm">
              {CANDIDATE_PLANS['monthly'].features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="text-green-600 flex-shrink-0 mt-0.5" size={14} />
                  <span className="text-xs">{feature}</span>
                </div>
              ))}
              {CANDIDATE_PLANS['monthly'].limitations && CANDIDATE_PLANS['monthly'].limitations.length > 0 && (
                <>
                  {CANDIDATE_PLANS['monthly'].limitations.map((limitation, index) => (
                    <div key={`limit-${index}`} className="flex items-start gap-2 text-gray-400">
                      <X className="flex-shrink-0 mt-0.5" size={14} />
                      <span className="text-xs">{limitation}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </Card>

          {/* Quarterly Plan */}
          <Card className={`p-6 flex flex-col relative ${currentPlan === 'quarterly' ? 'border-2 border-purple-600 shadow-lg' : 'border-2 border-purple-200'}`}>
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-4 py-1 text-xs font-bold rounded-full whitespace-nowrap">
              {CANDIDATE_PLANS['quarterly'].badge}
            </div>
            {currentPlan === 'quarterly' && (
              <div className="mb-4 mt-3">
                <Badge className="bg-purple-600 text-white">Gói hiện tại</Badge>
              </div>
            )}
            {currentPlan !== 'quarterly' && <div className="h-3" />}
            <h3 className="text-xl font-bold mb-2">{CANDIDATE_PLANS['quarterly'].name}</h3>
            <p className="text-sm text-gray-600 mb-4 min-h-[60px]">{CANDIDATE_PLANS['quarterly'].description}</p>
            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{CANDIDATE_PLANS['quarterly'].price.toLocaleString('vi-VN')}₫</span>
                <span className="text-gray-600">/tháng</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{CANDIDATE_PLANS['quarterly'].savings}</p>
            </div>
            {(() => {
              const actionType = getPlanActionType(currentPlan, 'quarterly');
              const ctaText = getPlanCTAText(actionType, 'quarterly');
              const ctaVariant = getPlanCTAVariant(actionType, false);
              return (
                <Button
                  className="w-full mb-4"
                  onClick={() => handleSelectPlan('quarterly')}
                  disabled={actionType === 'current'}
                  variant={ctaVariant}
                >
                  {ctaText}
                </Button>
              );
            })()}
            <div className="space-y-2 flex-1 text-sm">
              {CANDIDATE_PLANS['quarterly'].features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="text-green-600 flex-shrink-0 mt-0.5" size={14} />
                  <span className="text-xs">{feature}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Yearly Plan */}
          <Card className={`p-6 flex flex-col relative ${currentPlan === 'yearly' ? 'border-2 border-green-600 shadow-lg' : 'border-2 border-green-200'}`}>
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-1 text-xs font-bold rounded-full whitespace-nowrap">
              {CANDIDATE_PLANS['yearly'].badge}
            </div>
            {currentPlan === 'yearly' && (
              <div className="mb-4 mt-3">
                <Badge className="bg-green-600 text-white">Gói hiện tại</Badge>
              </div>
            )}
            {currentPlan !== 'yearly' && <div className="h-3" />}
            <h3 className="text-xl font-bold mb-2">{CANDIDATE_PLANS['yearly'].name}</h3>
            <p className="text-sm text-gray-600 mb-4 min-h-[60px]">{CANDIDATE_PLANS['yearly'].description}</p>
            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{CANDIDATE_PLANS['yearly'].price.toLocaleString('vi-VN')}₫</span>
                <span className="text-gray-600">/tháng</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{CANDIDATE_PLANS['yearly'].savings}</p>
            </div>
            {(() => {
              const actionType = getPlanActionType(currentPlan, 'yearly');
              const ctaText = getPlanCTAText(actionType, 'yearly');
              const ctaVariant = getPlanCTAVariant(actionType, false);
              return (
                <Button
                  className="w-full mb-4"
                  onClick={() => handleSelectPlan('yearly')}
                  disabled={actionType === 'current'}
                  variant={ctaVariant}
                >
                  {ctaText}
                </Button>
              );
            })()}
            <div className="space-y-2 flex-1 text-sm">
              {CANDIDATE_PLANS['yearly'].features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="text-green-600 flex-shrink-0 mt-0.5" size={14} />
                  <span className="text-xs">{feature}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Comparison Table Section */}
      <div id="comparison-section" className="scroll-mt-6">
        <h2 className="text-2xl font-bold mb-6">Bảng so sánh chi tiết</h2>
        
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-bold">Tính năng</th>
                  <th className="text-center p-4 font-bold">Miễn phí</th>
                  <th className="text-center p-4 font-bold">Tháng</th>
                  <th className="text-center p-4 font-bold bg-purple-50">Quý</th>
                  <th className="text-center p-4 font-bold bg-green-50">Năm</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-4 font-medium">Tối ưu CV</td>
                  <td className="text-center p-4">3 lần/tài khoản</td>
                  <td className="text-center p-4">3 lần/ngày</td>
                  <td className="text-center p-4 bg-purple-50">5 lần/ngày</td>
                  <td className="text-center p-4 bg-green-50 font-semibold">Không giới hạn</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Phỏng vấn AI</td>
                  <td className="text-center p-4">1 phiên/tài khoản</td>
                  <td className="text-center p-4">1 lần/ngày</td>
                  <td className="text-center p-4 bg-purple-50">3 lần/ngày</td>
                  <td className="text-center p-4 bg-green-50 font-semibold">Không giới hạn</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Phỏng vấn với Mentor/người thật</td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4 bg-purple-50">3 lần/tháng</td>
                  <td className="text-center p-4 bg-green-50 font-semibold">1 lần/tuần</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Model AI</td>
                  <td className="text-center p-4">Basic</td>
                  <td className="text-center p-4">Ổn định</td>
                  <td className="text-center p-4 bg-purple-50">Cao cấp</td>
                  <td className="text-center p-4 bg-green-50">Cao cấp</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Phong cách AI interviewer & stress-test</td>
                  <td className="text-center p-4">Cơ bản</td>
                  <td className="text-center p-4">Đầy đủ 6 loại</td>
                  <td className="text-center p-4 bg-purple-50">Đầy đủ 6 loại</td>
                  <td className="text-center p-4 bg-green-50">Đầy đủ 6 loại</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Báo cáo phân tích</td>
                  <td className="text-center p-4">Rút gọn</td>
                  <td className="text-center p-4">Toàn diện</td>
                  <td className="text-center p-4 bg-purple-50">Toàn diện</td>
                  <td className="text-center p-4 bg-green-50">Toàn diện</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Phân tích kỹ năng giao tiếp</td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4"><CheckCircle className="text-green-600 inline" size={18} /></td>
                  <td className="text-center p-4 bg-purple-50"><CheckCircle className="text-green-600 inline" size={18} /></td>
                  <td className="text-center p-4 bg-green-50"><CheckCircle className="text-green-600 inline" size={18} /></td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Xuất PDF</td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4"><CheckCircle className="text-green-600 inline" size={18} /></td>
                  <td className="text-center p-4 bg-purple-50"><CheckCircle className="text-green-600 inline" size={18} /></td>
                  <td className="text-center p-4 bg-green-50"><CheckCircle className="text-green-600 inline" size={18} /></td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">So sánh tiến bộ</td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4"><CheckCircle className="text-green-600 inline" size={18} /></td>
                  <td className="text-center p-4 bg-purple-50"><CheckCircle className="text-green-600 inline" size={18} /></td>
                  <td className="text-center p-4 bg-green-50"><CheckCircle className="text-green-600 inline" size={18} /></td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">So sánh benchmark ngành</td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4"><CheckCircle className="text-green-600 inline" size={18} /></td>
                  <td className="text-center p-4 bg-purple-50"><CheckCircle className="text-green-600 inline" size={18} /></td>
                  <td className="text-center p-4 bg-green-50"><CheckCircle className="text-green-600 inline" size={18} /></td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Chọn mentor theo nhóm ngành</td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4 bg-purple-50"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4 bg-green-50"><CheckCircle className="text-green-600 inline" size={18} /></td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Lưu lịch sử không giới hạn</td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4">30 ngày</td>
                  <td className="text-center p-4 bg-purple-50">90 ngày</td>
                  <td className="text-center p-4 bg-green-50"><CheckCircle className="text-green-600 inline" size={18} /></td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Hỗ trợ</td>
                  <td className="text-center p-4">Email</td>
                  <td className="text-center p-4">Email</td>
                  <td className="text-center p-4 bg-purple-50">Priority</td>
                  <td className="text-center p-4 bg-green-50">24/7 cao nhất</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Downgrade Confirm Modal */}
      <DowngradeConfirmModal
        isOpen={showDowngradeModal}
        onClose={() => setShowDowngradeModal(false)}
        onConfirm={handleDowngradeConfirm}
        loading={downgradeLoading}
        currentPlan={currentPlan}
        targetPlan={selectedDowngradePlan}
      />
    </div>
  );
};

// Invoices Page
export const InvoicesPage: React.FC = () => {
  const invoices: InvoiceItem[] = [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <AppPageHeader
        title="Hóa đơn"
        subtitle="Lịch sử thanh toán và hóa đơn điện tử"
        icon={Download}
        iconGradient="from-amber-500 to-orange-600"
      />

      {invoices.length === 0 ? (
        <Card className="glass-card p-8 text-center text-slate-600">
          <p className="font-medium text-gray-800 mb-2">Chưa có lịch sử thanh toán</p>
          <p className="text-sm">
            Lịch sử thanh toán sẽ được cập nhật sau khi tích hợp cổng thanh toán.
          </p>
        </Card>
      ) : (
      <div className="space-y-4">
        {invoices.map(invoice => (
          <Card key={invoice.id} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold">Hóa đơn #{invoice.id}</h3>
                <p className="text-sm text-gray-600">
                  {new Date(invoice.date).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-bold">{invoice.amount.toLocaleString('vi-VN')}₫</div>
                  <Badge variant="secondary">{invoice.status}</Badge>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2" size={14} />
                  Tải PDF
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
};

// Email Center, Activity Log, Subscription Expired, Cancel Subscription, Delete Account
export const EmailCenterPage: React.FC = () => (
  <div className="max-w-4xl mx-auto"><Card className="p-12 text-center"><Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" /><h1 className="text-2xl font-bold">Trung tâm Email</h1></Card></div>
);

export const ActivityLogPage: React.FC = () => {
  const events = eventTracker.getEvents();
  const feedback = getFeedback();

  const eventTypeLabels: Record<string, string> = {
    login: 'Đăng nhập',
    logout: 'Đăng xuất',
    signup_complete: 'Đăng ký',
    cv_upload: 'Tải CV',
    jd_analyze_start: 'Bắt đầu so khớp JD',
    jd_analyze_complete: 'Hoàn thành so khớp JD',
    interview_start: 'Bắt đầu phỏng vấn',
    interview_end: 'Kết thúc phỏng vấn',
    upgrade_modal_shown: 'Hiển thị modal nâng cấp',
    upgrade_success: 'Nâng cấp thành công',
    trial_started: 'Bắt đầu dùng thử',
    pdf_export_click: 'Xuất PDF',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <AppPageHeader
        title="Nhật ký tương tác"
        subtitle="Lịch sử hoạt động và góp ý của bạn"
        icon={Activity}
        iconGradient="from-indigo-500 to-violet-600"
      />

      <Card className="glass-card p-6">
        <h3 className="font-bold mb-4">Sự kiện gần đây (20 sự kiện)</h3>
        {events.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Chưa có sự kiện nào</p>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 20).map(event => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Activity size={16} className="text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">
                      {eventTypeLabels[event.type] || event.type}
                    </p>
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <p className="text-xs text-gray-500">
                        {JSON.stringify(event.metadata).slice(0, 50)}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {event.timestamp.toLocaleTimeString('vi-VN')}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Feedback */}
      <Card className="glass-card p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <MessageSquare size={20} />
          Góp ý của bạn
        </h3>
        {feedback.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Bạn chưa gửi góp ý nào</p>
        ) : (
          <div className="space-y-3">
            {feedback.map(item => (
              <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{item.type}</Badge>
                  <span className="text-xs text-gray-500">
                    {item.timestamp.toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{item.description}</p>
                {item.email && (
                  <p className="text-xs text-gray-500 mt-2">Email: {item.email}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export const SubscriptionExpiredPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Card className="p-12 text-center max-w-md mx-auto">
      <AlertCircle className="w-16 h-16 text-orange-600 mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-2">Gói đã hết hạn</h1>
      <p className="text-gray-600 mb-6">Chọn gói phù hợp để tiếp tục sử dụng tính năng nâng cao</p>
      <Button onClick={() => navigate('/goi-dich-vu')}>Nâng cấp ngay</Button>
    </Card>
  );
};

export const CancelSubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const [planName, setPlanName] = useState('gói hiện tại');
  const [loading, setLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  React.useEffect(() => {
    import('../../services/subscriptionService').then(({ getCurrentSubscription }) => {
      getCurrentSubscription().then((sub) => {
        if (sub?.planName) setPlanName(sub.planName);
      });
    });
  }, []);

  const handleCancel = async () => {
    setLoading(true);
    try {
      const { cancelSubscription } = await import('../../services/subscriptionService');
      await cancelSubscription();
      toast.success('Đã gửi yêu cầu hủy gói');
      navigate('/goi-dich-vu');
    } catch (err) {
      const { createApiError } = await import('../../lib/api/apiError');
      toast.error(createApiError(err).getUserMessage());
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Hủy {planName}</h1>
      <p className="text-gray-600 mb-6">
        Bạn sẽ vẫn sử dụng được {planName} đến hết kỳ thanh toán hiện tại.
        Sau đó tài khoản sẽ chuyển về gói Miễn phí.
      </p>
      <div className="flex gap-3">
        <Button variant="destructive" onClick={() => setShowCancelConfirm(true)} disabled={loading}>
          {loading ? 'Đang xử lý...' : 'Xác nhận hủy'}
        </Button>
        <Button variant="outline" onClick={() => navigate('/goi-dich-vu')}>
          Quay lại
        </Button>
      </div>

      <ConfirmDialog
        open={showCancelConfirm}
        title={`Hủy ${planName}`}
        description={`Bạn có chắc chắn muốn hủy ${planName}? Bạn sẽ vẫn sử dụng được gói này đến hết kỳ thanh toán hiện tại.`}
        confirmLabel="Xác nhận hủy"
        onOpenChange={setShowCancelConfirm}
        onConfirm={() => void handleCancel()}
      />
    </Card>
  );
};

// Help Center Page (internal - no external redirect)
export const HelpCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const { state } = useApp();
  
  const helpCategories = [
    {
      title: 'Tối ưu CV',
      icon: FileText,
      articles: [
        'Cách tải CV lên hệ thống',
        'Làm thế nào để so khớp CV với JD?',
        'Hiểu điểm matching và cách cải thiện',
        'Xuất CV đã tối ưu'
      ]
    },
    {
      title: 'Phỏng vấn AI',
      icon: MessageSquare,
      articles: [
        'Bắt đầu buổi phỏng vấn đầu tiên',
        'Chọn mô hình AI phù hợp',
        'Sử dụng microphone hiệu quả',
        'Đọc và hiểu báo cáo phỏng vấn'
      ]
    },
    {
      title: 'Báo cáo & Thống kê',
      icon: BarChart3,
      articles: [
        'Xem lịch sử báo cáo',
        'So sánh với trung bình ngành',
        'Xuất báo cáo PDF (Gói trả phí)',
        'Theo dõi tiến độ cải thiện'
      ]
    },
    {
      title: 'Gói dịch vụ',
      icon: Target,
      articles: [
        'So sánh các gói dịch vụ',
        'Dùng thử 7 ngày miễn phí',
        'Nâng cấp và thanh toán',
        'Hủy gói dịch vụ'
      ]
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      <AppPageHeader
        title="Trung tâm trợ giúp"
        subtitle="Tìm câu trả lời cho các thắc mắc thường gặp"
        icon={HelpCircle}
        iconGradient="from-blue-500 to-cyan-500"
        actions={
          <Button variant="outline" className="hover-lift" onClick={() => navigate('/dashboard')}>
            Quay lại Dashboard
          </Button>
        }
      />

      <Card className="glass-card p-6">
        <div className="relative">
          <Input 
            placeholder="Tìm kiếm bài viết hỗ trợ..." 
            className="pl-10"
          />
          <HelpCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </Card>

      {/* Categories */}
      <div className="grid md:grid-cols-2 gap-6">
        {helpCategories.map((category, idx) => {
          const Icon = category.icon;
          return (
            <Card key={idx} className="glass-card hover-lift p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">{category.title}</h3>
              </div>
              <ul className="space-y-2">
                {category.articles.map((article, i) => (
                  <li key={i}>
                    <button className="text-sm text-blue-600 hover:text-blue-800 text-left hover:underline">
                      {article}
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      {/* Contact Support */}
      <Card className="p-8 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Vẫn cần hỗ trợ?</h3>
            <p className="text-gray-600">
              Đội ngũ INTER-VIET sẵn sàng hỗ trợ bạn 24/7
            </p>
          </div>
          <Button 
            type="button"
            onClick={() => setIsContactModalOpen(true)}
          >
            Liên hệ hỗ trợ
          </Button>
        </div>
      </Card>

      {/* Contact Support Modal */}
      <ContactSupportModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        userEmail={state.user?.email}
        sourcePage="/tro-giup"
      />
    </div>
  );
};
