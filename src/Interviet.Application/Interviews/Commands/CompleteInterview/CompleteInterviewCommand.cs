using MediatR;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Interviews;
using Interviet.Shared.Results;
using Interviet.Domain.Interviews;

namespace Interviet.Application.Interviews.Commands.CompleteInterview;

public sealed record CompleteInterviewCommand(Guid SessionId, Guid UserId, string CorrelationId)
    : IRequest<Result<CompleteInterviewResponse>>;

public sealed class CompleteInterviewCommandHandler
    : IRequestHandler<CompleteInterviewCommand, Result<CompleteInterviewResponse>>
{
    private readonly IAppDbContext       _db;
    private readonly IAiInterviewClient  _aiClient;
    private readonly IActivityLogger     _actLog;
    private readonly IDateTimeProvider   _dt;
    private readonly ILogger<CompleteInterviewCommandHandler> _logger;

    public CompleteInterviewCommandHandler(
        IAppDbContext db, IAiInterviewClient aiClient,
        IActivityLogger actLog, IDateTimeProvider dt,
        ILogger<CompleteInterviewCommandHandler> logger)
    {
        _db       = db;
        _aiClient = aiClient;
        _actLog   = actLog;
        _dt       = dt;
        _logger   = logger;
    }

    public async Task<Result<CompleteInterviewResponse>> Handle(CompleteInterviewCommand command, CancellationToken ct)
    {
        var session = await _db.InterviewSessions
            .Include(s => s.Questions)
                .ThenInclude(q => q.Answer)
            .Include(s => s.Report)
            .FirstOrDefaultAsync(s => s.Id == command.SessionId, ct);

        if (session is null)
            return Error.NotFound("Interview.NotFound", "Không tìm thấy phiên phỏng vấn.");
        if (session.UserId != command.UserId)
            return Error.Forbidden("Interview.Forbidden", "Bạn không có quyền truy cập phiên phỏng vấn này.");

        // ── Idempotent: already completed — return existing report ────────────
        if (session.Status == InterviewSessionStatus.Completed && session.Report is not null)
        {
            return Result<CompleteInterviewResponse>.Success(new CompleteInterviewResponse
            {
                SessionId   = session.Id,
                Status      = session.Status,
                CompletedAt = session.CompletedAt,
                Report      = BuildReportResponse(session.Report),
                Message     = "Phiên phỏng vấn đã hoàn thành trước đó."
            });
        }

        // ── State machine guards ─────────────────────────────────────────────
        if (session.Status == InterviewSessionStatus.Cancelled)
            return Error.Conflict("Interview.Cancelled", "Phiên phỏng vấn đã bị hủy.");
        if (session.Status == InterviewSessionStatus.Abandoned)
            return Error.Conflict("Interview.Abandoned", "Phiên phỏng vấn đã bị bỏ dở.");
        if (session.Status == InterviewSessionStatus.Failed)
            return Error.Conflict("Interview.Failed",
                "Phiên phỏng vấn đã thất bại trong lần trước. Tạo phiên mới để thử lại.");
        if (session.Status != InterviewSessionStatus.Live)
            return Error.Validation("Interview.InvalidStatus",
                $"Phiên phỏng vấn ở trạng thái '{session.Status}', không thể hoàn thành.");

        var now = _dt.UtcNow;

        // ── Require at least one answered question ────────────────────────────
        var answeredQuestions = session.Questions
            .Where(q => q.Answer is not null)
            .OrderBy(q => q.QuestionNumber)
            .ToList();

        if (answeredQuestions.Count == 0)
            return Error.Validation("Interview.NoAnswers",
                "Phiên phỏng vấn chưa có câu trả lời nào. Vui lòng trả lời ít nhất một câu hỏi trước khi hoàn thành.");

        // ── Build transcript ─────────────────────────────────────────────────
        var transcript = session.Questions
            .OrderBy(q => q.QuestionNumber)
            .Select(q => new
            {
                questionNumber = q.QuestionNumber,
                questionType   = q.QuestionType,
                question       = q.QuestionText,
                answer         = q.Answer?.AnswerText,
                answeredAt     = q.Answer?.AnsweredAt
            }).ToList();

        // ── Mark processing ──────────────────────────────────────────────────
        session.Status    = InterviewSessionStatus.Processing;
        session.UpdatedAt = now;
        await _db.SaveChangesAsync(ct);

        // ── Call Python for analysis ─────────────────────────────────────────
        var aiResult = await _aiClient.AnalyzeInterviewAsync(new AiAnalyzeInterviewRequest
        {
            SessionId      = session.Id,
            UserId         = command.UserId,
            CorrelationId  = command.CorrelationId,
            RequestId      = Guid.NewGuid().ToString("N"),
            Position       = session.RoleName,
            Level          = session.SeniorityLevel,
            Goal           = session.Goal,
            InterviewType  = session.InterviewType,
            AiModel        = session.AiModel,
            TranscriptJson = JsonSerializer.Serialize(transcript)
        }, ct);

        if (aiResult.IsSuccess)
        {
            // ── Save report ──────────────────────────────────────────────────
            var report = new InterviewReport
            {
                Id                  = Guid.NewGuid(),
                InterviewSessionId  = session.Id,
                OverallScore        = aiResult.OverallScore,
                ConfidenceScore     = aiResult.ConfidenceScore,
                VoiceClarityScore   = aiResult.ClarityScore,
                StrengthsJson       = aiResult.StrengthsJson,
                WeaknessesJson      = aiResult.WeaknessesJson,
                RecommendationsJson = aiResult.RecommendationsJson,
                ModelVersion        = aiResult.ModelVersion,
                SchemaVersion       = aiResult.SchemaVersion,
                CreatedAt           = now,
                UpdatedAt           = now
            };
            _db.InterviewReports.Add(report);

            session.Status      = InterviewSessionStatus.Completed;
            session.CompletedAt = now;
            session.UpdatedAt   = now;

            await _db.SaveChangesAsync(ct);

            try
            {
                await _actLog.LogAsync(command.UserId, ActivityActionKeys.InterviewCompleted,
                    entityType: "InterviewSession", entityId: session.Id,
                    description: $"Phiên phỏng vấn hoàn thành. Điểm: {aiResult.OverallScore:F1}.");
            }
            catch { /* non-critical */ }

            return Result<CompleteInterviewResponse>.Success(new CompleteInterviewResponse
            {
                SessionId   = session.Id,
                Status      = InterviewSessionStatus.Completed,
                CompletedAt = now,
                Report      = BuildReportResponse(report, aiResult)
            });
        }
        else
        {
            // ── Python failed — mark failed, NO fake report ───────────────────
            _logger.LogWarning("AI analysis failed for SessionId={SessionId} Code={Code}",
                session.Id, aiResult.ErrorCode);

            session.Status       = InterviewSessionStatus.Failed;
            session.FailedAt     = now;
            session.ErrorCode    = aiResult.ErrorCode;
            session.ErrorMessage = aiResult.ErrorMessage;
            session.UpdatedAt    = now;

            await _db.SaveChangesAsync(ct);

            try
            {
                await _actLog.LogAsync(command.UserId, ActivityActionKeys.InterviewFailed,
                    entityType: "InterviewSession", entityId: session.Id,
                    description: $"Phân tích phỏng vấn thất bại: {aiResult.ErrorCode}.");
            }
            catch { /* non-critical */ }

            return MapAiError(aiResult.ErrorCode, aiResult.ErrorMessage, aiResult.IsServiceUnavailable);
        }
    }

    private static InterviewReportResponse BuildReportResponse(InterviewReport report, AiInterviewAnalysisResult? ai = null) =>
        new()
        {
            OverallScore      = report.OverallScore,
            ConfidenceScore   = report.ConfidenceScore,
            ClarityScore      = report.VoiceClarityScore,
            RelevanceScore    = ai?.RelevanceScore,                    // not persisted in DB
            PaceScore         = report.PaceScore,
            Strengths         = JsonParseHelper.ParseStringArray(report.StrengthsJson),
            Weaknesses        = JsonParseHelper.ParseStringArray(report.WeaknessesJson),
            Recommendations   = JsonParseHelper.ParseStringArray(report.RecommendationsJson),
            ScoreBreakdowns   = JsonParseHelper.ParseObjectArray(ai?.ScoreBreakdownsJson),
            FeedbackItems     = JsonParseHelper.ParseObjectArray(ai?.FeedbackItemsJson),
            ModelVersion      = report.ModelVersion,
            SchemaVersion     = report.SchemaVersion
        };

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
        return Error.Failure(errorCode ?? "ANALYSIS_FAILED",
            errorMessage ?? "Phân tích phỏng vấn thất bại.");
    }
}
