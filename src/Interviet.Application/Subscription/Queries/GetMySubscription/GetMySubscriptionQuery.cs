using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Subscription;
using Interviet.Domain.Billing;
using Interviet.Shared.Results;

namespace Interviet.Application.Subscription.Queries.GetMySubscription;

public sealed record GetMySubscriptionQuery(Guid UserId) : IRequest<Result<SubscriptionResponse>>;

public sealed class GetMySubscriptionQueryHandler : IRequestHandler<GetMySubscriptionQuery, Result<SubscriptionResponse>>
{
    private readonly IAppDbContext _db;

    public GetMySubscriptionQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<Result<SubscriptionResponse>> Handle(GetMySubscriptionQuery request, CancellationToken ct)
    {
        var sub = await _db.Subscriptions
            .Include(s => s.Plan)
            .Where(s => s.UserId == request.UserId && s.Status == SubscriptionStatus.Active)
            .OrderByDescending(s => s.CurrentPeriodEndsAt)
            .FirstOrDefaultAsync(ct);

        if (sub != null)
        {
            return Result<SubscriptionResponse>.Success(new SubscriptionResponse
            {
                Id = sub.Id,
                PlanId = sub.PlanId,
                PlanName = sub.Plan.Name,
                Status = sub.Status,
                CurrentPeriodStartsAt = sub.CurrentPeriodStartsAt,
                CurrentPeriodEndsAt = sub.CurrentPeriodEndsAt,
                AutoRenewEnabled = sub.AutoRenewEnabled,
                CancelAtPeriodEnd = sub.CancelAtPeriodEnd
            });
        }

        // Default to Free
        var freePlan = await _db.Plans.FirstOrDefaultAsync(p => p.Code == "Free", ct);
        if (freePlan == null) return Error.NotFound("Plan.NotFound", "Free plan not found.");

        return Result<SubscriptionResponse>.Success(new SubscriptionResponse
        {
            Id = Guid.Empty,
            PlanId = freePlan.Id,
            PlanName = freePlan.Name,
            Status = SubscriptionStatus.Free,
            CurrentPeriodStartsAt = DateTime.UtcNow,
            CurrentPeriodEndsAt = DateTime.UtcNow.AddYears(100),
            AutoRenewEnabled = false,
            CancelAtPeriodEnd = false
        });
    }
}
