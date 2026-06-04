using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Billing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Interviet.Infrastructure.Services;

/// <summary>
/// Background service that runs every 5 minutes.
/// Finds mentor bookings stuck in "pending_payment" whose checkout session has expired,
/// marks them as "payment_expired", releases the reserved availability slot,
/// and expires the checkout session record.
/// </summary>
public sealed class MentorBookingCleanupBackgroundService : BackgroundService
{
    private static readonly TimeSpan _interval = TimeSpan.FromMinutes(5);

    private readonly IServiceProvider _services;
    private readonly ILogger<MentorBookingCleanupBackgroundService> _logger;

    public MentorBookingCleanupBackgroundService(
        IServiceProvider services,
        ILogger<MentorBookingCleanupBackgroundService> logger)
    {
        _services = services;
        _logger   = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("MentorBookingCleanupBackgroundService started.");

        // Small initial delay to let the application fully start up
        await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupExpiredBookingsAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "MentorBookingCleanup encountered an error.");
            }

            await Task.Delay(_interval, stoppingToken);
        }

        _logger.LogInformation("MentorBookingCleanupBackgroundService stopped.");
    }

    private async Task CleanupExpiredBookingsAsync(CancellationToken ct)
    {
        using var scope = _services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IAppDbContext>();

        var now = DateTime.UtcNow;

        // Find all pending checkout sessions that have passed their expiry time
        // and whose purpose is "mentor_booking"
        var expiredSessions = await db.BillingCheckoutSessions
            .Where(s => s.Purpose == "mentor_booking"
                     && s.Status == CheckoutSessionStatus.Pending
                     && s.ExpiresAt < now
                     && s.ResourceId != null)
            .ToListAsync(ct);

        if (expiredSessions.Count == 0)
            return;

        _logger.LogInformation(
            "MentorBookingCleanup: Found {Count} expired mentor booking checkout session(s) to clean up.",
            expiredSessions.Count);

        var bookingIds = expiredSessions
            .Where(s => s.ResourceId.HasValue)
            .Select(s => s.ResourceId!.Value)
            .ToList();

        // Load the related bookings and their slots
        var bookings = await db.MentorBookings
            .Include(b => b.AvailabilitySlot)
            .Where(b => bookingIds.Contains(b.Id) && b.Status == "pending_payment")
            .ToListAsync(ct);

        int cleanedCount = 0;
        foreach (var session in expiredSessions)
        {
            // Mark the checkout session as expired
            session.Status      = CheckoutSessionStatus.Expired;
            session.UpdatedAt   = now;
            session.CompletedAt = now;

            if (!session.ResourceId.HasValue) continue;

            var booking = bookings.FirstOrDefault(b => b.Id == session.ResourceId.Value);
            if (booking is null) continue;

            // Mark the booking as payment_expired
            booking.Status     = "payment_expired";
            booking.UpdatedAt  = now;
            booking.CancelledAt = now;
            booking.CancelReason = "Phiên thanh toán hết hạn — hệ thống tự động hủy.";

            // Release the availability slot back to "available"
            if (booking.AvailabilitySlot is not null)
            {
                booking.AvailabilitySlot.Status       = "available";
                booking.AvailabilitySlot.ReservedUntil = null;
            }

            cleanedCount++;
        }

        await db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "MentorBookingCleanup: Cleaned up {Count} expired booking(s) and released their availability slots.",
            cleanedCount);
    }
}
