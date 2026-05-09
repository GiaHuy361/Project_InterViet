namespace Interviet.Application.Common.Interfaces;

/// <summary>
/// Tracks daily feature usage, quota counters, and consumption logs per user.
/// Implementations handle upsert + concurrency internally.
/// Never throws externally — failures are logged and swallowed.
/// </summary>
public interface IUsageTracker
{
    /// <summary>
    /// Record one unit of feature usage for userId on the given UTC date.
    /// Upserts UserDailyUsage and UserQuotaCounter, writes QuotaConsumptionLog.
    /// </summary>
    Task TrackAsync(
        Guid userId,
        string featureKey,
        string referenceType,
        Guid? referenceId = null,
        CancellationToken ct = default);
}

/// <summary>
/// Well-known quota / usage feature keys — use these constants, not hardcoded strings.
/// </summary>
public static class QuotaFeatureKeys
{
    public const string ResumeUpload  = "resume.upload";
    public const string ResumeParse   = "resume.parse";
    public const string JdCreate      = "jobdescription.create";
    public const string MatchCreate   = "match.create";
    public const string MatchComplete = "match.complete";
}
