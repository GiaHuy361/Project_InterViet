using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Shared.Results;

namespace Interviet.Application.Resumes.Commands.DeleteResume;

public sealed record DeleteResumeCommand(Guid ResumeId, Guid UserId) : IRequest<Result>;

public sealed class DeleteResumeCommandHandler : IRequestHandler<DeleteResumeCommand, Result>
{
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _dt;
    private readonly IQuotaService _quotaService;

    public DeleteResumeCommandHandler(IAppDbContext db, IDateTimeProvider dt, IQuotaService quotaService)
    {
        _db = db;
        _dt = dt;
        _quotaService = quotaService;
    }

    public async Task<Result> Handle(DeleteResumeCommand request, CancellationToken ct)
    {
        var now = _dt.UtcNow;

        var resume = await _db.Resumes
            .FirstOrDefaultAsync(r => r.Id == request.ResumeId && !r.IsDeleted, ct);

        if (resume is null)
            return Error.NotFound("Resume.NotFound", "Không tìm thấy CV.");

        if (resume.UserId != request.UserId)
            return Error.Forbidden("Resume.Forbidden", "Bạn không có quyền truy cập CV này.");

        // Soft delete — do NOT auto-activate another resume to avoid unpredictable behavior
        resume.IsDeleted  = true;
        resume.DeletedAt  = now;
        resume.IsActive   = false;
        resume.UpdatedAt  = now;

        await _db.SaveChangesAsync(ct);

        // Hoàn trả quota cv.storage — slot lưu trữ phải được giải phóng khi xóa CV
        // (khác với cv.optimization là tiêu hao vĩnh viễn, không hoàn lại)
        await _quotaService.RefundAsync(
            userId        : request.UserId,
            featureKey    : QuotaFeatureKeys.CvStorage,
            amount        : 1,
            referenceType : "Resume",
            referenceId   : request.ResumeId,
            reason        : "CV deleted by user — storage slot released",
            ct            : ct);

        return Result.Success();
    }
}
