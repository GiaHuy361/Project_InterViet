using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Matching.Queries.GetMyMatches;
using Interviet.Contracts.Matching;
using Interviet.Shared.Results;

namespace Interviet.Application.Matching.Queries.GetMatchById;

public sealed record GetMatchByIdQuery(Guid SessionId, Guid UserId)
    : IRequest<Result<MatchSessionResponse>>;

public sealed class GetMatchByIdQueryHandler
    : IRequestHandler<GetMatchByIdQuery, Result<MatchSessionResponse>>
{
    private readonly IAppDbContext _db;

    public GetMatchByIdQueryHandler(IAppDbContext db) => _db = db;

    public async Task<Result<MatchSessionResponse>> Handle(
        GetMatchByIdQuery request, CancellationToken ct)
    {
        var session = await _db.MatchSessions
            .Include(s => s.Targets)
                .ThenInclude(t => t.Result)
            .FirstOrDefaultAsync(s => s.Id == request.SessionId, ct);

        if (session is null)
            return Error.NotFound("Match.NotFound", "Không tìm thấy phiên matching.");

        if (session.UserId != request.UserId)
            return Error.Forbidden("Match.Forbidden", "Bạn không có quyền xem phiên matching này.");

        return Result<MatchSessionResponse>.Success(
            GetMyMatchesQueryHandler.MapToResponse(session));
    }
}
