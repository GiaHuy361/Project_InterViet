using Interviet.Domain.Common;

namespace Interviet.Domain.AiIntegration;

public class AiJob : BaseEntity
{
    public Guid? UserId { get; set; }
    public string JobType { get; set; } = string.Empty;
    public string ReferenceType { get; set; } = string.Empty;
    public Guid? ReferenceId { get; set; }
    public string? ExternalJobId { get; set; }
    public string CorrelationId { get; set; } = string.Empty;
    public string? IdempotencyKey { get; set; }

    /// <summary>pending | processing | succeeded | failed | cancelled</summary>
    public string Status { get; set; } = "pending";
    public string? RequestedPayloadJson { get; set; }
    public string? ResponsePayloadJson { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public string? SchemaVersion { get; set; }
    public string? ModelVersion { get; set; }
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}

public class PaymentWebhookLog : BaseEntity
{
    public string Provider { get; set; } = string.Empty;
    public string ExternalEventId { get; set; } = string.Empty;
    public bool SignatureValid { get; set; }
    public string PayloadJson { get; set; } = string.Empty;
    public DateTime? ProcessedAt { get; set; }

    /// <summary>received | processing | processed | failed</summary>
    public string ProcessingStatus { get; set; } = "received";
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
