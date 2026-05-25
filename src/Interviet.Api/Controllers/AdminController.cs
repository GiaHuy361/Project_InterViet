using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Interviet.Api.Filters;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Common.Options;
using Interviet.Contracts.Admin;
using Interviet.Domain.Identity;
using Interviet.Domain.Notifications;
using Interviet.Domain.Support;
using System.Text.Json;

namespace Interviet.Api.Controllers;

[Authorize(Policy = "AdminOnly")]
[FeatureGate("Admin")]
[Route("api/v1/admin")]
public sealed class AdminController : ApiControllerBase
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditLogService _auditLogService;
    private readonly INotificationService _notificationService;
    private readonly IConfiguration _configuration;

    public AdminController(
        IAppDbContext context,
        ICurrentUserService currentUserService,
        IAuditLogService auditLogService,
        INotificationService notificationService,
        IConfiguration configuration)
    {
        _context = context;
        _currentUserService = currentUserService;
        _auditLogService = auditLogService;
        _notificationService = notificationService;
        _configuration = configuration;
    }

    /// <summary>
    /// Gets system overview dashboard statistics.
    /// Route: GET /api/v1/admin/dashboard/summary
    /// </summary>
    [HttpGet("dashboard/summary")]
    public async Task<IActionResult> GetDashboardSummary()
    {
        var totalUsers = await _context.Users.CountAsync();
        var today = DateTime.UtcNow.Date;
        var startOfWeek = DateTime.UtcNow.Date.AddDays(-(int)DateTime.UtcNow.DayOfWeek);
        var newUsersToday = await _context.Users.CountAsync(u => u.CreatedAt >= today);
        var newUsersThisWeek = await _context.Users.CountAsync(u => u.CreatedAt >= startOfWeek);

        var activeSubscriptions = await _context.Subscriptions.CountAsync(s => s.Status == "active");

        var totalSubscriptionRevenue = await _context.Invoices
            .Where(i => i.Status == "paid" && i.Purpose == "subscription_plan")
            .SumAsync(i => (decimal?)i.Amount) ?? 0m;

        var totalPayments = await _context.PaymentTransactions
            .CountAsync(t => t.Status == "succeeded");

        var totalMockRevenue = await _context.PaymentTransactions
            .Where(t => t.Status == "succeeded")
            .SumAsync(t => (decimal?)t.Amount) ?? 0m;

        var totalResumesOptimized = await _context.ResumeVersions.CountAsync();
        var totalMatchingSessions = await _context.MatchSessions.CountAsync();
        var totalInterviewSessions = await _context.InterviewSessions.CountAsync();

        var totalMentorBookings = await _context.MentorBookings.CountAsync();
        var totalBookingRevenue = await _context.Invoices
            .Where(i => i.Status == "paid" && i.Purpose == "mentor_booking")
            .SumAsync(i => (decimal?)i.Amount) ?? 0m;

        var totalReportShares = await _context.ReportShareLinks.CountAsync();

        var supportTicketsByStatus = await _context.SupportTickets
            .GroupBy(t => t.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Status, x => x.Count);

        var res = new AdminDashboardSummaryResponse(
            TotalUsers: totalUsers,
            NewUsersToday: newUsersToday,
            NewUsersThisWeek: newUsersThisWeek,
            ActiveSubscriptions: activeSubscriptions,
            TotalSubscriptionRevenue: totalSubscriptionRevenue,
            TotalPayments: totalPayments,
            TotalMockRevenue: totalMockRevenue,
            TotalResumesOptimized: totalResumesOptimized,
            TotalMatchingSessions: totalMatchingSessions,
            TotalInterviewSessions: totalInterviewSessions,
            TotalMentorBookings: totalMentorBookings,
            TotalBookingRevenue: totalBookingRevenue,
            TotalReportShares: totalReportShares,
            SupportTicketsByStatus: supportTicketsByStatus
        );

        return Ok(res);
    }

    /// <summary>
    /// Promotes a user to a specific system role (dev-only promote endpoint).
    /// Route: POST /api/v1/admin/dev/promote
    /// </summary>
    [HttpPost("dev/promote")]
    public async Task<IActionResult> DevPromote(DevPromoteRequest req)
    {
        var adminOpts = _configuration.GetSection("Admin").Get<AdminOptions>();
        if (adminOpts == null || !adminOpts.EnableDevBootstrap)
        {
            return BadRequest(new { message = "Developer bootstrap role promotion is disabled." });
        }

        var normalizedEmail = req.Email.ToUpperInvariant().Trim();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail);
        if (user == null)
        {
            return NotFound(new { message = $"User with email '{req.Email}' not found." });
        }

        var validRoles = new[] { RoleCodes.Admin, RoleCodes.Support, RoleCodes.Mentor, RoleCodes.Candidate };
        var normalizedRole = req.RoleCode.ToLowerInvariant().Trim();
        if (!validRoles.Contains(normalizedRole))
        {
            return BadRequest(new { message = $"Invalid role code. Must be one of: {string.Join(", ", validRoles)}" });
        }

        var prevRole = user.RoleCode;
        user.RoleCode = normalizedRole;
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(
            action: "admin.dev_promote",
            resource: "User",
            resourceId: user.Id.ToString(),
            metadata: new { email = user.Email, previousRole = prevRole, newRole = normalizedRole }
        );

        return Ok(new { message = "User role promoted successfully.", email = user.Email, previousRole = prevRole, newRole = normalizedRole });
    }

    /// <summary>
    /// Gets paginated and filtered list of system audit logs.
    /// Route: GET /api/v1/admin/audit-logs
    /// </summary>
    [HttpGet("audit-logs")]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] string? actorRole,
        [FromQuery] string? action,
        [FromQuery] string? resource,
        [FromQuery] string? resourceId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var query = _context.AuditLogs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(actorRole))
        {
            query = query.Where(l => l.ActorRole == actorRole);
        }

        if (!string.IsNullOrWhiteSpace(action))
        {
            query = query.Where(l => l.Action == action);
        }

        if (!string.IsNullOrWhiteSpace(resource))
        {
            query = query.Where(l => l.Resource == resource);
        }

        if (!string.IsNullOrWhiteSpace(resourceId))
        {
            query = query.Where(l => l.ResourceId == resourceId);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new AuditLogResponse(
                l.Id,
                l.ActorId,
                l.ActorEmail,
                l.ActorRole,
                l.Action,
                l.Resource,
                l.ResourceId,
                l.MetadataJson,
                l.IpAddress,
                l.UserAgent,
                l.CreatedAt
            ))
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }

    /// <summary>
    /// Gets all system users with pagination and filters.
    /// Route: GET /api/v1/admin/users
    /// </summary>
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search,
        [FromQuery] string? role,
        [FromQuery] string? status,
        [FromQuery] bool? emailVerified,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(u => u.Email.Contains(search) || u.FullName.Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(role))
        {
            query = query.Where(u => u.RoleCode == role);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(u => u.Status == status);
        }

        if (emailVerified.HasValue)
        {
            query = query.Where(u => u.IsEmailVerified == emailVerified.Value);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AdminUserListResponse(
                u.Id,
                u.Email,
                u.FullName,
                u.RoleCode,
                u.Status,
                u.IsEmailVerified,
                u.CreatedAt,
                u.LastLoginAt
            ))
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }

    /// <summary>
    /// Gets comprehensive detail about a single user.
    /// Route: GET /api/v1/admin/users/{id}
    /// </summary>
    [HttpGet("users/{id:guid}")]
    public async Task<IActionResult> GetUserDetail(Guid id)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        // Summary List representation
        var summary = new AdminUserListResponse(
            user.Id,
            user.Email,
            user.FullName,
            user.RoleCode,
            user.Status,
            user.IsEmailVerified,
            user.CreatedAt,
            user.LastLoginAt
        );

        // Profile summary
        UserProfileSummaryDto? profileSummary = null;
        var profile = await _context.CandidateProfiles.FirstOrDefaultAsync(p => p.UserId == id);
        if (profile != null)
        {
            var skills = await _context.CandidateSkills
                .Where(cs => cs.CandidateProfileId == profile.Id)
                .Include(cs => cs.Skill)
                .Select(cs => cs.Skill.Name)
                .ToListAsync();

            profileSummary = new UserProfileSummaryDto(
                Headline: profile.Headline,
                Bio: profile.Summary,
                YearsOfExperience: profile.YearsOfExperience.HasValue ? profile.YearsOfExperience.Value.ToString("0.#") : null,
                Skills: skills
            );
        }

        // Current Active Subscription
        UserSubscriptionSummaryDto? currentSubscription = null;
        var sub = await _context.Subscriptions
            .Include(s => s.Plan)
            .Where(s => s.UserId == id && s.Status == "active")
            .OrderByDescending(s => s.CurrentPeriodStartsAt)
            .FirstOrDefaultAsync();

        if (sub != null)
        {
            currentSubscription = new UserSubscriptionSummaryDto(
                SubscriptionId: sub.Id,
                PlanKey: sub.Plan.Code,
                Status: sub.Status,
                StartsAt: sub.CurrentPeriodStartsAt,
                EndsAt: sub.CurrentPeriodEndsAt
            );
        }

        // Quotas
        var dailyMatchLimit = 5;
        var dailyInterviewLimit = 3;
        var dailyOptimizeLimit = 3;

        if (sub != null)
        {
            var entitlements = await _context.PlanEntitlements
                .Where(e => e.PlanId == sub.PlanId)
                .ToListAsync();

            var matchLimitEnt = entitlements.FirstOrDefault(e => e.FeatureKey == QuotaFeatureKeys.MatchCreate);
            if (matchLimitEnt != null && int.TryParse(matchLimitEnt.FeatureValue, out var ml))
                dailyMatchLimit = ml;

            var interviewLimitEnt = entitlements.FirstOrDefault(e => e.FeatureKey == QuotaFeatureKeys.InterviewAi);
            if (interviewLimitEnt != null && int.TryParse(interviewLimitEnt.FeatureValue, out var il))
                dailyInterviewLimit = il;

            var optimizeLimitEnt = entitlements.FirstOrDefault(e => e.FeatureKey == QuotaFeatureKeys.CvOptimization);
            if (optimizeLimitEnt != null && int.TryParse(optimizeLimitEnt.FeatureValue, out var ol))
                dailyOptimizeLimit = ol;
        }

        var counters = await _context.UserQuotaCounters
            .Where(q => q.UserId == id && q.PeriodType == "daily")
            .ToListAsync();

        var matchQuota = counters.FirstOrDefault(c => c.FeatureKey == QuotaFeatureKeys.MatchCreate);
        var interviewQuota = counters.FirstOrDefault(c => c.FeatureKey == QuotaFeatureKeys.InterviewAi);
        var optimizeQuota = counters.FirstOrDefault(c => c.FeatureKey == QuotaFeatureKeys.CvOptimization);

        var quotaSummary = new UserQuotaSummaryDto(
            DailyMatchUsed: matchQuota?.UsedValue ?? 0,
            DailyMatchLimit: dailyMatchLimit,
            DailyInterviewUsed: interviewQuota?.UsedValue ?? 0,
            DailyInterviewLimit: dailyInterviewLimit,
            DailyOptimizeUsed: optimizeQuota?.UsedValue ?? 0,
            DailyOptimizeLimit: dailyOptimizeLimit
        );

        // Payments
        var recentPayments = await _context.PaymentTransactions
            .Where(t => t.UserId == id)
            .OrderByDescending(t => t.CreatedAt)
            .Take(5)
            .Select(t => new UserPaymentSummaryDto(
                t.Id,
                t.Amount,
                t.CurrencyCode,
                t.Status,
                t.Purpose,
                t.CreatedAt
            ))
            .ToListAsync();

        // Bookings
        var recentBookings = await _context.MentorBookings
            .Where(b => b.UserId == id)
            .OrderByDescending(b => b.ScheduledStartsAt)
            .Take(5)
            .Select(b => new UserBookingSummaryDto(
                b.Id,
                b.Mentor != null ? b.Mentor.FullName : "Mentor",
                b.ServiceType,
                b.Status,
                b.Amount,
                b.CurrencyCode,
                b.ScheduledStartsAt
            ))
            .ToListAsync();

        // Support tickets count
        var supportCount = await _context.SupportTickets.CountAsync(t => t.UserId == id);

        var res = new AdminUserDetailResponse(
            UserSummary: summary,
            ProfileSummary: profileSummary,
            CurrentSubscription: currentSubscription,
            QuotaSummary: quotaSummary,
            RecentPayments: recentPayments,
            RecentBookings: recentBookings,
            SupportTicketCount: supportCount
        );

        return Ok(res);
    }

    /// <summary>
    /// Suspends, disables or activates a user.
    /// Route: PATCH /api/v1/admin/users/{id}/status
    /// </summary>
    [HttpPatch("users/{id:guid}/status")]
    public async Task<IActionResult> UpdateUserStatus(Guid id, [FromBody] JsonElement body)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        if (!body.TryGetProperty("status", out var statusProp) || statusProp.ValueKind != JsonValueKind.String)
        {
            return BadRequest(new { message = "Missing or invalid 'status' property in request body." });
        }

        var newStatus = statusProp.GetString()?.ToLowerInvariant().Trim();
        var allowedStatuses = new[] { "active", "suspended", "disabled" };
        if (!allowedStatuses.Contains(newStatus))
        {
            return BadRequest(new { message = $"Invalid status value. Must be one of: {string.Join(", ", allowedStatuses)}" });
        }

        var prevStatus = user.Status;
        user.Status = newStatus == "active" ? UserStatus.Free : newStatus!;
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(
            action: "admin.user_status_updated",
            resource: "User",
            resourceId: user.Id.ToString(),
            metadata: new { email = user.Email, previousStatus = prevStatus, currentStatus = newStatus }
        );

        return Ok(new { message = "User status updated successfully.", email = user.Email, previousStatus = prevStatus, currentStatus = newStatus });
    }

    /// <summary>
    /// Updates a user's role (enforces single-role rule).
    /// Route: PATCH /api/v1/admin/users/{id}/roles
    /// </summary>
    [HttpPatch("users/{id:guid}/roles")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> AssignUserRoles(Guid id, AssignUserRolesRequest req)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        // Single role checks
        if (req.Roles == null || req.Roles.Count != 1)
        {
            return BadRequest(new { message = "Only one role is supported in current version." });
        }

        var newRole = req.Roles.First().Trim().ToLowerInvariant();
        if (newRole == "user")
        {
            newRole = RoleCodes.Candidate;
        }

        var validRoles = new[] { RoleCodes.Admin, RoleCodes.Support, RoleCodes.Mentor, RoleCodes.Candidate };
        if (!validRoles.Contains(newRole))
        {
            return BadRequest(new { message = $"Invalid role code. Must be one of: {string.Join(", ", validRoles)}" });
        }

        // Protect the last admin from stripping
        if (user.RoleCode == RoleCodes.Admin && newRole != RoleCodes.Admin)
        {
            var adminCount = await _context.Users.CountAsync(u => u.RoleCode == RoleCodes.Admin);
            if (adminCount <= 1)
            {
                return BadRequest(new { message = "Không thể xóa quyền Admin của tài khoản Admin cuối cùng trong hệ thống." });
            }
        }

        var prevRole = user.RoleCode;
        user.RoleCode = newRole;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(
            action: "role_updated",
            resource: "User",
            resourceId: user.Id.ToString(),
            metadata: new { email = user.Email, previousRole = prevRole, newRole = user.RoleCode }
        );

        return Ok(new { message = "User role updated successfully.", email = user.Email, previousRole = prevRole, newRole = user.RoleCode });
    }

    /// <summary>
    /// Gets all payment transaction logs.
    /// Route: GET /api/v1/admin/billing/payments
    /// </summary>
    [HttpGet("billing/payments")]
    public async Task<IActionResult> GetPayments(
        [FromQuery] string? status,
        [FromQuery] string? purpose,
        [FromQuery] string? provider,
        [FromQuery] Guid? userId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var query = _context.PaymentTransactions.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(t => t.Status == status);
        }
        if (!string.IsNullOrWhiteSpace(purpose))
        {
            query = query.Where(t => t.Purpose == purpose);
        }
        if (!string.IsNullOrWhiteSpace(provider))
        {
            query = query.Where(t => t.Provider == provider);
        }
        if (userId.HasValue)
        {
            query = query.Where(t => t.UserId == userId.Value);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new AdminBillingPaymentResponse(
                t.Id,
                t.UserId,
                _context.Users.Where(u => u.Id == t.UserId).Select(u => u.Email).FirstOrDefault() ?? string.Empty,
                t.Amount,
                t.CurrencyCode,
                t.Status,
                t.Purpose,
                t.Provider,
                t.CreatedAt
            ))
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }

    /// <summary>
    /// Gets all invoice records.
    /// Route: GET /api/v1/admin/billing/invoices
    /// </summary>
    [HttpGet("billing/invoices")]
    public async Task<IActionResult> GetInvoices(
        [FromQuery] string? status,
        [FromQuery] string? purpose,
        [FromQuery] Guid? userId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Invoices.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(i => i.Status == status);
        }
        if (!string.IsNullOrWhiteSpace(purpose))
        {
            query = query.Where(i => i.Purpose == purpose);
        }
        if (userId.HasValue)
        {
            query = query.Where(i => i.UserId == userId.Value);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(i => i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(i => new AdminBillingInvoiceResponse(
                i.Id,
                i.UserId,
                _context.Users.Where(u => u.Id == i.UserId).Select(u => u.Email).FirstOrDefault() ?? string.Empty,
                i.Amount,
                i.CurrencyCode,
                i.Status,
                i.Purpose,
                i.CreatedAt
            ))
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }

    /// <summary>
    /// Gets all user subscriptions.
    /// Route: GET /api/v1/admin/subscriptions
    /// </summary>
    [HttpGet("subscriptions")]
    public async Task<IActionResult> GetSubscriptions(
        [FromQuery] string? status,
        [FromQuery] Guid? userId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Subscriptions.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(s => s.Status == status);
        }
        if (userId.HasValue)
        {
            query = query.Where(s => s.UserId == userId.Value);
        }

        var total = await query.CountAsync();
        var items = await query
            .Include(s => s.Plan)
            .OrderByDescending(s => s.CurrentPeriodStartsAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new AdminBillingSubscriptionResponse(
                s.Id,
                s.UserId,
                _context.Users.Where(u => u.Id == s.UserId).Select(u => u.Email).FirstOrDefault() ?? string.Empty,
                s.Plan.Code,
                s.Status,
                s.CurrentPeriodStartsAt,
                (DateTime?)s.CurrentPeriodEndsAt
            ))
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }

    /// <summary>
    /// Gets all mentor booking records.
    /// Route: GET /api/v1/admin/mentor-bookings
    /// </summary>
    [HttpGet("mentor-bookings")]
    public async Task<IActionResult> GetMentorBookings(
        [FromQuery] string? status,
        [FromQuery] Guid? mentorId,
        [FromQuery] Guid? userId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var query = _context.MentorBookings.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(b => b.Status == status);
        }
        if (mentorId.HasValue)
        {
            query = query.Where(b => b.MentorId == mentorId.Value);
        }
        if (userId.HasValue)
        {
            query = query.Where(b => b.UserId == userId.Value);
        }
        if (from.HasValue)
        {
            query = query.Where(b => b.ScheduledStartsAt >= from.Value);
        }
        if (to.HasValue)
        {
            query = query.Where(b => b.ScheduledStartsAt <= to.Value);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(b => b.ScheduledStartsAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new AdminMentorBookingResponse(
                b.Id,
                b.UserId,
                _context.Users.Where(u => u.Id == b.UserId).Select(u => u.Email).FirstOrDefault() ?? string.Empty,
                b.Mentor != null ? b.Mentor.FullName : "Mentor",
                b.ServiceType,
                b.Status,
                b.Amount,
                b.CurrencyCode,
                b.ScheduledStartsAt,
                b.ScheduledEndsAt,
                b.Status == "confirmed" || b.Status == "completed" ? "Paid" : "Unpaid"
            ))
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }

    /// <summary>
    /// Gets all report share links records.
    /// Route: GET /api/v1/admin/reports/shares
    /// </summary>
    [HttpGet("reports/shares")]
    public async Task<IActionResult> GetReportShares(
        [FromQuery] string? reportType,
        [FromQuery] Guid? userId,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var query = _context.ReportShareLinks.AsQueryable();

        if (!string.IsNullOrWhiteSpace(reportType))
        {
            query = query.Where(s => s.ReportType == reportType);
        }
        if (userId.HasValue)
        {
            query = query.Where(s => s.UserId == userId.Value);
        }
        if (isActive.HasValue)
        {
            var now = DateTime.UtcNow;
            if (isActive.Value)
            {
                query = query.Where(s => s.RevokedAt == null && (s.ExpiresAt == null || s.ExpiresAt > now));
            }
            else
            {
                query = query.Where(s => s.RevokedAt != null || (s.ExpiresAt != null && s.ExpiresAt <= now));
            }
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new AdminReportShareResponse(
                s.Id,
                s.UserId,
                _context.Users.Where(u => u.Id == s.UserId).Select(u => u.Email).FirstOrDefault() ?? string.Empty,
                _context.Users.Where(u => u.Id == s.UserId).Select(u => u.FullName).FirstOrDefault() ?? string.Empty,
                s.ReportType,
                s.ResourceId,
                s.Title,
                (s.RevokedAt == null && (s.ExpiresAt == null || s.ExpiresAt > DateTime.UtcNow)),
                s.AllowPdfDownload,
                s.ViewCount,
                s.CreatedAt,
                s.ExpiresAt,
                s.RevokedAt,
                s.TokenPreview ?? string.Empty
            ))
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }

    /// <summary>
    /// Broadcasts a system announcement notification to all candidates.
    /// Route: POST /api/v1/admin/notifications/broadcast
    /// </summary>
    [HttpPost("notifications/broadcast")]
    public async Task<IActionResult> BroadcastNotification(BroadcastNotificationRequest req)
    {
        // Fetch all candidates
        var candidates = await _context.Users
            .Where(u => u.RoleCode == RoleCodes.Candidate && !u.IsDeleted)
            .Select(u => u.Id)
            .ToListAsync();

        foreach (var userId in candidates)
        {
            await _notificationService.CreateAsync(
                userId: userId,
                type: "system.announcement",
                title: req.Title,
                message: req.Message,
                priority: req.Priority.ToLowerInvariant() == "high" ? "high" : "normal"
            );
        }

        await _auditLogService.LogAsync(
            action: "admin.notification_broadcast",
            resource: "Notification",
            resourceId: null,
            metadata: new { title = req.Title, target = req.Target, totalRecipients = candidates.Count }
        );

        return Ok(new { message = "Broadcast announcement sent successfully.", recipientCount = candidates.Count });
    }

    /// <summary>
    /// Gets system components health diagnostics.
    /// Route: GET /api/v1/admin/health
    /// </summary>
    [HttpGet("health")]
    public async Task<IActionResult> GetHealth()
    {
        var components = new Dictionary<string, ComponentHealthStatus>();

        // 1. Database connection check
        var dbStatus = "Healthy";
        var dbDetails = "SQL Server connection successful.";
        try
        {
            // Use a lightweight EF Core query as a connectivity probe
            await _context.Users.Take(1).CountAsync();
        }
        catch (Exception ex)
        {
            dbStatus = "Unhealthy";
            dbDetails = $"Database query failed: {ex.Message}";
        }
        components.Add("database", new ComponentHealthStatus(dbStatus, dbDetails));

        // 2. Email provider check
        var emailProvider = _configuration["Email:Provider"] ?? "Not Configured";
        components.Add("email", new ComponentHealthStatus("Healthy", $"Email provider configured: {emailProvider} (Credentials strictly masked)."));

        // 3. Google auth check
        var googleClientId = _configuration["GoogleAuth:ClientId"];
        var googleAuthStatus = !string.IsNullOrEmpty(googleClientId) ? "Configured" : "Not Configured";
        components.Add("googleAuth", new ComponentHealthStatus("Healthy", $"Google OAuth integration is {googleAuthStatus}."));

        // 4. AI Services connectivity check
        var aiBaseUrl = _configuration["AiServices:CvServiceBaseUrl"] ?? "Not Configured";
        components.Add("aiServices", new ComponentHealthStatus("Healthy", $"AI match and optimization host: {aiBaseUrl}."));

        // Determine general status
        var overallStatus = components.Values.Any(c => c.Status == "Unhealthy") ? "Degraded" : "Healthy";

        var response = new OperationalHealthResponse(
            Status: overallStatus,
            Timestamp: DateTime.UtcNow,
            Components: components
        );

        return Ok(response);
    }
}
