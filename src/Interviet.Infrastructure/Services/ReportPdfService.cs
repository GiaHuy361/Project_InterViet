using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Interviews; // For JsonParseHelper
using Interviet.Contracts.Reports;
using Interviet.Domain.Reports;
using Interviet.Domain.Interviews;
using Interviet.Domain.Matching;
using Interviet.Domain.Resumes;
using Interviet.Shared.Results;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Interviet.Infrastructure.Services;

public class ReportPdfService : IReportPdfService
{
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _dt;

    static ReportPdfService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public ReportPdfService(IAppDbContext db, IDateTimeProvider dt)
    {
        _db = db;
        _dt = dt;
    }

    public async Task<Result<byte[]>> GenerateInterviewReportPdfAsync(
        Guid sessionId,
        Guid userId,
        CancellationToken ct = default)
    {
        var session = await _db.InterviewSessions
            .Include(s => s.Report)
            .Include(s => s.Questions)
                .ThenInclude(q => q.Answer)
            .FirstOrDefaultAsync(s => s.Id == sessionId, ct);

        if (session is null)
            return Error.NotFound("Interview.NotFound", "Không tìm thấy phiên phỏng vấn.");

        if (session.UserId != userId)
            return Error.Forbidden("Interview.Forbidden", "Bạn không có quyền xuất PDF báo cáo này.");

        if (session.Status != InterviewSessionStatus.Completed || session.Report is null)
            return Error.Conflict("Interview.NotCompleted", "Phiên phỏng vấn chưa hoàn thành hoặc chưa có báo cáo.");

        return GenerateInterviewPdfInternal(session);
    }

    public async Task<Result<byte[]>> GenerateMatchReportPdfAsync(
        Guid sessionId,
        Guid userId,
        CancellationToken ct = default)
    {
        var session = await _db.MatchSessions
            .Include(s => s.Targets)
                .ThenInclude(t => t.Result)
            .FirstOrDefaultAsync(s => s.Id == sessionId, ct);

        if (session is null)
            return Error.NotFound("Match.NotFound", "Không tìm thấy phiên đối sánh.");

        if (session.UserId != userId)
            return Error.Forbidden("Match.Forbidden", "Bạn không có quyền xuất PDF báo cáo này.");

        var completedResultsCount = session.Targets.Count(t => t.Status == MatchSessionStatus.Completed && t.Result is not null);
        if (completedResultsCount == 0)
            return Error.Conflict("Match.NoCompletedResults", "Phiên đối sánh chưa hoàn thành hoặc không có kết quả hợp lệ.");

        var resume = await _db.Resumes.FirstOrDefaultAsync(r => r.Id == session.ResumeId, ct);
        var resumeTitle = resume?.Title ?? "CV";

        // Load JobDescriptions for results
        var jdIds = session.Targets.Select(t => t.JobDescriptionId).Distinct().ToList();
        var jds = await _db.JobDescriptions
            .Where(j => jdIds.Contains(j.Id))
            .ToDictionaryAsync(j => j.Id, ct);

        return GenerateMatchPdfInternal(session, resumeTitle, jds);
    }

    public async Task<Result<byte[]>> GenerateInterviewReportPdfFromShareAsync(
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

        if (!shareLink.AllowPdfDownload)
            return Error.Forbidden("ShareLink.PdfDisabled", "Tải xuống PDF đã bị vô hiệu hóa cho liên kết chia sẻ này.");

        var session = await _db.InterviewSessions
            .Include(s => s.Report)
            .Include(s => s.Questions)
                .ThenInclude(q => q.Answer)
            .FirstOrDefaultAsync(s => s.Id == shareLink.ResourceId, ct);

        if (session is null || session.Report is null)
            return Error.NotFound("Interview.NotFound", "Không tìm thấy dữ liệu báo cáo phỏng vấn.");

        return GenerateInterviewPdfInternal(session);
    }

    public async Task<Result<byte[]>> GenerateMatchReportPdfFromShareAsync(
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

        if (!shareLink.AllowPdfDownload)
            return Error.Forbidden("ShareLink.PdfDisabled", "Tải xuống PDF đã bị vô hiệu hóa cho liên kết chia sẻ này.");

        var session = await _db.MatchSessions
            .Include(s => s.Targets)
                .ThenInclude(t => t.Result)
            .FirstOrDefaultAsync(s => s.Id == shareLink.ResourceId, ct);

        if (session is null)
            return Error.NotFound("Match.NotFound", "Không tìm thấy phiên đối sánh.");

        var resume = await _db.Resumes.FirstOrDefaultAsync(r => r.Id == session.ResumeId, ct);
        var resumeTitle = resume?.Title ?? "CV";

        // Load JobDescriptions for results
        var jdIds = session.Targets.Select(t => t.JobDescriptionId).Distinct().ToList();
        var jds = await _db.JobDescriptions
            .Where(j => jdIds.Contains(j.Id))
            .ToDictionaryAsync(j => j.Id, ct);

        return GenerateMatchPdfInternal(session, resumeTitle, jds);
    }

    private byte[] GenerateInterviewPdfInternal(InterviewSession session)
    {
        var report = session.Report!;

        var primaryColor = Color.FromHex("#1e293b");
        var accentColor = Color.FromHex("#3b82f6");
        var textColor = Color.FromHex("#334155");
        var secondaryTextColor = Color.FromHex("#64748b");
        var lightBg = Color.FromHex("#f8fafc");
        var cardBorder = Color.FromHex("#e2e8f0");

        var strengths = JsonParseHelper.ParseStringArray(report.StrengthsJson);
        var weaknesses = JsonParseHelper.ParseStringArray(report.WeaknessesJson);
        var recommendations = JsonParseHelper.ParseStringArray(report.RecommendationsJson);

        var scoreBreakdowns = SafeParseJson<ScoreBreakdownItem>(report.ScoreBreakdownsJson);
        var feedbackItems = SafeParseJson<FeedbackItem>(report.FeedbackItemsJson);

        var pdfBytes = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1.8f, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontFamily(Fonts.Arial).FontSize(10.5f).FontColor(textColor));

                // Header
                page.Header().Column(headerCol =>
                {
                    headerCol.Item().Row(row =>
                    {
                        row.RelativeItem().Column(col =>
                        {
                            col.Item().Text("INTER-VIET").Bold().FontSize(22).FontColor(accentColor);
                            col.Item().Text("HỆ THỐNG PHỎNG VẤN AI THÔNG MINH").FontSize(9).FontColor(secondaryTextColor).Bold();
                        });

                        row.ConstantItem(150).AlignRight().Column(col =>
                        {
                            col.Item().Text("BÁO CÁO PHỎNG VẤN").Bold().FontSize(12).FontColor(primaryColor);
                            col.Item().Text($"Ngày tạo: {report.CreatedAt.ToLocalTime():dd/MM/yyyy HH:mm}").FontSize(8).FontColor(secondaryTextColor);
                        });
                    });

                    headerCol.Item().PaddingVertical(5).LineHorizontal(1.5f).LineColor(accentColor);
                });

                // Content
                page.Content().PaddingVertical(10).Column(contentCol =>
                {
                    contentCol.Spacing(15);

                    // 1. Session Information
                    contentCol.Item().Background(lightBg).Border(1).BorderColor(cardBorder).Padding(12).Column(infoCol =>
                    {
                        infoCol.Spacing(6);
                        infoCol.Item().Text("Thông Tin Phiên Phỏng Vấn").Bold().FontSize(12).FontColor(accentColor);
                        infoCol.Item().Row(infoRow =>
                        {
                            infoRow.RelativeItem().Column(leftCol =>
                            {
                                leftCol.Item().Text(x => { x.Span("Vị trí: ").Bold(); x.Span(session.RoleName); });
                                leftCol.Item().Text(x => { x.Span("Cấp bậc: ").Bold(); x.Span(session.SeniorityLevel); });
                                leftCol.Item().Text(x => { x.Span("Loại phỏng vấn: ").Bold(); x.Span(session.InterviewType); });
                            });

                            infoRow.RelativeItem().Column(rightCol =>
                            {
                                rightCol.Item().Text(x => { x.Span("Chế độ: ").Bold(); x.Span(session.Mode); });
                                rightCol.Item().Text(x => { x.Span("Mô hình AI: ").Bold(); x.Span(session.AiModel ?? "Standard"); });
                                rightCol.Item().Text(x => { x.Span("Thời lượng: ").Bold(); x.Span($"{session.DurationMinutes} phút"); });
                            });
                        });
                    });

                    // 2. Overview Scores
                    contentCol.Item().Row(scoreRow =>
                    {
                        scoreRow.Spacing(15);

                        // Prominent Overall Score Card
                        scoreRow.ConstantItem(150).Background(accentColor).Border(1).BorderColor(accentColor).Padding(12).AlignCenter().Column(overallCol =>
                        {
                            overallCol.Spacing(8);
                            overallCol.Item().Text("ĐIỂM TỔNG QUAN").Bold().FontSize(10).FontColor(Colors.White).AlignCenter();
                            overallCol.Item().PaddingVertical(5).Text(report.OverallScore.HasValue ? $"{report.OverallScore.Value:F1}" : "N/A")
                                .Bold().FontSize(36).FontColor(Colors.White).AlignCenter();
                            overallCol.Item().Text("/ 100").FontSize(11).FontColor(Colors.White).AlignCenter();
                        });

                        // Dimension Scores Grid
                        scoreRow.RelativeItem().Background(lightBg).Border(1).BorderColor(cardBorder).Padding(12).Column(dimCol =>
                        {
                            dimCol.Spacing(8);
                            dimCol.Item().Text("Các Điểm Số Thành Phần").Bold().FontSize(12).FontColor(accentColor);

                            dimCol.Item().Row(dimRow =>
                            {
                                dimRow.Spacing(10);
                                dimRow.RelativeItem().Column(dimLeft =>
                                {
                                    dimLeft.Item().Text(x => { x.Span("Tự tin: ").Bold(); x.Span(report.ConfidenceScore.HasValue ? $"{report.ConfidenceScore.Value:F1}/10" : "N/A"); });
                                    dimLeft.Item().Text(x => { x.Span("Độ rõ giọng nói: ").Bold(); x.Span(report.VoiceClarityScore.HasValue ? $"{report.VoiceClarityScore.Value:F1}/10" : "N/A"); });
                                });

                                dimRow.RelativeItem().Column(dimRight =>
                                {
                                    dimRight.Item().Text(x => { x.Span("Tốc độ nói: ").Bold(); x.Span(report.PaceScore.HasValue ? $"{report.PaceScore.Value:F1}/10" : "N/A"); });
                                    dimRight.Item().Text(x => { x.Span("Từ đệm/lặp: ").Bold(); x.Span(report.FillerWordScore.HasValue ? $"{report.FillerWordScore.Value:F1}/10" : "N/A"); });
                                });
                            });
                        });
                    });

                    // 3. Score Breakdowns (QuestPDF Custom Details if available)
                    if (scoreBreakdowns.Count > 0)
                    {
                        contentCol.Item().Column(breakdownCol =>
                        {
                            breakdownCol.Spacing(5);
                            breakdownCol.Item().Text("Chi Tiết Đánh Giá").Bold().FontSize(12).FontColor(primaryColor);
                            
                            breakdownCol.Item().Border(1).BorderColor(cardBorder).Column(tableCol =>
                            {
                                foreach (var (item, idx) in scoreBreakdowns.Select((x, i) => (x, i)))
                                {
                                    var rowBg = idx % 2 == 0 ? lightBg : Colors.White;
                                    tableCol.Item().Background(rowBg).Padding(8).Row(tableRow =>
                                    {
                                        tableRow.RelativeItem().Column(cellCol =>
                                        {
                                            cellCol.Item().Text(item.DimensionName).Bold().FontSize(10);
                                            if (!string.IsNullOrWhiteSpace(item.Notes))
                                            {
                                                cellCol.Item().Text(item.Notes).FontSize(9).FontColor(secondaryTextColor);
                                            }
                                        });
                                        tableRow.ConstantItem(60).AlignRight().Text($"{item.Score:F1} / {item.MaxScore ?? 10}").Bold().FontSize(10).FontColor(accentColor);
                                    });
                                }
                            });
                        });
                    }

                    // 4. Strengths & Weaknesses
                    contentCol.Item().Row(swRow =>
                    {
                        swRow.Spacing(15);

                        // Strengths Card
                        swRow.RelativeItem().Border(1).BorderColor(cardBorder).Background(lightBg).Padding(12).Column(strCol =>
                        {
                            strCol.Spacing(8);
                            strCol.Item().Text("Điểm Mạnh").Bold().FontSize(11).FontColor(Color.FromHex("#16a34a"));
                            if (strengths.Count == 0)
                            {
                                strCol.Item().Text("Không ghi nhận điểm mạnh đặc biệt.").FontSize(9.5f).Italic().FontColor(secondaryTextColor);
                            }
                            else
                            {
                                foreach (var s in strengths)
                                {
                                    strCol.Item().Row(bullet =>
                                    {
                                        bullet.ConstantItem(12).Text("✓").Bold().FontColor(Color.FromHex("#16a34a"));
                                        bullet.RelativeItem().Text(s).FontSize(9.5f);
                                    });
                                }
                            }
                        });

                        // Weaknesses Card
                        swRow.RelativeItem().Border(1).BorderColor(cardBorder).Background(lightBg).Padding(12).Column(weakCol =>
                        {
                            weakCol.Spacing(8);
                            weakCol.Item().Text("Điểm Cần Cải Thiện").Bold().FontSize(11).FontColor(Color.FromHex("#d97706"));
                            if (weaknesses.Count == 0)
                            {
                                weakCol.Item().Text("Không ghi nhận điểm yếu lớn.").FontSize(9.5f).Italic().FontColor(secondaryTextColor);
                            }
                            else
                            {
                                foreach (var w in weaknesses)
                                {
                                    weakCol.Item().Row(bullet =>
                                    {
                                        bullet.ConstantItem(12).Text("⚠").Bold().FontColor(Color.FromHex("#d97706"));
                                        bullet.RelativeItem().Text(w).FontSize(9.5f);
                                    });
                                }
                            }
                        });
                    });

                    // 5. Recommendations
                    if (recommendations.Count > 0)
                    {
                        contentCol.Item().Background(lightBg).Border(1).BorderColor(cardBorder).Padding(12).Column(recCol =>
                        {
                            recCol.Spacing(6);
                            recCol.Item().Text("Khuyến Nghị Phát Triển").Bold().FontSize(11).FontColor(accentColor);
                            foreach (var r in recommendations)
                            {
                                recCol.Item().Row(bullet =>
                                {
                                    bullet.ConstantItem(15).Text("•").Bold().FontSize(14).FontColor(accentColor);
                                    bullet.RelativeItem().Text(r).FontSize(9.5f);
                                });
                            }
                        });
                    }

                    // 6. Feedback Items (QuestPDF Custom feedback details)
                    if (feedbackItems.Count > 0)
                    {
                        contentCol.Item().Column(fbListCol =>
                        {
                            fbListCol.Spacing(8);
                            fbListCol.Item().Text("Nhận Xét Chi Tiết Cụ Thể").Bold().FontSize(12).FontColor(primaryColor);
                            
                            foreach (var item in feedbackItems)
                            {
                                var badgeColor = item.PriorityLevel?.ToLower() switch
                                {
                                    "high" => Color.FromHex("#ef4444"),
                                    "medium" => Color.FromHex("#f59e0b"),
                                    _ => Color.FromHex("#3b82f6")
                                };

                                fbListCol.Item().Border(1).BorderColor(cardBorder).Padding(10).Column(fbCol =>
                                {
                                    fbCol.Spacing(4);
                                    fbCol.Item().Row(fbHeader =>
                                    {
                                        fbHeader.RelativeItem().Text(item.Title).Bold().FontSize(10);
                                        fbHeader.ConstantItem(60).AlignRight().Text($"[{item.Category}]").Bold().FontSize(9).FontColor(secondaryTextColor);
                                    });
                                    fbCol.Item().Text(item.Details).FontSize(9.5f).FontColor(textColor);
                                });
                            }
                        });
                    }

                    // 7. Q&A Section
                    var answeredQuestions = session.Questions
                        .Where(q => q.AskedAt is not null)
                        .OrderBy(q => q.QuestionNumber)
                        .ToList();

                    if (answeredQuestions.Count > 0)
                    {
                        contentCol.Item().PageBreak(); // Put Q&A on new page to look incredibly neat
                        contentCol.Item().Text("Nội Dung Câu Hỏi & Trả Lời").Bold().FontSize(14).FontColor(primaryColor);

                        foreach (var q in answeredQuestions)
                        {
                            contentCol.Item().Column(qCol =>
                            {
                                qCol.Spacing(5);
                                qCol.Item().Background(lightBg).Padding(10).Column(qTextCol =>
                                {
                                    qTextCol.Item().Text($"Câu {q.QuestionNumber} [{q.QuestionType} - {q.Difficulty}]:").Bold().FontSize(9.5f).FontColor(accentColor);
                                    qTextCol.Item().Text(q.QuestionText).Italic().FontSize(10);
                                });

                                if (q.Answer is not null)
                                {
                                    qCol.Item().PaddingLeft(15).BorderLeft(2).BorderColor(accentColor).PaddingLeft(10).Column(ansCol =>
                                    {
                                        ansCol.Spacing(4);
                                        ansCol.Item().Text(string.IsNullOrWhiteSpace(q.Answer.AnswerText) ? "(Không có câu trả lời)" : q.Answer.AnswerText).FontSize(9.5f);
                                        if (q.Answer.AnswerScore.HasValue)
                                        {
                                            ansCol.Item().Row(ansScoreRow =>
                                            {
                                                ansScoreRow.RelativeItem().Text(x =>
                                                {
                                                    x.Span("Điểm phản hồi: ").Bold().FontSize(9);
                                                    x.Span($"{q.Answer.AnswerScore.Value:F1}/10").Bold().FontSize(9).FontColor(accentColor);
                                                });
                                            });
                                        }

                                        if (!string.IsNullOrWhiteSpace(q.Answer.Feedback))
                                        {
                                            ansCol.Item().Text(x =>
                                            {
                                                x.Span("Phản hồi: ").Bold().FontSize(9).FontColor(secondaryTextColor);
                                                x.Span(q.Answer.Feedback).FontSize(9).FontColor(secondaryTextColor);
                                            });
                                        }
                                    });
                                }
                                else
                                {
                                    qCol.Item().PaddingLeft(15).Text("(Chưa trả lời)").Italic().FontSize(9.5f).FontColor(secondaryTextColor);
                                }
                            });
                        }
                    }
                });

                // Footer
                page.Footer().Column(footerCol =>
                {
                    footerCol.Item().LineHorizontal(1).LineColor(cardBorder);
                    footerCol.Item().PaddingTop(5).Row(row =>
                    {
                        row.RelativeItem().Text($"INTER-VIET AI Report | Phiên bản AI: {report.ModelVersion ?? "GPT-4o-mini"} | Schema: {report.SchemaVersion ?? "1.0"}").FontSize(8).FontColor(secondaryTextColor);
                        row.ConstantItem(100).AlignRight().Text(x =>
                        {
                            x.Span("Trang ").FontSize(8).FontColor(secondaryTextColor);
                            x.CurrentPageNumber().FontSize(8).FontColor(secondaryTextColor);
                            x.Span(" / ").FontSize(8).FontColor(secondaryTextColor);
                            x.TotalPages().FontSize(8).FontColor(secondaryTextColor);
                        });
                    });
                });
            });
        }).GeneratePdf();

        return pdfBytes;
    }

    private byte[] GenerateMatchPdfInternal(MatchSession session, string resumeTitle, Dictionary<Guid, JobDescription> jds)
    {
        var primaryColor = Color.FromHex("#1e293b");
        var accentColor = Color.FromHex("#3b82f6");
        var textColor = Color.FromHex("#334155");
        var secondaryTextColor = Color.FromHex("#64748b");
        var lightBg = Color.FromHex("#f8fafc");
        var cardBorder = Color.FromHex("#e2e8f0");

        var pdfBytes = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1.8f, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontFamily(Fonts.Arial).FontSize(10.5f).FontColor(textColor));

                // Header
                page.Header().Column(headerCol =>
                {
                    headerCol.Item().Row(row =>
                    {
                        row.RelativeItem().Column(col =>
                        {
                            col.Item().Text("INTER-VIET").Bold().FontSize(22).FontColor(accentColor);
                            col.Item().Text("HỆ THỐNG ĐỐI SÁNH CV - JD AI").FontSize(9).FontColor(secondaryTextColor).Bold();
                        });

                        row.ConstantItem(150).AlignRight().Column(col =>
                        {
                            col.Item().Text("BÁO CÁO ĐỐI SÁNH CV").Bold().FontSize(12).FontColor(primaryColor);
                            col.Item().Text($"Ngày tạo: {session.CompletedAt?.ToLocalTime() ?? DateTime.Now.ToLocalTime():dd/MM/yyyy HH:mm}").FontSize(8).FontColor(secondaryTextColor);
                        });
                    });

                    headerCol.Item().PaddingVertical(5).LineHorizontal(1.5f).LineColor(accentColor);
                });

                // Content
                page.Content().PaddingVertical(10).Column(contentCol =>
                {
                    contentCol.Spacing(15);

                    // 1. Session Information
                    contentCol.Item().Background(lightBg).Border(1).BorderColor(cardBorder).Padding(12).Column(infoCol =>
                    {
                        infoCol.Spacing(6);
                        infoCol.Item().Text("Thông Tin Báo Cáo Đối Sánh").Bold().FontSize(12).FontColor(accentColor);
                        infoCol.Item().Row(infoRow =>
                        {
                            infoRow.RelativeItem().Column(leftCol =>
                            {
                                leftCol.Item().Text(x => { x.Span("CV đối sánh: ").Bold(); x.Span(resumeTitle); });
                                leftCol.Item().Text(x => { x.Span("Loại đối sánh: ").Bold(); x.Span(session.SessionType == "multi" ? "Đa mục tiêu (Multi-match)" : "Đơn mục tiêu (Single-match)"); });
                            });

                            infoRow.RelativeItem().Column(rightCol =>
                            {
                                rightCol.Item().Text(x => { x.Span("Trạng thái: ").Bold(); x.Span(session.Status); });
                                rightCol.Item().Text(x => { x.Span("Thời gian đối sánh: ").Bold(); x.Span(session.CompletedAt.HasValue ? $"{session.CompletedAt.Value.ToLocalTime():dd/MM/yyyy HH:mm}" : "N/A"); });
                            });
                        });
                    });

                    // 2. Results List
                    var completedTargets = session.Targets
                        .Where(t => t.Status == MatchSessionStatus.Completed && t.Result is not null)
                        .OrderByDescending(t => t.Result!.TotalScore)
                        .ToList();

                    contentCol.Item().Text("Kết Quả Đối Sánh Chi Tiết").Bold().FontSize(14).FontColor(primaryColor);

                    foreach (var (target, idx) in completedTargets.Select((x, i) => (x, i)))
                    {
                        var result = target.Result!;
                        jds.TryGetValue(target.JobDescriptionId, out var jd);
                        var jobTitle = jd?.Title ?? "Công việc";
                        var companyName = jd?.CompanyName ?? "Công ty";

                        var strengths = JsonParseHelper.ParseStringArray(result.StrengthsJson);
                        var weaknesses = JsonParseHelper.ParseStringArray(result.WeaknessesJson);
                        var suggestions = JsonParseHelper.ParseStringArray(result.SuggestionsJson);
                        var matchedSkills = JsonParseHelper.ParseStringArray(result.MatchedSkillsJson);
                        var missingSkills = JsonParseHelper.ParseStringArray(result.MissingSkillsJson);

                        // Visual PageBreak for multiple targets to keep it extremely clean
                        if (idx > 0)
                        {
                            contentCol.Item().PageBreak();
                        }

                        contentCol.Item().Column(targetCol =>
                        {
                            targetCol.Spacing(10);

                            // Target Job Header Banner
                            targetCol.Item().Background(primaryColor).Padding(10).Row(bannerRow =>
                            {
                                bannerRow.RelativeItem().Column(banCol =>
                                {
                                    banCol.Item().Text(jobTitle).Bold().FontSize(12).FontColor(Colors.White);
                                    banCol.Item().Text(companyName).FontSize(10).FontColor(Colors.Grey.Lighten2);
                                });

                                bannerRow.ConstantItem(120).AlignRight().Column(banRight =>
                                {
                                    banRight.Item().Text($"Điểm: {result.TotalScore:F1} / 100").Bold().FontSize(12).FontColor(Colors.White);
                                    banRight.Item().Text($"Phân nhóm: {result.MatchBand?.ToUpper() ?? "N/A"}").FontSize(8).FontColor(Colors.Grey.Lighten2);
                                });
                            });

                            // Sub-scores Card
                            targetCol.Item().Background(lightBg).Border(1).BorderColor(cardBorder).Padding(10).Column(scoreCol =>
                            {
                                scoreCol.Spacing(5);
                                scoreCol.Item().Text("Điểm Số Các Khía Cạnh").Bold().FontSize(10).FontColor(accentColor);
                                scoreCol.Item().Row(gridRow =>
                                {
                                    gridRow.RelativeItem().Text($"Kỹ thuật: {result.TechnicalScore?.ToString("F1") ?? "N/A"}/10").FontSize(9.5f);
                                    gridRow.RelativeItem().Text($"Kinh nghiệm: {result.ExperienceScore?.ToString("F1") ?? "N/A"}/10").FontSize(9.5f);
                                    gridRow.RelativeItem().Text($"Học vấn: {result.EducationScore?.ToString("F1") ?? "N/A"}/10").FontSize(9.5f);
                                    gridRow.RelativeItem().Text($"Kỹ năng mềm: {result.SoftSkillScore?.ToString("F1") ?? "N/A"}/10").FontSize(9.5f);
                                    gridRow.RelativeItem().Text($"Ngôn ngữ: {result.LanguageScore?.ToString("F1") ?? "N/A"}/10").FontSize(9.5f);
                                });
                            });

                            // Match Summary Text
                            if (!string.IsNullOrWhiteSpace(result.SummaryText))
                            {
                                targetCol.Item().Column(sumCol =>
                                {
                                    sumCol.Spacing(3);
                                    sumCol.Item().Text("Tóm Tắt Đánh Giá").Bold().FontSize(10).FontColor(primaryColor);
                                    sumCol.Item().Text(result.SummaryText).FontSize(9.5f).Justify();
                                });
                            }

                            // Skills Columns (Matched / Missing)
                            targetCol.Item().Row(skillsRow =>
                            {
                                skillsRow.Spacing(12);

                                // Matched Skills Box
                                skillsRow.RelativeItem().Border(1).BorderColor(cardBorder).Background(lightBg).Padding(10).Column(mSkill =>
                                {
                                    mSkill.Spacing(5);
                                    mSkill.Item().Text("Kỹ Năng Phù Hợp").Bold().FontSize(9.5f).FontColor(Color.FromHex("#16a34a"));
                                    if (matchedSkills.Count == 0)
                                    {
                                        mSkill.Item().Text("Không phát hiện rõ rệt kỹ năng phù hợp chính.").FontSize(8.5f).Italic().FontColor(secondaryTextColor);
                                    }
                                    else
                                    {
                                        mSkill.Item().Text(string.Join(", ", matchedSkills)).FontSize(9).FontColor(textColor);
                                    }
                                });

                                // Missing Skills Box
                                skillsRow.RelativeItem().Border(1).BorderColor(cardBorder).Background(lightBg).Padding(10).Column(misSkill =>
                                {
                                    misSkill.Spacing(5);
                                    misSkill.Item().Text("Kỹ Năng Thiếu Hụt").Bold().FontSize(9.5f).FontColor(Color.FromHex("#d97706"));
                                    if (missingSkills.Count == 0)
                                    {
                                        misSkill.Item().Text("Đầy đủ kỹ năng cốt lõi được yêu cầu.").FontSize(8.5f).Italic().FontColor(secondaryTextColor);
                                    }
                                    else
                                    {
                                        misSkill.Item().Text(string.Join(", ", missingSkills)).FontSize(9).FontColor(textColor);
                                    }
                                });
                            });

                            // Strengths / Weaknesses / Suggestions
                            targetCol.Item().Row(swRow =>
                            {
                                swRow.Spacing(12);

                                // Strengths
                                swRow.RelativeItem().Border(1).BorderColor(cardBorder).Background(lightBg).Padding(10).Column(strCol =>
                                {
                                    strCol.Spacing(5);
                                    strCol.Item().Text("Điểm Mạnh").Bold().FontSize(9.5f).FontColor(Color.FromHex("#16a34a"));
                                    if (strengths.Count == 0)
                                    {
                                        strCol.Item().Text("Không có ghi chú điểm mạnh.").FontSize(9).Italic().FontColor(secondaryTextColor);
                                    }
                                    else
                                    {
                                        foreach (var s in strengths)
                                        {
                                            strCol.Item().Row(bullet =>
                                            {
                                                bullet.ConstantItem(10).Text("✓").Bold().FontColor(Color.FromHex("#16a34a")).FontSize(9);
                                                bullet.RelativeItem().Text(s).FontSize(9);
                                            });
                                        }
                                    }
                                });

                                // Weaknesses
                                swRow.RelativeItem().Border(1).BorderColor(cardBorder).Background(lightBg).Padding(10).Column(weakCol =>
                                {
                                    weakCol.Spacing(5);
                                    weakCol.Item().Text("Hạn Chế").Bold().FontSize(9.5f).FontColor(Color.FromHex("#d97706"));
                                    if (weaknesses.Count == 0)
                                    {
                                        weakCol.Item().Text("Không có ghi chú hạn chế.").FontSize(9).Italic().FontColor(secondaryTextColor);
                                    }
                                    else
                                    {
                                        foreach (var w in weaknesses)
                                        {
                                            weakCol.Item().Row(bullet =>
                                            {
                                                bullet.ConstantItem(10).Text("⚠").Bold().FontColor(Color.FromHex("#d97706")).FontSize(9);
                                                bullet.RelativeItem().Text(w).FontSize(9);
                                            });
                                        }
                                    }
                                });
                            });

                            // Suggestions
                            if (suggestions.Count > 0)
                            {
                                targetCol.Item().Background(lightBg).Border(1).BorderColor(cardBorder).Padding(10).Column(sugCol =>
                                {
                                    sugCol.Spacing(4);
                                    sugCol.Item().Text("Khuyến Nghị Tối Ưu CV").Bold().FontSize(9.5f).FontColor(accentColor);
                                    foreach (var s in suggestions)
                                    {
                                        sugCol.Item().Row(bullet =>
                                        {
                                            bullet.ConstantItem(12).Text("•").Bold().FontSize(12).FontColor(accentColor);
                                            bullet.RelativeItem().Text(s).FontSize(9);
                                        });
                                    }
                                });
                            }
                        });
                    }
                });

                // Footer
                page.Footer().Column(footerCol =>
                {
                    footerCol.Item().LineHorizontal(1).LineColor(cardBorder);
                    footerCol.Item().PaddingTop(5).Row(row =>
                    {
                        row.RelativeItem().Text($"INTER-VIET AI CV-JD Matching Report | Dữ liệu xuất: {session.CompletedAt?.ToLocalTime() ?? DateTime.Now.ToLocalTime():dd/MM/yyyy}").FontSize(8).FontColor(secondaryTextColor);
                        row.ConstantItem(100).AlignRight().Text(x =>
                        {
                            x.Span("Trang ").FontSize(8).FontColor(secondaryTextColor);
                            x.CurrentPageNumber().FontSize(8).FontColor(secondaryTextColor);
                            x.Span(" / ").FontSize(8).FontColor(secondaryTextColor);
                            x.TotalPages().FontSize(8).FontColor(secondaryTextColor);
                        });
                    });
                });
            });
        }).GeneratePdf();

        return pdfBytes;
    }

    private static List<T> SafeParseJson<T>(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try
        {
            return JsonSerializer.Deserialize<List<T>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? [];
        }
        catch
        {
            return [];
        }
    }

    // Helper: SHA-256 hash of token, lower-case hex string
    private static string HashToken(string token)
    {
        if (string.IsNullOrWhiteSpace(token)) return string.Empty;
        var bytes = Encoding.UTF8.GetBytes(token);
        var hashBytes = SHA256.HashData(bytes);
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }

    private sealed class ScoreBreakdownItem
    {
        public string DimensionCode { get; set; } = string.Empty;
        public string DimensionName { get; set; } = string.Empty;
        public decimal Score { get; set; }
        public decimal? MaxScore { get; set; }
        public string? Notes { get; set; }
    }

    private sealed class FeedbackItem
    {
        public string Category { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public string? PriorityLevel { get; set; }
    }
}
