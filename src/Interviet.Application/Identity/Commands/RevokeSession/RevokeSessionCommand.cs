using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Shared.Results;

namespace Interviet.Application.Identity.Commands.RevokeSession;

public sealed record RevokeSessionCommand(Guid SessionId) : IRequest<Result>;

public sealed class RevokeSessionCommandHandler : IRequestHandler<RevokeSessionCommand, Result>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IDateTimeProvider _dt;
    private readonly ILogger<RevokeSessionCommandHandler> _logger;

    public RevokeSessionCommandHandler(
        IAppDbContext db,
        ICurrentUserService currentUser,
        IDateTimeProvider dt,
        ILogger<RevokeSessionCommandHandler> logger)
    {
        _db = db;
        _currentUser = currentUser;
        _dt = dt;
        _logger = logger;
    }

    public async Task<Result> Handle(RevokeSessionCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        var now = _dt.UtcNow;

        var session = await _db.UserSessions
            .FirstOrDefaultAsync(s => s.Id == request.SessionId && s.UserId == userId, cancellationToken);

        if (session is null)
            return Error.NotFound("RevokeSession.NotFound", "Session not found.");

        if (!session.IsActive)
            return Result.Success(); // idempotent

        session.IsActive = false;

        // Revoke all refresh tokens tied to this session
        var tokens = await _db.RefreshTokens
            .Where(rt => rt.UserSessionId == session.Id && !rt.IsRevoked)
            .ToListAsync(cancellationToken);
        foreach (var t in tokens)
        {
            t.IsRevoked = true;
            t.RevokedAt = now;
        }

        await _db.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Session revoked. UserId={UserId} SessionId={SessionId}", userId, request.SessionId);
        return Result.Success();
    }
}
