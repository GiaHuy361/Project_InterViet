using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Interviet.Application.Identity.Commands.ForgotPassword;
using Interviet.Application.Identity.Commands.Login;
using Interviet.Application.Identity.Commands.Logout;
using Interviet.Application.Identity.Commands.RefreshToken;
using Interviet.Application.Identity.Commands.Register;
using Interviet.Application.Identity.Commands.ResetPassword;
using Interviet.Application.Identity.Commands.RevokeSession;
using Interviet.Application.Identity.Commands.VerifyEmail;
using Interviet.Application.Identity.Queries.GetSessions;
using Interviet.Contracts.Identity;

namespace Interviet.Api.Controllers;

/// <summary>
/// Authentication and session management endpoints.
/// Route: /api/v1/auth
/// </summary>
[Route("api/v1/auth")]
public sealed class AuthController : ApiControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator) => _mediator = mediator;

    /// <summary>Register a new candidate account.</summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register(
        [FromBody] RegisterRequest request,
        CancellationToken ct)
    {
        var command = new RegisterCommand(request.FullName, request.Email, request.Password);
        var result = await _mediator.Send(command, ct);
        if (result.IsFailure) return FromResult(result);

        return StatusCode(StatusCodes.Status201Created, new
        {
            success = true,
            data = result.Value,
            meta = new { requestId = HttpContext.TraceIdentifier, timestamp = DateTime.UtcNow }
        });
    }

    /// <summary>Login with email and password.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request,
        CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = HttpContext.Request.Headers.UserAgent.ToString();
        var command = new LoginCommand(request.Email, request.Password, request.DeviceName, ip, ua);
        var result = await _mediator.Send(command, ct);
        return FromResult(result);
    }

    /// <summary>Refresh access token using a valid refresh token.</summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh(
        [FromBody] RefreshTokenRequest request,
        CancellationToken ct)
    {
        var result = await _mediator.Send(new RefreshTokenCommand(request.RefreshToken), ct);
        return FromResult(result);
    }

    /// <summary>Logout and revoke the provided refresh token.</summary>
    [HttpPost("logout")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(
        [FromBody] RefreshTokenRequest request,
        CancellationToken ct)
    {
        await _mediator.Send(new LogoutCommand(request.RefreshToken), ct);
        return NoContent();
    }

    /// <summary>Verify email address using the token sent to the user's inbox.</summary>
    [HttpPost("verify-email")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyEmail(
        [FromBody] VerifyEmailRequest request,
        CancellationToken ct)
    {
        var result = await _mediator.Send(new VerifyEmailCommand(request.Token), ct);
        if (result.IsFailure) return FromResult(result);
        return NoContent();
    }

    /// <summary>Resend the verification email to the user.</summary>
    [HttpPost("resend-verification-email")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResendVerificationEmail(
        [FromBody] ResendVerificationEmailRequest request,
        CancellationToken ct)
    {
        var result = await _mediator.Send(new Interviet.Application.Identity.Commands.VerifyEmail.ResendVerificationEmailCommand(request.Email), ct);
        if (result.IsFailure) return FromResult(result);
        return Ok(new
        {
            success = true,
            message = "If your account exists and is unverified, a new verification email has been sent.",
            meta = new { requestId = HttpContext.TraceIdentifier, timestamp = DateTime.UtcNow }
        });
    }

    /// <summary>Send password reset email. Always returns 200 to prevent email enumeration.</summary>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordRequest request,
        CancellationToken ct)
    {
        await _mediator.Send(new ForgotPasswordCommand(request.Email), ct);
        return Ok(new
        {
            success = true,
            message = "If an account exists, a reset email has been sent.",
            meta = new { requestId = HttpContext.TraceIdentifier, timestamp = DateTime.UtcNow }
        });
    }

    /// <summary>Reset password using the token received by email.</summary>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword(
        [FromBody] ResetPasswordRequest request,
        CancellationToken ct)
    {
        var result = await _mediator.Send(new ResetPasswordCommand(request.Token, request.NewPassword), ct);
        if (result.IsFailure) return FromResult(result);
        return NoContent();
    }

    /// <summary>Authenticate with a Google ID token.</summary>
    [HttpPost("google-login")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request, CancellationToken ct)
    {
        var command = new Interviet.Application.Identity.Commands.GoogleLogin.GoogleLoginCommand(request.IdToken, request.DeviceName);
        var result = await _mediator.Send(command, ct);
        return FromResult(result);
    }

    /// <summary>Get active sessions for the authenticated user.</summary>
    [HttpGet("sessions")]
    [Authorize]
    [ProducesResponseType(typeof(IReadOnlyList<SessionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSessions(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetSessionsQuery(), ct);
        return FromResult(result);
    }

    /// <summary>Revoke a session by ID. Only the owner can revoke their own sessions.</summary>
    [HttpDelete("sessions/{id:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RevokeSession(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new RevokeSessionCommand(id), ct);
        if (result.IsFailure) return FromResult(result);
        return NoContent();
    }

}
