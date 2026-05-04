using Interviet.Domain.Common;

namespace Interviet.Domain.Notifications;

public class Notification : BaseEntity
{
    public Guid UserId { get; set; }

    /// <summary>billing | subscription | mentor | system | product | feature</summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>info | success | warning | error</summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>in_app | email | system</summary>
    public string Channel { get; set; } = "in_app";

    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? ActionUrl { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
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
