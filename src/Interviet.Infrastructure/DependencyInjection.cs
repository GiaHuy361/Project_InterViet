using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Http;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Common.Options;
using Interviet.Infrastructure.Persistence;
using Interviet.Infrastructure.Services;

namespace Interviet.Infrastructure;

/// <summary>
/// DI registration entry point for the Infrastructure layer.
/// Called from Interviet.Api/Program.cs.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ── EF Core + SQL Server ──────────────────────────────────────────
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                sql =>
                {
                    sql.MigrationsHistoryTable("__EFMigrationsHistory", "app");
                    sql.CommandTimeout(60);
                    sql.EnableRetryOnFailure(maxRetryCount: 3);
                }));

        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        // ── Infrastructure services ───────────────────────────────────────
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddSingleton<IDateTimeProvider, DateTimeProvider>();

        // ── Options binding ───────────────────────────────────────────────
        services.Configure<EmailOptions>(configuration.GetSection(EmailOptions.SectionName));
        services.Configure<GoogleAuthOptions>(configuration.GetSection(GoogleAuthOptions.SectionName));
        services.Configure<FrontendOptions>(configuration.GetSection(FrontendOptions.SectionName));
        services.Configure<StorageOptions>(configuration.GetSection(StorageOptions.SectionName));
        services.Configure<AiServicesOptions>(configuration.GetSection(AiServicesOptions.SectionName));
        services.Configure<BillingOptions>(configuration.GetSection(BillingOptions.SectionName));

        // ── Email service ─────────────────────────────────────────────────
        services.AddTransient<IEmailService>(sp =>
        {
            var opts   = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<EmailOptions>>().Value;
            var isSmtp = opts.Provider.Equals("Smtp", StringComparison.OrdinalIgnoreCase);

            if (isSmtp)
            {
                var logger = sp.GetRequiredService<Microsoft.Extensions.Logging.ILogger<SmtpEmailService>>();
                return new SmtpEmailService(
                    sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<EmailOptions>>(), logger);
            }

            var stubLogger = sp.GetRequiredService<Microsoft.Extensions.Logging.ILogger<LogOnlyEmailService>>();
            return new LogOnlyEmailService(stubLogger);
        });

        // ── Core services ─────────────────────────────────────────────────
        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddTransient<IGoogleAuthService, GoogleAuthService>();
        services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();

        // ── Dashboard / Activity / Usage ──────────────────────────────────
        services.AddScoped<IActivityLogger, ActivityLogger>();
        services.AddScoped<IUsageTracker, UsageTracker>();
        services.AddScoped<IQuotaService, QuotaService>();

        // ── Storage service ───────────────────────────────────────────────
        services.AddSingleton<IStorageService>(sp =>
        {
            var logger      = sp.GetRequiredService<Microsoft.Extensions.Logging.ILogger<LocalFileSystemStorageService>>();
            var storageOpts = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<StorageOptions>>().Value;
            var basePath    = Path.IsPathRooted(storageOpts.BasePath)
                ? storageOpts.BasePath
                : Path.Combine(Directory.GetCurrentDirectory(), storageOpts.BasePath);
            return new LocalFileSystemStorageService(logger, basePath);
        });

        // ── AI Resume Parser Client ───────────────────────────────────────
        services.AddHttpClient<IAiResumeParserClient, HttpAiResumeParserClient>((sp, client) =>
        {
            var opts = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<AiServicesOptions>>().Value;
            client.BaseAddress = new Uri(opts.CvServiceBaseUrl);
            client.Timeout     = TimeSpan.FromSeconds(opts.TimeoutSeconds);
        });

        // ── AI Matching Client ────────────────────────────────────────────
        services.AddHttpClient<IAiMatchingClient, HttpAiMatchingClient>((sp, client) =>
        {
            var opts = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<AiServicesOptions>>().Value;
            client.BaseAddress = new Uri(opts.CvServiceBaseUrl);   // same Python host
            client.Timeout     = TimeSpan.FromSeconds(opts.TimeoutSeconds);
        });

        // ── AI Interview Client ───────────────────────────────────────────────────────────
        services.AddHttpClient<IAiInterviewClient, HttpAiInterviewClient>((sp, client) =>
        {
            var opts = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<AiServicesOptions>>().Value;
            var baseUrl = !string.IsNullOrEmpty(opts.InterviewBaseUrl)
                ? opts.InterviewBaseUrl
                : opts.CvServiceBaseUrl;   // fallback to same host if not separately configured
            client.BaseAddress = new Uri(baseUrl);
            client.Timeout     = TimeSpan.FromSeconds(opts.TimeoutSeconds);
        });

        return services;
    }
}

