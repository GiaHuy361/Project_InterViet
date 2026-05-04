using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Profile;
using Interviet.Domain.Profiles;
using Interviet.Shared.Results;

namespace Interviet.Application.Profile.Commands.ExternalLinks;

// ── Add External Link ─────────────────────────────────────────────────────────
public sealed record AddExternalLinkCommand(
    string LinkType,
    string? Title,
    string Url
) : IRequest<Result<ExternalLinkDto>>;

public sealed class AddExternalLinkCommandValidator : AbstractValidator<AddExternalLinkCommand>
{
    private static readonly string[] ValidLinkTypes =
        ["linkedin", "github", "portfolio", "website", "twitter", "youtube", "other"];

    public AddExternalLinkCommandValidator()
    {
        RuleFor(x => x.LinkType).NotEmpty()
            .Must(t => ValidLinkTypes.Contains(t.ToLower()))
            .WithMessage($"Loại liên kết phải là một trong: {string.Join(", ", ValidLinkTypes)}.");
        RuleFor(x => x.Url).NotEmpty().MaximumLength(500)
            .Must(u => Uri.TryCreate(u, UriKind.Absolute, out _))
            .WithMessage("URL không hợp lệ, vui lòng nhập địa chỉ đầy đủ (ví dụ: https://...).");
        When(x => x.Title is not null, () =>
            RuleFor(x => x.Title!).MaximumLength(150));
    }
}

public sealed class AddExternalLinkCommandHandler : IRequestHandler<AddExternalLinkCommand, Result<ExternalLinkDto>>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IDateTimeProvider _dt;

    public AddExternalLinkCommandHandler(IAppDbContext db, ICurrentUserService currentUser, IDateTimeProvider dt)
    {
        _db = db; _currentUser = currentUser; _dt = dt;
    }

    public async Task<Result<ExternalLinkDto>> Handle(AddExternalLinkCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        var now = _dt.UtcNow;

        var profile = await _db.CandidateProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
        if (profile is null) return Error.NotFound("Profile.NotFound", "Không tìm thấy hồ sơ ứng viên.");

        var link = new ExternalLink
        {
            Id = Guid.NewGuid(),
            CandidateProfileId = profile.Id,
            LinkType = request.LinkType.Trim().ToLower(),
            Title = request.Title?.Trim(),
            Url = request.Url.Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };
        _db.ExternalLinks.Add(link);
        await _db.SaveChangesAsync(cancellationToken);

        return new ExternalLinkDto(link.Id, link.LinkType, link.Title, link.Url);
    }
}

// ── Update External Link ──────────────────────────────────────────────────────
public sealed record UpdateExternalLinkCommand(
    Guid LinkId,
    string? LinkType,
    string? Title,
    string? Url
) : IRequest<Result>;

public sealed class UpdateExternalLinkCommandHandler : IRequestHandler<UpdateExternalLinkCommand, Result>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IDateTimeProvider _dt;

    public UpdateExternalLinkCommandHandler(IAppDbContext db, ICurrentUserService currentUser, IDateTimeProvider dt)
    {
        _db = db; _currentUser = currentUser; _dt = dt;
    }

    public async Task<Result> Handle(UpdateExternalLinkCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        var profile = await _db.CandidateProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
        if (profile is null) return Error.NotFound("Profile.NotFound", "Không tìm thấy hồ sơ ứng viên.");

        var link = await _db.ExternalLinks
            .FirstOrDefaultAsync(l => l.Id == request.LinkId && l.CandidateProfileId == profile.Id, cancellationToken);
        if (link is null) return Error.NotFound("ExternalLink.NotFound", "Không tìm thấy liên kết này.");

        if (request.LinkType is not null) link.LinkType = request.LinkType.Trim().ToLower();
        if (request.Title is not null) link.Title = request.Title.Trim();
        if (request.Url is not null) link.Url = request.Url.Trim();
        link.UpdatedAt = _dt.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

// ── Delete External Link ──────────────────────────────────────────────────────
public sealed record DeleteExternalLinkCommand(Guid LinkId) : IRequest<Result>;

public sealed class DeleteExternalLinkCommandHandler : IRequestHandler<DeleteExternalLinkCommand, Result>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public DeleteExternalLinkCommandHandler(IAppDbContext db, ICurrentUserService currentUser)
    {
        _db = db; _currentUser = currentUser;
    }

    public async Task<Result> Handle(DeleteExternalLinkCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        var profile = await _db.CandidateProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
        if (profile is null) return Error.NotFound("Profile.NotFound", "Không tìm thấy hồ sơ ứng viên.");

        var link = await _db.ExternalLinks
            .FirstOrDefaultAsync(l => l.Id == request.LinkId && l.CandidateProfileId == profile.Id, cancellationToken);
        if (link is null) return Error.NotFound("ExternalLink.NotFound", "Không tìm thấy liên kết này.");

        _db.ExternalLinks.Remove(link);
        await _db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
