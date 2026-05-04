using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Profile;
using Interviet.Domain.Profiles;
using Interviet.Shared.Results;

namespace Interviet.Application.Profile.Commands.Skills;

// ── Add Skill ─────────────────────────────────────────────────────────────────
public sealed record AddSkillCommand(
    string SkillName,
    string? ProficiencyLevel,
    decimal? YearsUsed,
    int? LastUsedYear
) : IRequest<Result<SkillDto>>;

public sealed class AddSkillCommandValidator : AbstractValidator<AddSkillCommand>
{
    private static readonly string[] ValidLevels = ["beginner", "intermediate", "advanced", "expert"];

    public AddSkillCommandValidator()
    {
        RuleFor(x => x.SkillName).NotEmpty().MaximumLength(150);
        When(x => x.ProficiencyLevel is not null, () =>
            RuleFor(x => x.ProficiencyLevel!)
                .Must(p => ValidLevels.Contains(p.Trim().ToLowerInvariant()))
                .WithMessage("Mức thành thạo phải là một trong: beginner, intermediate, advanced, expert."));
        When(x => x.YearsUsed is not null, () =>
            RuleFor(x => x.YearsUsed!.Value).GreaterThanOrEqualTo(0).LessThanOrEqualTo(50));
        When(x => x.LastUsedYear is not null, () =>
            RuleFor(x => x.LastUsedYear!.Value)
                .GreaterThanOrEqualTo(1990)
                .LessThanOrEqualTo(DateTime.UtcNow.Year + 1));
    }
}

public sealed class AddSkillCommandHandler : IRequestHandler<AddSkillCommand, Result<SkillDto>>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IDateTimeProvider _dt;

    public AddSkillCommandHandler(IAppDbContext db, ICurrentUserService currentUser, IDateTimeProvider dt)
    {
        _db = db;
        _currentUser = currentUser;
        _dt = dt;
    }

    public async Task<Result<SkillDto>> Handle(AddSkillCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        var now = _dt.UtcNow;

        // FIX I3: Load user alongside profile for accurate completeness calculation
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null) return Error.NotFound("Profile.UserNotFound", "Không tìm thấy tài khoản.");

        var profile = await _db.CandidateProfiles
            .Include(p => p.Skills)
            .Include(p => p.Educations)
            .Include(p => p.WorkExperiences)
            .Include(p => p.Links)
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
        if (profile is null) return Error.NotFound("Profile.NotFound", "Không tìm thấy hồ sơ ứng viên.");

        // Find or create skill in global catalog
        var normalizedName = request.SkillName.Trim().ToLowerInvariant();
        var skill = await _db.Skills
            .FirstOrDefaultAsync(s => s.NormalizedName == normalizedName, cancellationToken);

        if (skill is null)
        {
            skill = new Skill
            {
                Id = Guid.NewGuid(),
                Name = request.SkillName.Trim(),
                NormalizedName = normalizedName,
                CreatedAt = now,
                UpdatedAt = now
            };
            _db.Skills.Add(skill);
        }

        // Duplicate check on this profile
        if (profile.Skills.Any(cs => cs.SkillId == skill.Id))
            return Error.Conflict("Skills.AlreadyAdded", "Kỹ năng này đã có trong hồ sơ của bạn.");

        // FIX N7: normalize ProficiencyLevel to lowercase before storing
        var normalizedLevel = request.ProficiencyLevel?.Trim().ToLowerInvariant();

        var candidateSkill = new CandidateSkill
        {
            Id = Guid.NewGuid(),
            CandidateProfileId = profile.Id,
            SkillId = skill.Id,
            ProficiencyLevel = normalizedLevel,
            YearsUsed = request.YearsUsed,
            LastUsedYear = request.LastUsedYear,
            CreatedAt = now,
            UpdatedAt = now
        };
        _db.CandidateSkills.Add(candidateSkill);

        // Recalculate completeness with both user and profile data
        profile.CompletenessScore = ProfileCompletenessHelper.Calculate(user, profile);
        profile.UpdatedAt = now;

        await _db.SaveChangesAsync(cancellationToken);
        return new SkillDto(candidateSkill.Id, skill.Name, normalizedLevel, request.YearsUsed, request.LastUsedYear);
    }
}

// ── Update Skill ──────────────────────────────────────────────────────────────
public sealed record UpdateSkillCommand(
    Guid SkillId,
    string? ProficiencyLevel,
    decimal? YearsUsed,
    int? LastUsedYear
) : IRequest<Result>;

public sealed class UpdateSkillCommandValidator : AbstractValidator<UpdateSkillCommand>
{
    private static readonly string[] ValidLevels = ["beginner", "intermediate", "advanced", "expert"];

    public UpdateSkillCommandValidator()
    {
        When(x => x.ProficiencyLevel is not null, () =>
            RuleFor(x => x.ProficiencyLevel!)
                .Must(p => ValidLevels.Contains(p.Trim().ToLowerInvariant()))
                .WithMessage("Mức thành thạo phải là một trong: beginner, intermediate, advanced, expert."));
        When(x => x.YearsUsed is not null, () =>
            RuleFor(x => x.YearsUsed!.Value).GreaterThanOrEqualTo(0).LessThanOrEqualTo(50));
    }
}

public sealed class UpdateSkillCommandHandler : IRequestHandler<UpdateSkillCommand, Result>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IDateTimeProvider _dt;

    public UpdateSkillCommandHandler(IAppDbContext db, ICurrentUserService currentUser, IDateTimeProvider dt)
    {
        _db = db;
        _currentUser = currentUser;
        _dt = dt;
    }

    public async Task<Result> Handle(UpdateSkillCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;

        var profile = await _db.CandidateProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
        if (profile is null) return Error.NotFound("Profile.NotFound", "Không tìm thấy hồ sơ ứng viên.");

        var cs = await _db.CandidateSkills
            .FirstOrDefaultAsync(s => s.Id == request.SkillId && s.CandidateProfileId == profile.Id, cancellationToken);
        if (cs is null) return Error.NotFound("Skills.NotFound", "Kỹ năng không tồn tại trong hồ sơ của bạn.");

        // FIX N7: normalize on update too
        if (request.ProficiencyLevel is not null)
            cs.ProficiencyLevel = request.ProficiencyLevel.Trim().ToLowerInvariant();
        if (request.YearsUsed is not null) cs.YearsUsed = request.YearsUsed;
        if (request.LastUsedYear is not null) cs.LastUsedYear = request.LastUsedYear;
        cs.UpdatedAt = _dt.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

// ── Delete Skill ──────────────────────────────────────────────────────────────
public sealed record DeleteSkillCommand(Guid SkillId) : IRequest<Result>;

public sealed class DeleteSkillCommandHandler : IRequestHandler<DeleteSkillCommand, Result>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public DeleteSkillCommandHandler(IAppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(DeleteSkillCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        var profile = await _db.CandidateProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
        if (profile is null) return Error.NotFound("Profile.NotFound", "Không tìm thấy hồ sơ ứng viên.");

        var cs = await _db.CandidateSkills
            .FirstOrDefaultAsync(s => s.Id == request.SkillId && s.CandidateProfileId == profile.Id, cancellationToken);
        if (cs is null) return Error.NotFound("Skills.NotFound", "Kỹ năng không tồn tại trong hồ sơ của bạn.");

        _db.CandidateSkills.Remove(cs);
        await _db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
