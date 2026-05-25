using System;

namespace Interviet.Contracts.Support;

// ── Public DTOs ─────────────────────────────────────────────────────────────
public sealed record PublicStatResponse(
    Guid Id,
    string Key,
    string Value,
    string Label,
    string? Icon,
    int SortOrder
);

public sealed record PublicStatsSummaryResponse(
    int TotalCandidates,
    int TotalCVsProcessed,
    int TotalInterviewsConducted,
    decimal? AverageRating
);

public sealed record AdminPublicStatsSummaryResponse(
    int TotalFaqs,
    int PublishedFaqs,
    int TotalBlogArticles,
    int PublishedBlogArticles,
    int TotalTestimonials,
    int ActiveTestimonials,
    int TotalContactRequests,
    int PendingContactRequests
);

public sealed record TestimonialResponse(
    Guid Id,
    string AuthorName,
    string AuthorRole,
    string Content,
    string AvatarUrl,
    decimal Rating,
    int SortOrder,
    bool IsActive,
    bool IsFeatured
);

public sealed record FaqItemResponse(
    Guid Id,
    string Category,
    string Question,
    string Answer,
    int SortOrder,
    bool IsActive
);

public sealed record BlogArticleResponse(
    Guid Id,
    string Title,
    string Slug,
    string Content,
    string Author,
    string? CoverImageUrl,
    string Category,
    bool IsPublished,
    DateTime? PublishedAt,
    DateTime CreatedAt
);

public sealed record CreatePublicContactRequest(
    string Name,
    string Email,
    string? Phone,
    string Subject,
    string Category,
    string Message
);

public sealed record PublicContactRequestResponse(
    Guid Id,
    string FullName,
    string Email,
    string? Phone,
    string Subject,
    string Category,
    string Message,
    string Status,
    DateTime CreatedAt
);

// ── Admin CRUD Requests ──────────────────────────────────────────────────────
public sealed record CreateOrUpdateStatRequest(
    string Key,
    string Value,
    string Label,
    string? Icon,
    int SortOrder
);

public sealed record CreateOrUpdateTestimonialRequest(
    string AuthorName,
    string AuthorRole,
    string Content,
    string AvatarUrl,
    decimal Rating,
    int SortOrder,
    bool IsActive,
    bool IsFeatured
);

public sealed record CreateOrUpdateFaqRequest(
    string Category,
    string Question,
    string Answer,
    int SortOrder,
    bool IsActive
);

public sealed record CreateOrUpdateBlogRequest(
    string Title,
    string Slug,
    string Content,
    string Author,
    string? CoverImageUrl,
    string Category,
    bool IsPublished,
    DateTime? PublishedAt
);

public sealed record UpdateContactRequestStatusRequest(
    string Status
);
