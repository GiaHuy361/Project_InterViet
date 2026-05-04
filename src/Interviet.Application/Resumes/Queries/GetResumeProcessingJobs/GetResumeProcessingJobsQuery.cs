using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Resumes;
using Interviet.Shared.Results;

namespace Interviet.Application.Resumes.Queries.GetResumeProcessingJobs;

public sealed record GetResumeProcessingJobsQuery(Guid ResumeId, Guid UserId) : IRequest<Result<IReadOnlyList<ParseJobResponse>>>;

public sealed class GetResumeProcessingJobsQueryHandler
    : IRequestHandler<GetResumeProcessingJobsQuery, Result<IReadOnlyList<ParseJobResponse>>>
{
    private readonly IAppDbContext _db;

    public GetResumeProcessingJobsQueryHandler(IAppDbContext db) => _db = db;

    public async Task<Result<IReadOnlyList<ParseJobResponse>>> Handle(
        GetResumeProcessingJobsQuery request, CancellationToken ct)
    {
        var resume = await _db.Resumes
            .FirstOrDefaultAsync(r => r.Id == request.ResumeId && !r.IsDeleted, ct);

        if (resume is null)
            return Error.NotFound("Resume.NotFound", "Không tìm thấy CV.");

        if (resume.UserId != request.UserId)
            return Error.Forbidden("Resume.Forbidden", "Bạn không có quyền truy cập CV này.");

        var jobs = await _db.ResumeParseJobs
            .Where(j => j.ResumeId == request.ResumeId)
            .OrderByDescending(j => j.RequestedAt)
            .Select(j => new ParseJobResponse
            {
                JobId         = j.Id,
                ResumeId      = j.ResumeId,
                Status        = j.Status,
                Provider      = j.Provider,
                CorrelationId = j.CorrelationId,
                ErrorCode     = j.ErrorCode,
                ErrorMessage  = j.ErrorMessage,
                RetryCount    = j.RetryCount,
                ModelVersion  = j.ModelVersion,
                RequestedAt   = j.RequestedAt,
                StartedAt     = j.StartedAt,
                CompletedAt   = j.CompletedAt
            })
            .ToListAsync(ct);

        return Result<IReadOnlyList<ParseJobResponse>>.Success((IReadOnlyList<ParseJobResponse>)jobs);
    }
}
