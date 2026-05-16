using MediatR;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Common.Options;
using Interviet.Contracts.Interviews;
using Interviet.Shared.Results;
using Interviet.Domain.Interviews;

namespace Interviet.Application.Interviews.Commands.StartInterviewRealtime;

public sealed record StartInterviewRealtimeCommand(
    Guid SessionId, Guid UserId,
    string CorrelationId,
    StartInterviewRealtimeRequest Request) : IRequest<Result<StartInterviewRealtimeResponse>>;

public sealed class StartInterviewRealtimeCommandHandler
    : IRequestHandler<StartInterviewRealtimeCommand, Result<StartInterviewRealtimeResponse>>
{
    private readonly IAppDbContext          _db;
    private readonly IAiInterviewClient     _aiClient;
    private readonly IDateTimeProvider      _dt;
    private readonly AiServicesOptions      _opts;
    private readonly ILogger<StartInterviewRealtimeCommandHandler> _logger;

    public StartInterviewRealtimeCommandHandler(
        IAppDbContext db, IAiInterviewClient aiClient,
        IDateTimeProvider dt, IOptions<AiServicesOptions> opts,
        ILogger<StartInterviewRealtimeCommandHandler> logger)
    {
        _db       = db;
        _aiClient = aiClient;
        _dt       = dt;
        _opts     = opts.Value;
        _logger   = logger;
    }

    public async Task<Result<StartInterviewRealtimeResponse>> Handle(
        StartInterviewRealtimeCommand command, CancellationToken ct)
    {
        var req = command.Request;

        // ── Validate model ───────────────────────────────────────────────────
        if (!AllowedAiModels.IsValid(req.AiModel))
            return Error.Validation("Interview.AiModelUnsupported",
                $"AI model '{req.AiModel}' không được hỗ trợ.");

        var session = await _db.InterviewSessions
            .Include(s => s.RealtimeSessions)
            .FirstOrDefaultAsync(s => s.Id == command.SessionId, ct);

        if (session is null)
            return Error.NotFound("Interview.NotFound", "Không tìm thấy phiên phỏng vấn.");
        if (session.UserId != command.UserId)
            return Error.Forbidden("Interview.Forbidden", "Bạn không có quyền truy cập phiên phỏng vấn này.");

        // ── State machine guards ─────────────────────────────────────────────
        if (session.Status == InterviewSessionStatus.Completed)
            return Error.Conflict("Interview.AlreadyCompleted",
                "Phiên phỏng vấn đã hoàn thành. Không thể bắt đầu realtime.");
        if (session.Status is InterviewSessionStatus.Cancelled or InterviewSessionStatus.Abandoned)
            return Error.Conflict("Interview.Terminated",
                $"Phiên phỏng vấn ở trạng thái '{session.Status}'. Không thể bắt đầu realtime.");
        if (session.Status == InterviewSessionStatus.Failed)
            return Error.Conflict("Interview.Failed",
                "Phiên phỏng vấn đã thất bại. Tạo phiên mới để thử lại.");

        var now = _dt.UtcNow;

        // ── Idempotent: return existing active realtime session ───────────────
        var existing = session.RealtimeSessions
            .Where(rs => rs.Status == InterviewRealtimeSessionStatus.Active
                      && rs.ExpiresAt > now)
            .OrderByDescending(rs => rs.CreatedAt)
            .FirstOrDefault();

        if (existing is not null)
        {
            _logger.LogInformation(
                "Returning existing active realtime session {RealtimeId} for SessionId={SessionId}",
                existing.Id, command.SessionId);
            return Result<StartInterviewRealtimeResponse>.Success(new StartInterviewRealtimeResponse
            {
                SessionId         = session.Id,
                RealtimeSessionId = existing.Id,
                Status            = existing.Status,
                Provider          = existing.Provider,
                Model             = existing.Model,
                ProviderSessionId = existing.ProviderSessionId,
                ConnectUrl        = existing.ConnectUrl,
                ClientSecret      = null,   // not stored — expired from memory
                Instructions      = null,   // not stored — transient
                ExpiresAt         = existing.ExpiresAt,
                StartedAt         = existing.StartedAt,
                IsIdempotent      = true
            });
        }

        // ── If realtime disabled, return 503 — no fake token ─────────────────
        if (!_opts.InterviewRealtimeEnabled)
            return Error.ServiceUnavailable("Interview.RealtimeUnavailable",
                "Dịch vụ phỏng vấn realtime hiện chưa được bật.");

        // ── Move session to Live if not already ──────────────────────────────
        if (session.Status is InterviewSessionStatus.Draft or InterviewSessionStatus.Ready)
        {
            session.Status    = InterviewSessionStatus.Live;
            session.StartedAt = now;
            session.UpdatedAt = now;
        }

        // ── Create DB record (pending) ────────────────────────────────────────
        var realtimeSession = new InterviewRealtimeSession
        {
            Id                = Guid.NewGuid(),
            InterviewSessionId = session.Id,
            UserId            = command.UserId,
            Status            = InterviewRealtimeSessionStatus.Created,
            Model             = req.AiModel,
            CreatedAt         = now,
            UpdatedAt         = now
        };
        _db.InterviewRealtimeSessions.Add(realtimeSession);
        await _db.SaveChangesAsync(ct);

        // ── Call Python ───────────────────────────────────────────────────────
        var aiResult = await _aiClient.CreateRealtimeSessionAsync(new AiCreateRealtimeSessionRequest
        {
            SessionId       = session.Id,
            UserId          = command.UserId,
            CorrelationId   = command.CorrelationId,
            RequestId       = Guid.NewGuid().ToString("N"),
            Position        = session.RoleName,
            Level           = session.SeniorityLevel,
            Goal            = session.Goal,
            InterviewType   = session.InterviewType,
            InterviewerMode = session.InterviewerMode,
            AiModel         = req.AiModel,
            Language        = req.Language,
            Voice           = req.Voice,
            EnableTranscript = req.EnableTranscript,
            TokenTtlSeconds = _opts.InterviewRealtimeTokenTtlSeconds
        }, ct);

        if (!aiResult.IsSuccess)
        {
            realtimeSession.Status       = InterviewRealtimeSessionStatus.Failed;
            realtimeSession.ErrorCode    = aiResult.ErrorCode;
            realtimeSession.ErrorMessage = aiResult.ErrorMessage;
            realtimeSession.UpdatedAt    = now;
            await _db.SaveChangesAsync(ct);

            return MapAiError(aiResult.ErrorCode, aiResult.ErrorMessage, aiResult.IsServiceUnavailable);
        }

        // ── Update realtime session with provider data ─────────────────────
        // ⚠️ Store HASH of clientSecret only, never the raw value
        string? secretHash = null;
        if (!string.IsNullOrEmpty(aiResult.ClientSecret))
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(aiResult.ClientSecret));
            secretHash = Convert.ToBase64String(bytes)[..32]; // 32-char prefix
        }

        realtimeSession.Status            = InterviewRealtimeSessionStatus.Active;
        realtimeSession.Provider          = aiResult.Provider;
        realtimeSession.ProviderSessionId = aiResult.ProviderSessionId;
        realtimeSession.Model             = aiResult.Model ?? req.AiModel;
        realtimeSession.ConnectUrl        = aiResult.ConnectUrl;
        realtimeSession.ClientSecretHash  = secretHash;
        realtimeSession.ExpiresAt         = aiResult.ExpiresAt ?? now.AddSeconds(_opts.InterviewRealtimeTokenTtlSeconds);
        realtimeSession.StartedAt         = now;
        realtimeSession.UpdatedAt         = now;

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Realtime session {RealtimeId} created for SessionId={SessionId} Provider={Provider}",
            realtimeSession.Id, session.Id, aiResult.Provider);

        return Result<StartInterviewRealtimeResponse>.Success(new StartInterviewRealtimeResponse
        {
            SessionId         = session.Id,
            RealtimeSessionId = realtimeSession.Id,
            Status            = realtimeSession.Status,
            Provider          = realtimeSession.Provider,
            Model             = realtimeSession.Model,
            ProviderSessionId = realtimeSession.ProviderSessionId,
            ConnectUrl        = realtimeSession.ConnectUrl,
            ClientSecret      = aiResult.ClientSecret,  // passed through ONCE, not re-stored
            Instructions      = aiResult.Instructions,  // passed through, not stored
            ExpiresAt         = realtimeSession.ExpiresAt,
            StartedAt         = realtimeSession.StartedAt,
            IsIdempotent      = false
        });
    }

    private static Error MapAiError(string? errorCode, string? errorMessage, bool isUnavailable)
    {
        if (isUnavailable || string.Equals(errorCode, "SERVICE_UNAVAILABLE", StringComparison.OrdinalIgnoreCase))
            return Error.ServiceUnavailable("Interview.RealtimeUnavailable",
                "Dịch vụ phỏng vấn realtime hiện chưa sẵn sàng. Vui lòng thử lại sau.");
        if (string.Equals(errorCode, "RATE_LIMIT_EXCEEDED", StringComparison.OrdinalIgnoreCase))
            return Error.TooManyRequests("Interview.RateLimitExceeded",
                "Hệ thống đang xử lý quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.");
        if (string.Equals(errorCode, "VALIDATION_ERROR", StringComparison.OrdinalIgnoreCase))
            return Error.Validation("Interview.PythonValidation", errorMessage ?? "Dữ liệu không hợp lệ.");
        if (string.Equals(errorCode, "MODEL_UNAVAILABLE", StringComparison.OrdinalIgnoreCase))
            return Error.ServiceUnavailable("Interview.ModelUnavailable",
                errorMessage ?? "Model AI không khả dụng. Vui lòng thử model khác.");
        return Error.Failure(errorCode ?? "REALTIME_FAILED",
            errorMessage ?? "Không thể tạo phiên realtime.");
    }
}
