using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Domain.Identity;
using Interviet.Domain.Profiles;
using Interviet.Domain.Resumes;
using Interviet.Domain.Matching;
using Interviet.Domain.Interviews;
using Interviet.Domain.Mentors;
using Interviet.Domain.Billing;
using Interviet.Domain.Quotas;
using Interviet.Domain.Notifications;
using Interviet.Domain.Support;
using Interviet.Domain.Dashboard;
using Interviet.Domain.AiIntegration;

namespace Interviet.Infrastructure.Persistence;

/// <summary>
/// Central EF Core DbContext. Default schema is "app" matching the SQL Server bootstrap script.
/// All tables are prefixed with "app." in the database.
/// </summary>
public sealed class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // ── Identity ────────────────────────────────────────────────────────────
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();
    public DbSet<EmailVerificationToken> EmailVerificationTokens => Set<EmailVerificationToken>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<ExternalLogin> ExternalLogins => Set<ExternalLogin>();

    // ── Profile ─────────────────────────────────────────────────────────────
    public DbSet<CandidateProfile> CandidateProfiles => Set<CandidateProfile>();
    public DbSet<Skill> Skills => Set<Skill>();
    public DbSet<CandidateSkill> CandidateSkills => Set<CandidateSkill>();
    public DbSet<Education> Educations => Set<Education>();
    public DbSet<WorkExperience> WorkExperiences => Set<WorkExperience>();
    public DbSet<Certification> Certifications => Set<Certification>();
    public DbSet<LanguageProfile> LanguageProfiles => Set<LanguageProfile>();
    public DbSet<ExternalLink> ExternalLinks => Set<ExternalLink>();

    // ── Resume ──────────────────────────────────────────────────────────────
    public DbSet<UploadedFile> UploadedFiles => Set<UploadedFile>();
    public DbSet<Resume> Resumes => Set<Resume>();
    public DbSet<ResumeVersion> ResumeVersions => Set<ResumeVersion>();
    public DbSet<ResumeParsedData> ResumeParsedData => Set<ResumeParsedData>();
    public DbSet<ResumeParseJob> ResumeParseJobs => Set<ResumeParseJob>();
    public DbSet<ResumeOptimizationSession> ResumeOptimizationSessions => Set<ResumeOptimizationSession>();

    // ── Matching ────────────────────────────────────────────────────────────
    public DbSet<JobDescription> JobDescriptions => Set<JobDescription>();
    public DbSet<JobBookmark> JobBookmarks => Set<JobBookmark>();
    public DbSet<MatchSession> MatchSessions => Set<MatchSession>();
    public DbSet<MatchTarget> MatchTargets => Set<MatchTarget>();
    public DbSet<MatchResult> MatchResults => Set<MatchResult>();
    public DbSet<MatchInsight> MatchInsights => Set<MatchInsight>();

    // ── Interview ───────────────────────────────────────────────────────────
    public DbSet<InterviewSession> InterviewSessions => Set<InterviewSession>();
    public DbSet<InterviewTranscript> InterviewTranscripts => Set<InterviewTranscript>();
    public DbSet<InterviewTranscriptSegment> InterviewTranscriptSegments => Set<InterviewTranscriptSegment>();
    public DbSet<InterviewReport> InterviewReports => Set<InterviewReport>();
    public DbSet<InterviewScoreBreakdown> InterviewScoreBreakdowns => Set<InterviewScoreBreakdown>();
    public DbSet<InterviewFeedbackItem> InterviewFeedbackItems => Set<InterviewFeedbackItem>();
    public DbSet<InterviewQuestion> InterviewQuestions => Set<InterviewQuestion>();
    public DbSet<InterviewAnswer> InterviewAnswers => Set<InterviewAnswer>();
    public DbSet<InterviewRealtimeSession> InterviewRealtimeSessions => Set<InterviewRealtimeSession>();
    public DbSet<InterviewRealtimeEvent> InterviewRealtimeEvents => Set<InterviewRealtimeEvent>();

    // ── Mentor ──────────────────────────────────────────────────────────────
    public DbSet<Mentor> Mentors => Set<Mentor>();
    public DbSet<MentorAvailabilitySlot> MentorAvailabilitySlots => Set<MentorAvailabilitySlot>();
    public DbSet<MentorBooking> MentorBookings => Set<MentorBooking>();
    public DbSet<MentorReview> MentorReviews => Set<MentorReview>();

    // ── Billing ─────────────────────────────────────────────────────────────
    public DbSet<Plan> Plans => Set<Plan>();
    public DbSet<PlanEntitlement> PlanEntitlements => Set<PlanEntitlement>();
    public DbSet<BillingProfile> BillingProfiles => Set<BillingProfile>();
    public DbSet<StoredPaymentMethod> StoredPaymentMethods => Set<StoredPaymentMethod>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<SubscriptionChangeLog> SubscriptionChangeLogs => Set<SubscriptionChangeLog>();
    public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();
    public DbSet<Invoice> Invoices => Set<Invoice>();

    // ── Quota ───────────────────────────────────────────────────────────────
    public DbSet<UsageQuotaPolicy> UsageQuotaPolicies => Set<UsageQuotaPolicy>();
    public DbSet<UserQuotaCounter> UserQuotaCounters => Set<UserQuotaCounter>();
    public DbSet<QuotaConsumptionLog> QuotaConsumptionLogs => Set<QuotaConsumptionLog>();
    public DbSet<UserDailyUsage> UserDailyUsages => Set<UserDailyUsage>();

    // ── Notifications ───────────────────────────────────────────────────────
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<EmailTemplate> EmailTemplates => Set<EmailTemplate>();
    public DbSet<EmailCenterMessage> EmailCenterMessages => Set<EmailCenterMessage>();
    public DbSet<EmailMessageLog> EmailMessageLogs => Set<EmailMessageLog>();

    // ── Support & Privacy ───────────────────────────────────────────────────
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<ConsentRecord> ConsentRecords => Set<ConsentRecord>();
    public DbSet<TermsAcceptance> TermsAcceptances => Set<TermsAcceptance>();
    public DbSet<DataExportRequest> DataExportRequests => Set<DataExportRequest>();
    public DbSet<AccountDeletionRequest> AccountDeletionRequests => Set<AccountDeletionRequest>();
    public DbSet<SupportTicket> SupportTickets => Set<SupportTicket>();
    public DbSet<SupportTicketMessage> SupportTicketMessages => Set<SupportTicketMessage>();
    public DbSet<UserFeedback> UserFeedbacks => Set<UserFeedback>();
    public DbSet<AdminActionLog> AdminActionLogs => Set<AdminActionLog>();

    // ── Dashboard & AI ──────────────────────────────────────────────────────
    public DbSet<OnboardingProgress> OnboardingProgress => Set<OnboardingProgress>();
    public DbSet<DashboardSnapshot> DashboardSnapshots => Set<DashboardSnapshot>();
    public DbSet<AiJob> AiJobs => Set<AiJob>();
    public DbSet<PaymentWebhookLog> PaymentWebhookLogs => Set<PaymentWebhookLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Apply all IEntityTypeConfiguration<T> classes in this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Set default schema for all tables
        modelBuilder.HasDefaultSchema("app");

        base.OnModelCreating(modelBuilder);
    }

    /// <summary>
    /// Intercept SaveChanges to auto-update UpdatedAt on auditable entities.
    /// </summary>
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is Domain.Common.AuditableEntity auditable)
            {
                if (entry.State == EntityState.Modified)
                    auditable.UpdatedAt = DateTime.UtcNow;
                else if (entry.State == EntityState.Added)
                    auditable.CreatedAt = auditable.UpdatedAt = DateTime.UtcNow;
            }
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
