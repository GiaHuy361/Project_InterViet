using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Dashboard;
using Interviet.Domain.Resumes;
using Interviet.Domain.Matching;
using Interviet.Shared.Results;

namespace Interviet.Application.Dashboard.Queries.GetDashboardSummary;

public sealed record GetDashboardSummaryQuery(Guid UserId)
    : IRequest<Result<DashboardSummaryResponse>>;

public sealed class GetDashboardSummaryQueryHandler
    : IRequestHandler<GetDashboardSummaryQuery, Result<DashboardSummaryResponse>>
{
    private readonly IAppDbContext _db;

    public GetDashboardSummaryQueryHandler(IAppDbContext db) => _db = db;

    public async Task<Result<DashboardSummaryResponse>> Handle(
        GetDashboardSummaryQuery request, CancellationToken ct)
    {
        var userId = request.UserId;

        // ── Resumes ──────────────────────────────────────────────────────────
        var resumes = await _db.Resumes
            .Where(r => r.UserId == userId && !r.IsDeleted)
            .Select(r => new { r.IsActive })
            .ToListAsync(ct);

        var resumeVersionParseStatuses = await _db.ResumeVersions
            .Where(v => !v.IsDeleted &&
                        _db.Resumes.Any(r => r.Id == v.ResumeId && r.UserId == userId && !r.IsDeleted))
            .Select(v => v.ParseStatus)
            .ToListAsync(ct);

        var resumeStats = new ResumeStats
        {
            Total           = resumes.Count,
            Parsed          = resumeVersionParseStatuses.Count(s => s == ResumeParseStatus.Parsed),
            Pending         = resumeVersionParseStatuses.Count(s =>
                                  s == ResumeParseStatus.Queued || s == ResumeParseStatus.Processing),
            Failed          = resumeVersionParseStatuses.Count(s =>
                                  s == ResumeParseStatus.Failed || s == ResumeParseStatus.ServiceUnavailable),
            HasActiveResume = resumes.Any(r => r.IsActive)
        };

        // ── Job Descriptions ─────────────────────────────────────────────────
        var jdCount = await _db.JobDescriptions
            .CountAsync(j => j.UserId == userId && !j.IsDeleted, ct);

        // ── Matches ──────────────────────────────────────────────────────────
        var matchSessions = await _db.MatchSessions
            .Where(s => s.UserId == userId)
            .Select(s => new { s.Status, s.OverallBestScore })
            .ToListAsync(ct);

        var completedScores = matchSessions
            .Where(s => s.Status == MatchSessionStatus.Completed && s.OverallBestScore.HasValue)
            .Select(s => s.OverallBestScore!.Value)
            .ToList();

        var matchStats = new MatchStats
        {
            Total        = matchSessions.Count,
            Completed    = matchSessions.Count(s => s.Status == MatchSessionStatus.Completed),
            Failed       = matchSessions.Count(s => s.Status == MatchSessionStatus.Failed),
            Pending      = matchSessions.Count(s =>
                               s.Status == MatchSessionStatus.Pending || s.Status == MatchSessionStatus.Processing),
            BestScore    = completedScores.Count > 0 ? completedScores.Max() : null,
            AverageScore = completedScores.Count > 0 ? Math.Round(completedScores.Average(), 1) : null
        };

        // ── Profile ──────────────────────────────────────────────────────────
        var profile = await _db.CandidateProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId, ct);

        var profileId = profile?.Id;
        var hasWorkExp   = profileId.HasValue && await _db.WorkExperiences.AnyAsync(w => w.CandidateProfileId == profileId.Value, ct);
        var hasEducation = profileId.HasValue && await _db.Educations.AnyAsync(e => e.CandidateProfileId == profileId.Value, ct);
        var hasSkills    = profileId.HasValue && await _db.CandidateSkills.AnyAsync(cs => cs.CandidateProfileId == profileId.Value, ct);

        var profileStats = new ProfileCompleteness
        {
            HasProfile        = profile is not null,
            HasAvatar         = false, // AvatarUrl not tracked in CandidateProfile
            HasWorkExperience = hasWorkExp,
            HasEducation      = hasEducation,
            HasSkills         = hasSkills
        };

        // ── Usage Today ───────────────────────────────────────────────────────
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var dailyUsage = await _db.UserDailyUsages
            .FirstOrDefaultAsync(u => u.UserId == userId && u.UsageDate == today, ct);

        var usageToday = new UsageTodayStats
        {
            ResumeActivityCount = dailyUsage?.CvOptimizationCount ?? 0,  // resume.upload + resume.parse
            InterviewUsed       = dailyUsage?.InterviewCount      ?? 0,
            MatchActivityCount  = dailyUsage?.MultiMatchCount     ?? 0,   // match.create + match.complete
            MentorBookingUsed   = dailyUsage?.MentorBookingCount  ?? 0
        };

        // ── Onboarding ────────────────────────────────────────────────────────
        var onboardingSteps = await _db.OnboardingProgress
            .Where(o => o.UserId == userId)
            .OrderBy(o => o.CreatedAt)
            .Select(o => new OnboardingStepInfo
            {
                StepCode    = o.StepCode,
                Status      = o.Status,
                CompletedAt = o.CompletedAt
            })
            .ToArrayAsync(ct);

        return Result<DashboardSummaryResponse>.Success(new DashboardSummaryResponse
        {
            Resumes         = resumeStats,
            JobDescriptions = new JobDescriptionStats { Total = jdCount },
            Matches         = matchStats,
            Profile         = profileStats,
            UsageToday      = usageToday,
            OnboardingSteps = onboardingSteps
        });
    }
}
