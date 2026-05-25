using Interviet.Contracts.Support;

namespace Interviet.Contracts.Admin;

public sealed record AdminDashboardSummaryResponse(
    int TotalUsers,
    int NewUsersToday,
    int NewUsersThisWeek,
    int ActiveSubscriptions,
    decimal TotalSubscriptionRevenue,
    int TotalPayments,
    decimal TotalMockRevenue,
    int TotalResumesOptimized,
    int TotalMatchingSessions,
    int TotalInterviewSessions,
    int TotalMentorBookings,
    decimal TotalBookingRevenue,
    int TotalReportShares,
    Dictionary<string, int> SupportTicketsByStatus
);

public sealed record AuditLogResponse(
    Guid Id,
    Guid? ActorId,
    string? ActorEmail,
    string ActorRole,
    string Action,
    string? Resource,
    string? ResourceId,
    string? MetadataJson,
    string? IpAddress,
    string? UserAgent,
    DateTime CreatedAt
);

public sealed record DevPromoteRequest(
    string Email,
    string RoleCode
);

public sealed record AdminSupportTicketAssignRequest(
    string AssignedTo
);

public sealed record AdminSupportTicketMessageRequest(
    string MessageBody,
    bool IsInternalNote
);

public sealed record AdminSupportTicketStatusRequest(
    string Status
);

public sealed record OperationalHealthResponse(
    string Status,
    DateTime Timestamp,
    Dictionary<string, ComponentHealthStatus> Components
);

public sealed record ComponentHealthStatus(
    string Status,
    string Details
);

public sealed record AdminUserListResponse(
    Guid Id,
    string Email,
    string FullName,
    string Role,
    string Status,
    bool EmailVerified,
    DateTime CreatedAt,
    DateTime? LastLoginAt
);

public sealed record AdminUserDetailResponse(
    AdminUserListResponse UserSummary,
    UserProfileSummaryDto? ProfileSummary,
    UserSubscriptionSummaryDto? CurrentSubscription,
    UserQuotaSummaryDto QuotaSummary,
    List<UserPaymentSummaryDto> RecentPayments,
    List<UserBookingSummaryDto> RecentBookings,
    int SupportTicketCount
);

public sealed record UserProfileSummaryDto(
    string? Headline,
    string? Bio,
    string? YearsOfExperience,
    List<string> Skills
);

public sealed record UserSubscriptionSummaryDto(
    Guid SubscriptionId,
    string PlanKey,
    string Status,
    DateTime StartsAt,
    DateTime? EndsAt
);

public sealed record UserQuotaSummaryDto(
    int DailyMatchUsed,
    int DailyMatchLimit,
    int DailyInterviewUsed,
    int DailyInterviewLimit,
    int DailyOptimizeUsed,
    int DailyOptimizeLimit
);

public sealed record UserPaymentSummaryDto(
    Guid PaymentId,
    decimal Amount,
    string Currency,
    string Status,
    string Purpose,
    DateTime CreatedAt
);

public sealed record UserBookingSummaryDto(
    Guid BookingId,
    string MentorName,
    string ServiceType,
    string Status,
    decimal Amount,
    string Currency,
    DateTime StartsAt
);

public sealed record AdminBillingPaymentResponse(
    Guid Id,
    Guid UserId,
    string UserEmail,
    decimal Amount,
    string CurrencyCode,
    string Status,
    string Purpose,
    string Provider,
    DateTime CreatedAt
);

public sealed record AdminBillingInvoiceResponse(
    Guid Id,
    Guid UserId,
    string UserEmail,
    decimal Amount,
    string CurrencyCode,
    string Status,
    string Purpose,
    DateTime CreatedAt
);

public sealed record AdminBillingSubscriptionResponse(
    Guid Id,
    Guid UserId,
    string UserEmail,
    string PlanKey,
    string Status,
    DateTime StartsAt,
    DateTime? EndsAt
);

public sealed record AdminMentorBookingResponse(
    Guid BookingId,
    Guid UserId,
    string CandidateEmail,
    string MentorName,
    string ServiceType,
    string Status,
    decimal PriceAmount,
    string CurrencyCode,
    DateTime StartsAt,
    DateTime EndsAt,
    string PaymentStatus
);

public sealed record AdminReportShareResponse(
    Guid ShareId,
    Guid UserId,
    string OwnerEmail,
    string OwnerFullName,
    string ReportType,
    Guid ResourceId,
    string Title,
    bool IsActive,
    bool AllowPdfDownload,
    int ViewCount,
    DateTime CreatedAt,
    DateTime? ExpiresAt,
    DateTime? RevokedAt,
    string TokenPreview
);

public sealed record BroadcastNotificationRequest(
    string Title,
    string Message,
    string Priority,
    string Target
);

public sealed record AssignUserRolesRequest(
    List<string> Roles
);
