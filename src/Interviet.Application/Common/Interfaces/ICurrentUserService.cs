namespace Interviet.Application.Common.Interfaces;

/// <summary>
/// Provides identity information for the currently authenticated user.
/// Injected via HttpContext in web context; can be stubbed in tests.
/// </summary>
public interface ICurrentUserService
{
    Guid UserId { get; }
    string Email { get; }
    bool IsAuthenticated { get; }
    bool IsInRole(string roleCode);
}
