using Interviet.Domain.Common;

namespace Interviet.Domain.Dashboard;

public class OnboardingProgress : AuditableEntity
{
    public Guid UserId { get; set; }
    public string StepCode { get; set; } = string.Empty;

    /// <summary>pending | completed | skipped</summary>
    public string Status { get; set; } = "pending";
    public DateTime? CompletedAt { get; set; }
    public DateTime? SkippedAt { get; set; }
}

public class DashboardSnapshot : BaseEntity
{
    public Guid UserId { get; set; }
    public DateOnly SnapshotDate { get; set; }
    public decimal? AverageMatchScore { get; set; }
    public decimal? BestMatchScore { get; set; }
    public int CvOptimizationUsedToday { get; set; }
    public int InterviewUsedToday { get; set; }
    public int UpcomingMentorCount { get; set; }
    public string? RecentSummaryJson { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
