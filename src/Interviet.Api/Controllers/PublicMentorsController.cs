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

namespace Interviet.Api.Controllers;

[AllowAnonymous]
[Route("api/v1/public/mentors")]
public sealed class PublicMentorsController : ApiControllerBase
{
    private readonly IAppDbContext _db;

    public PublicMentorsController(IAppDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Gets a paginated list of public, verified, and active mentors.
    /// Route: GET /api/v1/public/mentors
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPublicMentors(
        [FromQuery] string? specialty,
        [FromQuery] string? search,
        [FromQuery] decimal? minRating,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        // Strict filters: Status == "active" && IsVerified == true && UserId != null
        var query = _db.MentorProfiles
            .Include(m => m.Specialties)
            .Where(m => m.Status == "active" && m.IsVerified && m.UserId != null);

        // Filter by specialty
        if (!string.IsNullOrWhiteSpace(specialty))
        {
            var specLower = specialty.ToLowerInvariant().Trim();
            query = query.Where(m => m.Specialties.Any(s => s.Code.ToLower() == specLower || s.Name.ToLower().Contains(specLower)));
        }

        // Filter by min rating
        if (minRating.HasValue)
        {
            query = query.Where(m => m.RatingAverage >= minRating.Value);
        }

        // Filter by search term
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLowerInvariant().Trim();
            query = query.Where(m => 
                m.FullName.ToLower().Contains(searchLower) ||
                (m.Headline != null && m.Headline.ToLower().Contains(searchLower)) ||
                (m.Bio != null && m.Bio.ToLower().Contains(searchLower)) ||
                (m.ExpertiseJson != null && m.ExpertiseJson.ToLower().Contains(searchLower))
            );
        }

        var total = await query.CountAsync(ct);
        var rawItems = await query
            .OrderByDescending(m => m.RatingAverage)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var mappedItems = rawItems.Select(m => {
            var specialtiesMapped = m.Specialties.Select(s => new MentorSpecialtyDto
            {
                Id = s.Id,
                Code = s.Code,
                Name = s.Name,
                Description = s.Description
            }).ToList();

            return new MentorListResponse
            {
                Id = m.Id,
                FullName = m.FullName,
                Headline = m.Headline,
                AvatarUrl = m.AvatarUrl,
                YearsOfExperience = m.YearsOfExperience,
                RatingAverage = m.RatingAverage,
                RatingCount = m.RatingCount,
                Specialties = specialtiesMapped
            };
        }).ToList();

        return Ok(new { total, page, pageSize, items = mappedItems });
    }

    /// <summary>
    /// Gets public details of a verified active mentor.
    /// Route: GET /api/v1/public/mentors/{id}
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetPublicMentorById(Guid id, CancellationToken ct = default)
    {
        var mentor = await _db.MentorProfiles
            .Include(m => m.Specialties)
            .Include(m => m.AvailabilitySlots)
            .FirstOrDefaultAsync(m => m.Id == id && m.Status == "active" && m.IsVerified && m.UserId != null, ct);

        if (mentor == null)
        {
            return NotFound(new { message = "Không tìm thấy hồ sơ chuyên gia hoặc hồ sơ chưa được xác thực." });
        }

        var now = DateTime.UtcNow;
        var slots = mentor.AvailabilitySlots
            .Where(s => s.StartsAt > now
                     && (s.Status == "available" || (s.Status == "reserved" && s.ReservedUntil != null && s.ReservedUntil < now))
                     && (s.ReservedUntil == null || s.ReservedUntil < now))
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

        var specialtiesMapped = mentor.Specialties.Select(s => new MentorSpecialtyDto
        {
            Id = s.Id,
            Code = s.Code,
            Name = s.Name,
            Description = s.Description
        }).ToList();

        // Deserialize public info lists
        var expertise = string.IsNullOrWhiteSpace(mentor.ExpertiseJson)
            ? new List<string>()
            : System.Text.Json.JsonSerializer.Deserialize<List<string>>(mentor.ExpertiseJson) ?? new List<string>();

        var industries = string.IsNullOrWhiteSpace(mentor.IndustriesJson)
            ? new List<string>()
            : System.Text.Json.JsonSerializer.Deserialize<List<string>>(mentor.IndustriesJson) ?? new List<string>();

        var languages = string.IsNullOrWhiteSpace(mentor.LanguagesJson)
            ? new List<string>()
            : System.Text.Json.JsonSerializer.Deserialize<List<string>>(mentor.LanguagesJson) ?? new List<string>();

        var response = new
        {
            Id = mentor.Id,
            FullName = mentor.FullName,
            Headline = mentor.Headline,
            AvatarUrl = mentor.AvatarUrl,
            Bio = mentor.Bio,
            YearsOfExperience = mentor.YearsOfExperience,
            RatingAverage = mentor.RatingAverage,
            RatingCount = mentor.RatingCount,
            Specialties = specialtiesMapped,
            AvailabilitySlots = slots,
            Expertise = expertise,
            Industries = industries,
            Languages = languages
        };

        return Ok(response);
    }

    /// <summary>
    /// Gets public available slots for a verified mentor.
    /// Route: GET /api/v1/public/mentors/{id}/availability
    /// </summary>
    [HttpGet("{id:guid}/availability")]
    public async Task<IActionResult> GetPublicMentorAvailability(Guid id, CancellationToken ct = default)
    {
        var mentorExists = await _db.MentorProfiles
            .AnyAsync(m => m.Id == id && m.Status == "active" && m.IsVerified && m.UserId != null, ct);

        if (!mentorExists)
        {
            return NotFound(new { message = "Không tìm thấy hồ sơ chuyên gia hoặc hồ sơ chưa được xác thực." });
        }

        var now = DateTime.UtcNow;
        var slots = await _db.MentorAvailabilitySlots
            .Where(s => s.MentorId == id
                     && s.StartsAt > now
                     && (s.Status == "available" || (s.Status == "reserved" && s.ReservedUntil != null && s.ReservedUntil < now))
                     && (s.ReservedUntil == null || s.ReservedUntil < now))
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
}
