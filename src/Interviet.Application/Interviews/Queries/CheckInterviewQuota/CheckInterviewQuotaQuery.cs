using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Interviews;
using Interviet.Shared.Results;

namespace Interviet.Application.Interviews.Queries.CheckInterviewQuota;

public sealed record CheckInterviewQuotaQuery(Guid UserId) : IRequest<Result<CheckInterviewQuotaResponse>>;

public sealed class CheckInterviewQuotaQueryHandler
    : IRequestHandler<CheckInterviewQuotaQuery, Result<CheckInterviewQuotaResponse>>
{
    private readonly IAppDbContext _db;

    public CheckInterviewQuotaQueryHandler(IAppDbContext db) => _db = db;

    public async Task<Result<CheckInterviewQuotaResponse>> Handle(CheckInterviewQuotaQuery request, CancellationToken ct)
    {
        // Resolve plan for user
        var sub = await _db.Subscriptions
            .Include(s => s.Plan)
            .Where(s => s.UserId == request.UserId &&
                        (s.Status == Domain.Billing.SubscriptionStatus.Active ||
                         s.Status == Domain.Billing.SubscriptionStatus.Trial))
            .OrderByDescending(s => s.CurrentPeriodEndsAt)
            .FirstOrDefaultAsync(ct);

        var planId  = sub?.PlanId ?? Guid.Parse("11111111-1111-1111-1111-111111111111");
        var planKey = sub?.Plan?.Code ?? "free";

        // Load policy for interview.ai
        var policy = await _db.UsageQuotaPolicies
            .FirstOrDefaultAsync(p => p.PlanId == planId && p.FeatureKey == QuotaFeatureKeys.InterviewAi, ct);

        // Load current counter
        var today   = DateOnly.FromDateTime(DateTime.UtcNow);
        var counter = await _db.UserQuotaCounters
            .FirstOrDefaultAsync(c =>
                c.UserId     == request.UserId &&
                c.FeatureKey == QuotaFeatureKeys.InterviewAi &&
                c.PeriodType == "daily" &&
                c.PeriodKey  == today.ToString("yyyy-MM-dd"), ct);

        int used      = counter?.UsedValue ?? 0;
        bool isUnlimited = policy?.IsUnlimited ?? false;
        int? limitValue  = isUnlimited ? null : (policy?.MaxValue);
        int? remaining   = isUnlimited ? null : Math.Max(0, (limitValue ?? 0) - used);
        bool canCreate   = isUnlimited || (limitValue is null) || (used < limitValue);

        return Result<CheckInterviewQuotaResponse>.Success(new CheckInterviewQuotaResponse
        {
            FeatureKey     = QuotaFeatureKeys.InterviewAi,
            CanCreate      = canCreate,
            LimitValue     = limitValue,
            UsedToday      = used,
            RemainingValue = remaining,
            IsUnlimited    = isUnlimited,
            PlanKey        = planKey,
            Message        = canCreate
                ? (isUnlimited
                    ? "Không giới hạn số lượt phỏng vấn."
                    : $"Còn {remaining} lượt phỏng vấn hôm nay.")
                : "Bạn đã sử dụng hết số lượt phỏng vấn hôm nay. Nâng cấp plan để có thêm lượt."
        });
    }
}
