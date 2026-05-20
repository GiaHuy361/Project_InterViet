using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Reports;
using Interviet.Shared.Results;

namespace Interviet.Api.Controllers;

/// <summary>
/// Public / anonymous endpoints for viewing and exporting shared reports (Phase 12).
/// All endpoints are [AllowAnonymous] and lookup via secure SHA-256 base64url token.
/// </summary>
[AllowAnonymous]
[Route("api/v1/reports/shared")]
public sealed class SharedReportsController : ApiControllerBase
{
    private readonly IAppDbContext _db;
    private readonly IReportShareService _shareService;
    private readonly IReportPdfService _pdfService;

    public SharedReportsController(
        IAppDbContext db,
        IReportShareService shareService,
        IReportPdfService pdfService)
    {
        _db = db;
        _shareService = shareService;
        _pdfService = pdfService;
    }

    /// <summary>
    /// Retrieve a shared report (Interview or Match) by token.
    /// Auto-detects and returns either SharedInterviewReportResponse or SharedMatchReportResponse.
    /// </summary>
    [HttpGet("{token}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSharedReport(string token, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(token))
            return BadRequest(new { code = "Validation", detail = "Token is required." });

        var tokenHash = HashToken(token);
        var shareLink = await _db.ReportShareLinks
            .FirstOrDefaultAsync(x => x.TokenHash == tokenHash, ct);

        if (shareLink is null)
            return NotFound(new
            {
                type = "https://api.interviet.vn/errors/sharelink-notfound",
                title = "ShareLink.NotFound",
                detail = "Liên kết chia sẻ không tồn tại hoặc đã bị thu hồi.",
                code = "ShareLink.NotFound"
            });

        if (shareLink.ReportType == ReportType.Interview)
        {
            var result = await _shareService.GetSharedInterviewReportAsync(token, ct);
            return FromResult(result);
        }
        else if (shareLink.ReportType == ReportType.Match)
        {
            var result = await _shareService.GetSharedMatchReportAsync(token, ct);
            return FromResult(result);
        }

        return BadRequest(new { code = "Validation", detail = "Invalid report type." });
    }

    /// <summary>
    /// Download the PDF export of a public shared report.
    /// Respects the AllowPdfDownload configuration set by the owner.
    /// </summary>
    [HttpGet("{token}/export-pdf")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(FileContentResult))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ExportSharedReportPdf(string token, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(token))
            return BadRequest(new { code = "Validation", detail = "Token is required." });

        var validationResult = await _shareService.ValidateTokenForPdfAsync(token, ct);
        if (validationResult.IsFailure) return FromResult(validationResult);

        var shareLink = validationResult.Value;

        if (shareLink.ReportType == ReportType.Interview)
        {
            var pdfResult = await _pdfService.GenerateInterviewReportPdfFromShareAsync(token, ct);
            if (pdfResult.IsFailure) return FromResult(pdfResult);
            return File(pdfResult.Value, "application/pdf", $"shared-interview-report-{shareLink.ResourceId}.pdf");
        }
        else if (shareLink.ReportType == ReportType.Match)
        {
            var pdfResult = await _pdfService.GenerateMatchReportPdfFromShareAsync(token, ct);
            if (pdfResult.IsFailure) return FromResult(pdfResult);
            return File(pdfResult.Value, "application/pdf", $"shared-match-report-{shareLink.ResourceId}.pdf");
        }

        return BadRequest(new { code = "Validation", detail = "Invalid report type." });
    }

    private static string HashToken(string token)
    {
        if (string.IsNullOrWhiteSpace(token)) return string.Empty;
        var bytes = Encoding.UTF8.GetBytes(token);
        var hashBytes = SHA256.HashData(bytes);
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }
}
