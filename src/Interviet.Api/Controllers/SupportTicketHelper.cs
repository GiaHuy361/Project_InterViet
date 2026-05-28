using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Support;
using Interviet.Domain.Support;

namespace Interviet.Api.Controllers;

public static class SupportTicketHelper
{
    public static async Task<List<SupportTicketDetailResponse>> MapTicketsAsync(
        IAppDbContext context, 
        List<SupportTicket> tickets, 
        bool maskEmail = false)
    {
        if (tickets == null || !tickets.Any())
            return new List<SupportTicketDetailResponse>();

        // 1. Collect non-empty AssignedTo keys
        var assignedToKeys = tickets
            .Select(t => t.AssignedTo)
            .Where(a => !string.IsNullOrWhiteSpace(a))
            .Distinct()
            .ToList();

        var guidIds = new List<Guid>();
        var emails = new List<string>();

        foreach (var key in assignedToKeys)
        {
            if (Guid.TryParse(key, out var parsedGuid))
            {
                guidIds.Add(parsedGuid);
            }
            else if (key!.Contains("@"))
            {
                emails.Add(key);
            }
        }

        // 2. Fetch all matching users in a single query
        var matchedUsers = await context.Users
            .Where(u => guidIds.Contains(u.Id) || (u.Email != null && emails.Contains(u.Email)))
            .Select(u => new { u.Id, u.Email, u.FullName, u.AvatarUrl })
            .ToListAsync();

        var userMapByEmail = matchedUsers
            .Where(u => !string.IsNullOrEmpty(u.Email))
            .ToDictionary(u => u.Email, u => u, StringComparer.OrdinalIgnoreCase);

        var userMapById = matchedUsers
            .ToDictionary(u => u.Id, u => u);

        // 3. Map to DTO response envelope list
        var responses = new List<SupportTicketDetailResponse>();
        foreach (var t in tickets)
        {
            string? assignedToId = null;
            string? assignedToName = null;
            string? assignedToAvatarUrl = null;
            string? rawAssignedTo = t.AssignedTo;

            if (!string.IsNullOrWhiteSpace(t.AssignedTo))
            {
                if (Guid.TryParse(t.AssignedTo, out var guid) && userMapById.TryGetValue(guid, out var userById))
                {
                    assignedToId = userById.Id.ToString();
                    assignedToName = userById.FullName;
                    assignedToAvatarUrl = userById.AvatarUrl;
                }
                else if (userMapByEmail.TryGetValue(t.AssignedTo, out var userByEmail))
                {
                    assignedToId = userByEmail.Id.ToString();
                    assignedToName = userByEmail.FullName;
                    assignedToAvatarUrl = userByEmail.AvatarUrl;
                }
            }

            // Candidate-facing safety mask
            string? assignedToResponse = rawAssignedTo;
            if (maskEmail && !string.IsNullOrWhiteSpace(rawAssignedTo))
            {
                // Never leak raw email to candidates; show safe Display Name or Team name
                assignedToResponse = assignedToName ?? "Ban hỗ trợ";
            }

            var messages = t.Messages?
                .OrderBy(m => m.CreatedAt)
                .Select(m => new SupportTicketMessageResponse(
                    m.Id,
                    m.SenderType,
                    m.SenderUserId,
                    m.MessageBody,
                    m.CreatedAt,
                    m.IsInternalNote
                ))
                .ToList() ?? new List<SupportTicketMessageResponse>();

            responses.Add(new SupportTicketDetailResponse(
                Id: t.Id,
                TicketNumber: t.TicketNumber,
                Category: t.Category,
                Priority: t.Priority,
                Subject: t.Subject,
                Status: t.Status,
                Description: t.Description,
                AssignedTo: assignedToResponse,
                CreatedAt: t.CreatedAt,
                ClosedAt: t.ClosedAt,
                LastMessageAt: t.LastMessageAt,
                Messages: messages,
                AssignedToId: assignedToId,
                AssignedToName: assignedToName,
                AssignedToAvatarUrl: assignedToAvatarUrl
            ));
        }

        return responses;
    }
}
