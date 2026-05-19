import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { AppPageHeader } from '../components/design-system/AppPageHeader';
import { ApiError } from '../../lib/api/apiError';
import {
  completeInterview,
  getInterview,
  startInterview,
  submitMessage,
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

export const InterviewLivePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [question, setQuestion] = useState<InterviewQuestion | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canComplete, setCanComplete] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  const answeredCount = session?.answeredCount ?? 0;
  const totalExpectedQuestions = session?.totalExpectedQuestions ?? 0;

  const statusLabel = session?.status
    ? STATUS_LABELS[String(session.status).toLowerCase()] || session.status
    : 'Đang tải';

  const progressLabel = useMemo(() => {
    if (!totalExpectedQuestions) return null;
    return `${answeredCount}/${totalExpectedQuestions}`;
  }, [answeredCount, totalExpectedQuestions]);

  useEffect(() => {
    if (!id) {
      navigate('/phong-van-setup');
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [detail, start] = await Promise.all([
          getInterview(id),
          startInterview(id),
        ]);

        setSession(detail);
        if (start.question) {
          setQuestion(start.question);
        } else {
          const fallbackQuestion = resolveNextQuestion(detail);
          setQuestion(fallbackQuestion);
        }

        setCanComplete((start.answeredCount ?? detail.answeredCount ?? 0) > 0);
      } catch (err) {
        const apiErr = err instanceof ApiError ? err : null;
        setError(apiErr?.getUserMessage() || 'Không thể tải phiên phỏng vấn.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [id, navigate]);

  const resolveNextQuestion = (detail: InterviewSession | null): InterviewQuestion | null => {
    if (!detail?.questions || detail.questions.length === 0) return null;
    const answeredIds = new Set((detail.answers || []).map((a) => a.questionId));
    return detail.questions.find((q) => !answeredIds.has(q.questionId)) || null;
  };

  const handleSubmit = async () => {
    if (!id || !question) return;
    const trimmed = answerText.trim();
    if (!trimmed) {
      setError('Vui lòng nhập câu trả lời trước khi gửi.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await submitMessage(id, {
        questionId: question.questionId,
        answerText: trimmed,
        audioFileUrl: null,
        audioDurationSeconds: null,
      });

      setSession((prev) =>
        prev
          ? {
              ...prev,
              answeredCount: response.answeredCount,
              totalExpectedQuestions: response.totalExpectedQuestions,
            }
          : prev
      );

      if (response.nextQuestion) {
        setQuestion(response.nextQuestion);
        setAnswerText('');
        setCanComplete(response.canComplete ?? false);
      } else {
        setQuestion(null);
        setCanComplete(response.canComplete ?? false);
      }
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      if (apiErr?.status === 409 && id) {
        await handleConflict(id, apiErr);
      } else {
        setError(apiErr?.getUserMessage() || 'Không thể gửi câu trả lời.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConflict = async (sessionId: string, apiErr: ApiError) => {
    try {
      const detail = await getInterview(sessionId);
      setSession(detail);
      const nextQuestion = resolveNextQuestion(detail);
      setQuestion(nextQuestion);
      setCanComplete((detail.answeredCount ?? 0) > 0 && !nextQuestion);
      setAnswerText('');
      setError(apiErr.getUserMessage());
      if (String(detail.status).toLowerCase() === 'completed') {
        navigate(`/phong-van-report/${sessionId}`);
      }
    } catch (error) {
      const fallbackErr = error instanceof ApiError ? error : null;
      setError(fallbackErr?.getUserMessage() || apiErr.getUserMessage());
    }
  };

  const handleComplete = () => {
    if (answeredCount < 1) {
      setError('Bạn cần trả lời ít nhất 1 câu trước khi hoàn tất.');
      return;
    }

    if (totalExpectedQuestions && answeredCount < totalExpectedQuestions) {
      setShowCompleteConfirm(true);
      return;
    }

    void confirmComplete();
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

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <AppPageHeader
          title="Phỏng vấn AI"
          subtitle="Đang tải phiên phỏng vấn"
        />
        <Card className="glass-card p-6">Đang tải dữ liệu...</Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <AppPageHeader
        title={session?.position || 'Phỏng vấn AI'}
        subtitle={statusLabel}
      />

      <Card className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">{session?.level || 'N/A'}</Badge>
          <Badge variant="secondary">{session?.interviewType || 'N/A'}</Badge>
          <Badge variant="secondary">{session?.interviewerMode || 'N/A'}</Badge>
          <Badge variant="secondary">{session?.aiModel || 'N/A'}</Badge>
          {progressLabel && <Badge variant="outline">{progressLabel}</Badge>}
        </div>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50 text-red-700 p-4">
          {error}
        </Card>
      )}

      {question ? (
        <Card className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Câu hỏi {question.questionNumber}</p>
              <h3 className="text-xl font-semibold">{question.questionText}</h3>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="secondary">{question.difficulty}</Badge>
              <span className="text-xs text-gray-500">{question.questionType}</span>
            </div>
          </div>

          {question.expectedAnswerPoints && question.expectedAnswerPoints.length > 0 && (
            <details className="rounded-lg border border-gray-200 p-3">
              <summary className="cursor-pointer text-sm font-medium">
                Gợi ý nội dung cần có
              </summary>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                {question.expectedAnswerPoints.map((point, index) => (
                  <li key={`${question.questionId}-${index}`}>• {point}</li>
                ))}
              </ul>
            </details>
          )}

          <Textarea
            value={answerText}
            onChange={(event) => setAnswerText(event.target.value)}
            placeholder="Nhập câu trả lời của bạn..."
            rows={6}
          />

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSubmit} disabled={isSubmitting || !answerText.trim()}>
              {isSubmitting ? 'Đang gửi...' : 'Gửi câu trả lời'}
            </Button>
            <Button
              variant="outline"
              onClick={handleComplete}
              disabled={isSubmitting || answeredCount < 1}
            >
              Hoàn tất phỏng vấn
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="glass-card p-6">
          <p className="text-gray-700">
            {canComplete
              ? 'Không còn câu hỏi tiếp theo. Bạn có thể hoàn tất phỏng vấn.'
              : 'Đang chờ câu hỏi tiếp theo. Vui lòng thử lại sau.'}
          </p>
          <div className="mt-4 flex gap-3">
            {canComplete && (
              <Button onClick={handleComplete} disabled={isSubmitting}>
                Hoàn tất phỏng vấn
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/bao-cao')}>
              Xem lịch sử
            </Button>
          </div>
        </Card>
      )}

      <Dialog open={showCompleteConfirm} onOpenChange={setShowCompleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hoàn tất sớm?</DialogTitle>
            <DialogDescription>
              Bạn chưa trả lời hết số câu dự kiến. Bạn vẫn muốn hoàn tất?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button onClick={confirmComplete} disabled={isSubmitting}>
              Hoàn tất
            </Button>
            <Button variant="outline" onClick={() => setShowCompleteConfirm(false)}>
              Tiếp tục trả lời
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
