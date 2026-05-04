namespace Interviet.Application.Common.Interfaces;

public record GoogleUserPayload(
    string Email,
    string Name,
    string Picture,
    string Subject,
    bool EmailVerified
);

public interface IGoogleAuthService
{
    Task<GoogleUserPayload?> ValidateIdTokenAsync(string idToken);
}
