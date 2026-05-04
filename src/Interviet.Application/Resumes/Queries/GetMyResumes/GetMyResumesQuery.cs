using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Resumes;
using Interviet.Shared.Results;

namespace Interviet.Application.Resumes.Queries.GetMyResumes;

public sealed record GetMyResumesQuery(
    Guid UserId,
    int Page = 1,
    int PageSize = 10,
    string? Status = null,
    bool? IsActive = null
) : IRequest<Result<GetMyResumesResult>>;

public sealed record GetMyResumesResult(
    IReadOnlyList<ResumeResponse> Items,
    int TotalCount,
    int Page,
    int PageSize
);

public sealed class GetMyResumesQueryHandler : IRequestHandler<GetMyResumesQuery, Result<GetMyResumesResult>>
{
    private readonly IAppDbContext _db;

    public GetMyResumesQueryHandler(IAppDbContext db) => _db = db;

    public async Task<Result<GetMyResumesResult>> Handle(GetMyResumesQuery request, CancellationToken ct)
    {
        var page     = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 50);

        var query = _db.Resumes
            .Include(r => r.ActiveVersion)
                .ThenInclude(v => v!.UploadedFile)
            .Where(r => r.UserId == request.UserId && !r.IsDeleted)
            .AsQueryable();

        if (request.IsActive.HasValue)
            query = query.Where(r => r.IsActive == request.IsActive.Value);

        if (!string.IsNullOrWhiteSpace(request.Status))
            query = query.Where(r => r.ActiveVersion != null && r.ActiveVersion.ParseStatus == request.Status);

        var total = await query.CountAsync(ct);

        var resumes = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var items = resumes.Select(r =>
        {
            var v = r.ActiveVersion;
            var f = v?.UploadedFile;
            return new ResumeResponse
            {
                ResumeId        = r.Id,
                Title           = r.Title,
                IsActive        = r.IsActive,
                VersionNumber   = r.VersionNumber,
                LatestVersionId = v?.Id,
                OriginalFileName = f?.OriginalFileName,
                FileExtension   = f?.FileExtension,
                ContentType     = f?.MimeType,
                FileSizeBytes   = f?.FileSizeBytes,
                StoragePath     = f?.StoragePath,
                ParseStatus     = v?.ParseStatus ?? "unknown",
                ProcessingError = v?.ProcessingError,
                LastProcessedAt = v?.LastProcessedAt,
                CreatedAt       = r.CreatedAt,
                UpdatedAt       = r.UpdatedAt
            };
        }).ToList();

        return Result<GetMyResumesResult>.Success(new GetMyResumesResult(items, total, page, pageSize));
    }
}
