using MediatR;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Interviews;
using Interviet.Shared.Results;
using Interviet.Domain.Interviews;

namespace Interviet.Application.Interviews.Commands.SubmitInterviewMessage;

public sealed record SubmitInterviewMessageCommand(
    Guid SessionId, Guid UserId,
    string CorrelationId,
    SubmitInterviewMessageRequest Request) : IRequest<Result<SubmitInterviewMessageResponse>>;

public sealed class SubmitInterviewMessageCommandHandler
    : IRequestHandler<SubmitInterviewMessageCommand, Result<SubmitInterviewMessageResponse>>
{
    private readonly IAppDbContext       _db;
    private readonly IAiInterviewClient  _aiClient;
    private readonly IActivityLogger     _actLog;
    private readonly IDateTimeProvider   _dt;
    private readonly ILogger<SubmitInterviewMessageCommandHandler> _logger;

    public SubmitInterviewMessageCommandHandler(
        IAppDbContext db, IAiInterviewClient aiClient,
        IActivityLogger actLog, IDateTimeProvider dt,
        ILogger<SubmitInterviewMessageCommandHandler> logger)
    {
        _db       = db;
        _aiClient = aiClient;
        _actLog   = actLog;
        _dt       = dt;
        _logger   = logger;
    }

    public async Task<Result<SubmitInterviewMessageResponse>> Handle(
        SubmitInterviewMessageCommand command, CancellationToken ct)
    {
        var req = command.Request;

        // ── Validate input ───────────────────────────────────────────────────
        if (string.IsNullOrWhiteSpace(req.AnswerText) && string.IsNullOrWhiteSpace(req.AudioFileUrl))
            return Error.Validation("Interview.AnswerRequired",
                "Vui lòng cung cấp câu trả lời văn bản hoặc URL audio.");

        var session = await _db.InterviewSessions
            .Include(s => s.Questions)
                .ThenInclude(q => q.Answer)
            .FirstOrDefaultAsync(s => s.Id == command.SessionId, ct);

        if (session is null)
            return Error.NotFound("Interview.NotFound", "Không tìm thấy phiên phỏng vấn.");
        if (session.UserId != command.UserId)
            return Error.Forbidden("Interview.Forbidden", "Bạn không có quyền truy cập phiên phỏng vấn này.");
        if (session.Status != InterviewSessionStatus.Live)
            return Error.Validation("Interview.InvalidStatus",
                "Chỉ có thể gửi câu trả lời khi phiên phỏng vấn đang diễn ra.");

        var now = _dt.UtcNow;

        // ── Resolve current question ─────────────────────────────────────────
        InterviewQuestion? currentQuestion;
        if (req.QuestionId.HasValue)
        {
            currentQuestion = session.Questions.FirstOrDefault(q => q.Id == req.QuestionId.Value);
            if (currentQuestion is null)
                return Error.NotFound("Interview.QuestionNotFound", "Câu hỏi không thuộc phiên phỏng vấn này.");
            if (currentQuestion.InterviewSessionId != session.Id)
                return Error.Forbidden("Interview.QuestionForbidden", "Câu hỏi không thuộc phiên phỏng vấn này.");
        }
        else
        {
            // Find the latest question without an answer
            currentQuestion = session.Questions
                .Where(q => q.Answer is null)
                .OrderBy(q => q.QuestionNumber)
                .FirstOrDefault();
        }

        if (currentQuestion is null)
            return Error.Validation("Interview.NoOpenQuestion", "Không có câu hỏi nào đang chờ trả lời.");

        if (currentQuestion.Answer is not null)
            return Error.Validation("Interview.AlreadyAnswered", "Câu hỏi này đã được trả lời rồi.");

        // ── Save answer ──────────────────────────────────────────────────────
        var answer = new InterviewAnswer
        {
            Id                    = Guid.NewGuid(),
            InterviewQuestionId   = currentQuestion.Id,
            AnswerText            = req.AnswerText,
            AudioFileUrl          = req.AudioFileUrl,
            AudioDurationSeconds  = req.AudioDurationSeconds,
            AnsweredAt            = now,
            CreatedAt             = now
        };

        _db.InterviewAnswers.Add(answer);

        // ── Build conversation history for next question ──────────────────────
        var history = session.Questions
            .Where(q => q.Answer is not null)
            .OrderBy(q => q.QuestionNumber)
            .Select(q => new { question = q.QuestionText, answer = q.Answer!.AnswerText })
            .ToList<object>();
        // Add current answer to history
        history.Add(new { question = currentQuestion.QuestionText, answer = req.AnswerText });

        int nextNumber = currentQuestion.QuestionNumber + 1;
        int total      = CalculateTotalQuestions(session.DurationMinutes);

        InterviewQuestion? nextQuestion = null;
        bool hasNext = nextNumber <= total;

        if (hasNext)
        {
            // ── Call Python for next question ────────────────────────────────
            var aiResult = await _aiClient.GenerateQuestionAsync(new AiGenerateQuestionRequest
            {
                SessionId               = session.Id,
                UserId                  = command.UserId,
                CorrelationId           = command.CorrelationId,
                RequestId               = Guid.NewGuid().ToString("N"),
                Position                = session.RoleName,
                Level                   = session.SeniorityLevel,
                Goal                    = session.Goal,
                InterviewType           = session.InterviewType,
                InterviewerMode         = session.InterviewerMode,
                AiModel                 = session.AiModel,
                ConversationHistoryJson = JsonSerializer.Serialize(history),
                QuestionNumber          = nextNumber,
                TotalExpectedQuestions  = total
            }, ct);

            if (!aiResult.IsSuccess)
            {
                _logger.LogWarning(
                    "AI failed to generate Q#{Num} for SessionId={SessionId} ErrorCode={Code}",
                    nextNumber, session.Id, aiResult.ErrorCode);

                if (aiResult.IsServiceUnavailable)
                    return Error.Failure("Interview.ServiceUnavailable",
                        "Dịch vụ AI phỏng vấn hiện chưa sẵn sàng. Câu trả lời đã lưu, vui lòng thử lại.");

                return Error.Failure(aiResult.ErrorCode ?? "QUESTION_GENERATION_FAILED",
                    aiResult.ErrorMessage ?? "Không thể tạo câu hỏi tiếp theo.");
            }

            nextQuestion = new InterviewQuestion
            {
                Id                       = Guid.NewGuid(),
                InterviewSessionId       = session.Id,
                QuestionNumber           = nextNumber,
                QuestionType             = aiResult.QuestionType ?? "technical",
                QuestionText             = aiResult.QuestionText!,
                Difficulty               = aiResult.Difficulty,
                ExpectedAnswerPointsJson = aiResult.ExpectedAnswerPointsJson,
                AskedAt                  = now,
                CreatedAt                = now
            };
            _db.InterviewQuestions.Add(nextQuestion);
        }

        session.UpdatedAt = now;
        await _db.SaveChangesAsync(ct);

        // ── Activity log (non-critical) ──────────────────────────────────────
        try
        {
            await _actLog.LogAsync(command.UserId, ActivityActionKeys.InterviewAnswerSubmitted,
                entityType: "InterviewSession", entityId: session.Id,
                description: $"Câu trả lời Q#{currentQuestion.QuestionNumber} đã được ghi nhận.");
        }
        catch (Exception ex) { _logger.LogWarning(ex, "Activity log failed for interview_answer_submitted"); }

        return Result<SubmitInterviewMessageResponse>.Success(new SubmitInterviewMessageResponse
        {
            SessionId       = session.Id,
            AnswerId        = answer.Id,
            Status          = session.Status,
            HasNextQuestion = hasNext,
            NextQuestion    = nextQuestion is null ? null : new InterviewQuestionResponse
            {
                QuestionId     = nextQuestion.Id,
                QuestionNumber = nextQuestion.QuestionNumber,
                QuestionType   = nextQuestion.QuestionType,
                QuestionText   = nextQuestion.QuestionText,
                Difficulty     = nextQuestion.Difficulty,
                AskedAt        = nextQuestion.AskedAt,
                HasAnswer      = false
            }
        });
    }

    private static int CalculateTotalQuestions(int durationMinutes) => Math.Max(3, durationMinutes / 5);
}
