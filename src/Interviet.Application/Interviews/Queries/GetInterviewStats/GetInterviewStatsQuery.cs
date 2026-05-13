using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Interviews;
using Interviet.Shared.Results;

namespace Interviet.Application.Interviews.Queries.GetInterviewStats;

public sealed record GetInterviewStatsQuery(Guid UserId) : IRequest<Result<InterviewStatsResponse>>;

public sealed class GetInterviewStatsQueryHandler
    : IRequestHandler<GetInterviewStatsQuery, Result<InterviewStatsResponse>>
{
    private readonly IAppDbContext _db;

    public GetInterviewStatsQueryHandler(IAppDbContext db) => _db = db;

    public async Task<Result<InterviewStatsResponse>> Handle(GetInterviewStatsQuery request, CancellationToken ct)
    {
        var sessions = await _db.InterviewSessions
            .Where(s => s.UserId == request.UserId)
            .Select(s => new
            {
                s.Id, s.Status, s.RoleName, s.SeniorityLevel, s.InterviewType, s.Mode,
                s.DurationMinutes, s.CreatedAt, s.StartedAt, s.CompletedAt,
                QuestionCount = s.Questions.Count()
            })
            .ToListAsync(ct);

        var completedIds = sessions
            .Where(s => s.Status == "completed")
            .Select(s => s.Id)
            .ToList();

        var scores = await _db.InterviewReports
            .Where(r => completedIds.Contains(r.InterviewSessionId) && r.OverallScore != null)
            .Select(r => new { r.InterviewSessionId, r.OverallScore })
            .ToListAsync(ct);

        var scoreMap = scores.ToDictionary(s => s.InterviewSessionId, s => s.OverallScore);

        decimal? avg = scores.Count > 0 ? scores.Average(s => s.OverallScore) : null;
        decimal? best = scores.Count > 0 ? scores.Max(s => s.OverallScore) : null;
        int totalMinutes = sessions.Where(s => s.Status == "completed").Sum(s => s.DurationMinutes);

        var recent = sessions
            .OrderByDescending(s => s.CreatedAt)
            .Take(5)
            .Select(s => new InterviewSessionListItemResponse
            {
                SessionId       = s.Id,
                Status          = s.Status,
                Position        = s.RoleName,
                Level           = s.SeniorityLevel,
                InterviewType   = s.InterviewType,
                Mode            = s.Mode,
                DurationMinutes = s.DurationMinutes,
                QuestionCount   = s.QuestionCount,
                AnsweredCount   = 0,   // not projected in stats list query — use GET detail for full info
                OverallScore    = scoreMap.GetValueOrDefault(s.Id),
                CreatedAt       = s.CreatedAt,
                StartedAt       = s.StartedAt,
                CompletedAt     = s.CompletedAt
            }).ToList();

        return Result<InterviewStatsResponse>.Success(new InterviewStatsResponse
        {
            TotalSessions      = sessions.Count,
            CompletedSessions  = completedIds.Count,
            AverageScore       = avg,
            BestScore          = best,
            TotalMinutes       = totalMinutes,
            RecentSessions     = recent
        });
    }
}
