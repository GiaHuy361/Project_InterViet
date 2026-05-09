namespace Interviet.Application.Common.Interfaces;

/// <summary>
/// Writes ActivityLog entries for important user actions.
/// Implementations must NOT throw — they catch internally and log warning/error.
/// Call fire-and-forget style in background tasks or synchronously before return.
/// </summary>
public interface IActivityLogger
{
    /// <summary>
    /// Logs an activity entry. Never throws — on failure logs a warning and continues.
    /// </summary>
    Task LogAsync(
        Guid?   userId,
        string  actionKey,
        string? entityType   = null,
        Guid?   entityId     = null,
        string? description  = null,
        string? ipAddress    = null,
        string? userAgent    = null,
        CancellationToken ct = default);
}

/// <summary>
/// Well-known action keys — use these constants instead of hardcoding strings.
/// </summary>
public static class ActivityActionKeys
{
    public const string ResumeUploaded        = "resume_uploaded";
    public const string ResumeParseSucceeded  = "resume_parse_succeeded";
    public const string ResumeParseFailed     = "resume_parse_failed";
    public const string ActiveResumeChanged   = "active_resume_changed";

    public const string JobDescriptionCreated = "job_description_created";
    public const string JobDescriptionUpdated = "job_description_updated";
    public const string JobDescriptionDeleted = "job_description_deleted";

    public const string MatchCreated          = "match_created";
    public const string MatchCompleted        = "match_completed";
    public const string MatchFailed           = "match_failed";
    
    public const string MultiMatchCreated     = "multi_match_created";
    public const string MultiMatchCompleted   = "multi_match_completed";
    public const string MultiMatchFailed      = "multi_match_failed";
}
