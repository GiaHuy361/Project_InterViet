using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.JobDescriptions.Commands.CreateJobDescription;
using Interviet.Application.JobDescriptions.Commands.DeleteJobDescription;
using Interviet.Application.JobDescriptions.Commands.UpdateJobDescription;
using Interviet.Application.JobDescriptions.Queries.GetJobDescriptionById;
using Interviet.Application.JobDescriptions.Queries.GetMyJobDescriptions;
using Interviet.Contracts.Matching;

namespace Interviet.Api.Controllers;

/// <summary>
/// Job Description CRUD endpoints.
/// Route: /api/v1/job-descriptions
/// All endpoints require authentication.
/// </summary>
[Route("api/v1/job-descriptions")]
[Authorize]
public sealed class JobDescriptionsController : ApiControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public JobDescriptionsController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator    = mediator;
        _currentUser = currentUser;
    }

    /// <summary>Create a new Job Description.</summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create(
        [FromBody] CreateJobDescriptionRequest request,
        CancellationToken ct)
    {
        var command = new CreateJobDescriptionCommand(
            UserId:      _currentUser.UserId,
            Title:       request.Title,
            CompanyName: request.CompanyName,
            Location:    request.Location,
            SalaryText:  request.SalaryText,
            SourceUrl:   request.SourceUrl,
            RawText:     request.RawText,
            PostedAt:    request.PostedAt);

        var result = await _mediator.Send(command, ct);
        if (result.IsFailure) return FromResult(result);

        return StatusCode(StatusCodes.Status201Created, new
        {
            success = true,
            data    = result.Value,
            meta    = new { requestId = HttpContext.TraceIdentifier, timestamp = DateTime.UtcNow }
        });
    }

    /// <summary>List current user's Job Descriptions (paginated).</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyJobDescriptions(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetMyJobDescriptionsQuery(_currentUser.UserId, page, pageSize), ct);
        return FromResult(result);
    }

    /// <summary>Get a Job Description by ID.</summary>
    [HttpGet("{jobDescriptionId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetById(Guid jobDescriptionId, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new GetJobDescriptionByIdQuery(jobDescriptionId, _currentUser.UserId), ct);
        return FromResult(result);
    }

    /// <summary>Update a Job Description.</summary>
    [HttpPut("{jobDescriptionId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Update(
        Guid jobDescriptionId,
        [FromBody] UpdateJobDescriptionRequest request,
        CancellationToken ct)
    {
        var command = new UpdateJobDescriptionCommand(
            JobDescriptionId: jobDescriptionId,
            UserId:           _currentUser.UserId,
            Title:            request.Title,
            CompanyName:      request.CompanyName,
            Location:         request.Location,
            SalaryText:       request.SalaryText,
            SourceUrl:        request.SourceUrl,
            RawText:          request.RawText,
            PostedAt:         request.PostedAt);

        var result = await _mediator.Send(command, ct);
        return FromResult(result);
    }

    /// <summary>Soft-delete a Job Description.</summary>
    [HttpDelete("{jobDescriptionId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Delete(Guid jobDescriptionId, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new DeleteJobDescriptionCommand(jobDescriptionId, _currentUser.UserId), ct);
        if (result.IsFailure) return FromResult(result);
        return NoContent();
    }
}
