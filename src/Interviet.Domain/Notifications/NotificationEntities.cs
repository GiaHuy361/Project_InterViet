using Interviet.Domain.Common;

namespace Interviet.Domain.Notifications;

/// <summary>
/// In-app notification for a user.
/// Type examples: billing.payment_succeeded, resume.parsed, resume.failed,
///                match.completed, match.failed, interview.report_ready, interview.failed, system.announcement
/// Priority: low | normal | high | urgent
/// </summary>
public class Notification : BaseEntity
{
    public Guid UserId { get; set; }

    /// <summary>Event type e.g. billing.payment_succeeded, resume.parsed</summary>
    public string Type { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;

    /// <summary>low | normal | high | urgent</summary>
    public string Priority { get; set; } = "normal";

    public string? ActionUrl { get; set; }

    /// <summary>JSON payload for frontend (object). Stored as string.</summary>
    public string? DataJson { get; set; }

    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }

    /// <summary>
    /// Deduplication key to prevent duplicate notifications.
    /// Format: {type}:{entityId} e.g. billing.payment_succeeded:{checkoutSessionId}
    /// </summary>
    public string? DeduplicationKey { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    /// <summary>Soft delete timestamp. Null = not deleted.</summary>
    public DateTime? DeletedAt { get; set; }
}

/// <summary>
/// User notification preferences. One record per user.
/// All preferences default to true (opt-in by default).
/// </summary>
public class NotificationPreference : BaseEntity
{
    public Guid UserId { get; set; }

    /// <summary>Master in-app notifications toggle.</summary>
    public bool InAppNotificationsEnabled { get; set; } = true;

    /// <summary>Email notifications preference flag (Phase 11 - flag only, not enforced everywhere).</summary>
    public bool EmailNotificationsEnabled { get; set; } = true;

    public bool BillingNotificationsEnabled { get; set; } = true;
    public bool ResumeNotificationsEnabled { get; set; } = true;
    public bool MatchingNotificationsEnabled { get; set; } = true;
    public bool InterviewNotificationsEnabled { get; set; } = true;
    public bool MentorNotificationsEnabled { get; set; } = true;
    public bool SystemNotificationsEnabled { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public class EmailTemplate : AuditableEntity
{
    public string Code { get; set; } = string.Empty;
    public string SubjectTemplate { get; set; } = string.Empty;
    public string BodyHtmlTemplate { get; set; } = string.Empty;
    public string? BodyTextTemplate { get; set; }
    public bool IsActive { get; set; } = true;
}

public class EmailCenterMessage : BaseEntity
{
    public Guid UserId { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string? BodyPreview { get; set; }
    public bool IsMarketing { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public Guid? RelatedEmailLogId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class EmailMessageLog : BaseEntity
{
    public Guid? UserId { get; set; }
    public string? TemplateCode { get; set; }
    public string ToAddress { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string? ProviderMessageId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
    public string? MetadataJson { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
