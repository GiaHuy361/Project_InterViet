using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Matching;
using Interviet.Domain.Matching;
using Interviet.Shared.Results;

namespace Interviet.Application.Matching.Queries.GetMyMatches;

public sealed record GetMyMatchesQuery(
    Guid UserId,
    int Page = 1,
    int PageSize = 10
) : IRequest<Result<GetMyMatchesResult>>;

public sealed class GetMyMatchesQueryHandler
    : IRequestHandler<GetMyMatchesQuery, Result<GetMyMatchesResult>>
{
    private readonly IAppDbContext _db;

    public GetMyMatchesQueryHandler(IAppDbContext db) => _db = db;

    public async Task<Result<GetMyMatchesResult>> Handle(
        GetMyMatchesQuery request, CancellationToken ct)
    {
        var page     = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 50);

        var query = _db.MatchSessions
            .Include(s => s.Targets)
                .ThenInclude(t => t.Result)
            .Where(s => s.UserId == request.UserId)
            .OrderByDescending(s => s.RequestedAt);

        var total = await query.CountAsync(ct);

        var sessions = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var items = sessions
            .Select(MapToResponse)
            .ToList();

        return Result<GetMyMatchesResult>.Success(
            new GetMyMatchesResult(items, total, page, pageSize));
    }

    internal static MatchSessionResponse MapToResponse(MatchSession s)
    {
        var targetCount = s.Targets.Count;
        var completedCount = s.Targets.Count(t => t.Status == MatchSessionStatus.Completed);
        var failedCount = s.Targets.Count(t => t.Status == MatchSessionStatus.Failed);
        
        var completedResults = s.Targets
            .Where(t => t.Status == MatchSessionStatus.Completed && t.Result != null)
            .Select(t => t.Result!)
            .ToList();
            
        decimal? bestScore = completedResults.Count > 0 ? completedResults.Max(r => r.TotalScore) : null;
        decimal? averageScore = completedResults.Count > 0 ? completedResults.Average(r => r.TotalScore) : null;

        var mappedTargets = s.Targets
            .OrderByDescending(t => t.Status == MatchSessionStatus.Completed ? 1 : 0) // completed first
            .ThenByDescending(t => t.Result?.TotalScore ?? -1) // total score desc
            .ThenByDescending(t => t.CompletedAt ?? DateTime.MinValue) // completedAt desc
            .Select(t => new MatchTargetResponse
            {
                TargetId = t.Id,
                JobDescriptionId = t.JobDescriptionId,
                Status = t.Status,
                ErrorCode = t.ErrorCode,
                CompletedAt = t.CompletedAt,
                TotalScore = t.Result?.TotalScore,
                TechnicalScore = t.Result?.TechnicalScore,
                ExperienceScore = t.Result?.ExperienceScore,
                EducationScore = t.Result?.EducationScore,
                LanguageScore = t.Result?.LanguageScore,
                SummaryText = t.Result?.SummaryText,
                MatchedSkillsJson = t.Result?.MatchedSkillsJson,
                MissingSkillsJson = t.Result?.MissingSkillsJson
            })
            .ToList();

        var firstResult = s.SessionType == MatchSessionType.Single 
            ? completedResults.FirstOrDefault() 
            : null;

        return new MatchSessionResponse
        {
            SessionId        = s.Id,
            ResumeId         = s.ResumeId,
            ResumeVersionId  = s.ResumeVersionId,
            JobDescriptionId = s.JobDescriptionId,
            SessionType      = s.SessionType,
            Status           = s.Status,
            ErrorCode        = s.ErrorCode,
            ErrorMessage     = s.ErrorMessage,
            RequestedAt      = s.RequestedAt,
            CompletedAt      = s.CompletedAt,
            TargetCount      = targetCount > 0 ? targetCount : s.TargetCount,
            CompletedCount   = completedCount,
            FailedCount      = failedCount,
            BestScore        = bestScore,
            AverageScore     = averageScore,
            Targets          = mappedTargets,
            Result           = firstResult is null ? null : new MatchResultResponse
            {
                Id              = firstResult.Id,
                TotalScore      = firstResult.TotalScore,
                TechnicalScore  = firstResult.TechnicalScore,
                ExperienceScore = firstResult.ExperienceScore,
                EducationScore  = firstResult.EducationScore,
                LanguageScore   = firstResult.LanguageScore,
                MatchBand       = firstResult.MatchBand,
                SummaryText     = firstResult.SummaryText,
                MatchedSkillsJson = firstResult.MatchedSkillsJson,
                MissingSkillsJson = firstResult.MissingSkillsJson,
                StrengthsJson   = firstResult.StrengthsJson,
                WeaknessesJson  = firstResult.WeaknessesJson,
                SuggestionsJson = firstResult.SuggestionsJson,
                ModelVersion    = firstResult.ModelVersion,
                SchemaVersion   = firstResult.SchemaVersion,
                CreatedAt       = firstResult.CreatedAt
            }
        };
    }
}
