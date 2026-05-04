using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Resumes;
using Interviet.Domain.Resumes;
using Interviet.Shared.Results;

namespace Interviet.Application.Resumes.Commands.ReprocessResume;

public sealed record ReprocessResumeCommand(Guid ResumeId, Guid UserId) : IRequest<Result<ReprocessResumeResponse>>;

public sealed class ReprocessResumeCommandHandler : IRequestHandler<ReprocessResumeCommand, Result<ReprocessResumeResponse>>
{
    private readonly IAppDbContext _db;
    private readonly IAiResumeParserClient _parser;
    private readonly IDateTimeProvider _dt;
    private readonly IStorageService _storage;
    private readonly Microsoft.Extensions.Options.IOptions<Common.Options.StorageOptions> _storageOpts;
    private readonly ILogger<ReprocessResumeCommandHandler> _logger;

    public ReprocessResumeCommandHandler(
        IAppDbContext db,
        IAiResumeParserClient parser,
        IDateTimeProvider dt,
        IStorageService storage,
        Microsoft.Extensions.Options.IOptions<Common.Options.StorageOptions> storageOpts,
        ILogger<ReprocessResumeCommandHandler> logger)
    {
        _db         = db;
        _parser     = parser;
        _dt         = dt;
        _storage    = storage;
        _storageOpts = storageOpts;
        _logger     = logger;
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

        // Fire async parse — do not await
        _ = CallParserAsync(parseJob.Id, version.Id, resume.Id, request.UserId,
            correlationId, requestId,
            uploadedFile.OriginalFileName, uploadedFile.MimeType,
            Path.Combine(_storageOpts.Value.BasePath, uploadedFile.StoragePath));

        return Result<ReprocessResumeResponse>.Success(new ReprocessResumeResponse
        {
            JobId       = parseJob.Id,
            ResumeId    = resume.Id,
            Status      = parseJob.Status,
            RequestedAt = parseJob.RequestedAt
        });
    }

    private async Task CallParserAsync(
        Guid jobId, Guid versionId, Guid resumeId, Guid userId,
        string correlationId, string requestId,
        string originalFileName, string contentType, string filePath)
    {
        try
        {
            var now = _dt.UtcNow;
            var result = await _parser.ParseResumeAsync(new AiParseResumeRequest
            {
                ResumeId        = resumeId,
                ResumeVersionId = versionId,
                UserId          = userId,
                CorrelationId   = correlationId,
                RequestId       = requestId,
                OriginalFileName = originalFileName,
                ContentType     = contentType,
                FilePath        = filePath
            });

            var job     = await _db.ResumeParseJobs.FindAsync(jobId);
            var version = await _db.ResumeVersions.FindAsync(versionId);
            var resume  = await _db.Resumes.FindAsync(resumeId);
            if (job is null || version is null || resume is null) return;

            job.CompletedAt = now;
            job.UpdatedAt   = now;

            if (result.IsSuccess)
            {
                job.Status        = ResumeParseJobStatus.Succeeded;
                job.ModelVersion  = result.ModelVersion;
                job.SchemaVersion = result.SchemaVersion;
                version.ParseStatus     = ResumeParseStatus.Parsed;
                version.LastProcessedAt = now;
                resume.UpdatedAt        = now;

                // Upsert parsed data
                var existing = await _db.ResumeParsedData
                    .FirstOrDefaultAsync(p => p.ResumeId == resumeId);

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
                    _db.ResumeParsedData.Add(new Domain.Resumes.ResumeParsedData
                    {
                        Id              = Guid.NewGuid(),
                        ResumeId        = resumeId,
                        ResumeVersionId = versionId,
                        UserId          = userId,
                        RawText         = result.RawText,
                        DetectedLanguage = result.DetectedLanguage,
                        SectionsJson    = result.SectionsJson,
                        SkillsJson      = result.SkillsJson,
                        ExperiencesJson = result.ExperiencesJson,
                        EducationsJson  = result.EducationsJson,
                        ProjectsJson    = result.ProjectsJson,
                        CertificationsJson = result.CertificationsJson,
                        LanguagesJson   = result.LanguagesJson,
                        WarningsJson    = result.WarningsJson,
                        ModelVersion    = result.ModelVersion,
                        SchemaVersion   = result.SchemaVersion,
                        CreatedAt       = now,
                        UpdatedAt       = now
                    });
                }
            }
            else
            {
                job.Status          = result.IsServiceUnavailable ? ResumeParseJobStatus.ServiceUnavailable : ResumeParseJobStatus.Failed;
                job.ErrorCode       = result.ErrorCode;
                job.ErrorMessage    = result.ErrorMessage;
                version.ParseStatus = result.IsServiceUnavailable ? ResumeParseStatus.ServiceUnavailable : ResumeParseStatus.Failed;
                version.ProcessingError = result.ErrorMessage;
                resume.UpdatedAt    = now;
            }

            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error reprocessing ResumeId={ResumeId}", resumeId);
        }
    }
}
