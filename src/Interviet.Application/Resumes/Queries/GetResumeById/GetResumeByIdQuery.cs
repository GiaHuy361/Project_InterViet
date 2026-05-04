using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Resumes;
using Interviet.Shared.Results;

namespace Interviet.Application.Resumes.Queries.GetResumeById;

public sealed record GetResumeByIdQuery(Guid ResumeId, Guid UserId) : IRequest<Result<ResumeDetailResponse>>;

public sealed class GetResumeByIdQueryHandler : IRequestHandler<GetResumeByIdQuery, Result<ResumeDetailResponse>>
{
    private readonly IAppDbContext _db;

    public GetResumeByIdQueryHandler(IAppDbContext db) => _db = db;

    public async Task<Result<ResumeDetailResponse>> Handle(GetResumeByIdQuery request, CancellationToken ct)
    {
        var resume = await _db.Resumes
            .Include(r => r.ActiveVersion)
                .ThenInclude(v => v!.UploadedFile)
            .FirstOrDefaultAsync(r => r.Id == request.ResumeId && !r.IsDeleted, ct);

        if (resume is null)
            return Error.NotFound("Resume.NotFound", "Không tìm thấy CV.");

        if (resume.UserId != request.UserId)
            return Error.Forbidden("Resume.Forbidden", "Bạn không có quyền truy cập CV này.");

        var version = resume.ActiveVersion;
        var file    = version?.UploadedFile;

        // Latest parse job
        ParseJobResponse? latestJob = null;
        if (version is not null)
        {
            var job = await _db.ResumeParseJobs
                .Where(j => j.ResumeVersionId == version.Id)
                .OrderByDescending(j => j.RequestedAt)
                .FirstOrDefaultAsync(ct);

            if (job is not null)
                latestJob = new ParseJobResponse
                {
                    JobId         = job.Id,
                    ResumeId      = job.ResumeId,
                    Status        = job.Status,
                    Provider      = job.Provider,
                    CorrelationId = job.CorrelationId,
                    ErrorCode     = job.ErrorCode,
                    ErrorMessage  = job.ErrorMessage,
                    RetryCount    = job.RetryCount,
                    ModelVersion  = job.ModelVersion,
                    RequestedAt   = job.RequestedAt,
                    StartedAt     = job.StartedAt,
                    CompletedAt   = job.CompletedAt
                };
        }

        // Parsed data
        ResumeParsedDataResponse? parsedData = null;
        var pd = await _db.ResumeParsedData
            .FirstOrDefaultAsync(p => p.ResumeId == resume.Id, ct);
        if (pd is not null)
            parsedData = new ResumeParsedDataResponse
            {
                Id               = pd.Id,
                DetectedLanguage = pd.DetectedLanguage,
                RawText          = pd.RawText,
                SectionsJson     = pd.SectionsJson,
                SkillsJson       = pd.SkillsJson,
                ExperiencesJson  = pd.ExperiencesJson,
                EducationsJson   = pd.EducationsJson,
                ProjectsJson     = pd.ProjectsJson,
                CertificationsJson = pd.CertificationsJson,
                LanguagesJson    = pd.LanguagesJson,
                WarningsJson     = pd.WarningsJson,
                ModelVersion     = pd.ModelVersion,
                SchemaVersion    = pd.SchemaVersion,
                CreatedAt        = pd.CreatedAt
            };

        return Result<ResumeDetailResponse>.Success(new ResumeDetailResponse
        {
            ResumeId        = resume.Id,
            Title           = resume.Title,
            IsActive        = resume.IsActive,
            VersionNumber   = resume.VersionNumber,
            LatestVersionId = version?.Id,
            OriginalFileName = file?.OriginalFileName,
            FileExtension   = file?.FileExtension,
            ContentType     = file?.MimeType,
            FileSizeBytes   = file?.FileSizeBytes,
            ParseStatus     = version?.ParseStatus ?? "unknown",
            ProcessingError = version?.ProcessingError,
            LastProcessedAt = version?.LastProcessedAt,
            LatestParseJob  = latestJob,
            ParsedData      = parsedData,
            CreatedAt       = resume.CreatedAt,
            UpdatedAt       = resume.UpdatedAt
        });
    }
}
