using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.JobDescriptions.Commands.CreateJobDescription;
using Interviet.Contracts.Matching;
using Interviet.Shared.Results;

namespace Interviet.Application.JobDescriptions.Queries.GetJobDescriptionById;

public sealed record GetJobDescriptionByIdQuery(Guid JobDescriptionId, Guid UserId)
    : IRequest<Result<JobDescriptionResponse>>;

public sealed class GetJobDescriptionByIdQueryHandler
    : IRequestHandler<GetJobDescriptionByIdQuery, Result<JobDescriptionResponse>>
{
    private readonly IAppDbContext _db;

    public GetJobDescriptionByIdQueryHandler(IAppDbContext db) => _db = db;

    public async Task<Result<JobDescriptionResponse>> Handle(
        GetJobDescriptionByIdQuery request, CancellationToken ct)
    {
        var jd = await _db.JobDescriptions
            .FirstOrDefaultAsync(j => j.Id == request.JobDescriptionId && !j.IsDeleted, ct);

        if (jd is null)
            return Error.NotFound("JobDescription.NotFound", "Không tìm thấy mô tả công việc.");

        if (jd.UserId != request.UserId)
            return Error.Forbidden("JobDescription.Forbidden", "Bạn không có quyền xem mô tả công việc này.");

        return Result<JobDescriptionResponse>.Success(
            CreateJobDescriptionCommandHandler.MapToResponse(jd));
    }
}
