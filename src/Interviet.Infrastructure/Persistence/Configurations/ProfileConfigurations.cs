using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Interviet.Domain.Profiles;

namespace Interviet.Infrastructure.Persistence.Configurations;

public class CandidateProfileConfiguration : IEntityTypeConfiguration<CandidateProfile>
{
    public void Configure(EntityTypeBuilder<CandidateProfile> b)
    {
        b.ToTable("CandidateProfiles");
        b.HasKey(x => x.Id);
        b.Property(x => x.Headline).HasMaxLength(250);
        b.Property(x => x.DesiredRole).HasMaxLength(200);
        b.Property(x => x.CurrentLocation).HasMaxLength(200);
        b.Property(x => x.PreferredLocation).HasMaxLength(200);
        b.Property(x => x.CompletenessScore).HasColumnType("decimal(5,2)").HasDefaultValue(0m);
        b.Property(x => x.YearsOfExperience).HasColumnType("decimal(5,2)");
        b.Property(x => x.SalaryExpectationMin).HasColumnType("decimal(18,2)");
        b.Property(x => x.SalaryExpectationMax).HasColumnType("decimal(18,2)");
        b.HasIndex(x => x.UserId).IsUnique();
    }
}

public class SkillConfiguration : IEntityTypeConfiguration<Skill>
{
    public void Configure(EntityTypeBuilder<Skill> b)
    {
        b.ToTable("Skills");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).HasMaxLength(150).IsRequired();
        b.Property(x => x.NormalizedName).HasMaxLength(150).IsRequired();
        b.Property(x => x.SkillType).HasMaxLength(50);
        b.HasIndex(x => x.NormalizedName).IsUnique();
    }
}

public class CandidateSkillConfiguration : IEntityTypeConfiguration<CandidateSkill>
{
    public void Configure(EntityTypeBuilder<CandidateSkill> b)
    {
        b.ToTable("CandidateSkills");
        b.HasKey(x => x.Id);
        b.Property(x => x.ProficiencyLevel).HasMaxLength(30);
        b.Property(x => x.YearsUsed).HasColumnType("decimal(5,2)");
        b.HasIndex(x => new { x.CandidateProfileId, x.SkillId }).IsUnique();
        b.HasOne(x => x.CandidateProfile).WithMany(p => p.Skills).HasForeignKey(x => x.CandidateProfileId);
        b.HasOne(x => x.Skill).WithMany().HasForeignKey(x => x.SkillId);
    }
}

public class EducationConfiguration : IEntityTypeConfiguration<Education>
{
    public void Configure(EntityTypeBuilder<Education> b)
    {
        b.ToTable("Educations");
        b.HasKey(x => x.Id);
        b.Property(x => x.SchoolName).HasMaxLength(250).IsRequired();
        b.Property(x => x.Degree).HasMaxLength(150);
        b.Property(x => x.FieldOfStudy).HasMaxLength(150);
        b.Property(x => x.Grade).HasMaxLength(50);
        b.HasOne(x => x.CandidateProfile).WithMany(p => p.Educations).HasForeignKey(x => x.CandidateProfileId);
    }
}

public class WorkExperienceConfiguration : IEntityTypeConfiguration<WorkExperience>
{
    public void Configure(EntityTypeBuilder<WorkExperience> b)
    {
        b.ToTable("WorkExperiences");
        b.HasKey(x => x.Id);
        b.Property(x => x.CompanyName).HasMaxLength(250).IsRequired();
        b.Property(x => x.JobTitle).HasMaxLength(200).IsRequired();
        b.Property(x => x.EmploymentType).HasMaxLength(50);
        b.HasIndex(x => new { x.CandidateProfileId, x.StartDate });
        b.HasOne(x => x.CandidateProfile).WithMany(p => p.WorkExperiences).HasForeignKey(x => x.CandidateProfileId);
    }
}

public class CertificationConfiguration : IEntityTypeConfiguration<Certification>
{
    public void Configure(EntityTypeBuilder<Certification> b)
    {
        b.ToTable("Certifications");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).HasMaxLength(250).IsRequired();
        b.Property(x => x.Issuer).HasMaxLength(250);
        b.Property(x => x.CredentialId).HasMaxLength(100);
        b.Property(x => x.CredentialUrl).HasMaxLength(500);
        b.HasOne(x => x.CandidateProfile).WithMany(p => p.Certifications).HasForeignKey(x => x.CandidateProfileId);
    }
}

public class LanguageProfileConfiguration : IEntityTypeConfiguration<LanguageProfile>
{
    public void Configure(EntityTypeBuilder<LanguageProfile> b)
    {
        b.ToTable("LanguageProfiles");
        b.HasKey(x => x.Id);
        b.Property(x => x.LanguageCode).HasMaxLength(20).IsRequired();
        b.Property(x => x.LanguageName).HasMaxLength(100).IsRequired();
        b.Property(x => x.ProficiencyLevel).HasMaxLength(30);
        b.HasOne(x => x.CandidateProfile).WithMany(p => p.Languages).HasForeignKey(x => x.CandidateProfileId);
    }
}

public class ExternalLinkConfiguration : IEntityTypeConfiguration<ExternalLink>
{
    public void Configure(EntityTypeBuilder<ExternalLink> b)
    {
        b.ToTable("ExternalLinks");
        b.HasKey(x => x.Id);
        b.Property(x => x.LinkType).HasMaxLength(50).IsRequired();
        b.Property(x => x.Title).HasMaxLength(150);
        b.Property(x => x.Url).HasMaxLength(500).IsRequired();
        b.HasOne(x => x.CandidateProfile).WithMany(p => p.Links).HasForeignKey(x => x.CandidateProfileId);
    }
}
