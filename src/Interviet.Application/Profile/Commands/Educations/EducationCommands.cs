using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Profile;
using Interviet.Domain.Profiles;
using Interviet.Shared.Results;

namespace Interviet.Application.Profile.Commands.Educations;

// ── Add Education ─────────────────────────────────────────────────────────────
public sealed record AddEducationCommand(
    string SchoolName,
    string? Degree,
    string? FieldOfStudy,
    DateOnly? StartDate,
    DateOnly? EndDate,
    string? Grade,
    string? Description
) : IRequest<Result<EducationDto>>;

public sealed class AddEducationCommandValidator : AbstractValidator<AddEducationCommand>
{
    public AddEducationCommandValidator()
    {
        RuleFor(x => x.SchoolName).NotEmpty().MaximumLength(250);
        When(x => x.Degree is not null, () => RuleFor(x => x.Degree!).MaximumLength(150));
        When(x => x.FieldOfStudy is not null, () => RuleFor(x => x.FieldOfStudy!).MaximumLength(150));
        When(x => x.StartDate is not null && x.EndDate is not null, () =>
            RuleFor(x => x.EndDate).GreaterThanOrEqualTo(x => x.StartDate)
                .WithMessage("Ngày kết thúc phải sau ngày bắt đầu."));
    }
}

public sealed class AddEducationCommandHandler : IRequestHandler<AddEducationCommand, Result<EducationDto>>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IDateTimeProvider _dt;

    public AddEducationCommandHandler(IAppDbContext db, ICurrentUserService currentUser, IDateTimeProvider dt)
    {
        _db = db; _currentUser = currentUser; _dt = dt;
    }

    public async Task<Result<EducationDto>> Handle(AddEducationCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        var now = _dt.UtcNow;

        var profile = await _db.CandidateProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
        if (profile is null) return Error.NotFound("Profile.NotFound", "Không tìm thấy hồ sơ ứng viên.");

        var edu = new Education
        {
            Id = Guid.NewGuid(),
            CandidateProfileId = profile.Id,
            SchoolName = request.SchoolName.Trim(),
            Degree = request.Degree?.Trim(),
            FieldOfStudy = request.FieldOfStudy?.Trim(),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Grade = request.Grade?.Trim(),
            Description = request.Description?.Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };
        _db.Educations.Add(edu);
        await _db.SaveChangesAsync(cancellationToken);

        return new EducationDto(edu.Id, edu.SchoolName, edu.Degree, edu.FieldOfStudy,
            edu.StartDate, edu.EndDate, edu.Grade, edu.Description);
    }
}

// ── Update Education ──────────────────────────────────────────────────────────
public sealed record UpdateEducationCommand(
    Guid EducationId,
    string? SchoolName,
    string? Degree,
    string? FieldOfStudy,
    DateOnly? StartDate,
    DateOnly? EndDate,
    string? Grade,
    string? Description
) : IRequest<Result>;

public sealed class UpdateEducationCommandHandler : IRequestHandler<UpdateEducationCommand, Result>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IDateTimeProvider _dt;

    public UpdateEducationCommandHandler(IAppDbContext db, ICurrentUserService currentUser, IDateTimeProvider dt)
    {
        _db = db; _currentUser = currentUser; _dt = dt;
    }

    public async Task<Result> Handle(UpdateEducationCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        var profile = await _db.CandidateProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
        if (profile is null) return Error.NotFound("Profile.NotFound", "Không tìm thấy hồ sơ ứng viên.");

        var edu = await _db.Educations
            .FirstOrDefaultAsync(e => e.Id == request.EducationId && e.CandidateProfileId == profile.Id, cancellationToken);
        if (edu is null) return Error.NotFound("Education.NotFound", "Không tìm thấy mục học vấn này.");

        if (request.SchoolName is not null) edu.SchoolName = request.SchoolName.Trim();
        if (request.Degree is not null) edu.Degree = request.Degree.Trim();
        if (request.FieldOfStudy is not null) edu.FieldOfStudy = request.FieldOfStudy.Trim();
        if (request.StartDate is not null) edu.StartDate = request.StartDate;
        if (request.EndDate is not null) edu.EndDate = request.EndDate;
        if (request.Grade is not null) edu.Grade = request.Grade.Trim();
        if (request.Description is not null) edu.Description = request.Description.Trim();
        edu.UpdatedAt = _dt.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

// ── Delete Education ──────────────────────────────────────────────────────────
public sealed record DeleteEducationCommand(Guid EducationId) : IRequest<Result>;

public sealed class DeleteEducationCommandHandler : IRequestHandler<DeleteEducationCommand, Result>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public DeleteEducationCommandHandler(IAppDbContext db, ICurrentUserService currentUser)
    {
        _db = db; _currentUser = currentUser;
    }

    public async Task<Result> Handle(DeleteEducationCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        var profile = await _db.CandidateProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
        if (profile is null) return Error.NotFound("Profile.NotFound", "Không tìm thấy hồ sơ ứng viên.");

        var edu = await _db.Educations
            .FirstOrDefaultAsync(e => e.Id == request.EducationId && e.CandidateProfileId == profile.Id, cancellationToken);
        if (edu is null) return Error.NotFound("Education.NotFound", "Không tìm thấy mục học vấn này.");

        _db.Educations.Remove(edu);
        await _db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
