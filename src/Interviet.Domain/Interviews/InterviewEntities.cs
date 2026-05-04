using Interviet.Domain.Common;

namespace Interviet.Domain.Interviews;

public class InterviewSession : AuditableEntity
{
    public Guid UserId { get; set; }
    public Guid? ResumeVersionId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string SeniorityLevel { get; set; } = string.Empty;

    /// <summary>technical | behavioral | case_study | general</summary>
    public string InterviewType { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public string? Goal { get; set; }

    /// <summary>voice | text | hybrid</summary>
    public string Mode { get; set; } = string.Empty;

    /// <summary>draft | ready | live | processing | completed | failed | cancelled</summary>
    public string Status { get; set; } = InterviewSessionStatus.Draft;

    public string? ExternalSessionId { get; set; }
    public string? CorrelationId { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? FailedAt { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }

    public InterviewTranscript? Transcript { get; set; }
    public InterviewReport? Report { get; set; }
}

public static class InterviewSessionStatus
{
    public const string Draft = "draft";
    public const string Ready = "ready";
    public const string Live = "live";
    public const string Processing = "processing";
    public const string Completed = "completed";
    public const string Failed = "failed";
    public const string Cancelled = "cancelled";
}

public class InterviewTranscript : AuditableEntity
{
    public Guid InterviewSessionId { get; set; }
    public string? FullTranscript { get; set; }
    public string? TranscriptLanguage { get; set; }

    public ICollection<InterviewTranscriptSegment> Segments { get; set; } = [];
}

public class InterviewTranscriptSegment : BaseEntity
{
    public Guid InterviewTranscriptId { get; set; }

    /// <summary>ai | candidate</summary>
    public string Speaker { get; set; } = string.Empty;
    public int SegmentOrder { get; set; }
    public decimal? StartedAtSeconds { get; set; }
    public decimal? EndedAtSeconds { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class InterviewReport : AuditableEntity
{
    public Guid InterviewSessionId { get; set; }
    public decimal? OverallScore { get; set; }
    public decimal? ConfidenceScore { get; set; }
    public decimal? VoiceClarityScore { get; set; }
    public decimal? PaceScore { get; set; }
    public decimal? FillerWordScore { get; set; }
    public string? StrengthsJson { get; set; }
    public string? WeaknessesJson { get; set; }
    public string? RecommendationsJson { get; set; }
    public string? BenchmarkJson { get; set; }
    public string? SchemaVersion { get; set; }
    public string? ModelVersion { get; set; }
    public Guid? ExportedPdfFileId { get; set; }

    public ICollection<InterviewScoreBreakdown> ScoreBreakdowns { get; set; } = [];
    public ICollection<InterviewFeedbackItem> FeedbackItems { get; set; } = [];
}

public class InterviewScoreBreakdown : BaseEntity
{
    public Guid InterviewReportId { get; set; }
    public string DimensionCode { get; set; } = string.Empty;
    public string DimensionName { get; set; } = string.Empty;
    public decimal Score { get; set; }
    public decimal? MaxScore { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class InterviewFeedbackItem : BaseEntity
{
    public Guid InterviewReportId { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public string? PriorityLevel { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
