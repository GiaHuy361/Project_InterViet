using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Domain.Billing;
using Interviet.Shared.Results;

namespace Interviet.Application.Subscription.Commands.CancelSubscription;

public sealed record CancelSubscriptionCommand(Guid UserId) : IRequest<Result>;

public sealed class CancelSubscriptionCommandHandler : IRequestHandler<CancelSubscriptionCommand, Result>
{
    private readonly IAppDbContext _db;

    public CancelSubscriptionCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<Result> Handle(CancelSubscriptionCommand request, CancellationToken ct)
    {
        var activeSub = await _db.Subscriptions
            .Where(s => s.UserId == request.UserId && s.Status == SubscriptionStatus.Active)
            .FirstOrDefaultAsync(ct);

        if (activeSub == null) return Error.NotFound("Subscription.NotFound", "Bạn không có gói nào đang active.");

        // Cancel at period end
        activeSub.CancelAtPeriodEnd = true;
        activeSub.AutoRenewEnabled = false;
        activeSub.UpdatedAt = DateTime.UtcNow;

        _db.SubscriptionChangeLogs.Add(new SubscriptionChangeLog
        {
            Id = Guid.NewGuid(),
            SubscriptionId = activeSub.Id,
            UserId = request.UserId,
            ChangeType = "cancel",
            EffectiveAt = activeSub.CurrentPeriodEndsAt,
            Reason = "User requested cancellation",
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync(ct);
        return Result.Success();
    }
}
