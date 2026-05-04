using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Interviet.Api.Controllers;

/// <summary>
/// Health check endpoints — required for deployment readiness probes.
/// GET /api/v1/health         → simple liveness ping
/// GET /api/v1/health/details → detailed readiness (DB, Redis, Storage)
/// </summary>
[AllowAnonymous]
public sealed class HealthController : ApiControllerBase
{
    private readonly HealthCheckService _healthCheckService;

    public HealthController(HealthCheckService healthCheckService)
    {
        _healthCheckService = healthCheckService;
    }

    /// <summary>Simple liveness check — returns 200 if the process is running.</summary>
    [HttpGet]
    [Route("/api/v1/health")]
    public IActionResult Liveness() =>
        Ok(new { status = "Healthy", timestamp = DateTime.UtcNow });

    /// <summary>Readiness check — runs all registered health checks and returns status.</summary>
    [HttpGet]
    [Route("/api/v1/health/details")]
    public async Task<IActionResult> Readiness(CancellationToken ct)
    {
        var report = await _healthCheckService.CheckHealthAsync(ct);

        var result = new
        {
            status = report.Status.ToString(),
            totalDurationMs = report.TotalDuration.TotalMilliseconds,
            entries = report.Entries.ToDictionary(
                kvp => kvp.Key,
                kvp => new
                {
                    status = kvp.Value.Status.ToString(),
                    durationMs = kvp.Value.Duration.TotalMilliseconds,
                    description = kvp.Value.Description,
                    error = kvp.Value.Exception?.Message
                })
        };

        return report.Status == HealthStatus.Healthy
            ? Ok(result)
            : StatusCode(503, result);
    }
}
