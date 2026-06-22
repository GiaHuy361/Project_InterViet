using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Support;
using Interviet.Domain.Support;

namespace Interviet.Api.Controllers;

[Authorize]
[Route("api/v1/feedback")]
public sealed class FeedbackController : ApiControllerBase
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public FeedbackController(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    /// <summary>
    /// Submit user feedback (Requires login, similar to TopCV rating / review).
    /// Route: POST /api/v1/feedback
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> SubmitFeedback(SubmitUserFeedbackRequest req)
    {
        var userId = _currentUserService.UserId;

        if (req.Rating < 1 || req.Rating > 5)
        {
            return BadRequest(new { message = "Đánh giá mức độ hài lòng phải từ 1 đến 5 sao." });
        }

        if (string.IsNullOrWhiteSpace(req.FeedbackType))
        {
            return BadRequest(new { message = "Vui lòng chọn chủ đề cần góp ý." });
        }

        if (string.IsNullOrWhiteSpace(req.Content))
        {
            return BadRequest(new { message = "Vui lòng nhập nội dung mô tả góp ý." });
        }

        // Serialize SelectedTags list to MetadataJson
        var metadataJson = req.SelectedTags != null && req.SelectedTags.Any()
            ? System.Text.Json.JsonSerializer.Serialize(req.SelectedTags)
            : null;

        var feedback = new UserFeedback
        {
            UserId = userId,
            FeedbackType = req.FeedbackType,
            Rating = req.Rating,
            Content = req.Content,
            MetadataJson = metadataJson,
            CreatedAt = DateTime.UtcNow
        };

        _context.UserFeedbacks.Add(feedback);
        await _context.SaveChangesAsync();

        var response = new UserFeedbackResponse(
            Id: feedback.Id,
            FeedbackType: feedback.FeedbackType,
            Rating: feedback.Rating ?? 0,
            Content: feedback.Content,
            SelectedTags: req.SelectedTags ?? new List<string>(),
            CreatedAt: feedback.CreatedAt
        );

        return Ok(response, "Gửi góp ý phản hồi sản phẩm thành công. Cảm ơn ý kiến của bạn!");
    }

    /// <summary>
    /// Retrieve feedback history of the current user.
    /// Route: GET /api/v1/feedback/my
    /// </summary>
    [HttpGet("my")]
    public async Task<IActionResult> GetMyFeedback()
    {
        var userId = _currentUserService.UserId;

        var feedbacks = await _context.UserFeedbacks
            .Where(f => f.UserId == userId)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();

        var response = feedbacks.Select(f => {
            List<string> tags = new();
            if (!string.IsNullOrWhiteSpace(f.MetadataJson))
            {
                try
                {
                    tags = System.Text.Json.JsonSerializer.Deserialize<List<string>>(f.MetadataJson) ?? new List<string>();
                }
                catch
                {
                    // Ignore parsing error
                }
            }

            return new UserFeedbackResponse(
                Id: f.Id,
                FeedbackType: f.FeedbackType,
                Rating: f.Rating ?? 0,
                Content: f.Content,
                SelectedTags: tags,
                CreatedAt: f.CreatedAt
            );
        }).ToList();

        return Ok(response);
    }
}
