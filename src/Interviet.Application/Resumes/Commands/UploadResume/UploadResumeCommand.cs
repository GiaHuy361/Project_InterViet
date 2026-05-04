using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Common.Options;
using Interviet.Contracts.Resumes;
using Interviet.Domain.Resumes;
using Interviet.Shared.Results;
using Microsoft.Extensions.Options;

namespace Interviet.Application.Resumes.Commands.UploadResume;

// ── Allowed types ─────────────────────────────────────────────────────────────
file static class AllowedResume
{
    public static readonly HashSet<string> Extensions   = [".pdf", ".doc", ".docx"];
    public static readonly HashSet<string> ContentTypes =
    [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
}

// ── Command ───────────────────────────────────────────────────────────────────
/// <summary>
/// Uses raw primitives (Stream, string) instead of IFormFile to keep
/// Application layer free of Microsoft.AspNetCore.Http references.
/// </summary>
public sealed record UploadResumeCommand(
    Stream FileStream,
    string OriginalFileName,
    string ContentType,
    long FileSizeBytes,
    string? Title,
    Guid UserId
) : IRequest<Result<ResumeResponse>>;

// ── Validator ─────────────────────────────────────────────────────────────────
public sealed class UploadResumeCommandValidator : AbstractValidator<UploadResumeCommand>
{
    public UploadResumeCommandValidator(IOptions<StorageOptions> opts)
    {
        var maxBytes = (long)(opts.Value.MaxResumeFileSizeMb * 1024L * 1024L);

        RuleFor(x => x.OriginalFileName)
            .NotEmpty().WithMessage("File không được để trống.");

        RuleFor(x => x.FileSizeBytes)
            .GreaterThan(0).WithMessage("File không được rỗng.")
            .LessThanOrEqualTo(maxBytes)
            .WithMessage($"File quá lớn. Kích thước tối đa là {opts.Value.MaxResumeFileSizeMb}MB.");

        RuleFor(x => x.OriginalFileName)
            .Must(n => AllowedResume.Extensions.Contains(Path.GetExtension(n).ToLowerInvariant()))
            .WithMessage("Định dạng file không được hỗ trợ. Chỉ chấp nhận PDF, DOC, DOCX.");

        RuleFor(x => x.ContentType)
            .Must(c => AllowedResume.ContentTypes.Contains(c.ToLowerInvariant()))
            .WithMessage("Content-type của file không hợp lệ.");
    }
}

// ── Handler ───────────────────────────────────────────────────────────────────
public sealed class UploadResumeCommandHandler : IRequestHandler<UploadResumeCommand, Result<ResumeResponse>>
{
    private readonly IAppDbContext _db;
    private readonly IStorageService _storage;
    private readonly IAiResumeParserClient _parser;
    private readonly StorageOptions _storageOpts;
    private readonly IDateTimeProvider _dt;
    private readonly ILogger<UploadResumeCommandHandler> _logger;

    public UploadResumeCommandHandler(
        IAppDbContext db,
        IStorageService storage,
        IAiResumeParserClient parser,
        IOptions<StorageOptions> storageOpts,
        IDateTimeProvider dt,
        ILogger<UploadResumeCommandHandler> logger)
    {
        _db          = db;
        _storage     = storage;
        _parser      = parser;
        _storageOpts = storageOpts.Value;
        _dt          = dt;
        _logger      = logger;
    }

    public async Task<Result<ResumeResponse>> Handle(UploadResumeCommand request, CancellationToken ct)
    {
        var now    = _dt.UtcNow;
        var userId = request.UserId;

        // ── Sanitize filename ──────────────────────────────────────────────
        var originalName = Path.GetFileName(request.OriginalFileName); // strip traversal
        var ext          = Path.GetExtension(originalName).ToLowerInvariant();
        var storedName   = $"{Guid.NewGuid():N}{ext}";

        // ── Next version number for this user ──────────────────────────────
        var lastVersion = await _db.Resumes
            .Where(r => r.UserId == userId && !r.IsDeleted)
            .MaxAsync(r => (int?)r.VersionNumber, ct) ?? 0;
        var nextVersion = lastVersion + 1;

        // ── Storage key: resumes/{userId}/{resumeId}/{storedName} ──────────
        var resumeId   = Guid.NewGuid();
        var storageKey = $"resumes/{userId}/{resumeId}/{storedName}";

        // ── Save file to storage BEFORE any DB writes ──────────────────────
        await _storage.UploadAsync(request.FileStream, storageKey, request.ContentType, ct);

        // ──────────────────────────────────────────────────────────────────────
        // Pass 1: INSERT Resume with ActiveVersionId = null
        //         Breaks the EF circular dependency:
        //         Resume [Added] ← FK(ActiveVersionId) ← ResumeVersion [Added] ← FK(ResumeId) ← Resume
        // ──────────────────────────────────────────────────────────────────────
        var title = string.IsNullOrWhiteSpace(request.Title) ? originalName : request.Title.Trim();

        var resume = new Resume
        {
            Id              = resumeId,
            UserId          = userId,
            Title           = title,
            VersionNumber   = nextVersion,
            IsActive        = false,     // activated in Pass 3
            ActiveVersionId = null,      // linked in Pass 3
            CreatedAt       = now,
            UpdatedAt       = now
        };
        _db.Resumes.Add(resume);
        await _db.SaveChangesAsync(ct); // Pass 1 — Resume row committed, no FK cycle

        // ──────────────────────────────────────────────────────────────────────
        // Pass 2: INSERT UploadedFile, ResumeVersion, ResumeParseJob
        //         Resume.Id exists → no circular dependency
        // ──────────────────────────────────────────────────────────────────────
        var uploadedFile = new UploadedFile
        {
            Id               = Guid.NewGuid(),
            UserId           = userId,
            FileCategory     = "resume",
            OriginalFileName = originalName,
            StoredFileName   = storedName,
            StorageProvider  = _storageOpts.Provider,
            StoragePath      = storageKey,
            MimeType         = request.ContentType,
            FileExtension    = ext,
            FileSizeBytes    = request.FileSizeBytes,
            CreatedAt        = now
        };
        _db.UploadedFiles.Add(uploadedFile);

        var versionId = Guid.NewGuid();
        var resumeVersion = new ResumeVersion
        {
            Id             = versionId,
            ResumeId       = resumeId,
            UploadedFileId = uploadedFile.Id,
            VersionNumber  = 1,
            ParseStatus    = ResumeParseStatus.Queued,
            Source         = ResumeSource.Upload,
            ContentType    = request.ContentType,
            CreatedAt      = now
        };
        _db.ResumeVersions.Add(resumeVersion);

        var correlationId = Guid.NewGuid().ToString("N");
        var requestId     = Guid.NewGuid().ToString("N");
        var parseJob = new ResumeParseJob
        {
            Id              = Guid.NewGuid(),
            ResumeVersionId = versionId,
            ResumeId        = resumeId,
            UserId          = userId,
            Status          = ResumeParseJobStatus.Queued,
            Provider        = "python",
            CorrelationId   = correlationId,
            RequestId       = requestId,
            RequestedAt     = now,
            CreatedAt       = now,
            UpdatedAt       = now
        };
        _db.ResumeParseJobs.Add(parseJob);
        await _db.SaveChangesAsync(ct); // Pass 2 — Version + File + Job committed

        // ──────────────────────────────────────────────────────────────────────
        // Pass 3: Set ActiveVersionId + IsActive; deactivate previous resumes
        // ──────────────────────────────────────────────────────────────────────
        var existingActive = await _db.Resumes
            .Where(r => r.UserId == userId && r.IsActive && r.Id != resumeId && !r.IsDeleted)
            .ToListAsync(ct);
        foreach (var old in existingActive)
        {
            old.IsActive  = false;
            old.UpdatedAt = now;
        }

        resume.ActiveVersionId = versionId;
        resume.IsActive        = true;
        resume.UpdatedAt       = now;
        await _db.SaveChangesAsync(ct); // Pass 3 — ActiveVersionId linked, resume active

        _logger.LogInformation("Resume uploaded. ResumeId={ResumeId} UserId={UserId} File={File}",
            resumeId, userId, originalName);

        // ── Fire-and-forget: call Python CV Service ────────────────────────
        var filePath = Path.Combine(_storageOpts.BasePath, storageKey);
        _ = CallParserAsync(parseJob.Id, versionId, resumeId, userId,
            correlationId, requestId, originalName, request.ContentType, filePath);

        return Result<ResumeResponse>.Success(MapToResponse(resume, resumeVersion, uploadedFile));
    }

    private async Task CallParserAsync(
        Guid jobId, Guid versionId, Guid resumeId, Guid userId,
        string correlationId, string requestId,
        string originalFileName, string contentType, string filePath)
    {
        try
        {
            var result = await _parser.ParseResumeAsync(new AiParseResumeRequest
            {
                ResumeId         = resumeId,
                ResumeVersionId  = versionId,
                UserId           = userId,
                CorrelationId    = correlationId,
                RequestId        = requestId,
                OriginalFileName = originalFileName,
                ContentType      = contentType,
                FilePath         = filePath
            });
            await ApplyParseResultAsync(jobId, versionId, resumeId, userId, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in fire-and-forget parse for ResumeId={ResumeId}", resumeId);
        }
    }

    private async Task ApplyParseResultAsync(
        Guid jobId, Guid versionId, Guid resumeId, Guid userId,
        AiParseResumeResult result)
    {
        var now = _dt.UtcNow;

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
            job.ExternalJobId = result.ExternalJobId;

            version.ParseStatus     = ResumeParseStatus.Parsed;
            version.LastProcessedAt = now;
            resume.UpdatedAt        = now;

            _db.ResumeParsedData.Add(new ResumeParsedData
            {
                Id                 = Guid.NewGuid(),
                ResumeId           = resumeId,
                ResumeVersionId    = versionId,
                UserId             = userId,
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

            _logger.LogInformation("CV parsed successfully. ResumeId={ResumeId}", resumeId);
        }
        else if (result.IsServiceUnavailable)
        {
            job.Status              = ResumeParseJobStatus.ServiceUnavailable;
            job.ErrorCode           = result.ErrorCode;
            job.ErrorMessage        = result.ErrorMessage;
            version.ParseStatus     = ResumeParseStatus.ServiceUnavailable;
            version.ProcessingError = result.ErrorMessage;
            resume.UpdatedAt        = now;
            _logger.LogWarning("CV Service unavailable. ResumeId={ResumeId}", resumeId);
        }
        else
        {
            job.Status              = ResumeParseJobStatus.Failed;
            job.ErrorCode           = result.ErrorCode;
            job.ErrorMessage        = result.ErrorMessage;
            version.ParseStatus     = ResumeParseStatus.Failed;
            version.ProcessingError = result.ErrorMessage;
            resume.UpdatedAt        = now;
            _logger.LogWarning("CV parse failed. ResumeId={ResumeId} Code={Code}", resumeId, result.ErrorCode);
        }

        await _db.SaveChangesAsync();
    }

    private static ResumeResponse MapToResponse(Resume resume, ResumeVersion version, UploadedFile file) => new()
    {
        ResumeId         = resume.Id,
        Title            = resume.Title,
        IsActive         = resume.IsActive,
        VersionNumber    = resume.VersionNumber,
        LatestVersionId  = version.Id,
        OriginalFileName = file.OriginalFileName,
        FileExtension    = file.FileExtension,
        ContentType      = file.MimeType,
        FileSizeBytes    = file.FileSizeBytes,
        StoragePath      = file.StoragePath,
        ParseStatus      = version.ParseStatus,
        ProcessingError  = version.ProcessingError,
        LastProcessedAt  = version.LastProcessedAt,
        CreatedAt        = resume.CreatedAt,
        UpdatedAt        = resume.UpdatedAt
    };
}
