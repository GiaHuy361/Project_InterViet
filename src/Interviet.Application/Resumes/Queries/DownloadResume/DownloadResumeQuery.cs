using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Shared.Results;

namespace Interviet.Application.Resumes.Queries.DownloadResume;

public sealed record DownloadResumeQuery(Guid ResumeId, Guid UserId) : IRequest<Result<DownloadResumeResult>>;

public sealed record DownloadResumeResult(
    Stream FileStream,
    string ContentType,
    string FileName
);

public sealed class DownloadResumeQueryHandler : IRequestHandler<DownloadResumeQuery, Result<DownloadResumeResult>>
{
    private readonly IAppDbContext _db;
    private readonly IStorageService _storage;
    private readonly Microsoft.Extensions.Options.IOptions<Common.Options.StorageOptions> _storageOpts;

    public DownloadResumeQueryHandler(
        IAppDbContext db,
        IStorageService storage,
        Microsoft.Extensions.Options.IOptions<Common.Options.StorageOptions> storageOpts)
    {
        _db         = db;
        _storage    = storage;
        _storageOpts = storageOpts;
    }

    public async Task<Result<DownloadResumeResult>> Handle(DownloadResumeQuery request, CancellationToken ct)
    {
        var resume = await _db.Resumes
            .Include(r => r.ActiveVersion)
                .ThenInclude(v => v!.UploadedFile)
            .FirstOrDefaultAsync(r => r.Id == request.ResumeId && !r.IsDeleted, ct);

        if (resume is null)
            return Error.NotFound("Resume.NotFound", "Không tìm thấy CV.");

        if (resume.UserId != request.UserId)
            return Error.Forbidden("Resume.Forbidden", "Bạn không có quyền tải CV này.");

        var version = resume.ActiveVersion;
        if (version?.UploadedFile is null)
            return Error.NotFound("Resume.FileNotFound", "File CV không tồn tại.");

        var uploadedFile = version.UploadedFile;
        var filePath = Path.Combine(_storageOpts.Value.BasePath, uploadedFile.StoragePath);

        if (!File.Exists(filePath))
            return Error.NotFound("Resume.FileNotFound", "File CV không tìm thấy trên hệ thống.");

        var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return Result<DownloadResumeResult>.Success(
            new DownloadResumeResult(stream, uploadedFile.MimeType, uploadedFile.OriginalFileName));
    }
}
