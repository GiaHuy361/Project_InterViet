using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Profile;
using Interviet.Shared.Results;

namespace Interviet.Application.Profile.Queries.GetProfile;

public sealed record GetProfileQuery : IRequest<Result<ProfileResponse>>;

public sealed class GetProfileQueryHandler : IRequestHandler<GetProfileQuery, Result<ProfileResponse>>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetProfileQueryHandler(IAppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Result<ProfileResponse>> Handle(
        GetProfileQuery request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;

        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user is null)
            return Error.NotFound("Profile.UserNotFound", "User not found.");

        var profile = await _db.CandidateProfiles
            .AsNoTracking()
            .Include(p => p.Skills).ThenInclude(cs => cs.Skill)
            .Include(p => p.Educations)
            .Include(p => p.WorkExperiences)
            .Include(p => p.Links)
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        if (profile is null)
            return Error.NotFound("Profile.NotFound", "Candidate profile not found.");

        var skills = profile.Skills.Select(cs => new SkillDto(
            cs.Id,
            cs.Skill?.Name ?? "",
            cs.ProficiencyLevel,
            cs.YearsUsed,
            cs.LastUsedYear)).ToList();

        var educations = profile.Educations.Select(e => new EducationDto(
            e.Id, e.SchoolName, e.Degree, e.FieldOfStudy,
            e.StartDate, e.EndDate, e.Grade, e.Description)).ToList();

        var experiences = profile.WorkExperiences.Select(w => new WorkExperienceDto(
            w.Id, w.CompanyName, w.JobTitle, w.EmploymentType,
            w.StartDate, w.EndDate, w.IsCurrent, w.Description, w.MetricsSummary)).ToList();

        var links = profile.Links.Select(l => new ExternalLinkDto(
            l.Id, l.LinkType, l.Title, l.Url)).ToList();

        return new ProfileResponse(
            profile.Id, userId,
            user.FullName, user.Email, user.PhoneNumber, user.AvatarUrl,
            profile.Headline, profile.Summary, profile.DesiredRole,
            profile.YearsOfExperience, profile.CurrentLocation, profile.PreferredLocation,
            profile.SalaryExpectationMin, profile.SalaryExpectationMax,
            profile.CompletenessScore,
            skills, educations, experiences, links);
    }
}
