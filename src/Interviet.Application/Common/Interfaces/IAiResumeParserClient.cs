namespace Interviet.Application.Common.Interfaces;

/// <summary>
/// Abstraction for calling the Python CV parsing service.
/// Infrastructure implements this via HttpAiResumeParserClient.
/// </summary>
public interface IAiResumeParserClient
{
    /// <summary>
    /// Send a resume file to the Python CV Service for parsing.
    /// Returns a structured result or a failure description — never throws for service unavailability.
    /// </summary>
    Task<AiParseResumeResult> ParseResumeAsync(AiParseResumeRequest request, CancellationToken ct = default);
}

// ── Request ──────────────────────────────────────────────────────────────────
public sealed class AiParseResumeRequest
{
    public Guid ResumeId { get; init; }
    public Guid ResumeVersionId { get; init; }
    public Guid UserId { get; init; }
    public string CorrelationId { get; init; } = string.Empty;
    public string RequestId { get; init; } = string.Empty;
    public string OriginalFileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;

    /// <summary>Absolute filesystem path to the file. Infrastructure reads this to stream to Python.</summary>
    public string FilePath { get; init; } = string.Empty;
}

// ── Result ───────────────────────────────────────────────────────────────────
public sealed class AiParseResumeResult
{
    public bool IsSuccess { get; init; }

    // Success fields
    public string? RawText { get; init; }
    public string? DetectedLanguage { get; init; }
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
    public string? ExternalJobId { get; init; }

    // Failure fields
    public string? ErrorCode { get; init; }
    public string? ErrorMessage { get; init; }

    /// <summary>True when the service is unreachable (timeout, connection refused).</summary>
    public bool IsServiceUnavailable { get; init; }

    public static AiParseResumeResult Success(
        string? rawText, string? detectedLanguage,
        string? sectionsJson, string? skillsJson,
        string? experiencesJson, string? educationsJson,
        string? projectsJson, string? certificationsJson,
        string? languagesJson, string? warningsJson,
        string? modelVersion, string? schemaVersion,
        string? externalJobId = null)
        => new()
        {
            IsSuccess = true,
            RawText = rawText,
            DetectedLanguage = detectedLanguage,
            SectionsJson = sectionsJson,
            SkillsJson = skillsJson,
            ExperiencesJson = experiencesJson,
            EducationsJson = educationsJson,
            ProjectsJson = projectsJson,
            CertificationsJson = certificationsJson,
            LanguagesJson = languagesJson,
            WarningsJson = warningsJson,
            ModelVersion = modelVersion,
            SchemaVersion = schemaVersion,
            ExternalJobId = externalJobId
        };

    public static AiParseResumeResult Failure(string errorCode, string errorMessage)
        => new() { IsSuccess = false, ErrorCode = errorCode, ErrorMessage = errorMessage };

    public static AiParseResumeResult Unavailable(string message)
        => new() { IsSuccess = false, IsServiceUnavailable = true, ErrorCode = "SERVICE_UNAVAILABLE", ErrorMessage = message };
}
