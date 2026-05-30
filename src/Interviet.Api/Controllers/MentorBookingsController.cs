using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Common.Options;
using Interviet.Contracts.Billing;
using Interviet.Contracts.Mentors;
using Interviet.Contracts.Notifications;
using Interviet.Domain.Billing;
using Interviet.Domain.Mentors;

namespace Interviet.Api.Controllers;

[Authorize]
[Route("api/v1/mentor-bookings")]
public class MentorBookingsController : ApiControllerBase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly BillingOptions _billing;
    private readonly INotificationService _notificationService;
    private readonly ILogger<MentorBookingsController> _logger;

    private static readonly HashSet<string> ValidServiceTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "cv_review",
        "mock_interview",
        "career_coaching",
        "technical_mentoring"
    };

    public MentorBookingsController(
        IAppDbContext db,
        ICurrentUserService currentUser,
        IOptions<BillingOptions> billing,
        INotificationService notificationService,
        ILogger<MentorBookingsController> logger)
    {
        _db = db;
        _currentUser = currentUser;
        _billing = billing.Value;
        _notificationService = notificationService;
        _logger = logger;
    }

    /// <summary>
    /// POST /api/v1/mentor-bookings
    /// Creates a mentor booking by reserving an availability slot and initiating a checkout session.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> BookMentor([FromBody] BookMentorRequest request, CancellationToken ct)
    {
        if (request == null)
            return BadRequest(new { error = "Request body is required." });

        if (string.IsNullOrWhiteSpace(request.ServiceType) || !ValidServiceTypes.Contains(request.ServiceType))
        {
            return BadRequest(new { error = $"Invalid serviceType. Must be one of: {string.Join(", ", ValidServiceTypes)}" });
        }

        var slot = await _db.MentorAvailabilitySlots
            .Include(s => s.Mentor)
            .FirstOrDefaultAsync(s => s.Id == request.SlotId, ct);

        if (slot is null)
            return NotFound(new { error = "Availability slot not found." });

        var now = DateTime.UtcNow;
        var isAvailable = slot.Status == "available" && (slot.ReservedUntil == null || slot.ReservedUntil < now) && slot.StartsAt > now;
        if (!isAvailable)
        {
            return BadRequest(new { error = "Availability slot is no longer available or is already reserved." });
        }

        // 1. Reserve slot
        slot.Status = "reserved";
        slot.ReservedUntil = now.AddMinutes(_billing.MockCheckoutTtlMinutes);

        // 2. Create Booking
        var bookingId = Guid.NewGuid();
        var booking = new MentorBooking
        {
            Id = bookingId,
            UserId = _currentUser.UserId,
            MentorId = slot.MentorId,
            AvailabilitySlotId = slot.Id,
            Status = "pending_payment",
            ScheduledStartsAt = slot.StartsAt,
            ScheduledEndsAt = slot.EndsAt,
            ServiceType = request.ServiceType.ToLower(),
            Amount = slot.PriceAmount,
            CurrencyCode = slot.CurrencyCode,
            CandidateNotes = request.CandidateNotes,
            CreatedAt = now,
            UpdatedAt = now
        };
        _db.MentorBookings.Add(booking);

        // 3. Create Checkout Session
        var epoch = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        long orderCode = (long)(DateTime.UtcNow - epoch).TotalMilliseconds;

        var checkoutSessionId = Guid.NewGuid();
        var checkoutSession = new BillingCheckoutSession
        {
            Id = checkoutSessionId,
            UserId = _currentUser.UserId,
            OrderCode = orderCode,
            Provider = "vnpay", // default mock provider
            Amount = slot.PriceAmount,
            CurrencyCode = slot.CurrencyCode,
            Status = CheckoutSessionStatus.Pending,
            ExpiresAt = now.AddMinutes(_billing.MockCheckoutTtlMinutes),
            Purpose = "mentor_booking",
            ResourceId = bookingId,
            Description = $"Đặt lịch Mentor với {slot.Mentor.FullName}",
            CreatedAt = now,
            UpdatedAt = now
        };
        checkoutSession.CheckoutUrl = $"{_billing.FrontendBaseUrl.TrimEnd('/')}/checkout/mock/{checkoutSessionId}";
        _db.BillingCheckoutSessions.Add(checkoutSession);

        await _db.SaveChangesAsync(ct);

        if (slot.Mentor.UserId.HasValue)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    await _notificationService.CreateAsync(
                        userId: slot.Mentor.UserId.Value,
                        type: "mentor.booking_created",
                        title: "Yêu cầu đặt lịch hẹn mới",
                        message: $"Ứng viên đã gửi yêu cầu đặt lịch hẹn mới cho dịch vụ {booking.ServiceType}.",
                        actionUrl: $"/mentor-bookings/{booking.Id}"
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to create booking created notification for mentor {MentorId}", slot.Mentor.Id);
                }
            });
        }

        var response = new BookMentorResponse
        {
            BookingId = bookingId,
            Status = booking.Status,
            Amount = booking.Amount,
            CurrencyCode = booking.CurrencyCode,
            CheckoutSessionId = checkoutSessionId,
            CheckoutUrl = checkoutSession.CheckoutUrl,
            PaymentInstructionsUrl = $"/api/v1/billing/checkout-sessions/{checkoutSessionId}/payment-instructions"
        };

        return Ok(response);
    }

    /// <summary>
    /// GET /api/v1/mentor-bookings
    /// Returns the list of bookings for the current candidate user.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetMyBookings(CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        var bookings = await _db.MentorBookings
            .Include(b => b.Mentor)
            .Include(b => b.Review)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync(ct);

        var bookingIds = bookings.Select(b => b.Id).ToList();
        var sessions = await _db.BillingCheckoutSessions
            .Where(s => s.Purpose == "mentor_booking" && s.ResourceId.HasValue && bookingIds.Contains(s.ResourceId.Value))
            .ToListAsync(ct);

        var responseList = bookings.Select(b => {
            var session = sessions.FirstOrDefault(s => s.ResourceId == b.Id);
            return new MentorBookingResponse
            {
                Id = b.Id,
                UserId = b.UserId,
                MentorId = b.MentorId,
                MentorName = b.Mentor.FullName,
                MentorHeadline = b.Mentor.Headline,
                MentorAvatarUrl = b.Mentor.AvatarUrl,
                AvailabilitySlotId = b.AvailabilitySlotId,
                Status = b.Status,
                ScheduledStartsAt = b.ScheduledStartsAt,
                ScheduledEndsAt = b.ScheduledEndsAt,
                ServiceType = b.ServiceType,
                Amount = b.Amount,
                CurrencyCode = b.CurrencyCode,
                MeetingUrl = b.MeetingUrl,
                CandidateNotes = b.CandidateNotes,
                CancelReason = b.CancelReason,
                CancelledAt = b.CancelledAt,
                CompletedAt = b.CompletedAt,
                CreatedAt = b.CreatedAt,
                UpdatedAt = b.UpdatedAt,
                Review = b.Review != null ? new ReviewResponse
                {
                    Id = b.Review.Id,
                    MentorBookingId = b.Review.MentorBookingId,
                    MentorId = b.Review.MentorId,
                    UserId = b.Review.UserId,
                    Rating = b.Review.Rating,
                    Comment = b.Review.Comment,
                    CreatedAt = b.Review.CreatedAt
                } : null,
                CheckoutSessionId = session?.Id,
                CheckoutStatus = session?.Status
            };
        }).ToList();

        return Ok(responseList);
    }

    /// <summary>
    /// GET /api/v1/mentor-bookings/{id}
    /// Returns detailed info about a specific booking.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetBooking(Guid id, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        var b = await _db.MentorBookings
            .Include(x => x.Mentor)
            .Include(x => x.Review)
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, ct);

        if (b is null)
            return NotFound(new { error = "Booking not found." });

        var session = await _db.BillingCheckoutSessions
            .FirstOrDefaultAsync(s => s.Purpose == "mentor_booking" && s.ResourceId == b.Id, ct);

        var response = new MentorBookingResponse
        {
            Id = b.Id,
            UserId = b.UserId,
            MentorId = b.MentorId,
            MentorName = b.Mentor.FullName,
            MentorHeadline = b.Mentor.Headline,
            MentorAvatarUrl = b.Mentor.AvatarUrl,
            AvailabilitySlotId = b.AvailabilitySlotId,
            Status = b.Status,
            ScheduledStartsAt = b.ScheduledStartsAt,
            ScheduledEndsAt = b.ScheduledEndsAt,
            ServiceType = b.ServiceType,
            Amount = b.Amount,
            CurrencyCode = b.CurrencyCode,
            MeetingUrl = b.MeetingUrl,
            CandidateNotes = b.CandidateNotes,
            CancelReason = b.CancelReason,
            CancelledAt = b.CancelledAt,
            CompletedAt = b.CompletedAt,
            CreatedAt = b.CreatedAt,
            UpdatedAt = b.UpdatedAt,
            Review = b.Review != null ? new ReviewResponse
            {
                Id = b.Review.Id,
                MentorBookingId = b.Review.MentorBookingId,
                MentorId = b.Review.MentorId,
                UserId = b.Review.UserId,
                Rating = b.Review.Rating,
                Comment = b.Review.Comment,
                CreatedAt = b.Review.CreatedAt
            } : null,
            CheckoutSessionId = session?.Id,
            CheckoutStatus = session?.Status
        };

        return Ok(response);
    }

    /// <summary>
    /// POST /api/v1/mentor-bookings/{id}/cancel
    /// Cancels a booking.
    /// </summary>
    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> CancelBooking(Guid id, [FromBody] CancelBookingRequest request, CancellationToken ct)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Reason))
            return BadRequest(new { error = "Cancel reason is required." });

        var userId = _currentUser.UserId;
        var b = await _db.MentorBookings
            .Include(x => x.Mentor)
            .Include(x => x.AvailabilitySlot)
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, ct);

        if (b is null)
            return NotFound(new { error = "Booking not found." });

        if (b.Status != "pending_payment" && b.Status != "confirmed")
            return BadRequest(new { error = $"Booking cannot be cancelled from its current status: '{b.Status}'." });

        var now = DateTime.UtcNow;
        if (b.Status == "confirmed" && b.ScheduledStartsAt <= now)
            return BadRequest(new { error = "Cannot cancel a booking that has already started or passed." });

        b.Status = "cancelled";
        b.CancelReason = request.Reason;
        b.CancelledAt = now;
        b.UpdatedAt = now;

        if (b.AvailabilitySlot is not null && b.AvailabilitySlot.StartsAt > now)
        {
            b.AvailabilitySlot.Status = "available";
            b.AvailabilitySlot.ReservedUntil = null;
        }

        // Cancel pending checkout session if any
        var session = await _db.BillingCheckoutSessions
            .FirstOrDefaultAsync(s => s.Purpose == "mentor_booking" && s.ResourceId == b.Id && s.Status == "pending", ct);
        if (session is not null)
        {
            session.Status = CheckoutSessionStatus.Cancelled;
            session.FailureReason = "Booking cancelled by user";
            session.UpdatedAt = now;
            session.CompletedAt = now;
        }

        await _db.SaveChangesAsync(ct);

        // Fire-and-forget notification
        _ = Task.Run(async () =>
        {
            try
            {
                await _notificationService.CreateAsync(
                    userId           : b.UserId,
                    type             : "mentor.booking_cancelled",
                    title            : "Lịch hẹn Mentor đã bị hủy",
                    message          : $"Lịch đặt với {b.Mentor.FullName} đã bị hủy. Lý do: {request.Reason}",
                    actionUrl        : $"/mentor-bookings/{b.Id}",
                    data             : new
                    {
                        bookingId = b.Id,
                        mentorName = b.Mentor.FullName,
                        reason = request.Reason
                    },
                    priority         : NotificationPriority.Normal,
                    deduplicationKey : $"mentor.booking_cancelled:{b.Id}");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to create booking cancelled notification. BookingId={BookingId}", b.Id);
            }
        });

        return NoContent();
    }

    /// <summary>
    /// POST /api/v1/mentor-bookings/{id}/simulate-complete
    /// Simulates completion of the booking.
    /// </summary>
    [HttpPost("{id:guid}/simulate-complete")]
    public async Task<IActionResult> SimulateComplete(Guid id, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        var b = await _db.MentorBookings
            .Include(x => x.Mentor)
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, ct);

        if (b is null)
            return NotFound(new { error = "Booking not found." });

        if (b.Status != "confirmed")
            return BadRequest(new { error = "Only confirmed bookings can be completed." });

        var now = DateTime.UtcNow;
        b.Status = "completed";
        b.CompletedAt = now;
        b.UpdatedAt = now;

        await _db.SaveChangesAsync(ct);

        // Fire-and-forget notification
        _ = Task.Run(async () =>
        {
            try
            {
                await _notificationService.CreateAsync(
                    userId           : b.UserId,
                    type             : "mentor.booking_completed",
                    title            : "Lịch hẹn Mentor đã hoàn thành",
                    message          : $"Lịch đặt với {b.Mentor.FullName} đã hoàn thành. Hãy gửi đánh giá để chia sẻ cảm nhận của bạn.",
                    actionUrl        : $"/mentor-bookings/{b.Id}",
                    data             : new
                    {
                        bookingId = b.Id,
                        mentorName = b.Mentor.FullName
                    },
                    priority         : NotificationPriority.Normal,
                    deduplicationKey : $"mentor.booking_completed:{b.Id}");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to create booking completed notification. BookingId={BookingId}", b.Id);
            }
        });

        return NoContent();
    }

    /// <summary>
    /// POST /api/v1/mentor-bookings/{id}/review
    /// Submits a review for a completed booking.
    /// </summary>
    [HttpPost("{id:guid}/review")]
    public async Task<IActionResult> SubmitReview(Guid id, [FromBody] SubmitReviewRequest request, CancellationToken ct)
    {
        if (request == null)
            return BadRequest(new { error = "Request body is required." });

        if (request.Rating < 1 || request.Rating > 5)
            return BadRequest(new { error = "Rating must be between 1 and 5." });

        var userId = _currentUser.UserId;
        var b = await _db.MentorBookings
            .Include(x => x.Mentor)
            .Include(x => x.Review)
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, ct);

        if (b is null)
            return NotFound(new { error = "Booking not found." });

        if (b.Status != "completed")
            return BadRequest(new { error = "Reviews can only be submitted for completed bookings." });

        if (b.Review is not null)
            return Conflict(new { error = "You have already submitted a review for this booking." });

        var now = DateTime.UtcNow;
        var review = new MentorReview
        {
            Id = Guid.NewGuid(),
            MentorBookingId = b.Id,
            MentorId = b.MentorId,
            UserId = b.UserId,
            Rating = request.Rating,
            Comment = request.Comment,
            CreatedAt = now,
            UpdatedAt = now
        };
        _db.MentorReviews.Add(review);

        // Recalculate mentor rating average/count
        var mentor = b.Mentor;
        var allRatings = await _db.MentorReviews
            .Where(r => r.MentorId == mentor.Id)
            .Select(r => r.Rating)
            .ToListAsync(ct);

        allRatings.Add(request.Rating);

        mentor.RatingCount = allRatings.Count;
        mentor.RatingAverage = Math.Round((decimal)allRatings.Average(), 2);
        mentor.UpdatedAt = now;

        await _db.SaveChangesAsync(ct);

        // Fire-and-forget notification
        _ = Task.Run(async () =>
        {
            try
            {
                await _notificationService.CreateAsync(
                    userId           : b.UserId,
                    type             : "mentor.review_submitted",
                    title            : "Đánh giá Mentor thành công",
                    message          : $"Cảm ơn bạn đã gửi đánh giá {request.Rating} sao cho Mentor {mentor.FullName}.",
                    actionUrl        : $"/mentor-bookings/{b.Id}",
                    data             : new
                    {
                        bookingId = b.Id,
                        mentorName = mentor.FullName,
                        rating = request.Rating
                    },
                    priority         : NotificationPriority.Normal,
                    deduplicationKey : $"mentor.review_submitted:{b.Id}");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to create review submitted notification. BookingId={BookingId}", b.Id);
            }
        });

        var response = new ReviewResponse
        {
            Id = review.Id,
            MentorBookingId = review.MentorBookingId,
            MentorId = review.MentorId,
            UserId = review.UserId,
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt
        };

        return Ok(response);
    }
}
