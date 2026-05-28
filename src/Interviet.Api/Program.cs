using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Interviet.Application;
using Interviet.Infrastructure;
using Interviet.Infrastructure.Hubs;
using Interviet.Api.Middleware;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Bootstrap Serilog before the host is built so startup errors are captured.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

Log.Information("Starting INTER-VIET API host...");

try
{
    // Ensure Development environment is used locally when ASPNETCORE_ENVIRONMENT is not set
    if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")))
    {
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Development");
        Log.Information("ASPNETCORE_ENVIRONMENT not set — defaulting to Development.");
    }

    var builder = WebApplication.CreateBuilder(args);

    var port = Environment.GetEnvironmentVariable("PORT");
    if (!string.IsNullOrEmpty(port))
    {
        builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
    }

    Log.Information("Active environment: {Environment}", builder.Environment.EnvironmentName);

    // ── Serilog ───────────────────────────────────────────────────────────
    builder.Host.UseSerilog((ctx, services, cfg) => cfg
        .ReadFrom.Configuration(ctx.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .Enrich.WithProperty("Application", "Interviet.Api")
        .Enrich.WithProperty("Environment", ctx.HostingEnvironment.EnvironmentName)
        .WriteTo.Console(outputTemplate:
            "[{Timestamp:HH:mm:ss} {Level:u3}] {CorrelationId} {Message:lj}{NewLine}{Exception}")
        .WriteTo.File("logs/interviet-.log",
            rollingInterval: RollingInterval.Day,
            outputTemplate:
                "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {CorrelationId} {UserId} {Message:lj}{NewLine}{Exception}"));

    // ── Infrastructure (EF Core, Services) ───────────────────────────────
    builder.Services.AddHttpContextAccessor(); // Must come before AddInfrastructure
    builder.Services.AddInfrastructure(builder.Configuration);

    var emailProvider   = builder.Configuration["Email:Provider"] ?? "LogOnly";
    var storageProvider = builder.Configuration["Storage:Provider"] ?? "Local";
    var cvEnabled       = builder.Configuration["AiServices:CvServiceEnabled"] ?? "false";
    var interviewEnabled         = builder.Configuration["AiServices:InterviewEnabled"] ?? "false";
    var realtimeEnabled          = builder.Configuration["AiServices:InterviewRealtimeEnabled"] ?? "false";
    var realtimeBaseUrl          = builder.Configuration["AiServices:InterviewRealtimeBaseUrl"] ?? "(not set)";
    Log.Information("Email provider: {EmailProvider}", emailProvider);
    Log.Information("Storage provider: {StorageProvider}", storageProvider);
    Log.Information("CV Service enabled: {CvEnabled}", cvEnabled);
    Log.Information("Interview enabled: {InterviewEnabled}", interviewEnabled);
    Log.Information("Interview realtime enabled: {RealtimeEnabled}", realtimeEnabled);
    Log.Information("Interview realtime base url: {RealtimeBaseUrl}", realtimeBaseUrl);

    // ── Application (MediatR + validators + pipeline behaviors) ──────────
    builder.Services.AddApplication();

    // ── Authentication — JWT Bearer ───────────────────────────────────────
    var jwtSettings = builder.Configuration.GetSection("Jwt");
    var signingKey = jwtSettings["SigningKey"]
        ?? throw new InvalidOperationException("Jwt:SigningKey is required.");

    if (signingKey.Length < 32)
        throw new InvalidOperationException(
            $"Jwt:SigningKey phải dài ít nhất 32 ký tự (256 bits) để dùng với HS256. " +
            $"Hiện tại chỉ có {signingKey.Length} ký tự.");

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSettings["Issuer"],
                ValidAudience = jwtSettings["Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey)),
                ClockSkew = TimeSpan.FromSeconds(30)
            };
            options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var accessToken = context.Request.Query["access_token"];

                    // If request path is for the notification hub, read the token from the query string
                    var path = context.HttpContext.Request.Path;
                    if (!string.IsNullOrEmpty(accessToken) &&
                        path.StartsWithSegments("/hubs/notifications"))
                    {
                        context.Token = accessToken;
                    }
                    return Task.CompletedTask;
                }
            };
        });

    builder.Services.AddAuthorization(options =>
    {
        options.AddPolicy("AdminOnly", policy =>
            policy.RequireRole(Interviet.Domain.Identity.RoleCodes.Admin));
        options.AddPolicy("SupportOnly", policy =>
            policy.RequireRole(Interviet.Domain.Identity.RoleCodes.Support));
        options.AddPolicy("MentorOnly", policy =>
            policy.RequireRole(Interviet.Domain.Identity.RoleCodes.Mentor));
        options.AddPolicy("AdminOrSupport", policy =>
            policy.RequireRole(Interviet.Domain.Identity.RoleCodes.Admin, Interviet.Domain.Identity.RoleCodes.Support));
        options.AddPolicy("AdminOrMentor", policy =>
            policy.RequireRole(Interviet.Domain.Identity.RoleCodes.Admin, Interviet.Domain.Identity.RoleCodes.Mentor));
        options.AddPolicy("SupportOrAdmin", policy =>
            policy.RequireRole(Interviet.Domain.Identity.RoleCodes.Support, Interviet.Domain.Identity.RoleCodes.Admin));
        options.AddPolicy("MentorOrAdmin", policy =>
            policy.RequireRole(Interviet.Domain.Identity.RoleCodes.Mentor, Interviet.Domain.Identity.RoleCodes.Admin));
    });

    builder.Services.AddSignalR();

    // ── Controllers ───────────────────────────────────────────────────────
    builder.Services.AddControllers()
        .AddJsonOptions(opt =>
        {
            opt.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
            opt.JsonSerializerOptions.DefaultIgnoreCondition =
                System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
        });

    // ── Swagger / OpenAPI ─────────────────────────────────────────────────
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "INTER-VIET Candidate API",
            Version = "v1",
            Description = "C# Backend — Candidate-side Platform",
            Contact = new OpenApiContact { Name = "INTER-VIET Team" }
        });

        // JWT auth in Swagger — HTTP Bearer scheme so Swagger auto-prepends "Bearer "
        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Description = "Nhập raw access token (không cần gõ 'Bearer '). Swagger sẽ tự thêm prefix.",
            Name = "Authorization",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT"
        });
        c.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
                },
                Array.Empty<string>()
            }
        });

        // Remove lock icon from [AllowAnonymous] endpoints
        c.OperationFilter<Interviet.Api.Swagger.SecurityRequirementsOperationFilter>();
    });

    // ── Health Checks ─────────────────────────────────────────────────────
    var healthBuilder = builder.Services.AddHealthChecks();

    var dbProvider = builder.Configuration["Database:Provider"] ?? "SqlServer";
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

    if (connectionString != null && (connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) || connectionString.Contains("Host=", StringComparison.OrdinalIgnoreCase)))
    {
        dbProvider = "Postgres";
    }

    if (!string.IsNullOrWhiteSpace(connectionString))
    {
        if (dbProvider.Equals("Postgres", StringComparison.OrdinalIgnoreCase))
        {
            var parsedConnString = ConvertPostgresUrlToConnectionString(connectionString);
            healthBuilder.AddNpgSql(
                parsedConnString!,
                name: "postgresql",
                tags: ["db", "sql"]);
        }
        else
        {
            healthBuilder.AddSqlServer(
                connectionString,
                name: "sqlserver",
                tags: ["db", "sql"]);
        }
    }

    // Redis health check is optional — won't fail startup if Redis is unavailable
    var redisConnection = builder.Configuration.GetConnectionString("Redis");
    if (!string.IsNullOrWhiteSpace(redisConnection))
    {
        // Add StackExchange.Redis health check package when Redis is in use
        // healthBuilder.AddRedis(redisConnection, name: "redis", tags: ["cache"]);
        Log.Information("Redis connection configured at {Redis}", redisConnection);
    }

    // ── CORS ──────────────────────────────────────────────────────────────
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend", policy =>
        {
            var allowedOrigins = builder.Configuration
                .GetSection("Cors:AllowedOrigins")
                .Get<string[]>() ?? ["http://localhost:3000", "http://localhost:5173"];

            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
    });

    // ── Rate Limiting (ASP.NET Core built-in) ─────────────────────────────
    builder.Services.AddRateLimiter(options =>
    {
        options.AddFixedWindowLimiter("auth", o =>
        {
            o.Window = TimeSpan.FromMinutes(1);
            o.PermitLimit = 10;
            o.QueueLimit = 0;
        });

        options.AddFixedWindowLimiter("upload", o =>
        {
            o.Window = TimeSpan.FromMinutes(1);
            o.PermitLimit = 5;
            o.QueueLimit = 0;
        });

        options.RejectionStatusCode = 429;
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Build the application
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    var app = builder.Build();

    // ── Auto-migrate on startup (all environments) ───────────────────────
    if (true) // Always run migrations including Production (safe: EF Core is idempotent)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<Interviet.Infrastructure.Persistence.AppDbContext>();
        await db.Database.MigrateAsync();
        Log.Information("Database migrations applied successfully.");

        var mentorOpts = scope.ServiceProvider.GetRequiredService<Microsoft.Extensions.Options.IOptions<Interviet.Application.Common.Options.MentorNetworkOptions>>().Value;
        if (mentorOpts.EnableSeedData)
        {
            await Interviet.Infrastructure.Persistence.DbSeeder.SeedMentorsAsync(db);
            Log.Information("Mentor seed data applied successfully.");
        }

        var adminOpts = scope.ServiceProvider.GetRequiredService<Microsoft.Extensions.Options.IOptions<Interviet.Application.Common.Options.AdminOptions>>().Value;
        if (adminOpts.EnableDevBootstrap && !string.IsNullOrWhiteSpace(adminOpts.SeedAdminEmail))
        {
            var seedEmailNormalized = adminOpts.SeedAdminEmail.ToUpperInvariant();
            var seedUser = await db.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == seedEmailNormalized);
            if (seedUser != null && seedUser.RoleCode != Interviet.Domain.Identity.RoleCodes.Admin)
            {
                seedUser.RoleCode = Interviet.Domain.Identity.RoleCodes.Admin;
                await db.SaveChangesAsync();
                Log.Information("Seed user {Email} successfully promoted to Admin on startup.", adminOpts.SeedAdminEmail);
            }
        }

        // Seed the requested admin user
        var passwordHasher = scope.ServiceProvider.GetRequiredService<Interviet.Application.Common.Interfaces.IPasswordHasher>();
        await Interviet.Infrastructure.Persistence.DbSeeder.SeedAdminUserAsync(db, passwordHasher);
        Log.Information("Admin user hienngochuy3@gmail.com seeded successfully.");

        // Phase 15 - Seed public content
        await Interviet.Infrastructure.Persistence.DbSeeder.SeedPublicContentAsync(db);
        Log.Information("Public content (stats, testimonials, FAQs, blog) seeded successfully.");
    }

    // ── Middleware pipeline (ORDER MATTERS) ───────────────────────────────
    app.UseMiddleware<ExceptionMiddleware>();       // 1. Global error handler first
    app.UseMiddleware<CorrelationIdMiddleware>();   // 2. Correlation ID header
    app.UseSerilogRequestLogging(opts =>           // 3. Request logging
    {
        opts.MessageTemplate =
            "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
        opts.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
        {
            diagnosticContext.Set("UserId",
                httpContext.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "anonymous");
        };
    });

    // ── Swagger — always on in Development, also accessible via direct URL ─
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "INTER-VIET API v1");
        c.RoutePrefix = "swagger";
        c.DocumentTitle = "INTER-VIET Candidate API";
    });

    // Redirect root "/" → "/swagger" for convenience
    app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();

    app.UseStaticFiles(); // serve wwwroot/uploads for local storage
    app.UseCors("AllowFrontend");
    app.UseRateLimiter();
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();
    app.MapHub<NotificationHub>("/hubs/notifications");
    app.MapHealthChecks("/api/v1/health");

    Log.Information("INTER-VIET API started. Swagger: http://localhost:5000/swagger");
    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "INTER-VIET API failed to start.");
    throw;
}
finally
{
    Log.CloseAndFlush();
}

string? ConvertPostgresUrlToConnectionString(string? connString)
{
    if (string.IsNullOrEmpty(connString))
        return connString;

    if (connString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase))
    {
        try
        {
            var uri = new Uri(connString);
            var userInfo = uri.UserInfo.Split(':');
            var username = userInfo[0];
            var password = userInfo.Length > 1 ? userInfo[1] : string.Empty;
            var host = uri.Host;
            var port = uri.Port > 0 ? uri.Port : 5432;
            var database = uri.AbsolutePath.TrimStart('/');

            return $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true";
        }
        catch
        {
            return connString;
        }
    }

    return connString;
}
