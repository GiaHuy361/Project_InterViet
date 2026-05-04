namespace Interviet.Api.Middleware;

/// <summary>
/// Adds X-Correlation-Id header to every response.
/// Uses X-Request-Id from client if provided, otherwise generates a new one.
/// The correlation ID is stored in the ILogger scope for structured logging.
/// </summary>
public sealed class CorrelationIdMiddleware
{
    private const string CorrelationIdHeader = "X-Correlation-Id";
    private const string RequestIdHeader = "X-Request-Id";

    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ILogger<CorrelationIdMiddleware> logger)
    {
        var correlationId = context.Request.Headers[RequestIdHeader].FirstOrDefault()
                         ?? context.Request.Headers[CorrelationIdHeader].FirstOrDefault()
                         ?? Guid.NewGuid().ToString("N");

        context.Response.OnStarting(() =>
        {
            context.Response.Headers[CorrelationIdHeader] = correlationId;
            return Task.CompletedTask;
        });

        using (logger.BeginScope(new Dictionary<string, object>
        {
            ["CorrelationId"] = correlationId,
            ["RequestPath"] = context.Request.Path.ToString()
        }))
        {
            await _next(context);
        }
    }
}
