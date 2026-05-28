import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AppPageHeader } from '../components/design-system/AppPageHeader';
import { ApiError } from '../../lib/api/apiError';
import {
  completeInterview,
  getInterview,
  type InterviewQuestion,
  type InterviewSession,
} from '../../services/interviewService';

const STATUS_LABELS: Record<string, string> = {
  live: 'Đang diễn ra',
  processing: 'Đang xử lý',
  completed: 'Hoàn tất',
  failed: 'Thất bại',
  cancelled: 'Đã hủy',
  abandoned: 'Đã bỏ dở',
};

export const InterviewDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      } catch (err) {
        const apiErr = err instanceof ApiError ? err : null;
        setError(apiErr?.getUserMessage() || 'Không thể tải chi tiết phiên phỏng vấn.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id, navigate]);

  const nextQuestion = resolveNextQuestion(session);
  const canComplete = (session?.answeredCount ?? 0) > 0 && !nextQuestion;

  const handleComplete = () => {
    if (!session || !id) return;
    if ((session.answeredCount ?? 0) < 1) {
      setError('Bạn cần trả lời ít nhất 1 câu trước khi hoàn tất.');
      return;
    }
    setShowCompleteConfirm(true);
  };

  const confirmComplete = async () => {
    if (!id) return;
    setShowCompleteConfirm(false);
    setIsSubmitting(true);
    setError(null);
    try {
      await completeInterview(id);
      navigate(`/phong-van-report/${id}`);
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      setError(apiErr?.getUserMessage() || 'Không thể hoàn tất phỏng vấn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <AppPageHeader title="Chi tiết phỏng vấn" subtitle="Đang tải" />
        <Card className="glass-card p-6">Đang tải dữ liệu...</Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <AppPageHeader title="Chi tiết phỏng vấn" subtitle="Có lỗi xảy ra" />
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4">
          <div className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button variant="outline" onClick={() => navigate('/bao-cao')}>
              Quay lại
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <AppPageHeader
        title={session?.position || 'Chi tiết phỏng vấn'}
        subtitle={session?.status ? STATUS_LABELS[String(session.status).toLowerCase()] || session.status : ''}
      />

      <Card className="glass-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">{session?.level || 'N/A'}</Badge>
          <Badge variant="secondary">{session?.interviewType || 'N/A'}</Badge>
          <Badge variant="secondary">{session?.interviewerMode || 'N/A'}</Badge>
          <Badge variant="secondary">{session?.aiModel || 'N/A'}</Badge>
        </div>
        <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span>Thời lượng</span>
            <strong>{session?.durationMinutes} phút</strong>
          </div>
          <div className="flex items-center justify-between">
            <span>Đã trả lời</span>
            <strong>{session?.answeredCount ?? 0}/{session?.totalExpectedQuestions ?? 0}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span>Ngày tạo</span>
            <strong>{session?.createdAt ? new Date(session.createdAt).toLocaleString('vi-VN') : 'N/A'}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span>Ngày hoàn tất</span>
            <strong>{session?.completedAt ? new Date(session.completedAt).toLocaleString('vi-VN') : 'Chưa hoàn tất'}</strong>
          </div>
        </div>
      </Card>

      {session?.report && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">Báo cáo phỏng vấn</h3>
              <p className="text-sm text-gray-600">Đã có báo cáo cho phiên này.</p>
            </div>
            <Button onClick={() => id && navigate(`/phong-van-report/${id}`)}>
              Xem báo cáo
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="font-bold mb-4">Danh sách câu hỏi</h3>
        {session?.questions && session.questions.length > 0 ? (
          <div className="space-y-4">
            {session.questions.map((q) => {
              const answer = session.answers?.find((a) => a.questionId === q.questionId);
              return (
                <div key={q.questionId} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{q.questionNumber}. {q.questionText}</p>
                      <div className="text-xs text-gray-500 mt-1">
                        {q.questionType} • {q.difficulty}
                      </div>
                    </div>
                    <Badge variant="secondary">{answer ? 'Đã trả lời' : 'Chưa trả lời'}</Badge>
                  </div>
                  {q.expectedAnswerPoints && q.expectedAnswerPoints.length > 0 && (
                    <ul className="mt-2 text-sm text-gray-600 space-y-1">
                      {q.expectedAnswerPoints.map((point, index) => (
                        <li key={`${q.questionId}-point-${index}`}>• {point}</li>
                      ))}
                    </ul>
                  )}
                  <p className="text-sm text-gray-700 mt-2">
                    {answer?.answerText || 'Chưa có câu trả lời'}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Chưa có câu hỏi.</p>
        )}
      </Card>

      <div className="flex flex-wrap gap-3">
        {String(session?.status).toLowerCase() === 'live' && id && (
          <Button onClick={() => navigate(`/phong-van-live/${id}`)}>
            Tiếp tục phỏng vấn
          </Button>
        )}
        {canComplete && (
          <Button variant="outline" onClick={handleComplete} disabled={isSubmitting}>
            Hoàn tất phỏng vấn
          </Button>
        )}
        <Button variant="ghost" onClick={() => navigate('/bao-cao')}>
          Quay lại lịch sử
        </Button>
      </div>

      <Dialog open={showCompleteConfirm} onOpenChange={setShowCompleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hoàn tất phỏng vấn?</DialogTitle>
            <DialogDescription>
              Bạn chưa có câu hỏi mới. Bạn chắc chắn muốn hoàn tất?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button onClick={confirmComplete} disabled={isSubmitting}>
              Hoàn tất
            </Button>
            <Button variant="outline" onClick={() => setShowCompleteConfirm(false)}>
              Hủy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function resolveNextQuestion(session: InterviewSession | null): InterviewQuestion | null {
  if (!session?.questions || session.questions.length === 0) return null;
  const answeredIds = new Set((session.answers || []).map((answer) => answer.questionId));
  return session.questions.find((q) => !answeredIds.has(q.questionId)) || null;
}
