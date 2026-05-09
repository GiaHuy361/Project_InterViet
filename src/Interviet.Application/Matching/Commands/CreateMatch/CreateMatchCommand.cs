using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Matching;
using Interviet.Domain.Matching;
using Interviet.Shared.Results;

namespace Interviet.Application.Matching.Commands.CreateMatch;

public sealed record CreateMatchCommand(
    Guid UserId,
    Guid ResumeId,
    Guid JobDescriptionId
) : IRequest<Result<CreateMatchResponse>>;

public sealed class CreateMatchCommandHandler
    : IRequestHandler<CreateMatchCommand, Result<CreateMatchResponse>>
{
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _dt;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<CreateMatchCommandHandler> _logger;

    public CreateMatchCommandHandler(
        IAppDbContext db,
        IDateTimeProvider dt,
        IServiceScopeFactory scopeFactory,
        ILogger<CreateMatchCommandHandler> logger)
    {
        _db           = db;
        _dt           = dt;
        _scopeFactory = scopeFactory;
        _logger       = logger;
    }

    public async Task<Result<CreateMatchResponse>> Handle(
        CreateMatchCommand request, CancellationToken ct)
    {
        var now = _dt.UtcNow;

        // ── Validate Resume ownership ────────────────────────────────────────
        var resume = await _db.Resumes
            .Include(r => r.ActiveVersion)
            .FirstOrDefaultAsync(r => r.Id == request.ResumeId && !r.IsDeleted, ct);

        if (resume is null)
            return Error.NotFound("Match.ResumeNotFound", "Không tìm thấy CV.");

        if (resume.UserId != request.UserId)
            return Error.Forbidden("Match.ResumeForbidden", "Bạn không có quyền sử dụng CV này.");

        var version = resume.ActiveVersion;
        if (version is null)
            return Error.Validation("Match.NoActiveVersion", "CV chưa có phiên bản nào.");

        // ── Validate JobDescription ownership ────────────────────────────────
        var jd = await _db.JobDescriptions
            .FirstOrDefaultAsync(j => j.Id == request.JobDescriptionId && !j.IsDeleted, ct);

        if (jd is null)
            return Error.NotFound("Match.JdNotFound", "Không tìm thấy mô tả công việc.");

        if (jd.UserId != request.UserId)
            return Error.Forbidden("Match.JdForbidden", "Bạn không có quyền sử dụng mô tả công việc này.");


        // ── Check ResumeParsedData exists ────────────────────────────────────
        var parsedData = await _db.ResumeParsedData
            .FirstOrDefaultAsync(p => p.ResumeId == request.ResumeId, ct);

        if (parsedData is null)
            return Error.Validation("Match.NoParsedData",
                "CV chưa được phân tích. Vui lòng chờ quá trình phân tích CV hoàn tất hoặc bấm phân tích lại.");

        // ── Create MatchSession + MatchTarget ────────────────────────────────
        var correlationId = Guid.NewGuid().ToString("N");
        var requestId     = Guid.NewGuid().ToString("N");
        var sessionId     = Guid.NewGuid();

        var session = new MatchSession
        {
            Id              = sessionId,
            UserId          = request.UserId,
            ResumeId        = request.ResumeId,
            ResumeVersionId = version.Id,
            JobDescriptionId = request.JobDescriptionId,
            SessionType     = MatchSessionType.Single,
            Status          = MatchSessionStatus.Pending,
            TargetCount     = 1,
            CorrelationId   = correlationId,
            RequestId       = requestId,
            RequestedAt     = now
        };
        _db.MatchSessions.Add(session);

        var target = new MatchTarget
        {
            Id             = Guid.NewGuid(),
            MatchSessionId = sessionId,
            JobDescriptionId = request.JobDescriptionId,
            RankOrder      = 1,
            CreatedAt      = now
        };
        _db.MatchTargets.Add(target);

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "MatchSession created. SessionId={SessionId} ResumeId={ResumeId} JdId={JdId}",
            sessionId, request.ResumeId, request.JobDescriptionId);

        // Activity + Usage — non-critical, isolated scope
        try
        {
            using var hookScope  = _scopeFactory.CreateScope();
            var hookSp           = hookScope.ServiceProvider;
            var actLog           = hookSp.GetRequiredService<IActivityLogger>();
            var usageTracker     = hookSp.GetRequiredService<IUsageTracker>();
            await actLog.LogAsync(request.UserId, ActivityActionKeys.MatchCreated,
                entityType: "MatchSession", entityId: sessionId,
                description: $"Phiên matching đã được tạo.");
            await usageTracker.TrackAsync(request.UserId, QuotaFeatureKeys.MatchCreate,
                referenceType: "MatchSession", referenceId: sessionId);
        }
        catch (Exception ex) { _logger.LogWarning(ex, "activity/usage log failed: match_created"); }

        // ── Fire-and-forget: call Python matching service ─────────────────────
        // Capture primitives/values — do NOT capture scoped services
        var capturedScopeFactory  = _scopeFactory;
        var capturedLogger        = _logger;
        var capturedSessionId     = sessionId;
        var capturedTargetId      = target.Id;
        var capturedUserId        = request.UserId;
        var capturedResumeId      = request.ResumeId;
        var capturedVersionId     = version.Id;
        var capturedJdId          = request.JobDescriptionId;
        var capturedCorrelationId = correlationId;
        var capturedRequestId     = requestId;

        // Snapshot parsed data fields (safe to capture — these are value copies)
        var capturedRawText          = parsedData.RawText;
        var capturedSkillsJson       = parsedData.SkillsJson;
        var capturedExperiencesJson  = parsedData.ExperiencesJson;
        var capturedEducationsJson   = parsedData.EducationsJson;
        var capturedSectionsJson     = parsedData.SectionsJson;
        var capturedProjectsJson     = parsedData.ProjectsJson;
        var capturedCertsJson        = parsedData.CertificationsJson;
        var capturedLangsJson        = parsedData.LanguagesJson;
        var capturedJdRawText        = jd.RawText;

        _ = Task.Run(async () =>
        {
            try
            {
                using var scope  = capturedScopeFactory.CreateScope();
                var sp           = scope.ServiceProvider;
                var db           = sp.GetRequiredService<IAppDbContext>();
                var matchClient  = sp.GetRequiredService<IAiMatchingClient>();
                var dt           = sp.GetRequiredService<IDateTimeProvider>();
                var usageTracker = sp.GetRequiredService<IUsageTracker>();

                var result = await matchClient.MatchAsync(new AiMatchRequest
                {
                    UserId           = capturedUserId,
                    ResumeId         = capturedResumeId,
                    ResumeVersionId  = capturedVersionId,
                    JobDescriptionId = capturedJdId,
                    MatchSessionId   = capturedSessionId,
                    CorrelationId    = capturedCorrelationId,
                    RequestId        = capturedRequestId,
                    RawText          = capturedRawText,
                    SkillsJson       = capturedSkillsJson,
                    ExperiencesJson  = capturedExperiencesJson,
                    EducationsJson   = capturedEducationsJson,
                    SectionsJson     = capturedSectionsJson,
                    ProjectsJson     = capturedProjectsJson,
                    CertificationsJson = capturedCertsJson,
                    LanguagesJson    = capturedLangsJson,
                    JobDescriptionRawText = capturedJdRawText
                });

                await ApplyMatchResultAsync(
                    db, dt, capturedSessionId, capturedTargetId, capturedUserId, result,
                    capturedScopeFactory, capturedLogger, usageTracker);
            }
            catch (Exception ex)
            {
                capturedLogger.LogError(ex,
                    "Unhandled error in fire-and-forget match for SessionId={SessionId}", capturedSessionId);
            }
        });

        return Result<CreateMatchResponse>.Success(new CreateMatchResponse
        {
            SessionId       = sessionId,
            ResumeId        = request.ResumeId,
            JobDescriptionId = request.JobDescriptionId,
            Status          = MatchSessionStatus.Pending,
            RequestedAt     = now
        });
    }

    private static async Task ApplyMatchResultAsync(
        IAppDbContext db,
        IDateTimeProvider dt,
        Guid sessionId, Guid targetId, Guid userId,
        AiMatchResult result,
        IServiceScopeFactory scopeFactory,
        ILogger<CreateMatchCommandHandler> logger,
        IUsageTracker usageTracker)
    {
        var now     = dt.UtcNow;
        var session = await db.MatchSessions.FindAsync(sessionId);
        var target  = await db.MatchTargets.FindAsync(targetId);
        if (session is null || target is null) return;

        session.CompletedAt = now;

        if (result.IsSuccess)
        {
            session.Status           = MatchSessionStatus.Completed;
            session.OverallBestScore = result.OverallScore;

            // Compute MatchBand
            var band = result.OverallScore switch
            {
                >= 75 => MatchBand.High,
                >= 50 => MatchBand.Medium,
                _     => MatchBand.Low
            };

            db.MatchResults.Add(new MatchResult
            {
                Id                = Guid.NewGuid(),
                MatchSessionId    = sessionId,
                MatchTargetId     = targetId,
                TotalScore        = result.OverallScore ?? 0,
                TechnicalScore    = result.SkillScore,
                ExperienceScore   = result.ExperienceScore,
                EducationScore    = result.EducationScore,
                LanguageScore     = result.LanguageScore,
                MatchBand         = band,
                SummaryText       = result.SummaryText,
                MatchedSkillsJson = result.MatchedSkillsJson,
                MissingSkillsJson = result.MissingSkillsJson,
                StrengthsJson     = result.StrengthsJson,
                WeaknessesJson    = result.WeaknessesJson,
                SuggestionsJson   = result.RecommendationsJson,
                RawResponseJson   = result.RawResponseJson,
                ModelVersion      = result.ModelVersion,
                SchemaVersion     = result.SchemaVersion,
                CreatedAt         = now
            });

            await db.SaveChangesAsync();

            // Activity + Usage — separate scope, non-critical
            try
            {
                using var hookScope  = scopeFactory.CreateScope();
                var hookSp           = hookScope.ServiceProvider;
                var actLog           = hookSp.GetRequiredService<IActivityLogger>();
                await actLog.LogAsync(userId, ActivityActionKeys.MatchCompleted,
                    entityType: "MatchSession", entityId: sessionId,
                    description: $"Matching hoàn tất. Điểm: {result.OverallScore:F1}");
                await usageTracker.TrackAsync(userId, QuotaFeatureKeys.MatchComplete,
                    referenceType: "MatchSession", referenceId: sessionId);
            }
            catch (Exception ex) { logger.LogWarning(ex, "activity/usage log failed: match_completed"); }
        }
        else
        {
            session.Status       = MatchSessionStatus.Failed;
            session.FailedAt     = now;
            session.ErrorCode    = result.ErrorCode;
            session.ErrorMessage = result.ErrorMessage;

            await db.SaveChangesAsync();

            // Activity + Usage — separate scope, non-critical
            try
            {
                using var hookScope  = scopeFactory.CreateScope();
                var hookSp           = hookScope.ServiceProvider;
                var actLog           = hookSp.GetRequiredService<IActivityLogger>();
                await actLog.LogAsync(userId, ActivityActionKeys.MatchFailed,
                    entityType: "MatchSession", entityId: sessionId,
                    description: $"Matching thất bại: {result.ErrorCode}.");
                await usageTracker.TrackAsync(userId, QuotaFeatureKeys.MatchCreate,
                    referenceType: "MatchSession", referenceId: sessionId);
            }
            catch (Exception ex) { logger.LogWarning(ex, "activity/usage log failed: match_failed"); }
        }
    }
}
