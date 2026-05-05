using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.JobDescriptions.Commands.CreateJobDescription;
using Interviet.Contracts.Matching;
using Interviet.Shared.Results;

namespace Interviet.Application.JobDescriptions.Queries.GetMyJobDescriptions;

public sealed record GetMyJobDescriptionsQuery(
    Guid UserId,
    int Page = 1,
    int PageSize = 10
) : IRequest<Result<GetMyJobDescriptionsResult>>;

public sealed class GetMyJobDescriptionsQueryHandler
    : IRequestHandler<GetMyJobDescriptionsQuery, Result<GetMyJobDescriptionsResult>>
{
    private readonly IAppDbContext _db;

    public GetMyJobDescriptionsQueryHandler(IAppDbContext db) => _db = db;

    public async Task<Result<GetMyJobDescriptionsResult>> Handle(
        GetMyJobDescriptionsQuery request, CancellationToken ct)
    {
        var page     = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 50);

        var query = _db.JobDescriptions
            .Where(j => j.UserId == request.UserId && !j.IsDeleted)
            .OrderByDescending(j => j.CreatedAt);

        var total = await query.CountAsync(ct);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var responses = items
            .Select(CreateJobDescriptionCommandHandler.MapToResponse)
            .ToList();

        return Result<GetMyJobDescriptionsResult>.Success(
            new GetMyJobDescriptionsResult(responses, total, page, pageSize));
    }
}
