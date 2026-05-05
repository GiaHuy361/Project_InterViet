namespace Interviet.Contracts.Matching;

// ── JobDescription Requests ───────────────────────────────────────────────────
public sealed record CreateJobDescriptionRequest
{
    /// <summary>Position title.</summary>
    public string? Title { get; init; }

    public string? CompanyName { get; init; }
    public string? Location { get; init; }
    public string? SalaryText { get; init; }
    public string? SourceUrl { get; init; }

    /// <summary>Full raw JD text — required for matching.</summary>
    public string RawText { get; init; } = string.Empty;

    public DateOnly? PostedAt { get; init; }
}

public sealed record UpdateJobDescriptionRequest
{
    public string? Title { get; init; }
    public string? CompanyName { get; init; }
    public string? Location { get; init; }
    public string? SalaryText { get; init; }
    public string? SourceUrl { get; init; }
    public string? RawText { get; init; }
    public DateOnly? PostedAt { get; init; }
}

// ── Match Requests ────────────────────────────────────────────────────────────
public sealed record CreateMatchRequest
{
    /// <summary>Resume to match. Must belong to the authenticated user and have parsed data.</summary>
    public Guid ResumeId { get; init; }

    /// <summary>Job Description to match against. Must belong to the authenticated user.</summary>
    public Guid JobDescriptionId { get; init; }
}

// ── JobDescription Responses ──────────────────────────────────────────────────
public sealed record JobDescriptionResponse
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public string? Title { get; init; }
    public string? CompanyName { get; init; }
    public string? Location { get; init; }
    public string? SalaryText { get; init; }
    public string? SourceUrl { get; init; }
    public string RawText { get; init; } = string.Empty;
    public DateOnly? PostedAt { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

// ── Match Responses ───────────────────────────────────────────────────────────
public sealed record CreateMatchResponse
{
    public Guid SessionId { get; init; }
    public Guid ResumeId { get; init; }
    public Guid JobDescriptionId { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTime RequestedAt { get; init; }
}

public sealed record MatchSessionResponse
{
    public Guid SessionId { get; init; }
    public Guid ResumeId { get; init; }
    public Guid ResumeVersionId { get; init; }
    public Guid? JobDescriptionId { get; init; }
    public string SessionType { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string? ErrorCode { get; init; }
    public string? ErrorMessage { get; init; }
    public DateTime RequestedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
    public MatchResultResponse? Result { get; init; }
}

public sealed record MatchResultResponse
{
    public Guid Id { get; init; }
    public decimal TotalScore { get; init; }
    public decimal? TechnicalScore { get; init; }
    public decimal? ExperienceScore { get; init; }
    public decimal? EducationScore { get; init; }
    public decimal? LanguageScore { get; init; }
    public string? MatchBand { get; init; }
    public string? SummaryText { get; init; }
    public string? MatchedSkillsJson { get; init; }
    public string? MissingSkillsJson { get; init; }
    public string? StrengthsJson { get; init; }
    public string? WeaknessesJson { get; init; }
    public string? SuggestionsJson { get; init; }
    public string? ModelVersion { get; init; }
    public string? SchemaVersion { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed record GetMyMatchesResult(
    IReadOnlyList<MatchSessionResponse> Items,
    int TotalCount,
    int Page,
    int PageSize
);

public sealed record GetMyJobDescriptionsResult(
    IReadOnlyList<JobDescriptionResponse> Items,
    int TotalCount,
    int Page,
    int PageSize
);
