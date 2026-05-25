using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Support;
using Interviet.Domain.Support;

namespace Interviet.Api.Controllers;

[AllowAnonymous]
[Route("api/v1/public")]
public sealed class PublicContentController : ApiControllerBase
{
    private readonly IAppDbContext _context;

    public PublicContentController(IAppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Gets landing page statistics with dynamic database aggregation.
    /// Route: GET /api/v1/public/stats
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var totalCandidates = await _context.Users.CountAsync();
        var totalCVsProcessed = await _context.ResumeVersions.CountAsync();
        var totalInterviewsConducted = await _context.InterviewSessions.CountAsync();

        decimal? averageRating = null;
        if (await _context.Testimonials.AnyAsync(t => t.IsActive))
        {
            var avg = await _context.Testimonials
                .Where(t => t.IsActive)
                .AverageAsync(t => (decimal?)t.Rating);
            if (avg.HasValue)
            {
                averageRating = Math.Round(avg.Value, 2);
            }
        }

        var res = new PublicStatsSummaryResponse(
            TotalCandidates: totalCandidates,
            TotalCVsProcessed: totalCVsProcessed,
            TotalInterviewsConducted: totalInterviewsConducted,
            AverageRating: averageRating
        );

        return Ok(res);
    }

    /// <summary>
    /// Gets active testimonials sorted by priority order.
    /// Route: GET /api/v1/public/testimonials
    /// </summary>
    [HttpGet("testimonials")]
    public async Task<IActionResult> GetTestimonials()
    {
        var testimonials = await _context.Testimonials
            .Where(t => t.IsActive)
            .OrderBy(t => t.SortOrder)
            .Select(t => new TestimonialResponse(
                t.Id,
                t.AuthorName,
                t.AuthorRole,
                t.Content,
                t.AvatarUrl,
                t.Rating,
                t.SortOrder,
                t.IsActive,
                t.IsFeatured
            ))
            .ToListAsync();

        return Ok(testimonials);
    }

    /// <summary>
    /// Gets structured active FAQ articles for the Help Center.
    /// Route: GET /api/v1/public/faqs
    /// </summary>
    [HttpGet("faqs")]
    public async Task<IActionResult> GetFaqs()
    {
        var faqs = await _context.FaqItems
            .Where(f => f.IsActive)
            .OrderBy(f => f.Category)
            .ThenBy(f => f.SortOrder)
            .Select(f => new FaqItemResponse(
                f.Id,
                f.Category,
                f.Question,
                f.Answer,
                f.SortOrder,
                f.IsActive
            ))
            .ToListAsync();

        return Ok(faqs);
    }

    /// <summary>
    /// Gets published blog articles for resources page.
    /// Route: GET /api/v1/public/blog
    /// </summary>
    [HttpGet("blog")]
    public async Task<IActionResult> GetBlogList([FromQuery] string? category)
    {
        var query = _context.BlogArticles
            .Where(b => b.IsPublished && b.PublishedAt <= DateTime.UtcNow);

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(b => b.Category == category);
        }

        var articles = await query
            .OrderByDescending(b => b.PublishedAt)
            .Select(b => new BlogArticleResponse(
                b.Id,
                b.Title,
                b.Slug,
                b.Content,
                b.Author,
                b.CoverImageUrl,
                b.Category,
                b.IsPublished,
                b.PublishedAt,
                b.CreatedAt
            ))
            .ToListAsync();

        return Ok(articles);
    }

    /// <summary>
    /// Gets a single published blog article details by slug.
    /// Route: GET /api/v1/public/blog/{slug}
    /// </summary>
    [HttpGet("blog/{slug}")]
    public async Task<IActionResult> GetBlogDetail(string slug)
    {
        var article = await _context.BlogArticles
            .FirstOrDefaultAsync(b => b.Slug == slug && b.IsPublished && b.PublishedAt <= DateTime.UtcNow);

        if (article == null)
        {
            return NotFound(new { message = "Không tìm thấy bài viết." });
        }

        var res = new BlogArticleResponse(
            article.Id,
            article.Title,
            article.Slug,
            article.Content,
            article.Author,
            article.CoverImageUrl,
            article.Category,
            article.IsPublished,
            article.PublishedAt,
            article.CreatedAt
        );

        return Ok(res);
    }

    /// <summary>
    /// Submits guest contact details from unauthenticated users.
    /// Route: POST /api/v1/public/contact
    /// </summary>
    [HttpPost("contact")]
    public async Task<IActionResult> SubmitContact(CreatePublicContactRequest req)
    {
        // Name validation
        if (string.IsNullOrWhiteSpace(req.Name))
        {
            return BadRequest(new { message = "Họ và tên là bắt buộc." });
        }

        // Email validation
        if (string.IsNullOrWhiteSpace(req.Email) || !req.Email.Contains("@"))
        {
            return BadRequest(new { message = "Địa chỉ email không đúng định dạng." });
        }

        // Message validation
        if (string.IsNullOrWhiteSpace(req.Message))
        {
            return BadRequest(new { message = "Nội dung liên hệ là bắt buộc." });
        }

        // Subject validation
        if (string.IsNullOrWhiteSpace(req.Subject))
        {
            return BadRequest(new { message = "Tiêu đề liên hệ là bắt buộc." });
        }

        var request = new PublicContactRequest
        {
            FullName = req.Name.Trim(),
            Email = req.Email.Trim().ToLowerInvariant(),
            Phone = req.Phone?.Trim(),
            Subject = req.Subject.Trim(),
            Category = req.Category?.Trim() ?? "General",
            Message = req.Message.Trim(),
            Status = "pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.PublicContactRequests.Add(request);
        await _context.SaveChangesAsync();

        var res = new PublicContactRequestResponse(
            request.Id,
            request.FullName,
            request.Email,
            request.Phone,
            request.Subject,
            request.Category,
            request.Message,
            request.Status,
            request.CreatedAt
        );

        return Ok(res, "Thông tin liên hệ của bạn đã được tiếp nhận thành công.");
    }
}
