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

[Authorize(Policy = "AdminOrSupport")]
[Route("api/v1/admin/public")]
public sealed class AdminPublicContentController : ApiControllerBase
{
    private readonly IAppDbContext _context;
    private readonly IAuditLogService _auditLogService;

    public AdminPublicContentController(
        IAppDbContext context,
        IAuditLogService auditLogService)
    {
        _context = context;
        _auditLogService = auditLogService;
    }

    private async Task TryLogAuditAsync(string action, string resource, string resourceId, object? metadata = null)
    {
        try
        {
            await _auditLogService.LogAsync(action, resource, resourceId, metadata);
        }
        catch
        {
            // Failures in audit logging must not roll back main database transactions
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. STATS MANAGEMENT (Admin Only)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var totalFaqs = await _context.FaqItems.CountAsync();
        var publishedFaqs = await _context.FaqItems.CountAsync(f => f.IsActive);
        
        var totalBlogArticles = await _context.BlogArticles.CountAsync();
        var publishedBlogArticles = await _context.BlogArticles.CountAsync(b => b.IsPublished);
        
        var totalTestimonials = await _context.Testimonials.CountAsync();
        var activeTestimonials = await _context.Testimonials.CountAsync(t => t.IsActive);
        
        var totalContactRequests = await _context.PublicContactRequests.CountAsync();
        var pendingContactRequests = await _context.PublicContactRequests.CountAsync(c => c.Status == "pending");

        var res = new AdminPublicStatsSummaryResponse(
            TotalFaqs: totalFaqs,
            PublishedFaqs: publishedFaqs,
            TotalBlogArticles: totalBlogArticles,
            PublishedBlogArticles: publishedBlogArticles,
            TotalTestimonials: totalTestimonials,
            ActiveTestimonials: activeTestimonials,
            TotalContactRequests: totalContactRequests,
            PendingContactRequests: pendingContactRequests
        );

        return Ok(res);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("stats")]
    public async Task<IActionResult> CreateStat(CreateOrUpdateStatRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Key))
            return BadRequest(new { message = "Mã Key của chỉ số là bắt buộc." });
        if (string.IsNullOrWhiteSpace(req.Value))
            return BadRequest(new { message = "Giá trị chỉ số là bắt buộc." });
        if (string.IsNullOrWhiteSpace(req.Label))
            return BadRequest(new { message = "Nhãn hiển thị là bắt buộc." });

        if (await _context.PublicStats.AnyAsync(s => s.Key == req.Key))
            return BadRequest(new { message = $"Chỉ số với mã Key '{req.Key}' đã tồn tại." });

        var stat = new PublicStat
        {
            Key = req.Key.Trim().ToLowerInvariant(),
            Value = req.Value.Trim(),
            Label = req.Label.Trim(),
            Icon = req.Icon?.Trim(),
            SortOrder = req.SortOrder
        };

        _context.PublicStats.Add(stat);
        await _context.SaveChangesAsync();

        await TryLogAuditAsync("public.stat_created", "PublicStat", stat.Id.ToString(), new { stat.Key });

        return Ok(stat, "Tạo chỉ số thành công.");
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("stats/{id:guid}")]
    public async Task<IActionResult> UpdateStat(Guid id, CreateOrUpdateStatRequest req)
    {
        var stat = await _context.PublicStats.FirstOrDefaultAsync(s => s.Id == id);
        if (stat == null)
            return NotFound(new { message = "Không tìm thấy chỉ số." });

        if (string.IsNullOrWhiteSpace(req.Key))
            return BadRequest(new { message = "Mã Key của chỉ số là bắt buộc." });
        if (string.IsNullOrWhiteSpace(req.Value))
            return BadRequest(new { message = "Giá trị chỉ số là bắt buộc." });
        if (string.IsNullOrWhiteSpace(req.Label))
            return BadRequest(new { message = "Nhãn hiển thị là bắt buộc." });

        if (await _context.PublicStats.AnyAsync(s => s.Key == req.Key && s.Id != id))
            return BadRequest(new { message = $"Chỉ số với mã Key '{req.Key}' đã được sử dụng bởi bản ghi khác." });

        stat.Key = req.Key.Trim().ToLowerInvariant();
        stat.Value = req.Value.Trim();
        stat.Label = req.Label.Trim();
        stat.Icon = req.Icon?.Trim();
        stat.SortOrder = req.SortOrder;

        await _context.SaveChangesAsync();

        await TryLogAuditAsync("public.stat_updated", "PublicStat", stat.Id.ToString(), new { stat.Key });

        return Ok(stat, "Cập nhật chỉ số thành công.");
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("stats/{id:guid}")]
    public async Task<IActionResult> DeleteStat(Guid id)
    {
        var stat = await _context.PublicStats.FirstOrDefaultAsync(s => s.Id == id);
        if (stat == null)
            return NotFound(new { message = "Không tìm thấy chỉ số." });

        _context.PublicStats.Remove(stat);
        await _context.SaveChangesAsync();

        await TryLogAuditAsync("public.stat_deleted", "PublicStat", stat.Id.ToString(), new { stat.Key });

        return Ok(new { id }, "Xóa chỉ số thành công.");
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. TESTIMONIALS MANAGEMENT (Admin Only)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("testimonials")]
    public async Task<IActionResult> GetTestimonials(
        [FromQuery] string? search,
        [FromQuery] bool? isActive,
        [FromQuery] bool? isFeatured,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;

        var query = _context.Testimonials.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLowerInvariant();
            query = query.Where(t => t.AuthorName.ToLower().Contains(searchLower) || t.AuthorRole.ToLower().Contains(searchLower) || t.Content.ToLower().Contains(searchLower));
        }

        if (isActive.HasValue)
        {
            query = query.Where(t => t.IsActive == isActive.Value);
        }

        if (isFeatured.HasValue)
        {
            query = query.Where(t => t.IsFeatured == isFeatured.Value);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderBy(t => t.SortOrder)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("testimonials")]
    public async Task<IActionResult> CreateTestimonial(CreateOrUpdateTestimonialRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.AuthorName))
            return BadRequest(new { message = "Tên tác giả đánh giá là bắt buộc." });
        if (string.IsNullOrWhiteSpace(req.AuthorRole))
            return BadRequest(new { message = "Chức danh/công ty là bắt buộc." });
        if (string.IsNullOrWhiteSpace(req.Content))
            return BadRequest(new { message = "Nội dung đánh giá là bắt buộc." });
        if (req.Rating < 1.0m || req.Rating > 5.0m)
            return BadRequest(new { message = "Đánh giá sao phải nằm trong khoảng từ 1 đến 5." });

        var testimonial = new Testimonial
        {
            AuthorName = req.AuthorName.Trim(),
            AuthorRole = req.AuthorRole.Trim(),
            Content = req.Content.Trim(),
            AvatarUrl = req.AvatarUrl?.Trim() ?? $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(req.AuthorName)}&background=random&size=200",
            Rating = req.Rating,
            SortOrder = req.SortOrder,
            IsActive = req.IsActive,
            IsFeatured = req.IsFeatured
        };

        _context.Testimonials.Add(testimonial);
        await _context.SaveChangesAsync();

        await TryLogAuditAsync("public.testimonial_created", "Testimonial", testimonial.Id.ToString(), new { testimonial.AuthorName });

        return Ok(testimonial, "Tạo đánh giá thành công.");
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("testimonials/{id:guid}")]
    public async Task<IActionResult> UpdateTestimonial(Guid id, CreateOrUpdateTestimonialRequest req)
    {
        var testimonial = await _context.Testimonials.FirstOrDefaultAsync(t => t.Id == id);
        if (testimonial == null)
            return NotFound(new { message = "Không tìm thấy đánh giá." });

        if (string.IsNullOrWhiteSpace(req.AuthorName))
            return BadRequest(new { message = "Tên tác giả đánh giá là bắt buộc." });
        if (string.IsNullOrWhiteSpace(req.AuthorRole))
            return BadRequest(new { message = "Chức danh/công ty là bắt buộc." });
        if (string.IsNullOrWhiteSpace(req.Content))
            return BadRequest(new { message = "Nội dung đánh giá là bắt buộc." });
        if (req.Rating < 1.0m || req.Rating > 5.0m)
            return BadRequest(new { message = "Đánh giá sao phải nằm trong khoảng từ 1 đến 5." });

        testimonial.AuthorName = req.AuthorName.Trim();
        testimonial.AuthorRole = req.AuthorRole.Trim();
        testimonial.Content = req.Content.Trim();
        testimonial.AvatarUrl = req.AvatarUrl?.Trim() ?? testimonial.AvatarUrl;
        testimonial.Rating = req.Rating;
        testimonial.SortOrder = req.SortOrder;
        testimonial.IsActive = req.IsActive;
        testimonial.IsFeatured = req.IsFeatured;

        await _context.SaveChangesAsync();

        await TryLogAuditAsync("public.testimonial_updated", "Testimonial", testimonial.Id.ToString(), new { testimonial.AuthorName });

        return Ok(testimonial, "Cập nhật đánh giá thành công.");
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("testimonials/{id:guid}")]
    public async Task<IActionResult> DeleteTestimonial(Guid id)
    {
        var testimonial = await _context.Testimonials.FirstOrDefaultAsync(t => t.Id == id);
        if (testimonial == null)
            return NotFound(new { message = "Không tìm thấy đánh giá." });

        _context.Testimonials.Remove(testimonial);
        await _context.SaveChangesAsync();

        await TryLogAuditAsync("public.testimonial_deleted", "Testimonial", testimonial.Id.ToString(), new { testimonial.AuthorName });

        return Ok(new { id }, "Xóa đánh giá thành công.");
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3. FAQS MANAGEMENT (Admin Only)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("faqs")]
    public async Task<IActionResult> GetFaqs(
        [FromQuery] string? search,
        [FromQuery] string? category,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;

        var query = _context.FaqItems.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLowerInvariant();
            query = query.Where(f => f.Question.ToLower().Contains(searchLower) || f.Answer.ToLower().Contains(searchLower));
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(f => f.Category == category);
        }

        if (isActive.HasValue)
        {
            query = query.Where(f => f.IsActive == isActive.Value);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderBy(f => f.Category)
            .ThenBy(f => f.SortOrder)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("faqs")]
    public async Task<IActionResult> CreateFaq(CreateOrUpdateFaqRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Question))
            return BadRequest(new { message = "Câu hỏi FAQ là bắt buộc." });
        if (string.IsNullOrWhiteSpace(req.Answer))
            return BadRequest(new { message = "Câu trả lời FAQ là bắt buộc." });
        if (string.IsNullOrWhiteSpace(req.Category))
            return BadRequest(new { message = "Danh mục FAQ là bắt buộc." });

        var faq = new FaqItem
        {
            Question = req.Question.Trim(),
            Answer = req.Answer.Trim(),
            Category = req.Category.Trim(),
            SortOrder = req.SortOrder,
            IsActive = req.IsActive
        };

        _context.FaqItems.Add(faq);
        await _context.SaveChangesAsync();

        await TryLogAuditAsync("public.faq_created", "FaqItem", faq.Id.ToString(), new { faq.Question });

        return Ok(faq, "Tạo câu hỏi FAQ thành công.");
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("faqs/{id:guid}")]
    public async Task<IActionResult> UpdateFaq(Guid id, CreateOrUpdateFaqRequest req)
    {
        var faq = await _context.FaqItems.FirstOrDefaultAsync(f => f.Id == id);
        if (faq == null)
            return NotFound(new { message = "Không tìm thấy câu hỏi FAQ." });

        if (string.IsNullOrWhiteSpace(req.Question))
            return BadRequest(new { message = "Câu hỏi FAQ là bắt buộc." });
        if (string.IsNullOrWhiteSpace(req.Answer))
            return BadRequest(new { message = "Câu trả lời FAQ là bắt buộc." });
        if (string.IsNullOrWhiteSpace(req.Category))
            return BadRequest(new { message = "Danh mục FAQ là bắt buộc." });

        faq.Question = req.Question.Trim();
        faq.Answer = req.Answer.Trim();
        faq.Category = req.Category.Trim();
        faq.SortOrder = req.SortOrder;
        faq.IsActive = req.IsActive;

        await _context.SaveChangesAsync();

        await TryLogAuditAsync("public.faq_updated", "FaqItem", faq.Id.ToString(), new { faq.Question });

        return Ok(faq, "Cập nhật câu hỏi FAQ thành công.");
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("faqs/{id:guid}")]
    public async Task<IActionResult> DeleteFaq(Guid id)
    {
        var faq = await _context.FaqItems.FirstOrDefaultAsync(f => f.Id == id);
        if (faq == null)
            return NotFound(new { message = "Không tìm thấy câu hỏi FAQ." });

        _context.FaqItems.Remove(faq);
        await _context.SaveChangesAsync();

        await TryLogAuditAsync("public.faq_deleted", "FaqItem", faq.Id.ToString(), new { faq.Question });

        return Ok(new { id }, "Xóa câu hỏi FAQ thành công.");
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 4. BLOG / ARTICLES MANAGEMENT (Admin Only)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("blog")]
    public async Task<IActionResult> GetBlogs(
        [FromQuery] string? search,
        [FromQuery] string? category,
        [FromQuery] bool? isPublished,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;

        var query = _context.BlogArticles.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLowerInvariant();
            query = query.Where(b => b.Title.ToLower().Contains(searchLower) || b.Author.ToLower().Contains(searchLower) || b.Content.ToLower().Contains(searchLower));
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(b => b.Category == category);
        }

        if (isPublished.HasValue)
        {
            query = query.Where(b => b.IsPublished == isPublished.Value);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(b => b.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("blog")]
    public async Task<IActionResult> CreateBlog(CreateOrUpdateBlogRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Title))
            return BadRequest(new { message = "Tiêu đề bài viết là bắt buộc." });
        if (string.IsNullOrWhiteSpace(req.Slug))
            return BadRequest(new { message = "Mã Slug bài viết là bắt buộc." });
        if (string.IsNullOrWhiteSpace(req.Content))
            return BadRequest(new { message = "Nội dung bài viết là bắt buộc." });
        if (string.IsNullOrWhiteSpace(req.Author))
            return BadRequest(new { message = "Tác giả bài viết là bắt buộc." });
        if (string.IsNullOrWhiteSpace(req.Category))
            return BadRequest(new { message = "Danh mục bài viết là bắt buộc." });

        var normalizedSlug = req.Slug.Trim().ToLowerInvariant();
        if (await _context.BlogArticles.AnyAsync(b => b.Slug == normalizedSlug))
            return BadRequest(new { message = $"Mã Slug '{normalizedSlug}' đã tồn tại cho một bài viết khác." });

        var article = new BlogArticle
        {
            Title = req.Title.Trim(),
            Slug = normalizedSlug,
            Content = req.Content.Trim(),
            Author = req.Author.Trim(),
            CoverImageUrl = req.CoverImageUrl?.Trim(),
            Category = req.Category.Trim(),
            IsPublished = req.IsPublished,
            PublishedAt = req.IsPublished ? (req.PublishedAt ?? DateTime.UtcNow) : null
        };

        _context.BlogArticles.Add(article);
        await _context.SaveChangesAsync();

        await TryLogAuditAsync("public.blog_created", "BlogArticle", article.Id.ToString(), new { article.Title });

        return Ok(article, "Tạo bài viết thành công.");
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("blog/{id:guid}")]
    public async Task<IActionResult> UpdateBlog(Guid id, CreateOrUpdateBlogRequest req)
    {
        var article = await _context.BlogArticles.FirstOrDefaultAsync(b => b.Id == id);
        if (article == null)
            return NotFound(new { message = "Không tìm thấy bài viết." });

        if (string.IsNullOrWhiteSpace(req.Title))
            return BadRequest(new { message = "Tiêu đề bài viết là bắt buộc." });
        if (string.IsNullOrWhiteSpace(req.Slug))
            return BadRequest(new { message = "Mã Slug bài viết là bắt buộc." });
        if (string.IsNullOrWhiteSpace(req.Content))
            return BadRequest(new { message = "Nội dung bài viết là bắt buộc." });
        if (string.IsNullOrWhiteSpace(req.Author))
            return BadRequest(new { message = "Tác giả bài viết là bắt buộc." });
        if (string.IsNullOrWhiteSpace(req.Category))
            return BadRequest(new { message = "Danh mục bài viết là bắt buộc." });

        var normalizedSlug = req.Slug.Trim().ToLowerInvariant();
        if (await _context.BlogArticles.AnyAsync(b => b.Slug == normalizedSlug && b.Id != id))
            return BadRequest(new { message = $"Mã Slug '{normalizedSlug}' đã được sử dụng bởi bài viết khác." });

        article.Title = req.Title.Trim();
        article.Slug = normalizedSlug;
        article.Content = req.Content.Trim();
        article.Author = req.Author.Trim();
        article.CoverImageUrl = req.CoverImageUrl?.Trim() ?? article.CoverImageUrl;
        article.Category = req.Category.Trim();
        article.IsPublished = req.IsPublished;
        article.PublishedAt = req.IsPublished ? (req.PublishedAt ?? article.PublishedAt ?? DateTime.UtcNow) : null;

        await _context.SaveChangesAsync();

        await TryLogAuditAsync("public.blog_updated", "BlogArticle", article.Id.ToString(), new { article.Title });

        return Ok(article, "Cập nhật bài viết thành công.");
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("blog/{id:guid}")]
    public async Task<IActionResult> DeleteBlog(Guid id)
    {
        var article = await _context.BlogArticles.FirstOrDefaultAsync(b => b.Id == id);
        if (article == null)
            return NotFound(new { message = "Không tìm thấy bài viết." });

        _context.BlogArticles.Remove(article);
        await _context.SaveChangesAsync();

        await TryLogAuditAsync("public.blog_deleted", "BlogArticle", article.Id.ToString(), new { article.Title });

        return Ok(new { id }, "Xóa bài viết thành công.");
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 5. VISITOR CONTACT REQUESTS (Admin & Support)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    [HttpGet("contact-requests")]
    public async Task<IActionResult> GetContactRequests(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] string? category,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;

        var query = _context.PublicContactRequests.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLowerInvariant();
            query = query.Where(c => c.FullName.ToLower().Contains(searchLower) || c.Email.ToLower().Contains(searchLower) || c.Subject.ToLower().Contains(searchLower) || c.Message.ToLower().Contains(searchLower));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(c => c.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(c => c.Category == category);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new PublicContactRequestResponse(
                c.Id,
                c.FullName,
                c.Email,
                c.Phone,
                c.Subject,
                c.Category,
                c.Message,
                c.Status,
                c.CreatedAt
            ))
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }

    [HttpGet("contact-requests/{id:guid}")]
    public async Task<IActionResult> GetContactRequestById(Guid id)
    {
        var contact = await _context.PublicContactRequests.FirstOrDefaultAsync(c => c.Id == id);
        if (contact == null)
            return NotFound(new { message = "Không tìm thấy yêu cầu liên hệ." });

        var res = new PublicContactRequestResponse(
            contact.Id,
            contact.FullName,
            contact.Email,
            contact.Phone,
            contact.Subject,
            contact.Category,
            contact.Message,
            contact.Status,
            contact.CreatedAt
        );

        return Ok(res);
    }

    [HttpPost("contact-requests/{id:guid}/status")]
    public async Task<IActionResult> UpdateContactRequestStatus(Guid id, UpdateContactRequestStatusRequest req)
    {
        var contact = await _context.PublicContactRequests.FirstOrDefaultAsync(c => c.Id == id);
        if (contact == null)
            return NotFound(new { message = "Không tìm thấy yêu cầu liên hệ." });

        var validStatuses = new[] { "pending", "processed", "ignored" };
        var normalizedStatus = req.Status.ToLowerInvariant().Trim();
        if (!validStatuses.Contains(normalizedStatus))
            return BadRequest(new { message = $"Trạng thái không hợp lệ. Phải thuộc một trong các giá trị: {string.Join(", ", validStatuses)}" });

        var previousStatus = contact.Status;
        contact.Status = normalizedStatus;

        await _context.SaveChangesAsync();

        await TryLogAuditAsync(
            "public.contact_request_status_updated",
            "PublicContactRequest",
            contact.Id.ToString(),
            new { previousStatus, currentStatus = contact.Status }
        );

        return Ok(new { id, previousStatus, currentStatus = contact.Status }, "Cập nhật trạng thái yêu cầu liên hệ thành công.");
    }
}
