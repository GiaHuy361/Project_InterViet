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
    public string CvServiceBaseUrl { get; set; } = "http://localhost:8001";
    public string InterviewBaseUrl { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public int TimeoutSeconds { get; set; } = 60;
}

public sealed class BillingOptions
{
    public const string SectionName = "Billing";

    public bool EnableDevSubscriptionActivation { get; set; } = false;
}
