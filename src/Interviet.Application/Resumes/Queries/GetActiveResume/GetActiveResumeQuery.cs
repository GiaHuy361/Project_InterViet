using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Resumes;
using Interviet.Shared.Results;

namespace Interviet.Application.Resumes.Queries.GetActiveResume;

public sealed record GetActiveResumeQuery(Guid UserId) : IRequest<Result<ResumeResponse>>;

public sealed class GetActiveResumeQueryHandler : IRequestHandler<GetActiveResumeQuery, Result<ResumeResponse>>
{
    private readonly IAppDbContext _db;

    public GetActiveResumeQueryHandler(IAppDbContext db) => _db = db;

    public async Task<Result<ResumeResponse>> Handle(GetActiveResumeQuery request, CancellationToken ct)
    {
        var resume = await _db.Resumes
            .Include(r => r.ActiveVersion)
                .ThenInclude(v => v!.UploadedFile)
            .FirstOrDefaultAsync(r => r.UserId == request.UserId && r.IsActive && !r.IsDeleted, ct);

        if (resume is null)
            return Error.NotFound("Resume.NoActiveResume", "Bạn chưa có CV active. Hãy upload CV trước.");

        var v = resume.ActiveVersion;
        var f = v?.UploadedFile;

        return Result<ResumeResponse>.Success(new ResumeResponse
        {
            ResumeId        = resume.Id,
            Title           = resume.Title,
            IsActive        = resume.IsActive,
            VersionNumber   = resume.VersionNumber,
            LatestVersionId = v?.Id,
            OriginalFileName = f?.OriginalFileName,
            FileExtension   = f?.FileExtension,
            ContentType     = f?.MimeType,
            FileSizeBytes   = f?.FileSizeBytes,
            StoragePath     = f?.StoragePath,
            ParseStatus     = v?.ParseStatus ?? "unknown",
            ProcessingError = v?.ProcessingError,
            LastProcessedAt = v?.LastProcessedAt,
            CreatedAt       = resume.CreatedAt,
            UpdatedAt       = resume.UpdatedAt
        });
    }
}
