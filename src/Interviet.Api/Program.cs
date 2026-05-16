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
        });

    builder.Services.AddAuthorization();

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

    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrWhiteSpace(connectionString))
    {
        healthBuilder.AddSqlServer(
            connectionString,
            name: "sqlserver",
            tags: ["db", "sql"]);
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

    // ── Auto-migrate on startup (dev/staging only) ────────────────────────
    if (app.Environment.IsDevelopment() || app.Environment.IsStaging())
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<Interviet.Infrastructure.Persistence.AppDbContext>();
        await db.Database.MigrateAsync();
        Log.Information("Database migrations applied successfully.");
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
