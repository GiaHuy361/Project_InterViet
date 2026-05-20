using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Interviet.Application.Common.Interfaces;
using Interviet.Domain.Support;

namespace Interviet.Infrastructure.Services;

public sealed class AuditLogService : IAuditLogService
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditLogService(
        IAppDbContext context,
        ICurrentUserService currentUserService,
        IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _currentUserService = currentUserService;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task LogAsync(string action, string? resource = null, string? resourceId = null, object? metadata = null)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        var ipAddress = httpContext?.Connection?.RemoteIpAddress?.ToString();
        var userAgent = httpContext?.Request?.Headers["User-Agent"].ToString();

        // Safe JSON Serialization
        string? metadataJson = null;
        if (metadata != null)
        {
            try
            {
                metadataJson = JsonSerializer.Serialize(metadata, new JsonSerializerOptions
                {
                    WriteIndented = false,
                    DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
                });
            }
            catch
            {
                // Degrade gracefully if serialization fails
                metadataJson = "{}";
            }
        }

        // Determine user identity and role safely
        var actorId = _currentUserService.IsAuthenticated ? _currentUserService.UserId : (Guid?)null;
        var actorEmail = _currentUserService.IsAuthenticated ? _currentUserService.Email : null;
        
        // Find user role from claims, default to Visitor if not authenticated
        var actorRole = "Visitor";
        if (_currentUserService.IsAuthenticated)
        {
            if (_currentUserService.IsInRole("admin"))
                actorRole = "admin";
            else if (_currentUserService.IsInRole("support"))
                actorRole = "support";
            else if (_currentUserService.IsInRole("mentor"))
                actorRole = "mentor";
            else
                actorRole = "candidate";
        }

        var log = new AuditLog
        {
            ActorId = actorId,
            ActorEmail = actorEmail,
            ActorRole = actorRole,
            Action = action,
            Resource = resource,
            ResourceId = resourceId,
            MetadataJson = metadataJson,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            CreatedAt = DateTime.UtcNow
        };

        _context.AuditLogs.Add(log);
        await _context.SaveChangesAsync();
    }
}
