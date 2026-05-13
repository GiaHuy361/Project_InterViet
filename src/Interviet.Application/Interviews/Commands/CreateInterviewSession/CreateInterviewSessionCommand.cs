using MediatR;
using Microsoft.Extensions.Logging;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Interviews;
using Interviet.Shared.Results;
using Interviet.Domain.Interviews;

namespace Interviet.Application.Interviews.Commands.CreateInterviewSession;

public sealed record CreateInterviewSessionCommand(
    Guid UserId,
    string CorrelationId,
    CreateInterviewSessionRequest Request) : IRequest<Result<CreateInterviewSessionResponse>>;

public sealed class CreateInterviewSessionCommandHandler
    : IRequestHandler<CreateInterviewSessionCommand, Result<CreateInterviewSessionResponse>>
{
    private readonly IAppDbContext          _db;
    private readonly IQuotaService          _quota;
    private readonly IActivityLogger        _actLog;
    private readonly IUsageTracker          _usage;
    private readonly IDateTimeProvider      _dt;
    private readonly ILogger<CreateInterviewSessionCommandHandler> _logger;

    public CreateInterviewSessionCommandHandler(
        IAppDbContext db, IQuotaService quota,
        IActivityLogger actLog, IUsageTracker usage,
        IDateTimeProvider dt,
        ILogger<CreateInterviewSessionCommandHandler> logger)
    {
        _db     = db;
        _quota  = quota;
        _actLog = actLog;
        _usage  = usage;
        _dt     = dt;
        _logger = logger;
    }

    public async Task<Result<CreateInterviewSessionResponse>> Handle(
        CreateInterviewSessionCommand command, CancellationToken ct)
    {
        var req = command.Request;

        // ── Validation ──────────────────────────────────────────────────────
        if (string.IsNullOrWhiteSpace(req.Position))
            return Error.Validation("Interview.PositionRequired", "Vui lòng nhập vị trí phỏng vấn.");
        if (string.IsNullOrWhiteSpace(req.Level))
            return Error.Validation("Interview.LevelRequired", "Vui lòng chọn cấp độ.");
        if (string.IsNullOrWhiteSpace(req.InterviewType))
            return Error.Validation("Interview.TypeRequired", "Vui lòng chọn loại phỏng vấn.");
        if (string.IsNullOrWhiteSpace(req.Mode))
            return Error.Validation("Interview.ModeRequired", "Vui lòng chọn chế độ phỏng vấn.");
        if (string.IsNullOrWhiteSpace(req.InterviewerMode))
            return Error.Validation("Interview.InterviewerModeRequired", "Vui lòng chọn phong cách phỏng vấn.");
        if (string.IsNullOrWhiteSpace(req.AiModel))
            return Error.Validation("Interview.AiModelRequired", "Vui lòng chọn mô hình AI.");
        if (!AllowedAiModels.IsValid(req.AiModel))
            return Error.Validation("Interview.AiModelUnsupported",
                $"AI model '{req.AiModel}' không được hỗ trợ. Các model hợp lệ: gpt-4o-mini, gpt-4o, gemini-3-flash-preview, standard, basic, advanced.");
        if (req.DurationMinutes is <= 0 or > 120)
            return Error.Validation("Interview.DurationInvalid", "Thời lượng phỏng vấn phải từ 1 đến 120 phút.");

        // ── Check quota BEFORE creating ─────────────────────────────────────
        var quotaCheck = await _quota.CheckAsync(command.UserId, QuotaFeatureKeys.InterviewAi, 1, ct);
        if (!quotaCheck.IsSuccess)
            return quotaCheck.Error!;

        // ── Create session ───────────────────────────────────────────────────
        var now     = _dt.UtcNow;
        var session = new InterviewSession
        {
            Id              = Guid.NewGuid(),
            UserId          = command.UserId,
            RoleName        = req.Position.Trim(),
            SeniorityLevel  = req.Level.Trim(),
            InterviewType   = req.InterviewType.Trim(),
            Goal            = req.Goal?.Trim(),
            DurationMinutes = req.DurationMinutes,
            Mode            = req.Mode.Trim(),
            InterviewerMode = req.InterviewerMode.Trim(),
            AiModel         = req.AiModel.Trim(),
            CorrelationId   = command.CorrelationId,
            Status          = InterviewSessionStatus.Live,
            CreatedAt       = now,
            UpdatedAt       = now
        };

        _db.InterviewSessions.Add(session);
        await _db.SaveChangesAsync(ct);

        // ── Consume quota AFTER successful creation ──────────────────────────
        try
        {
            await _quota.ConsumeAsync(command.UserId, QuotaFeatureKeys.InterviewAi, 1,
                "InterviewSession", session.Id, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to consume interview.ai quota for SessionId={SessionId}", session.Id);
        }

        // ── Activity + Usage (non-critical) ─────────────────────────────────
        try
        {
            await _actLog.LogAsync(command.UserId, ActivityActionKeys.InterviewStarted,
                entityType: "InterviewSession", entityId: session.Id,
                description: $"Phiên phỏng vấn \"{session.RoleName}\" ({session.SeniorityLevel}) đã được tạo.");
            await _usage.TrackAsync(command.UserId, QuotaFeatureKeys.InterviewAi,
                referenceType: "InterviewSession", referenceId: session.Id, ct: ct);
        }
        catch (Exception ex) { _logger.LogWarning(ex, "Activity/usage log failed for interview_started"); }

        return Result<CreateInterviewSessionResponse>.Success(new CreateInterviewSessionResponse
        {
            SessionId       = session.Id,
            Status          = session.Status,
            Position        = session.RoleName,
            Level           = session.SeniorityLevel,
            InterviewType   = session.InterviewType,
            Goal            = session.Goal,
            DurationMinutes = session.DurationMinutes,
            Mode            = session.Mode,
            InterviewerMode = session.InterviewerMode,
            AiModel         = session.AiModel,
            CreatedAt       = session.CreatedAt
        });
    }
}
