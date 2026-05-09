using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Dashboard;
using Interviet.Shared.Results;

namespace Interviet.Application.Dashboard.Queries.GetQuotaSnapshot;

public sealed record GetQuotaSnapshotQuery(Guid UserId)
    : IRequest<Result<QuotaSnapshotResponse>>;

public sealed class GetQuotaSnapshotQueryHandler
    : IRequestHandler<GetQuotaSnapshotQuery, Result<QuotaSnapshotResponse>>
{
    private readonly IAppDbContext _db;

    public GetQuotaSnapshotQueryHandler(IAppDbContext db) => _db = db;

    public async Task<Result<QuotaSnapshotResponse>> Handle(
        GetQuotaSnapshotQuery request, CancellationToken ct)
    {
        var counters = await _db.UserQuotaCounters
            .Where(c => c.UserId == request.UserId)
            .OrderBy(c => c.FeatureKey)
            .Select(c => new QuotaCounterItem
            {
                FeatureKey     = c.FeatureKey,
                PeriodType     = c.PeriodType,
                PeriodKey      = c.PeriodKey,
                UsedValue      = c.UsedValue,
                RemainingValue = c.RemainingValue,
                LastConsumedAt = c.LastConsumedAt
            })
            .ToArrayAsync(ct);

        return Result<QuotaSnapshotResponse>.Success(new QuotaSnapshotResponse
        {
            Counters = counters
        });
    }
}
