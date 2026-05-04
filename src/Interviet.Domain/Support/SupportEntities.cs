using Interviet.Domain.Common;

namespace Interviet.Domain.Support;

public class ActivityLog : BaseEntity
{
    public Guid? UserId { get; set; }
    public string ActionKey { get; set; } = string.Empty;
    public string? EntityType { get; set; }
    public Guid? EntityId { get; set; }
    public string? Description { get; set; }
    public string? MetadataJson { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class ConsentRecord : BaseEntity
{
    public Guid UserId { get; set; }
    public string ConsentType { get; set; } = string.Empty;
    public bool Accepted { get; set; }
    public string Version { get; set; } = string.Empty;
    public DateTime AcceptedAt { get; set; }
    public string? MetadataJson { get; set; }
}

public class TermsAcceptance : BaseEntity
{
    public Guid UserId { get; set; }
    public string TermsVersion { get; set; } = string.Empty;
    public string? PrivacyVersion { get; set; }
    public DateTime AcceptedAt { get; set; }
}

public class DataExportRequest : BaseEntity
{
    public Guid UserId { get; set; }

    /// <summary>pending | processing | completed | failed</summary>
    public string Status { get; set; } = "pending";
    public Guid? ExportedFileId { get; set; }
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public DateTime? FailedAt { get; set; }
    public string? ErrorMessage { get; set; }
}

public class AccountDeletionRequest : BaseEntity
{
    public Guid UserId { get; set; }

    /// <summary>pending | processing | cancelled | completed</summary>
    public string Status { get; set; } = "pending";
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ScheduledDeleteAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Reason { get; set; }
}

public class SupportTicket : AuditableEntity
{
    public Guid UserId { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;

    /// <summary>open | in_progress | resolved | closed</summary>
    public string Status { get; set; } = "open";
    public string Description { get; set; } = string.Empty;
    public string? AssignedTo { get; set; }
    public DateTime? ClosedAt { get; set; }

    public ICollection<SupportTicketMessage> Messages { get; set; } = [];
}

public class SupportTicketMessage : BaseEntity
{
    public Guid SupportTicketId { get; set; }

    /// <summary>user | support | system</summary>
    public string SenderType { get; set; } = string.Empty;
    public Guid? SenderUserId { get; set; }
    public string MessageBody { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class UserFeedback : BaseEntity
{
    public Guid? UserId { get; set; }
    public string FeedbackType { get; set; } = string.Empty;
    public int? Rating { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? MetadataJson { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class AdminActionLog : BaseEntity
{
    public Guid? AdminUserId { get; set; }
    public string ActionKey { get; set; } = string.Empty;
    public string TargetEntityType { get; set; } = string.Empty;
    public Guid? TargetEntityId { get; set; }
    public string? Details { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
