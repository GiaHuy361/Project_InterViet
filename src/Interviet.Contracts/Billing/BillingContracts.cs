namespace Interviet.Contracts.Billing;

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
    public decimal Amount { get; init; }
    public string CurrencyCode { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public DateTime? PaidAt { get; init; }
    public DateTime? FailedAt { get; init; }
}
