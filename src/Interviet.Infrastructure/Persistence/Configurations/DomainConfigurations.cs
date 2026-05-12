using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Interviet.Domain.Resumes;
using Interviet.Domain.Matching;
using Interviet.Domain.Interviews;
using Interviet.Domain.Mentors;

namespace Interviet.Infrastructure.Persistence.Configurations;

// ── Resumes ──────────────────────────────────────────────────────────────────
public class UploadedFileConfiguration : IEntityTypeConfiguration<UploadedFile>
{
    public void Configure(EntityTypeBuilder<UploadedFile> b)
    {
        b.ToTable("UploadedFiles");
        b.HasKey(x => x.Id);
        b.Property(x => x.FileCategory).HasMaxLength(50).IsRequired();
        b.Property(x => x.OriginalFileName).HasMaxLength(260).IsRequired();
        b.Property(x => x.StoredFileName).HasMaxLength(260).IsRequired();
        b.Property(x => x.StorageProvider).HasMaxLength(50).IsRequired();
        b.Property(x => x.StoragePath).HasMaxLength(500).IsRequired();
        b.Property(x => x.MimeType).HasMaxLength(150).IsRequired();
        b.Property(x => x.FileExtension).HasMaxLength(20).IsRequired();
        b.Property(x => x.Sha256Hash).HasMaxLength(128);
        b.HasIndex(x => new { x.UserId, x.CreatedAt });
    }
}

public class ResumeConfiguration : IEntityTypeConfiguration<Resume>
{
    public void Configure(EntityTypeBuilder<Resume> b)
    {
        b.ToTable("Resumes");
        b.HasKey(x => x.Id);
        b.Property(x => x.Title).HasMaxLength(200).IsRequired();
        b.Property(x => x.VersionNumber).IsRequired().HasDefaultValue(1);
        b.HasMany(x => x.Versions).WithOne(v => v.Resume).HasForeignKey(v => v.ResumeId);
        b.HasOne(x => x.ActiveVersion).WithMany().HasForeignKey(x => x.ActiveVersionId)
         .OnDelete(DeleteBehavior.NoAction);
        b.HasIndex(x => x.UserId);
        b.HasIndex(x => new { x.UserId, x.IsActive });
        b.HasIndex(x => new { x.UserId, x.IsActive, x.CreatedAt });
    }
}

public class ResumeVersionConfiguration : IEntityTypeConfiguration<ResumeVersion>
{
    public void Configure(EntityTypeBuilder<ResumeVersion> b)
    {
        b.ToTable("ResumeVersions");
        b.HasKey(x => x.Id);
        b.Property(x => x.ParseStatus).HasMaxLength(30).IsRequired();
        b.Property(x => x.Source).HasMaxLength(30).IsRequired().HasDefaultValue("upload");
        b.Property(x => x.ContentType).HasMaxLength(150);
        b.Property(x => x.ProcessingError).HasMaxLength(1000);
        b.HasIndex(x => new { x.ResumeId, x.VersionNumber }).IsUnique();
        b.HasIndex(x => new { x.ResumeId, x.CreatedAt });
        b.HasOne(x => x.UploadedFile).WithMany().HasForeignKey(x => x.UploadedFileId).OnDelete(DeleteBehavior.NoAction);
    }
}

public class ResumeParsedDataConfiguration : IEntityTypeConfiguration<ResumeParsedData>
{
    public void Configure(EntityTypeBuilder<ResumeParsedData> b)
    {
        b.ToTable("ResumeParsedData");
        b.HasKey(x => x.Id);
        b.Property(x => x.DetectedLanguage).HasMaxLength(20);
        b.Property(x => x.ModelVersion).HasMaxLength(100);
        b.Property(x => x.SchemaVersion).HasMaxLength(50);
        // JSON columns — stored as nvarchar(max)
        b.Property(x => x.RawText).HasColumnType("nvarchar(max)");
        b.Property(x => x.SectionsJson).HasColumnType("nvarchar(max)");
        b.Property(x => x.SkillsJson).HasColumnType("nvarchar(max)");
        b.Property(x => x.ExperiencesJson).HasColumnType("nvarchar(max)");
        b.Property(x => x.EducationsJson).HasColumnType("nvarchar(max)");
        b.Property(x => x.ProjectsJson).HasColumnType("nvarchar(max)");
        b.Property(x => x.CertificationsJson).HasColumnType("nvarchar(max)");
        b.Property(x => x.LanguagesJson).HasColumnType("nvarchar(max)");
        b.Property(x => x.WarningsJson).HasColumnType("nvarchar(max)");
        b.HasIndex(x => x.ResumeId).IsUnique(); // 1 parsed result per resume
        b.HasIndex(x => x.ResumeVersionId);
        b.HasOne(x => x.Resume).WithMany().HasForeignKey(x => x.ResumeId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.ResumeVersion).WithMany().HasForeignKey(x => x.ResumeVersionId).OnDelete(DeleteBehavior.NoAction);
    }
}

public class ResumeParseJobConfiguration : IEntityTypeConfiguration<ResumeParseJob>
{
    public void Configure(EntityTypeBuilder<ResumeParseJob> b)
    {
        b.ToTable("ResumeParseJobs");
        b.HasKey(x => x.Id);
        b.Property(x => x.Status).HasMaxLength(30).IsRequired();
        b.Property(x => x.Provider).HasMaxLength(50).IsRequired().HasDefaultValue("python");
        b.Property(x => x.ExternalJobId).HasMaxLength(100);
        b.Property(x => x.CorrelationId).HasMaxLength(100);
        b.Property(x => x.RequestId).HasMaxLength(100);
        b.Property(x => x.ErrorCode).HasMaxLength(100);
        b.Property(x => x.ErrorMessage).HasMaxLength(1000);
        b.Property(x => x.ModelVersion).HasMaxLength(100);
        b.Property(x => x.SchemaVersion).HasMaxLength(50);
        b.HasIndex(x => x.ResumeId);
        b.HasIndex(x => x.UserId);
        b.HasIndex(x => x.Status);
        b.HasOne(x => x.ResumeVersion).WithMany().HasForeignKey(x => x.ResumeVersionId).OnDelete(DeleteBehavior.NoAction);
    }
}

public class ResumeOptimizationSessionConfiguration : IEntityTypeConfiguration<ResumeOptimizationSession>
{
    public void Configure(EntityTypeBuilder<ResumeOptimizationSession> b)
    {
        b.ToTable("ResumeOptimizationSessions");
        b.HasKey(x => x.Id);
    }
}

// ── Matching ─────────────────────────────────────────────────────────────────
public class JobDescriptionConfiguration : IEntityTypeConfiguration<JobDescription>
{
    public void Configure(EntityTypeBuilder<JobDescription> b)
    {
        b.ToTable("JobDescriptions");
        b.HasKey(x => x.Id);
        b.Property(x => x.Title).HasMaxLength(250);
        b.Property(x => x.CompanyName).HasMaxLength(250);
        b.Property(x => x.Location).HasMaxLength(200);
        b.Property(x => x.SalaryText).HasMaxLength(100);
        b.Property(x => x.SourceUrl).HasMaxLength(500);
        b.HasIndex(x => new { x.UserId, x.CreatedAt });
    }
}

public class JobBookmarkConfiguration : IEntityTypeConfiguration<JobBookmark>
{
    public void Configure(EntityTypeBuilder<JobBookmark> b)
    {
        b.ToTable("JobBookmarks");
        b.HasKey(x => x.Id);
        b.HasIndex(x => new { x.UserId, x.JobDescriptionId }).IsUnique();
    }
}

public class MatchSessionConfiguration : IEntityTypeConfiguration<MatchSession>
{
    public void Configure(EntityTypeBuilder<MatchSession> b)
    {
        b.ToTable("MatchSessions");
        b.HasKey(x => x.Id);
        b.Property(x => x.SessionType).HasMaxLength(20).IsRequired();
        b.Property(x => x.Status).HasMaxLength(30).IsRequired();
        b.Property(x => x.OverallBestScore).HasColumnType("decimal(5,2)");
        b.Property(x => x.ExternalJobId).HasMaxLength(100);
        b.Property(x => x.CorrelationId).HasMaxLength(100);
        b.Property(x => x.RequestId).HasMaxLength(100);
        b.Property(x => x.ErrorCode).HasMaxLength(100);
        b.Property(x => x.ErrorMessage).HasMaxLength(1000);
        b.HasMany(x => x.Targets).WithOne(t => t.MatchSession).HasForeignKey(t => t.MatchSessionId);
        b.HasIndex(x => new { x.UserId, x.RequestedAt });
        b.HasIndex(x => new { x.Status, x.RequestedAt });
        b.HasIndex(x => new { x.ResumeId, x.RequestedAt });
        b.HasIndex(x => new { x.JobDescriptionId, x.RequestedAt });
    }
}

public class MatchTargetConfiguration : IEntityTypeConfiguration<MatchTarget>
{
    public void Configure(EntityTypeBuilder<MatchTarget> b)
    {
        b.ToTable("MatchTargets");
        b.HasKey(x => x.Id);
        b.HasIndex(x => new { x.MatchSessionId, x.JobDescriptionId }).IsUnique();
        // MatchResult has MatchTargetId FK; no navigation from MatchTarget.Result in this direction
        // Navigation MatchTarget.Result is configured via MatchResultConfiguration
    }
}

public class MatchResultConfiguration : IEntityTypeConfiguration<MatchResult>
{
    public void Configure(EntityTypeBuilder<MatchResult> b)
    {
        b.ToTable("MatchResults");
        b.HasKey(x => x.Id);
        b.Property(x => x.TotalScore).HasColumnType("decimal(5,2)");
        b.Property(x => x.TechnicalScore).HasColumnType("decimal(5,2)");
        b.Property(x => x.ExperienceScore).HasColumnType("decimal(5,2)");
        b.Property(x => x.EducationScore).HasColumnType("decimal(5,2)");
        b.Property(x => x.SoftSkillScore).HasColumnType("decimal(5,2)");
        b.Property(x => x.LanguageScore).HasColumnType("decimal(5,2)");
        b.Property(x => x.MatchBand).HasMaxLength(20);
        b.Property(x => x.SchemaVersion).HasMaxLength(30);
        b.Property(x => x.ModelVersion).HasMaxLength(100);
        // New JSON columns
        b.Property(x => x.SummaryText).HasColumnType("nvarchar(max)");
        b.Property(x => x.MatchedSkillsJson).HasColumnType("nvarchar(max)");
        // Existing JSON columns
        b.Property(x => x.StrengthsJson).HasColumnType("nvarchar(max)");
        b.Property(x => x.WeaknessesJson).HasColumnType("nvarchar(max)");
        b.Property(x => x.MissingSkillsJson).HasColumnType("nvarchar(max)");
        b.Property(x => x.SuggestionsJson).HasColumnType("nvarchar(max)");
        b.Property(x => x.RawResponseJson).HasColumnType("nvarchar(max)");
        b.HasIndex(x => x.MatchTargetId).IsUnique();
        b.HasIndex(x => new { x.MatchSessionId, x.TotalScore });
        b.HasMany(x => x.Insights).WithOne().HasForeignKey(i => i.MatchResultId);
        // FK from MatchResult → MatchTarget
        b.HasOne<MatchTarget>().WithOne(t => t.Result)
         .HasForeignKey<MatchResult>(r => r.MatchTargetId)
         .OnDelete(DeleteBehavior.NoAction);
    }
}

public class MatchInsightConfiguration : IEntityTypeConfiguration<MatchInsight>
{
    public void Configure(EntityTypeBuilder<MatchInsight> b)
    {
        b.ToTable("MatchInsights");
        b.HasKey(x => x.Id);
        b.Property(x => x.InsightType).HasMaxLength(50).IsRequired();
        b.Property(x => x.Title).HasMaxLength(250).IsRequired();
    }
}

// ── Interview ────────────────────────────────────────────────────────────────
public class InterviewSessionConfiguration : IEntityTypeConfiguration<InterviewSession>
{
    public void Configure(EntityTypeBuilder<InterviewSession> b)
    {
        b.ToTable("InterviewSessions");
        b.HasKey(x => x.Id);
        b.Property(x => x.RoleName).HasMaxLength(150).IsRequired();
        b.Property(x => x.SeniorityLevel).HasMaxLength(50).IsRequired();
        b.Property(x => x.InterviewType).HasMaxLength(50).IsRequired();
        b.Property(x => x.Mode).HasMaxLength(50).IsRequired();
        b.Property(x => x.AiModel).HasMaxLength(100);
        b.Property(x => x.InterviewerMode).HasMaxLength(100);
        b.Property(x => x.Status).HasMaxLength(30).IsRequired();
        b.Property(x => x.ExternalSessionId).HasMaxLength(100);
        b.Property(x => x.CorrelationId).HasMaxLength(100);
        b.HasIndex(x => new { x.UserId, x.CreatedAt });
        b.HasIndex(x => new { x.Status, x.UpdatedAt });
        b.HasIndex(x => new { x.UserId, x.Status });
        b.HasOne(x => x.Transcript).WithOne().HasForeignKey<InterviewTranscript>(t => t.InterviewSessionId);
        b.HasOne(x => x.Report).WithOne().HasForeignKey<InterviewReport>(r => r.InterviewSessionId);
        b.HasMany(x => x.Questions).WithOne(q => q.Session).HasForeignKey(q => q.InterviewSessionId);
    }
}

public class InterviewQuestionConfiguration : IEntityTypeConfiguration<InterviewQuestion>
{
    public void Configure(EntityTypeBuilder<InterviewQuestion> b)
    {
        b.ToTable("InterviewQuestions");
        b.HasKey(x => x.Id);
        b.Property(x => x.QuestionType).HasMaxLength(50).IsRequired();
        b.Property(x => x.QuestionText).HasColumnType("nvarchar(max)").IsRequired();
        b.Property(x => x.ExpectedAnswerPointsJson).HasColumnType("nvarchar(max)");
        b.Property(x => x.Difficulty).HasMaxLength(20);
        b.HasIndex(x => new { x.InterviewSessionId, x.QuestionNumber }).IsUnique();
        b.HasOne(x => x.Answer).WithOne(a => a.Question)
         .HasForeignKey<InterviewAnswer>(a => a.InterviewQuestionId)
         .OnDelete(DeleteBehavior.Cascade);
    }
}

public class InterviewAnswerConfiguration : IEntityTypeConfiguration<InterviewAnswer>
{
    public void Configure(EntityTypeBuilder<InterviewAnswer> b)
    {
        b.ToTable("InterviewAnswers");
        b.HasKey(x => x.Id);
        b.Property(x => x.AnswerText).HasColumnType("nvarchar(max)");
        b.Property(x => x.AudioFileUrl).HasMaxLength(500);
        b.Property(x => x.Feedback).HasColumnType("nvarchar(max)");
        b.Property(x => x.PositivePointsJson).HasColumnType("nvarchar(max)");
        b.Property(x => x.NegativePointsJson).HasColumnType("nvarchar(max)");
        b.Property(x => x.SuggestionsJson).HasColumnType("nvarchar(max)");
        b.Property(x => x.TranscriptionConfidence).HasColumnType("decimal(5,4)");
        b.Property(x => x.AnswerScore).HasColumnType("decimal(5,2)");
        b.Property(x => x.ClarityScore).HasColumnType("decimal(5,2)");
        b.Property(x => x.RelevanceScore).HasColumnType("decimal(5,2)");
        b.Property(x => x.CompletenessScore).HasColumnType("decimal(5,2)");
        b.HasIndex(x => x.InterviewQuestionId).IsUnique();
    }
}

public class InterviewTranscriptConfiguration : IEntityTypeConfiguration<InterviewTranscript>
{
    public void Configure(EntityTypeBuilder<InterviewTranscript> b)
    {
        b.ToTable("InterviewTranscripts");
        b.HasKey(x => x.Id);
        b.Property(x => x.TranscriptLanguage).HasMaxLength(20);
        b.HasMany(x => x.Segments).WithOne().HasForeignKey(s => s.InterviewTranscriptId);
    }
}

public class InterviewTranscriptSegmentConfiguration : IEntityTypeConfiguration<InterviewTranscriptSegment>
{
    public void Configure(EntityTypeBuilder<InterviewTranscriptSegment> b)
    {
        b.ToTable("InterviewTranscriptSegments");
        b.HasKey(x => x.Id);
        b.Property(x => x.Speaker).HasMaxLength(20).IsRequired();
        b.Property(x => x.StartedAtSeconds).HasColumnType("decimal(10,2)");
        b.Property(x => x.EndedAtSeconds).HasColumnType("decimal(10,2)");
        b.HasIndex(x => new { x.InterviewTranscriptId, x.SegmentOrder }).IsUnique();
    }
}

public class InterviewReportConfiguration : IEntityTypeConfiguration<InterviewReport>
{
    public void Configure(EntityTypeBuilder<InterviewReport> b)
    {
        b.ToTable("InterviewReports");
        b.HasKey(x => x.Id);
        b.Property(x => x.OverallScore).HasColumnType("decimal(5,2)");
        b.Property(x => x.ConfidenceScore).HasColumnType("decimal(5,2)");
        b.Property(x => x.VoiceClarityScore).HasColumnType("decimal(5,2)");
        b.Property(x => x.PaceScore).HasColumnType("decimal(5,2)");
        b.Property(x => x.FillerWordScore).HasColumnType("decimal(5,2)");
        b.Property(x => x.SchemaVersion).HasMaxLength(30);
        b.Property(x => x.ModelVersion).HasMaxLength(100);
        b.HasMany(x => x.ScoreBreakdowns).WithOne().HasForeignKey(s => s.InterviewReportId);
        b.HasMany(x => x.FeedbackItems).WithOne().HasForeignKey(f => f.InterviewReportId);
    }
}

public class InterviewScoreBreakdownConfiguration : IEntityTypeConfiguration<InterviewScoreBreakdown>
{
    public void Configure(EntityTypeBuilder<InterviewScoreBreakdown> b)
    {
        b.ToTable("InterviewScoreBreakdowns");
        b.HasKey(x => x.Id);
        b.Property(x => x.DimensionCode).HasMaxLength(50).IsRequired();
        b.Property(x => x.DimensionName).HasMaxLength(100).IsRequired();
        b.Property(x => x.Score).HasColumnType("decimal(5,2)");
        b.Property(x => x.MaxScore).HasColumnType("decimal(5,2)");
    }
}

public class InterviewFeedbackItemConfiguration : IEntityTypeConfiguration<InterviewFeedbackItem>
{
    public void Configure(EntityTypeBuilder<InterviewFeedbackItem> b)
    {
        b.ToTable("InterviewFeedbackItems");
        b.HasKey(x => x.Id);
        b.Property(x => x.Category).HasMaxLength(50).IsRequired();
        b.Property(x => x.Title).HasMaxLength(250).IsRequired();
        b.Property(x => x.PriorityLevel).HasMaxLength(30);
    }
}

// ── Mentor ───────────────────────────────────────────────────────────────────
public class MentorConfiguration : IEntityTypeConfiguration<Mentor>
{
    public void Configure(EntityTypeBuilder<Mentor> b)
    {
        b.ToTable("Mentors");
        b.HasKey(x => x.Id);
        b.Property(x => x.FullName).HasMaxLength(200).IsRequired();
        b.Property(x => x.Headline).HasMaxLength(250);
        b.Property(x => x.YearsOfExperience).HasColumnType("decimal(5,2)");
        b.Property(x => x.RatingAverage).HasColumnType("decimal(4,2)");
        b.HasMany(x => x.AvailabilitySlots).WithOne(s => s.Mentor).HasForeignKey(s => s.MentorId);
        b.HasMany(x => x.Bookings).WithOne(bk => bk.Mentor).HasForeignKey(bk => bk.MentorId);
    }
}

public class MentorAvailabilitySlotConfiguration : IEntityTypeConfiguration<MentorAvailabilitySlot>
{
    public void Configure(EntityTypeBuilder<MentorAvailabilitySlot> b)
    {
        b.ToTable("MentorAvailabilitySlots");
        b.HasKey(x => x.Id);
        b.Property(x => x.Status).HasMaxLength(30).IsRequired();
        b.HasIndex(x => new { x.MentorId, x.StartsAt });
    }
}

public class MentorBookingConfiguration : IEntityTypeConfiguration<MentorBooking>
{
    public void Configure(EntityTypeBuilder<MentorBooking> b)
    {
        b.ToTable("MentorBookings");
        b.HasKey(x => x.Id);
        b.Property(x => x.Status).HasMaxLength(30).IsRequired();
        b.Property(x => x.MeetingMode).HasMaxLength(30);
        b.Property(x => x.MeetingLink).HasMaxLength(500);
        b.HasOne(x => x.Review).WithOne()
         .HasForeignKey<MentorReview>(r => r.MentorBookingId)
         .OnDelete(DeleteBehavior.Cascade);
        b.HasIndex(x => new { x.UserId, x.ScheduledStartsAt });
    }
}

public class MentorReviewConfiguration : IEntityTypeConfiguration<MentorReview>
{
    public void Configure(EntityTypeBuilder<MentorReview> b)
    {
        b.ToTable("MentorReviews");
        b.HasKey(x => x.Id);
        b.HasIndex(x => x.MentorBookingId).IsUnique();
    }
}
