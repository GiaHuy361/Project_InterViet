using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Shared.Results;

namespace Interviet.Application.JobDescriptions.Commands.DeleteJobDescription;

public sealed record DeleteJobDescriptionCommand(Guid JobDescriptionId, Guid UserId)
    : IRequest<Result>;

public sealed class DeleteJobDescriptionCommandHandler
    : IRequestHandler<DeleteJobDescriptionCommand, Result>
{
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _dt;
    private readonly IActivityLogger _activityLogger;
    private readonly ILogger<DeleteJobDescriptionCommandHandler> _logger;

    public DeleteJobDescriptionCommandHandler(
        IAppDbContext db,
        IDateTimeProvider dt,
        IActivityLogger activityLogger,
        ILogger<DeleteJobDescriptionCommandHandler> logger)
    {
        _db             = db;
        _dt             = dt;
        _activityLogger = activityLogger;
        _logger         = logger;
    }

    public async Task<Result> Handle(DeleteJobDescriptionCommand request, CancellationToken ct)
    {
        var jd = await _db.JobDescriptions
            .FirstOrDefaultAsync(j => j.Id == request.JobDescriptionId && !j.IsDeleted, ct);

        if (jd is null)
            return Error.NotFound("JobDescription.NotFound", "Không tìm thấy mô tả công việc.");

        if (jd.UserId != request.UserId)
            return Error.Forbidden("JobDescription.Forbidden", "Bạn không có quyền xoá mô tả công việc này.");

        jd.IsDeleted  = true;
        jd.DeletedAt  = _dt.UtcNow;
        jd.UpdatedAt  = _dt.UtcNow;
        await _db.SaveChangesAsync(ct);

        try
        {
            await _activityLogger.LogAsync(request.UserId, ActivityActionKeys.JobDescriptionDeleted,
                entityType: "JobDescription", entityId: jd.Id,
                description: "JD đã được xóa.");
        }
        catch (Exception ex) { _logger.LogWarning(ex, "activity log failed: job_description_deleted"); }

        return Result.Success();
    }
}
