using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Interviet.Application.Common.Interfaces;

namespace Interviet.Infrastructure.Services;

/// <summary>
/// Reads the current user from the JWT claims in HttpContext.
/// Registered as Scoped — one instance per request.
/// </summary>
public sealed class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

    public Guid UserId
    {
        get
        {
            var value = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? User?.FindFirst("sub")?.Value;
            return Guid.TryParse(value, out var id) ? id : Guid.Empty;
        }
    }

    public string Email => User?.FindFirst(ClaimTypes.Email)?.Value
                        ?? User?.FindFirst("email")?.Value
                        ?? string.Empty;

    public bool IsInRole(string roleCode) =>
        User?.FindAll(ClaimTypes.Role).Any(c => c.Value == roleCode) ?? false;
}
