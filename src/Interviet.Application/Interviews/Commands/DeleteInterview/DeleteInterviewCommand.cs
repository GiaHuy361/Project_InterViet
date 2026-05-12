using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Interviet.Application.Common.Interfaces;
using Interviet.Shared.Results;
using Interviet.Domain.Interviews;

namespace Interviet.Application.Interviews.Commands.DeleteInterview;

public sealed record DeleteInterviewCommand(Guid SessionId, Guid UserId) : IRequest<Result>;

public sealed class DeleteInterviewCommandHandler
    : IRequestHandler<DeleteInterviewCommand, Result>
{
    private readonly IAppDbContext  _db;
    private readonly IActivityLogger _actLog;
    private readonly ILogger<DeleteInterviewCommandHandler> _logger;

    public DeleteInterviewCommandHandler(IAppDbContext db, IActivityLogger actLog,
        ILogger<DeleteInterviewCommandHandler> logger)
    {
        _db     = db;
        _actLog = actLog;
        _logger = logger;
    }

    public async Task<Result> Handle(DeleteInterviewCommand command, CancellationToken ct)
    {
        var session = await _db.InterviewSessions
            .FirstOrDefaultAsync(s => s.Id == command.SessionId, ct);

        if (session is null)
            return Error.NotFound("Interview.NotFound", "Không tìm thấy phiên phỏng vấn.");
        if (session.UserId != command.UserId)
            return Error.Forbidden("Interview.Forbidden", "Bạn không có quyền xóa phiên phỏng vấn này.");

        // Soft-delete: mark abandoned + set a soft-delete flag via UpdatedAt sentinel
        // InterviewSession inherits AuditableEntity, not SoftDeletableEntity —
        // so we mark it as Cancelled so it's visually removed from the user's list.
        session.Status    = InterviewSessionStatus.Cancelled;
        session.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        try
        {
            await _actLog.LogAsync(command.UserId, ActivityActionKeys.InterviewAbandoned,
                entityType: "InterviewSession", entityId: session.Id,
                description: "Phiên phỏng vấn đã bị xóa bởi người dùng.");
        }
        catch (Exception ex) { _logger.LogWarning(ex, "Activity log failed for interview delete"); }

        return Result.Success();
    }
}
