using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Common.Options;
using Interviet.Domain.Identity;
using Interviet.Shared.Results;

namespace Interviet.Application.Identity.Commands.VerifyEmail;

public sealed record ResendVerificationEmailCommand(string Email) : IRequest<Result>;

public sealed class ResendVerificationEmailCommandValidator : AbstractValidator<ResendVerificationEmailCommand>
{
    public ResendVerificationEmailCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email là bắt buộc.")
            .EmailAddress().WithMessage("Email không hợp lệ.");
    }
}

public sealed class ResendVerificationEmailCommandHandler : IRequestHandler<ResendVerificationEmailCommand, Result>
{
    private readonly IAppDbContext _db;
    private readonly IJwtTokenService _jwt;
    private readonly IDateTimeProvider _dt;
    private readonly IEmailService _emailService;
    private readonly FrontendOptions _frontendOptions;
    private readonly ILogger<ResendVerificationEmailCommandHandler> _logger;

    public ResendVerificationEmailCommandHandler(
        IAppDbContext db,
        IJwtTokenService jwt,
        IDateTimeProvider dt,
        IEmailService emailService,
        IOptions<FrontendOptions> frontendOptions,
        ILogger<ResendVerificationEmailCommandHandler> logger)
    {
        _db = db;
        _jwt = jwt;
        _dt = dt;
        _emailService = emailService;
        _frontendOptions = frontendOptions.Value;
        _logger = logger;
    }

    public async Task<Result> Handle(ResendVerificationEmailCommand request, CancellationToken cancellationToken)
    {
        var now = _dt.UtcNow;
        var normalizedEmail = request.Email.Trim().ToUpperInvariant();

        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail, cancellationToken);

        // Always return success if user not found, deleted, or suspended (security)
        if (user is null || user.IsDeleted || user.Status == UserStatus.Suspended)
        {
            _logger.LogInformation("ResendVerify: User not found or inactive. {Email}", request.Email);
            return Result.Success();
        }

        // Return success if already verified
        if (user.IsEmailVerified)
        {
            _logger.LogInformation("ResendVerify: User already verified. {Email}", request.Email);
            return Result.Success();
        }

        // Cooldown check (60 seconds)
        var lastToken = await _db.EmailVerificationTokens
            .Where(t => t.UserId == user.Id)
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (lastToken != null && lastToken.CreatedAt.AddSeconds(60) > now)
        {
            _logger.LogWarning("ResendVerify: Cooldown active for {Email}", request.Email);
            return Error.Validation("ResendVerify.Cooldown", "Vui lòng đợi một chút trước khi yêu cầu gửi lại email xác thực.");
        }

        // Invalidate ONLY existing unused Email Verification tokens (do not touch Password Reset tokens)
        var unusedTokens = await _db.EmailVerificationTokens
            .Where(t => t.UserId == user.Id && !t.IsUsed)
            .ToListAsync(cancellationToken);
            
        foreach (var t in unusedTokens)
        {
            t.IsUsed = true;
        }

        // Generate new token
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
        
        await _db.SaveChangesAsync(cancellationToken);

        // Send email
        var verifyLink = $"{_frontendOptions.BaseUrl.TrimEnd('/')}/verify-email?token={rawVerifyToken}";

        await _emailService.SendAsync(new EmailMessage(
            user.Email,
            user.FullName,
            "Xác thực email INTER-VIET của bạn",
            $"<p>Chào {user.FullName},</p><p>Vui lòng xác thực email của bạn bằng cách nhấp vào liên kết bên dưới:</p><p><a href=\"{verifyLink}\">{verifyLink}</a></p><p>Liên kết này sẽ hết hạn trong 15 phút.</p>",
            TemplateCode: "email_verification"
        ), cancellationToken);

        _logger.LogInformation("ResendVerify: Email sent to {Email}", request.Email);

        return Result.Success();
    }
}
