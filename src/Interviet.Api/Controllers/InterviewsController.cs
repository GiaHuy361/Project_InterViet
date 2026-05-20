using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Interviews.Commands.CreateInterviewSession;
using Interviet.Application.Interviews.Commands.StartInterview;
using Interviet.Application.Interviews.Commands.SubmitInterviewMessage;
using Interviet.Application.Interviews.Commands.CompleteInterview;
using Interviet.Application.Interviews.Commands.DeleteInterview;
using Interviet.Application.Interviews.Commands.StartInterviewRealtime;
using Interviet.Application.Interviews.Commands.EndInterviewRealtime;
using Interviet.Application.Interviews.Commands.FinalizeInterviewRealtime;
using Interviet.Application.Interviews.Queries.CheckInterviewQuota;
using Interviet.Application.Interviews.Queries.GetMyInterviews;
using Interviet.Application.Interviews.Queries.GetInterviewById;
using Interviet.Application.Interviews.Queries.GetInterviewStats;
using Interviet.Application.Interviews.Queries.GetInterviewRealtime;
using Interviet.Contracts.Reports;
using Interviet.Contracts.Interviews;

namespace Interviet.Api.Controllers;

/// <summary>
/// AI Interview — text and realtime voice endpoints (Phase 7A/7C/8A).
/// All endpoints require JWT authentication.
/// </summary>
[Authorize]
[Route("api/v1/interviews")]
public sealed class InterviewsController : ApiControllerBase
{
    private readonly ISender             _mediator;
    private readonly ICurrentUserService _currentUser;
    private readonly IReportShareService _shareService;
    private readonly IReportPdfService   _pdfService;

    public InterviewsController(
        ISender mediator,
        ICurrentUserService currentUser,
        IReportShareService shareService,
        IReportPdfService pdfService)
    {
        _mediator     = mediator;
        _currentUser  = currentUser;
        _shareService = shareService;
        _pdfService   = pdfService;
    }

    /// <summary>Check if current user has remaining interview.ai quota today. Does NOT consume quota.</summary>
    [HttpPost("check-quota")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CheckQuota(CancellationToken ct)
    {
        var result = await _mediator.Send(new CheckInterviewQuotaQuery(_currentUser.UserId), ct);
        return FromResult(result);
    }

    /// <summary>Create a new interview session. Checks and consumes interview.ai quota.</summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreateInterviewSessionRequest request, CancellationToken ct)
    {
        var correlationId = HttpContext.TraceIdentifier;
        var result = await _mediator.Send(
            new CreateInterviewSessionCommand(_currentUser.UserId, correlationId, request), ct);
        return FromResult(result);
    }

    /// <summary>Start a text interview — generates first AI question.</summary>
    [HttpPost("{id:guid}/start")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Start(Guid id, CancellationToken ct)
    {
        var correlationId = HttpContext.TraceIdentifier;
        var result = await _mediator.Send(new StartInterviewCommand(id, _currentUser.UserId, correlationId), ct);
        return FromResult(result);
    }

    /// <summary>Submit an answer and receive the next AI question.</summary>
    [HttpPost("{id:guid}/messages")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SubmitMessage(
        Guid id, [FromBody] SubmitInterviewMessageRequest request, CancellationToken ct)
    {
        var correlationId = HttpContext.TraceIdentifier;
        var result = await _mediator.Send(
            new SubmitInterviewMessageCommand(id, _currentUser.UserId, correlationId, request), ct);
        return FromResult(result);
    }

    /// <summary>Complete the interview session and request AI analysis report.</summary>
    [HttpPost("{id:guid}/complete")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Complete(Guid id, CancellationToken ct)
    {
        var correlationId = HttpContext.TraceIdentifier;
        var result = await _mediator.Send(new CompleteInterviewCommand(id, _currentUser.UserId, correlationId), ct);
        return FromResult(result);
    }

    /// <summary>List current user's interview sessions with pagination.</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyInterviews(
        [FromQuery] int page     = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct     = default)
    {
        var result = await _mediator.Send(new GetMyInterviewsQuery(_currentUser.UserId, page, pageSize), ct);
        return FromResult(result);
    }

    /// <summary>Get full detail of a single interview session (transcript, questions, answers, report).</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetInterviewByIdQuery(id, _currentUser.UserId), ct);
        return FromResult(result);
    }

    /// <summary>Delete (cancel) an interview session. Only the owner may delete.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new DeleteInterviewCommand(id, _currentUser.UserId), ct);
        return FromResult(result);
    }

    /// <summary>Get interview statistics for the current user (total sessions, scores, recent).</summary>
    [HttpGet("stats")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetStats(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetInterviewStatsQuery(_currentUser.UserId), ct);
        return FromResult(result);
    }

    // ── Phase 8A: Realtime ────────────────────────────────────────────────────

    /// <summary>
    /// Start a realtime voice interview session.
    /// Returns ephemeral clientSecret for provider connection (one-time, not stored).
    /// When InterviewRealtimeEnabled=false returns 503 ServiceUnavailable.
    /// </summary>
    [HttpPost("{id:guid}/realtime/start")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> StartRealtime(
        Guid id, [FromBody] StartInterviewRealtimeRequest request, CancellationToken ct)
    {
        var correlationId = HttpContext.TraceIdentifier;
        var result = await _mediator.Send(
            new StartInterviewRealtimeCommand(id, _currentUser.UserId, correlationId, request), ct);
        return FromResult(result);
    }

    /// <summary>End an active realtime session. Idempotent if already ended.</summary>
    [HttpPost("{id:guid}/realtime/end")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> EndRealtime(
        Guid id, [FromBody] EndInterviewRealtimeRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new EndInterviewRealtimeCommand(id, _currentUser.UserId, request), ct);
        return FromResult(result);
    }

    /// <summary>Get active realtime session info and paginated events.</summary>
    [HttpGet("{id:guid}/realtime")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetRealtime(
        Guid id,
        [FromQuery] int eventPage     = 1,
        [FromQuery] int eventPageSize = 50,
        CancellationToken ct          = default)
    {
        var result = await _mediator.Send(
            new GetInterviewRealtimeQuery(id, _currentUser.UserId, eventPage, eventPageSize), ct);
        return FromResult(result);
    }

    /// <summary>
    /// Finalize a realtime interview session by submitting the transcript and Q/A pairs.
    /// Saves transcript as InterviewQuestions + InterviewAnswers so POST /complete can run AI analysis.
    /// Idempotent: calling with the same realtimeSessionId multiple times is safe.
    /// 
    /// Example body:
    /// {
    ///   "realtimeSessionId": "00000000-0000-0000-0000-000000000000",
    ///   "transcriptText": "Assistant: Xin chào...\nUser: Tôi là backend developer...",
    ///   "qaPairs": [
    ///     { "questionNumber": 1, "questionText": "Bạn hãy giới thiệu bản thân.",
    ///       "answerText": "Tôi là backend developer...", "questionType": "opening", "difficulty": "easy" },
    ///     { "questionNumber": 2, "questionText": "Bạn đã xây dựng API nào?",
    ///       "answerText": "Tôi từng xây dựng API upload CV...", "questionType": "technical", "difficulty": "medium" }
    ///   ],
    ///   "modelVersion": "gpt-realtime",
    ///   "schemaVersion": "interview-realtime-v1"
    /// }
    /// </summary>
    [HttpPost("{id:guid}/realtime/finalize")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> FinalizeRealtime(
        Guid id, [FromBody] PublicFinalizeRealtimeRequest request, CancellationToken ct)
    {
        if (request.RealtimeSessionId == Guid.Empty)
            return BadRequest(new { code = "Validation", detail = "realtimeSessionId is required." });

        var pairs = request.QaPairs
            .Select(p => new RealtimeQaPairInput(
                p.QuestionNumber,
                p.QuestionText,
                p.AnswerText,
                p.QuestionType,
                p.Difficulty,
                AskedAt:    p.AskedAt,
                AnsweredAt: p.AnsweredAt))
            .ToList();

        var result = await _mediator.Send(new FinalizeInterviewRealtimeCommand(
            SessionId:         id,
            UserId:            _currentUser.UserId,
            RealtimeSessionId: request.RealtimeSessionId,
            QaPairs:           pairs,
            TranscriptText:    request.TranscriptText,
            ModelVersion:      request.ModelVersion,
            SchemaVersion:     request.SchemaVersion), ct);

        return FromResult(result);
    }

    /// <summary>Export report of an interview session as a PDF file.</summary>
    [HttpGet("{id:guid}/report/export-pdf")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(FileContentResult))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ExportPdf(Guid id, CancellationToken ct)
    {
        var result = await _pdfService.GenerateInterviewReportPdfAsync(id, _currentUser.UserId, ct);
        if (result.IsFailure) return FromResult(result);
        return File(result.Value, "application/pdf", $"interview-report-{id}.pdf");
    }

    /// <summary>Create a new report share link for an interview session.</summary>
    [HttpPost("{id:guid}/report/share")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(CreateShareLinkResponse))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ShareReport(
        Guid id, [FromBody] CreateShareLinkRequest request, CancellationToken ct)
    {
        var result = await _shareService.CreateInterviewShareAsync(_currentUser.UserId, id, request, ct);
        return FromResult(result);
    }

    /// <summary>Get all active, non-revoked share links for an interview session.</summary>
    [HttpGet("{id:guid}/report/shares")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(List<ShareLinkListItemResponse>))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetShares(Guid id, CancellationToken ct)
    {
        var result = await _shareService.GetInterviewSharesAsync(_currentUser.UserId, id, ct);
        return FromResult(result);
    }

    /// <summary>Revoke (disable) a specific report share link.</summary>
    [HttpDelete("{id:guid}/report/shares/{shareId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(RevokeShareLinkResponse))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RevokeShare(Guid id, Guid shareId, CancellationToken ct)
    {
        var result = await _shareService.RevokeShareAsync(_currentUser.UserId, shareId, ct);
        return FromResult(result);
    }
}
