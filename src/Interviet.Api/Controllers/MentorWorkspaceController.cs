using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Mentors;
using Interviet.Contracts.Billing;
using Interviet.Domain.Mentors;
using Interviet.Domain.Identity;

namespace Interviet.Api.Controllers;

[Authorize(Policy = "MentorOrAdmin")]
[Route("api/v1/mentor")]
public sealed class MentorWorkspaceController : ApiControllerBase
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditLogService _auditLogService;
    private readonly INotificationService _notificationService;

    public MentorWorkspaceController(
        IAppDbContext context,
        ICurrentUserService currentUserService,
        IAuditLogService auditLogService,
        INotificationService notificationService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _auditLogService = auditLogService;
        _notificationService = notificationService;
    }

    /// <summary>
    /// Gets the logged-in mentor's profile.
    /// Auto-creates a blank profile linked to their UserId on first access.
    /// Route: GET /api/v1/mentor/profile
    /// </summary>
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = _currentUserService.UserId;

        // Fetch existing mentor profile
        var profile = await _context.MentorProfiles
            .Include(p => p.Specialties)
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (profile == null)
        {
            // Fetch current user details to initialize profile
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return NotFound(new { message = "User account not found." });
            }

            // Create a default blank mentor profile
            profile = new MentorProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                FullName = user.FullName,
                AvatarUrl = user.AvatarUrl,
                Headline = "Chuyên gia / Mentor",
                Bio = "",
                YearsOfExperience = 0.0m,
                RatingAverage = 5.0m,
                RatingCount = 0,
                Status = "active",
                IsVerified = false,
                ExpertiseJson = "[]",
                IndustriesJson = "[]",
                LanguagesJson = "[]",
                CreatedAt = DateTime.UtcNow
            };

            _context.MentorProfiles.Add(profile);
            await _context.SaveChangesAsync();

            try
            {
                await _auditLogService.LogAsync(
                    action: "mentor.profile_autocreated",
                    resource: "MentorProfile",
                    resourceId: profile.Id.ToString(),
                    metadata: new { email = user.Email }
                );
            }
            catch {}
            
            // Reload to ensure specialties collection is initialized
            profile.Specialties = new List<MentorSpecialty>();
        }

        // Deserialize lists from JSON columns
        var expertise = string.IsNullOrWhiteSpace(profile.ExpertiseJson)
            ? new List<string>()
            : System.Text.Json.JsonSerializer.Deserialize<List<string>>(profile.ExpertiseJson) ?? new List<string>();

        var industries = string.IsNullOrWhiteSpace(profile.IndustriesJson)
            ? new List<string>()
            : System.Text.Json.JsonSerializer.Deserialize<List<string>>(profile.IndustriesJson) ?? new List<string>();

        var languages = string.IsNullOrWhiteSpace(profile.LanguagesJson)
            ? new List<string>()
            : System.Text.Json.JsonSerializer.Deserialize<List<string>>(profile.LanguagesJson) ?? new List<string>();

        var specialtiesMapped = profile.Specialties.Select(s => new MentorSpecialtyDto
        {
            Id = s.Id,
            Code = s.Code,
            Name = s.Name,
            Description = s.Description
        }).ToList();

        var response = new MentorProfileResponse
        {
            Id = profile.Id,
            UserId = profile.UserId,
            IsVerified = profile.IsVerified,
            FullName = profile.FullName,
            Headline = profile.Headline,
            AvatarUrl = profile.AvatarUrl,
            Bio = profile.Bio,
            YearsOfExperience = profile.YearsOfExperience,
            RatingAverage = profile.RatingAverage,
            RatingCount = profile.RatingCount,
            Status = profile.Status,
            Expertise = expertise,
            Industries = industries,
            Languages = languages,
            Specialties = specialtiesMapped
        };

        return Ok(response);
    }

    /// <summary>
    /// Updates the logged-in mentor's profile.
    /// Route: PUT /api/v1/mentor/profile
    /// </summary>
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(UpdateMentorProfileRequest req)
    {
        if (req == null)
            return BadRequest(new { message = "Request body is required." });

        if (string.IsNullOrWhiteSpace(req.FullName))
            return BadRequest(new { message = "Họ và tên là bắt buộc." });

        var userId = _currentUserService.UserId;

        var profile = await _context.MentorProfiles
            .Include(p => p.Specialties)
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (profile == null)
        {
            return NotFound(new { message = "Mentor profile not found. Please GET the profile first to initialize it." });
        }

        // Update fields
        profile.FullName = req.FullName.Trim();
        profile.Headline = req.Headline?.Trim();
        profile.AvatarUrl = req.AvatarUrl?.Trim();
        profile.Bio = req.Bio?.Trim();
        profile.YearsOfExperience = req.YearsOfExperience;
        profile.ExpertiseJson = System.Text.Json.JsonSerializer.Serialize(req.Expertise ?? new List<string>());
        profile.IndustriesJson = System.Text.Json.JsonSerializer.Serialize(req.Industries ?? new List<string>());
        profile.LanguagesJson = System.Text.Json.JsonSerializer.Serialize(req.Languages ?? new List<string>());
        profile.UpdatedAt = DateTime.UtcNow;

        // Optionally sync user's display details
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user != null)
        {
            user.FullName = profile.FullName;
            if (!string.IsNullOrWhiteSpace(profile.AvatarUrl))
            {
                user.AvatarUrl = profile.AvatarUrl;
            }
        }

        await _context.SaveChangesAsync();

        try
        {
            await _auditLogService.LogAsync(
                action: "mentor.profile_updated",
                resource: "MentorProfile",
                resourceId: profile.Id.ToString(),
                metadata: new { fullName = profile.FullName }
            );
        }
        catch {}

        var expertise = req.Expertise ?? new List<string>();
        var industries = req.Industries ?? new List<string>();
        var languages = req.Languages ?? new List<string>();

        var specialtiesMapped = profile.Specialties.Select(s => new MentorSpecialtyDto
        {
            Id = s.Id,
            Code = s.Code,
            Name = s.Name,
            Description = s.Description
        }).ToList();

        var response = new MentorProfileResponse
        {
            Id = profile.Id,
            UserId = profile.UserId,
            IsVerified = profile.IsVerified,
            FullName = profile.FullName,
            Headline = profile.Headline,
            AvatarUrl = profile.AvatarUrl,
            Bio = profile.Bio,
            YearsOfExperience = profile.YearsOfExperience,
            RatingAverage = profile.RatingAverage,
            RatingCount = profile.RatingCount,
            Status = profile.Status,
            Expertise = expertise,
            Industries = industries,
            Languages = languages,
            Specialties = specialtiesMapped
        };

        return Ok(response, "Cập nhật hồ sơ Mentor thành công.");
    }

    /// <summary>
    /// Gets all active specialties from the system catalog for the mentor to choose.
    /// Route: GET /api/v1/mentor/specialties
    /// </summary>
    [Authorize(Policy = "MentorOnly")]
    [HttpGet("specialties")]
    public async Task<IActionResult> GetSpecialtiesCatalog()
    {
        var specialties = await _context.MentorSpecialties
            .OrderBy(s => s.Code)
            .Select(s => new MentorSpecialtyDto
            {
                Id = s.Id,
                Code = s.Code,
                Name = s.Name,
                Description = s.Description
            })
            .ToListAsync();

        return Ok(specialties);
    }

    /// <summary>
    /// Self assigns/replaces specialties for the logged-in mentor profile.
    /// Route: POST /api/v1/mentor/profile/specialties
    /// </summary>
    [Authorize(Policy = "MentorOnly")]
    [HttpPost("profile/specialties")]
    public async Task<IActionResult> SelfAssignSpecialties([FromBody] MentorSelfAssignSpecialtiesRequest req)
    {
        if (req == null)
            return BadRequest(new { message = "Request body is required." });

        var userId = _currentUserService.UserId;

        // Fetch existing mentor profile
        var profile = await _context.MentorProfiles
            .Include(p => p.Specialties)
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (profile == null)
        {
            // Fetch current user details to initialize profile
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return NotFound(new { message = "User account not found." });
            }

            // Create a default blank mentor profile
            profile = new MentorProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                FullName = user.FullName,
                AvatarUrl = user.AvatarUrl,
                Headline = "Chuyên gia / Mentor",
                Bio = "",
                YearsOfExperience = 0.0m,
                RatingAverage = 5.0m,
                RatingCount = 0,
                Status = "active",
                IsVerified = false,
                ExpertiseJson = "[]",
                IndustriesJson = "[]",
                LanguagesJson = "[]",
                CreatedAt = DateTime.UtcNow
            };

            _context.MentorProfiles.Add(profile);
            await _context.SaveChangesAsync();

            try
            {
                await _auditLogService.LogAsync(
                    action: "mentor.profile_autocreated",
                    resource: "MentorProfile",
                    resourceId: profile.Id.ToString(),
                    metadata: new { email = user.Email }
                );
            }
            catch {}
            
            profile.Specialties = new List<MentorSpecialty>();
        }

        // Validate specialties if specialtyIds is not empty
        var validSpecialties = new List<MentorSpecialty>();
        if (req.SpecialtyIds != null && req.SpecialtyIds.Any())
        {
            validSpecialties = await _context.MentorSpecialties
                .Where(s => req.SpecialtyIds.Contains(s.Id))
                .ToListAsync();

            if (validSpecialties.Count != req.SpecialtyIds.Distinct().Count())
            {
                return BadRequest(new { message = "Một hoặc nhiều mã chuyên môn không tồn tại trong hệ thống." });
            }
        }

        // Replace specialties
        profile.Specialties.Clear();
        foreach (var s in validSpecialties)
        {
            profile.Specialties.Add(s);
        }

        await _context.SaveChangesAsync();

        try
        {
            await _auditLogService.LogAsync(
                action: "mentor_specialties_updated",
                resource: "MentorProfile",
                resourceId: profile.Id.ToString(),
                metadata: new { specialtyIds = req.SpecialtyIds }
            );
        }
        catch {}

        var specialtiesMapped = profile.Specialties.Select(s => new MentorSpecialtyDto
        {
            Id = s.Id,
            Code = s.Code,
            Name = s.Name,
            Description = s.Description
        }).ToList();

        var dataResponse = new MentorSelfAssignSpecialtiesResponse
        {
            MentorProfileId = profile.Id,
            Specialties = specialtiesMapped
        };

        return Ok(dataResponse, "Cập nhật chuyên môn Mentor thành công.");
    }

    /// <summary>
    /// Gets Mentor Dashboard Summary.
    /// Route: GET /api/v1/mentor/dashboard/summary
    /// </summary>
    [HttpGet("dashboard/summary")]
    public async Task<IActionResult> GetDashboardSummary()
    {
        var userId = _currentUserService.UserId;

        var profile = await _context.MentorProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (profile == null)
        {
            return BadRequest(new { message = "Hồ sơ Mentor chưa được khởi tạo. Vui lòng truy cập trang hồ sơ trước." });
        }

        var mentorId = profile.Id;

        // Booking counts
        var pendingBookings = await _context.MentorBookings.CountAsync(b => b.MentorId == mentorId && b.Status == "pending_payment");
        var confirmedBookings = await _context.MentorBookings.CountAsync(b => b.MentorId == mentorId && b.Status == "confirmed");
        var completedBookings = await _context.MentorBookings.CountAsync(b => b.MentorId == mentorId && b.Status == "completed");
        var cancelledBookings = await _context.MentorBookings.CountAsync(b => b.MentorId == mentorId && b.Status == "cancelled");

        // Total earnings
        var totalEarnings = await _context.MentorBookings
            .Where(b => b.MentorId == mentorId && b.Status == "completed")
            .SumAsync(b => b.Amount);

        // Recent bookings (top 5 sorted by ScheduledStartsAt descending)
        var recentBookingsDb = await _context.MentorBookings
            .Where(b => b.MentorId == mentorId)
            .OrderByDescending(b => b.ScheduledStartsAt)
            .Take(5)
            .ToListAsync();

        var recentBookingsMapped = recentBookingsDb.Select(b => new MentorBookingResponse
        {
            Id = b.Id,
            UserId = b.UserId,
            MentorId = b.MentorId,
            MentorName = profile.FullName,
            MentorHeadline = profile.Headline,
            MentorAvatarUrl = profile.AvatarUrl,
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
            Review = null
        }).ToList();

        var summary = new MentorDashboardSummaryResponse
        {
            PendingBookingsCount = pendingBookings,
            ConfirmedBookingsCount = confirmedBookings,
            CompletedBookingsCount = completedBookings,
            CancelledBookingsCount = cancelledBookings,
            TotalEarningsAmount = totalEarnings,
            CurrencyCode = "VND",
            AverageRating = profile.RatingAverage,
            RecentBookings = recentBookingsMapped
        };

        return Ok(summary);
    }

    /// <summary>
    /// Gets all bookings assigned to the logged-in mentor, paginated, with optional status filter and candidate search.
    /// Route: GET /api/v1/mentor/bookings
    /// </summary>
    [HttpGet("bookings")]
    public async Task<IActionResult> GetBookings(
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var userId = _currentUserService.UserId;

        var profile = await _context.MentorProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (profile == null)
        {
            return BadRequest(new { message = "Hồ sơ Mentor chưa được khởi tạo." });
        }

        var mentorId = profile.Id;

        var bookingsQuery = _context.MentorBookings
            .Include(b => b.Review)
            .Where(b => b.MentorId == mentorId);

        if (!string.IsNullOrWhiteSpace(status))
        {
            bookingsQuery = bookingsQuery.Where(b => b.Status == status);
        }

        // Fetch raw bookings
        var bookings = await bookingsQuery
            .OrderByDescending(b => b.ScheduledStartsAt)
            .ToListAsync();

        // Join/Fetch candidates
        var candidateIds = bookings.Select(b => b.UserId).Distinct().ToList();
        var candidates = await _context.Users
            .Where(u => candidateIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id);

        // Apply in-memory search by candidate name/email if specified
        var mappedBookings = bookings.Select(b => {
            candidates.TryGetValue(b.UserId, out var cand);
            return new MentorBookingDetailForMentorResponse
            {
                Id = b.Id,
                UserId = b.UserId,
                CandidateName = cand?.FullName ?? "Ứng viên",
                CandidateEmail = cand?.Email,
                CandidateAvatarUrl = cand?.AvatarUrl,
                MentorId = b.MentorId,
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
                Review = b.Review != null ? new ReviewResponse
                {
                    Id = b.Review.Id,
                    MentorBookingId = b.Review.MentorBookingId,
                    MentorId = b.Review.MentorId,
                    UserId = b.Review.UserId,
                    Rating = b.Review.Rating,
                    Comment = b.Review.Comment,
                    CreatedAt = b.Review.CreatedAt
                } : null
            };
        });

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLowerInvariant();
            mappedBookings = mappedBookings.Where(b => 
                b.CandidateName.ToLower().Contains(searchLower) || 
                (b.CandidateEmail != null && b.CandidateEmail.ToLower().Contains(searchLower))
            );
        }

        var listMapped = mappedBookings.ToList();
        var total = listMapped.Count;
        var pagedItems = listMapped
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return Ok(new { total, page, pageSize, items = pagedItems });
    }

    /// <summary>
    /// Gets a specific booking detail by ID.
    /// Route: GET /api/v1/mentor/bookings/{id}
    /// </summary>
    [HttpGet("bookings/{id:guid}")]
    public async Task<IActionResult> GetBookingById(Guid id)
    {
        var userId = _currentUserService.UserId;

        var profile = await _context.MentorProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (profile == null)
        {
            return BadRequest(new { message = "Hồ sơ Mentor chưa được khởi tạo." });
        }

        var b = await _context.MentorBookings
            .Include(b => b.Review)
            .FirstOrDefaultAsync(b => b.Id == id && b.MentorId == profile.Id);

        if (b == null)
        {
            return NotFound(new { message = "Không tìm thấy lịch đặt hẹn này." });
        }

        var candidate = await _context.Users.FirstOrDefaultAsync(u => u.Id == b.UserId);

        var response = new MentorBookingDetailForMentorResponse
        {
            Id = b.Id,
            UserId = b.UserId,
            CandidateName = candidate?.FullName ?? "Ứng viên",
            CandidateEmail = candidate?.Email,
            CandidateAvatarUrl = candidate?.AvatarUrl,
            MentorId = b.MentorId,
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
            Review = b.Review != null ? new ReviewResponse
            {
                Id = b.Review.Id,
                MentorBookingId = b.Review.MentorBookingId,
                MentorId = b.Review.MentorId,
                UserId = b.Review.UserId,
                Rating = b.Review.Rating,
                Comment = b.Review.Comment,
                CreatedAt = b.Review.CreatedAt
            } : null
        };

        return Ok(response);
    }

    /// <summary>
    /// Updates booking status (confirmed / cancelled / completed) as a mentor.
    /// Route: POST /api/v1/mentor/bookings/{id}/status
    /// </summary>
    [HttpPost("bookings/{id:guid}/status")]
    public async Task<IActionResult> UpdateBookingStatus(Guid id, UpdateBookingStatusRequest req)
    {
        if (req == null)
            return BadRequest(new { message = "Request body is required." });

        var userId = _currentUserService.UserId;

        var profile = await _context.MentorProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (profile == null)
        {
            return BadRequest(new { message = "Hồ sơ Mentor chưa được khởi tạo." });
        }

        var b = await _context.MentorBookings
            .Include(x => x.AvailabilitySlot)
            .FirstOrDefaultAsync(x => x.Id == id && x.MentorId == profile.Id);

        if (b == null)
        {
            return NotFound(new { message = "Không tìm thấy lịch đặt hẹn này." });
        }

        var normalizedStatus = req.Status.ToLowerInvariant().Trim();
        var validStatuses = new[] { "confirmed", "cancelled", "completed" };
        if (!validStatuses.Contains(normalizedStatus))
        {
            return BadRequest(new { message = $"Trạng thái cập nhật không hợp lệ. Phải thuộc: {string.Join(", ", validStatuses)}" });
        }

        var now = DateTime.UtcNow;
        var prevStatus = b.Status;

        if (normalizedStatus == "cancelled")
        {
            if (string.IsNullOrWhiteSpace(req.CancelReason))
            {
                return BadRequest(new { message = "Lý do hủy lịch đặt hẹn là bắt buộc." });
            }

            b.Status = "cancelled";
            b.CancelReason = req.CancelReason;
            b.CancelledAt = now;
            b.UpdatedAt = now;

            if (b.AvailabilitySlot != null && b.AvailabilitySlot.StartsAt > now)
            {
                b.AvailabilitySlot.Status = "available";
                b.AvailabilitySlot.ReservedUntil = null;
            }

            // Cancel checkout session if any is pending
            var session = await _context.BillingCheckoutSessions
                .FirstOrDefaultAsync(s => s.Purpose == "mentor_booking" && s.ResourceId == b.Id && s.Status == "pending");
            if (session != null)
            {
                session.Status = CheckoutSessionStatus.Cancelled;
                session.FailureReason = "Booking cancelled by mentor";
                session.UpdatedAt = now;
                session.CompletedAt = now;
            }

            try
            {
                await _auditLogService.LogAsync(
                    action: "mentor.booking_cancelled_by_mentor",
                    resource: "MentorBooking",
                    resourceId: b.Id.ToString(),
                    metadata: new { previousStatus = prevStatus, currentStatus = b.Status, reason = req.CancelReason }
                );
            }
            catch {}

            try
            {
                await _notificationService.CreateAsync(
                    userId: b.UserId,
                    type: "mentor.booking_cancelled",
                    title: "Lịch hẹn Mentor đã bị hủy bởi Mentor",
                    message: $"Lịch đặt với {profile.FullName} đã bị hủy bởi Mentor. Lý do: {req.CancelReason}",
                    actionUrl: $"/mentor-bookings/{b.Id}"
                );
            }
            catch {}
        }
        else if (normalizedStatus == "confirmed")
        {
            if (string.IsNullOrWhiteSpace(req.MeetingUrl))
            {
                return BadRequest(new { message = "Link phòng họp trực tuyến (Meeting URL) là bắt buộc khi xác nhận lịch hẹn." });
            }

            if (!Uri.TryCreate(req.MeetingUrl, UriKind.Absolute, out _))
            {
                return BadRequest(new { message = "Link phòng họp phải là một đường dẫn URL hợp lệ (ví dụ: https://meet.google.com/...)." });
            }

            b.Status = "confirmed";
            b.MeetingUrl = req.MeetingUrl.Trim();
            b.UpdatedAt = now;
            if (b.AvailabilitySlot != null)
            {
                b.AvailabilitySlot.Status = "booked";
            }

            try
            {
                await _auditLogService.LogAsync(
                    action: "mentor.booking_confirmed_by_mentor",
                    resource: "MentorBooking",
                    resourceId: b.Id.ToString(),
                    metadata: new { previousStatus = prevStatus, currentStatus = b.Status, meetingUrl = b.MeetingUrl }
                );
            }
            catch {}

            try
            {
                await _notificationService.CreateAsync(
                    userId: b.UserId,
                    type: "mentor.booking_confirmed",
                    title: "Lịch hẹn Mentor được xác nhận",
                    message: $"Lịch đặt với {profile.FullName} đã được xác nhận thành công. Link phòng họp: {b.MeetingUrl}",
                    actionUrl: $"/mentor-bookings/{b.Id}"
                );
            }
            catch {}
        }
        else if (normalizedStatus == "completed")
        {
            if (prevStatus != "confirmed")
            {
                return BadRequest(new { message = "Chỉ có thể hoàn thành những lịch hẹn đang có trạng thái 'confirmed'." });
            }

            b.Status = "completed";
            b.CompletedAt = now;
            b.UpdatedAt = now;

            try
            {
                await _auditLogService.LogAsync(
                    action: "mentor.booking_completed_by_mentor",
                    resource: "MentorBooking",
                    resourceId: b.Id.ToString(),
                    metadata: new { previousStatus = prevStatus, currentStatus = b.Status }
                );
            }
            catch {}

            try
            {
                await _notificationService.CreateAsync(
                    userId: b.UserId,
                    type: "mentor.booking_completed",
                    title: "Lịch hẹn Mentor hoàn thành",
                    message: $"Lịch đặt với {profile.FullName} đã hoàn thành. Hãy chia sẻ đánh giá của bạn nhé.",
                    actionUrl: $"/mentor-bookings/{b.Id}"
                );
            }
            catch {}
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = "Cập nhật trạng thái lịch hẹn thành công.", previousStatus = prevStatus, currentStatus = b.Status });
    }

    /// <summary>
    /// Updates meeting URL of a booking as a mentor.
    /// Route: PATCH /api/v1/mentor/bookings/{id:guid}/meeting-url
    /// </summary>
    [HttpPatch("bookings/{id:guid}/meeting-url")]
    public async Task<IActionResult> UpdateMeetingUrl(Guid id, [FromBody] UpdateMeetingUrlRequest req)
    {
        if (req == null)
            return BadRequest(new { message = "Request body is required." });

        if (string.IsNullOrWhiteSpace(req.MeetingUrl))
            return BadRequest(new { message = "Link phòng họp không được để trống." });

        // Validate URL format simply
        if (!Uri.TryCreate(req.MeetingUrl, UriKind.Absolute, out _))
        {
            return BadRequest(new { message = "Link phòng họp phải là một đường dẫn URL hợp lệ (ví dụ: https://meet.google.com/...)." });
        }

        var userId = _currentUserService.UserId;

        var profile = await _context.MentorProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (profile == null)
        {
            return BadRequest(new { message = "Hồ sơ Mentor chưa được khởi tạo." });
        }

        var b = await _context.MentorBookings
            .FirstOrDefaultAsync(x => x.Id == id && x.MentorId == profile.Id);

        if (b == null)
        {
            return NotFound(new { message = "Không tìm thấy lịch đặt hẹn này." });
        }

        if (b.Status == "cancelled" || b.Status == "completed")
        {
            return BadRequest(new { message = "Không thể cập nhật link phòng họp cho lịch hẹn đã hoàn thành hoặc đã bị hủy." });
        }

        var oldUrl = b.MeetingUrl;
        b.MeetingUrl = req.MeetingUrl.Trim();
        b.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        try
        {
            await _auditLogService.LogAsync(
                action: "mentor.booking_meeting_url_updated",
                resource: "MentorBooking",
                resourceId: b.Id.ToString(),
                metadata: new { oldMeetingUrl = oldUrl, newMeetingUrl = b.MeetingUrl }
            );
        }
        catch {}

        try
        {
            await _notificationService.CreateAsync(
                userId: b.UserId,
                type: "mentor.meeting_url_updated",
                title: "Link phòng họp đã được cập nhật",
                message: $"Mentor {profile.FullName} đã cập nhật link phòng họp mới cho lịch hẹn của bạn.",
                actionUrl: $"/mentor-bookings/{b.Id}"
            );
        }
        catch {}

        return Ok(new { message = "Cập nhật link phòng họp thành công.", meetingUrl = b.MeetingUrl });
    }

    /// <summary>
    /// Gets availability slots of the logged-in mentor.
    /// Route: GET /api/v1/mentor/availability
    /// </summary>
    [HttpGet("availability")]
    public async Task<IActionResult> GetAvailability()
    {
        var userId = _currentUserService.UserId;

        var profile = await _context.MentorProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (profile == null)
        {
            return BadRequest(new { message = "Hồ sơ Mentor chưa được khởi tạo." });
        }

        var slots = await _context.MentorAvailabilitySlots
            .Where(s => s.MentorId == profile.Id)
            .OrderBy(s => s.StartsAt)
            .Select(s => new MentorAvailabilitySlotDto
            {
                Id = s.Id,
                StartsAt = s.StartsAt,
                EndsAt = s.EndsAt,
                Status = s.Status,
                PriceAmount = s.PriceAmount,
                CurrencyCode = s.CurrencyCode
            })
            .ToListAsync();

        return Ok(slots);
    }

    /// <summary>
    /// Configures/updates availability slots of the logged-in mentor.
    /// Route: PUT /api/v1/mentor/availability
    /// </summary>
    [HttpPut("availability")]
    public async Task<IActionResult> ConfigureAvailability(ConfigureAvailabilitySlotsRequest req)
    {
        if (req == null)
            return BadRequest(new { message = "Request body is required." });

        var userId = _currentUserService.UserId;

        var profile = await _context.MentorProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (profile == null)
        {
            return BadRequest(new { message = "Hồ sơ Mentor chưa được khởi tạo." });
        }

        var mentorId = profile.Id;
        var now = DateTime.UtcNow;

        // Clear existing future unbooked slots
        var slotsToDelete = await _context.MentorAvailabilitySlots
            .Where(s => s.MentorId == mentorId && s.StartsAt > now && s.Status == "available" && (s.ReservedUntil == null || s.ReservedUntil < now))
            .ToListAsync();

        _context.MentorAvailabilitySlots.RemoveRange(slotsToDelete);

        // Add new slots
        var addedCount = 0;
        foreach (var item in req.Slots)
        {
            if (item.StartsAt <= now) continue; // Skip past slots

            var newSlot = new MentorAvailabilitySlot
            {
                Id = Guid.NewGuid(),
                MentorId = mentorId,
                StartsAt = item.StartsAt,
                EndsAt = item.EndsAt,
                Status = "available",
                PriceAmount = item.PriceAmount,
                CurrencyCode = item.CurrencyCode
            };

            _context.MentorAvailabilitySlots.Add(newSlot);
            addedCount++;
        }

        await _context.SaveChangesAsync();

        try
        {
            await _auditLogService.LogAsync(
                action: "mentor.availability_configured",
                resource: "MentorProfile",
                resourceId: mentorId.ToString(),
                metadata: new { clearedCount = slotsToDelete.Count, addedCount }
            );
        }
        catch {}

        return Ok(new { clearedCount = slotsToDelete.Count, addedCount }, "Cấu hình khung giờ trống thành công.");
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ADMIN ENDPOINTS (Admin Only)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    /// <summary>
    /// Gets all mentors in system for administrative review.
    /// Route: GET /api/v1/mentor/admin/mentors
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpGet("admin/mentors")]
    public async Task<IActionResult> AdminGetMentors(
        [FromQuery] string? search,
        [FromQuery] bool? isVerified,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;

        // Auto-create profiles for users assigned as mentors who don't have a profile yet
        var mentorUsersWithoutProfile = await _context.Users
            .Where(u => u.RoleCode == RoleCodes.Mentor)
            .Where(u => !_context.MentorProfiles.Any(p => p.UserId == u.Id))
            .ToListAsync();

        if (mentorUsersWithoutProfile.Any())
        {
            foreach (var user in mentorUsersWithoutProfile)
            {
                var newProfile = new MentorProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    FullName = string.IsNullOrWhiteSpace(user.FullName) ? "Mentor " + user.Email : user.FullName,
                    AvatarUrl = user.AvatarUrl,
                    IsVerified = false,
                    Status = "inactive",
                    RatingAverage = 5.0m,
                    RatingCount = 0,
                    YearsOfExperience = 0,
                    Specialties = new List<MentorSpecialty>()
                };
                _context.MentorProfiles.Add(newProfile);
            }
            await _context.SaveChangesAsync();
        }

        var query = _context.MentorProfiles.AsQueryable();

        if (isVerified.HasValue)
        {
            query = query.Where(m => m.IsVerified == isVerified.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLowerInvariant();
            query = query.Where(m => m.FullName.ToLower().Contains(searchLower) || (m.Headline != null && m.Headline.ToLower().Contains(searchLower)));
        }

        var total = await query.CountAsync();
        var itemsRaw = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = itemsRaw.Select(m => {
            var expertise = string.IsNullOrWhiteSpace(m.ExpertiseJson)
                ? new List<string>()
                : System.Text.Json.JsonSerializer.Deserialize<List<string>>(m.ExpertiseJson) ?? new List<string>();

            var industries = string.IsNullOrWhiteSpace(m.IndustriesJson)
                ? new List<string>()
                : System.Text.Json.JsonSerializer.Deserialize<List<string>>(m.IndustriesJson) ?? new List<string>();

            var languages = string.IsNullOrWhiteSpace(m.LanguagesJson)
                ? new List<string>()
                : System.Text.Json.JsonSerializer.Deserialize<List<string>>(m.LanguagesJson) ?? new List<string>();

            return new MentorProfileResponse
            {
                Id = m.Id,
                UserId = m.UserId,
                IsVerified = m.IsVerified,
                FullName = m.FullName,
                Headline = m.Headline,
                AvatarUrl = m.AvatarUrl,
                Bio = m.Bio,
                YearsOfExperience = m.YearsOfExperience,
                RatingAverage = m.RatingAverage,
                RatingCount = m.RatingCount,
                Status = m.Status,
                Expertise = expertise,
                Industries = industries,
                Languages = languages
            };
        }).ToList();

        return Ok(new { total, page, pageSize, items });
    }

    /// <summary>
    /// Verifies or unverifies a mentor profile.
    /// Route: POST /api/v1/mentor/admin/mentors/{id}/verify
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpPost("admin/mentors/{id:guid}/verify")]
    public async Task<IActionResult> AdminVerifyMentor(Guid id, [FromQuery] bool verify = true)
    {
        var profile = await _context.MentorProfiles.FirstOrDefaultAsync(m => m.Id == id);
        if (profile == null)
            return NotFound(new { message = "Không tìm thấy hồ sơ Mentor." });

        profile.IsVerified = verify;
        await _context.SaveChangesAsync();

        try
        {
            await _auditLogService.LogAsync(
                action: "mentor.verified_status_updated",
                resource: "MentorProfile",
                resourceId: profile.Id.ToString(),
                metadata: new { isVerified = profile.IsVerified }
            );
        }
        catch {}

        return Ok(new { id, isVerified = profile.IsVerified }, verify ? "Xác thực Mentor thành công." : "Hủy xác thực Mentor thành công.");
    }

    /// <summary>
    /// Activates or deactivates a mentor profile status.
    /// Route: POST /api/v1/mentor/admin/mentors/{id}/status
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpPost("admin/mentors/{id:guid}/status")]
    public async Task<IActionResult> AdminSetMentorStatus(Guid id, [FromQuery] string status)
    {
        var profile = await _context.MentorProfiles.FirstOrDefaultAsync(m => m.Id == id);
        if (profile == null)
            return NotFound(new { message = "Không tìm thấy hồ sơ Mentor." });

        var normalizedStatus = status.ToLowerInvariant().Trim();
        if (normalizedStatus != "active" && normalizedStatus != "inactive")
        {
            return BadRequest(new { message = "Trạng thái không hợp lệ. Chỉ chấp nhận 'active' hoặc 'inactive'." });
        }

        profile.Status = normalizedStatus;
        await _context.SaveChangesAsync();

        try
        {
            await _auditLogService.LogAsync(
                action: "mentor.status_updated_by_admin",
                resource: "MentorProfile",
                resourceId: profile.Id.ToString(),
                metadata: new { status = profile.Status }
            );
        }
        catch {}

        return Ok(new { id, status = profile.Status }, "Cập nhật trạng thái Mentor thành công.");
    }
}
