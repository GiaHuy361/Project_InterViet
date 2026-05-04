namespace Interviet.Contracts.Profile;

public sealed record UpdateProfileRequest(
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
);

public sealed record AddSkillRequest(
    string SkillName,
    string? ProficiencyLevel,
    decimal? YearsUsed,
    int? LastUsedYear
);

public sealed record UpdateSkillRequest(
    string? ProficiencyLevel,
    decimal? YearsUsed,
    int? LastUsedYear
);

public sealed record AddEducationRequest(
    string SchoolName,
    string? Degree,
    string? FieldOfStudy,
    DateOnly? StartDate,
    DateOnly? EndDate,
    string? Grade,
    string? Description
);

public sealed record UpdateEducationRequest(
    string? SchoolName,
    string? Degree,
    string? FieldOfStudy,
    DateOnly? StartDate,
    DateOnly? EndDate,
    string? Grade,
    string? Description
);

public sealed record AddWorkExperienceRequest(
    string CompanyName,
    string JobTitle,
    string? EmploymentType,
    DateOnly? StartDate,
    DateOnly? EndDate,
    bool IsCurrent,
    string? Description,
    string? MetricsSummary
);

public sealed record UpdateWorkExperienceRequest(
    string? CompanyName,
    string? JobTitle,
    string? EmploymentType,
    DateOnly? StartDate,
    DateOnly? EndDate,
    bool? IsCurrent,
    string? Description,
    string? MetricsSummary
);

public sealed record AddExternalLinkRequest(
    string LinkType,
    string? Title,
    string Url
);

public sealed record UpdateExternalLinkRequest(
    string? LinkType,
    string? Title,
    string? Url
);
