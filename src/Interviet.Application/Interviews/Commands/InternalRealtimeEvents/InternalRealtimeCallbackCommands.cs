using MediatR;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Interviet.Application.Common.Interfaces;
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

            string? metaJson = ev.Metadata is null
                ? null
                : JsonSerializer.Serialize(ev.Metadata);

            toSave.Add(new InterviewRealtimeEvent
            {
                Id                = Guid.NewGuid(),
                InterviewSessionId = req.SessionId,
                RealtimeSessionId = req.RealtimeSessionId,
                SequenceNumber    = ev.SequenceNumber,
                EventType         = ev.EventType,
                Role              = ev.Role,
                Text              = ev.Text,
                ProviderEventId   = ev.ProviderEventId,
                OccurredAt        = ev.OccurredAt,
                CreatedAt         = now,
                MetadataJson      = metaJson
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

// ── Finalize Callback ─────────────────────────────────────────────────────────
public sealed record InternalFinalizeRealtimeCommand(
    InternalRealtimeFinalizeRequest Request) : IRequest<Result<InternalCallbackResponse>>;

public sealed class InternalFinalizeRealtimeCommandHandler
    : IRequestHandler<InternalFinalizeRealtimeCommand, Result<InternalCallbackResponse>>
{
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _dt;
    private readonly ILogger<InternalFinalizeRealtimeCommandHandler> _logger;

    public InternalFinalizeRealtimeCommandHandler(
        IAppDbContext db, IDateTimeProvider dt,
        ILogger<InternalFinalizeRealtimeCommandHandler> logger)
    {
        _db     = db;
        _dt     = dt;
        _logger = logger;
    }

    public async Task<Result<InternalCallbackResponse>> Handle(
        InternalFinalizeRealtimeCommand command, CancellationToken ct)
    {
        var req = command.Request;

        var rs = await _db.InterviewRealtimeSessions
            .FirstOrDefaultAsync(r => r.Id == req.RealtimeSessionId
                                   && r.InterviewSessionId == req.SessionId, ct);

        if (rs is null)
            return Error.NotFound("Interview.RealtimeNotFound", "Realtime session không tồn tại.");

        var session = await _db.InterviewSessions
            .Include(s => s.Questions)
                .ThenInclude(q => q.Answer)
            .FirstOrDefaultAsync(s => s.Id == req.SessionId, ct);

        if (session is null)
            return Error.NotFound("Interview.NotFound", "Phiên phỏng vấn không tồn tại.");

        var now     = _dt.UtcNow;
        int saved   = 0;

        foreach (var pair in req.QaPairs.Where(p => !string.IsNullOrWhiteSpace(p.QuestionText)))
        {
            // Skip if question with same number already exists
            var existing = session.Questions.FirstOrDefault(q => q.QuestionNumber == pair.QuestionNumber);
            if (existing is not null)
            {
                // If no answer yet, save the answer from transcript
                if (existing.Answer is null && !string.IsNullOrWhiteSpace(pair.AnswerText))
                {
                    _db.InterviewAnswers.Add(new InterviewAnswer
                    {
                        Id                  = Guid.NewGuid(),
                        InterviewQuestionId = existing.Id,
                        AnswerText          = pair.AnswerText,
                        AnsweredAt          = now,
                        CreatedAt           = now
                    });
                    saved++;
                }
                continue;
            }

            // Create new question
            var question = new InterviewQuestion
            {
                Id                 = Guid.NewGuid(),
                InterviewSessionId = session.Id,
                QuestionNumber     = pair.QuestionNumber,
                QuestionType       = pair.QuestionType ?? "general",
                QuestionText       = pair.QuestionText,
                Difficulty         = pair.Difficulty,
                AskedAt            = now,
                CreatedAt          = now
            };
            _db.InterviewQuestions.Add(question);

            if (!string.IsNullOrWhiteSpace(pair.AnswerText))
            {
                _db.InterviewAnswers.Add(new InterviewAnswer
                {
                    Id                  = Guid.NewGuid(),
                    InterviewQuestionId = question.Id,
                    AnswerText          = pair.AnswerText,
                    AnsweredAt          = now,
                    CreatedAt           = now
                });
            }
            saved++;
        }

        // Mark realtime session completed (if not already)
        if (rs.Status is not (InterviewRealtimeSessionStatus.Completed or InterviewRealtimeSessionStatus.Failed))
        {
            rs.Status    = InterviewRealtimeSessionStatus.Completed;
            rs.EndedAt   = now;
            rs.UpdatedAt = now;
        }

        // Ensure session is still Live (so POST /complete can run analysis)
        if (session.Status == InterviewSessionStatus.Processing)
        {
            // leave — do not force status change here
        }

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Finalized realtime session {RealtimeId}: {Saved} Q/A pairs saved. Call POST /complete to analyze.",
            req.RealtimeSessionId, saved);

        return Result<InternalCallbackResponse>.Success(new InternalCallbackResponse
        {
            Success        = true,
            ProcessedCount = saved,
            Message        = $"Finalized {saved} Q/A pairs. Call POST /api/v1/interviews/{req.SessionId}/complete to run analysis."
        });
    }
}
