using System;
using System.Collections.Generic;

namespace Interviet.Contracts.Support;

public sealed record SubmitUserFeedbackRequest(
    string FeedbackType,        // "cv_matching" | "cv_storage" | "ai_interview" | "website_ui" | "other"
    int Rating,                 // 1 to 5
    string Content,             // Feedback details
    List<string>? SelectedTags  // Sub-categories or tags selected by the user
);

public sealed record UserFeedbackResponse(
    Guid Id,
    string FeedbackType,
    int Rating,
    string Content,
    List<string> SelectedTags,
    DateTime CreatedAt
);

public sealed record AdminUserFeedbackResponse(
    Guid Id,
    Guid? UserId,
    string? UserEmail,
    string? UserFullName,
    string FeedbackType,
    int? Rating,
    string Content,
    List<string> SelectedTags,
    DateTime CreatedAt
);

public sealed record UserFeedbackSummaryStats(
    int TotalCount,
    double AverageRating,
    Dictionary<string, int> CountByType,
    Dictionary<int, int> CountByRating
);
