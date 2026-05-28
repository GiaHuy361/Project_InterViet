using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PayOS;
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
        // ── EF Core + Dynamic Provider Switching ──────────────────────────
        var dbProvider = configuration["Database:Provider"] ?? "SqlServer";
        var connString = configuration.GetConnectionString("DefaultConnection");

        if (connString != null && (
            connString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
            connString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase) ||
            connString.Contains("Host=", StringComparison.OrdinalIgnoreCase)))
        {
            dbProvider = "Postgres";
        }

        if (dbProvider.Equals("Postgres", StringComparison.OrdinalIgnoreCase))
        {
            var parsedConnString = ConvertPostgresUrlToConnectionString(connString);
            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseNpgsql(
                    parsedConnString,
                    npgsql =>
                    {
                        npgsql.MigrationsHistoryTable("__EFMigrationsHistory", "app");
                        npgsql.CommandTimeout(60);
                        npgsql.EnableRetryOnFailure(maxRetryCount: 3);
                    });
                options.ReplaceService<IMigrationsAssembly, DbProviderMigrationsAssembly>();
            });
        }
        else
        {
            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseSqlServer(
                    connString,
                    sql =>
                    {
                        sql.MigrationsHistoryTable("__EFMigrationsHistory", "app");
                        sql.CommandTimeout(60);
                        sql.EnableRetryOnFailure(maxRetryCount: 3);
                    });
                options.ReplaceService<IMigrationsAssembly, DbProviderMigrationsAssembly>();
            });
        }

        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        // ── Infrastructure services ───────────────────────────────────────
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IAuditLogService, AuditLogService>();
        services.AddSingleton<IDateTimeProvider, DateTimeProvider>();
        services.AddSingleton<IQrCodeGenerator, QrCodeGenerator>();


        // ── Options binding ───────────────────────────────────────────────
        services.Configure<EmailOptions>(configuration.GetSection(EmailOptions.SectionName));
        services.Configure<GoogleAuthOptions>(configuration.GetSection(GoogleAuthOptions.SectionName));
        services.Configure<FrontendOptions>(configuration.GetSection(FrontendOptions.SectionName));
        services.Configure<StorageOptions>(configuration.GetSection(StorageOptions.SectionName));
        services.Configure<AiServicesOptions>(configuration.GetSection(AiServicesOptions.SectionName));
        services.Configure<BillingOptions>(configuration.GetSection(BillingOptions.SectionName));
        services.Configure<NotificationOptions>(configuration.GetSection(NotificationOptions.SectionName));
        services.Configure<ReportOptions>(configuration.GetSection(ReportOptions.SectionName));
        services.Configure<MentorNetworkOptions>(configuration.GetSection(MentorNetworkOptions.SectionName));
        services.Configure<AdminOptions>(configuration.GetSection(AdminOptions.SectionName));
        services.Configure<SupportOptions>(configuration.GetSection(SupportOptions.SectionName));
        services.Configure<PayosConfigOptions>(configuration.GetSection(PayosConfigOptions.SectionName));
        services.Configure<PaymentRedirectOptions>(configuration.GetSection(PaymentRedirectOptions.SectionName));

        services.AddSingleton(sp =>
        {
            var opts = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<PayosConfigOptions>>().Value;
            return new PayOSClient(opts.ClientId ?? "", opts.ApiKey ?? "", opts.ChecksumKey ?? "");
        });


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
        services.AddScoped<IBillingSuccessService, BillingSuccessService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IReportShareService, ReportShareService>();
        services.AddScoped<IReportPdfService, ReportPdfService>();


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

    private static string? ConvertPostgresUrlToConnectionString(string? connString)
    {
        if (string.IsNullOrEmpty(connString))
            return connString;

        // Handle both postgres:// and postgresql:// URI formats (Render uses postgresql://)
        var isPostgresUri = connString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
                         || connString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase);

        if (isPostgresUri)
        {
            try
            {
                var uri = new Uri(connString);
                var userInfo = uri.UserInfo.Split(':');
                var username = Uri.UnescapeDataString(userInfo[0]);
                var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty;
                var host = uri.Host;
                var port = uri.Port > 0 ? uri.Port : 5432;
                var database = uri.AbsolutePath.TrimStart('/');

                return $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true";
            }
            catch
            {
                // If parsing fails, return original and hope Npgsql handles it
                return connString;
            }
        }

        return connString;
    }
}

