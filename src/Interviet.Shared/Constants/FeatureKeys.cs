namespace Interviet.Shared.Constants;

/// <summary>
/// Feature keys used by the entitlement + quota system.
/// These keys are stored in PlanEntitlements and UsageQuotaPolicies tables.
/// </summary>
public static class FeatureKeys
{
    public const string CvOptimizationDailyLimit = "cv.optimization.daily_limit";
    public const string InterviewDailyLimit = "interview.daily_limit";
    public const string MentorMonthlyLimit = "mentor.monthly_limit";
    public const string MultiJdMaxTargetsPerSession = "multi_jd.max_targets_per_session";
    public const string ReportExportPdf = "report.export_pdf";
    public const string ReportShare = "report.share";
    public const string AnalyticsAdvanced = "analytics.advanced";
    public const string HeadhunterAccess = "headhunter.access";
    public const string CareerAdvancement = "career.advancement";
    public const string SupportTier = "support.tier";
    public const string AiModelTier = "ai.model.tier";
    public const string OnboardingPriorityFlow = "onboarding.priority_flow";
}
