using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Dashboard;
using Interviet.Shared.Results;

namespace Interviet.Application.Dashboard.Queries.GetUsageSummary;

public sealed record GetUsageSummaryQuery(Guid UserId, DateOnly From, DateOnly To)
    : IRequest<Result<UsageSummaryResponse>>;

public sealed class GetUsageSummaryQueryHandler
    : IRequestHandler<GetUsageSummaryQuery, Result<UsageSummaryResponse>>
{
    private readonly IAppDbContext _db;

    public GetUsageSummaryQueryHandler(IAppDbContext db) => _db = db;

    public async Task<Result<UsageSummaryResponse>> Handle(
        GetUsageSummaryQuery request, CancellationToken ct)
    {
        // Clamp range to 90 days max to prevent heavy queries
        var from = request.From;
        var to   = request.To < request.From ? request.From : request.To;
        if ((to.ToDateTime(TimeOnly.MinValue) - from.ToDateTime(TimeOnly.MinValue)).TotalDays > 90)
            to = DateOnly.FromDateTime(from.ToDateTime(TimeOnly.MinValue).AddDays(90));

        var rows = await _db.UserDailyUsages
            .Where(u => u.UserId == request.UserId && u.UsageDate >= from && u.UsageDate <= to)
            .OrderBy(u => u.UsageDate)
            .ToListAsync(ct);

        var daily = rows.Select(u => new DailyUsageItem
        {
            UsageDate           = u.UsageDate,
            ResumeActivityCount = u.CvOptimizationCount,   // resume.upload + resume.parse
            InterviewCount      = u.InterviewCount,
            MatchActivityCount  = u.MultiMatchCount,        // match.create + match.complete
            MentorBookingCount  = u.MentorBookingCount
        }).ToArray();

        var totals = new UsageTotals
        {
            ResumeActivityCount = rows.Sum(u => u.CvOptimizationCount),
            InterviewCount      = rows.Sum(u => u.InterviewCount),
            MatchActivityCount  = rows.Sum(u => u.MultiMatchCount),
            MentorBookingCount  = rows.Sum(u => u.MentorBookingCount)
        };

        return Result<UsageSummaryResponse>.Success(new UsageSummaryResponse
        {
            From   = from,
            To     = to,
            Daily  = daily,
            Totals = totals
        });
    }
}
