using System.Text.Json;

namespace Interviet.Contracts.Interviews;

// ── Helpers ────────────────────────────────────────────────────────────────────
/// <summary>Helper để parse JSON strings từ Python/DB thành typed collections.</summary>
public static class JsonParseHelper
{
    public static List<string> ParseStringArray(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try
        {
            return JsonSerializer.Deserialize<List<string>>(json) ?? [];
        }
        catch { return []; }
    }

    public static List<JsonElement> ParseObjectArray(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try
        {
            return JsonSerializer.Deserialize<List<JsonElement>>(json) ?? [];
        }
        catch { return []; }
    }

    public static List<string>? ParseStringArrayOrNull(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try
        {
            return JsonSerializer.Deserialize<List<string>>(json);
        }
        catch { return null; }
    }
}

// ── Allowed AI models ──────────────────────────────────────────────────────────
public static class AllowedAiModels
{
    public static readonly HashSet<string> Keys = new(StringComparer.OrdinalIgnoreCase)
    {
        "gpt-4o-mini",
        "gpt-4o",
        "gemini-3-flash-preview",
        "gemini-3.1-pro",
        "standard",
        "basic",
        "advanced",
        "free",
        "monthly",
        "quarterly",
        "yearly"
    };

    public static bool IsValid(string? model) =>
        !string.IsNullOrWhiteSpace(model) && Keys.Contains(model.Trim());
}

// ── Requests ──────────────────────────────────────────────────────────────────
public sealed record CreateInterviewSessionRequest
{
    /// <summary>Job position / role name. Required.</summary>
    public string Position { get; init; } = string.Empty;

    /// <summary>Level: junior | mid | senior | lead | manager. Required.</summary>
    public string Level { get; init; } = string.Empty;

    /// <summary>Interview type: technical | behavioral | general | case_study. Required.</summary>
    public string InterviewType { get; init; } = string.Empty;

    /// <summary>Goal of the interview (optional).</summary>
    public string? Goal { get; init; }

    /// <summary>Duration in minutes. Required, must be between 5 and 120.</summary>
    public int DurationMinutes { get; init; }

    /// <summary>Mode: text | voice | hybrid. Required.</summary>
    public string Mode { get; init; } = string.Empty;

    /// <summary>Interviewer persona: professional | friendly | strict. Required.</summary>
    public string InterviewerMode { get; init; } = string.Empty;

    /// <summary>
    /// AI model: gpt-4o-mini | gpt-4o | gemini-3-flash-preview | standard | basic | advanced.
    /// Required. Must be one of the supported values.
    /// </summary>
    public string AiModel { get; init; } = string.Empty;
}

public sealed record SubmitInterviewMessageRequest
{
    /// <summary>Required when mode=text. One of answerText or audioFileUrl must be provided.</summary>
    public string? AnswerText { get; init; }

    public string? AudioFileUrl { get; init; }
    public int? AudioDurationSeconds { get; init; }

    /// <summary>If provided, answer is linked to this question. If null, system resolves current open question.</summary>
    public Guid? QuestionId { get; init; }
}

// ── Responses ─────────────────────────────────────────────────────────────────
public sealed record CheckInterviewQuotaResponse
{
    public string FeatureKey { get; init; } = "interview.ai";
    public bool CanCreate { get; init; }
    public int? LimitValue { get; init; }
    public int? UsedToday { get; init; }
    public int? RemainingValue { get; init; }
    public bool IsUnlimited { get; init; }
    public string? PlanKey { get; init; }
    public string? Message { get; init; }
}

public sealed record CreateInterviewSessionResponse
{
    public Guid SessionId { get; init; }
    public string Status { get; init; } = string.Empty;
    public string Position { get; init; } = string.Empty;
    public string Level { get; init; } = string.Empty;
    public string InterviewType { get; init; } = string.Empty;
    public string? Goal { get; init; }
    public int DurationMinutes { get; init; }
    public string Mode { get; init; } = string.Empty;
    public string InterviewerMode { get; init; } = string.Empty;
    public string AiModel { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public string NextStep { get; init; } = "Call POST /api/v1/interviews/{sessionId}/start to begin.";
}

public sealed record StartInterviewResponse
{
    public Guid SessionId { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTime StartedAt { get; init; }
    public InterviewQuestionResponse? FirstQuestion { get; init; }
}

public sealed record SubmitInterviewMessageResponse
{
    public Guid SessionId { get; init; }
    public Guid AnswerId { get; init; }
    public string Status { get; init; } = string.Empty;
    public bool HasNextQuestion { get; init; }
    /// <summary>null when interview is complete (no more questions).</summary>
    public InterviewQuestionResponse? NextQuestion { get; init; }
}

public sealed record CompleteInterviewResponse
{
    public Guid SessionId { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTime? CompletedAt { get; init; }
    public InterviewReportResponse? Report { get; init; }
    public string? Message { get; init; }
}

public sealed record InterviewSessionListItemResponse
{
    public Guid SessionId { get; init; }
    public string Status { get; init; } = string.Empty;
    public string Position { get; init; } = string.Empty;
    public string Level { get; init; } = string.Empty;
    public string InterviewType { get; init; } = string.Empty;
    public string Mode { get; init; } = string.Empty;
    public string? AiModel { get; init; }
    public int DurationMinutes { get; init; }
    public int QuestionCount { get; init; }
    public int AnsweredCount { get; init; }
    public decimal? OverallScore { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? StartedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
}

public sealed record InterviewSessionDetailResponse
{
    public Guid SessionId { get; init; }
    public string Status { get; init; } = string.Empty;
    public string Position { get; init; } = string.Empty;
    public string Level { get; init; } = string.Empty;
    public string InterviewType { get; init; } = string.Empty;
    public string? Goal { get; init; }
    public int DurationMinutes { get; init; }
    public string Mode { get; init; } = string.Empty;
    public string? InterviewerMode { get; init; }
    public string? AiModel { get; init; }
    public string? ErrorCode { get; init; }
    public string? ErrorMessage { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? StartedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
    public int TotalExpectedQuestions { get; init; }
    public int AnsweredCount { get; init; }
    public List<InterviewQuestionResponse> Questions { get; init; } = [];
    public InterviewReportResponse? Report { get; init; }
}

public sealed record InterviewQuestionResponse
{
    public Guid QuestionId { get; init; }
    public int QuestionNumber { get; init; }
    public string QuestionType { get; init; } = string.Empty;
    public string QuestionText { get; init; } = string.Empty;
    public string? Difficulty { get; init; }
    /// <summary>Typed array parsed from JSON. Empty list if not provided by AI.</summary>
    public List<string> ExpectedAnswerPoints { get; init; } = [];
    public DateTime? AskedAt { get; init; }
    public bool HasAnswer { get; init; }
    public InterviewAnswerResponse? Answer { get; init; }
}

public sealed record InterviewAnswerResponse
{
    public Guid AnswerId { get; init; }
    public string? AnswerText { get; init; }
    public string? AudioFileUrl { get; init; }
    public int? AudioDurationSeconds { get; init; }
    public decimal? AnswerScore { get; init; }
    public string? Feedback { get; init; }
    public decimal? ClarityScore { get; init; }
    public decimal? RelevanceScore { get; init; }
    public decimal? CompletenessScore { get; init; }
    public DateTime? AnsweredAt { get; init; }
}

public sealed record InterviewReportResponse
{
    // ── Scores ───────────────────────────────────────────────────────────────
    public decimal? OverallScore { get; init; }
    public decimal? ConfidenceScore { get; init; }
    public decimal? ClarityScore { get; init; }
    public decimal? RelevanceScore { get; init; }
    public decimal? PaceScore { get; init; }

    // ── Typed arrays (frontend-friendly) ─────────────────────────────────────
    public List<string> Strengths { get; init; } = [];
    public List<string> Weaknesses { get; init; } = [];
    public List<string> Recommendations { get; init; } = [];
    public List<JsonElement> ScoreBreakdowns { get; init; } = [];
    public List<JsonElement> FeedbackItems { get; init; } = [];

    // ── Metadata ─────────────────────────────────────────────────────────────
    public string? ModelVersion { get; init; }
    public string? SchemaVersion { get; init; }
}

public sealed record InterviewStatsResponse
{
    public int TotalSessions { get; init; }
    public int CompletedSessions { get; init; }
    public decimal? AverageScore { get; init; }
    public decimal? BestScore { get; init; }
    public int TotalMinutes { get; init; }
    public List<InterviewSessionListItemResponse> RecentSessions { get; init; } = [];
}

public sealed record GetMyInterviewsResult(
    IReadOnlyList<InterviewSessionListItemResponse> Items,
    int TotalCount,
    int Page,
    int PageSize
);
