using Interviet.Domain.Identity;
using Interviet.Domain.Billing;
using Interviet.Domain.Resumes;
using Interviet.Domain.Matching;
using Interviet.Domain.Interviews;
using Interviet.Domain.Mentors;
using Interviet.Domain.Quotas;
using Interviet.Domain.Notifications;
using Interviet.Domain.Support;
using Interviet.Domain.Dashboard;
using Interviet.Domain.Profiles;
using Interviet.Domain.AiIntegration;

namespace Interviet.Application.Common.Interfaces;

/// <summary>
/// Single unit-of-work interface for the AppDbContext.
/// Exposes all entity sets and the SaveChanges method.
/// </summary>
public interface IAppDbContext
{
    // Identity
    Microsoft.EntityFrameworkCore.DbSet<User> Users { get; }
    Microsoft.EntityFrameworkCore.DbSet<Role> Roles { get; }
    Microsoft.EntityFrameworkCore.DbSet<UserRole> UserRoles { get; }
    Microsoft.EntityFrameworkCore.DbSet<RefreshToken> RefreshTokens { get; }
    Microsoft.EntityFrameworkCore.DbSet<UserSession> UserSessions { get; }
    Microsoft.EntityFrameworkCore.DbSet<EmailVerificationToken> EmailVerificationTokens { get; }
    Microsoft.EntityFrameworkCore.DbSet<PasswordResetToken> PasswordResetTokens { get; }
    Microsoft.EntityFrameworkCore.DbSet<ExternalLogin> ExternalLogins { get; }

    // Profile
    Microsoft.EntityFrameworkCore.DbSet<CandidateProfile> CandidateProfiles { get; }
    Microsoft.EntityFrameworkCore.DbSet<Skill> Skills { get; }
    Microsoft.EntityFrameworkCore.DbSet<CandidateSkill> CandidateSkills { get; }
    Microsoft.EntityFrameworkCore.DbSet<Education> Educations { get; }
    Microsoft.EntityFrameworkCore.DbSet<WorkExperience> WorkExperiences { get; }
    Microsoft.EntityFrameworkCore.DbSet<Certification> Certifications { get; }
    Microsoft.EntityFrameworkCore.DbSet<LanguageProfile> LanguageProfiles { get; }
    Microsoft.EntityFrameworkCore.DbSet<ExternalLink> ExternalLinks { get; }

    // Resume
    Microsoft.EntityFrameworkCore.DbSet<UploadedFile> UploadedFiles { get; }
    Microsoft.EntityFrameworkCore.DbSet<Resume> Resumes { get; }
    Microsoft.EntityFrameworkCore.DbSet<ResumeVersion> ResumeVersions { get; }
    Microsoft.EntityFrameworkCore.DbSet<ResumeParsedData> ResumeParsedData { get; }
    Microsoft.EntityFrameworkCore.DbSet<ResumeParseJob> ResumeParseJobs { get; }
    Microsoft.EntityFrameworkCore.DbSet<ResumeOptimizationSession> ResumeOptimizationSessions { get; }

    // Matching
    Microsoft.EntityFrameworkCore.DbSet<JobDescription> JobDescriptions { get; }
    Microsoft.EntityFrameworkCore.DbSet<JobBookmark> JobBookmarks { get; }
    Microsoft.EntityFrameworkCore.DbSet<MatchSession> MatchSessions { get; }
    Microsoft.EntityFrameworkCore.DbSet<MatchTarget> MatchTargets { get; }
    Microsoft.EntityFrameworkCore.DbSet<MatchResult> MatchResults { get; }
    Microsoft.EntityFrameworkCore.DbSet<MatchInsight> MatchInsights { get; }

    // Interview
    Microsoft.EntityFrameworkCore.DbSet<InterviewSession> InterviewSessions { get; }
    Microsoft.EntityFrameworkCore.DbSet<InterviewTranscript> InterviewTranscripts { get; }
    Microsoft.EntityFrameworkCore.DbSet<InterviewTranscriptSegment> InterviewTranscriptSegments { get; }
    Microsoft.EntityFrameworkCore.DbSet<InterviewReport> InterviewReports { get; }
    Microsoft.EntityFrameworkCore.DbSet<InterviewScoreBreakdown> InterviewScoreBreakdowns { get; }
    Microsoft.EntityFrameworkCore.DbSet<InterviewFeedbackItem> InterviewFeedbackItems { get; }
    Microsoft.EntityFrameworkCore.DbSet<InterviewQuestion> InterviewQuestions { get; }
    Microsoft.EntityFrameworkCore.DbSet<InterviewAnswer> InterviewAnswers { get; }

    // Mentor
    Microsoft.EntityFrameworkCore.DbSet<Mentor> Mentors { get; }
    Microsoft.EntityFrameworkCore.DbSet<MentorAvailabilitySlot> MentorAvailabilitySlots { get; }
    Microsoft.EntityFrameworkCore.DbSet<MentorBooking> MentorBookings { get; }
    Microsoft.EntityFrameworkCore.DbSet<MentorReview> MentorReviews { get; }

    // Billing
    Microsoft.EntityFrameworkCore.DbSet<Plan> Plans { get; }
    Microsoft.EntityFrameworkCore.DbSet<PlanEntitlement> PlanEntitlements { get; }
    Microsoft.EntityFrameworkCore.DbSet<BillingProfile> BillingProfiles { get; }
    Microsoft.EntityFrameworkCore.DbSet<StoredPaymentMethod> StoredPaymentMethods { get; }
    Microsoft.EntityFrameworkCore.DbSet<Domain.Billing.Subscription> Subscriptions { get; }
    Microsoft.EntityFrameworkCore.DbSet<SubscriptionChangeLog> SubscriptionChangeLogs { get; }
    Microsoft.EntityFrameworkCore.DbSet<PaymentTransaction> PaymentTransactions { get; }
    Microsoft.EntityFrameworkCore.DbSet<Invoice> Invoices { get; }

    // Quota
    Microsoft.EntityFrameworkCore.DbSet<UsageQuotaPolicy> UsageQuotaPolicies { get; }
    Microsoft.EntityFrameworkCore.DbSet<UserQuotaCounter> UserQuotaCounters { get; }
    Microsoft.EntityFrameworkCore.DbSet<QuotaConsumptionLog> QuotaConsumptionLogs { get; }
    Microsoft.EntityFrameworkCore.DbSet<UserDailyUsage> UserDailyUsages { get; }

    // Notifications
    Microsoft.EntityFrameworkCore.DbSet<Notification> Notifications { get; }
    Microsoft.EntityFrameworkCore.DbSet<EmailTemplate> EmailTemplates { get; }
    Microsoft.EntityFrameworkCore.DbSet<EmailCenterMessage> EmailCenterMessages { get; }
    Microsoft.EntityFrameworkCore.DbSet<EmailMessageLog> EmailMessageLogs { get; }

    // Support & Privacy
    Microsoft.EntityFrameworkCore.DbSet<ActivityLog> ActivityLogs { get; }
    Microsoft.EntityFrameworkCore.DbSet<ConsentRecord> ConsentRecords { get; }
    Microsoft.EntityFrameworkCore.DbSet<TermsAcceptance> TermsAcceptances { get; }
    Microsoft.EntityFrameworkCore.DbSet<DataExportRequest> DataExportRequests { get; }
    Microsoft.EntityFrameworkCore.DbSet<AccountDeletionRequest> AccountDeletionRequests { get; }
    Microsoft.EntityFrameworkCore.DbSet<SupportTicket> SupportTickets { get; }
    Microsoft.EntityFrameworkCore.DbSet<SupportTicketMessage> SupportTicketMessages { get; }
    Microsoft.EntityFrameworkCore.DbSet<UserFeedback> UserFeedbacks { get; }
    Microsoft.EntityFrameworkCore.DbSet<AdminActionLog> AdminActionLogs { get; }

    // Dashboard & AI
    Microsoft.EntityFrameworkCore.DbSet<OnboardingProgress> OnboardingProgress { get; }
    Microsoft.EntityFrameworkCore.DbSet<DashboardSnapshot> DashboardSnapshots { get; }
    Microsoft.EntityFrameworkCore.DbSet<AiJob> AiJobs { get; }
    Microsoft.EntityFrameworkCore.DbSet<PaymentWebhookLog> PaymentWebhookLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
