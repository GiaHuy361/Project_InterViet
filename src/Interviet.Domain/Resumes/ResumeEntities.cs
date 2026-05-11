using Interviet.Domain.Common;

namespace Interviet.Domain.Resumes;

// ──────────────────────────────────────────────
// UploadedFile (physical file record)
// ──────────────────────────────────────────────
public class UploadedFile : BaseEntity
{
    public Guid UserId { get; set; }
    public string FileCategory { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string StoredFileName { get; set; } = string.Empty;
    public string StorageProvider { get; set; } = string.Empty;
    public string StoragePath { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public string FileExtension { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string? Sha256Hash { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// ──────────────────────────────────────────────
// Resume (user-facing container entity)
// ──────────────────────────────────────────────
public class Resume : AuditableEntity
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;

    /// <summary>Per-user monotonic version number. First resume = 1.</summary>
    public int VersionNumber { get; set; } = 1;

    public Guid? ActiveVersionId { get; set; }
    public bool IsActive { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }

    // Navigation
    public ICollection<ResumeVersion> Versions { get; set; } = [];
    public ResumeVersion? ActiveVersion { get; set; }
}

// ──────────────────────────────────────────────
// ResumeVersion (one upload/version of the resume)
// ──────────────────────────────────────────────
public class ResumeVersion : BaseEntity
{
    public Guid ResumeId { get; set; }
    public Guid UploadedFileId { get; set; }
    public int VersionNumber { get; set; }

    /// <summary>uploaded | queued | processing | parsed | failed | archived | service_unavailable</summary>
    public string ParseStatus { get; set; } = ResumeParseStatus.Uploaded;

    /// <summary>upload | manual | import</summary>
    public string Source { get; set; } = ResumeSource.Upload;

    public string? ContentType { get; set; }
    public string? ExtractedText { get; set; }
    public string? ParsedJson { get; set; }
    public string? ParseError { get; set; }
    public string? ProcessingError { get; set; }
    public DateTime? LastProcessedAt { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Resume Resume { get; set; } = null!;
    public UploadedFile UploadedFile { get; set; } = null!;
}

public static class ResumeParseStatus
{
    public const string Uploaded           = "uploaded";
    public const string Queued             = "queued";
    public const string Processing         = "processing";
    public const string Parsed             = "parsed";
    public const string Failed             = "failed";
    public const string Archived           = "archived";
    public const string ServiceUnavailable = "service_unavailable";
}

public static class ResumeSource
{
    public const string Upload = "upload";
    public const string Manual = "manual";
    public const string Import = "import";
}

// ──────────────────────────────────────────────
// ResumeParsedData (result returned by Python CV Service)
// ──────────────────────────────────────────────
public class ResumeParsedData : BaseEntity
{
    public Guid ResumeId { get; set; }
    public Guid ResumeVersionId { get; set; }
    public Guid UserId { get; set; }

    public string? RawText { get; set; }
    public string? DetectedLanguage { get; set; }

    /// <summary>JSON blob: { summary, contact, etc. }</summary>
    public string? SectionsJson { get; set; }
    public string? SkillsJson { get; set; }
    public string? ExperiencesJson { get; set; }
    public string? EducationsJson { get; set; }
    public string? ProjectsJson { get; set; }
    public string? CertificationsJson { get; set; }
    public string? LanguagesJson { get; set; }
    public string? WarningsJson { get; set; }

    // ── Parse Metadata (Phase 4 Python update) ──────────────────────────────
    /// <summary>Number of characters in extracted raw text.</summary>
    public int? ParseTextLength { get; set; }
    /// <summary>Number of warnings emitted by Python parser.</summary>
    public int? ParseWarningCount { get; set; }
    /// <summary>Confidence score of parse quality (0.0-1.0).</summary>
    public decimal? ParseConfidenceScore { get; set; }
    /// <summary>Qualitative parse quality: high | medium | low</summary>
    public string? ParseQuality { get; set; }
    /// <summary>JSON array of detected section names.</summary>
    public string? DetectedSectionsJson { get; set; }
    /// <summary>JSON array of expected but missing section names.</summary>
    public string? MissingSectionsJson { get; set; }

    public string? ModelVersion { get; set; }
    public string? SchemaVersion { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Resume Resume { get; set; } = null!;
    public ResumeVersion ResumeVersion { get; set; } = null!;
}

// ──────────────────────────────────────────────
// ResumeParseJob (tracking record per parse attempt)
// ──────────────────────────────────────────────
public class ResumeParseJob : BaseEntity
{
    public Guid ResumeVersionId { get; set; }
    public Guid ResumeId { get; set; }
    public Guid UserId { get; set; }

    /// <summary>queued | processing | succeeded | failed | service_unavailable</summary>
    public string Status { get; set; } = ResumeParseJobStatus.Queued;

    /// <summary>python</summary>
    public string Provider { get; set; } = "python";

    public string? CorrelationId { get; set; }
    public string? RequestId { get; set; }
    public string? ExternalJobId { get; set; }
    public string? RawResponse { get; set; }

    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }

    public int RetryCount { get; set; }
    public string? ModelVersion { get; set; }
    public string? SchemaVersion { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ResumeVersion ResumeVersion { get; set; } = null!;
}

public static class ResumeParseJobStatus
{
    public const string Queued             = "queued";
    public const string Processing         = "processing";
    public const string Succeeded          = "succeeded";
    public const string Failed             = "failed";
    public const string ServiceUnavailable = "service_unavailable";
}

// ──────────────────────────────────────────────
// ResumeOptimizationSession (Phase 3+, stub)
// ──────────────────────────────────────────────
public class ResumeOptimizationSession : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid ResumeVersionId { get; set; }
    public Guid? JobDescriptionId { get; set; }
    public Guid? MatchResultId { get; set; }
    public string? SuggestionsJson { get; set; }
    public Guid? ExportedPdfFileId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
