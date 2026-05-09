using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Dashboard;
using Interviet.Shared.Results;

namespace Interviet.Application.Dashboard.Queries.GetActivityLog;

public sealed record GetActivityLogQuery(Guid UserId, int Page, int PageSize)
    : IRequest<Result<ActivityLogResponse>>;

public sealed class GetActivityLogQueryHandler
    : IRequestHandler<GetActivityLogQuery, Result<ActivityLogResponse>>
{
    private readonly IAppDbContext _db;

    public GetActivityLogQueryHandler(IAppDbContext db) => _db = db;

    public async Task<Result<ActivityLogResponse>> Handle(
        GetActivityLogQuery request, CancellationToken ct)
    {
        var page     = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);
        var skip     = (page - 1) * pageSize;

        var query = _db.ActivityLogs
            .Where(a => a.UserId == request.UserId)
            .OrderByDescending(a => a.CreatedAt);

        var total = await query.CountAsync(ct);

        var items = await query
            .Skip(skip)
            .Take(pageSize)
            .Select(a => new ActivityTimelineItem
            {
                Id          = a.Id,
                ActionKey   = a.ActionKey,
                EntityType  = a.EntityType,
                EntityId    = a.EntityId,
                Description = a.Description,
                CreatedAt   = a.CreatedAt
            })
            .ToArrayAsync(ct);

        return Result<ActivityLogResponse>.Success(new ActivityLogResponse
        {
            Page     = page,
            PageSize = pageSize,
            Total    = total,
            Items    = items
        });
    }
}
