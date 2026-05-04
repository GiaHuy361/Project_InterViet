using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Shared.Results;

namespace Interviet.Application.Profile.Commands.UpdateProfile;

public sealed record UpdateProfileCommand(
    string? FullName,
    string? PhoneNumber,
    string? Headline,
    string? Summary,
    string? DesiredRole,
    decimal? YearsOfExperience,
    string? CurrentLocation,
    string? PreferredLocation,
    decimal? SalaryExpectationMin,
    decimal? SalaryExpectationMax
) : IRequest<Result>;

public sealed class UpdateProfileCommandValidator : AbstractValidator<UpdateProfileCommand>
{
    public UpdateProfileCommandValidator()
    {
        When(x => x.FullName is not null, () =>
            RuleFor(x => x.FullName!).NotEmpty().MaximumLength(200));

        When(x => x.PhoneNumber is not null, () =>
            RuleFor(x => x.PhoneNumber!).MaximumLength(30));

        When(x => x.Headline is not null, () =>
            RuleFor(x => x.Headline!).MaximumLength(250));

        When(x => x.Summary is not null, () =>
            RuleFor(x => x.Summary!).MaximumLength(3000));

        When(x => x.DesiredRole is not null, () =>
            RuleFor(x => x.DesiredRole!).MaximumLength(200));

        When(x => x.YearsOfExperience is not null, () =>
            RuleFor(x => x.YearsOfExperience!.Value)
                .GreaterThanOrEqualTo(0).LessThanOrEqualTo(50));

        // Cross-field: salary min must not exceed max when both are provided
        When(x => x.SalaryExpectationMin is not null && x.SalaryExpectationMax is not null, () =>
        {
            RuleFor(x => x.SalaryExpectationMin!.Value)
                .GreaterThanOrEqualTo(0).WithMessage("Mức lương tối thiểu phải ≥ 0.");
            RuleFor(x => x.SalaryExpectationMax!.Value)
                .GreaterThanOrEqualTo(0).WithMessage("Mức lương tối đa phải ≥ 0.");
            RuleFor(x => x)
                .Must(x => x.SalaryExpectationMin!.Value <= x.SalaryExpectationMax!.Value)
                .WithMessage("Mức lương tối thiểu không được lớn hơn mức tối đa.");
        });
    }
}

public sealed class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, Result>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IDateTimeProvider _dt;

    public UpdateProfileCommandHandler(
        IAppDbContext db,
        ICurrentUserService currentUser,
        IDateTimeProvider dt)
    {
        _db = db;
        _currentUser = currentUser;
        _dt = dt;
    }

    public async Task<Result> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        var now = _dt.UtcNow;

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null) return Error.NotFound("Profile.UserNotFound", "Không tìm thấy tài khoản.");

        var profile = await _db.CandidateProfiles
            .Include(p => p.Skills)
            .Include(p => p.Educations)
            .Include(p => p.WorkExperiences)
            .Include(p => p.Links)
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
        if (profile is null) return Error.NotFound("Profile.NotFound", "Không tìm thấy hồ sơ ứng viên.");

        // Patch only provided fields
        if (request.FullName is not null) user.FullName = request.FullName.Trim();
        if (request.PhoneNumber is not null) user.PhoneNumber = request.PhoneNumber.Trim();
        if (request.Headline is not null) profile.Headline = request.Headline.Trim();
        if (request.Summary is not null) profile.Summary = request.Summary.Trim();
        if (request.DesiredRole is not null) profile.DesiredRole = request.DesiredRole.Trim();
        if (request.YearsOfExperience is not null) profile.YearsOfExperience = request.YearsOfExperience;
        if (request.CurrentLocation is not null) profile.CurrentLocation = request.CurrentLocation.Trim();
        if (request.PreferredLocation is not null) profile.PreferredLocation = request.PreferredLocation.Trim();
        if (request.SalaryExpectationMin is not null) profile.SalaryExpectationMin = request.SalaryExpectationMin;
        if (request.SalaryExpectationMax is not null) profile.SalaryExpectationMax = request.SalaryExpectationMax;

        // Recalculate completeness using centralized helper
        profile.CompletenessScore = ProfileCompletenessHelper.Calculate(user, profile);
        profile.UpdatedAt = now;
        user.UpdatedAt = now;

        await _db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
