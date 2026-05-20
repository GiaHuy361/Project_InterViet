using System;
using System.Collections.Generic;
using System.Text.Json;

namespace Interviet.Contracts.Reports;

public static class ReportType
{
    public const string Interview = "interview";
    public const string Match = "match";
}

public sealed record CreateShareLinkRequest
{
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public DateTime? ExpiresAt { get; init; }
    public bool AllowPdfDownload { get; init; } = true;
}

public sealed record CreateShareLinkResponse
{
    public Guid Id { get; init; }
    public string ReportType { get; init; } = string.Empty;
    public Guid ResourceId { get; init; }
    public string Title { get; init; } = string.Empty;
    public string ShareToken { get; init; } = string.Empty;
    public string ShareUrl { get; init; } = string.Empty;
    public string ApiUrl { get; init; } = string.Empty;
    public bool AllowPdfDownload { get; init; }
    public DateTime? ExpiresAt { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed record ShareLinkListItemResponse
{
    public Guid Id { get; init; }
    public string ReportType { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string? TokenPreview { get; init; }
    public bool IsActive { get; init; }
    public bool AllowPdfDownload { get; init; }
    public int ViewCount { get; init; }
    public DateTime? LastViewedAt { get; init; }
    public DateTime? ExpiresAt { get; init; }
    public DateTime? RevokedAt { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed record RevokeShareLinkResponse
{
    public Guid Id { get; init; }
    public bool IsActive { get; init; }
    public DateTime? RevokedAt { get; init; }
}

public sealed record SharedInterviewReportResponse
{
    public string ReportType { get; init; } = "interview";
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? ExpiresAt { get; init; }
    public bool AllowPdfDownload { get; init; }
    public int ViewCount { get; init; }
    public SharedInterviewData Data { get; init; } = null!;
}

public sealed record SharedMatchReportResponse
{
    public string ReportType { get; init; } = "match";
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? ExpiresAt { get; init; }
    public bool AllowPdfDownload { get; init; }
    public int ViewCount { get; init; }
    public SharedMatchData Data { get; init; } = null!;
}

public sealed record SharedInterviewData
{
    public string Position { get; init; } = string.Empty;
    public string Level { get; init; } = string.Empty;
    public string InterviewType { get; init; } = string.Empty;
    public string Mode { get; init; } = string.Empty;
    public DateTime? CompletedAt { get; init; }
    public SharedInterviewReport? Report { get; init; }
    public List<SharedInterviewQuestion> Questions { get; init; } = [];
}

public sealed record SharedInterviewReport
{
    public decimal? OverallScore { get; init; }
    public decimal? ConfidenceScore { get; init; }
    public decimal? ClarityScore { get; init; }
    public decimal? PaceScore { get; init; }
    public List<string> Strengths { get; init; } = [];
    public List<string> Weaknesses { get; init; } = [];
    public List<string> Recommendations { get; init; } = [];
    public List<JsonElement> ScoreBreakdowns { get; init; } = [];
    public List<JsonElement> FeedbackItems { get; init; } = [];
    public string? ModelVersion { get; init; }
    public string? SchemaVersion { get; init; }
}

public sealed record SharedInterviewQuestion
{
    public int QuestionNumber { get; init; }
    public string QuestionType { get; init; } = string.Empty;
    public string QuestionText { get; init; } = string.Empty;
    public string? Difficulty { get; init; }
    public string? AnswerText { get; init; }
    public decimal? AnswerScore { get; init; }
    public string? Feedback { get; init; }
}

public sealed record SharedMatchData
{
    public string ResumeTitle { get; init; } = string.Empty;
    public string SessionType { get; init; } = string.Empty;
    public List<SharedMatchResult> Results { get; init; } = [];
}

public sealed record SharedMatchResult
{
    public string? JobTitle { get; init; }
    public string? CompanyName { get; init; }
    public decimal TotalScore { get; init; }
    public string? MatchBand { get; init; }
    public List<string> MatchedSkills { get; init; } = [];
    public List<string> MissingSkills { get; init; } = [];
    public List<string> Strengths { get; init; } = [];
    public List<string> Weaknesses { get; init; } = [];
    public List<string> Suggestions { get; init; } = [];
    public string? ModelVersion { get; init; }
    public string? SchemaVersion { get; init; }
}
