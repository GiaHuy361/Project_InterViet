using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Interviet.Api.Filters;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Support;
using Interviet.Contracts.Admin;
using Interviet.Domain.Support;

namespace Interviet.Api.Controllers;

[Authorize(Policy = "AdminOrSupport")]
[FeatureGate("Support")]
[Route("api/v1/admin/support/tickets")]
public sealed class AdminSupportTicketsController : ApiControllerBase
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditLogService _auditLogService;
    private readonly INotificationService _notificationService;

    public AdminSupportTicketsController(
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
    /// Gets all support tickets in the system, paginated, with optional filters.
    /// Route: GET /api/v1/admin/support/tickets
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetList(
        [FromQuery] string? status,
        [FromQuery] string? category,
        [FromQuery] string? priority,
        [FromQuery] Guid? userId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var query = _context.SupportTickets.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(t => t.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(t => t.Category == category);
        }

        if (!string.IsNullOrWhiteSpace(priority))
        {
            query = query.Where(t => t.Priority == priority);
        }

        if (userId.HasValue)
        {
            query = query.Where(t => t.UserId == userId.Value);
        }

        var total = await query.CountAsync();
        var tickets = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = await SupportTicketHelper.MapTicketsAsync(_context, tickets, maskEmail: false);

        return Ok(new { total, page, pageSize, items });
    }

    /// <summary>
    /// Gets detailed view of a support ticket (includes internal notes).
    /// Route: GET /api/v1/admin/support/tickets/{id}
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var ticket = await _context.SupportTickets
            .Include(t => t.Messages)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null)
        {
            return NotFound(new { message = "Support ticket not found." });
        }

        var mapped = await SupportTicketHelper.MapTicketsAsync(_context, new List<SupportTicket> { ticket }, maskEmail: false);
        var res = mapped.First();

        return Ok(res);
    }

    /// <summary>
    /// Assigns a ticket to a support staff member.
    /// Route: POST /api/v1/admin/support/tickets/{id}/assign
    /// </summary>
    [HttpPost("{id:guid}/assign")]
    public async Task<IActionResult> Assign(Guid id, AdminSupportTicketAssignRequest req)
    {
        var ticket = await _context.SupportTickets
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null)
        {
            return NotFound(new { message = "Support ticket not found." });
        }

        ticket.AssignedTo = req.AssignedTo;
        if (ticket.Status == "open")
        {
            ticket.Status = "in_progress";
        }

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(
            action: "support.ticket_assigned",
            resource: "SupportTicket",
            resourceId: ticket.Id.ToString(),
            metadata: new { ticketNumber = ticket.TicketNumber, assignedTo = req.AssignedTo, status = ticket.Status }
        );

        return Ok(new { message = "Ticket assigned successfully.", status = ticket.Status, assignedTo = ticket.AssignedTo });
    }

    /// <summary>
    /// Adds a public reply or internal note to a support ticket.
    /// Route: POST /api/v1/admin/support/tickets/{id}/messages
    /// </summary>
    [HttpPost("{id:guid}/messages")]
    public async Task<IActionResult> AddMessage(Guid id, AdminSupportTicketMessageRequest req)
    {
        var ticket = await _context.SupportTickets
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null)
        {
            return NotFound(new { message = "Support ticket not found." });
        }

        var adminId = _currentUserService.UserId;

        var message = new SupportTicketMessage
        {
            SupportTicketId = ticket.Id,
            SenderType = _currentUserService.IsInRole("admin") ? "admin" : "support",
            SenderUserId = adminId,
            MessageBody = req.MessageBody,
            IsInternalNote = req.IsInternalNote,
            CreatedAt = DateTime.UtcNow
        };

        _context.SupportTicketMessages.Add(message);

        // State changes based on message visibility
        if (req.IsInternalNote)
        {
            // Internal note: save directly, no change in public ticket status
            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync(
                action: "support.ticket_replied",
                resource: "SupportTicket",
                resourceId: ticket.Id.ToString(),
                metadata: new { ticketNumber = ticket.TicketNumber, isInternalNote = true }
            );
        }
        else
        {
            // Public reply: update status, last message time, and trigger notification
            ticket.LastMessageAt = DateTime.UtcNow;
            if (ticket.Status == "open")
            {
                ticket.Status = "in_progress";
            }

            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync(
                action: "support.ticket_replied",
                resource: "SupportTicket",
                resourceId: ticket.Id.ToString(),
                metadata: new { ticketNumber = ticket.TicketNumber, isInternalNote = false, status = ticket.Status }
            );

            // In-app notification for the candidate
            await _notificationService.CreateAsync(
                userId: ticket.UserId,
                type: "support.ticket_reply",
                title: "Phản hồi hỗ trợ mới",
                message: $"Yêu cầu hỗ trợ {ticket.TicketNumber} của bạn có phản hồi mới từ ban quản trị.",
                actionUrl: $"/support/tickets/{ticket.Id}"
            );
        }

        var res = new SupportTicketMessageResponse(
            Id: message.Id,
            SenderType: message.SenderType,
            SenderUserId: message.SenderUserId,
            MessageBody: message.MessageBody,
            CreatedAt: message.CreatedAt,
            IsInternalNote: message.IsInternalNote
        );

        return Ok(res, "Message added successfully.");
    }

    /// <summary>
    /// Overrides support ticket status directly.
    /// Route: POST /api/v1/admin/support/tickets/{id}/status
    /// </summary>
    [HttpPost("{id:guid}/status")]
    public async Task<IActionResult> SetStatus(Guid id, AdminSupportTicketStatusRequest req)
    {
        var ticket = await _context.SupportTickets
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null)
        {
            return NotFound(new { message = "Support ticket not found." });
        }

        var validStatuses = new[] { "open", "in_progress", "resolved", "closed" };
        var normalizedStatus = req.Status.ToLowerInvariant().Trim();
        if (!validStatuses.Contains(normalizedStatus))
        {
            return BadRequest(new { message = $"Invalid status. Must be one of: {string.Join(", ", validStatuses)}" });
        }

        var prevStatus = ticket.Status;
        ticket.Status = normalizedStatus;

        if (normalizedStatus == "resolved" || normalizedStatus == "closed")
        {
            ticket.ClosedAt = DateTime.UtcNow;
        }
        else
        {
            ticket.ClosedAt = null;
        }

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(
            action: "support.ticket_status_updated",
            resource: "SupportTicket",
            resourceId: ticket.Id.ToString(),
            metadata: new { ticketNumber = ticket.TicketNumber, previousStatus = prevStatus, currentStatus = ticket.Status }
        );

        return Ok(new { message = "Ticket status overridden successfully.", previousStatus = prevStatus, currentStatus = ticket.Status });
    }
}
