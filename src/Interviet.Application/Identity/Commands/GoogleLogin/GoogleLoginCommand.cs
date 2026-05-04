using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Identity;
using Interviet.Domain.Identity;
using Interviet.Domain.Profiles;
using Interviet.Shared.Results;

namespace Interviet.Application.Identity.Commands.GoogleLogin;

public sealed record GoogleLoginCommand(
    string IdToken,
    string? DeviceName
) : IRequest<Result<AuthResponse>>;

public sealed class GoogleLoginCommandValidator : AbstractValidator<GoogleLoginCommand>
{
    public GoogleLoginCommandValidator()
    {
        RuleFor(x => x.IdToken).NotEmpty().WithMessage("Google ID Token là bắt buộc.");
    }
}

public sealed class GoogleLoginCommandHandler : IRequestHandler<GoogleLoginCommand, Result<AuthResponse>>
{
    private readonly IAppDbContext _db;
    private readonly IJwtTokenService _jwt;
    private readonly IDateTimeProvider _dt;
    private readonly IGoogleAuthService _googleAuthService;
    private readonly ILogger<GoogleLoginCommandHandler> _logger;

    public GoogleLoginCommandHandler(
        IAppDbContext db,
        IJwtTokenService jwt,
        IDateTimeProvider dt,
        IGoogleAuthService googleAuthService,
        ILogger<GoogleLoginCommandHandler> logger)
    {
        _db = db;
        _jwt = jwt;
        _dt = dt;
        _googleAuthService = googleAuthService;
        _logger = logger;
    }

    public async Task<Result<AuthResponse>> Handle(GoogleLoginCommand request, CancellationToken cancellationToken)
    {
        var now = _dt.UtcNow;
        
        var payload = await _googleAuthService.ValidateIdTokenAsync(request.IdToken);
        
        if (payload == null)
        {
            return Error.Unauthorized("GoogleLogin.InvalidToken", "Token Google không hợp lệ hoặc đã hết hạn.");
        }

        if (!payload.EmailVerified)
        {
            _logger.LogWarning("Google login rejected: Email not verified by Google. Email={Email}", payload.Email);
            return Error.Unauthorized("GoogleLogin.UnverifiedEmail", "Email Google của bạn chưa được xác minh, không thể đăng nhập.");
        }

        var normalizedEmail = payload.Email.Trim().ToUpperInvariant();
        var providerKey = payload.Subject;

        // Find external login
        var externalLogin = await _db.ExternalLogins
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.Provider == "Google" && x.ProviderKey == providerKey, cancellationToken);

        User user;

        if (externalLogin != null)
        {
            user = externalLogin.User;
            
            if (user.IsDeleted)
                return Error.Unauthorized("GoogleLogin.AccountDeleted", "Tài khoản không tồn tại hoặc đã bị xóa.");
            if (user.Status == UserStatus.Suspended)
                return Error.Forbidden("GoogleLogin.AccountSuspended", "Tài khoản của bạn đã bị khóa.");

            externalLogin.LastUsedAt = now;
        }
        else
        {
            // Try to find existing user by email
            user = await _db.Users
                .FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail, cancellationToken);

            if (user != null)
            {
                if (user.IsDeleted)
                    return Error.Unauthorized("GoogleLogin.AccountDeleted", "Tài khoản không tồn tại hoặc đã bị xóa.");
                if (user.Status == UserStatus.Suspended)
                    return Error.Forbidden("GoogleLogin.AccountSuspended", "Tài khoản của bạn đã bị khóa.");

                // Link account
                externalLogin = new ExternalLogin
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    Provider = "Google",
                    ProviderKey = providerKey,
                    ProviderDisplayName = payload.Name,
                    Email = payload.Email,
                    CreatedAt = now,
                    LastUsedAt = now
                };
                _db.ExternalLogins.Add(externalLogin);
                
                // If user wasn't verified before, Google's verified status can be trusted
                if (!user.IsEmailVerified)
                {
                    user.IsEmailVerified = true;
                    user.EmailVerifiedAt = now;
                }
            }
            else
            {
                // Register new user
                user = new User
                {
                    Id = Guid.NewGuid(),
                    FullName = payload.Name ?? "Google User",
                    Email = payload.Email.Trim().ToLowerInvariant(),
                    NormalizedEmail = normalizedEmail,
                    PasswordHash = null,
                    RoleCode = RoleCodes.Candidate,
                    AvatarUrl = payload.Picture,
                    Status = UserStatus.Free,
                    IsEmailVerified = true,
                    EmailVerifiedAt = now,
                    CreatedAt = now,
                    UpdatedAt = now
                };
                _db.Users.Add(user);

                var profile = new CandidateProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    CompletenessScore = 0,
                    CreatedAt = now,
                    UpdatedAt = now
                };
                _db.CandidateProfiles.Add(profile);

                externalLogin = new ExternalLogin
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    Provider = "Google",
                    ProviderKey = providerKey,
                    ProviderDisplayName = payload.Name,
                    Email = payload.Email,
                    CreatedAt = now,
                    LastUsedAt = now
                };
                _db.ExternalLogins.Add(externalLogin);
            }
        }

        user.LastLoginAt = now;

        // Generate tokens — role read from user record
        var accessToken = _jwt.GenerateAccessToken(user.Id, user.Email, [user.RoleCode]);
        var refreshRaw = _jwt.GenerateRefreshToken();
        var refreshHash = _jwt.HashRefreshToken(refreshRaw);
        var jwtExpiry = now.AddMinutes(_jwt.AccessTokenMinutes);
        var refreshExpiry = now.AddDays(_jwt.RefreshTokenDays);

        var refreshToken = new Interviet.Domain.Identity.RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = refreshHash,
            ExpiresAt = refreshExpiry,
            IsRevoked = false,
            CreatedAt = now
        };
        _db.RefreshTokens.Add(refreshToken);

        // Manage session
        var session = new UserSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            DeviceName = request.DeviceName,
            DeviceType = "Web",
            IpAddress = null,
            UserAgent = null,
            IsActive = true,
            CreatedAt = now,
            LastSeenAt = now
        };
        _db.UserSessions.Add(session);

        await _db.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("User logged in via Google. UserId={UserId}", user.Id);

        return new AuthResponse(
            user.Id, user.Email, user.FullName, user.Status,
            accessToken, jwtExpiry,
            refreshRaw, refreshExpiry,
            user.IsEmailVerified);
    }
}
