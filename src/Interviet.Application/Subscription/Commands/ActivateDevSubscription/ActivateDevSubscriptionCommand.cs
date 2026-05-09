using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Common.Options;
using Interviet.Contracts.Subscription;
using Interviet.Domain.Billing;
using Interviet.Shared.Results;

namespace Interviet.Application.Subscription.Commands.ActivateDevSubscription;

public sealed record ActivateDevSubscriptionCommand(Guid UserId, string PlanKey) : IRequest<Result<SubscriptionResponse>>;

public sealed class ActivateDevSubscriptionCommandHandler : IRequestHandler<ActivateDevSubscriptionCommand, Result<SubscriptionResponse>>
{
    private readonly IAppDbContext _db;
    private readonly BillingOptions _billingOptions;

    public ActivateDevSubscriptionCommandHandler(IAppDbContext db, IOptions<BillingOptions> billingOptions)
    {
        _db = db;
        _billingOptions = billingOptions.Value;
    }

    public async Task<Result<SubscriptionResponse>> Handle(ActivateDevSubscriptionCommand request, CancellationToken ct)
    {
        if (!_billingOptions.EnableDevSubscriptionActivation)
        {
            return Error.Forbidden("Forbidden", "Dev subscription activation is disabled in this environment.");
        }

        var plan = await _db.Plans.FirstOrDefaultAsync(p => p.Code == request.PlanKey && p.IsActive, ct);
        if (plan == null) return Error.NotFound("Plan.NotFound", "Invalid plan key.");

        var activeSub = await _db.Subscriptions
            .Where(s => s.UserId == request.UserId && (s.Status == SubscriptionStatus.Active || s.Status == SubscriptionStatus.Trial))
            .FirstOrDefaultAsync(ct);

        DateTime now = DateTime.UtcNow;
        DateTime endsAt;
        string newStatus = SubscriptionStatus.Active;
        string reason = "Dev activation";
        string changeType = "dev_upgrade";

        if (plan.TrialDays > 0)
        {
            bool hasUsedTrial = await _db.SubscriptionChangeLogs
                .AnyAsync(c => c.UserId == request.UserId && c.Reason == "Trial activation", ct);

            if (hasUsedTrial)
            {
                return Error.Forbidden("Trial.AlreadyUsed", "Bạn đã sử dụng gói dùng thử trước đó.");
            }

            endsAt = now.AddDays(plan.TrialDays);
            newStatus = SubscriptionStatus.Trial;
            reason = "Trial activation";
            changeType = "dev_trial";
        }
        else
        {
            endsAt = plan.BillingCycle switch
            {
                "monthly" => now.AddMonths(1),
                "quarterly" => now.AddMonths(3),
                "yearly" => now.AddYears(1),
                _ => now.AddMonths(1) // default fallback
            };
        }

        if (activeSub != null)
        {
            // Update existing
            var oldPlanId = activeSub.PlanId;
            activeSub.PlanId = plan.Id;
            activeSub.Status = newStatus;
            activeSub.CurrentPeriodStartsAt = now;
            activeSub.CurrentPeriodEndsAt = endsAt;
            activeSub.UpdatedAt = now;

            _db.SubscriptionChangeLogs.Add(new SubscriptionChangeLog
            {
                Id = Guid.NewGuid(),
                SubscriptionId = activeSub.Id,
                UserId = request.UserId,
                ChangeType = changeType,
                FromPlanId = oldPlanId,
                ToPlanId = plan.Id,
                EffectiveAt = now,
                Reason = reason,
                CreatedAt = now
            });
        }
        else
        {
            // Create new
            activeSub = new Domain.Billing.Subscription
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                PlanId = plan.Id,
                Status = newStatus,
                CurrentPeriodStartsAt = now,
                CurrentPeriodEndsAt = endsAt,
                AutoRenewEnabled = true,
                CancelAtPeriodEnd = false,
                CreatedAt = now,
                UpdatedAt = now
            };
            _db.Subscriptions.Add(activeSub);

            _db.SubscriptionChangeLogs.Add(new SubscriptionChangeLog
            {
                Id = Guid.NewGuid(),
                SubscriptionId = activeSub.Id,
                UserId = request.UserId,
                ChangeType = changeType == "dev_upgrade" ? "dev_activate" : changeType,
                FromPlanId = null,
                ToPlanId = plan.Id,
                EffectiveAt = now,
                Reason = reason,
                CreatedAt = now
            });
        }

        await _db.SaveChangesAsync(ct);

        return Result<SubscriptionResponse>.Success(new SubscriptionResponse
        {
            Id = activeSub.Id,
            PlanId = activeSub.PlanId,
            PlanName = plan.Name,
            Status = activeSub.Status,
            CurrentPeriodStartsAt = activeSub.CurrentPeriodStartsAt,
            CurrentPeriodEndsAt = activeSub.CurrentPeriodEndsAt,
            AutoRenewEnabled = activeSub.AutoRenewEnabled,
            CancelAtPeriodEnd = activeSub.CancelAtPeriodEnd
        });
    }
}
