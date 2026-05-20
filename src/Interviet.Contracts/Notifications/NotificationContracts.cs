namespace Interviet.Contracts.Notifications;

// ── Type constants ────────────────────────────────────────────────────────────

public static class NotificationType
{
    // Billing
    public const string BillingPaymentSucceeded = "billing.payment_succeeded";

    // Resume
    public const string ResumeParsed = "resume.parsed";
    public const string ResumeFailed = "resume.failed";

    // Matching
    public const string MatchCompleted = "match.completed";
    public const string MatchFailed    = "match.failed";

    // Interview
    public const string InterviewReportReady = "interview.report_ready";
    public const string InterviewFailed      = "interview.failed";

    // System
    public const string SystemAnnouncement = "system.announcement";
}

// ── Priority constants ────────────────────────────────────────────────────────

public static class NotificationPriority
{
    public const string Low    = "low";
    public const string Normal = "normal";
    public const string High   = "high";
    public const string Urgent = "urgent";
}

// ── Query DTOs ────────────────────────────────────────────────────────────────

public sealed class NotificationListQuery
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
    public bool? IsRead { get; init; }
    public string? Type { get; init; }
    public string? Priority { get; init; }
}

// ── Response DTOs ─────────────────────────────────────────────────────────────

public sealed class NotificationResponse
{
    public Guid Id { get; init; }
    public string Type { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public string Priority { get; init; } = "normal";
    public string? ActionUrl { get; init; }

    /// <summary>Parsed JSON object or null. Frontend can treat as dynamic object.</summary>
    public object? Data { get; init; }

    public bool IsRead { get; init; }
    public DateTime? ReadAt { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed class NotificationListResponse
{
    public List<NotificationResponse> Items { get; init; } = [];
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalItems { get; init; }
    public int TotalPages { get; init; }
}

public sealed class UnreadCountResponse
{
    public int UnreadCount { get; init; }
}

public sealed class MarkReadResponse
{
    public Guid Id { get; init; }
    public bool IsRead { get; init; }
    public DateTime? ReadAt { get; init; }
}

public sealed class MarkAllReadRequest
{
    /// <summary>Optional: only mark notifications of this type. If null, mark all.</summary>
    public string? Type { get; init; }
}

public sealed class MarkAllReadResponse
{
    public int UpdatedCount { get; init; }
    public DateTime ReadAt { get; init; }
}

// ── Preferences ───────────────────────────────────────────────────────────────

public sealed class NotificationPreferenceResponse
{
    public bool InAppNotificationsEnabled { get; init; }
    public bool EmailNotificationsEnabled { get; init; }
    public bool BillingNotificationsEnabled { get; init; }
    public bool ResumeNotificationsEnabled { get; init; }
    public bool MatchingNotificationsEnabled { get; init; }
    public bool InterviewNotificationsEnabled { get; init; }
    public bool MentorNotificationsEnabled { get; init; }
    public bool SystemNotificationsEnabled { get; init; }
}

public sealed class UpdateNotificationPreferenceRequest
{
    public bool InAppNotificationsEnabled { get; init; } = true;
    public bool EmailNotificationsEnabled { get; init; } = true;
    public bool BillingNotificationsEnabled { get; init; } = true;
    public bool ResumeNotificationsEnabled { get; init; } = true;
    public bool MatchingNotificationsEnabled { get; init; } = true;
    public bool InterviewNotificationsEnabled { get; init; } = true;
    public bool MentorNotificationsEnabled { get; init; } = true;
    public bool SystemNotificationsEnabled { get; init; } = true;
}

// ── Test notification (dev only) ──────────────────────────────────────────────

public sealed class CreateTestNotificationRequest
{
    public string Type { get; init; } = NotificationType.SystemAnnouncement;
    public string Title { get; init; } = "Thông báo thử nghiệm";
    public string Message { get; init; } = "Đây là thông báo test.";
    public string Priority { get; init; } = NotificationPriority.Normal;
    public string? ActionUrl { get; init; }
}
