namespace Interviet.Application.Common.Interfaces;

/// <summary>
/// Abstraction for calling the Python AI Interview service.
/// Infrastructure implements this via HttpAiInterviewClient.
/// Never fakes results — returns Failure or Unavailable on errors.
/// </summary>
public interface IAiInterviewClient
{
    /// <summary>Generate the next interview question based on session context.</summary>
    Task<AiInterviewQuestionResult> GenerateQuestionAsync(AiGenerateQuestionRequest request, CancellationToken ct = default);

    /// <summary>Analyze completed interview session and produce a report.</summary>
    Task<AiInterviewAnalysisResult> AnalyzeInterviewAsync(AiAnalyzeInterviewRequest request, CancellationToken ct = default);
}

// ── Generate Question ─────────────────────────────────────────────────────────
public sealed class AiGenerateQuestionRequest
{
    public Guid SessionId { get; init; }
    public Guid UserId { get; init; }
    public string CorrelationId { get; init; } = string.Empty;
    public string RequestId { get; init; } = string.Empty;

    // Session context
    public string Position { get; init; } = string.Empty;
    public string Level { get; init; } = string.Empty;
    public string? Goal { get; init; }
    public string InterviewType { get; init; } = string.Empty;
    public string? InterviewerMode { get; init; }
    public string? AiModel { get; init; }

    // Conversation so far (Q&A turns as JSON)
    public string? ConversationHistoryJson { get; init; }
    public int QuestionNumber { get; init; }
    public int TotalExpectedQuestions { get; init; }
}

public sealed class AiInterviewQuestionResult
{
    public bool IsSuccess { get; init; }
    public bool IsServiceUnavailable { get; init; }
    public string? ErrorCode { get; init; }
    public string? ErrorMessage { get; init; }

    // Success fields
    public string? QuestionText { get; init; }
    public string? QuestionType { get; init; }
    public string? Difficulty { get; init; }
    public string? ExpectedAnswerPointsJson { get; init; }

    public static AiInterviewQuestionResult Success(
        string questionText, string? questionType, string? difficulty, string? expectedAnswerPointsJson)
        => new()
        {
            IsSuccess = true,
            QuestionText = questionText,
            QuestionType = questionType,
            Difficulty = difficulty,
            ExpectedAnswerPointsJson = expectedAnswerPointsJson
        };

    public static AiInterviewQuestionResult Failure(string errorCode, string errorMessage)
        => new() { IsSuccess = false, ErrorCode = errorCode, ErrorMessage = errorMessage };

    public static AiInterviewQuestionResult Unavailable(string message)
        => new() { IsSuccess = false, IsServiceUnavailable = true, ErrorCode = "SERVICE_UNAVAILABLE", ErrorMessage = message };
}

// ── Analyze Interview ─────────────────────────────────────────────────────────
public sealed class AiAnalyzeInterviewRequest
{
    public Guid SessionId { get; init; }
    public Guid UserId { get; init; }
    public string CorrelationId { get; init; } = string.Empty;
    public string RequestId { get; init; } = string.Empty;

    public string Position { get; init; } = string.Empty;
    public string Level { get; init; } = string.Empty;
    public string? Goal { get; init; }
    public string InterviewType { get; init; } = string.Empty;
    public string? AiModel { get; init; }

    // Full Q&A turns for analysis
    public string TranscriptJson { get; init; } = string.Empty;
}

public sealed class AiInterviewAnalysisResult
{
    public bool IsSuccess { get; init; }
    public bool IsServiceUnavailable { get; init; }
    public string? ErrorCode { get; init; }
    public string? ErrorMessage { get; init; }

    // Score fields
    public decimal? OverallScore { get; init; }
    public decimal? ConfidenceScore { get; init; }
    public decimal? ClarityScore { get; init; }
    public decimal? RelevanceScore { get; init; }

    // Feedback JSON arrays
    public string? StrengthsJson { get; init; }
    public string? WeaknessesJson { get; init; }
    public string? RecommendationsJson { get; init; }

    // Score breakdowns per question (optional)
    public string? ScoreBreakdownsJson { get; init; }
    public string? FeedbackItemsJson { get; init; }

    public string? ModelVersion { get; init; }
    public string? SchemaVersion { get; init; }

    public static AiInterviewAnalysisResult Success(
        decimal? overallScore, decimal? confidenceScore, decimal? clarityScore, decimal? relevanceScore,
        string? strengthsJson, string? weaknessesJson, string? recommendationsJson,
        string? scoreBreakdownsJson, string? feedbackItemsJson,
        string? modelVersion, string? schemaVersion)
        => new()
        {
            IsSuccess = true,
            OverallScore = overallScore,
            ConfidenceScore = confidenceScore,
            ClarityScore = clarityScore,
            RelevanceScore = relevanceScore,
            StrengthsJson = strengthsJson,
            WeaknessesJson = weaknessesJson,
            RecommendationsJson = recommendationsJson,
            ScoreBreakdownsJson = scoreBreakdownsJson,
            FeedbackItemsJson = feedbackItemsJson,
            ModelVersion = modelVersion,
            SchemaVersion = schemaVersion
        };

    public static AiInterviewAnalysisResult Failure(string errorCode, string errorMessage)
        => new() { IsSuccess = false, ErrorCode = errorCode, ErrorMessage = errorMessage };

    public static AiInterviewAnalysisResult Unavailable(string message)
        => new() { IsSuccess = false, IsServiceUnavailable = true, ErrorCode = "SERVICE_UNAVAILABLE", ErrorMessage = message };
}
