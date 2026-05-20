using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Common.Options;
using Interviet.Contracts.Notifications;
using Microsoft.Extensions.Options;

namespace Interviet.Api.Controllers;

/// <summary>
/// Notification Center — Phase 11A (polling-based, no SignalR).
/// Frontend polls GET /unread-count every 30-60 seconds.
/// </summary>
[Authorize]
[Route("api/v1/notifications")]
public class NotificationsController : ApiControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly ICurrentUserService  _currentUser;
    private readonly NotificationOptions  _opts;

    public NotificationsController(
        INotificationService notificationService,
        ICurrentUserService currentUser,
        IOptions<NotificationOptions> opts)
    {
        _notificationService = notificationService;
        _currentUser         = currentUser;
        _opts                = opts.Value;
    }

    // ── GET /notifications ────────────────────────────────────────────────────

    /// <summary>
    /// Lists notifications for the current user (newest first, paginated).
    /// Excludes soft-deleted notifications.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetNotifications(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool? isRead = null,
        [FromQuery] string? type = null,
        [FromQuery] string? priority = null,
        CancellationToken ct = default)
    {
        var userId = _currentUser.UserId;
        page     = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, _opts.MaxPageSize);

        // Build query via service (delegated to avoid fat controller)
        var result = await GetNotificationsInternalAsync(userId, page, pageSize, isRead, type, priority, ct);
        return Ok(result);
    }

    private async Task<NotificationListResponse> GetNotificationsInternalAsync(
        Guid userId, int page, int pageSize,
        bool? isRead, string? type, string? priority,
        CancellationToken ct)
    {
        // Access DB via IAppDbContext injected separately
        var db = HttpContext.RequestServices.GetRequiredService<IAppDbContext>();

        var query = db.Notifications
            .Where(n => n.UserId == userId && n.DeletedAt == null);

        if (isRead.HasValue)
            query = query.Where(n => n.IsRead == isRead.Value);

        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(n => n.Type == type);

        if (!string.IsNullOrWhiteSpace(priority))
            query = query.Where(n => n.Priority == priority);

        var totalItems = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions
            .CountAsync(query, ct);

        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

        var items = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions
            .ToListAsync(
                query.OrderByDescending(n => n.CreatedAt)
                     .Skip((page - 1) * pageSize)
                     .Take(pageSize),
                ct);

        var mapped = items.Select(n => MapToResponse(n)).ToList();

        return new NotificationListResponse
        {
            Items      = mapped,
            Page       = page,
            PageSize   = pageSize,
            TotalItems = totalItems,
            TotalPages = totalPages
        };
    }

    // ── GET /notifications/unread-count ──────────────────────────────────────

    /// <summary>Returns unread notification count. Frontend should poll this every 30-60s.</summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount(CancellationToken ct = default)
    {
        var count = await _notificationService.GetUnreadCountAsync(_currentUser.UserId, ct);
        return Ok(new UnreadCountResponse { UnreadCount = count });
    }

    // ── PATCH /notifications/{id}/read ───────────────────────────────────────

    /// <summary>Marks a single notification as read. Idempotent.</summary>
    [HttpPatch("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken ct = default)
    {
        var result = await _notificationService.MarkAsReadAsync(_currentUser.UserId, id, ct);
        return FromResult(result);
    }

    // ── PATCH /notifications/read-all ────────────────────────────────────────

    /// <summary>
    /// Marks all unread notifications as read (optionally filtered by type).
    /// Body is optional — if empty, all unread are marked.
    /// </summary>
    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllRead(
        [FromBody] MarkAllReadRequest? request = null,
        CancellationToken ct = default)
    {
        var result = await _notificationService.MarkAllAsReadAsync(
            _currentUser.UserId, request?.Type, ct);
        return FromResult(result);
    }

    // ── DELETE /notifications/{id} ───────────────────────────────────────────

    /// <summary>Soft-deletes a notification. Only the owner can delete.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteNotification(Guid id, CancellationToken ct = default)
    {
        var result = await _notificationService.DeleteAsync(_currentUser.UserId, id, ct);
        return FromResult(result);
    }

    // ── GET /notifications/preferences ───────────────────────────────────────

    /// <summary>Gets notification preferences. Creates default (all-true) record if not yet set.</summary>
    [HttpGet("preferences")]
    public async Task<IActionResult> GetPreferences(CancellationToken ct = default)
    {
        var pref = await _notificationService.GetOrCreatePreferencesAsync(_currentUser.UserId, ct);
        return Ok(new NotificationPreferenceResponse
        {
            InAppNotificationsEnabled    = pref.InAppNotificationsEnabled,
            EmailNotificationsEnabled    = pref.EmailNotificationsEnabled,
            BillingNotificationsEnabled  = pref.BillingNotificationsEnabled,
            ResumeNotificationsEnabled   = pref.ResumeNotificationsEnabled,
            MatchingNotificationsEnabled = pref.MatchingNotificationsEnabled,
            InterviewNotificationsEnabled = pref.InterviewNotificationsEnabled,
            MentorNotificationsEnabled   = pref.MentorNotificationsEnabled,
            SystemNotificationsEnabled   = pref.SystemNotificationsEnabled
        });
    }

    // ── PUT /notifications/preferences ───────────────────────────────────────

    /// <summary>Updates (upserts) notification preferences.</summary>
    [HttpPut("preferences")]
    public async Task<IActionResult> UpdatePreferences(
        [FromBody] UpdateNotificationPreferenceRequest request,
        CancellationToken ct = default)
    {
        var result = await _notificationService.UpdatePreferencesAsync(_currentUser.UserId, request, ct);
        return FromResult(result);
    }

    // ── POST /notifications/test ──────────────────────────────────────────────

    /// <summary>
    /// Development-only: creates a test notification for the current user.
    /// Only available when Notifications:EnableTestEndpoint=true.
    /// </summary>
    [HttpPost("test")]
    public async Task<IActionResult> CreateTestNotification(
        [FromBody] CreateTestNotificationRequest request,
        CancellationToken ct = default)
    {
        if (!_opts.EnableTestEndpoint)
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                type   = "https://api.interviet.vn/errors/notifications-test-disabled",
                title  = "Notifications.TestEndpointDisabled",
                detail = "Test notification endpoint is disabled in this environment.",
                code   = "Notifications.TestEndpointDisabled"
            });

        var testDeduplicationKey = $"test.{Guid.NewGuid()}"; // Always unique for test
        await _notificationService.CreateAsync(
            userId           : _currentUser.UserId,
            type             : request.Type,
            title            : request.Title,
            message          : request.Message,
            actionUrl        : request.ActionUrl,
            data             : new { source = "test_endpoint", createdAt = DateTime.UtcNow },
            priority         : request.Priority,
            deduplicationKey : testDeduplicationKey,
            ct               : ct);

        return Ok(new { message = "Test notification created.", type = request.Type });
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private static NotificationResponse MapToResponse(Domain.Notifications.Notification n)
    {
        object? data = null;
        if (!string.IsNullOrWhiteSpace(n.DataJson))
        {
            try
            {
                data = System.Text.Json.JsonSerializer.Deserialize<object>(n.DataJson);
            }
            catch
            {
                // If JSON parsing fails, fall back to raw string
                data = n.DataJson;
            }
        }

        return new NotificationResponse
        {
            Id        = n.Id,
            Type      = n.Type,
            Title     = n.Title,
            Message   = n.Message,
            Priority  = n.Priority,
            ActionUrl = n.ActionUrl,
            Data      = data,
            IsRead    = n.IsRead,
            ReadAt    = n.ReadAt,
            CreatedAt = n.CreatedAt
        };
    }
}
