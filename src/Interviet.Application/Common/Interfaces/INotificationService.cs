using Interviet.Contracts.Notifications;
using Interviet.Domain.Notifications;
using Interviet.Shared.Results;

namespace Interviet.Application.Common.Interfaces;

/// <summary>
/// In-app notification service.
/// All create methods are fire-and-forget safe — they never throw exceptions that
/// would break the calling business flow.
/// </summary>
public interface INotificationService
{
    /// <summary>
    /// Creates a notification if notifications are enabled and user's preferences allow it.
    /// Skips silently (no exception) if disabled, preference off, or duplicate deduplication key.
    /// </summary>
    Task CreateAsync(
        Guid userId,
        string type,
        string title,
        string message,
        string? actionUrl = null,
        object? data = null,
        string priority = "normal",
        string? deduplicationKey = null,
        CancellationToken ct = default);

    /// <summary>Returns the number of unread (non-deleted) notifications for the user.</summary>
    Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Marks a single notification as read.
    /// Returns Forbidden if the notification belongs to another user.
    /// Idempotent — already-read notifications return success.
    /// </summary>
    Task<Result<MarkReadResponse>> MarkAsReadAsync(Guid userId, Guid notificationId, CancellationToken ct = default);

    /// <summary>Marks all unread notifications (optionally filtered by type) as read. Returns updated count.</summary>
    Task<Result<MarkAllReadResponse>> MarkAllAsReadAsync(Guid userId, string? type = null, CancellationToken ct = default);

    /// <summary>Soft-deletes a notification (sets DeletedAt). Returns Forbidden if not owner.</summary>
    Task<Result> DeleteAsync(Guid userId, Guid notificationId, CancellationToken ct = default);

    /// <summary>
    /// Gets the user's notification preferences.
    /// If no preference record exists, returns a default object (all true) WITHOUT saving to DB.
    /// </summary>
    Task<NotificationPreference> GetOrCreatePreferencesAsync(Guid userId, CancellationToken ct = default);

    /// <summary>Upserts notification preferences. Returns updated preferences.</summary>
    Task<Result<NotificationPreferenceResponse>> UpdatePreferencesAsync(
        Guid userId,
        UpdateNotificationPreferenceRequest request,
        CancellationToken ct = default);
}
