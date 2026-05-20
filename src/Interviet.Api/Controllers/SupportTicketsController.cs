using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Interviet.Api.Filters;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Support;
using Interviet.Domain.Support;

namespace Interviet.Api.Controllers;

[Authorize]
[FeatureGate("Support")]
[Route("api/v1/support/tickets")]
public sealed class SupportTicketsController : ApiControllerBase
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditLogService _auditLogService;

    public SupportTicketsController(
        IAppDbContext context,
        ICurrentUserService currentUserService,
        IAuditLogService auditLogService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _auditLogService = auditLogService;
    }

    /// <summary>
    /// Creates a support ticket for the candidate.
    /// Route: POST /api/v1/support/tickets
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create(CreateSupportTicketRequest req)
    {
        var userId = _currentUserService.UserId;

        // Generate unique TicketNumber
        var ticketNumber = $"TK-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(100, 999)}";

        var ticket = new SupportTicket
        {
            UserId = userId,
            TicketNumber = ticketNumber,
            Category = req.Category,
            Priority = req.Priority,
            Subject = req.Subject,
            Description = req.Description,
            Status = "open",
            CreatedAt = DateTime.UtcNow
        };

        _context.SupportTickets.Add(ticket);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(
            action: "support.ticket_created",
            resource: "SupportTicket",
            resourceId: ticket.Id.ToString(),
            metadata: new { ticketNumber = ticket.TicketNumber }
        );

        var res = new SupportTicketDetailResponse(
            Id: ticket.Id,
            TicketNumber: ticket.TicketNumber,
            Category: ticket.Category,
            Priority: ticket.Priority,
            Subject: ticket.Subject,
            Status: ticket.Status,
            Description: ticket.Description,
            AssignedTo: ticket.AssignedTo,
            CreatedAt: ticket.CreatedAt,
            ClosedAt: ticket.ClosedAt,
            LastMessageAt: ticket.LastMessageAt,
            Messages: []
        );

        return Ok(res, "Support ticket created successfully.");
    }

    /// <summary>
    /// Retrieves paginated list of tickets created by the current candidate.
    /// Route: GET /api/v1/support/tickets
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var userId = _currentUserService.UserId;

        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.SupportTickets
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new SupportTicketDetailResponse(
                t.Id,
                t.TicketNumber,
                t.Category,
                t.Priority,
                t.Subject,
                t.Status,
                t.Description,
                t.AssignedTo,
                t.CreatedAt,
                t.ClosedAt,
                t.LastMessageAt,
                new List<SupportTicketMessageResponse>()
            ))
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }

    /// <summary>
    /// Gets specific ticket details with message history (public messages only).
    /// Route: GET /api/v1/support/tickets/{id}
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var userId = _currentUserService.UserId;

        var ticket = await _context.SupportTickets
            .Include(t => t.Messages)
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (ticket == null)
        {
            return NotFound(new { message = "Support ticket not found." });
        }

        // Map messages, filtering out internal notes
        var publicMessages = ticket.Messages
            .Where(m => !m.IsInternalNote)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new SupportTicketMessageResponse(
                m.Id,
                m.SenderType,
                m.SenderUserId,
                m.MessageBody,
                m.CreatedAt,
                m.IsInternalNote
            ))
            .ToList();

        var res = new SupportTicketDetailResponse(
            Id: ticket.Id,
            TicketNumber: ticket.TicketNumber,
            Category: ticket.Category,
            Priority: ticket.Priority,
            Subject: ticket.Subject,
            Status: ticket.Status,
            Description: ticket.Description,
            AssignedTo: ticket.AssignedTo,
            CreatedAt: ticket.CreatedAt,
            ClosedAt: ticket.ClosedAt,
            LastMessageAt: ticket.LastMessageAt,
            Messages: publicMessages
        );

        return Ok(res);
    }

    /// <summary>
    /// Adds a reply message to the support ticket. Reopens the ticket if it was closed or resolved.
    /// Route: POST /api/v1/support/tickets/{id}/messages
    /// </summary>
    [HttpPost("{id:guid}/messages")]
    public async Task<IActionResult> AddMessage(Guid id, SubmitTicketMessageRequest req)
    {
        var userId = _currentUserService.UserId;

        var ticket = await _context.SupportTickets
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (ticket == null)
        {
            return NotFound(new { message = "Support ticket not found." });
        }

        var message = new SupportTicketMessage
        {
            SupportTicketId = ticket.Id,
            SenderType = "user",
            SenderUserId = userId,
            MessageBody = req.MessageBody,
            IsInternalNote = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.SupportTicketMessages.Add(message);

        // Update ticket message status
        ticket.LastMessageAt = DateTime.UtcNow;

        var prevStatus = ticket.Status;
        if (ticket.Status == "resolved" || ticket.Status == "closed")
        {
            ticket.Status = "open";
            ticket.ClosedAt = null;
        }

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(
            action: "support.ticket_replied",
            resource: "SupportTicket",
            resourceId: ticket.Id.ToString(),
            metadata: new { ticketNumber = ticket.TicketNumber, previousStatus = prevStatus, currentStatus = ticket.Status }
        );

        var res = new SupportTicketMessageResponse(
            Id: message.Id,
            SenderType: message.SenderType,
            SenderUserId: message.SenderUserId,
            MessageBody: message.MessageBody,
            CreatedAt: message.CreatedAt,
            IsInternalNote: message.IsInternalNote
        );

        return Ok(res, "Message sent successfully.");
    }

    /// <summary>
    /// Closes a support ticket.
    /// Route: POST /api/v1/support/tickets/{id}/close
    /// </summary>
    [HttpPost("{id:guid}/close")]
    public async Task<IActionResult> CloseTicket(Guid id)
    {
        var userId = _currentUserService.UserId;

        var ticket = await _context.SupportTickets
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (ticket == null)
        {
            return NotFound(new { message = "Support ticket not found." });
        }

        ticket.Status = "closed";
        ticket.ClosedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(
            action: "support.ticket_status_updated",
            resource: "SupportTicket",
            resourceId: ticket.Id.ToString(),
            metadata: new { ticketNumber = ticket.TicketNumber, status = "closed" }
        );

        return Ok(new { message = "Support ticket closed successfully." });
    }
}
