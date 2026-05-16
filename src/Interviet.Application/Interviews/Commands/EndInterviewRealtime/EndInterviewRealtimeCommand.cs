using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Interviews;
using Interviet.Shared.Results;
using Interviet.Domain.Interviews;

namespace Interviet.Application.Interviews.Commands.EndInterviewRealtime;

public sealed record EndInterviewRealtimeCommand(
    Guid SessionId, Guid UserId,
    EndInterviewRealtimeRequest Request) : IRequest<Result<EndInterviewRealtimeResponse>>;

public sealed class EndInterviewRealtimeCommandHandler
    : IRequestHandler<EndInterviewRealtimeCommand, Result<EndInterviewRealtimeResponse>>
{
    private readonly IAppDbContext     _db;
    private readonly IDateTimeProvider _dt;

    public EndInterviewRealtimeCommandHandler(IAppDbContext db, IDateTimeProvider dt)
    {
        _db = db;
        _dt = dt;
    }

    public async Task<Result<EndInterviewRealtimeResponse>> Handle(
        EndInterviewRealtimeCommand command, CancellationToken ct)
    {
        var req = command.Request;

        if (req.RealtimeSessionId == Guid.Empty)
            return Error.Validation("Interview.RealtimeSessionIdRequired",
                "realtimeSessionId là bắt buộc.");

        var session = await _db.InterviewSessions
            .FirstOrDefaultAsync(s => s.Id == command.SessionId, ct);

        if (session is null)
            return Error.NotFound("Interview.NotFound", "Không tìm thấy phiên phỏng vấn.");
        if (session.UserId != command.UserId)
            return Error.Forbidden("Interview.Forbidden", "Bạn không có quyền truy cập phiên phỏng vấn này.");

        var rs = await _db.InterviewRealtimeSessions
            .FirstOrDefaultAsync(r => r.Id == req.RealtimeSessionId
                                   && r.InterviewSessionId == command.SessionId, ct);

        if (rs is null)
            return Error.NotFound("Interview.RealtimeNotFound",
                "Không tìm thấy realtime session hoặc không thuộc phiên phỏng vấn này.");

        var now = _dt.UtcNow;

        // Idempotent: already ended
        if (rs.Status is InterviewRealtimeSessionStatus.Completed
                      or InterviewRealtimeSessionStatus.Failed
                      or InterviewRealtimeSessionStatus.Expired)
        {
            return Result<EndInterviewRealtimeResponse>.Success(new EndInterviewRealtimeResponse
            {
                SessionId         = session.Id,
                RealtimeSessionId = rs.Id,
                Status            = rs.Status,
                EndedAt           = rs.EndedAt ?? now,
                Message           = "Phiên realtime đã kết thúc trước đó."
            });
        }

        rs.Status    = InterviewRealtimeSessionStatus.Completed;
        rs.EndedAt   = now;
        rs.UpdatedAt = now;

        // Move session from Ending → remain Live (finalize will happen separately)
        if (session.Status == InterviewSessionStatus.Live)
        {
            // keep as-is — POST /complete will finalize after transcript saved
        }

        await _db.SaveChangesAsync(ct);

        return Result<EndInterviewRealtimeResponse>.Success(new EndInterviewRealtimeResponse
        {
            SessionId         = session.Id,
            RealtimeSessionId = rs.Id,
            Status            = rs.Status,
            EndedAt           = rs.EndedAt,
            Message           = "Phiên realtime đã kết thúc. Gọi POST /finalize để lưu transcript rồi POST /complete để phân tích."
        });
    }
}
