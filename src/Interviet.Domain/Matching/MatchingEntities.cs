using Interviet.Domain.Common;

namespace Interviet.Domain.Matching;

public class JobDescription : AuditableEntity
{
    public Guid UserId { get; set; }
    public string? Title { get; set; }
    public string? CompanyName { get; set; }
    public string? Location { get; set; }
    public string? SalaryText { get; set; }
    public string? SourceUrl { get; set; }
    public string RawText { get; set; } = string.Empty;
    public string? NormalizedText { get; set; }
    public DateOnly? PostedAt { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}

public class JobBookmark : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid JobDescriptionId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class MatchSession : BaseEntity
{
    public Guid UserId { get; set; }

    /// <summary>Resume being matched (denormalised from active version).</summary>
    public Guid ResumeId { get; set; }

    public Guid ResumeVersionId { get; set; }

    /// <summary>Denormalised for single-match quick lookup. Null for multi-match sessions.</summary>
    public Guid? JobDescriptionId { get; set; }

    /// <summary>single | multi</summary>
    public string SessionType { get; set; } = MatchSessionType.Single;

    /// <summary>pending | processing | completed | failed | partially_completed | cancelled</summary>
    public string Status { get; set; } = MatchSessionStatus.Pending;

    public int TargetCount { get; set; }
    public decimal? OverallBestScore { get; set; }
    public string? ExternalJobId { get; set; }
    public string? CorrelationId { get; set; }
    public string? RequestId { get; set; }
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? FailedAt { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }

    public ICollection<MatchTarget> Targets { get; set; } = [];
}

public static class MatchSessionType
{
    public const string Single = "single";
    public const string Multi = "multi";
}

public static class MatchSessionStatus
{
    public const string Pending = "pending";
    public const string Processing = "processing";
    public const string Completed = "completed";
    public const string Failed = "failed";
    public const string PartiallyCompleted = "partially_completed";
    public const string Cancelled = "cancelled";
}

public class MatchTarget : BaseEntity
{
    public Guid MatchSessionId { get; set; }
    public Guid JobDescriptionId { get; set; }
    public int? RankOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public MatchSession MatchSession { get; set; } = null!;
    public MatchResult? Result { get; set; }
}

public class MatchResult : BaseEntity
{
    public Guid MatchSessionId { get; set; }
    public Guid MatchTargetId { get; set; }
    public decimal TotalScore { get; set; }
    public decimal? TechnicalScore { get; set; }     // skillScore from Python
    public decimal? ExperienceScore { get; set; }
    public decimal? EducationScore { get; set; }
    public decimal? SoftSkillScore { get; set; }
    public decimal? LanguageScore { get; set; }

    /// <summary>High | Medium | Low — for UI grouping</summary>
    public string? MatchBand { get; set; }

    /// <summary>Python summary text.</summary>
    public string? SummaryText { get; set; }

    public string? MatchedSkillsJson { get; set; }
    public string? StrengthsJson { get; set; }
    public string? WeaknessesJson { get; set; }
    public string? MissingSkillsJson { get; set; }
    public string? SuggestionsJson { get; set; }     // recommendations from Python
    public string? RawResponseJson { get; set; }
    public string? SchemaVersion { get; set; }
    public string? ModelVersion { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<MatchInsight> Insights { get; set; } = [];
}

public static class MatchBand
{
    public const string High = "high";
    public const string Medium = "medium";
    public const string Low = "low";
}

public class MatchInsight : BaseEntity
{
    public Guid MatchResultId { get; set; }
    public string InsightType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
