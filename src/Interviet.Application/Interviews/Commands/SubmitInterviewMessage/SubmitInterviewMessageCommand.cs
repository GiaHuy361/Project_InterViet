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

        // ── Validate answer payload ──────────────────────────────────────────
        if (string.IsNullOrWhiteSpace(req.AnswerText) && string.IsNullOrWhiteSpace(req.AudioFileUrl))
            return Error.Validation("Interview.AnswerRequired",
                "Vui lòng cung cấp câu trả lời văn bản (answerText) hoặc URL audio (audioFileUrl).");

        var session = await _db.InterviewSessions
            .Include(s => s.Questions)
                .ThenInclude(q => q.Answer)
            .FirstOrDefaultAsync(s => s.Id == command.SessionId, ct);

        if (session is null)
            return Error.NotFound("Interview.NotFound", "Không tìm thấy phiên phỏng vấn.");
        if (session.UserId != command.UserId)
            return Error.Forbidden("Interview.Forbidden", "Bạn không có quyền truy cập phiên phỏng vấn này.");

        // ── State machine guard ──────────────────────────────────────────────
        if (session.Status != InterviewSessionStatus.Live)
            return Error.Validation("Interview.InvalidStatus",
                $"Chỉ có thể gửi câu trả lời khi phiên phỏng vấn đang diễn ra (trạng thái: '{session.Status}').");

        var now = _dt.UtcNow;

        // ── Resolve current question ─────────────────────────────────────────
        InterviewQuestion? currentQuestion;
        if (req.QuestionId.HasValue)
        {
            currentQuestion = session.Questions.FirstOrDefault(q => q.Id == req.QuestionId.Value);
            if (currentQuestion is null)
                return Error.NotFound("Interview.QuestionNotFound",
                    "Câu hỏi không tồn tại hoặc không thuộc phiên phỏng vấn này.");
            // Double-check ownership
            if (currentQuestion.InterviewSessionId != session.Id)
                return Error.Forbidden("Interview.QuestionForbidden",
                    "Câu hỏi không thuộc phiên phỏng vấn này.");
        }
        else
        {
            currentQuestion = session.Questions
                .Where(q => q.Answer is null)
                .OrderBy(q => q.QuestionNumber)
                .FirstOrDefault();
        }

        if (currentQuestion is null)
            return Error.Validation("Interview.NoOpenQuestion",
                "Không có câu hỏi nào đang chờ trả lời. Gọi POST /complete để kết thúc phỏng vấn.");

        // ── Guard: no duplicate answers ──────────────────────────────────────
        if (currentQuestion.Answer is not null)
            return Error.Conflict("Interview.AlreadyAnswered",
                $"Câu hỏi #{currentQuestion.QuestionNumber} đã được trả lời rồi.");

        // ── text mode requires answerText ────────────────────────────────────
        if (string.Equals(session.Mode, "text", StringComparison.OrdinalIgnoreCase)
            && string.IsNullOrWhiteSpace(req.AnswerText))
            return Error.Validation("Interview.TextAnswerRequired",
                "Chế độ text yêu cầu phải có answerText.");

        // ── Save answer ──────────────────────────────────────────────────────
        var answer = new InterviewAnswer
        {
            Id                   = Guid.NewGuid(),
            InterviewQuestionId  = currentQuestion.Id,
            AnswerText           = req.AnswerText,
            AudioFileUrl         = req.AudioFileUrl,
            AudioDurationSeconds = req.AudioDurationSeconds,
            AnsweredAt           = now,
            CreatedAt            = now
        };
        _db.InterviewAnswers.Add(answer);

        // ── Build conversation history ────────────────────────────────────────
        var history = session.Questions
            .Where(q => q.Answer is not null)
            .OrderBy(q => q.QuestionNumber)
            .Select(q => new { question = q.QuestionText, answer = q.Answer!.AnswerText })
            .ToList<object>();
        history.Add(new { question = currentQuestion.QuestionText, answer = req.AnswerText });

        int nextNumber = currentQuestion.QuestionNumber + 1;
        int total      = CalculateTotalQuestions(session.DurationMinutes);
        bool hasNext   = nextNumber <= total;

        InterviewQuestion? nextQuestion = null;

        if (hasNext)
        {
            // ── Generate next question from Python ───────────────────────────
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
                _logger.LogWarning("AI failed to generate Q#{Num} for SessionId={SessionId} Code={Code}",
                    nextNumber, session.Id, aiResult.ErrorCode);
                // Save the answer regardless — do NOT lose user's answer
                session.UpdatedAt = now;
                await _db.SaveChangesAsync(ct);
                return MapAiError(aiResult.ErrorCode, aiResult.ErrorMessage, aiResult.IsServiceUnavailable);
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
                QuestionId           = nextQuestion.Id,
                QuestionNumber       = nextQuestion.QuestionNumber,
                QuestionType         = nextQuestion.QuestionType,
                QuestionText         = nextQuestion.QuestionText,
                Difficulty           = nextQuestion.Difficulty,
                ExpectedAnswerPoints = JsonParseHelper.ParseStringArray(nextQuestion.ExpectedAnswerPointsJson),
                AskedAt              = nextQuestion.AskedAt,
                HasAnswer            = false
            }
        });
    }

    private static int CalculateTotalQuestions(int durationMinutes) => Math.Max(3, durationMinutes / 5);

    private static Error MapAiError(string? errorCode, string? errorMessage, bool isUnavailable)
    {
        if (isUnavailable || string.Equals(errorCode, "SERVICE_UNAVAILABLE", StringComparison.OrdinalIgnoreCase))
            return Error.ServiceUnavailable("Interview.ServiceUnavailable",
                "Dịch vụ AI phỏng vấn hiện chưa sẵn sàng. Vui lòng thử lại sau.");
        if (string.Equals(errorCode, "RATE_LIMIT_EXCEEDED", StringComparison.OrdinalIgnoreCase))
            return Error.TooManyRequests("Interview.RateLimitExceeded",
                "Hệ thống đang xử lý quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.");
        if (string.Equals(errorCode, "VALIDATION_ERROR", StringComparison.OrdinalIgnoreCase))
            return Error.Validation("Interview.PythonValidation", errorMessage ?? "Dữ liệu gửi lên không hợp lệ.");
        return Error.Failure(errorCode ?? "QUESTION_GENERATION_FAILED",
            errorMessage ?? "Không thể tạo câu hỏi phỏng vấn.");
    }
}
