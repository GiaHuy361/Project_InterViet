using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Dashboard.Queries.GetDashboardSummary;
using Interviet.Application.Dashboard.Queries.GetActivityLog;
using Interviet.Application.Dashboard.Queries.GetUsageSummary;
using Interviet.Application.Dashboard.Queries.GetQuotaSnapshot;

namespace Interviet.Api.Controllers;

/// <summary>
/// Candidate Dashboard endpoints — summary, activity, usage and quota data.
/// </summary>
[Authorize]
public sealed class DashboardController : ApiControllerBase
{
    private readonly ISender _mediator;
    private readonly ICurrentUserService _currentUser;

    public DashboardController(ISender mediator, ICurrentUserService currentUser)
    {
        _mediator    = mediator;
        _currentUser = currentUser;
    }

    /// <summary>Returns the full dashboard summary for the current user.</summary>
    [HttpGet("summary")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetSummary(CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        var result = await _mediator.Send(new GetDashboardSummaryQuery(userId), ct);
        return FromResult(result);
    }

    /// <summary>Returns a paginated activity timeline for the current user.</summary>
    [HttpGet("activity")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetActivity(
        [FromQuery] int page     = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct     = default)
    {
        var userId = _currentUser.UserId;
        var result = await _mediator.Send(new GetActivityLogQuery(userId, page, pageSize), ct);
        return FromResult(result);
    }

    /// <summary>
    /// Returns daily usage breakdown for a date range.
    /// Defaults to the last 30 days. Maximum range is 90 days.
    /// </summary>
    [HttpGet("usage")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetUsage(
        [FromQuery] string? from = null,
        [FromQuery] string? to   = null,
        CancellationToken ct     = default)
    {
        var today   = DateOnly.FromDateTime(DateTime.UtcNow);
        var fromDate = DateOnly.TryParse(from, out var f) ? f : today.AddDays(-30);
        var toDate   = DateOnly.TryParse(to, out var t)  ? t : today;

        var userId = _currentUser.UserId;
        var result = await _mediator.Send(new GetUsageSummaryQuery(userId, fromDate, toDate), ct);
        return FromResult(result);
    }

    /// <summary>Returns the current quota counter snapshot for the current user.</summary>
    [HttpGet("quota")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetQuota(CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        var result = await _mediator.Send(new GetQuotaSnapshotQuery(userId), ct);
        return FromResult(result);
    }
}
