using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Common.Options;
using Interviet.Contracts.Reports;
using Interviet.Contracts.Interviews; // For JsonParseHelper
using Interviet.Domain.Reports;
using Interviet.Domain.Interviews;
using Interviet.Domain.Matching;
using Interviet.Domain.Resumes;
using Interviet.Shared.Results;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Interviet.Infrastructure.Services;

public class ReportShareService : IReportShareService
{
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _dt;
    private readonly FrontendOptions _frontendOptions;
    private readonly ReportOptions _reportOptions;

    public ReportShareService(
        IAppDbContext db,
        IDateTimeProvider dt,
        IOptions<FrontendOptions> frontendOptions,
        IOptions<ReportOptions> reportOptions)
    {
        _db = db;
        _dt = dt;
        _frontendOptions = frontendOptions.Value;
        _reportOptions = reportOptions.Value;
    }

    public async Task<Result<CreateShareLinkResponse>> CreateInterviewShareAsync(
        Guid userId,
        Guid interviewSessionId,
        CreateShareLinkRequest request,
        CancellationToken ct = default)
    {
        var session = await _db.InterviewSessions
            .Include(s => s.Report)
            .FirstOrDefaultAsync(s => s.Id == interviewSessionId, ct);

        if (session is null)
            return Error.NotFound("Interview.NotFound", "Không tìm thấy phiên phỏng vấn.");

        if (session.UserId != userId)
            return Error.Forbidden("Interview.Forbidden", "Bạn không có quyền chia sẻ báo cáo này.");

        if (session.Status != InterviewSessionStatus.Completed || session.Report is null)
            return Error.Conflict("Interview.NotCompleted", "Phiên phỏng vấn chưa hoàn thành hoặc chưa có báo cáo.");

        var title = string.IsNullOrWhiteSpace(request.Title)
            ? $"Báo cáo Phỏng vấn AI - {session.RoleName} ({session.SeniorityLevel})"
            : request.Title.Trim();

        var now = _dt.UtcNow;
        var expiresAt = request.ExpiresAt ?? now.AddDays(_reportOptions.DefaultShareExpiryDays);

        var rawToken = GenerateRawToken();
        var tokenHash = HashToken(rawToken);
        var tokenPreview = rawToken.Substring(rawToken.Length - 8);

        var shareLink = new ReportShareLink
        {
            UserId = userId,
            ReportType = ReportType.Interview,
            ResourceId = interviewSessionId,
            TokenHash = tokenHash,
            TokenPreview = tokenPreview,
            Title = title,
            Description = request.Description?.Trim(),
            IsActive = true,
            ExpiresAt = expiresAt,
            AllowPdfDownload = request.AllowPdfDownload,
            CreatedAt = now
        };

        _db.ReportShareLinks.Add(shareLink);
        await _db.SaveChangesAsync(ct);

        var shareUrl = $"{_frontendOptions.BaseUrl}/shared-reports/{rawToken}";
        var apiUrl = $"/api/v1/reports/shared/{rawToken}";

        return new CreateShareLinkResponse
        {
            Id = shareLink.Id,
            ReportType = shareLink.ReportType,
            ResourceId = shareLink.ResourceId,
            Title = shareLink.Title,
            ShareToken = rawToken,
            ShareUrl = shareUrl,
            ApiUrl = apiUrl,
            AllowPdfDownload = shareLink.AllowPdfDownload,
            ExpiresAt = shareLink.ExpiresAt,
            CreatedAt = shareLink.CreatedAt
        };
    }

    public async Task<Result<CreateShareLinkResponse>> CreateMatchShareAsync(
        Guid userId,
        Guid matchSessionId,
        CreateShareLinkRequest request,
        CancellationToken ct = default)
    {
        var session = await _db.MatchSessions
            .Include(s => s.Targets)
                .ThenInclude(t => t.Result)
            .FirstOrDefaultAsync(s => s.Id == matchSessionId, ct);

        if (session is null)
            return Error.NotFound("Match.NotFound", "Không tìm thấy phiên đối sánh.");

        if (session.UserId != userId)
            return Error.Forbidden("Match.Forbidden", "Bạn không có quyền chia sẻ báo cáo này.");

        var completedResultsCount = session.Targets.Count(t => t.Status == MatchSessionStatus.Completed && t.Result is not null);
        if (completedResultsCount == 0)
            return Error.Conflict("Match.NoCompletedResults", "Phiên đối sánh chưa hoàn thành hoặc không có kết quả hợp lệ.");

        var resume = await _db.Resumes.FirstOrDefaultAsync(r => r.Id == session.ResumeId, ct);
        var resumeTitle = resume?.Title ?? "CV";

        var title = string.IsNullOrWhiteSpace(request.Title)
            ? $"Báo cáo Đối sánh CV - JD - {resumeTitle}"
            : request.Title.Trim();

        var now = _dt.UtcNow;
        var expiresAt = request.ExpiresAt ?? now.AddDays(_reportOptions.DefaultShareExpiryDays);

        var rawToken = GenerateRawToken();
        var tokenHash = HashToken(rawToken);
        var tokenPreview = rawToken.Substring(rawToken.Length - 8);

        var shareLink = new ReportShareLink
        {
            UserId = userId,
            ReportType = ReportType.Match,
            ResourceId = matchSessionId,
            TokenHash = tokenHash,
            TokenPreview = tokenPreview,
            Title = title,
            Description = request.Description?.Trim(),
            IsActive = true,
            ExpiresAt = expiresAt,
            AllowPdfDownload = request.AllowPdfDownload,
            CreatedAt = now
        };

        _db.ReportShareLinks.Add(shareLink);
        await _db.SaveChangesAsync(ct);

        var shareUrl = $"{_frontendOptions.BaseUrl}/shared-reports/{rawToken}";
        var apiUrl = $"/api/v1/reports/shared/{rawToken}";

        return new CreateShareLinkResponse
        {
            Id = shareLink.Id,
            ReportType = shareLink.ReportType,
            ResourceId = shareLink.ResourceId,
            Title = shareLink.Title,
            ShareToken = rawToken,
            ShareUrl = shareUrl,
            ApiUrl = apiUrl,
            AllowPdfDownload = shareLink.AllowPdfDownload,
            ExpiresAt = shareLink.ExpiresAt,
            CreatedAt = shareLink.CreatedAt
        };
    }

    public async Task<Result<List<ShareLinkListItemResponse>>> GetInterviewSharesAsync(
        Guid userId,
        Guid interviewSessionId,
        CancellationToken ct = default)
    {
        var session = await _db.InterviewSessions.FirstOrDefaultAsync(s => s.Id == interviewSessionId, ct);
        if (session is null)
            return Error.NotFound("Interview.NotFound", "Không tìm thấy phiên phỏng vấn.");

        if (session.UserId != userId)
            return Error.Forbidden("Interview.Forbidden", "Bạn không có quyền truy cập thông tin chia sẻ này.");

        var list = await _db.ReportShareLinks
            .Where(x => x.UserId == userId && x.ReportType == ReportType.Interview && x.ResourceId == interviewSessionId && x.IsActive && x.RevokedAt == null)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new ShareLinkListItemResponse
            {
                Id = x.Id,
                ReportType = x.ReportType,
                Title = x.Title,
                TokenPreview = x.TokenPreview,
                IsActive = x.IsActive,
                AllowPdfDownload = x.AllowPdfDownload,
                ViewCount = x.ViewCount,
                LastViewedAt = x.LastViewedAt,
                ExpiresAt = x.ExpiresAt,
                RevokedAt = x.RevokedAt,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync(ct);

        return list;
    }

    public async Task<Result<List<ShareLinkListItemResponse>>> GetMatchSharesAsync(
        Guid userId,
        Guid matchSessionId,
        CancellationToken ct = default)
    {
        var session = await _db.MatchSessions.FirstOrDefaultAsync(s => s.Id == matchSessionId, ct);
        if (session is null)
            return Error.NotFound("Match.NotFound", "Không tìm thấy phiên đối sánh.");

        if (session.UserId != userId)
            return Error.Forbidden("Match.Forbidden", "Bạn không có quyền truy cập thông tin chia sẻ này.");

        var list = await _db.ReportShareLinks
            .Where(x => x.UserId == userId && x.ReportType == ReportType.Match && x.ResourceId == matchSessionId && x.IsActive && x.RevokedAt == null)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new ShareLinkListItemResponse
            {
                Id = x.Id,
                ReportType = x.ReportType,
                Title = x.Title,
                TokenPreview = x.TokenPreview,
                IsActive = x.IsActive,
                AllowPdfDownload = x.AllowPdfDownload,
                ViewCount = x.ViewCount,
                LastViewedAt = x.LastViewedAt,
                ExpiresAt = x.ExpiresAt,
                RevokedAt = x.RevokedAt,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync(ct);

        return list;
    }

    public async Task<Result<RevokeShareLinkResponse>> RevokeShareAsync(
        Guid userId,
        Guid shareId,
        CancellationToken ct = default)
    {
        var shareLink = await _db.ReportShareLinks.FirstOrDefaultAsync(x => x.Id == shareId, ct);
        if (shareLink is null)
            return Error.NotFound("ShareLink.NotFound", "Không tìm thấy liên kết chia sẻ.");

        if (shareLink.UserId != userId)
            return Error.Forbidden("ShareLink.Forbidden", "Bạn không có quyền thu hồi liên kết chia sẻ này.");

        var now = _dt.UtcNow;
        shareLink.IsActive = false;
        shareLink.RevokedAt = now;
        shareLink.UpdatedAt = now;

        await _db.SaveChangesAsync(ct);

        return new RevokeShareLinkResponse
        {
            Id = shareLink.Id,
            IsActive = shareLink.IsActive,
            RevokedAt = shareLink.RevokedAt
        };
    }

    public async Task<Result<SharedInterviewReportResponse>> GetSharedInterviewReportAsync(
        string token,
        CancellationToken ct = default)
    {
        var tokenHash = HashToken(token);
        var shareLink = await _db.ReportShareLinks
            .FirstOrDefaultAsync(x => x.TokenHash == tokenHash && x.ReportType == ReportType.Interview, ct);

        if (shareLink is null || !shareLink.IsActive || shareLink.RevokedAt is not null)
            return Error.NotFound("ShareLink.NotFound", "Liên kết chia sẻ không tồn tại hoặc đã bị thu hồi.");

        var now = _dt.UtcNow;
        if (shareLink.ExpiresAt is not null && shareLink.ExpiresAt < now)
            return Error.NotFound("ShareLink.Expired", "Liên kết chia sẻ đã hết hạn.");

        // Fetch interview data
        var session = await _db.InterviewSessions
            .Include(s => s.Report)
            .Include(s => s.Questions)
                .ThenInclude(q => q.Answer)
            .FirstOrDefaultAsync(s => s.Id == shareLink.ResourceId, ct);

        if (session is null || session.Report is null)
            return Error.NotFound("Interview.NotFound", "Không tìm thấy dữ liệu báo cáo phỏng vấn.");

        // Increment ViewCount
        shareLink.ViewCount++;
        shareLink.LastViewedAt = now;
        shareLink.UpdatedAt = now;
        await _db.SaveChangesAsync(ct);

        var sanitizedQuestions = session.Questions
            .Where(q => q.AskedAt is not null)
            .OrderBy(q => q.QuestionNumber)
            .Select(q => new SharedInterviewQuestion
            {
                QuestionNumber = q.QuestionNumber,
                QuestionType = q.QuestionType,
                QuestionText = q.QuestionText,
                Difficulty = q.Difficulty,
                AnswerText = q.Answer?.AnswerText,
                AnswerScore = q.Answer?.AnswerScore,
                Feedback = q.Answer?.Feedback
            })
            .ToList();

        var sharedReport = new SharedInterviewReport
        {
            OverallScore = session.Report.OverallScore,
            ConfidenceScore = session.Report.ConfidenceScore,
            ClarityScore = session.Report.VoiceClarityScore,
            PaceScore = session.Report.PaceScore,
            Strengths = JsonParseHelper.ParseStringArray(session.Report.StrengthsJson),
            Weaknesses = JsonParseHelper.ParseStringArray(session.Report.WeaknessesJson),
            Recommendations = JsonParseHelper.ParseStringArray(session.Report.RecommendationsJson),
            ScoreBreakdowns = JsonParseHelper.ParseObjectArray(session.Report.ScoreBreakdownsJson),
            FeedbackItems = JsonParseHelper.ParseObjectArray(session.Report.FeedbackItemsJson),
            ModelVersion = session.Report.ModelVersion,
            SchemaVersion = session.Report.SchemaVersion
        };

        var sharedData = new SharedInterviewData
        {
            Position = session.RoleName,
            Level = session.SeniorityLevel,
            InterviewType = session.InterviewType,
            Mode = session.Mode,
            CompletedAt = session.CompletedAt,
            Report = sharedReport,
            Questions = sanitizedQuestions
        };

        return new SharedInterviewReportResponse
        {
            ReportType = ReportType.Interview,
            Title = shareLink.Title,
            Description = shareLink.Description,
            CreatedAt = shareLink.CreatedAt,
            ExpiresAt = shareLink.ExpiresAt,
            AllowPdfDownload = shareLink.AllowPdfDownload,
            ViewCount = shareLink.ViewCount,
            Data = sharedData
        };
    }

    public async Task<Result<SharedMatchReportResponse>> GetSharedMatchReportAsync(
        string token,
        CancellationToken ct = default)
    {
        var tokenHash = HashToken(token);
        var shareLink = await _db.ReportShareLinks
            .FirstOrDefaultAsync(x => x.TokenHash == tokenHash && x.ReportType == ReportType.Match, ct);

        if (shareLink is null || !shareLink.IsActive || shareLink.RevokedAt is not null)
            return Error.NotFound("ShareLink.NotFound", "Liên kết chia sẻ không tồn tại hoặc đã bị thu hồi.");

        var now = _dt.UtcNow;
        if (shareLink.ExpiresAt is not null && shareLink.ExpiresAt < now)
            return Error.NotFound("ShareLink.Expired", "Liên kết chia sẻ đã hết hạn.");

        // Fetch match session data
        var session = await _db.MatchSessions
            .Include(s => s.Targets)
                .ThenInclude(t => t.Result)
            .FirstOrDefaultAsync(s => s.Id == shareLink.ResourceId, ct);

        if (session is null)
            return Error.NotFound("Match.NotFound", "Không tìm thấy phiên đối sánh.");

        var resume = await _db.Resumes.FirstOrDefaultAsync(r => r.Id == session.ResumeId, ct);
        var resumeTitle = resume?.Title ?? "CV";

        // Increment ViewCount
        shareLink.ViewCount++;
        shareLink.LastViewedAt = now;
        shareLink.UpdatedAt = now;
        await _db.SaveChangesAsync(ct);

        // Load JobDescriptions for results
        var jdIds = session.Targets.Select(t => t.JobDescriptionId).Distinct().ToList();
        var jds = await _db.JobDescriptions
            .Where(j => jdIds.Contains(j.Id))
            .ToDictionaryAsync(j => j.Id, ct);

        var sharedResults = session.Targets
            .Where(t => t.Status == MatchSessionStatus.Completed && t.Result is not null)
            .Select(t =>
            {
                var result = t.Result!;
                jds.TryGetValue(t.JobDescriptionId, out var jd);
                var jobTitle = jd?.Title ?? "Công việc";
                var companyName = jd?.CompanyName ?? "Công ty";

                return new SharedMatchResult
                {
                    JobTitle = jobTitle,
                    CompanyName = companyName,
                    TotalScore = result.TotalScore,
                    MatchBand = result.MatchBand,
                    MatchedSkills = JsonParseHelper.ParseStringArray(result.MatchedSkillsJson),
                    MissingSkills = JsonParseHelper.ParseStringArray(result.MissingSkillsJson),
                    Strengths = JsonParseHelper.ParseStringArray(result.StrengthsJson),
                    Weaknesses = JsonParseHelper.ParseStringArray(result.WeaknessesJson),
                    Suggestions = JsonParseHelper.ParseStringArray(result.SuggestionsJson),
                    ModelVersion = result.ModelVersion,
                    SchemaVersion = result.SchemaVersion
                };
            })
            .ToList();

        var sharedData = new SharedMatchData
        {
            ResumeTitle = resumeTitle,
            SessionType = session.SessionType,
            Results = sharedResults
        };

        return new SharedMatchReportResponse
        {
            ReportType = ReportType.Match,
            Title = shareLink.Title,
            Description = shareLink.Description,
            CreatedAt = shareLink.CreatedAt,
            ExpiresAt = shareLink.ExpiresAt,
            AllowPdfDownload = shareLink.AllowPdfDownload,
            ViewCount = shareLink.ViewCount,
            Data = sharedData
        };
    }

    public async Task<Result<ReportShareLink>> ValidateTokenForPdfAsync(
        string token,
        CancellationToken ct = default)
    {
        var tokenHash = HashToken(token);
        var shareLink = await _db.ReportShareLinks
            .FirstOrDefaultAsync(x => x.TokenHash == tokenHash, ct);

        if (shareLink is null || !shareLink.IsActive || shareLink.RevokedAt is not null)
            return Error.NotFound("ShareLink.NotFound", "Liên kết chia sẻ không tồn tại hoặc đã bị thu hồi.");

        var now = _dt.UtcNow;
        if (shareLink.ExpiresAt is not null && shareLink.ExpiresAt < now)
            return Error.NotFound("ShareLink.Expired", "Liên kết chia sẻ đã hết hạn.");

        if (!shareLink.AllowPdfDownload)
            return Error.Forbidden("ShareLink.PdfDisabled", "Tải xuống PDF đã bị vô hiệu hóa cho liên kết chia sẻ này.");

        return shareLink;
    }

    // Helper: generate 32 bytes cryptographically secure random token (Base64Url)
    private static string GenerateRawToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');
    }

    // Helper: SHA-256 hash of token, lower-case hex string
    private static string HashToken(string token)
    {
        if (string.IsNullOrWhiteSpace(token)) return string.Empty;
        var bytes = Encoding.UTF8.GetBytes(token);
        var hashBytes = SHA256.HashData(bytes);
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }
}
