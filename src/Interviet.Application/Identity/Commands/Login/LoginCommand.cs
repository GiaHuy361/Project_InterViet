using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Identity;
using Interviet.Domain.Identity;
using Interviet.Shared.Results;
using IdentityRT = Interviet.Domain.Identity.RefreshToken;

namespace Interviet.Application.Identity.Commands.Login;

// ── Command ──────────────────────────────────────────────────────────────────
public sealed record LoginCommand(
    string Email,
    string Password,
    string? DeviceName,
    string? IpAddress,
    string? UserAgent
) : IRequest<Result<AuthResponse>>;

// ── Validator ─────────────────────────────────────────────────────────────────
public sealed class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email là bắt buộc.")
            .EmailAddress().WithMessage("Email không hợp lệ.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu là bắt buộc.");
    }
}

// ── Handler ───────────────────────────────────────────────────────────────────
public sealed class LoginCommandHandler : IRequestHandler<LoginCommand, Result<AuthResponse>>
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwt;
    private readonly IDateTimeProvider _dt;
    private readonly ILogger<LoginCommandHandler> _logger;

    public LoginCommandHandler(
        IAppDbContext db,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwt,
        IDateTimeProvider dt,
        ILogger<LoginCommandHandler> logger)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _jwt = jwt;
        _dt = dt;
        _logger = logger;
    }

    public async Task<Result<AuthResponse>> Handle(
        LoginCommand request,
        CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToUpperInvariant();
        var now = _dt.UtcNow;

        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail && !u.IsDeleted, cancellationToken);

        if (user is null || !_passwordHasher.Verify(request.Password, user.PasswordHash ?? ""))
            return Error.Unauthorized("Auth.InvalidCredentials", "Email hoặc mật khẩu không đúng.");

        if (user.Status == UserStatus.Suspended)
            return Error.Forbidden("Auth.AccountSuspended", "Tài khoản của bạn đã bị khóa.");

        // Create session
        var session = new UserSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            DeviceName = request.DeviceName,
            DeviceType = "web",
            IpAddress = request.IpAddress,
            UserAgent = request.UserAgent,
            IsActive = true,
            LastSeenAt = now,
            CreatedAt = now
        };
        _db.UserSessions.Add(session);

        // Issue tokens
        // Issue tokens — role read directly from user record
        var accessToken = _jwt.GenerateAccessToken(user.Id, user.Email, [user.RoleCode]);
        var refreshRaw = _jwt.GenerateRefreshToken();
        var refreshHash = _jwt.HashRefreshToken(refreshRaw);
        var jwtExpiry = now.AddMinutes(_jwt.AccessTokenMinutes);
        var refreshExpiry = now.AddDays(_jwt.RefreshTokenDays);

        var refreshToken = new IdentityRT
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = refreshHash,
            ExpiresAt = refreshExpiry,
            IsRevoked = false,
            UserSessionId = session.Id,
            CreatedAt = now
        };
        _db.RefreshTokens.Add(refreshToken);
        await _db.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("User logged in. UserId={UserId} IP={Ip}", user.Id, request.IpAddress);

        return new AuthResponse(
            user.Id, user.Email, user.FullName, user.Status,
            accessToken, jwtExpiry,
            refreshRaw, refreshExpiry,
            user.IsEmailVerified);
    }
}
