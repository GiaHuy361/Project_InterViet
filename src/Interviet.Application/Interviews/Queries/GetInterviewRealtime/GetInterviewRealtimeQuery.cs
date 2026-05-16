using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Interviews;
using Interviet.Shared.Results;
using Interviet.Domain.Interviews;

namespace Interviet.Application.Interviews.Queries.GetInterviewRealtime;

public sealed record GetInterviewRealtimeQuery(Guid SessionId, Guid UserId, int EventPage = 1, int EventPageSize = 50)
    : IRequest<Result<GetInterviewRealtimeResponse>>;

public sealed class GetInterviewRealtimeQueryHandler
    : IRequestHandler<GetInterviewRealtimeQuery, Result<GetInterviewRealtimeResponse>>
{
    private readonly IAppDbContext _db;

    public GetInterviewRealtimeQueryHandler(IAppDbContext db) => _db = db;

    public async Task<Result<GetInterviewRealtimeResponse>> Handle(
        GetInterviewRealtimeQuery request, CancellationToken ct)
    {
        var session = await _db.InterviewSessions
            .Include(s => s.RealtimeSessions)
            .FirstOrDefaultAsync(s => s.Id == request.SessionId, ct);

        if (session is null)
            return Error.NotFound("Interview.NotFound", "Không tìm thấy phiên phỏng vấn.");
        if (session.UserId != request.UserId)
            return Error.Forbidden("Interview.Forbidden", "Bạn không có quyền truy cập phiên phỏng vấn này.");

        var activeRs = session.RealtimeSessions
            .Where(rs => rs.Status == InterviewRealtimeSessionStatus.Active)
            .OrderByDescending(rs => rs.CreatedAt)
            .FirstOrDefault()
            ?? session.RealtimeSessions
               .OrderByDescending(rs => rs.CreatedAt)
               .FirstOrDefault();

        var page     = Math.Max(1, request.EventPage);
        var pageSize = Math.Clamp(request.EventPageSize, 1, 200);

        List<InterviewRealtimeEventResponse> events = [];
        int totalEvents = 0;

        if (activeRs is not null)
        {
            totalEvents = await _db.InterviewRealtimeEvents
                .Where(e => e.RealtimeSessionId == activeRs.Id)
                .CountAsync(ct);

            events = await _db.InterviewRealtimeEvents
                .Where(e => e.RealtimeSessionId == activeRs.Id)
                .OrderBy(e => e.SequenceNumber)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new InterviewRealtimeEventResponse
                {
                    EventId         = e.Id,
                    SequenceNumber  = e.SequenceNumber,
                    EventType       = e.EventType,
                    Role            = e.Role,
                    Text            = e.Text,
                    ProviderEventId = e.ProviderEventId,
                    OccurredAt      = e.OccurredAt
                })
                .ToListAsync(ct);
        }

        InterviewRealtimeSessionResponse? realtimeDto = activeRs is null ? null : new()
        {
            RealtimeSessionId = activeRs.Id,
            Status            = activeRs.Status,
            Provider          = activeRs.Provider,
            Model             = activeRs.Model,
            ConnectUrl        = activeRs.ConnectUrl,
            ExpiresAt         = activeRs.ExpiresAt,
            StartedAt         = activeRs.StartedAt,
            EndedAt           = activeRs.EndedAt,
            ErrorCode         = activeRs.ErrorCode,
            CreatedAt         = activeRs.CreatedAt
        };

        return Result<GetInterviewRealtimeResponse>.Success(new GetInterviewRealtimeResponse
        {
            SessionId             = session.Id,
            ActiveRealtimeSession = realtimeDto,
            Events                = events,
            TotalEvents           = totalEvents
        });
    }
}
