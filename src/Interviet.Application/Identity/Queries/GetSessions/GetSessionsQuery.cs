using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Identity;
using Interviet.Shared.Results;

namespace Interviet.Application.Identity.Queries.GetSessions;

public sealed record GetSessionsQuery : IRequest<Result<IReadOnlyList<SessionDto>>>;

public sealed class GetSessionsQueryHandler
    : IRequestHandler<GetSessionsQuery, Result<IReadOnlyList<SessionDto>>>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetSessionsQueryHandler(IAppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Result<IReadOnlyList<SessionDto>>> Handle(
        GetSessionsQuery request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;

        var sessions = await _db.UserSessions
            .AsNoTracking()
            .Where(s => s.UserId == userId && s.IsActive)
            .OrderByDescending(s => s.LastSeenAt)
            .Select(s => new SessionDto(
                s.Id,
                s.DeviceName,
                s.DeviceType,
                s.IpAddress,
                false,            // current session logic handled client-side
                s.LastSeenAt,
                s.CreatedAt))
            .ToListAsync(cancellationToken);

        return Result.Success<IReadOnlyList<SessionDto>>(sessions);
    }
}
