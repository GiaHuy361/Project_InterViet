using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Resumes.Commands.DeleteResume;
using Interviet.Application.Resumes.Commands.ReprocessResume;
using Interviet.Application.Resumes.Commands.SetActiveResume;
using Interviet.Application.Resumes.Commands.UploadResume;
using Interviet.Application.Resumes.Queries.DownloadResume;
using Interviet.Application.Resumes.Queries.GetActiveResume;
using Interviet.Application.Resumes.Queries.GetMyResumes;
using Interviet.Application.Resumes.Queries.GetResumeById;
using Interviet.Application.Resumes.Queries.GetResumeProcessingJobs;

namespace Interviet.Api.Controllers;

/// <summary>Form-data request model for CV upload. Swashbuckle renders file picker correctly when IFormFile is a property.</summary>
public sealed class UploadResumeFormRequest
{
    public IFormFile File { get; init; } = default!;
    public string? Title { get; init; }
}

/// <summary>
/// Resume management endpoints.
/// Route: /api/v1/resumes
/// All endpoints require authentication.
/// </summary>
[Route("api/v1/resumes")]
[Authorize]
public sealed class ResumesController : ApiControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public ResumesController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator    = mediator;
        _currentUser = currentUser;
    }

    /// <summary>Upload a new CV (PDF, DOC, DOCX, JPG, PNG). Auto-sets as active.</summary>
    [HttpPost]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Upload(
        [FromForm] UploadResumeFormRequest request,
        CancellationToken ct)
    {
        if (request.File is null || request.File.Length == 0)
            return BadRequest(new { detail = "File không được để trống." });

        await using var stream = request.File.OpenReadStream();
        var command = new UploadResumeCommand(
            FileStream:       stream,
            OriginalFileName: request.File.FileName,
            ContentType:      request.File.ContentType,
            FileSizeBytes:    request.File.Length,
            Title:            request.Title,
            UserId:           _currentUser.UserId);

        var result = await _mediator.Send(command, ct);
        if (result.IsFailure) return FromResult(result);

        return StatusCode(StatusCodes.Status201Created, new
        {
            success = true,
            data    = result.Value,
            meta    = new { requestId = HttpContext.TraceIdentifier, timestamp = DateTime.UtcNow }
        });
    }

    /// <summary>List current user's resumes (paginated).</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyResumes(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? status = null,
        [FromQuery] bool? isActive = null,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetMyResumesQuery(_currentUser.UserId, page, pageSize, status, isActive), ct);
        return FromResult(result);
    }

    /// <summary>Get active resume of current user.</summary>
    [HttpGet("active")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetActive(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetActiveResumeQuery(_currentUser.UserId), ct);
        return FromResult(result);
    }

    /// <summary>Get resume detail including parse status and parsed data.</summary>
    [HttpGet("{resumeId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetById(Guid resumeId, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetResumeByIdQuery(resumeId, _currentUser.UserId), ct);
        return FromResult(result);
    }

    /// <summary>Set a resume as the active one. Deactivates all others.</summary>
    [HttpPatch("{resumeId:guid}/active")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> SetActive(Guid resumeId, CancellationToken ct)
    {
        var result = await _mediator.Send(new SetActiveResumeCommand(resumeId, _currentUser.UserId), ct);
        if (result.IsFailure) return FromResult(result);
        return NoContent();
    }

    /// <summary>Soft-delete a resume. Does not auto-activate another.</summary>
    [HttpDelete("{resumeId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Delete(Guid resumeId, CancellationToken ct)
    {
        var result = await _mediator.Send(new DeleteResumeCommand(resumeId, _currentUser.UserId), ct);
        if (result.IsFailure) return FromResult(result);
        return NoContent();
    }

    /// <summary>Trigger re-parsing of a resume via the Python CV Service.</summary>
    [HttpPost("{resumeId:guid}/reprocess")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Reprocess(Guid resumeId, CancellationToken ct)
    {
        var result = await _mediator.Send(new ReprocessResumeCommand(resumeId, _currentUser.UserId), ct);
        return FromResult(result);
    }

    /// <summary>Get parse job history for a resume.</summary>
    [HttpGet("{resumeId:guid}/processing-jobs")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProcessingJobs(Guid resumeId, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetResumeProcessingJobsQuery(resumeId, _currentUser.UserId), ct);
        return FromResult(result);
    }

    /// <summary>Download the active version of a resume file.</summary>
    [HttpGet("{resumeId:guid}/download")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Download(Guid resumeId, CancellationToken ct)
    {
        var result = await _mediator.Send(new DownloadResumeQuery(resumeId, _currentUser.UserId), ct);
        if (result.IsFailure) return FromResult(result);

        var r = result.Value;
        return File(r.FileStream, r.ContentType, r.FileName);
    }
}
