namespace Interviet.Contracts.Resumes;

// ── Requests ──────────────────────────────────────────────────────────────────
public sealed record UploadResumeRequest
{
    /// <summary>Optional custom title. Defaults to original filename.</summary>
    public string? Title { get; init; }
}

public sealed record SetActiveResumeRequest
{
    public Guid ResumeId { get; init; }
}

// ── Responses ─────────────────────────────────────────────────────────────────
public sealed record ResumeResponse
{
    public Guid ResumeId { get; init; }
    public string Title { get; init; } = string.Empty;
    public bool IsActive { get; init; }
    public int VersionNumber { get; init; }

    // Latest version info
    public Guid? LatestVersionId { get; init; }
    public string? OriginalFileName { get; init; }
    public string? FileExtension { get; init; }
    public string? ContentType { get; init; }
    public long? FileSizeBytes { get; init; }
    public string? StoragePath { get; init; }
    public string ParseStatus { get; init; } = string.Empty;
    public string? ProcessingError { get; init; }
    public DateTime? LastProcessedAt { get; init; }

    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public sealed record ResumeDetailResponse
{
    public Guid ResumeId { get; init; }
    public string Title { get; init; } = string.Empty;
    public bool IsActive { get; init; }
    public int VersionNumber { get; init; }

    // Latest version
    public Guid? LatestVersionId { get; init; }
    public string? OriginalFileName { get; init; }
    public string? FileExtension { get; init; }
    public string? ContentType { get; init; }
    public long? FileSizeBytes { get; init; }
    public string ParseStatus { get; init; } = string.Empty;
    public string? ProcessingError { get; init; }
    public DateTime? LastProcessedAt { get; init; }

    // Latest parse job
    public ParseJobResponse? LatestParseJob { get; init; }

    // Parsed data (if available)
    public ResumeParsedDataResponse? ParsedData { get; init; }

    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public sealed record ParseJobResponse
{
    public Guid JobId { get; init; }
    public Guid ResumeId { get; init; }
    public string Status { get; init; } = string.Empty;
    public string Provider { get; init; } = string.Empty;
    public string? CorrelationId { get; init; }
    public string? ErrorCode { get; init; }
    public string? ErrorMessage { get; init; }
    public int RetryCount { get; init; }
    public string? ModelVersion { get; init; }
    public DateTime RequestedAt { get; init; }
    public DateTime? StartedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
}

public sealed record ResumeParsedDataResponse
{
    public Guid Id { get; init; }
    public string? DetectedLanguage { get; init; }
    public string? RawText { get; init; }
    public string? SectionsJson { get; init; }
    public string? SkillsJson { get; init; }
    public string? ExperiencesJson { get; init; }
    public string? EducationsJson { get; init; }
    public string? ProjectsJson { get; init; }
    public string? CertificationsJson { get; init; }
    public string? LanguagesJson { get; init; }
    public string? WarningsJson { get; init; }
    public string? ModelVersion { get; init; }
    public string? SchemaVersion { get; init; }
    // Parse metadata (optional)
    public int? ParseTextLength { get; init; }
    public int? ParseWarningCount { get; init; }
    public decimal? ParseConfidenceScore { get; init; }
    public string? ParseQuality { get; init; }
    public string? DetectedSectionsJson { get; init; }
    public string? MissingSectionsJson { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed record ReprocessResumeResponse
{
    public Guid JobId { get; init; }
    public Guid ResumeId { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTime RequestedAt { get; init; }
}
