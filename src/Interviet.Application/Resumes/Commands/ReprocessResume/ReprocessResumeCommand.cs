using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Resumes;
using Interviet.Domain.Resumes;
using Interviet.Shared.Results;

namespace Interviet.Application.Resumes.Commands.ReprocessResume;

public sealed record ReprocessResumeCommand(Guid ResumeId, Guid UserId) : IRequest<Result<ReprocessResumeResponse>>;

public sealed class ReprocessResumeCommandHandler : IRequestHandler<ReprocessResumeCommand, Result<ReprocessResumeResponse>>
{
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _dt;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly Microsoft.Extensions.Options.IOptions<Common.Options.StorageOptions> _storageOpts;
    private readonly ILogger<ReprocessResumeCommandHandler> _logger;

    public ReprocessResumeCommandHandler(
        IAppDbContext db,
        IDateTimeProvider dt,
        IServiceScopeFactory scopeFactory,
        Microsoft.Extensions.Options.IOptions<Common.Options.StorageOptions> storageOpts,
        ILogger<ReprocessResumeCommandHandler> logger)
    {
        _db          = db;
        _dt          = dt;
        _scopeFactory = scopeFactory;
        _storageOpts = storageOpts;
        _logger      = logger;
    }

    public async Task<Result<ReprocessResumeResponse>> Handle(ReprocessResumeCommand request, CancellationToken ct)
    {
        var now = _dt.UtcNow;

        var resume = await _db.Resumes
            .Include(r => r.ActiveVersion)
                .ThenInclude(v => v!.UploadedFile)
            .FirstOrDefaultAsync(r => r.Id == request.ResumeId && !r.IsDeleted, ct);

        if (resume is null)
            return Error.NotFound("Resume.NotFound", "Không tìm thấy CV.");

        if (resume.UserId != request.UserId)
            return Error.Forbidden("Resume.Forbidden", "Bạn không có quyền truy cập CV này.");

        var version = resume.ActiveVersion;
        if (version is null)
            return Error.Validation("Resume.NoVersion", "CV chưa có phiên bản nào để xử lý.");

        var uploadedFile = version.UploadedFile;

        // Update version to queued
        version.ParseStatus   = ResumeParseStatus.Queued;
        version.ProcessingError = null;
        resume.UpdatedAt      = now;

        // Create new parse job
        var correlationId = Guid.NewGuid().ToString("N");
        var requestId     = Guid.NewGuid().ToString("N");
        var parseJob = new ResumeParseJob
        {
            Id              = Guid.NewGuid(),
            ResumeVersionId = version.Id,
            ResumeId        = resume.Id,
            UserId          = request.UserId,
            Status          = ResumeParseJobStatus.Queued,
            Provider        = "python",
            CorrelationId   = correlationId,
            RequestId       = requestId,
            RequestedAt     = now,
            RetryCount      = await _db.ResumeParseJobs
                .CountAsync(j => j.ResumeVersionId == version.Id, ct),
            CreatedAt       = now,
            UpdatedAt       = now
        };
        _db.ResumeParseJobs.Add(parseJob);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Reprocess job created. ResumeId={ResumeId} JobId={JobId}", resume.Id, parseJob.Id);

        // Fire async parse — do not await; use new scope to avoid ObjectDisposedException
        var capturedScopeFactory = _scopeFactory;
        var capturedLogger       = _logger;
        var capturedStorageOpts  = _storageOpts.Value;
        var capturedFilePath     = Path.IsPathRooted(capturedStorageOpts.BasePath)
            ? Path.Combine(capturedStorageOpts.BasePath, uploadedFile.StoragePath)
            : Path.Combine(Directory.GetCurrentDirectory(), capturedStorageOpts.BasePath, uploadedFile.StoragePath);
        var capturedFileName     = uploadedFile.OriginalFileName;
        var capturedMimeType     = uploadedFile.MimeType;
        var capturedJobId        = parseJob.Id;
        var capturedVersionId    = version.Id;
        var capturedResumeId     = resume.Id;
        var capturedUserId       = request.UserId;
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = capturedScopeFactory.CreateScope();
                var sp          = scope.ServiceProvider;
                var db          = sp.GetRequiredService<IAppDbContext>();
                var parser      = sp.GetRequiredService<IAiResumeParserClient>();
                var dt          = sp.GetRequiredService<IDateTimeProvider>();

                var result = await parser.ParseResumeAsync(new AiParseResumeRequest
                {
                    ResumeId         = capturedResumeId,
                    ResumeVersionId  = capturedVersionId,
                    UserId           = capturedUserId,
                    CorrelationId    = correlationId,
                    RequestId        = requestId,
                    OriginalFileName = capturedFileName,
                    ContentType      = capturedMimeType,
                    FilePath         = capturedFilePath
                });

                var now     = dt.UtcNow;
                var job     = await db.ResumeParseJobs.FindAsync(capturedJobId);
                var ver     = await db.ResumeVersions.FindAsync(capturedVersionId);
                var res     = await db.Resumes.FindAsync(capturedResumeId);
                if (job is null || ver is null || res is null) return;

                job.CompletedAt = now;
                job.UpdatedAt   = now;

                if (result.IsSuccess)
                {
                    job.Status            = ResumeParseJobStatus.Succeeded;
                    job.ModelVersion      = result.ModelVersion;
                    job.SchemaVersion     = result.SchemaVersion;
                    ver.ParseStatus       = ResumeParseStatus.Parsed;
                    ver.LastProcessedAt   = now;
                    ver.ProcessingError   = null;
                    res.UpdatedAt         = now;

                    // Upsert parsed data
                    var existing = await db.ResumeParsedData
                        .FirstOrDefaultAsync(p => p.ResumeId == capturedResumeId);

                    if (existing is not null)
                    {
                        existing.RawText            = result.RawText;
                        existing.DetectedLanguage   = result.DetectedLanguage;
                        existing.SectionsJson       = result.SectionsJson;
                        existing.SkillsJson         = result.SkillsJson;
                        existing.ExperiencesJson    = result.ExperiencesJson;
                        existing.EducationsJson     = result.EducationsJson;
                        existing.ProjectsJson       = result.ProjectsJson;
                        existing.CertificationsJson = result.CertificationsJson;
                        existing.LanguagesJson      = result.LanguagesJson;
                        existing.WarningsJson       = result.WarningsJson;
                        existing.ModelVersion       = result.ModelVersion;
                        existing.SchemaVersion      = result.SchemaVersion;
                        existing.UpdatedAt          = now;
                    }
                    else
                    {
                        db.ResumeParsedData.Add(new Domain.Resumes.ResumeParsedData
                        {
                            Id                 = Guid.NewGuid(),
                            ResumeId           = capturedResumeId,
                            ResumeVersionId    = capturedVersionId,
                            UserId             = capturedUserId,
                            RawText            = result.RawText,
                            DetectedLanguage   = result.DetectedLanguage,
                            SectionsJson       = result.SectionsJson,
                            SkillsJson         = result.SkillsJson,
                            ExperiencesJson    = result.ExperiencesJson,
                            EducationsJson     = result.EducationsJson,
                            ProjectsJson       = result.ProjectsJson,
                            CertificationsJson = result.CertificationsJson,
                            LanguagesJson      = result.LanguagesJson,
                            WarningsJson       = result.WarningsJson,
                            ModelVersion       = result.ModelVersion,
                            SchemaVersion      = result.SchemaVersion,
                            CreatedAt          = now,
                            UpdatedAt          = now
                        });
                    }
                    capturedLogger.LogInformation("CV reprocessed successfully. ResumeId={ResumeId}", capturedResumeId);
                }
                else
                {
                    job.Status          = result.IsServiceUnavailable ? ResumeParseJobStatus.ServiceUnavailable : ResumeParseJobStatus.Failed;
                    job.ErrorCode       = result.ErrorCode;
                    job.ErrorMessage    = result.ErrorMessage;
                    ver.ParseStatus     = result.IsServiceUnavailable ? ResumeParseStatus.ServiceUnavailable : ResumeParseStatus.Failed;
                    ver.ProcessingError = result.ErrorMessage;
                    res.UpdatedAt       = now;
                    capturedLogger.LogWarning("CV reprocess failed. ResumeId={ResumeId} Code={Code}", capturedResumeId, result.ErrorCode);
                }

                await db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                capturedLogger.LogError(ex, "Unhandled error reprocessing ResumeId={ResumeId}", capturedResumeId);
            }
        });

        return Result<ReprocessResumeResponse>.Success(new ReprocessResumeResponse
        {
            JobId       = parseJob.Id,
            ResumeId    = resume.Id,
            Status      = parseJob.Status,
            RequestedAt = parseJob.RequestedAt
        });
    }
}
