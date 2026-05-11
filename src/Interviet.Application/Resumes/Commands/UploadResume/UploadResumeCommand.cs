using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
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
    public static readonly HashSet<string> Extensions =
    [
        // Documents
        ".pdf",
        ".docx",
        // Images (forwarded to Python CV Service for processing)
        ".jpg",
        ".jpeg",
        ".png"
    ];

    public static readonly HashSet<string> ContentTypes =
    [
        // Documents
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        // Images
        "image/jpeg",
        "image/png"
    ];

    public const string UnsupportedMessage =
        "Định dạng file không được hỗ trợ. Vui lòng tải lên file PDF, DOCX, JPG hoặc PNG.";
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
            .WithMessage(AllowedResume.UnsupportedMessage);

        RuleFor(x => x.ContentType)
            .Must(c => AllowedResume.ContentTypes.Contains(c.ToLowerInvariant()))
            .WithMessage(AllowedResume.UnsupportedMessage);
    }
}

// ── Handler ───────────────────────────────────────────────────────────────────
public sealed class UploadResumeCommandHandler : IRequestHandler<UploadResumeCommand, Result<ResumeResponse>>
{
    private readonly IAppDbContext _db;
    private readonly IStorageService _storage;
    private readonly StorageOptions _storageOpts;
    private readonly IDateTimeProvider _dt;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<UploadResumeCommandHandler> _logger;
    private readonly IQuotaService _quotaService;

    public UploadResumeCommandHandler(
        IAppDbContext db,
        IStorageService storage,
        IOptions<StorageOptions> storageOpts,
        IDateTimeProvider dt,
        IServiceScopeFactory scopeFactory,
        ILogger<UploadResumeCommandHandler> logger,
        IQuotaService quotaService)
    {
        _db           = db;
        _storage      = storage;
        _storageOpts  = storageOpts.Value;
        _dt           = dt;
        _scopeFactory = scopeFactory;
        _logger       = logger;
        _quotaService = quotaService;
    }

    public async Task<Result<ResumeResponse>> Handle(UploadResumeCommand request, CancellationToken ct)
    {
        var now    = _dt.UtcNow;
        var userId = request.UserId;

        // ── Quota Check ────────────────────────────────────────────────────────
        var uploadCheck = await _quotaService.CheckAsync(userId, QuotaFeatureKeys.CvStorage, 1, ct);
        if (!uploadCheck.IsSuccess) return uploadCheck.Error;

        var parseCheck = await _quotaService.CheckAsync(userId, QuotaFeatureKeys.CvOptimization, 1, ct);
        if (!parseCheck.IsSuccess) return parseCheck.Error;

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

        // ── Quota Consume ──────────────────────────────────────────────────────
        await _quotaService.ConsumeAsync(userId, QuotaFeatureKeys.CvStorage, 1, "Resume", resumeId, ct);
        await _quotaService.ConsumeAsync(userId, QuotaFeatureKeys.CvOptimization, 1, "Resume", resumeId, ct);

        // ── Activity + Usage (best-effort, never fails upload) ────────────
        try
        {
            using var hookScope   = _scopeFactory.CreateScope();
            var hookSp            = hookScope.ServiceProvider;
            var activityLogger    = hookSp.GetRequiredService<IActivityLogger>();
            var usageTracker      = hookSp.GetRequiredService<IUsageTracker>();
            await activityLogger.LogAsync(userId, ActivityActionKeys.ResumeUploaded,
                entityType: "Resume", entityId: resumeId,
                description: $"CV '{originalName}' đã được tải lên.");
            await usageTracker.TrackAsync(userId, QuotaFeatureKeys.ResumeUpload,
                referenceType: "Resume", referenceId: resumeId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to log/track resume_uploaded. ResumeId={ResumeId}", resumeId);
        }

        // ── Fire-and-forget: call Python CV Service ────────────────────────
        // Use absolute path if BasePath is absolute, else combine with CWD
        var basePath = Path.IsPathRooted(_storageOpts.BasePath)
            ? _storageOpts.BasePath
            : Path.Combine(Directory.GetCurrentDirectory(), _storageOpts.BasePath);
        var filePath = Path.Combine(basePath, storageKey);

        // Capture values — do NOT capture scoped services (_db, _parser) across the async boundary
        var capturedScopeFactory = _scopeFactory;
        var capturedLogger       = _logger;
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope  = capturedScopeFactory.CreateScope();
                var sp           = scope.ServiceProvider;
                var db           = sp.GetRequiredService<IAppDbContext>();
                var parser       = sp.GetRequiredService<IAiResumeParserClient>();
                var dt           = sp.GetRequiredService<IDateTimeProvider>();

                var result = await parser.ParseResumeAsync(new AiParseResumeRequest
                {
                    ResumeId         = resumeId,
                    ResumeVersionId  = versionId,
                    UserId           = userId,
                    CorrelationId    = correlationId,
                    RequestId        = requestId,
                    OriginalFileName = originalName,
                    ContentType      = request.ContentType,
                    FilePath         = filePath
                });

                await ApplyParseResultAsync(parseJob.Id, versionId, resumeId, userId, result, db, dt);
            }
            catch (Exception ex)
            {
                capturedLogger.LogError(ex, "Unhandled error in fire-and-forget parse for ResumeId={ResumeId}", resumeId);
            }
        });

        return Result<ResumeResponse>.Success(MapToResponse(resume, resumeVersion, uploadedFile));
    }

    private async Task ApplyParseResultAsync(
        Guid jobId, Guid versionId, Guid resumeId, Guid userId,
        AiParseResumeResult result,
        IAppDbContext db,
        IDateTimeProvider dt)
    {
        var now = dt.UtcNow;

        var job     = await db.ResumeParseJobs.FindAsync(jobId);
        var version = await db.ResumeVersions.FindAsync(versionId);
        var resume  = await db.Resumes.FindAsync(resumeId);
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

            db.ResumeParsedData.Add(new ResumeParsedData
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
                // Parse metadata (optional, Python Phase 4 update)
                ParseTextLength      = result.ParseTextLength,
                ParseWarningCount    = result.ParseWarningCount,
                ParseConfidenceScore = result.ParseConfidenceScore,
                ParseQuality         = result.ParseQuality,
                DetectedSectionsJson = result.DetectedSectionsJson,
                MissingSectionsJson  = result.MissingSectionsJson,
                CreatedAt          = now,
                UpdatedAt          = now
            });

            _logger.LogInformation("CV parsed successfully. ResumeId={ResumeId}", resumeId);

            // ── Activity + Usage hook (separate scope, non-critical) ────────────
            try
            {
                using var scope2  = _scopeFactory.CreateScope();
                var sp2           = scope2.ServiceProvider;
                var actLog2       = sp2.GetRequiredService<IActivityLogger>();
                var usageTracker2 = sp2.GetRequiredService<IUsageTracker>();
                await actLog2.LogAsync(userId, ActivityActionKeys.ResumeParseSucceeded,
                    entityType: "Resume", entityId: resumeId,
                    description: "CV đã được phân tích thành công.");
                await usageTracker2.TrackAsync(userId, QuotaFeatureKeys.ResumeParse,
                    referenceType: "Resume", referenceId: resumeId);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "activity/usage log failed post-parse-success"); }
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

            // ── Refund quota ───────────────────────────────────────────────────
            try
            {
                using var scopeRefund = _scopeFactory.CreateScope();
                var quotaService = scopeRefund.ServiceProvider.GetRequiredService<IQuotaService>();
                await quotaService.RefundAsync(userId, QuotaFeatureKeys.CvOptimization, 1, "Resume", resumeId, "CV Service unavailable", default);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "Failed to refund resume.parse quota"); }

            try
            {
                using var scope2  = _scopeFactory.CreateScope();
                var sp2           = scope2.ServiceProvider;
                var actLog2       = sp2.GetRequiredService<IActivityLogger>();
                var usageTracker2 = sp2.GetRequiredService<IUsageTracker>();
                await actLog2.LogAsync(userId, ActivityActionKeys.ResumeParseFailed,
                    entityType: "Resume", entityId: resumeId,
                    description: $"Phân tích CV thất bại: {result.ErrorCode}.");
                await usageTracker2.TrackAsync(userId, QuotaFeatureKeys.ResumeParse,
                    referenceType: "Resume", referenceId: resumeId);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "activity/usage log failed post-parse-unavailable"); }
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

            // ── Refund quota ───────────────────────────────────────────────────
            try
            {
                using var scopeRefund = _scopeFactory.CreateScope();
                var quotaService = scopeRefund.ServiceProvider.GetRequiredService<IQuotaService>();
                await quotaService.RefundAsync(userId, QuotaFeatureKeys.CvOptimization, 1, "Resume", resumeId, "Parse failed", default);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "Failed to refund resume.parse quota"); }

            try
            {
                using var scope2  = _scopeFactory.CreateScope();
                var sp2           = scope2.ServiceProvider;
                var actLog2       = sp2.GetRequiredService<IActivityLogger>();
                var usageTracker2 = sp2.GetRequiredService<IUsageTracker>();
                await actLog2.LogAsync(userId, ActivityActionKeys.ResumeParseFailed,
                    entityType: "Resume", entityId: resumeId,
                    description: $"Phân tích CV thất bại: {result.ErrorCode}.");
                await usageTracker2.TrackAsync(userId, QuotaFeatureKeys.ResumeParse,
                    referenceType: "Resume", referenceId: resumeId);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "activity/usage log failed post-parse-failed"); }
        }

        await db.SaveChangesAsync();
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
