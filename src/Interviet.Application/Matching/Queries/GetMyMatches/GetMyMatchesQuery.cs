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
        var target = s.Targets.FirstOrDefault();
        var result = target?.Result;

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
            Result           = result is null ? null : new MatchResultResponse
            {
                Id              = result.Id,
                TotalScore      = result.TotalScore,
                TechnicalScore  = result.TechnicalScore,
                ExperienceScore = result.ExperienceScore,
                EducationScore  = result.EducationScore,
                LanguageScore   = result.LanguageScore,
                MatchBand       = result.MatchBand,
                SummaryText     = result.SummaryText,
                MatchedSkillsJson = result.MatchedSkillsJson,
                MissingSkillsJson = result.MissingSkillsJson,
                StrengthsJson   = result.StrengthsJson,
                WeaknessesJson  = result.WeaknessesJson,
                SuggestionsJson = result.SuggestionsJson,
                ModelVersion    = result.ModelVersion,
                SchemaVersion   = result.SchemaVersion,
                CreatedAt       = result.CreatedAt
            }
        };
    }
}
