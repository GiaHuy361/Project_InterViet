namespace Interviet.Contracts.Profile;

public sealed record ProfileResponse(
    Guid ProfileId,
    Guid UserId,
    string FullName,
    string Email,
    string? PhoneNumber,
    string? AvatarUrl,
    string? Headline,
    string? Summary,
    string? DesiredRole,
    decimal? YearsOfExperience,
    string? CurrentLocation,
    string? PreferredLocation,
    decimal? SalaryExpectationMin,
    decimal? SalaryExpectationMax,
    decimal CompletenessScore,
    IReadOnlyList<SkillDto> Skills,
    IReadOnlyList<EducationDto> Educations,
    IReadOnlyList<WorkExperienceDto> WorkExperiences,
    IReadOnlyList<ExternalLinkDto> ExternalLinks
);

public sealed record SkillDto(
    Guid Id,
    string SkillName,
    string? ProficiencyLevel,
    decimal? YearsUsed,
    int? LastUsedYear
);

public sealed record EducationDto(
    Guid Id,
    string SchoolName,
    string? Degree,
    string? FieldOfStudy,
    DateOnly? StartDate,
    DateOnly? EndDate,
    string? Grade,
    string? Description
);

public sealed record WorkExperienceDto(
    Guid Id,
    string CompanyName,
    string JobTitle,
    string? EmploymentType,
    DateOnly? StartDate,
    DateOnly? EndDate,
    bool IsCurrent,
    string? Description,
    string? MetricsSummary
);

public sealed record ExternalLinkDto(
    Guid Id,
    string LinkType,
    string? Title,
    string Url
);
