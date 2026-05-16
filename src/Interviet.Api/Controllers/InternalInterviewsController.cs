using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Interviet.Application.Common.Options;
using Interviet.Application.Interviews.Commands.FinalizeInterviewRealtime;
using Interviet.Application.Interviews.Commands.InternalRealtimeEvents;
using Interviet.Contracts.Interviews;

namespace Interviet.Api.Controllers;

/// <summary>
/// Internal callback endpoints for Python AI services.
/// NOT exposed to end users. Secured by X-Interviet-Api-Key header.
/// Do NOT add [Authorize] here — uses API key authentication only.
/// </summary>
[ApiController]
[Route("api/v1/internal/interviews")]
[Produces("application/json")]
public sealed class InternalInterviewsController : ControllerBase
{
    private readonly ISender            _mediator;
    private readonly AiServicesOptions  _opts;

    public InternalInterviewsController(ISender mediator, IOptions<AiServicesOptions> opts)
    {
        _mediator = mediator;
        _opts     = opts.Value;
    }

    /// <summary>
    /// Python realtime service pushes transcript events here.
    /// Requires X-Interviet-Api-Key header matching AiServices.ApiKey.
    /// Events are saved idempotently by (realtimeSessionId, sequenceNumber).
    /// Duplicate sequenceNumbers are silently ignored.
    /// </summary>
    [HttpPost("realtime/events")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SaveRealtimeEvents(
        [FromBody] InternalRealtimeEventsRequest request, CancellationToken ct)
    {
        if (!ValidateApiKey())
            return Unauthorized(new { code = "Unauthorized", detail = "Invalid or missing X-Interviet-Api-Key." });

        if (request.SessionId == Guid.Empty || request.RealtimeSessionId == Guid.Empty)
            return BadRequest(new { code = "Validation", detail = "sessionId and realtimeSessionId are required." });

        var result = await _mediator.Send(new InternalSaveRealtimeEventsCommand(request), ct);

        if (result.IsSuccess)
            return Ok(new { success = true, data = result.Value });

        return result.Error.Type switch
        {
            Shared.Results.ErrorType.NotFound => NotFound(new { code = result.Error.Code, detail = result.Error.Description }),
            _ => StatusCode(500, new { code = result.Error.Code, detail = result.Error.Description })
        };
    }

    /// <summary>
    /// Python finalizes a realtime session by pushing full transcript + Q/A pairs.
    /// Saves as InterviewQuestions/InterviewAnswers so POST /complete can run analysis.
    /// Idempotent: duplicate questionNumbers are safely skipped.
    /// Requires X-Interviet-Api-Key header.
    /// </summary>
    [HttpPost("realtime/finalize")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> FinalizeRealtime(
        [FromBody] InternalRealtimeFinalizeRequest request, CancellationToken ct)
    {
        if (!ValidateApiKey())
            return Unauthorized(new { code = "Unauthorized", detail = "Invalid or missing X-Interviet-Api-Key." });

        if (request.SessionId == Guid.Empty || request.RealtimeSessionId == Guid.Empty)
            return BadRequest(new { code = "Validation", detail = "sessionId and realtimeSessionId are required." });

        if (request.QaPairs.Count == 0)
            return BadRequest(new { code = "Validation", detail = "qaPairs must not be empty." });

        var result = await _mediator.Send(new InternalFinalizeRealtimeCommand(request), ct);

        if (result.IsSuccess)
            return Ok(new { success = true, data = result.Value });

        return result.Error.Type switch
        {
            Shared.Results.ErrorType.NotFound   => NotFound(  new { code = result.Error.Code, detail = result.Error.Description }),
            Shared.Results.ErrorType.Validation => BadRequest( new { code = result.Error.Code, detail = result.Error.Description }),
            Shared.Results.ErrorType.Conflict   => Conflict(  new { code = result.Error.Code, detail = result.Error.Description }),
            _ => StatusCode(500, new { code = result.Error.Code, detail = result.Error.Description })
        };
    }

    private bool ValidateApiKey()
    {
        if (string.IsNullOrWhiteSpace(_opts.ApiKey)) return false;
        Request.Headers.TryGetValue("X-Interviet-Api-Key", out var key);
        return string.Equals(key.ToString(), _opts.ApiKey, StringComparison.Ordinal);
    }
}
