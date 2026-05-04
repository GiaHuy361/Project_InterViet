using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Identity;
using Interviet.Domain.Identity;
using Interviet.Shared.Results;
using IdentityRT = Interviet.Domain.Identity.RefreshToken;

namespace Interviet.Application.Identity.Commands.RefreshToken;

// ── Command ──────────────────────────────────────────────────────────────────
public sealed record RefreshTokenCommand(
    string RawRefreshToken
) : IRequest<Result<AuthResponse>>;

// ── Handler ───────────────────────────────────────────────────────────────────
public sealed class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, Result<AuthResponse>>
{
    private readonly IAppDbContext _db;
    private readonly IJwtTokenService _jwt;
    private readonly IDateTimeProvider _dt;

    public RefreshTokenCommandHandler(
        IAppDbContext db,
        IJwtTokenService jwt,
        IDateTimeProvider dt)
    {
        _db = db;
        _jwt = jwt;
        _dt = dt;
    }

    public async Task<Result<AuthResponse>> Handle(
        RefreshTokenCommand request,
        CancellationToken cancellationToken)
    {
        var now = _dt.UtcNow;
        var tokenHash = _jwt.HashRefreshToken(request.RawRefreshToken);

        var storedToken = await _db.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash, cancellationToken);

        if (storedToken is null)
            return Error.Unauthorized("RefreshToken.Invalid", "Refresh token không hợp lệ.");

        if (storedToken.IsRevoked)
            return Error.Unauthorized("RefreshToken.Revoked", "Refresh token đã bị thu hồi.");

        if (storedToken.ExpiresAt < now)
            return Error.Unauthorized("RefreshToken.Expired", "Refresh token đã hết hạn.");

        var user = storedToken.User;
        if (user.IsDeleted)
            return Error.Unauthorized("RefreshToken.AccountDeleted", "Tài khoản không tồn tại hoặc đã bị xóa.");

        if (user.Status == UserStatus.Suspended)
            return Error.Forbidden("RefreshToken.AccountSuspended", "Tài khoản của bạn đã bị khóa.");

        // ── FIX C3: Compute new hash FIRST, then set ReplacedByTokenHash atomically ─
        var newAccessToken = _jwt.GenerateAccessToken(user.Id, user.Email, [user.RoleCode]);
        var newRefreshRaw = _jwt.GenerateRefreshToken();
        var newRefreshHash = _jwt.HashRefreshToken(newRefreshRaw);
        var jwtExpiry = now.AddMinutes(_jwt.AccessTokenMinutes);
        var refreshExpiry = now.AddDays(_jwt.RefreshTokenDays);

        // Revoke old token — set replacement hash in one step (no "(pending)" intermediate)
        storedToken.IsRevoked = true;
        storedToken.RevokedAt = now;
        storedToken.ReplacedByTokenHash = newRefreshHash;

        var newToken = new IdentityRT
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = newRefreshHash,
            ExpiresAt = refreshExpiry,
            IsRevoked = false,
            UserSessionId = storedToken.UserSessionId,
            CreatedAt = now
        };
        _db.RefreshTokens.Add(newToken);
        await _db.SaveChangesAsync(cancellationToken);

        return new AuthResponse(
            user.Id, user.Email, user.FullName, user.Status,
            newAccessToken, jwtExpiry,
            newRefreshRaw, refreshExpiry,
            user.IsEmailVerified);
    }
}
