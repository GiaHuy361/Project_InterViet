namespace Interviet.Application.Common.Interfaces;

public record TokenResult(
    string AccessToken,
    DateTime AccessTokenExpiry,
    string RefreshToken,
    DateTime RefreshTokenExpiry
);

/// <summary>
/// JWT access token + refresh token generation.
/// Implementation lives in Infrastructure to keep crypto dependencies isolated.
/// </summary>
public interface IJwtTokenService
{
    /// <summary>Generates a signed JWT access token for the given user.</summary>
    string GenerateAccessToken(Guid userId, string email, IEnumerable<string> roles);

    /// <summary>Generates a cryptographically random refresh token value (raw, not hashed).</summary>
    string GenerateRefreshToken();

    /// <summary>Hashes a raw refresh token for storage.</summary>
    string HashRefreshToken(string rawToken);

    /// <summary>Configured access token lifetime in minutes (default 30).</summary>
    int AccessTokenMinutes { get; }

    /// <summary>Configured refresh token lifetime in days (default 30).</summary>
    int RefreshTokenDays { get; }
}
