using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Interviews;
using Interviet.Shared.Results;
using Interviet.Domain.Interviews;

namespace Interviet.Application.Interviews.Commands.StartInterview;

public sealed record StartInterviewCommand(Guid SessionId, Guid UserId, string CorrelationId)
    : IRequest<Result<StartInterviewResponse>>;

public sealed class StartInterviewCommandHandler
    : IRequestHandler<StartInterviewCommand, Result<StartInterviewResponse>>
{
    private readonly IAppDbContext       _db;
    private readonly IAiInterviewClient  _aiClient;
    private readonly IDateTimeProvider   _dt;
    private readonly ILogger<StartInterviewCommandHandler> _logger;

    public StartInterviewCommandHandler(
        IAppDbContext db, IAiInterviewClient aiClient,
        IDateTimeProvider dt, ILogger<StartInterviewCommandHandler> logger)
    {
        _db       = db;
        _aiClient = aiClient;
        _dt       = dt;
        _logger   = logger;
    }

    public async Task<Result<StartInterviewResponse>> Handle(StartInterviewCommand command, CancellationToken ct)
    {
        var session = await _db.InterviewSessions
            .Include(s => s.Questions)
            .FirstOrDefaultAsync(s => s.Id == command.SessionId, ct);

        if (session is null)
            return Error.NotFound("Interview.NotFound", "Không tìm thấy phiên phỏng vấn.");
        if (session.UserId != command.UserId)
            return Error.Forbidden("Interview.Forbidden", "Bạn không có quyền truy cập phiên phỏng vấn này.");

        // ── State machine guard ──────────────────────────────────────────────
        if (session.Status == InterviewSessionStatus.Completed)
            return Error.Conflict("Interview.AlreadyCompleted",
                "Phiên phỏng vấn đã hoàn thành. Xem báo cáo tại GET /api/v1/interviews/{id}.");
        if (session.Status == InterviewSessionStatus.Cancelled)
            return Error.Conflict("Interview.Cancelled", "Phiên phỏng vấn đã bị hủy.");
        if (session.Status == InterviewSessionStatus.Abandoned)
            return Error.Conflict("Interview.Abandoned", "Phiên phỏng vấn đã bị bỏ dở.");
        if (session.Status == InterviewSessionStatus.Failed)
            return Error.Conflict("Interview.Failed", "Phiên phỏng vấn đã thất bại. Tạo phiên mới để thử lại.");
        if (session.Status != InterviewSessionStatus.Live)
            return Error.Validation("Interview.InvalidStatus",
                $"Phiên phỏng vấn ở trạng thái '{session.Status}', không thể bắt đầu.");

        // ── Idempotent: already started — return existing first question ──────
        if (session.Questions.Count > 0)
        {
            var existing = session.Questions.OrderBy(q => q.QuestionNumber).First();
            return Result<StartInterviewResponse>.Success(new StartInterviewResponse
            {
                SessionId     = session.Id,
                Status        = session.Status,
                StartedAt     = session.StartedAt ?? _dt.UtcNow,
                FirstQuestion = MapQuestion(existing)
            });
        }

        var now   = _dt.UtcNow;
        var total = CalculateTotalQuestions(session.DurationMinutes);

        // ── Call Python AI ───────────────────────────────────────────────────
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
            ConversationHistoryJson = null,
            QuestionNumber          = 1,
            TotalExpectedQuestions  = total
        }, ct);

        if (!aiResult.IsSuccess)
        {
            _logger.LogWarning("AI failed to generate Q#1 for SessionId={SessionId} Code={Code}",
                session.Id, aiResult.ErrorCode);
            return MapAiError(aiResult.ErrorCode, aiResult.ErrorMessage, aiResult.IsServiceUnavailable);
        }

        // ── Save first question ──────────────────────────────────────────────
        var question = new InterviewQuestion
        {
            Id                       = Guid.NewGuid(),
            InterviewSessionId       = session.Id,
            QuestionNumber           = 1,
            QuestionType             = aiResult.QuestionType ?? "opening",
            QuestionText             = aiResult.QuestionText!,
            Difficulty               = aiResult.Difficulty,
            ExpectedAnswerPointsJson = aiResult.ExpectedAnswerPointsJson,
            AskedAt                  = now,
            CreatedAt                = now
        };

        session.StartedAt = now;
        session.UpdatedAt = now;

        _db.InterviewQuestions.Add(question);
        await _db.SaveChangesAsync(ct);

        return Result<StartInterviewResponse>.Success(new StartInterviewResponse
        {
            SessionId     = session.Id,
            Status        = session.Status,
            StartedAt     = now,
            FirstQuestion = MapQuestion(question)
        });
    }

    internal static InterviewQuestionResponse MapQuestion(InterviewQuestion q) => new()
    {
        QuestionId           = q.Id,
        QuestionNumber       = q.QuestionNumber,
        QuestionType         = q.QuestionType,
        QuestionText         = q.QuestionText,
        Difficulty           = q.Difficulty,
        ExpectedAnswerPoints = JsonParseHelper.ParseStringArray(q.ExpectedAnswerPointsJson),
        AskedAt              = q.AskedAt,
        HasAnswer            = q.Answer is not null
    };

    internal static Error MapAiError(string? errorCode, string? errorMessage, bool isUnavailable)
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

    internal static int CalculateTotalQuestions(int durationMinutes) => Math.Max(3, durationMinutes / 5);
}
