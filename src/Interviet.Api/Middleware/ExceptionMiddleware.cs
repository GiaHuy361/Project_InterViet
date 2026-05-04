using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace Interviet.Api.Middleware;

/// <summary>
/// Global exception handler — converts unhandled exceptions to RFC 7807 ProblemDetails.
/// Prevents stack traces from leaking to clients in production.
/// </summary>
public sealed class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionMiddleware(
        RequestDelegate next,
        ILogger<ExceptionMiddleware> logger,
        IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Unhandled exception for {Method} {Path}. TraceId={TraceId}",
                context.Request.Method,
                context.Request.Path,
                context.TraceIdentifier);

            await WriteProblemDetailsAsync(context, ex);
        }
    }

    private async Task WriteProblemDetailsAsync(HttpContext context, Exception ex)
    {
        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

        var problem = new ProblemDetails
        {
            Type = "https://api.interviet.vn/errors/internal-error",
            Title = "An unexpected error occurred.",
            Status = (int)HttpStatusCode.InternalServerError,
            Instance = context.Request.Path,
            Extensions =
            {
                ["traceId"] = context.TraceIdentifier,
                ["requestId"] = context.Request.Headers["X-Request-Id"].FirstOrDefault() ?? string.Empty
            }
        };

        if (_env.IsDevelopment())
        {
            problem.Detail = ex.Message;
            problem.Extensions["stackTrace"] = ex.StackTrace;
        }
        else
        {
            problem.Detail = "An internal error occurred. Please try again later.";
        }

        var json = JsonSerializer.Serialize(problem, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
