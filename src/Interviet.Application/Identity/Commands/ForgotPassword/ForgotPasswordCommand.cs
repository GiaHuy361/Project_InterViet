using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Domain.Identity;
using Interviet.Shared.Results;

namespace Interviet.Application.Identity.Commands.ForgotPassword;

public sealed record ForgotPasswordCommand(string Email) : IRequest<Result>;

public sealed class ForgotPasswordCommandValidator : AbstractValidator<ForgotPasswordCommand>
{
    public ForgotPasswordCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email là bắt buộc.")
            .EmailAddress().WithMessage("Email không hợp lệ.");
    }
}

public sealed class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand, Result>
{
    private readonly IAppDbContext _db;
    private readonly IJwtTokenService _jwt;
    private readonly IDateTimeProvider _dt;
    private readonly IEmailService _emailService;
    private readonly ILogger<ForgotPasswordCommandHandler> _logger;
    private readonly Interviet.Application.Common.Options.FrontendOptions _frontendOptions;

    public ForgotPasswordCommandHandler(
        IAppDbContext db,
        IJwtTokenService jwt,
        IDateTimeProvider dt,
        IEmailService emailService,
        Microsoft.Extensions.Options.IOptions<Interviet.Application.Common.Options.FrontendOptions> frontendOptions,
        ILogger<ForgotPasswordCommandHandler> logger)
    {
        _db = db;
        _jwt = jwt;
        _dt = dt;
        _emailService = emailService;
        _frontendOptions = frontendOptions.Value;
        _logger = logger;
    }

    public async Task<Result> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var now = _dt.UtcNow;
        var normalizedEmail = request.Email.Trim().ToUpperInvariant();

        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail && !u.IsDeleted, cancellationToken);

        // Always return success — don't expose whether email exists (security)
        if (user is null)
        {
            _logger.LogInformation("ForgotPassword: email not found. {Email}", request.Email);
            return Result.Success();
        }

        // Invalidate any existing unused tokens
        var existingTokens = await _db.PasswordResetTokens
            .Where(t => t.UserId == user.Id && !t.IsUsed)
            .ToListAsync(cancellationToken);
        foreach (var old in existingTokens)
            old.IsUsed = true;

        // Create new token
        var rawToken = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
        var tokenHash = _jwt.HashRefreshToken(rawToken);

        var token = new PasswordResetToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = now.AddMinutes(15),
            IsUsed = false,
            CreatedAt = now
        };
        _db.PasswordResetTokens.Add(token);
        await _db.SaveChangesAsync(cancellationToken);

        var resetLink = $"{_frontendOptions.BaseUrl.TrimEnd('/')}/reset-password?token={rawToken}";

        await _emailService.SendAsync(new EmailMessage(
            user.Email,
            user.FullName,
            "Khôi phục mật khẩu INTER-VIET",
            $"<p>Chào {user.FullName},</p><p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu từ bạn. Nhấp vào liên kết bên dưới để tiến hành:</p><p><a href=\"{resetLink}\">{resetLink}</a></p><p>Liên kết này sẽ hết hạn trong 15 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>",
            TemplateCode: "password_reset"
        ), cancellationToken);

        _logger.LogInformation("Password reset email sent. UserId={UserId}", user.Id);
        return Result.Success();
    }
}
