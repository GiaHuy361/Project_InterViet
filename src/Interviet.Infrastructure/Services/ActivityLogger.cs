using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Interviet.Application.Common.Interfaces;
using Interviet.Domain.Support;

namespace Interviet.Infrastructure.Services;

/// <summary>
/// Writes ActivityLog rows to the database.
/// Never throws — on error logs warning and swallows the exception
/// so it never interferes with the primary business flow.
/// </summary>
public sealed class ActivityLogger : IActivityLogger
{
    private readonly IAppDbContext _db;
    private readonly ILogger<ActivityLogger> _logger;

    public ActivityLogger(IAppDbContext db, ILogger<ActivityLogger> logger)
    {
        _db     = db;
        _logger = logger;
    }

    public async Task LogAsync(
        Guid?   userId,
        string  actionKey,
        string? entityType   = null,
        Guid?   entityId     = null,
        string? description  = null,
        string? ipAddress    = null,
        string? userAgent    = null,
        CancellationToken ct = default)
    {
        try
        {
            _db.ActivityLogs.Add(new ActivityLog
            {
                Id          = Guid.NewGuid(),
                UserId      = userId,
                ActionKey   = actionKey,
                EntityType  = entityType,
                EntityId    = entityId,
                Description = description,
                IpAddress   = ipAddress,
                UserAgent   = userAgent,
                CreatedAt   = DateTime.UtcNow
            });

            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            // Must NOT rethrow — activity logging is non-critical
            _logger.LogWarning(ex,
                "Failed to write ActivityLog. ActionKey={ActionKey} UserId={UserId}",
                actionKey, userId);
        }
    }
}
