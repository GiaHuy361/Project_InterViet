using Interviet.Domain.Common;

namespace Interviet.Domain.Billing;

public class Plan : AuditableEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;

    /// <summary>free | monthly | quarterly | yearly</summary>
    public string BillingCycle { get; set; } = string.Empty;
    public decimal PriceAmount { get; set; }
    public string CurrencyCode { get; set; } = "VND";
    public int TrialDays { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }

    public ICollection<PlanEntitlement> Entitlements { get; set; } = [];
}

public class PlanEntitlement : BaseEntity
{
    public Guid PlanId { get; set; }
    public string FeatureKey { get; set; } = string.Empty;
    public string FeatureValue { get; set; } = string.Empty;

    /// <summary>int | bool | string | decimal</summary>
    public string ValueType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Plan Plan { get; set; } = null!;
}

public class BillingProfile : AuditableEntity
{
    public Guid UserId { get; set; }
    public string? BillingName { get; set; }
    public string? TaxCode { get; set; }
    public string? CompanyName { get; set; }
    public string? BillingEmail { get; set; }
    public string? BillingAddress { get; set; }
}

public class StoredPaymentMethod : AuditableEntity
{
    public Guid UserId { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string MethodType { get; set; } = string.Empty;
    public string? ProviderReference { get; set; }
    public string? MaskedDisplay { get; set; }
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; } = true;
}

public class Subscription : AuditableEntity
{
    public Guid UserId { get; set; }
    public Guid PlanId { get; set; }

    /// <summary>free | trial | active | grace_period | cancelled | expired | suspended</summary>
    public string Status { get; set; } = SubscriptionStatus.Free;

    public DateTime? TrialStartedAt { get; set; }
    public DateTime? TrialEndsAt { get; set; }
    public DateTime CurrentPeriodStartsAt { get; set; }
    public DateTime CurrentPeriodEndsAt { get; set; }
    public bool CancelAtPeriodEnd { get; set; }
    public DateTime? CancelledAt { get; set; }
    public DateTime? ExpiredAt { get; set; }
    public bool AutoRenewEnabled { get; set; } = true;
    public Guid? StoredPaymentMethodId { get; set; }

    /// <summary>EF Core optimistic concurrency token.</summary>
    public byte[] RowVersion { get; set; } = [];

    public Plan Plan { get; set; } = null!;
    public ICollection<SubscriptionChangeLog> ChangeLogs { get; set; } = [];
}

public static class SubscriptionStatus
{
    public const string Free = "free";
    public const string Trial = "trial";
    public const string Active = "active";
    public const string GracePeriod = "grace_period";
    public const string Cancelled = "cancelled";
    public const string Expired = "expired";
    public const string Suspended = "suspended";
}

public class SubscriptionChangeLog : BaseEntity
{
    public Guid SubscriptionId { get; set; }
    public Guid UserId { get; set; }
    public string ChangeType { get; set; } = string.Empty;
    public Guid? FromPlanId { get; set; }
    public Guid? ToPlanId { get; set; }
    public DateTime EffectiveAt { get; set; }
    public string? Reason { get; set; }
    public string? MetadataJson { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class PaymentTransaction : AuditableEntity
{
    public Guid UserId { get; set; }
    public Guid? SubscriptionId { get; set; }
    public Guid? PlanId { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string? MethodType { get; set; }
    public string? ExternalOrderId { get; set; }
    public string? ExternalTransactionId { get; set; }
    public string? IdempotencyKey { get; set; }
    public decimal Amount { get; set; }
    public string CurrencyCode { get; set; } = "VND";

    /// <summary>pending | succeeded | failed | cancelled | refunded</summary>
    public string Status { get; set; } = "pending";

    public DateTime? PaidAt { get; set; }
    public DateTime? FailedAt { get; set; }
    public string? FailureCode { get; set; }
    public string? FailureMessage { get; set; }
    public string? RawPayloadJson { get; set; }
}

public class Invoice : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid? SubscriptionId { get; set; }
    public Guid? PaymentTransactionId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string CurrencyCode { get; set; } = "VND";
    public string Status { get; set; } = string.Empty;
    public DateTime IssuedAt { get; set; }
    public DateTime? DueAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public Guid? PdfFileId { get; set; }
    public string? MetadataJson { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
