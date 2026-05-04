using Interviet.Domain.Common;

namespace Interviet.Domain.Profiles;

public class CandidateProfile : AuditableEntity
{
    public Guid UserId { get; set; }
    public string? Headline { get; set; }
    public string? Summary { get; set; }
    public string? DesiredRole { get; set; }
    public decimal? YearsOfExperience { get; set; }
    public string? CurrentLocation { get; set; }
    public string? PreferredLocation { get; set; }
    public decimal? SalaryExpectationMin { get; set; }
    public decimal? SalaryExpectationMax { get; set; }
    public decimal CompletenessScore { get; set; }

    public ICollection<CandidateSkill> Skills { get; set; } = [];
    public ICollection<Education> Educations { get; set; } = [];
    public ICollection<WorkExperience> WorkExperiences { get; set; } = [];
    public ICollection<Certification> Certifications { get; set; } = [];
    public ICollection<LanguageProfile> Languages { get; set; } = [];
    public ICollection<ExternalLink> Links { get; set; } = [];
}

public class Skill : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string NormalizedName { get; set; } = string.Empty;
    public string? SkillType { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class CandidateSkill : BaseEntity
{
    public Guid CandidateProfileId { get; set; }
    public Guid SkillId { get; set; }
    public string? ProficiencyLevel { get; set; }
    public decimal? YearsUsed { get; set; }
    public int? LastUsedYear { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public CandidateProfile CandidateProfile { get; set; } = null!;
    public Skill Skill { get; set; } = null!;
}

public class Education : BaseEntity
{
    public Guid CandidateProfileId { get; set; }
    public string SchoolName { get; set; } = string.Empty;
    public string? Degree { get; set; }
    public string? FieldOfStudy { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? Grade { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public CandidateProfile CandidateProfile { get; set; } = null!;
}

public class WorkExperience : BaseEntity
{
    public Guid CandidateProfileId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public string? EmploymentType { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public bool IsCurrent { get; set; }
    public string? Description { get; set; }
    public string? MetricsSummary { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public CandidateProfile CandidateProfile { get; set; } = null!;
}

public class Certification : BaseEntity
{
    public Guid CandidateProfileId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Issuer { get; set; }
    public DateOnly? IssuedDate { get; set; }
    public DateOnly? ExpiryDate { get; set; }
    public string? CredentialId { get; set; }
    public string? CredentialUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public CandidateProfile CandidateProfile { get; set; } = null!;
}

public class LanguageProfile : BaseEntity
{
    public Guid CandidateProfileId { get; set; }
    public string LanguageCode { get; set; } = string.Empty;
    public string LanguageName { get; set; } = string.Empty;
    public string? ProficiencyLevel { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public CandidateProfile CandidateProfile { get; set; } = null!;
}

public class ExternalLink : BaseEntity
{
    public Guid CandidateProfileId { get; set; }
    public string LinkType { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string Url { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public CandidateProfile CandidateProfile { get; set; } = null!;
}
