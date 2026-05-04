using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Shared.Results;

namespace Interviet.Application.Identity.Commands.Logout;

public sealed record LogoutCommand(string RawRefreshToken) : IRequest<Result>;

public sealed class LogoutCommandHandler : IRequestHandler<LogoutCommand, Result>
{
    private readonly IAppDbContext _db;
    private readonly IJwtTokenService _jwt;
    private readonly IDateTimeProvider _dt;
    private readonly ILogger<LogoutCommandHandler> _logger;

    public LogoutCommandHandler(
        IAppDbContext db,
        IJwtTokenService jwt,
        IDateTimeProvider dt,
        ILogger<LogoutCommandHandler> logger)
    {
        _db = db;
        _jwt = jwt;
        _dt = dt;
        _logger = logger;
    }

    public async Task<Result> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        var tokenHash = _jwt.HashRefreshToken(request.RawRefreshToken);
        var now = _dt.UtcNow;

        var token = await _db.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash, cancellationToken);

        if (token is null)
            return Result.Success(); // idempotent — token already gone or never existed

        var changed = false;

        if (!token.IsRevoked)
        {
            token.IsRevoked = true;
            token.RevokedAt = now;
            changed = true;
        }

        // FIX C4: Batch session deactivation in same SaveChanges call
        if (token.UserSessionId.HasValue)
        {
            var session = await _db.UserSessions
                .FirstOrDefaultAsync(s => s.Id == token.UserSessionId.Value, cancellationToken);
            if (session is { IsActive: true })
            {
                session.IsActive = false;
                changed = true;
            }
        }

        if (changed)
            await _db.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("User logged out. UserId={UserId}", token.UserId);
        return Result.Success();
    }
}
