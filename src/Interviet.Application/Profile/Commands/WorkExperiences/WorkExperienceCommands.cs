using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Profile;
using Interviet.Domain.Profiles;
using Interviet.Shared.Results;

namespace Interviet.Application.Profile.Commands.WorkExperiences;

// ── Add Work Experience ───────────────────────────────────────────────────────
public sealed record AddWorkExperienceCommand(
    string CompanyName,
    string JobTitle,
    string? EmploymentType,
    DateOnly? StartDate,
    DateOnly? EndDate,
    bool IsCurrent,
    string? Description,
    string? MetricsSummary
) : IRequest<Result<WorkExperienceDto>>;

public sealed class AddWorkExperienceCommandValidator : AbstractValidator<AddWorkExperienceCommand>
{
    public AddWorkExperienceCommandValidator()
    {
        RuleFor(x => x.CompanyName).NotEmpty().MaximumLength(250);
        RuleFor(x => x.JobTitle).NotEmpty().MaximumLength(200);
        RuleFor(x => x).Must(x => x.IsCurrent || x.EndDate is not null)
            .WithMessage("Ngày kết thúc là bắt buộc khi vị trí không phải hiện tại.");
    }
}

public sealed class AddWorkExperienceCommandHandler : IRequestHandler<AddWorkExperienceCommand, Result<WorkExperienceDto>>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IDateTimeProvider _dt;

    public AddWorkExperienceCommandHandler(IAppDbContext db, ICurrentUserService currentUser, IDateTimeProvider dt)
    {
        _db = db; _currentUser = currentUser; _dt = dt;
    }

    public async Task<Result<WorkExperienceDto>> Handle(AddWorkExperienceCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        var now = _dt.UtcNow;

        var profile = await _db.CandidateProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
        if (profile is null) return Error.NotFound("Profile.NotFound", "Không tìm thấy hồ sơ ứng viên.");

        var exp = new WorkExperience
        {
            Id = Guid.NewGuid(),
            CandidateProfileId = profile.Id,
            CompanyName = request.CompanyName.Trim(),
            JobTitle = request.JobTitle.Trim(),
            EmploymentType = request.EmploymentType?.Trim(),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            IsCurrent = request.IsCurrent,
            Description = request.Description?.Trim(),
            MetricsSummary = request.MetricsSummary?.Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };
        _db.WorkExperiences.Add(exp);
        await _db.SaveChangesAsync(cancellationToken);

        return new WorkExperienceDto(exp.Id, exp.CompanyName, exp.JobTitle, exp.EmploymentType,
            exp.StartDate, exp.EndDate, exp.IsCurrent, exp.Description, exp.MetricsSummary);
    }
}

// ── Update Work Experience ────────────────────────────────────────────────────
public sealed record UpdateWorkExperienceCommand(
    Guid ExperienceId,
    string? CompanyName,
    string? JobTitle,
    string? EmploymentType,
    DateOnly? StartDate,
    DateOnly? EndDate,
    bool? IsCurrent,
    string? Description,
    string? MetricsSummary
) : IRequest<Result>;

public sealed class UpdateWorkExperienceCommandHandler : IRequestHandler<UpdateWorkExperienceCommand, Result>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IDateTimeProvider _dt;

    public UpdateWorkExperienceCommandHandler(IAppDbContext db, ICurrentUserService currentUser, IDateTimeProvider dt)
    {
        _db = db; _currentUser = currentUser; _dt = dt;
    }

    public async Task<Result> Handle(UpdateWorkExperienceCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        var profile = await _db.CandidateProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
        if (profile is null) return Error.NotFound("Profile.NotFound", "Không tìm thấy hồ sơ ứng viên.");

        var exp = await _db.WorkExperiences
            .FirstOrDefaultAsync(e => e.Id == request.ExperienceId && e.CandidateProfileId == profile.Id, cancellationToken);
        if (exp is null) return Error.NotFound("WorkExperience.NotFound", "Không tìm thấy kinh nghiệm làm việc này.");

        if (request.CompanyName is not null) exp.CompanyName = request.CompanyName.Trim();
        if (request.JobTitle is not null) exp.JobTitle = request.JobTitle.Trim();
        if (request.EmploymentType is not null) exp.EmploymentType = request.EmploymentType.Trim();
        if (request.StartDate is not null) exp.StartDate = request.StartDate;
        if (request.EndDate is not null) exp.EndDate = request.EndDate;
        if (request.IsCurrent is not null) exp.IsCurrent = request.IsCurrent.Value;
        if (request.Description is not null) exp.Description = request.Description.Trim();
        if (request.MetricsSummary is not null) exp.MetricsSummary = request.MetricsSummary.Trim();
        exp.UpdatedAt = _dt.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

// ── Delete Work Experience ────────────────────────────────────────────────────
public sealed record DeleteWorkExperienceCommand(Guid ExperienceId) : IRequest<Result>;

public sealed class DeleteWorkExperienceCommandHandler : IRequestHandler<DeleteWorkExperienceCommand, Result>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public DeleteWorkExperienceCommandHandler(IAppDbContext db, ICurrentUserService currentUser)
    {
        _db = db; _currentUser = currentUser;
    }

    public async Task<Result> Handle(DeleteWorkExperienceCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        var profile = await _db.CandidateProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
        if (profile is null) return Error.NotFound("Profile.NotFound", "Không tìm thấy hồ sơ ứng viên.");

        var exp = await _db.WorkExperiences
            .FirstOrDefaultAsync(e => e.Id == request.ExperienceId && e.CandidateProfileId == profile.Id, cancellationToken);
        if (exp is null) return Error.NotFound("WorkExperience.NotFound", "Không tìm thấy kinh nghiệm làm việc này.");

        _db.WorkExperiences.Remove(exp);
        await _db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
