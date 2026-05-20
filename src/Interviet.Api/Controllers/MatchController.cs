using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Matching.Commands.CreateMatch;
using Interviet.Application.Matching.Commands.CreateMultiMatch;
using Interviet.Application.Matching.Queries.GetMatchById;
using Interviet.Application.Matching.Queries.GetMyMatches;
using Interviet.Contracts.Matching;
using Interviet.Contracts.Reports;

namespace Interviet.Api.Controllers;

/// <summary>
/// CV-JD Matching endpoints.
/// Route: /api/v1/matches
/// All endpoints require authentication.
/// </summary>
[Route("api/v1/matches")]
[Authorize]
public sealed class MatchController : ApiControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;
    private readonly IReportShareService _shareService;
    private readonly IReportPdfService   _pdfService;

    public MatchController(
        IMediator mediator,
        ICurrentUserService currentUser,
        IReportShareService shareService,
        IReportPdfService pdfService)
    {
        _mediator     = mediator;
        _currentUser  = currentUser;
        _shareService = shareService;
        _pdfService   = pdfService;
    }

    /// <summary>
    /// Trigger CV-JD matching. Returns 202 Accepted immediately; result is computed in background.
    /// Requires the Resume to have ResumeParsedData (parse completed successfully).
    /// </summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateMatch(
        [FromBody] CreateMatchRequest request,
        CancellationToken ct)
    {
        var command = new CreateMatchCommand(
            UserId:           _currentUser.UserId,
            ResumeId:         request.ResumeId,
            JobDescriptionId: request.JobDescriptionId);

        var result = await _mediator.Send(command, ct);
        if (result.IsFailure) return FromResult(result);

        return StatusCode(StatusCodes.Status202Accepted, new
        {
            success = true,
            data    = result.Value,
            meta    = new { requestId = HttpContext.TraceIdentifier, timestamp = DateTime.UtcNow }
        });
    }

    /// <summary>
    /// Trigger multi-JD matching. Returns 202 Accepted immediately.
    /// </summary>
    [HttpPost("multi")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateMultiMatch(
        [FromBody] CreateMultiMatchRequest request,
        CancellationToken ct)
    {
        var command = new CreateMultiMatchCommand(
            UserId:            _currentUser.UserId,
            ResumeId:          request.ResumeId,
            JobDescriptionIds: request.JobDescriptionIds,
            Title:             request.Title);

        var result = await _mediator.Send(command, ct);
        if (result.IsFailure) return FromResult(result);

        return StatusCode(StatusCodes.Status202Accepted, new
        {
            success = true,
            data    = result.Value,
            meta    = new { requestId = HttpContext.TraceIdentifier, timestamp = DateTime.UtcNow }
        });
    }

    /// <summary>List current user's match sessions (paginated).</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyMatches(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetMyMatchesQuery(_currentUser.UserId, page, pageSize), ct);
        return FromResult(result);
    }

    /// <summary>Get match session detail (including result if completed).</summary>
    [HttpGet("{sessionId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetById(Guid sessionId, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new GetMatchByIdQuery(sessionId, _currentUser.UserId), ct);
        return FromResult(result);
    }

    /// <summary>Export report of a CV-JD match session as a PDF file.</summary>
    [HttpGet("{sessionId:guid}/report/export-pdf")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(FileContentResult))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ExportPdf(Guid sessionId, CancellationToken ct)
    {
        var result = await _pdfService.GenerateMatchReportPdfAsync(sessionId, _currentUser.UserId, ct);
        if (result.IsFailure) return FromResult(result);
        return File(result.Value, "application/pdf", $"match-report-{sessionId}.pdf");
    }

    /// <summary>Create a new report share link for a CV-JD match session.</summary>
    [HttpPost("{sessionId:guid}/report/share")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(CreateShareLinkResponse))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ShareReport(
        Guid sessionId, [FromBody] CreateShareLinkRequest request, CancellationToken ct)
    {
        var result = await _shareService.CreateMatchShareAsync(_currentUser.UserId, sessionId, request, ct);
        return FromResult(result);
    }

    /// <summary>Get all active, non-revoked share links for a CV-JD match session.</summary>
    [HttpGet("{sessionId:guid}/report/shares")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(List<ShareLinkListItemResponse>))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetShares(Guid sessionId, CancellationToken ct)
    {
        var result = await _shareService.GetMatchSharesAsync(_currentUser.UserId, sessionId, ct);
        return FromResult(result);
    }

    /// <summary>Revoke (disable) a specific report share link.</summary>
    [HttpDelete("{sessionId:guid}/report/shares/{shareId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(RevokeShareLinkResponse))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RevokeShare(Guid sessionId, Guid shareId, CancellationToken ct)
    {
        var result = await _shareService.RevokeShareAsync(_currentUser.UserId, shareId, ct);
        return FromResult(result);
    }
}
