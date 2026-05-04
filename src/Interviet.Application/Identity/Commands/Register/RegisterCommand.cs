using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Identity;
using Interviet.Domain.Identity;
using Interviet.Domain.Profiles;
using Interviet.Shared.Results;
using IdentityRT = Interviet.Domain.Identity.RefreshToken;

namespace Interviet.Application.Identity.Commands.Register;

// ── Command ──────────────────────────────────────────────────────────────────
public sealed record RegisterCommand(
    string FullName,
    string Email,
    string Password
) : IRequest<Result<AuthResponse>>;

// ── Validator ─────────────────────────────────────────────────────────────────
public sealed class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ và tên là bắt buộc.")
            .MaximumLength(200).WithMessage("Họ và tên không được vượt quá 200 ký tự.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email là bắt buộc.")
            .EmailAddress().WithMessage("Email không hợp lệ.")
            .MaximumLength(320).WithMessage("Email không được vượt quá 320 ký tự.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu là bắt buộc.")
            .MinimumLength(8).WithMessage("Mật khẩu phải dài ít nhất 8 ký tự.")
            .Matches(@"[A-Z]").WithMessage("Mật khẩu phải chứa ít nhất một chữ viết hoa.")
            .Matches(@"[a-z]").WithMessage("Mật khẩu phải chứa ít nhất một chữ viết thường.")
            .Matches(@"\d").WithMessage("Mật khẩu phải chứa ít nhất một chữ số.");
    }
}

// ── Handler ───────────────────────────────────────────────────────────────────
public sealed class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<AuthResponse>>
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwt;
    private readonly IDateTimeProvider _dt;
    private readonly IEmailService _emailService;
    private readonly ILogger<RegisterCommandHandler> _logger;
    private readonly Interviet.Application.Common.Options.FrontendOptions _frontendOptions;

    public RegisterCommandHandler(
        IAppDbContext db,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwt,
        IDateTimeProvider dt,
        IEmailService emailService,
        Microsoft.Extensions.Options.IOptions<Interviet.Application.Common.Options.FrontendOptions> frontendOptions,
        ILogger<RegisterCommandHandler> logger)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _jwt = jwt;
        _dt = dt;
        _emailService = emailService;
        _frontendOptions = frontendOptions.Value;
        _logger = logger;
    }

    public async Task<Result<AuthResponse>> Handle(
        RegisterCommand request,
        CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToUpperInvariant();

        var exists = await _db.Users
            .AnyAsync(u => u.NormalizedEmail == normalizedEmail && !u.IsDeleted, cancellationToken);

        if (exists)
            return Error.Conflict("Register.EmailTaken",
                "Tài khoản với email này đã tồn tại.");

        var now = _dt.UtcNow;

        // Create user
        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            NormalizedEmail = normalizedEmail,
            PasswordHash = _passwordHasher.Hash(request.Password),
            RoleCode = RoleCodes.Candidate,
            Status = "free",
            IsEmailVerified = false,
            CreatedAt = now,
            UpdatedAt = now
        };
        _db.Users.Add(user);

        // Create empty candidate profile
        var profile = new CandidateProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            CompletenessScore = 0,
            CreatedAt = now,
            UpdatedAt = now
        };
        _db.CandidateProfiles.Add(profile);

        // Create email verification token
        var rawVerifyToken = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
        var verifyTokenHash = _jwt.HashRefreshToken(rawVerifyToken);
        var emailToken = new EmailVerificationToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = verifyTokenHash,
            ExpiresAt = now.AddMinutes(15),
            IsUsed = false,
            CreatedAt = now
        };
        _db.EmailVerificationTokens.Add(emailToken);

        // Issue refresh token so user is immediately logged in after register
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
            CreatedAt = now
        };
        _db.RefreshTokens.Add(refreshToken);

        // FIX C2: Single SaveChangesAsync — all entities persisted atomically.
        // Email is sent AFTER commit to avoid sending on DB-fail.
        await _db.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("User registered. UserId={UserId} Email={Email}", user.Id, user.Email);

        var verifyLink = $"{_frontendOptions.BaseUrl.TrimEnd('/')}/verify-email?token={rawVerifyToken}";

        // Send verification email after commit (fire-and-forget style — stub in Phase 1)
        await _emailService.SendAsync(new EmailMessage(
            user.Email,
            user.FullName,
            "Xác thực email INTER-VIET của bạn",
            $"<p>Chào {user.FullName},</p><p>Vui lòng xác thực email của bạn bằng cách nhấp vào liên kết bên dưới:</p><p><a href=\"{verifyLink}\">{verifyLink}</a></p><p>Liên kết này sẽ hết hạn trong 15 phút.</p>",
            TemplateCode: "email_verification"
        ), cancellationToken);

        return new AuthResponse(
            user.Id, user.Email, user.FullName, user.Status,
            accessToken, jwtExpiry,
            refreshRaw, refreshExpiry,
            user.IsEmailVerified);
    }
}
