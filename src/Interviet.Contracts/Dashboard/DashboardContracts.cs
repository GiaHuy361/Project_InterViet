namespace Interviet.Contracts.Dashboard;

// ── Dashboard Summary ─────────────────────────────────────────────────────────
public sealed class DashboardSummaryResponse
{
    public ResumeStats          Resumes         { get; init; } = new();
    public JobDescriptionStats  JobDescriptions { get; init; } = new();
    public MatchStats           Matches         { get; init; } = new();
    public ProfileCompleteness  Profile         { get; init; } = new();
    public UsageTodayStats      UsageToday      { get; init; } = new();
    public OnboardingStepInfo[] OnboardingSteps { get; init; } = [];
}

public sealed class ResumeStats
{
    public int   Total          { get; init; }
    public int   Parsed         { get; init; }
    public int   Pending        { get; init; }
    public int   Failed         { get; init; }
    public bool  HasActiveResume { get; init; }
}

public sealed class JobDescriptionStats
{
    public int Total { get; init; }
}

public sealed class MatchStats
{
    public int      Total         { get; init; }
    public int      Completed     { get; init; }
    public int      Failed        { get; init; }
    public int      Pending       { get; init; }
    public decimal? BestScore     { get; init; }
    public decimal? AverageScore  { get; init; }
}

public sealed class ProfileCompleteness
{
    public bool HasProfile         { get; init; }
    public bool HasAvatar          { get; init; }
    public bool HasWorkExperience  { get; init; }
    public bool HasEducation       { get; init; }
    public bool HasSkills          { get; init; }
}

public sealed class UsageTodayStats
{
    public int CvOptimizationUsed  { get; init; }
    public int InterviewUsed       { get; init; }
    public int MultiMatchUsed      { get; init; }
    public int MentorBookingUsed   { get; init; }
}

public sealed class OnboardingStepInfo
{
    public string   StepCode     { get; init; } = string.Empty;
    public string   Status       { get; init; } = string.Empty;
    public DateTime? CompletedAt { get; init; }
}

// ── Activity Log ──────────────────────────────────────────────────────────────
public sealed class ActivityTimelineItem
{
    public Guid      Id          { get; init; }
    public string    ActionKey   { get; init; } = string.Empty;
    public string?   EntityType  { get; init; }
    public Guid?     EntityId    { get; init; }
    public string?   Description { get; init; }
    public DateTime  CreatedAt   { get; init; }
}

public sealed class ActivityLogResponse
{
    public int                    Page      { get; init; }
    public int                    PageSize  { get; init; }
    public int                    Total     { get; init; }
    public ActivityTimelineItem[] Items     { get; init; } = [];
}

// ── Usage Summary ─────────────────────────────────────────────────────────────
public sealed class UsageSummaryResponse
{
    public DateOnly              From  { get; init; }
    public DateOnly              To    { get; init; }
    public DailyUsageItem[]      Daily { get; init; } = [];
    public UsageTotals           Totals { get; init; } = new();
}

public sealed class DailyUsageItem
{
    public DateOnly UsageDate              { get; init; }
    public int      CvOptimizationCount   { get; init; }
    public int      InterviewCount         { get; init; }
    public int      MultiMatchCount        { get; init; }
    public int      MentorBookingCount     { get; init; }
}

public sealed class UsageTotals
{
    public int CvOptimizationCount  { get; init; }
    public int InterviewCount        { get; init; }
    public int MultiMatchCount       { get; init; }
    public int MentorBookingCount    { get; init; }
}

// ── Quota Snapshot ────────────────────────────────────────────────────────────
public sealed class QuotaSnapshotResponse
{
    public QuotaCounterItem[] Counters { get; init; } = [];
}

public sealed class QuotaCounterItem
{
    public string    FeatureKey       { get; init; } = string.Empty;
    public string    PeriodType       { get; init; } = string.Empty;
    public string    PeriodKey        { get; init; } = string.Empty;
    public int       UsedValue        { get; init; }
    public int?      RemainingValue   { get; init; }
    public DateTime? LastConsumedAt   { get; init; }
}
