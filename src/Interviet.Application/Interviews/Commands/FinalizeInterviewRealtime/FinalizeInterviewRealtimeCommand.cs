using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Interviews;
using Interviet.Shared.Results;
using Interviet.Domain.Interviews;

namespace Interviet.Application.Interviews.Commands.FinalizeInterviewRealtime;

/// <summary>
/// Shared command for both public (JWT) and internal (ApiKey) finalize flows.
/// UserId = null means internal/Python callback (ownership check skipped).
/// </summary>
public sealed record FinalizeInterviewRealtimeCommand(
    Guid SessionId,
    Guid? UserId,           // null = internal call, skip ownership check
    Guid RealtimeSessionId,
    List<RealtimeQaPairInput> QaPairs,
    string? TranscriptText,
    string? ModelVersion,
    string? SchemaVersion) : IRequest<Result<PublicFinalizeRealtimeResponse>>;

public sealed record RealtimeQaPairInput(
    int QuestionNumber,
    string QuestionText,
    string? AnswerText,
    string? QuestionType,
    string? Difficulty,
    DateTime? AskedAt,
    DateTime? AnsweredAt);

public sealed class FinalizeInterviewRealtimeCommandHandler
    : IRequestHandler<FinalizeInterviewRealtimeCommand, Result<PublicFinalizeRealtimeResponse>>
{
    private readonly IAppDbContext     _db;
    private readonly IDateTimeProvider _dt;
    private readonly ILogger<FinalizeInterviewRealtimeCommandHandler> _logger;

    public FinalizeInterviewRealtimeCommandHandler(
        IAppDbContext db, IDateTimeProvider dt,
        ILogger<FinalizeInterviewRealtimeCommandHandler> logger)
    {
        _db     = db;
        _dt     = dt;
        _logger = logger;
    }

    public async Task<Result<PublicFinalizeRealtimeResponse>> Handle(
        FinalizeInterviewRealtimeCommand command, CancellationToken ct)
    {
        // ── Validate qaPairs ─────────────────────────────────────────────────
        var validPairs = command.QaPairs
            .Where(p => !string.IsNullOrWhiteSpace(p.QuestionText))
            .ToList();

        if (validPairs.Count == 0)
            return Error.Validation("Interview.QaPairsRequired",
                "Cần có ít nhất 1 câu hỏi hợp lệ (questionText không được trống).");

        // ── Load realtime session ────────────────────────────────────────────
        var rs = await _db.InterviewRealtimeSessions
            .FirstOrDefaultAsync(r => r.Id == command.RealtimeSessionId
                                   && r.InterviewSessionId == command.SessionId, ct);

        if (rs is null)
            return Error.NotFound("Interview.RealtimeNotFound",
                "Realtime session không tồn tại hoặc không thuộc phiên phỏng vấn này.");

        // ── Load interview session ───────────────────────────────────────────
        var session = await _db.InterviewSessions
            .Include(s => s.Questions)
                .ThenInclude(q => q.Answer)
            .FirstOrDefaultAsync(s => s.Id == command.SessionId, ct);

        if (session is null)
            return Error.NotFound("Interview.NotFound", "Không tìm thấy phiên phỏng vấn.");

        // ── Ownership check (public flow only) ───────────────────────────────
        if (command.UserId.HasValue && session.UserId != command.UserId.Value)
            return Error.Forbidden("Interview.Forbidden",
                "Bạn không có quyền truy cập phiên phỏng vấn này.");

        // ── State machine: realtime must be in finalizable state ─────────────
        if (rs.Status == InterviewRealtimeSessionStatus.Failed)
            return Error.Conflict("Interview.RealtimeFailed",
                "Realtime session đã thất bại, không thể finalize.");

        var now = _dt.UtcNow;

        // ── Idempotency: count existing Q/A from this realtime session ────────
        var existingNumbers = session.Questions
            .Select(q => q.QuestionNumber)
            .ToHashSet();

        bool isIdempotent = validPairs.All(p => existingNumbers.Contains(p.QuestionNumber));

        if (isIdempotent)
        {
            // All pairs already exist — pure idempotent return
            var existingAnswered = session.Questions
                .Count(q => q.Answer?.AnswerText != null);

            _logger.LogInformation(
                "Finalize idempotent: all {Count} Q/A already exist for Session={SessionId}",
                validPairs.Count, command.SessionId);

            return Result<PublicFinalizeRealtimeResponse>.Success(new PublicFinalizeRealtimeResponse
            {
                SessionId          = session.Id,
                RealtimeSessionId  = rs.Id,
                Status             = "finalized",
                SavedQuestionCount = 0,
                SavedAnswerCount   = 0,
                CanComplete        = existingAnswered > 0,
                IsIdempotent       = true,
                Message            = $"Transcript already finalized. {existingAnswered} answers available. Call POST /complete to analyze."
            });
        }

        // ── Save Q/A pairs (skip existing by questionNumber) ─────────────────
        int savedQuestions = 0;
        int savedAnswers   = 0;

        foreach (var pair in validPairs)
        {
            var existingQ = session.Questions
                .FirstOrDefault(q => q.QuestionNumber == pair.QuestionNumber);

            if (existingQ is not null)
            {
                // Question exists — add answer only if missing
                if (existingQ.Answer is null && !string.IsNullOrWhiteSpace(pair.AnswerText))
                {
                    _db.InterviewAnswers.Add(new InterviewAnswer
                    {
                        Id                  = Guid.NewGuid(),
                        InterviewQuestionId = existingQ.Id,
                        AnswerText          = pair.AnswerText,
                        AnsweredAt          = pair.AnsweredAt ?? now,
                        CreatedAt           = now
                    });
                    savedAnswers++;
                }
                continue;
            }

            // New question
            var question = new InterviewQuestion
            {
                Id                 = Guid.NewGuid(),
                InterviewSessionId = session.Id,
                QuestionNumber     = pair.QuestionNumber,
                QuestionType       = pair.QuestionType ?? "general",
                QuestionText       = pair.QuestionText,
                Difficulty         = pair.Difficulty,
                AskedAt            = pair.AskedAt ?? now,
                CreatedAt          = now
            };
            _db.InterviewQuestions.Add(question);
            savedQuestions++;

            if (!string.IsNullOrWhiteSpace(pair.AnswerText))
            {
                _db.InterviewAnswers.Add(new InterviewAnswer
                {
                    Id                  = Guid.NewGuid(),
                    InterviewQuestionId = question.Id,
                    AnswerText          = pair.AnswerText,
                    AnsweredAt          = pair.AnsweredAt ?? now,
                    CreatedAt           = now
                });
                savedAnswers++;
            }
        }

        // ── Mark realtime session completed ───────────────────────────────────
        if (rs.Status is not (InterviewRealtimeSessionStatus.Completed
                           or InterviewRealtimeSessionStatus.Failed))
        {
            rs.Status    = InterviewRealtimeSessionStatus.Completed;
            rs.EndedAt   ??= now;
            rs.UpdatedAt = now;
        }

        // ── Ensure interview session is Live for /complete ────────────────────
        if (session.Status is InterviewSessionStatus.Draft or InterviewSessionStatus.Ready)
        {
            session.Status    = InterviewSessionStatus.Live;
            session.StartedAt ??= now;
            session.UpdatedAt = now;
        }

        await _db.SaveChangesAsync(ct);

        var totalAnswered = session.Questions.Count(q => q.Answer?.AnswerText != null) + savedAnswers;
        var canComplete   = totalAnswered > 0 || savedAnswers > 0;

        _logger.LogInformation(
            "Finalized realtime Session={SessionId} RealtimeId={RealtimeId}: " +
            "+{Questions} questions, +{Answers} answers. CanComplete={CanComplete}",
            command.SessionId, command.RealtimeSessionId,
            savedQuestions, savedAnswers, canComplete);

        return Result<PublicFinalizeRealtimeResponse>.Success(new PublicFinalizeRealtimeResponse
        {
            SessionId          = session.Id,
            RealtimeSessionId  = rs.Id,
            Status             = "finalized",
            SavedQuestionCount = savedQuestions,
            SavedAnswerCount   = savedAnswers,
            CanComplete        = canComplete,
            IsIdempotent       = false,
            Message            = canComplete
                ? $"Realtime transcript finalized. {savedQuestions} questions, {savedAnswers} answers saved. You can now POST /complete."
                : "Transcript saved but no answers with text found. Check qaPairs.answerText."
        });
    }
}
