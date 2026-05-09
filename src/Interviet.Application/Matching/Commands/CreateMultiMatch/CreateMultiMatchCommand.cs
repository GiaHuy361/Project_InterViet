using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Matching;
using Interviet.Domain.Matching;
using Interviet.Domain.Resumes;
using Interviet.Shared.Results;

namespace Interviet.Application.Matching.Commands.CreateMultiMatch;

public sealed record CreateMultiMatchCommand(
    Guid UserId,
    Guid ResumeId,
    List<Guid> JobDescriptionIds,
    string? Title
) : IRequest<Result<CreateMultiMatchResponse>>;

public sealed class CreateMultiMatchCommandHandler
    : IRequestHandler<CreateMultiMatchCommand, Result<CreateMultiMatchResponse>>
{
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _dt;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<CreateMultiMatchCommandHandler> _logger;
    private readonly IQuotaService _quotaService;

    public CreateMultiMatchCommandHandler(
        IAppDbContext db,
        IDateTimeProvider dt,
        IServiceScopeFactory scopeFactory,
        ILogger<CreateMultiMatchCommandHandler> logger,
        IQuotaService quotaService)
    {
        _db           = db;
        _dt           = dt;
        _scopeFactory = scopeFactory;
        _logger       = logger;
        _quotaService = quotaService;
    }

    public async Task<Result<CreateMultiMatchResponse>> Handle(
        CreateMultiMatchCommand request, CancellationToken ct)
    {
        if (request.JobDescriptionIds == null || !request.JobDescriptionIds.Any())
            return Error.Validation("Match.EmptyJobDescriptions", "Vui lòng chọn ít nhất một mô tả công việc.");

        var distinctJdIds = request.JobDescriptionIds.Distinct().ToList();

        // ── Check multi_jd.match limit ───────────────────────────────────────
        var limitCheck = await _quotaService.CheckFeatureLimitAsync(request.UserId, "multi_jd.match", distinctJdIds.Count, ct);
        if (!limitCheck.IsSuccess) return limitCheck.Error;

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

        // ── Validate all JDs ownership ───────────────────────────────────────
        var jds = await _db.JobDescriptions
            .Where(j => distinctJdIds.Contains(j.Id) && !j.IsDeleted)
            .ToListAsync(ct);

        if (jds.Count != distinctJdIds.Count)
            return Error.NotFound("Match.JdNotFound", "Một hoặc nhiều mô tả công việc không hợp lệ.");

        if (jds.Any(j => j.UserId != request.UserId))
            return Error.Forbidden("Match.JdForbidden", "Bạn không có quyền sử dụng một số mô tả công việc đã chọn.");

        // ── Check ResumeParsedData exists ────────────────────────────────────
        var parsedData = await _db.ResumeParsedData
            .FirstOrDefaultAsync(p => p.ResumeId == request.ResumeId, ct);

        if (parsedData is null)
            return Error.Validation("Match.NoParsedData", "CV chưa được phân tích.");

        // ── Create MatchSession + MatchTargets ────────────────────────────────
        var correlationId = Guid.NewGuid().ToString("N");
        var requestId     = Guid.NewGuid().ToString("N");
        var sessionId     = Guid.NewGuid();

        var session = new MatchSession
        {
            Id              = sessionId,
            UserId          = request.UserId,
            ResumeId        = request.ResumeId,
            ResumeVersionId = version.Id,
            JobDescriptionId = null,
            SessionType     = MatchSessionType.Multi,
            Status          = MatchSessionStatus.Pending,
            TargetCount     = distinctJdIds.Count,
            CorrelationId   = correlationId,
            RequestId       = requestId,
            RequestedAt     = now
        };
        _db.MatchSessions.Add(session);

        var targetsToProcess = new List<MatchTarget>();
        for (int i = 0; i < jds.Count; i++)
        {
            var target = new MatchTarget
            {
                Id               = Guid.NewGuid(),
                MatchSessionId   = sessionId,
                JobDescriptionId = jds[i].Id,
                RankOrder        = i + 1,
                Status           = MatchSessionStatus.Pending,
                CreatedAt        = now
            };
            _db.MatchTargets.Add(target);
            targetsToProcess.Add(target);
        }

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "MultiMatchSession created. SessionId={SessionId} TargetCount={TargetCount}",
            sessionId, distinctJdIds.Count);

        // Activity + Usage logging
        try
        {
            using var hookScope  = _scopeFactory.CreateScope();
            var hookSp           = hookScope.ServiceProvider;
            var actLog           = hookSp.GetRequiredService<IActivityLogger>();
            await actLog.LogAsync(request.UserId, ActivityActionKeys.MultiMatchCreated,
                entityType: "MatchSession", entityId: sessionId,
                description: $"Phiên matching đa điểm đã được tạo với {distinctJdIds.Count} JD.");
        }
        catch (Exception ex) { _logger.LogWarning(ex, "activity/usage log failed: multi_match_created"); }

        // ── Fire-and-forget: dispatch matching orchestrator ──────────────────
        var capturedScopeFactory  = _scopeFactory;
        var capturedLogger        = _logger;
        var capturedSessionId     = sessionId;
        var capturedUserId        = request.UserId;
        var capturedResumeId      = request.ResumeId;
        var capturedVersionId     = version.Id;
        var capturedTargets       = targetsToProcess.Select(t => new { TargetId = t.Id, JdId = t.JobDescriptionId }).ToList();
        var capturedCorrelationId = correlationId;
        var capturedRequestId     = requestId;

        var capturedRawText          = parsedData.RawText;
        var capturedSkillsJson       = parsedData.SkillsJson;
        var capturedExperiencesJson  = parsedData.ExperiencesJson;
        var capturedEducationsJson   = parsedData.EducationsJson;
        var capturedSectionsJson     = parsedData.SectionsJson;
        var capturedProjectsJson     = parsedData.ProjectsJson;
        var capturedCertsJson        = parsedData.CertificationsJson;
        var capturedLangsJson        = parsedData.LanguagesJson;

        var snapshotJds = jds.Select(j => new {
            Id = j.Id,
            RawText = j.RawText
        }).ToList();

        Task.Run(async () =>
        {
            // The orchestrator loops through each target
            foreach (var t in capturedTargets)
            {
                var jdSnapshot = snapshotJds.First(j => j.Id == t.JdId);
                
                using var scope = capturedScopeFactory.CreateScope();
                var sp = scope.ServiceProvider;
                var matcher = sp.GetRequiredService<IAiMatchingClient>();
                var bgDb    = sp.GetRequiredService<IAppDbContext>();
                
                var targetRecord = await bgDb.MatchTargets.FirstOrDefaultAsync(x => x.Id == t.TargetId);
                if (targetRecord == null) continue;
                
                targetRecord.Status = MatchSessionStatus.Processing;
                await bgDb.SaveChangesAsync();

                try
                {
                    var matchRes = await matcher.MatchAsync(new AiMatchRequest
                    {
                        UserId           = capturedUserId,
                        ResumeId         = capturedResumeId,
                        ResumeVersionId  = capturedVersionId,
                        JobDescriptionId = jdSnapshot.Id,
                        MatchSessionId   = capturedSessionId, // Note: The Python backend will associate this with the session. Wait, the Python API might save the matchResult with the targetId. Actually, our MatchClient handles it.
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
                        JobDescriptionRawText = jdSnapshot.RawText
                    }, CancellationToken.None);

                    if (matchRes.IsSuccess)
                    {
                        bgDb.MatchResults.Add(new MatchResult
                        {
                            Id                = Guid.NewGuid(),
                            MatchSessionId    = capturedSessionId,
                            MatchTargetId     = t.TargetId,
                            TotalScore        = matchRes.OverallScore ?? 0,
                            TechnicalScore    = matchRes.SkillScore,
                            ExperienceScore   = matchRes.ExperienceScore,
                            EducationScore    = matchRes.EducationScore,
                            LanguageScore     = matchRes.LanguageScore,
                            MatchBand         = DetermineBand(matchRes.OverallScore ?? 0),
                            SummaryText       = matchRes.SummaryText,
                            MatchedSkillsJson = matchRes.MatchedSkillsJson,
                            MissingSkillsJson = matchRes.MissingSkillsJson,
                            StrengthsJson     = matchRes.StrengthsJson,
                            WeaknessesJson    = matchRes.WeaknessesJson,
                            SuggestionsJson   = matchRes.RecommendationsJson,
                            RawResponseJson   = matchRes.RawResponseJson,
                            ModelVersion      = matchRes.ModelVersion,
                            SchemaVersion     = matchRes.SchemaVersion,
                            CreatedAt         = DateTime.UtcNow
                        });
                        
                        targetRecord.Status = MatchSessionStatus.Completed;
                        targetRecord.CompletedAt = DateTime.UtcNow;
                    }
                    else
                    {
                        targetRecord.Status = MatchSessionStatus.Failed;
                        targetRecord.ErrorCode = matchRes.ErrorCode;
                        targetRecord.CompletedAt = DateTime.UtcNow;
                    }
                }
                catch (Exception ex)
                {
                    capturedLogger.LogError(ex, "Python matching threw exception for TargetId={TargetId}", t.TargetId);
                    targetRecord.Status = MatchSessionStatus.Failed;
                    targetRecord.ErrorCode = "Exception";
                    targetRecord.CompletedAt = DateTime.UtcNow;
                }
                
                await bgDb.SaveChangesAsync();
            }

            // After all targets are processed, evaluate session status
            using var finalScope = capturedScopeFactory.CreateScope();
            var finalSp = finalScope.ServiceProvider;
            var finalDb = finalSp.GetRequiredService<IAppDbContext>();
            
            var sess = await finalDb.MatchSessions
                .Include(s => s.Targets)
                .ThenInclude(x => x.Result)
                .FirstOrDefaultAsync(s => s.Id == capturedSessionId);
                
            if (sess != null)
            {
                int completedCount = sess.Targets.Count(x => x.Status == MatchSessionStatus.Completed);
                int failedCount = sess.Targets.Count(x => x.Status == MatchSessionStatus.Failed);
                
                if (completedCount == sess.TargetCount)
                    sess.Status = MatchSessionStatus.Completed;
                else if (failedCount == sess.TargetCount)
                    sess.Status = MatchSessionStatus.Failed;
                else
                    sess.Status = MatchSessionStatus.PartiallyCompleted;
                    
                sess.CompletedAt = DateTime.UtcNow;
                if (sess.Status == MatchSessionStatus.Failed)
                    sess.FailedAt = DateTime.UtcNow;
                
                // Track activity
                var actLogger = finalSp.GetRequiredService<IActivityLogger>();
                var statusKey = sess.Status == MatchSessionStatus.Failed ? ActivityActionKeys.MultiMatchFailed : ActivityActionKeys.MultiMatchCompleted;
                await actLogger.LogAsync(capturedUserId, statusKey, "MatchSession", sess.Id, $"Multi-match session {sess.Status}.");
                
                await finalDb.SaveChangesAsync();
            }
        });

        return Result<CreateMultiMatchResponse>.Success(new CreateMultiMatchResponse
        {
            SessionId = sessionId,
            ResumeId  = request.ResumeId,
            SessionType = MatchSessionType.Multi,
            Status = MatchSessionStatus.Pending,
            TargetCount = distinctJdIds.Count,
            RequestedAt = now
        });
    }

    private static string DetermineBand(decimal score)
    {
        if (score >= 80) return MatchBand.High;
        if (score >= 50) return MatchBand.Medium;
        return MatchBand.Low;
    }
}
