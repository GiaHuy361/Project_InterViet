using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Matching.Commands.CreateMatch;
using Interviet.Application.Matching.Commands.CreateMultiMatch;
using Interviet.Application.Matching.Queries.GetMatchById;
using Interviet.Application.Matching.Queries.GetMyMatches;
using Interviet.Contracts.Matching;

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

    public MatchController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator    = mediator;
        _currentUser = currentUser;
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
}
