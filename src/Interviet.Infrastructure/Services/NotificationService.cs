using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Common.Options;
using Interviet.Contracts.Notifications;
using Interviet.Domain.Notifications;
using Interviet.Shared.Results;

namespace Interviet.Infrastructure.Services;

/// <summary>
/// In-app notification service.
/// Safe to call from any context — never throws; logs warnings on failure.
/// </summary>
public sealed class NotificationService : INotificationService
{
    private readonly IAppDbContext _db;
    private readonly NotificationOptions _opts;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        IAppDbContext db,
        IOptions<NotificationOptions> opts,
        ILogger<NotificationService> logger)
    {
        _db     = db;
        _opts   = opts.Value;
        _logger = logger;
    }

    // ── Category → preference flag mapping ────────────────────────────────────

    private static bool IsCategoryEnabled(string type, NotificationPreference pref)
    {
        if (!pref.InAppNotificationsEnabled) return false;

        return type switch
        {
            var t when t.StartsWith("billing.") => pref.BillingNotificationsEnabled,
            var t when t.StartsWith("resume.")  => pref.ResumeNotificationsEnabled,
            var t when t.StartsWith("match.")   => pref.MatchingNotificationsEnabled,
            var t when t.StartsWith("interview.") => pref.InterviewNotificationsEnabled,
            var t when t.StartsWith("system.")  => pref.SystemNotificationsEnabled,
            _ => true // unknown category — allow by default
        };
    }

    // ── CreateAsync ───────────────────────────────────────────────────────────

    public async Task CreateAsync(
        Guid userId,
        string type,
        string title,
        string message,
        string? actionUrl = null,
        object? data = null,
        string priority = "normal",
        string? deduplicationKey = null,
        CancellationToken ct = default)
    {
        try
        {
            if (!_opts.Enabled) return;

            // Load preferences (returns defaults if not found — no DB write)
            var pref = await GetOrCreatePreferencesAsync(userId, ct);
            if (!IsCategoryEnabled(type, pref)) return;

            // Deduplication check
            if (deduplicationKey is not null)
            {
                var exists = await _db.Notifications.AnyAsync(
                    n => n.UserId == userId
                      && n.DeduplicationKey == deduplicationKey
                      && n.DeletedAt == null, ct);
                if (exists)
                {
                    _logger.LogDebug(
                        "Notification skipped (duplicate). UserId={UserId} DeduplicationKey={Key}",
                        userId, deduplicationKey);
                    return;
                }
            }

            // Serialize data
            string? dataJson = null;
            if (data is not null)
            {
                try { dataJson = JsonSerializer.Serialize(data); }
                catch { /* ignore serialization errors */ }
            }

            var notification = new Notification
            {
                Id               = Guid.NewGuid(),
                UserId           = userId,
                Type             = type,
                Title            = title,
                Message          = message,
                Priority         = priority,
                ActionUrl        = actionUrl,
                DataJson         = dataJson,
                IsRead           = false,
                DeduplicationKey = deduplicationKey,
                CreatedAt        = DateTime.UtcNow
            };

            _db.Notifications.Add(notification);
            await _db.SaveChangesAsync(ct);

            _logger.LogDebug(
                "Notification created. UserId={UserId} Type={Type} Id={Id}",
                userId, type, notification.Id);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Failed to create notification. UserId={UserId} Type={Type}", userId, type);
        }
    }

    // ── GetUnreadCountAsync ───────────────────────────────────────────────────

    public async Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct = default)
    {
        return await _db.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead && n.DeletedAt == null, ct);
    }

    // ── MarkAsReadAsync ───────────────────────────────────────────────────────

    public async Task<Result<MarkReadResponse>> MarkAsReadAsync(
        Guid userId, Guid notificationId, CancellationToken ct = default)
    {
        var notification = await _db.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.DeletedAt == null, ct);

        if (notification is null)
            return Error.NotFound("Notification.NotFound", "Không tìm thấy thông báo.");

        if (notification.UserId != userId)
            return Error.Forbidden("Notification.Forbidden", "Bạn không có quyền truy cập thông báo này.");

        // Idempotent
        if (notification.IsRead)
            return new MarkReadResponse { Id = notification.Id, IsRead = true, ReadAt = notification.ReadAt };

        var now = DateTime.UtcNow;
        notification.IsRead    = true;
        notification.ReadAt    = now;
        notification.UpdatedAt = now;
        await _db.SaveChangesAsync(ct);

        return new MarkReadResponse { Id = notification.Id, IsRead = true, ReadAt = now };
    }

    // ── MarkAllAsReadAsync ────────────────────────────────────────────────────

    public async Task<Result<MarkAllReadResponse>> MarkAllAsReadAsync(
        Guid userId, string? type = null, CancellationToken ct = default)
    {
        var query = _db.Notifications
            .Where(n => n.UserId == userId && !n.IsRead && n.DeletedAt == null);

        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(n => n.Type == type);

        var notifications = await query.ToListAsync(ct);
        if (notifications.Count == 0)
            return new MarkAllReadResponse { UpdatedCount = 0, ReadAt = DateTime.UtcNow };

        var now = DateTime.UtcNow;
        foreach (var n in notifications)
        {
            n.IsRead    = true;
            n.ReadAt    = now;
            n.UpdatedAt = now;
        }

        await _db.SaveChangesAsync(ct);
        return new MarkAllReadResponse { UpdatedCount = notifications.Count, ReadAt = now };
    }

    // ── DeleteAsync ───────────────────────────────────────────────────────────

    public async Task<Result> DeleteAsync(
        Guid userId, Guid notificationId, CancellationToken ct = default)
    {
        var notification = await _db.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.DeletedAt == null, ct);

        if (notification is null)
            return Error.NotFound("Notification.NotFound", "Không tìm thấy thông báo.");

        if (notification.UserId != userId)
            return Error.Forbidden("Notification.Forbidden", "Bạn không có quyền xóa thông báo này.");

        notification.DeletedAt = DateTime.UtcNow;
        notification.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return Result.Success();
    }

    // ── GetOrCreatePreferencesAsync ───────────────────────────────────────────

    public async Task<NotificationPreference> GetOrCreatePreferencesAsync(
        Guid userId, CancellationToken ct = default)
    {
        var existing = await _db.NotificationPreferences
            .FirstOrDefaultAsync(p => p.UserId == userId, ct);

        if (existing is not null) return existing;

        // Create and persist a new preference record with all defaults = true
        var pref = new NotificationPreference
        {
            Id      = Guid.NewGuid(),
            UserId  = userId,
            CreatedAt = DateTime.UtcNow
            // all booleans default to true per entity definition
        };

        _db.NotificationPreferences.Add(pref);
        await _db.SaveChangesAsync(ct);
        return pref;
    }

    // ── UpdatePreferencesAsync ────────────────────────────────────────────────

    public async Task<Result<NotificationPreferenceResponse>> UpdatePreferencesAsync(
        Guid userId,
        UpdateNotificationPreferenceRequest request,
        CancellationToken ct = default)
    {
        // Upsert
        var pref = await GetOrCreatePreferencesAsync(userId, ct);

        pref.InAppNotificationsEnabled    = request.InAppNotificationsEnabled;
        pref.EmailNotificationsEnabled    = request.EmailNotificationsEnabled;
        pref.BillingNotificationsEnabled  = request.BillingNotificationsEnabled;
        pref.ResumeNotificationsEnabled   = request.ResumeNotificationsEnabled;
        pref.MatchingNotificationsEnabled = request.MatchingNotificationsEnabled;
        pref.InterviewNotificationsEnabled = request.InterviewNotificationsEnabled;
        pref.MentorNotificationsEnabled   = request.MentorNotificationsEnabled;
        pref.SystemNotificationsEnabled   = request.SystemNotificationsEnabled;
        pref.UpdatedAt                    = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return MapPreferenceResponse(pref);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private static NotificationPreferenceResponse MapPreferenceResponse(NotificationPreference p) => new()
    {
        InAppNotificationsEnabled    = p.InAppNotificationsEnabled,
        EmailNotificationsEnabled    = p.EmailNotificationsEnabled,
        BillingNotificationsEnabled  = p.BillingNotificationsEnabled,
        ResumeNotificationsEnabled   = p.ResumeNotificationsEnabled,
        MatchingNotificationsEnabled = p.MatchingNotificationsEnabled,
        InterviewNotificationsEnabled = p.InterviewNotificationsEnabled,
        MentorNotificationsEnabled   = p.MentorNotificationsEnabled,
        SystemNotificationsEnabled   = p.SystemNotificationsEnabled
    };
}
