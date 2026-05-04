using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Shared.Results;

namespace Interviet.Application.Identity.Commands.ResetPassword;

public sealed record ResetPasswordCommand(
    string RawToken,
    string NewPassword
) : IRequest<Result>;

public sealed class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordCommandValidator()
    {
        RuleFor(x => x.RawToken).NotEmpty().WithMessage("Mã khôi phục là bắt buộc.");
        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Mật khẩu mới là bắt buộc.")
            .MinimumLength(8).WithMessage("Mật khẩu phải dài ít nhất 8 ký tự.")
            .Matches(@"[A-Z]").WithMessage("Mật khẩu phải chứa ít nhất một chữ viết hoa.")
            .Matches(@"[a-z]").WithMessage("Mật khẩu phải chứa ít nhất một chữ viết thường.")
            .Matches(@"\d").WithMessage("Mật khẩu phải chứa ít nhất một chữ số.");
    }
}

public sealed class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand, Result>
{
    private readonly IAppDbContext _db;
    private readonly IJwtTokenService _jwt;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IDateTimeProvider _dt;
    private readonly ILogger<ResetPasswordCommandHandler> _logger;

    public ResetPasswordCommandHandler(
        IAppDbContext db,
        IJwtTokenService jwt,
        IPasswordHasher passwordHasher,
        IDateTimeProvider dt,
        ILogger<ResetPasswordCommandHandler> logger)
    {
        _db = db;
        _jwt = jwt;
        _passwordHasher = passwordHasher;
        _dt = dt;
        _logger = logger;
    }

    public async Task<Result> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var now = _dt.UtcNow;
        var tokenHash = _jwt.HashRefreshToken(request.RawToken);

        var token = await _db.PasswordResetTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash && !t.IsUsed, cancellationToken);

        if (token is null)
            return Error.NotFound("ResetPassword.TokenNotFound", "Mã khôi phục mật khẩu không hợp lệ.");

        if (token.ExpiresAt < now)
            return Error.Validation("ResetPassword.TokenExpired", "Mã khôi phục đã hết hạn. Vui lòng yêu cầu lại.");

        token.User.PasswordHash = _passwordHasher.Hash(request.NewPassword);
        token.IsUsed = true;
        token.UsedAt = now;

        // Revoke all refresh tokens for security
        var allTokens = await _db.RefreshTokens
            .Where(rt => rt.UserId == token.UserId && !rt.IsRevoked)
            .ToListAsync(cancellationToken);
        foreach (var rt in allTokens)
        {
            rt.IsRevoked = true;
            rt.RevokedAt = now;
        }

        await _db.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Password reset successful. UserId={UserId}", token.UserId);
        return Result.Success();
    }
}
