namespace Interviet.Application.Common.Options;

public sealed class EmailOptions
{
    public const string SectionName = "Email";

    public string Provider { get; set; } = "LogOnly";
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromName { get; set; } = string.Empty;
    public string FromAddress { get; set; } = string.Empty;
}

public sealed class GoogleAuthOptions
{
    public const string SectionName = "GoogleAuth";

    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
}

public sealed class FrontendOptions
{
    public const string SectionName = "Frontend";

    public string BaseUrl { get; set; } = "http://localhost:3000";
}

public sealed class StorageOptions
{
    public const string SectionName = "Storage";

    /// <summary>Local | S3 | Azure</summary>
    public string Provider { get; set; } = "Local";

    /// <summary>Root folder for local storage (relative to app root or absolute).</summary>
    public string BasePath { get; set; } = "wwwroot/uploads";

    /// <summary>Public base URL for serving uploaded files.</summary>
    public string PublicBaseUrl { get; set; } = "http://localhost:5000/uploads";

    /// <summary>Maximum resume file size in megabytes.</summary>
    public int MaxResumeFileSizeMb { get; set; } = 10;
}

public sealed class AiServicesOptions
{
    public const string SectionName = "AiServices";

    public bool CvServiceEnabled { get; set; } = false;
    public bool MatchingEnabled { get; set; } = false;
    public bool InterviewEnabled { get; set; } = false;
    public bool InterviewRealtimeEnabled { get; set; } = false;
    public string CvServiceBaseUrl { get; set; } = "http://localhost:8001";
    public string InterviewBaseUrl { get; set; } = string.Empty;
    public string? InterviewRealtimeBaseUrl { get; set; }
    public int InterviewRealtimeTokenTtlSeconds { get; set; } = 600;
    public string ApiKey { get; set; } = string.Empty;
    public int TimeoutSeconds { get; set; } = 180;
}

public sealed class MockMerchantOptions
{
    public string MerchantName { get; set; } = "INTER-VIET";
    public string BankName { get; set; } = "INTER-VIET Mock Bank";
    public string BankCode { get; set; } = "IVB";
    public string AccountNumber { get; set; } = "9704000000012345";
    public string AccountName { get; set; } = "CONG TY TNHH INTER VIET";
}

public sealed class BillingOptions
{
    public const string SectionName = "Billing";

    public bool EnableDevSubscriptionActivation { get; set; } = false;

    /// <summary>When true, the mock payment simulate-* endpoints are active.</summary>
    public bool MockPaymentsEnabled { get; set; } = true;

    /// <summary>Minutes before a checkout session expires.</summary>
    public int MockCheckoutTtlMinutes { get; set; } = 15;

    /// <summary>Frontend base URL used to build checkoutUrl links.</summary>
    public string FrontendBaseUrl { get; set; } = "http://localhost:3000";

    public MockMerchantOptions MockMerchant { get; set; } = new();
}

public sealed class PayosConfigOptions
{
    public const string SectionName = "PayOS";

    public string ClientId { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string ChecksumKey { get; set; } = string.Empty;
    public string WebhookUrl { get; set; } = string.Empty;
    public bool Enabled { get; set; } = false;
}

public sealed class PaymentRedirectOptions
{
    public const string SectionName = "PaymentRedirect";

    public string ReturnUrl { get; set; } = string.Empty;
    public string CancelUrl { get; set; } = string.Empty;
}

public sealed class NotificationOptions
{
    public const string SectionName = "Notifications";

    /// <summary>Master switch. When false, no new notifications are created.</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>When true, POST /api/v1/notifications/test is enabled.</summary>
    public bool EnableTestEndpoint { get; set; } = true;

    public int DefaultPageSize { get; set; } = 20;
    public int MaxPageSize { get; set; } = 100;
}

public sealed class ReportOptions
{
    public const string SectionName = "Reports";
    public bool SharingEnabled { get; set; } = true;
    public bool PdfExportEnabled { get; set; } = true;
    public int DefaultShareExpiryDays { get; set; } = 30;
}

public sealed class MentorNetworkOptions
{
    public const string SectionName = "MentorNetwork";

    public bool Enabled { get; set; } = true;
    public string MockMeetingBaseUrl { get; set; } = "http://localhost:3000/mentor-bookings";
    public int DefaultSlotDurationMinutes { get; set; } = 45;
    public bool EnableSeedData { get; set; } = true;
}

public sealed class AdminOptions
{
    public const string SectionName = "Admin";

    public bool Enabled { get; set; } = true;
    public bool EnableDevBootstrap { get; set; } = true;
    public string SeedAdminEmail { get; set; } = "admin@example.com";
}

public sealed class SupportOptions
{
    public const string SectionName = "Support";

    public bool Enabled { get; set; } = true;
    public int DefaultPageSize { get; set; } = 20;
    public int MaxPageSize { get; set; } = 100;
}


