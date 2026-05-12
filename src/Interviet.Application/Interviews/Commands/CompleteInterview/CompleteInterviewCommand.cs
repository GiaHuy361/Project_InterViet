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
            .FirstOrDefaultAsync(s => s.Id == command.SessionId, ct);

        if (session is null)
            return Error.NotFound("Interview.NotFound", "Không tìm thấy phiên phỏng vấn.");
        if (session.UserId != command.UserId)
            return Error.Forbidden("Interview.Forbidden", "Bạn không có quyền truy cập phiên phỏng vấn này.");
        if (session.Status != InterviewSessionStatus.Live)
            return Error.Validation("Interview.InvalidStatus",
                $"Phiên phỏng vấn ở trạng thái '{session.Status}', không thể hoàn thành.");

        var now = _dt.UtcNow;

        // Build transcript for analysis
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

        // Mark processing
        session.Status    = InterviewSessionStatus.Processing;
        session.UpdatedAt = now;
        await _db.SaveChangesAsync(ct);

        // ── Call Python for analysis ─────────────────────────────────────────
        InterviewReportResponse? reportResponse = null;
        string finalStatus;

        if (transcript.Count == 0)
        {
            // No Q&A — abandon instead
            session.Status      = InterviewSessionStatus.Abandoned;
            session.CompletedAt = now;
            session.UpdatedAt   = now;
            finalStatus         = InterviewSessionStatus.Abandoned;

            try
            {
                await _actLog.LogAsync(command.UserId, ActivityActionKeys.InterviewAbandoned,
                    entityType: "InterviewSession", entityId: session.Id,
                    description: "Phiên phỏng vấn kết thúc mà không có câu hỏi nào được trả lời.");
            }
            catch { /* non-critical */ }

            await _db.SaveChangesAsync(ct);

            return Result<CompleteInterviewResponse>.Success(new CompleteInterviewResponse
            {
                SessionId   = session.Id,
                Status      = finalStatus,
                CompletedAt = now,
                Message     = "Phiên phỏng vấn kết thúc mà không có câu hỏi nào. Không có báo cáo được tạo."
            });
        }

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
            finalStatus         = InterviewSessionStatus.Completed;

            await _db.SaveChangesAsync(ct);

            reportResponse = new InterviewReportResponse
            {
                OverallScore      = aiResult.OverallScore,
                ConfidenceScore   = aiResult.ConfidenceScore,
                VoiceClarityScore = aiResult.ClarityScore,
                StrengthsJson     = aiResult.StrengthsJson,
                WeaknessesJson    = aiResult.WeaknessesJson,
                RecommendationsJson = aiResult.RecommendationsJson,
                ModelVersion      = aiResult.ModelVersion
            };

            try
            {
                await _actLog.LogAsync(command.UserId, ActivityActionKeys.InterviewCompleted,
                    entityType: "InterviewSession", entityId: session.Id,
                    description: $"Phiên phỏng vấn hoàn thành. Điểm: {aiResult.OverallScore:F1}.");
            }
            catch { /* non-critical */ }
        }
        else
        {
            // Python failed — mark failed, no fake report
            _logger.LogWarning("AI analysis failed for SessionId={SessionId} ErrorCode={Code}",
                session.Id, aiResult.ErrorCode);

            session.Status      = InterviewSessionStatus.Failed;
            session.FailedAt    = now;
            session.ErrorCode   = aiResult.ErrorCode;
            session.ErrorMessage = aiResult.ErrorMessage;
            session.UpdatedAt   = now;
            finalStatus         = InterviewSessionStatus.Failed;

            await _db.SaveChangesAsync(ct);

            try
            {
                await _actLog.LogAsync(command.UserId, ActivityActionKeys.InterviewFailed,
                    entityType: "InterviewSession", entityId: session.Id,
                    description: $"Phân tích phỏng vấn thất bại: {aiResult.ErrorCode}.");
            }
            catch { /* non-critical */ }

            if (aiResult.IsServiceUnavailable)
                return Error.Failure("Interview.ServiceUnavailable",
                    "Dịch vụ phân tích phỏng vấn hiện chưa sẵn sàng. Câu trả lời đã lưu, không có báo cáo.");

            return Error.Failure(aiResult.ErrorCode ?? "ANALYSIS_FAILED",
                aiResult.ErrorMessage ?? "Phân tích phỏng vấn thất bại.");
        }

        return Result<CompleteInterviewResponse>.Success(new CompleteInterviewResponse
        {
            SessionId   = session.Id,
            Status      = finalStatus,
            CompletedAt = now,
            Report      = reportResponse
        });
    }
}
