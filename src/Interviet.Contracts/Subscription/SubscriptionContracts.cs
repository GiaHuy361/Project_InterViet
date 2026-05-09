namespace Interviet.Contracts.Subscription;

public sealed class SubscriptionResponse
{
    public Guid Id { get; init; }
    public Guid PlanId { get; init; }
    public string PlanName { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public DateTime CurrentPeriodStartsAt { get; init; }
    public DateTime CurrentPeriodEndsAt { get; init; }
    public bool AutoRenewEnabled { get; set; }
    public bool CancelAtPeriodEnd { get; set; }
}

public sealed class DevActivateSubscriptionRequest
{
    public string PlanKey { get; init; } = string.Empty;
}
