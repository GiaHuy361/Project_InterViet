import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { useApp } from '../contexts/AppContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
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
import { notificationService, type NotificationItem, type NotificationPreferences } from '../../services/notificationService';
import {
  closeSupportTicket,
  getSupportTicketDetail,
  listSupportTickets,
  sendSupportTicketMessage,
  type SupportTicket,
  type SupportTicketMessage,
  type SupportTicketStatus,
} from '../../services/supportTicketService';
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

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
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
              <Button variant="outline" className="hover-lift text-red-600 dark:text-red-400 hover:text-red-700 dark:text-red-400" onClick={() => setShowDeleteConfirm(true)}>
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
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4">
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
            <div className="text-7xl font-extrabold text-blue-600 dark:text-blue-400 mb-4 animate-bounce">
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
            <Card className="p-6 border-green-100 dark:border-green-800/50 bg-green-50 dark:bg-green-900/30">
              <h3 className="font-bold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                👍 Ưu điểm (Strengths)
              </h3>
              {report.strengths && report.strengths.length > 0 ? (
                <ul className="space-y-2 text-sm text-gray-700">
                  {report.strengths.map((item, index) => (
                    <li key={`strength-${index}`} className="flex items-start gap-1">
                      <span className="text-green-600 dark:text-green-400">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">Chưa có đánh giá</p>
              )}
            </Card>

            <Card className="p-6 border-red-100 dark:border-red-800/50 bg-red-50 dark:bg-red-900/30">
              <h3 className="font-bold text-red-800 dark:text-red-300 mb-3 flex items-center gap-2">
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

            <Card className="p-6 border-amber-100 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/30">
              <h3 className="font-bold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
                💡 Lời khuyên (Recommendations)
              </h3>
              {report.recommendations && report.recommendations.length > 0 ? (
                <ul className="space-y-2 text-sm text-gray-700">
                  {report.recommendations.map((item, index) => (
                    <li key={`recommend-${index}`} className="flex items-start gap-1">
                      <span className="text-amber-600 dark:text-amber-400">•</span>
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


// Notifications Page
export const NotificationsPage: React.FC = () => {
  const { state, markNotificationRead, syncNotifications } = useApp();
  const [remoteNotifications, setRemoteNotifications] = useState<NotificationItem[]>([]);
  const [hasRemoteData, setHasRemoteData] = useState(false);
  const [remoteTotalPages, setRemoteTotalPages] = useState(1);
  const [remoteTotalItems, setRemoteTotalItems] = useState(0);
  const [remoteUnreadCount, setRemoteUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [savingPreferences, setSavingPreferences] = useState(false);

  const fetchNotifications = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      else setSyncing(true);
      const [listResponse, prefsResponse, unreadResponse] = await Promise.all([
        notificationService.listNotifications({
          page,
          pageSize,
          isRead: unreadOnly ? false : undefined,
          type: typeFilter === 'all' ? undefined : typeFilter,
          priority: priorityFilter === 'all' ? undefined : priorityFilter,
        }),
        notificationService.getPreferences().catch(() => null),
        notificationService.getUnreadCount().catch(() => null),
      ]);
      setRemoteNotifications(listResponse.items || []);
      setRemoteTotalItems(listResponse.totalItems || 0);
      setRemoteTotalPages(listResponse.totalPages || 1);
      setRemoteUnreadCount(unreadResponse?.unreadCount ?? listResponse.items.filter((item) => !item.isRead).length);
      setHasRemoteData(true);
      setPreferences(prefsResponse);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.getUserMessage() : 'Không thể tải thông báo.');
      setHasRemoteData(false);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    void fetchNotifications(true);
    const timer = window.setInterval(() => {
      void fetchNotifications(false);
    }, 45000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, unreadOnly, typeFilter, priorityFilter]);

  const notifications = hasRemoteData
    ? remoteNotifications
    : state.notifications.map((item) => ({
        id: item.id,
        title: item.title,
        message: item.message,
        type: item.type,
        priority: item.type,
        isRead: item.read,
        createdAt: item.createdAt.toISOString(),
      }));

  const unreadCount = hasRemoteData ? remoteUnreadCount : state.notifications.filter((item) => !item.read).length;

  const totalPages = hasRemoteData ? remoteTotalPages : Math.max(1, Math.ceil(notifications.length / pageSize));
  const totalItems = hasRemoteData ? remoteTotalItems : notifications.length;
  const pagedNotifications = hasRemoteData ? remoteNotifications : notifications.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [unreadOnly, typeFilter, priorityFilter, pageSize]);

  const handleMarkRead = async (notificationId: string) => {
    if (!hasRemoteData) {
      markNotificationRead(notificationId);
      return;
    }

    try {
      await notificationService.markRead(notificationId);
      setRemoteNotifications((prev) => prev.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item)));
      void syncNotifications().catch(() => undefined);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.getUserMessage() : 'Không thể cập nhật thông báo.');
    }
  };

  const handleMarkAllRead = async () => {
    if (!hasRemoteData) {
      state.notifications.forEach((item) => markNotificationRead(item.id));
      toast.success('Đã đánh dấu tất cả là đã đọc');
      return;
    }

    try {
      await notificationService.markAllRead(typeFilter === 'all' ? undefined : { type: typeFilter });
      setRemoteNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      void syncNotifications().catch(() => undefined);
      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.getUserMessage() : 'Không thể đánh dấu đã đọc.');
    }
  };

  const handleSavePreferences = async () => {
    if (!preferences) return;

    setSavingPreferences(true);
    try {
      const updated = await notificationService.updatePreferences(preferences);
      setPreferences(updated);
      void syncNotifications().catch(() => undefined);
      toast.success('Đã lưu tùy chọn thông báo');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.getUserMessage() : 'Không thể lưu tùy chọn thông báo.');
    } finally {
      setSavingPreferences(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <AppPageHeader
        title="Thông báo"
        subtitle="Cập nhật hoạt động và nhắc nhở từ hệ thống"
        icon={Bell}
        iconGradient="from-sky-500 to-blue-600"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => void fetchNotifications(false)} disabled={syncing}>
              {syncing ? 'Đang cập nhật...' : 'Làm mới'}
            </Button>
            <Button variant="outline" onClick={() => void handleMarkAllRead()} disabled={unreadCount === 0}>
              Đánh dấu tất cả đã đọc
            </Button>
          </div>
        }
      />

      <Card className="glass-card p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Bộ lọc</p>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Switch checked={unreadOnly} onCheckedChange={setUnreadOnly} />
              <span>Chỉ hiện chưa đọc</span>
            </div>
          </div>
          <div className="space-y-1 min-w-40">
            <p className="text-sm font-medium">Loại</p>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="billing.payment_succeeded">billing.payment_succeeded</SelectItem>
                <SelectItem value="system.announcement">system.announcement</SelectItem>
                <SelectItem value="interview.result">interview.result</SelectItem>
                <SelectItem value="matching.result">matching.result</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 min-w-40">
            <p className="text-sm font-medium">Ưu tiên</p>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="low">low</SelectItem>
                <SelectItem value="normal">normal</SelectItem>
                <SelectItem value="high">high</SelectItem>
                <SelectItem value="urgent">urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Số mục/trang</p>
            <Input type="number" min={5} max={50} value={pageSize} onChange={(e) => setPageSize(Math.max(5, Math.min(50, Number(e.target.value) || 10)))} className="w-28" />
          </div>
          <div className="space-y-1 text-sm text-slate-600">
            <p>Tổng: {totalItems}</p>
            <p>Chưa đọc: {unreadCount}</p>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="glass-card p-12 text-center">
          <p className="text-gray-600">Đang tải thông báo...</p>
        </Card>
      ) : notifications.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Không có thông báo</h3>
          <p className="text-gray-600">Bạn đã xem hết thông báo</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {pagedNotifications.map(notification => (
            <Card 
              key={notification.id} 
              className={`p-6 cursor-pointer ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' : ''}`}
              onClick={() => void handleMarkRead(notification.id)}
            >
              <div className="flex items-start gap-3">
                <Bell className="flex-shrink-0 mt-1" size={20} />
                <div className="flex-1">
                  <h3 className="font-bold mb-1">{notification.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(notification.createdAt).toLocaleDateString('vi-VN')} {new Date(notification.createdAt).toLocaleTimeString('vi-VN')}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            Trang trước
          </Button>
          <p className="text-sm text-slate-600">Trang {page} / {totalPages}</p>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
            Trang sau
          </Button>
        </div>
      )}

      <Card className="glass-card p-6 space-y-4">
        <h3 className="font-bold">Tùy chọn thông báo</h3>
        {preferences ? (
          <div className="grid gap-4 md:grid-cols-2">
            <ToggleRow label="Thông báo trong app" checked={preferences.inAppNotificationsEnabled ?? preferences.inAppEnabled ?? false} onCheckedChange={(checked) => setPreferences({ ...preferences, inAppNotificationsEnabled: checked, inAppEnabled: checked })} />
            <ToggleRow label="Email thông báo" checked={preferences.emailNotificationsEnabled ?? preferences.emailEnabled ?? false} onCheckedChange={(checked) => setPreferences({ ...preferences, emailNotificationsEnabled: checked, emailEnabled: checked })} />
            <ToggleRow label="Thanh toán" checked={preferences.billingNotificationsEnabled ?? preferences.billingEnabled ?? false} onCheckedChange={(checked) => setPreferences({ ...preferences, billingNotificationsEnabled: checked, billingEnabled: checked })} />
            <ToggleRow label="CV / Resume" checked={preferences.resumeNotificationsEnabled ?? false} onCheckedChange={(checked) => setPreferences({ ...preferences, resumeNotificationsEnabled: checked })} />
            <ToggleRow label="Đối sánh CV-JD" checked={preferences.matchingNotificationsEnabled ?? false} onCheckedChange={(checked) => setPreferences({ ...preferences, matchingNotificationsEnabled: checked })} />
            <ToggleRow label="Phỏng vấn AI" checked={preferences.interviewNotificationsEnabled ?? false} onCheckedChange={(checked) => setPreferences({ ...preferences, interviewNotificationsEnabled: checked })} />
            <ToggleRow label="Cố vấn / mentor" checked={preferences.mentorNotificationsEnabled ?? false} onCheckedChange={(checked) => setPreferences({ ...preferences, mentorNotificationsEnabled: checked })} />
            <ToggleRow label="Thông báo hệ thống" checked={preferences.systemNotificationsEnabled ?? false} onCheckedChange={(checked) => setPreferences({ ...preferences, systemNotificationsEnabled: checked })} />
            <div className="md:col-span-2 flex justify-end">
              <Button onClick={() => void handleSavePreferences()} disabled={savingPreferences}>
                {savingPreferences ? 'Đang lưu...' : 'Lưu tùy chọn'}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Không tải được cấu hình thông báo từ server, đang dùng chế độ cục bộ.</p>
        )}
      </Card>

      {error && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 p-4 text-amber-800 dark:text-amber-300">
          {error}
        </Card>
      )}
    </div>
  );
};

const ToggleRow: React.FC<{ label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }> = ({ label, checked, onCheckedChange }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
    <div>
      <p className="font-medium">{label}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

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
      navigate('/thanh-toan', { state: { selectedPlan: planId, contextType: 'subscription' } });
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
            <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{currentPlanInfo.name}</h2>
            <p className="text-sm text-gray-600">{currentPlanInfo.description}</p>
          </div>
          <Badge className={`${isPaidPlan ? 'bg-blue-600' : 'bg-gray-400'} text-white px-4 py-2 text-sm`}>
            {currentPlanInfo.name}
          </Badge>
        </div>

        {/* Subscription Info */}
        {isPaidPlan && state.user?.subscriptionEndsAt && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
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
                <CheckCircle size={16} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
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
                  <Check className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={14} />
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
          <Card className={`p-6 flex flex-col relative ${currentPlan === 'quarterly' ? 'border-2 border-purple-600 shadow-lg' : 'border-2 border-purple-200 dark:border-purple-800'}`}>
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
                  <Check className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={14} />
                  <span className="text-xs">{feature}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Yearly Plan */}
          <Card className={`p-6 flex flex-col relative ${currentPlan === 'yearly' ? 'border-2 border-green-600 shadow-lg' : 'border-2 border-green-200 dark:border-green-800'}`}>
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
                  <Check className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={14} />
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
                  <th className="text-center p-4 font-bold bg-purple-50 dark:bg-purple-900/30">Quý</th>
                  <th className="text-center p-4 font-bold bg-green-50 dark:bg-green-900/30">Năm</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-4 font-medium">Tối ưu CV</td>
                  <td className="text-center p-4">3 lần/tài khoản</td>
                  <td className="text-center p-4">3 lần/ngày</td>
                  <td className="text-center p-4 bg-purple-50 dark:bg-purple-900/30">5 lần/ngày</td>
                  <td className="text-center p-4 bg-green-50 dark:bg-green-900/30 font-semibold">Không giới hạn</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Phỏng vấn AI</td>
                  <td className="text-center p-4">1 phiên/tài khoản</td>
                  <td className="text-center p-4">1 lần/ngày</td>
                  <td className="text-center p-4 bg-purple-50 dark:bg-purple-900/30">3 lần/ngày</td>
                  <td className="text-center p-4 bg-green-50 dark:bg-green-900/30 font-semibold">Không giới hạn</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Phỏng vấn với Mentor/người thật</td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4 bg-purple-50 dark:bg-purple-900/30">3 lần/tháng</td>
                  <td className="text-center p-4 bg-green-50 dark:bg-green-900/30 font-semibold">1 lần/tuần</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Model AI</td>
                  <td className="text-center p-4">Basic</td>
                  <td className="text-center p-4">Ổn định</td>
                  <td className="text-center p-4 bg-purple-50 dark:bg-purple-900/30">Cao cấp</td>
                  <td className="text-center p-4 bg-green-50 dark:bg-green-900/30">Cao cấp</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Phong cách AI interviewer & stress-test</td>
                  <td className="text-center p-4">Cơ bản</td>
                  <td className="text-center p-4">Đầy đủ 6 loại</td>
                  <td className="text-center p-4 bg-purple-50 dark:bg-purple-900/30">Đầy đủ 6 loại</td>
                  <td className="text-center p-4 bg-green-50 dark:bg-green-900/30">Đầy đủ 6 loại</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Báo cáo phân tích</td>
                  <td className="text-center p-4">Rút gọn</td>
                  <td className="text-center p-4">Toàn diện</td>
                  <td className="text-center p-4 bg-purple-50 dark:bg-purple-900/30">Toàn diện</td>
                  <td className="text-center p-4 bg-green-50 dark:bg-green-900/30">Toàn diện</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Phân tích kỹ năng giao tiếp</td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4"><CheckCircle className="text-green-600 dark:text-green-400 inline" size={18} /></td>
                  <td className="text-center p-4 bg-purple-50 dark:bg-purple-900/30"><CheckCircle className="text-green-600 dark:text-green-400 inline" size={18} /></td>
                  <td className="text-center p-4 bg-green-50 dark:bg-green-900/30"><CheckCircle className="text-green-600 dark:text-green-400 inline" size={18} /></td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Xuất PDF</td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4"><CheckCircle className="text-green-600 dark:text-green-400 inline" size={18} /></td>
                  <td className="text-center p-4 bg-purple-50 dark:bg-purple-900/30"><CheckCircle className="text-green-600 dark:text-green-400 inline" size={18} /></td>
                  <td className="text-center p-4 bg-green-50 dark:bg-green-900/30"><CheckCircle className="text-green-600 dark:text-green-400 inline" size={18} /></td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">So sánh tiến bộ</td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4"><CheckCircle className="text-green-600 dark:text-green-400 inline" size={18} /></td>
                  <td className="text-center p-4 bg-purple-50 dark:bg-purple-900/30"><CheckCircle className="text-green-600 dark:text-green-400 inline" size={18} /></td>
                  <td className="text-center p-4 bg-green-50 dark:bg-green-900/30"><CheckCircle className="text-green-600 dark:text-green-400 inline" size={18} /></td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">So sánh benchmark ngành</td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4"><CheckCircle className="text-green-600 dark:text-green-400 inline" size={18} /></td>
                  <td className="text-center p-4 bg-purple-50 dark:bg-purple-900/30"><CheckCircle className="text-green-600 dark:text-green-400 inline" size={18} /></td>
                  <td className="text-center p-4 bg-green-50 dark:bg-green-900/30"><CheckCircle className="text-green-600 dark:text-green-400 inline" size={18} /></td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Chọn mentor theo nhóm ngành</td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4 bg-purple-50 dark:bg-purple-900/30"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4 bg-green-50 dark:bg-green-900/30"><CheckCircle className="text-green-600 dark:text-green-400 inline" size={18} /></td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Lưu lịch sử không giới hạn</td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4">30 ngày</td>
                  <td className="text-center p-4 bg-purple-50 dark:bg-purple-900/30">90 ngày</td>
                  <td className="text-center p-4 bg-green-50 dark:bg-green-900/30"><CheckCircle className="text-green-600 dark:text-green-400 inline" size={18} /></td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Hỗ trợ</td>
                  <td className="text-center p-4">Email</td>
                  <td className="text-center p-4">Email</td>
                  <td className="text-center p-4 bg-purple-50 dark:bg-purple-900/30">Priority</td>
                  <td className="text-center p-4 bg-green-50 dark:bg-green-900/30">24/7 cao nhất</td>
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
                  <Activity size={16} className="text-blue-600 dark:text-blue-400" />
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
      <AlertCircle className="w-16 h-16 text-orange-600 dark:text-orange-400 mx-auto mb-4" />
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
  const location = useLocation();
  const navigate = useNavigate();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isClosingTicket, setIsClosingTicket] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalTickets, setTotalTickets] = useState(0);
  const queryTicketId = new URLSearchParams(location.search).get('ticketId');

  const totalPages = Math.max(1, Math.ceil(totalTickets / pageSize));

  const statusLabel: Record<string, string> = {
    open: 'Mới',
    in_progress: 'Đang xử lý',
    resolved: 'Đã xử lý',
    closed: 'Đã đóng',
  };

  const statusBadgeClass: Record<string, string> = {
    open: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
    in_progress: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
    resolved: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
    closed: 'bg-gray-100 text-gray-700',
  };

  const toPublicOnlyMessages = (messages: SupportTicketMessage[]): SupportTicketMessage[] =>
    messages.filter((message) => !message.isInternalNote);

  const normalizeTicket = (ticket: SupportTicket): SupportTicket => ({
    ...ticket,
    messages: toPublicOnlyMessages(ticket.messages || []),
  });

  const selectTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    navigate(`${location.pathname}?ticketId=${encodeURIComponent(ticketId)}`, { replace: true });
  };

  const fetchTickets = async () => {
    setIsLoadingTickets(true);
    setListError(null);
    try {
      const data = await listSupportTickets({ page, pageSize });
      setTickets(data.items);
      setTotalTickets(data.total);

      if (data.items.length === 0) {
        setSelectedTicketId(null);
        setSelectedTicket(null);
        navigate(location.pathname, { replace: true });
        return;
      }

      setSelectedTicketId((current) => {
        if (queryTicketId) {
          return queryTicketId;
        }
        if (current && data.items.some((item) => item.id === current)) {
          return current;
        }
        return data.items[0].id;
      });
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      setListError(apiErr?.getUserMessage() || 'Không thể tải danh sách ticket.');
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const fetchTicketDetail = async (ticketId: string) => {
    setIsLoadingDetail(true);
    setDetailError(null);
    try {
      const detail = await getSupportTicketDetail(ticketId);
      setSelectedTicket(normalizeTicket(detail));
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      setDetailError(apiErr?.getUserMessage() || 'Không thể tải chi tiết ticket.');
      setSelectedTicket(null);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (queryTicketId) {
      setSelectedTicketId(queryTicketId);
    }
  }, [queryTicketId]);

  useEffect(() => {
    void fetchTickets();
  }, [page]);

  useEffect(() => {
    if (!selectedTicketId) {
      setSelectedTicket(null);
      return;
    }
    void fetchTicketDetail(selectedTicketId);
  }, [selectedTicketId]);

  const handleTicketCreated = async (ticket: SupportTicket) => {
    if (page !== 1) {
      setPage(1);
      return;
    }

    await fetchTickets();
    selectTicket(ticket.id);
    await fetchTicketDetail(ticket.id);
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) {
      return;
    }

    try {
      setIsSendingReply(true);
      await sendSupportTicketMessage(selectedTicket.id, {
        messageBody: replyMessage.trim(),
      });
      setReplyMessage('');
      toast.success('Đã gửi phản hồi.');
      await fetchTicketDetail(selectedTicket.id);
      await fetchTickets();
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      toast.error(apiErr?.getUserMessage() || 'Không thể gửi phản hồi.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) {
      return;
    }

    try {
      setIsClosingTicket(true);
      await closeSupportTicket(selectedTicket.id);
      toast.success('Đã đóng ticket.');
      await fetchTicketDetail(selectedTicket.id);
      await fetchTickets();
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      toast.error(apiErr?.getUserMessage() || 'Không thể đóng ticket.');
    } finally {
      setIsClosingTicket(false);
    }
  };

  const formatDateTime = (value: string | null | undefined): string => {
    if (!value) return '--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleString('vi-VN');
  };

  const canCloseTicket =
    selectedTicket != null &&
    selectedTicket.status !== 'closed';

  return (
    <div className="space-y-8 pb-12">
      <AppPageHeader
        title="Trung tâm trợ giúp"
        subtitle="Tạo và theo dõi ticket hỗ trợ cá nhân"
        icon={HelpCircle}
        iconGradient="from-blue-500 to-cyan-500"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="hover-lift" onClick={() => void fetchTickets()}>
              Làm mới
            </Button>
            <Button variant="outline" className="hover-lift" onClick={() => navigate('/dashboard')}>
              Quay lại Dashboard
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="glass-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Ticket của tôi</h3>
            <Badge variant="outline">{totalTickets}</Badge>
          </div>

          {isLoadingTickets && (
            <p className="py-8 text-center text-sm text-gray-500">Đang tải danh sách ticket...</p>
          )}

          {!isLoadingTickets && listError && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-400">
              {listError}
            </div>
          )}

          {!isLoadingTickets && !listError && tickets.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 p-5 text-sm text-gray-500">
              Bạn chưa có ticket nào. Bấm "Liên hệ hỗ trợ" để tạo ticket mới.
            </div>
          )}

          {!isLoadingTickets && !listError && tickets.length > 0 && (
            <div className="space-y-2">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => selectTicket(ticket.id)}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${
                    selectedTicketId === ticket.id
                      ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 hover:border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:bg-blue-900/30'
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="line-clamp-1 text-sm font-semibold text-gray-900">{ticket.subject}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        statusBadgeClass[ticket.status] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {statusLabel[ticket.status] || ticket.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">#{ticket.ticketNumber}</p>
                  <p className="mt-1 text-xs text-gray-500">{formatDateTime(ticket.createdAt)}</p>
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoadingTickets}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Trang trước
            </Button>
            <span className="text-xs text-gray-500">Trang {page}/{totalPages}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isLoadingTickets}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Trang sau
            </Button>
          </div>
        </Card>

        <Card className="glass-card p-6">
          {!selectedTicketId && (
            <p className="py-10 text-center text-sm text-gray-500">
              Chọn một ticket để xem chi tiết.
            </p>
          )}

          {selectedTicketId && isLoadingDetail && (
            <p className="py-10 text-center text-sm text-gray-500">Đang tải chi tiết ticket...</p>
          )}

          {selectedTicketId && !isLoadingDetail && detailError && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-400">
              {detailError}
            </div>
          )}

          {selectedTicket && !isLoadingDetail && !detailError && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedTicket.subject}</h3>
                  <p className="text-sm text-gray-500">#{selectedTicket.ticketNumber}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    statusBadgeClass[selectedTicket.status] || 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {statusLabel[selectedTicket.status] || selectedTicket.status}
                </span>
              </div>

              <div className="grid gap-2 rounded-xl bg-gray-50 p-4 text-sm text-gray-600 md:grid-cols-2">
                <p>Danh mục: <span className="font-medium text-gray-800">{selectedTicket.category}</span></p>
                <p>Ưu tiên: <span className="font-medium text-gray-800">{selectedTicket.priority}</span></p>
                <p>Tạo lúc: <span className="font-medium text-gray-800">{formatDateTime(selectedTicket.createdAt)}</span></p>
                <p>Cập nhật: <span className="font-medium text-gray-800">{formatDateTime(selectedTicket.lastMessageAt || selectedTicket.createdAt)}</span></p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">Mô tả ban đầu</p>
                <p className="whitespace-pre-wrap text-sm text-gray-700">{selectedTicket.description}</p>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-gray-800">Trao đổi công khai</p>
                <div className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-gray-200 bg-white p-3">
                  {selectedTicket.messages.length === 0 ? (
                    <p className="text-sm text-gray-500">Chưa có phản hồi nào.</p>
                  ) : (
                    selectedTicket.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`rounded-lg p-3 ${
                          message.senderType === 'user'
                            ? 'bg-blue-50 dark:bg-blue-900/30'
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                            {message.senderType === 'user' ? 'Bạn' : 'Hỗ trợ'}
                          </p>
                          <p className="text-xs text-gray-500">{formatDateTime(message.createdAt)}</p>
                        </div>
                        <p className="whitespace-pre-wrap text-sm text-gray-800">{message.messageBody}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-gray-200 p-4">
                <Label htmlFor="support-reply">Phản hồi thêm</Label>
                <textarea
                  id="support-reply"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={4}
                  placeholder="Nhập tin nhắn của bạn..."
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!canCloseTicket || isClosingTicket}
                    onClick={() => void handleCloseTicket()}
                  >
                    {isClosingTicket ? 'Đang đóng...' : 'Đóng ticket'}
                  </Button>
                  <Button
                    type="button"
                    disabled={isSendingReply || replyMessage.trim().length === 0}
                    onClick={() => void handleSendReply()}
                  >
                    {isSendingReply ? 'Đang gửi...' : 'Gửi phản hồi'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
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
        onCreated={(ticket) => void handleTicketCreated(ticket)}
      />
    </div>
  );
};
