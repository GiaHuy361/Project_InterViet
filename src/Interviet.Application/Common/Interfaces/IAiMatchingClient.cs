using System.Text.Json.Serialization;

namespace Interviet.Application.Common.Interfaces;

/// <summary>
/// Abstraction for calling the Python CV-JD matching service.
/// Infrastructure implements this via HttpAiMatchingClient.
/// Never fakes results — returns Failure or Unavailable on errors.
/// </summary>
public interface IAiMatchingClient
{
    Task<AiMatchResult> MatchAsync(AiMatchRequest request, CancellationToken ct = default);
}

// ── Request ───────────────────────────────────────────────────────────────────
public sealed class AiMatchRequest
{
    public Guid UserId { get; init; }
    public Guid ResumeId { get; init; }
    public Guid ResumeVersionId { get; init; }
    public Guid JobDescriptionId { get; init; }
    public Guid MatchSessionId { get; init; }
    public string CorrelationId { get; init; } = string.Empty;
    public string RequestId { get; init; } = string.Empty;

    // Parsed resume data — passed as structured object fields
    public string? RawText { get; init; }
    public string? SkillsJson { get; init; }
    public string? ExperiencesJson { get; init; }
    public string? EducationsJson { get; init; }
    public string? SectionsJson { get; init; }
    public string? ProjectsJson { get; init; }
    public string? CertificationsJson { get; init; }
    public string? LanguagesJson { get; init; }

    // Job description
    public string JobDescriptionRawText { get; init; } = string.Empty;
    
    // Optional: match index for multi-match tracing, e.g. "1/3"
    public string? MatchIndex { get; init; }
}

// ── Result ────────────────────────────────────────────────────────────────────
public sealed class AiMatchResult
{
    public bool IsSuccess { get; init; }
    public bool IsServiceUnavailable { get; init; }

    // Failure fields
    public string? ErrorCode { get; init; }
    public string? ErrorMessage { get; init; }

    // Success fields — mapped from Python response
    public decimal? OverallScore { get; init; }     // overallScore
    public decimal? SkillScore { get; init; }        // skillScore → TechnicalScore
    public decimal? ExperienceScore { get; init; }
    public decimal? EducationScore { get; init; }
    public decimal? LanguageScore { get; init; }

    public string? MatchedSkillsJson { get; init; }
    public string? MissingSkillsJson { get; init; }
    public string? StrengthsJson { get; init; }
    public string? WeaknessesJson { get; init; }
    public string? RecommendationsJson { get; init; }  // → SuggestionsJson
    public string? SummaryText { get; init; }
    public string? ModelVersion { get; init; }
    public string? SchemaVersion { get; init; }
    public string? RawResponseJson { get; init; }

    public static AiMatchResult Success(
        decimal overallScore,
        decimal? skillScore, decimal? experienceScore,
        decimal? educationScore, decimal? languageScore,
        string? matchedSkillsJson, string? missingSkillsJson,
        string? strengthsJson, string? weaknessesJson,
        string? recommendationsJson, string? summaryText,
        string? modelVersion, string? schemaVersion,
        string? rawResponseJson)
        => new()
        {
            IsSuccess          = true,
            OverallScore       = overallScore,
            SkillScore         = skillScore,
            ExperienceScore    = experienceScore,
            EducationScore     = educationScore,
            LanguageScore      = languageScore,
            MatchedSkillsJson  = matchedSkillsJson,
            MissingSkillsJson  = missingSkillsJson,
            StrengthsJson      = strengthsJson,
            WeaknessesJson     = weaknessesJson,
            RecommendationsJson = recommendationsJson,
            SummaryText        = summaryText,
            ModelVersion       = modelVersion,
            SchemaVersion      = schemaVersion,
            RawResponseJson    = rawResponseJson
        };

    public static AiMatchResult Failure(string errorCode, string errorMessage)
        => new() { IsSuccess = false, ErrorCode = errorCode, ErrorMessage = errorMessage };

    public static AiMatchResult Unavailable(string message)
        => new() { IsSuccess = false, IsServiceUnavailable = true, ErrorCode = "SERVICE_UNAVAILABLE", ErrorMessage = message };
}
