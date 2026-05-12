namespace Interviet.Contracts.Interviews;

// ── Requests ──────────────────────────────────────────────────────────────────
public sealed record CreateInterviewSessionRequest
{
    /// <summary>Job position / role name. Required.</summary>
    public string Position { get; init; } = string.Empty;

    /// <summary>Level: junior | mid | senior | lead | manager. Required.</summary>
    public string Level { get; init; } = string.Empty;

    /// <summary>Interview type: technical | behavioral | general. Required.</summary>
    public string InterviewType { get; init; } = string.Empty;

    /// <summary>Goal of the interview (optional).</summary>
    public string? Goal { get; init; }

    /// <summary>Duration in minutes. Required, must be > 0.</summary>
    public int DurationMinutes { get; init; }

    /// <summary>Mode: text | voice | hybrid. Required.</summary>
    public string Mode { get; init; } = string.Empty;

    /// <summary>Interviewer persona: professional | friendly | strict. Required.</summary>
    public string InterviewerMode { get; init; } = string.Empty;

    /// <summary>AI model to use: e.g. gpt-4o, gemini-pro. Required.</summary>
    public string AiModel { get; init; } = string.Empty;
}

public sealed record SubmitInterviewMessageRequest
{
    public string? AnswerText { get; init; }
    public string? AudioFileUrl { get; init; }
    public int? AudioDurationSeconds { get; init; }

    /// <summary>If provided, answer is linked to this question. If null, system resolves current question.</summary>
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
    public int DurationMinutes { get; init; }
    public int QuestionCount { get; init; }
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
    public decimal? OverallScore { get; init; }
    public decimal? ConfidenceScore { get; init; }
    public decimal? VoiceClarityScore { get; init; }
    public decimal? PaceScore { get; init; }
    public string? StrengthsJson { get; init; }
    public string? WeaknessesJson { get; init; }
    public string? RecommendationsJson { get; init; }
    public string? ModelVersion { get; init; }
}

public sealed record InterviewStatsResponse
{
    public int TotalSessions { get; init; }
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
