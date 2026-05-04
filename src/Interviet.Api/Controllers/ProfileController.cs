using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Interviet.Application.Profile.Commands.Educations;
using Interviet.Application.Profile.Commands.ExternalLinks;
using Interviet.Application.Profile.Commands.Skills;
using Interviet.Application.Profile.Commands.UpdateProfile;
using Interviet.Application.Profile.Commands.WorkExperiences;
using Interviet.Application.Profile.Queries.GetProfile;
using Interviet.Contracts.Profile;

namespace Interviet.Api.Controllers;

/// <summary>
/// Candidate profile management endpoints.
/// Route: /api/v1/profile
/// All endpoints require authentication.
/// </summary>
[Route("api/v1/profile")]
[Authorize]
public sealed class ProfileController : ApiControllerBase
{
    private readonly IMediator _mediator;

    public ProfileController(IMediator mediator) => _mediator = mediator;

    // ── Profile ───────────────────────────────────────────────────────────

    /// <summary>Get the authenticated user's full candidate profile.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ProfileResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProfile(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetProfileQuery(), ct);
        return FromResult(result);
    }

    /// <summary>Update profile fields (PATCH semantics — only provided fields are updated).</summary>
    [HttpPatch]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateProfile(
        [FromBody] UpdateProfileRequest request,
        CancellationToken ct)
    {
        var cmd = new UpdateProfileCommand(
            request.FullName, request.PhoneNumber, request.Headline,
            request.Summary, request.DesiredRole, request.YearsOfExperience,
            request.CurrentLocation, request.PreferredLocation,
            request.SalaryExpectationMin, request.SalaryExpectationMax);
        var result = await _mediator.Send(cmd, ct);
        if (result.IsFailure) return FromResult(result);
        return NoContent();
    }

    // ── Skills ────────────────────────────────────────────────────────────

    /// <summary>Add a skill to the profile. Creates the skill in the catalog if new.</summary>
    [HttpPost("skills")]
    [ProducesResponseType(typeof(SkillDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> AddSkill([FromBody] AddSkillRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new AddSkillCommand(request.SkillName, request.ProficiencyLevel, request.YearsUsed, request.LastUsedYear), ct);
        if (result.IsFailure) return FromResult(result);
        return StatusCode(StatusCodes.Status201Created, result.Value);
    }

    /// <summary>Update an existing skill on the profile.</summary>
    [HttpPut("skills/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateSkill(Guid id, [FromBody] UpdateSkillRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new UpdateSkillCommand(id, request.ProficiencyLevel, request.YearsUsed, request.LastUsedYear), ct);
        if (result.IsFailure) return FromResult(result);
        return NoContent();
    }

    /// <summary>Remove a skill from the profile.</summary>
    [HttpDelete("skills/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteSkill(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new DeleteSkillCommand(id), ct);
        if (result.IsFailure) return FromResult(result);
        return NoContent();
    }

    // ── Educations ────────────────────────────────────────────────────────

    /// <summary>Add an education entry.</summary>
    [HttpPost("educations")]
    [ProducesResponseType(typeof(EducationDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> AddEducation([FromBody] AddEducationRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new AddEducationCommand(
            request.SchoolName, request.Degree, request.FieldOfStudy,
            request.StartDate, request.EndDate, request.Grade, request.Description), ct);
        if (result.IsFailure) return FromResult(result);
        return StatusCode(StatusCodes.Status201Created, result.Value);
    }

    /// <summary>Update an education entry.</summary>
    [HttpPut("educations/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateEducation(Guid id, [FromBody] UpdateEducationRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new UpdateEducationCommand(
            id, request.SchoolName, request.Degree, request.FieldOfStudy,
            request.StartDate, request.EndDate, request.Grade, request.Description), ct);
        if (result.IsFailure) return FromResult(result);
        return NoContent();
    }

    /// <summary>Delete an education entry.</summary>
    [HttpDelete("educations/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteEducation(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new DeleteEducationCommand(id), ct);
        if (result.IsFailure) return FromResult(result);
        return NoContent();
    }

    // ── Work Experiences ──────────────────────────────────────────────────

    /// <summary>Add a work experience entry.</summary>
    [HttpPost("experiences")]
    [ProducesResponseType(typeof(WorkExperienceDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> AddExperience([FromBody] AddWorkExperienceRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new AddWorkExperienceCommand(
            request.CompanyName, request.JobTitle, request.EmploymentType,
            request.StartDate, request.EndDate, request.IsCurrent,
            request.Description, request.MetricsSummary), ct);
        if (result.IsFailure) return FromResult(result);
        return StatusCode(StatusCodes.Status201Created, result.Value);
    }

    /// <summary>Update a work experience entry.</summary>
    [HttpPut("experiences/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateExperience(Guid id, [FromBody] UpdateWorkExperienceRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new UpdateWorkExperienceCommand(
            id, request.CompanyName, request.JobTitle, request.EmploymentType,
            request.StartDate, request.EndDate, request.IsCurrent,
            request.Description, request.MetricsSummary), ct);
        if (result.IsFailure) return FromResult(result);
        return NoContent();
    }

    /// <summary>Delete a work experience entry.</summary>
    [HttpDelete("experiences/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteExperience(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new DeleteWorkExperienceCommand(id), ct);
        if (result.IsFailure) return FromResult(result);
        return NoContent();
    }

    // ── External Links ────────────────────────────────────────────────────

    /// <summary>Add an external link (LinkedIn, GitHub, portfolio, etc.).</summary>
    [HttpPost("links")]
    [ProducesResponseType(typeof(ExternalLinkDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> AddLink([FromBody] AddExternalLinkRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new AddExternalLinkCommand(request.LinkType, request.Title, request.Url), ct);
        if (result.IsFailure) return FromResult(result);
        return StatusCode(StatusCodes.Status201Created, result.Value);
    }

    /// <summary>Update an external link.</summary>
    [HttpPut("links/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateLink(Guid id, [FromBody] UpdateExternalLinkRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new UpdateExternalLinkCommand(id, request.LinkType, request.Title, request.Url), ct);
        if (result.IsFailure) return FromResult(result);
        return NoContent();
    }

    /// <summary>Delete an external link.</summary>
    [HttpDelete("links/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteLink(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new DeleteExternalLinkCommand(id), ct);
        if (result.IsFailure) return FromResult(result);
        return NoContent();
    }
}
