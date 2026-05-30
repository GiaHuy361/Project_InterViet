using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Mentors;
using Interviet.Domain.Mentors;
using Interviet.Domain.Identity;
using Interviet.Shared.Results;

namespace Interviet.Api.Controllers;

[Authorize]
[Route("api/v1/mentors")]
public class MentorsController : ApiControllerBase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public MentorsController(IAppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    /// <summary>
    /// GET /api/v1/mentors
    /// Returns a paginated list of mentors. Filters by specialty (code), serviceType, rating (min), and search string.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetMentors(
        [FromQuery] string? specialty,
        [FromQuery] string? serviceType,
        [FromQuery] decimal? rating,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.MentorProfiles
            .Include(m => m.Specialties)
            .Where(m => m.Status == "active");

        // Specialty filter
        if (!string.IsNullOrWhiteSpace(specialty))
        {
            query = query.Where(m => m.Specialties.Any(s => s.Code.ToLower() == specialty.ToLower()));
        }

        // ServiceType filter
        if (!string.IsNullOrWhiteSpace(serviceType))
        {
            var stLower = serviceType.ToLower();
            query = query.Where(m => m.Specialties.Any(s => s.Code.ToLower() == stLower) || (m.Bio != null && m.Bio.ToLower().Contains(stLower)));
        }

        // Rating filter
        if (rating.HasValue)
        {
            query = query.Where(m => m.RatingAverage >= rating.Value);
        }

        // Search filter
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(m => m.FullName.ToLower().Contains(searchLower)
                || (m.Headline != null && m.Headline.ToLower().Contains(searchLower))
                || (m.Bio != null && m.Bio.ToLower().Contains(searchLower)));
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(m => m.RatingAverage)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new MentorListResponse
            {
                Id = m.Id,
                FullName = m.FullName,
                Headline = m.Headline,
                AvatarUrl = m.AvatarUrl,
                YearsOfExperience = m.YearsOfExperience,
                RatingAverage = m.RatingAverage,
                RatingCount = m.RatingCount,
                Specialties = m.Specialties.Select(s => new MentorSpecialtyDto
                {
                    Id = s.Id,
                    Code = s.Code,
                    Name = s.Name,
                    Description = s.Description
                }).ToList()
            })
            .ToListAsync(ct);

        var pagedResult = new PagedResult<MentorListResponse>(items, page, pageSize, total);
        return Ok(pagedResult);
    }

    /// <summary>
    /// GET /api/v1/mentors/{id}
    /// Returns detailed mentor profile.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetMentor(Guid id, CancellationToken ct)
    {
        var mentor = await _db.MentorProfiles
            .Include(m => m.Specialties)
            .Include(m => m.AvailabilitySlots)
            .FirstOrDefaultAsync(m => m.Id == id && m.Status == "active", ct);

        if (mentor is null)
            return NotFound(new { error = "Mentor not found" });

        var now = DateTime.UtcNow;
        var slots = mentor.AvailabilitySlots
            .Where(s => s.StartsAt > now && s.Status == "available" && (s.ReservedUntil == null || s.ReservedUntil < now))
            .OrderBy(s => s.StartsAt)
            .Select(s => new MentorAvailabilitySlotDto
            {
                Id = s.Id,
                StartsAt = s.StartsAt,
                EndsAt = s.EndsAt,
                Status = s.Status,
                PriceAmount = s.PriceAmount,
                CurrencyCode = s.CurrencyCode
            }).ToList();

        var response = new MentorDetailResponse
        {
            Id = mentor.Id,
            FullName = mentor.FullName,
            Headline = mentor.Headline,
            AvatarUrl = mentor.AvatarUrl,
            Bio = mentor.Bio,
            YearsOfExperience = mentor.YearsOfExperience,
            RatingAverage = mentor.RatingAverage,
            RatingCount = mentor.RatingCount,
            Specialties = mentor.Specialties.Select(s => new MentorSpecialtyDto
            {
                Id = s.Id,
                Code = s.Code,
                Name = s.Name,
                Description = s.Description
            }).ToList(),
            AvailabilitySlots = slots
        };

        return Ok(response);
    }

    /// <summary>
    /// GET /api/v1/mentors/{id}/availability
    /// Returns future available slots for the mentor.
    /// </summary>
    [HttpGet("{id:guid}/availability")]
    public async Task<IActionResult> GetMentorAvailability(Guid id, CancellationToken ct)
    {
        var mentorExists = await _db.MentorProfiles.AnyAsync(m => m.Id == id && m.Status == "active", ct);
        if (!mentorExists)
            return NotFound(new { error = "Mentor not found" });

        var now = DateTime.UtcNow;
        var slots = await _db.MentorAvailabilitySlots
            .Where(s => s.MentorId == id && s.StartsAt > now && s.Status == "available" && (s.ReservedUntil == null || s.ReservedUntil < now))
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
            .ToListAsync(ct);

        return Ok(slots);
    }

    /// <summary>
    /// POST /api/v1/mentors/register
    /// Registers the currently authenticated candidate as a mentor.
    /// </summary>
    [HttpPost("register")]
    public async Task<IActionResult> RegisterAsMentor([FromBody] RegisterMentorRequest req, CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user == null)
            return NotFound(new { error = "User not found" });

        // Check if mentor profile already exists
        var existingProfile = await _db.MentorProfiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        if (existingProfile != null)
        {
            if (existingProfile.IsVerified)
            {
                return BadRequest(new { error = "Tài khoản của bạn đã là chuyên gia (Mentor) được xác thực trong hệ thống." });
            }
            else
            {
                return BadRequest(new { error = "Hồ sơ đăng ký làm chuyên gia của bạn đã được gửi trước đó và đang chờ phê duyệt." });
            }
        }

        if (string.IsNullOrWhiteSpace(req.MeetingUrl))
        {
            return BadRequest(new { error = "Link phòng họp trực tuyến (Meeting URL) là bắt buộc khi đăng ký làm Mentor." });
        }

        if (!Uri.TryCreate(req.MeetingUrl, UriKind.Absolute, out _))
        {
            return BadRequest(new { error = "Link phòng họp trực tuyến phải là một đường dẫn URL hợp lệ." });
        }

        // Create new MentorProfile
        var profile = new MentorProfile
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            FullName = string.IsNullOrWhiteSpace(req.FullName) ? user.FullName : req.FullName.Trim(),
            Headline = req.Headline?.Trim(),
            AvatarUrl = user.AvatarUrl,
            Bio = req.Bio?.Trim(),
            YearsOfExperience = req.YearsOfExperience,
            ExpertiseJson = System.Text.Json.JsonSerializer.Serialize(req.Expertise ?? new List<string>()),
            IndustriesJson = System.Text.Json.JsonSerializer.Serialize(req.Industries ?? new List<string>()),
            LanguagesJson = System.Text.Json.JsonSerializer.Serialize(req.Languages ?? new List<string>()),
            IsVerified = false,
            Status = "inactive",
            RatingAverage = 5.0m,
            RatingCount = 0,
            MeetingUrl = req.MeetingUrl?.Trim()
        };

        // Assign specialties if provided
        if (req.SpecialtyIds != null && req.SpecialtyIds.Any())
        {
            var specialties = await _db.MentorSpecialties
                .Where(s => req.SpecialtyIds.Contains(s.Id))
                .ToListAsync(ct);
            profile.Specialties = specialties;
        }

        _db.MentorProfiles.Add(profile);

        // Update user role to mentor
        user.RoleCode = RoleCodes.Mentor;

        await _db.SaveChangesAsync(ct);

        return Created("", new 
        { 
            message = "Đăng ký thành công. Vui lòng chờ quản trị viên phê duyệt hồ sơ của bạn.",
            mentorProfileId = profile.Id 
        });
    }
}

public class RegisterMentorRequest
{
    public string FullName { get; set; } = string.Empty;
    public string? Headline { get; set; }
    public string? Bio { get; set; }
    public decimal YearsOfExperience { get; set; }
    public List<string>? Expertise { get; set; }
    public List<string>? Industries { get; set; }
    public List<string>? Languages { get; set; }
    public List<Guid>? SpecialtyIds { get; set; }
    public string? MeetingUrl { get; set; }
}


