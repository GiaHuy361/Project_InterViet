using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Support;
using Interviet.Contracts.Admin;
using Interviet.Domain.Support;

namespace Interviet.Api.Controllers;

[Authorize(Policy = "SupportOrAdmin")]
[Route("api/v1/support/workspace")]
public sealed class SupportWorkspaceController : ApiControllerBase
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditLogService _auditLogService;
    private readonly INotificationService _notificationService;

    public SupportWorkspaceController(
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
    /// Gets Support Dashboard Summary (aggregates of support tickets and contact requests).
    /// Route: GET /api/v1/support/workspace/dashboard/summary
    /// </summary>
    [HttpGet("dashboard/summary")]
    public async Task<IActionResult> GetDashboardSummary()
    {
        var totalTickets = await _context.SupportTickets.CountAsync();
        var openTickets = await _context.SupportTickets.CountAsync(t => t.Status == "open");
        var inProgressTickets = await _context.SupportTickets.CountAsync(t => t.Status == "in_progress");
        var resolvedTickets = await _context.SupportTickets.CountAsync(t => t.Status == "resolved");
        var closedTickets = await _context.SupportTickets.CountAsync(t => t.Status == "closed");

        var totalContactRequests = await _context.PublicContactRequests.CountAsync();
        var pendingContactRequests = await _context.PublicContactRequests.CountAsync(c => c.Status == "pending");
        var processedContactRequests = await _context.PublicContactRequests.CountAsync(c => c.Status == "processed");

        var summary = new SupportDashboardSummaryResponse(
            TotalTickets: totalTickets,
            OpenTickets: openTickets,
            InProgressTickets: inProgressTickets,
            ResolvedTickets: resolvedTickets,
            ClosedTickets: closedTickets,
            TotalContactRequests: totalContactRequests,
            PendingContactRequests: pendingContactRequests,
            ProcessedContactRequests: processedContactRequests
        );

        return Ok(summary);
    }

    /// <summary>
    /// Gets all support tickets in the system, paginated, with optional filters.
    /// Route: GET /api/v1/support/workspace/tickets
    /// </summary>
    [HttpGet("tickets")]
    public async Task<IActionResult> GetTickets(
        [FromQuery] string? status,
        [FromQuery] string? category,
        [FromQuery] string? priority,
        [FromQuery] bool? assignedToMe,
        [FromQuery] string? search,
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

        if (assignedToMe == true)
        {
            var email = _currentUserService.Email;
            query = query.Where(t => t.AssignedTo == email);
        }
        else if (assignedToMe == false)
        {
            query = query.Where(t => t.AssignedTo == null || t.AssignedTo == "");
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLowerInvariant();
            query = query.Where(t => t.Subject.ToLower().Contains(searchLower)
                || t.Description.ToLower().Contains(searchLower)
                || t.TicketNumber.ToLower().Contains(searchLower));
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
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
    /// Gets a detailed view of a support ticket (includes internal notes).
    /// Route: GET /api/v1/support/workspace/tickets/{id}
    /// </summary>
    [HttpGet("tickets/{id:guid}")]
    public async Task<IActionResult> GetTicketById(Guid id)
    {
        var ticket = await _context.SupportTickets
            .Include(t => t.Messages)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null)
        {
            return NotFound(new { message = "Support ticket not found." });
        }

        var messages = ticket.Messages
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
            Messages: messages
        );

        return Ok(res);
    }

    /// <summary>
    /// Assigns a ticket to the current support staff member.
    /// Route: POST /api/v1/support/workspace/tickets/{id}/assign-self
    /// </summary>
    [HttpPost("tickets/{id:guid}/assign-self")]
    public async Task<IActionResult> AssignSelf(Guid id)
    {
        var ticket = await _context.SupportTickets
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null)
        {
            return NotFound(new { message = "Support ticket not found." });
        }

        var email = _currentUserService.Email;
        ticket.AssignedTo = email;
        if (ticket.Status == "open")
        {
            ticket.Status = "in_progress";
        }

        await _context.SaveChangesAsync();

        try
        {
            await _auditLogService.LogAsync(
                action: "support.ticket_assigned_self",
                resource: "SupportTicket",
                resourceId: ticket.Id.ToString(),
                metadata: new { ticketNumber = ticket.TicketNumber, assignedTo = email, status = ticket.Status }
            );
        }
        catch {}

        return Ok(new SupportTicketAssignSelfResponse(
            TicketId: ticket.Id,
            TicketNumber: ticket.TicketNumber,
            AssignedTo: ticket.AssignedTo,
            Status: ticket.Status
        ));
    }

    /// <summary>
    /// Updates a support ticket status.
    /// Route: POST /api/v1/support/workspace/tickets/{id}/status
    /// </summary>
    [HttpPost("tickets/{id:guid}/status")]
    public async Task<IActionResult> SetTicketStatus(Guid id, AdminSupportTicketStatusRequest req)
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

        try
        {
            await _auditLogService.LogAsync(
                action: "support.ticket_status_updated",
                resource: "SupportTicket",
                resourceId: ticket.Id.ToString(),
                metadata: new { ticketNumber = ticket.TicketNumber, previousStatus = prevStatus, currentStatus = ticket.Status }
            );
        }
        catch {}

        return Ok(new { message = "Ticket status overridden successfully.", previousStatus = prevStatus, currentStatus = ticket.Status });
    }

    /// <summary>
    /// Adds a public reply or internal note to a support ticket.
    /// Route: POST /api/v1/support/workspace/tickets/{id}/messages
    /// </summary>
    [HttpPost("tickets/{id:guid}/messages")]
    public async Task<IActionResult> AddMessage(Guid id, AdminSupportTicketMessageRequest req)
    {
        var ticket = await _context.SupportTickets
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null)
        {
            return NotFound(new { message = "Support ticket not found." });
        }

        var supportUserId = _currentUserService.UserId;
        var senderType = _currentUserService.IsInRole("admin") ? "admin" : "support";

        var message = new SupportTicketMessage
        {
            SupportTicketId = ticket.Id,
            SenderType = senderType,
            SenderUserId = supportUserId,
            MessageBody = req.MessageBody,
            IsInternalNote = req.IsInternalNote,
            CreatedAt = DateTime.UtcNow
        };

        _context.SupportTicketMessages.Add(message);

        if (req.IsInternalNote)
        {
            await _context.SaveChangesAsync();
            try
            {
                await _auditLogService.LogAsync(
                    action: "support.ticket_replied",
                    resource: "SupportTicket",
                    resourceId: ticket.Id.ToString(),
                    metadata: new { ticketNumber = ticket.TicketNumber, isInternalNote = true }
                );
            }
            catch {}
        }
        else
        {
            ticket.LastMessageAt = DateTime.UtcNow;
            if (ticket.Status == "open")
            {
                ticket.Status = "in_progress";
            }

            await _context.SaveChangesAsync();

            try
            {
                await _auditLogService.LogAsync(
                    action: "support.ticket_replied",
                    resource: "SupportTicket",
                    resourceId: ticket.Id.ToString(),
                    metadata: new { ticketNumber = ticket.TicketNumber, isInternalNote = false, status = ticket.Status }
                );
            }
            catch {}

            try
            {
                await _notificationService.CreateAsync(
                    userId: ticket.UserId,
                    type: "support.ticket_reply",
                    title: "Phản hồi hỗ trợ mới",
                    message: $"Yêu cầu hỗ trợ {ticket.TicketNumber} của bạn có phản hồi mới từ ban quản trị.",
                    actionUrl: $"/support/tickets/{ticket.Id}"
                );
            }
            catch {}
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
    /// Gets Visitor Contact Requests.
    /// Route: GET /api/v1/support/workspace/contact-requests
    /// </summary>
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

    /// <summary>
    /// Gets a Visitor Contact Request details by ID.
    /// Route: GET /api/v1/support/workspace/contact-requests/{id}
    /// </summary>
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

    /// <summary>
    /// Processes (updates status of) a Visitor Contact Request.
    /// Route: POST /api/v1/support/workspace/contact-requests/{id}/status
    /// </summary>
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

        try
        {
            await _auditLogService.LogAsync(
                "public.contact_request_status_updated",
                "PublicContactRequest",
                contact.Id.ToString(),
                new { previousStatus, currentStatus = contact.Status }
            );
        }
        catch {}

        return Ok(new { id, previousStatus, currentStatus = contact.Status }, "Cập nhật trạng thái yêu cầu liên hệ thành công.");
    }
}
