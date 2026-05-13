using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Interviews;
using Interviet.Shared.Results;
using Interviet.Domain.Interviews;

namespace Interviet.Application.Interviews.Queries.GetMyInterviews;

public sealed record GetMyInterviewsQuery(Guid UserId, int Page = 1, int PageSize = 20)
    : IRequest<Result<GetMyInterviewsResult>>;

public sealed class GetMyInterviewsQueryHandler
    : IRequestHandler<GetMyInterviewsQuery, Result<GetMyInterviewsResult>>
{
    private readonly IAppDbContext _db;

    public GetMyInterviewsQueryHandler(IAppDbContext db) => _db = db;

    public async Task<Result<GetMyInterviewsResult>> Handle(GetMyInterviewsQuery request, CancellationToken ct)
    {
        var page     = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 50);

        var query = _db.InterviewSessions
            .Where(s => s.UserId == request.UserId)
            .OrderByDescending(s => s.CreatedAt);

        var total = await query.CountAsync(ct);

        var sessions = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new
            {
                s.Id, s.Status, s.RoleName, s.SeniorityLevel, s.InterviewType, s.Mode, s.AiModel,
                s.DurationMinutes, s.CreatedAt, s.StartedAt, s.CompletedAt,
                QuestionCount = s.Questions.Count(),
                AnsweredCount = s.Questions.Count(q => q.Answer != null),
                OverallScore  = (decimal?)_db.InterviewReports
                    .Where(r => r.InterviewSessionId == s.Id)
                    .Select(r => r.OverallScore)
                    .FirstOrDefault()
            })
            .ToListAsync(ct);

        var items = sessions.Select(s => new InterviewSessionListItemResponse
        {
            SessionId       = s.Id,
            Status          = s.Status,
            Position        = s.RoleName,
            Level           = s.SeniorityLevel,
            InterviewType   = s.InterviewType,
            Mode            = s.Mode,
            AiModel         = s.AiModel,
            DurationMinutes = s.DurationMinutes,
            QuestionCount   = s.QuestionCount,
            AnsweredCount   = s.AnsweredCount,
            OverallScore    = s.OverallScore,
            CreatedAt       = s.CreatedAt,
            StartedAt       = s.StartedAt,
            CompletedAt     = s.CompletedAt
        }).ToList();

        return Result<GetMyInterviewsResult>.Success(new GetMyInterviewsResult(items, total, page, pageSize));
    }
}
