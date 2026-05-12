using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Interviews;
using Interviet.Shared.Results;

namespace Interviet.Application.Interviews.Queries.GetInterviewById;

public sealed record GetInterviewByIdQuery(Guid SessionId, Guid UserId) : IRequest<Result<InterviewSessionDetailResponse>>;

public sealed class GetInterviewByIdQueryHandler
    : IRequestHandler<GetInterviewByIdQuery, Result<InterviewSessionDetailResponse>>
{
    private readonly IAppDbContext _db;

    public GetInterviewByIdQueryHandler(IAppDbContext db) => _db = db;

    public async Task<Result<InterviewSessionDetailResponse>> Handle(GetInterviewByIdQuery request, CancellationToken ct)
    {
        var session = await _db.InterviewSessions
            .Include(s => s.Questions)
                .ThenInclude(q => q.Answer)
            .Include(s => s.Report)
                .ThenInclude(r => r!.ScoreBreakdowns)
            .Include(s => s.Report)
                .ThenInclude(r => r!.FeedbackItems)
            .FirstOrDefaultAsync(s => s.Id == request.SessionId, ct);

        if (session is null)
            return Error.NotFound("Interview.NotFound", "Không tìm thấy phiên phỏng vấn.");

        if (session.UserId != request.UserId)
            return Error.Forbidden("Interview.Forbidden", "Bạn không có quyền truy cập phiên phỏng vấn này.");

        var questions = session.Questions
            .OrderBy(q => q.QuestionNumber)
            .Select(q => new InterviewQuestionResponse
            {
                QuestionId     = q.Id,
                QuestionNumber = q.QuestionNumber,
                QuestionType   = q.QuestionType,
                QuestionText   = q.QuestionText,
                Difficulty     = q.Difficulty,
                AskedAt        = q.AskedAt,
                HasAnswer      = q.Answer is not null,
                Answer         = q.Answer is null ? null : new InterviewAnswerResponse
                {
                    AnswerId           = q.Answer.Id,
                    AnswerText         = q.Answer.AnswerText,
                    AudioFileUrl       = q.Answer.AudioFileUrl,
                    AudioDurationSeconds = q.Answer.AudioDurationSeconds,
                    AnswerScore        = q.Answer.AnswerScore,
                    Feedback           = q.Answer.Feedback,
                    ClarityScore       = q.Answer.ClarityScore,
                    RelevanceScore     = q.Answer.RelevanceScore,
                    CompletenessScore  = q.Answer.CompletenessScore,
                    AnsweredAt         = q.Answer.AnsweredAt
                }
            }).ToList();

        InterviewReportResponse? report = null;
        if (session.Report is not null)
        {
            report = new InterviewReportResponse
            {
                OverallScore      = session.Report.OverallScore,
                ConfidenceScore   = session.Report.ConfidenceScore,
                VoiceClarityScore = session.Report.VoiceClarityScore,
                PaceScore         = session.Report.PaceScore,
                StrengthsJson     = session.Report.StrengthsJson,
                WeaknessesJson    = session.Report.WeaknessesJson,
                RecommendationsJson = session.Report.RecommendationsJson,
                ModelVersion      = session.Report.ModelVersion
            };
        }

        return Result<InterviewSessionDetailResponse>.Success(new InterviewSessionDetailResponse
        {
            SessionId      = session.Id,
            Status         = session.Status,
            Position       = session.RoleName,
            Level          = session.SeniorityLevel,
            InterviewType  = session.InterviewType,
            Goal           = session.Goal,
            DurationMinutes = session.DurationMinutes,
            Mode           = session.Mode,
            InterviewerMode = session.InterviewerMode,
            AiModel        = session.AiModel,
            ErrorCode      = session.ErrorCode,
            ErrorMessage   = session.ErrorMessage,
            CreatedAt      = session.CreatedAt,
            StartedAt      = session.StartedAt,
            CompletedAt    = session.CompletedAt,
            Questions      = questions,
            Report         = report
        });
    }
}
