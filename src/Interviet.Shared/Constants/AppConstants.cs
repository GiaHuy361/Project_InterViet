namespace Interviet.Shared.Constants;

/// <summary>
/// Onboarding step codes — drives OnboardingProgress table.
/// </summary>
public static class OnboardingSteps
{
    public const string Welcome = "welcome";
    public const string ProfileSetup = "profile_setup";
    public const string FirstResumeUpload = "first_resume_upload";
    public const string FirstMatch = "first_match";
    public const string FirstInterview = "first_interview";
    public const string PlanSelection = "plan_selection";

    public static readonly IReadOnlyList<string> All =
    [
        Welcome, ProfileSetup, FirstResumeUpload, FirstMatch, FirstInterview, PlanSelection
    ];
}

/// <summary>
/// Canonical activity action keys for ActivityLogs and dashboard timeline.
/// </summary>
public static class ActivityKeys
{
    public const string CvUploaded = "cv.uploaded";
    public const string CvAnalyzed = "cv.analyzed";
    public const string CvDeleted = "cv.deleted";
    public const string MatchingSingleCreated = "matching.single.created";
    public const string MatchingMultiCreated = "matching.multi.created";
    public const string MatchingCompleted = "matching.completed";
    public const string InterviewCreated = "interview.created";
    public const string InterviewStarted = "interview.started";
    public const string InterviewCompleted = "interview.completed";
    public const string InterviewCancelled = "interview.cancelled";
    public const string MentorBooked = "mentor.booked";
    public const string MentorBookingCancelled = "mentor.booking.cancelled";
    public const string MentorSessionCompleted = "mentor.session.completed";
    public const string PaymentSucceeded = "payment.succeeded";
    public const string PaymentFailed = "payment.failed";
    public const string SubscriptionStarted = "subscription.started";
    public const string SubscriptionUpgraded = "subscription.upgraded";
    public const string SubscriptionDowngraded = "subscription.downgraded";
    public const string SubscriptionCancelled = "subscription.cancelled";
    public const string SubscriptionExpired = "subscription.expired";
    public const string TrialStarted = "trial.started";
    public const string PrivacyExportRequested = "privacy.export_requested";
    public const string PrivacyDeleteRequested = "privacy.delete_requested";
    public const string ProfileUpdated = "profile.updated";
    public const string PasswordChanged = "account.password_changed";
    public const string SessionRevoked = "account.session_revoked";
}
