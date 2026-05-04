using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Domain.Resumes;
using Interviet.Shared.Results;

namespace Interviet.Application.Resumes.Commands.SetActiveResume;

public sealed record SetActiveResumeCommand(Guid ResumeId, Guid UserId) : IRequest<Result>;

public sealed class SetActiveResumeCommandHandler : IRequestHandler<SetActiveResumeCommand, Result>
{
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _dt;

    public SetActiveResumeCommandHandler(IAppDbContext db, IDateTimeProvider dt)
    {
        _db = db;
        _dt = dt;
    }

    public async Task<Result> Handle(SetActiveResumeCommand request, CancellationToken ct)
    {
        var now = _dt.UtcNow;

        var target = await _db.Resumes
            .FirstOrDefaultAsync(r => r.Id == request.ResumeId && !r.IsDeleted, ct);

        if (target is null)
            return Error.NotFound("Resume.NotFound", "Không tìm thấy CV.");

        if (target.UserId != request.UserId)
            return Error.Forbidden("Resume.Forbidden", "Bạn không có quyền truy cập CV này.");

        // Deactivate all others
        var others = await _db.Resumes
            .Where(r => r.UserId == request.UserId && r.IsActive && r.Id != request.ResumeId && !r.IsDeleted)
            .ToListAsync(ct);

        foreach (var old in others)
        {
            old.IsActive  = false;
            old.UpdatedAt = now;
        }

        target.IsActive  = true;
        target.UpdatedAt = now;

        await _db.SaveChangesAsync(ct);
        return Result.Success();
    }
}
