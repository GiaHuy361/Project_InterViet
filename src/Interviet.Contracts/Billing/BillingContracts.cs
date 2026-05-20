namespace Interviet.Contracts.Billing;

// ── Existing contracts (unchanged) ────────────────────────────────────────────

public sealed class PlanResponse
{
    public Guid Id { get; init; }
    public string PlanKey { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public decimal PriceAmount { get; init; }
    public decimal? DisplayPrice { get; init; }
    public string CurrencyCode { get; init; } = string.Empty;
    public string BillingCycle { get; init; } = string.Empty;
    public string? Badge { get; init; }
    public int TrialDays { get; init; }
    public List<PlanFeatureResponse> Features { get; init; } = [];
}

public sealed class PlanFeatureResponse
{
    public string FeatureKey { get; init; } = string.Empty;
    public string FeatureValue { get; init; } = string.Empty;
    public string ValueType { get; init; } = string.Empty;
}

public sealed class InvoiceResponse
{
    public Guid Id { get; init; }
    public string InvoiceNumber { get; init; } = string.Empty;
    public string PlanKey { get; init; } = string.Empty;
    public string Provider { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public string CurrencyCode { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public DateTime IssuedAt { get; init; }
    public DateTime? DueAt { get; init; }
    public DateTime? PaidAt { get; init; }
}

public sealed class PaymentTransactionResponse
{
    public Guid Id { get; init; }
    public string Provider { get; init; } = string.Empty;
    public string PlanKey { get; init; } = string.Empty;
    public Guid? CheckoutSessionId { get; init; }
    public decimal Amount { get; init; }
    public string CurrencyCode { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public DateTime? PaidAt { get; init; }
    public DateTime? FailedAt { get; init; }
}

// ── Phase 10: Mock Payment Gateway ────────────────────────────────────────────

public sealed class CheckoutRequest
{
    public string PlanKey { get; init; } = string.Empty;
    public string Provider { get; init; } = string.Empty;
    public string? ReturnUrl { get; init; }
    public string? CancelUrl { get; init; }
}

public sealed class CheckoutResponse
{
    public Guid CheckoutSessionId { get; init; }
    public string CheckoutUrl { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public DateTime ExpiresAt { get; init; }
    public string Provider { get; init; } = string.Empty;
    public string PlanKey { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public string CurrencyCode { get; init; } = string.Empty;
}

public sealed class CheckoutSessionResponse
{
    public Guid Id { get; init; }
    public string PlanKey { get; init; } = string.Empty;
    public string Provider { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public string CurrencyCode { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string? CheckoutUrl { get; init; }
    public DateTime ExpiresAt { get; init; }
    public DateTime? CompletedAt { get; init; }
    public string? FailureReason { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed class SimulateSuccessRequest { }

public sealed class SimulateSuccessResponse
{
    public Guid CheckoutSessionId { get; init; }
    public Guid PaymentTransactionId { get; init; }
    public Guid InvoiceId { get; init; }
    public string InvoiceNumber { get; init; } = string.Empty;
    public bool IsIdempotent { get; init; }
    public bool EmailSent { get; init; }
    public Guid SubscriptionId { get; init; }
}

public sealed class SimulateFailedRequest
{
    public string? Reason { get; init; }
}

public sealed class SimulateFailedResponse
{
    public Guid CheckoutSessionId { get; init; }
    public string Status { get; init; } = string.Empty;
    public bool IsIdempotent { get; init; }
}

public sealed class SimulateCancelledRequest
{
    public string? Reason { get; init; }
}

public sealed class SimulateCancelledResponse
{
    public Guid CheckoutSessionId { get; init; }
    public string Status { get; init; } = string.Empty;
    public bool IsIdempotent { get; init; }
}

public sealed class ProviderResponse
{
    public string Provider { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public bool IsMock { get; init; }
    public bool Enabled { get; init; }
}

// ── Status Constants ──────────────────────────────────────────────────────────

public static class CheckoutSessionStatus
{
    public const string Pending = "pending";
    public const string Succeeded = "succeeded";
    public const string Failed = "failed";
    public const string Cancelled = "cancelled";
    public const string Expired = "expired";
}

public static class PaymentStatus
{
    public const string Pending = "pending";
    public const string Succeeded = "succeeded";
    public const string Failed = "failed";
    public const string Cancelled = "cancelled";
}

public static class InvoiceStatus
{
    public const string Draft = "draft";
    public const string Open = "open";
    public const string Paid = "paid";
    public const string Void = "void";
}

public static class MockProvider
{
    public const string VnPay = "vnpay";
    public const string Momo = "momo";
    public const string Stripe = "stripe";
    public const string PayOs = "payos";

    private static readonly Dictionary<string, string> DisplayNames = new(StringComparer.OrdinalIgnoreCase)
    {
        [VnPay]  = "VNPay",
        [Momo]   = "Momo",
        [Stripe] = "Stripe",
        [PayOs]  = "PayOS"
    };

    public static readonly HashSet<string> Valid = new(StringComparer.OrdinalIgnoreCase)
    {
        VnPay, Momo, Stripe, PayOs
    };

    public static string GetDisplayName(string provider) =>
        DisplayNames.TryGetValue(provider, out var name) ? name : provider;

    public static bool IsValid(string? provider) =>
        !string.IsNullOrWhiteSpace(provider) && Valid.Contains(provider);
}
