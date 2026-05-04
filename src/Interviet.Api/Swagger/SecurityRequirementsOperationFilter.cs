using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Interviet.Api.Swagger;

/// <summary>
/// Removes the global Bearer security requirement from endpoints
/// that are decorated with [AllowAnonymous], so Swagger UI
/// does not show the lock icon for public endpoints.
/// </summary>
public sealed class SecurityRequirementsOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        // Check if the endpoint (action or controller) has [AllowAnonymous]
        var hasAllowAnonymous = context.MethodInfo
            .GetCustomAttributes(true)
            .OfType<AllowAnonymousAttribute>()
            .Any()
            ||
            (context.MethodInfo.DeclaringType?
                .GetCustomAttributes(true)
                .OfType<AllowAnonymousAttribute>()
                .Any() ?? false);

        if (hasAllowAnonymous)
        {
            // Remove the lock icon — no auth required
            operation.Security.Clear();
        }
    }
}
