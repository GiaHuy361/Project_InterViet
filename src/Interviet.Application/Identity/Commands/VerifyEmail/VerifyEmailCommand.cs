using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Shared.Results;

namespace Interviet.Application.Identity.Commands.VerifyEmail;

public sealed record VerifyEmailCommand(string RawToken) : IRequest<Result>;

public sealed class VerifyEmailCommandValidator : AbstractValidator<VerifyEmailCommand>
{
    public VerifyEmailCommandValidator()
    {
        RuleFor(x => x.RawToken).NotEmpty().WithMessage("Mã xác thực là bắt buộc.");
    }
}

public sealed class VerifyEmailCommandHandler : IRequestHandler<VerifyEmailCommand, Result>
{
    private readonly IAppDbContext _db;
    private readonly IJwtTokenService _jwt;
    private readonly IDateTimeProvider _dt;

    public VerifyEmailCommandHandler(IAppDbContext db, IJwtTokenService jwt, IDateTimeProvider dt)
    {
        _db = db;
        _jwt = jwt;
        _dt = dt;
    }

    public async Task<Result> Handle(VerifyEmailCommand request, CancellationToken cancellationToken)
    {
        var now = _dt.UtcNow;
        var tokenHash = _jwt.HashRefreshToken(request.RawToken);

        var token = await _db.EmailVerificationTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash && !t.IsUsed, cancellationToken);

        if (token is null)
            return Error.NotFound("VerifyEmail.TokenNotFound", "Mã xác thực không hợp lệ hoặc đã được sử dụng.");

        if (token.ExpiresAt < now)
            return Error.Validation("VerifyEmail.TokenExpired", "Mã xác thực đã hết hạn. Vui lòng yêu cầu gửi lại email.");

        token.IsUsed = true;
        token.UsedAt = now;
        token.User.IsEmailVerified = true;
        token.User.EmailVerifiedAt = now;

        await _db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
