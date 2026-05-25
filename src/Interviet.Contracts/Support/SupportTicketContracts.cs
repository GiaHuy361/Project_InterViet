namespace Interviet.Contracts.Support;

public sealed record CreateSupportTicketRequest(
    string Subject,
    string Description,
    string Category,
    string Priority
);

public sealed record SupportTicketDetailResponse(
    Guid Id,
    string TicketNumber,
    string Category,
    string Priority,
    string Subject,
    string Status,
    string Description,
    string? AssignedTo,
    DateTime CreatedAt,
    DateTime? ClosedAt,
    DateTime? LastMessageAt,
    List<SupportTicketMessageResponse> Messages
);

public sealed record SupportTicketMessageResponse(
    Guid Id,
    string SenderType,
    Guid? SenderUserId,
    string MessageBody,
    DateTime CreatedAt,
    bool IsInternalNote
);

public sealed record SubmitTicketMessageRequest(
    string MessageBody
);

public sealed record SupportDashboardSummaryResponse(
    int TotalTickets,
    int OpenTickets,
    int InProgressTickets,
    int ResolvedTickets,
    int ClosedTickets,
    int TotalContactRequests,
    int PendingContactRequests,
    int ProcessedContactRequests
);

public sealed record SupportTicketAssignSelfResponse(
    Guid TicketId,
    string TicketNumber,
    string? AssignedTo,
    string Status
);
