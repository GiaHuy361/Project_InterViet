using Interviet.Domain.Common;

namespace Interviet.Domain.Quotas;

public class UsageQuotaPolicy : BaseEntity
{
    public Guid PlanId { get; set; }
    public string FeatureKey { get; set; } = string.Empty;

    /// <summary>daily | weekly | monthly</summary>
    public string PeriodType { get; set; } = string.Empty;
    public int MaxValue { get; set; }
    public byte? ResetHourUtc { get; set; }
    public bool IsUnlimited { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class UserQuotaCounter : AuditableEntity
{
    public Guid UserId { get; set; }
    public string FeatureKey { get; set; } = string.Empty;
    public string PeriodType { get; set; } = string.Empty;

    /// <summary>e.g. "2026-04-23" for daily, "2026-04" for monthly</summary>
    public string PeriodKey { get; set; } = string.Empty;
    public int UsedValue { get; set; }
    public int? RemainingValue { get; set; }
    public DateTime? LastConsumedAt { get; set; }

    /// <summary>EF Core optimistic concurrency — prevents quota race conditions.</summary>
    public byte[] RowVersion { get; set; } = [];
}

public class QuotaConsumptionLog : BaseEntity
{
    public Guid UserId { get; set; }
    public string FeatureKey { get; set; } = string.Empty;
    public string PeriodType { get; set; } = string.Empty;
    public string PeriodKey { get; set; } = string.Empty;
    public int DeltaValue { get; set; }
    public string ReferenceType { get; set; } = string.Empty;
    public Guid? ReferenceId { get; set; }

    /// <summary>consumed | reverted | failed</summary>
    public string Status { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class UserDailyUsage : AuditableEntity
{
    public Guid UserId { get; set; }
    public DateOnly UsageDate { get; set; }
    public int CvOptimizationCount { get; set; }
    public int InterviewCount { get; set; }
    public int MultiMatchCount { get; set; }
    public int MentorBookingCount { get; set; }
}
