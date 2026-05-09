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
        var sub = await _db.Subscriptions
            .Include(s => s.Plan)
            .Where(s => s.UserId == request.UserId && (s.Status == Domain.Billing.SubscriptionStatus.Active || s.Status == Domain.Billing.SubscriptionStatus.Trial))
            .OrderByDescending(s => s.CurrentPeriodEndsAt)
            .FirstOrDefaultAsync(ct);

        var planId = sub?.PlanId ?? Guid.Parse("11111111-1111-1111-1111-111111111111");
        var planKey = sub?.Plan?.Code ?? "free";

        var policies = await _db.UsageQuotaPolicies
            .Where(p => p.PlanId == planId)
            .ToDictionaryAsync(p => p.FeatureKey, p => p, ct);

        var counters = await _db.UserQuotaCounters
            .Where(c => c.UserId == request.UserId)
            .OrderBy(c => c.FeatureKey)
            .Select(c => new QuotaCounterItem
            {
                FeatureKey     = c.FeatureKey,
                PeriodType     = c.PeriodType,
                PeriodKey      = c.PeriodKey,
                PlanKey        = planKey,
                UsedValue      = c.UsedValue,
                RemainingValue = c.RemainingValue,
                LastConsumedAt = c.LastConsumedAt
            })
            .ToListAsync(ct);

        foreach (var c in counters)
        {
            if (policies.TryGetValue(c.FeatureKey, out var policy))
            {
                if (policy.IsUnlimited)
                {
                    c.LimitValue = null;
                    c.RemainingValue = null;
                }
                else
                {
                    c.LimitValue = policy.MaxValue;
                    c.RemainingValue = Math.Max(0, policy.MaxValue - c.UsedValue);
                }
            }
        }

        return Result<QuotaSnapshotResponse>.Success(new QuotaSnapshotResponse
        {
            Counters = counters.ToArray()
        });
    }
}
