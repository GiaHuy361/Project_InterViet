namespace Interviet.Application.Common.Interfaces;

/// <summary>
/// Tracks daily feature usage and quota counters per user.
/// Implementations handle upsert + concurrency internally.
/// Never throws externally — failures are logged and swallowed.
/// </summary>
public interface IUsageTracker
{
    /// <summary>Increment CvOptimizationCount for the given user and UTC date.</summary>
    Task TrackCvOptimizationAsync(Guid userId, DateOnly date, CancellationToken ct = default);

    /// <summary>Increment InterviewCount for the given user and UTC date.</summary>
    Task TrackInterviewAsync(Guid userId, DateOnly date, CancellationToken ct = default);

    /// <summary>Increment MultiMatchCount for the given user and UTC date.</summary>
    Task TrackMultiMatchAsync(Guid userId, DateOnly date, CancellationToken ct = default);

    /// <summary>Increment MentorBookingCount for the given user and UTC date.</summary>
    Task TrackMentorBookingAsync(Guid userId, DateOnly date, CancellationToken ct = default);
}

/// <summary>
/// Well-known quota feature keys.
/// </summary>
public static class QuotaFeatureKeys
{
    public const string CvParse       = "cv_parse";
    public const string CvMatch       = "cv_match";
    public const string CvOptimize    = "cv_optimize";
    public const string Interview     = "interview";
    public const string MentorBooking = "mentor_booking";
}
