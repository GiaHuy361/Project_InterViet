using System;
using Interviet.Domain.Common;

namespace Interviet.Domain.Reports;

public class ReportShareLink : BaseEntity
{
    public Guid UserId { get; set; }
    public string ReportType { get; set; } = string.Empty; // "interview" | "match"
    public Guid ResourceId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public string? TokenPreview { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public bool AllowPdfDownload { get; set; } = true;
    public int ViewCount { get; set; } = 0;
    public DateTime? LastViewedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
