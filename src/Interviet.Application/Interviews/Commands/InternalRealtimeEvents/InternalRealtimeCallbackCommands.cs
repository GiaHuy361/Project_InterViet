using MediatR;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Interviews.Commands.FinalizeInterviewRealtime;
using Interviet.Contracts.Interviews;
using Interviet.Shared.Results;
using Interviet.Domain.Interviews;

namespace Interviet.Application.Interviews.Commands.InternalRealtimeEvents;

// ── Events Callback ───────────────────────────────────────────────────────────
public sealed record InternalSaveRealtimeEventsCommand(
    InternalRealtimeEventsRequest Request) : IRequest<Result<InternalCallbackResponse>>;

public sealed class InternalSaveRealtimeEventsCommandHandler
    : IRequestHandler<InternalSaveRealtimeEventsCommand, Result<InternalCallbackResponse>>
{
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _dt;
    private readonly ILogger<InternalSaveRealtimeEventsCommandHandler> _logger;

    public InternalSaveRealtimeEventsCommandHandler(
        IAppDbContext db, IDateTimeProvider dt,
        ILogger<InternalSaveRealtimeEventsCommandHandler> logger)
    {
        _db     = db;
        _dt     = dt;
        _logger = logger;
    }

    public async Task<Result<InternalCallbackResponse>> Handle(
        InternalSaveRealtimeEventsCommand command, CancellationToken ct)
    {
        var req = command.Request;

        if (req.Events.Count == 0)
            return Result<InternalCallbackResponse>.Success(
                new InternalCallbackResponse { Success = true, ProcessedCount = 0, Message = "No events." });

        var rs = await _db.InterviewRealtimeSessions
            .FirstOrDefaultAsync(r => r.Id == req.RealtimeSessionId
                                   && r.InterviewSessionId == req.SessionId, ct);

        if (rs is null)
            return Error.NotFound("Interview.RealtimeNotFound", "Realtime session không tồn tại.");

        // Existing sequence numbers (for idempotency)
        var existing = (await _db.InterviewRealtimeEvents
            .Where(e => e.RealtimeSessionId == req.RealtimeSessionId)
            .Select(e => e.SequenceNumber)
            .ToListAsync(ct)).ToHashSet();

        var now    = _dt.UtcNow;
        var toSave = new List<InterviewRealtimeEvent>();

        foreach (var ev in req.Events)
        {
            if (existing.Contains(ev.SequenceNumber)) continue; // idempotent skip

            // Serialize metadata safely — handle null and complex objects
            string? metaJson = null;
            if (ev.Metadata is not null)
            {
                try { metaJson = JsonSerializer.Serialize(ev.Metadata); }
                catch { metaJson = null; } // never crash on bad metadata
            }

            toSave.Add(new InterviewRealtimeEvent
            {
                Id                 = Guid.NewGuid(),
                InterviewSessionId = req.SessionId,
                RealtimeSessionId  = req.RealtimeSessionId,
                SequenceNumber     = ev.SequenceNumber,
                EventType          = ev.EventType,
                Role               = ev.Role,
                Text               = ev.Text,
                ProviderEventId    = ev.ProviderEventId,
                OccurredAt         = ev.OccurredAt,
                CreatedAt          = now,
                MetadataJson       = metaJson
            });
        }

        if (toSave.Count > 0)
        {
            _db.InterviewRealtimeEvents.AddRange(toSave);
            await _db.SaveChangesAsync(ct);
        }

        _logger.LogInformation(
            "Saved {Count}/{Total} realtime events for RealtimeSession={RealtimeId}",
            toSave.Count, req.Events.Count, req.RealtimeSessionId);

        return Result<InternalCallbackResponse>.Success(new InternalCallbackResponse
        {
            Success        = true,
            ProcessedCount = toSave.Count,
            Message        = $"Saved {toSave.Count} new events (skipped {req.Events.Count - toSave.Count} duplicates)."
        });
    }
}

// ── Finalize Callback (delegates to shared FinalizeInterviewRealtimeCommand) ──
public sealed record InternalFinalizeRealtimeCommand(
    InternalRealtimeFinalizeRequest Request) : IRequest<Result<InternalCallbackResponse>>;

public sealed class InternalFinalizeRealtimeCommandHandler
    : IRequestHandler<InternalFinalizeRealtimeCommand, Result<InternalCallbackResponse>>
{
    private readonly ISender _mediator;
    private readonly ILogger<InternalFinalizeRealtimeCommandHandler> _logger;

    public InternalFinalizeRealtimeCommandHandler(
        ISender mediator,
        ILogger<InternalFinalizeRealtimeCommandHandler> logger)
    {
        _mediator = mediator;
        _logger   = logger;
    }

    public async Task<Result<InternalCallbackResponse>> Handle(
        InternalFinalizeRealtimeCommand command, CancellationToken ct)
    {
        var req = command.Request;

        // Map internal contract → shared command (UserId = null = internal, skip ownership)
        var pairs = req.QaPairs
            .Select(p => new RealtimeQaPairInput(
                p.QuestionNumber,
                p.QuestionText,
                p.AnswerText,
                p.QuestionType,
                p.Difficulty,
                AskedAt:    null,
                AnsweredAt: null))
            .ToList();

        var sharedResult = await _mediator.Send(new FinalizeInterviewRealtimeCommand(
            SessionId:        req.SessionId,
            UserId:           null,           // internal — no ownership check
            RealtimeSessionId: req.RealtimeSessionId,
            QaPairs:          pairs,
            TranscriptText:   req.TranscriptText,
            ModelVersion:     req.ModelVersion,
            SchemaVersion:    req.SchemaVersion), ct);

        if (!sharedResult.IsSuccess)
        {
            _logger.LogWarning("Internal finalize failed: {Code} {Message}",
                sharedResult.Error.Code, sharedResult.Error.Description);
            return Error.Failure(sharedResult.Error.Code, sharedResult.Error.Description);
        }

        var r = sharedResult.Value!;
        return Result<InternalCallbackResponse>.Success(new InternalCallbackResponse
        {
            Success        = true,
            ProcessedCount = r.SavedQuestionCount + r.SavedAnswerCount,
            Message        = r.Message ?? $"Finalized. {r.SavedQuestionCount} questions, {r.SavedAnswerCount} answers saved."
        });
    }
}
