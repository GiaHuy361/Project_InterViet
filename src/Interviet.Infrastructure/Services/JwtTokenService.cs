using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Interviet.Application.Common.Interfaces;

namespace Interviet.Infrastructure.Services;

/// <summary>
/// Generates JWT access tokens and manages refresh token lifecycle.
/// Configuration keys: Jwt:SigningKey, Jwt:Issuer, Jwt:Audience, Jwt:AccessTokenMinutes
/// </summary>
public sealed class JwtTokenService : IJwtTokenService
{
    private readonly string _signingKey;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int _accessTokenMinutes;
    private readonly int _refreshTokenDays;

    public int AccessTokenMinutes => _accessTokenMinutes;
    public int RefreshTokenDays => _refreshTokenDays;

    public JwtTokenService(IConfiguration configuration)
    {
        var jwt = configuration.GetSection("Jwt");
        _signingKey = jwt["SigningKey"]
            ?? throw new InvalidOperationException("Jwt:SigningKey is not configured.");
        _issuer = jwt["Issuer"] ?? "https://api.interviet.vn";
        _audience = jwt["Audience"] ?? "https://app.interviet.vn";
        _accessTokenMinutes = int.TryParse(jwt["AccessTokenMinutes"], out var m) ? m : 30;
        _refreshTokenDays = int.TryParse(jwt["RefreshTokenDays"], out var d) ? d : 30;
    }

    public string GenerateAccessToken(Guid userId, string email, IEnumerable<string> roles)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_signingKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(JwtRegisteredClaimNames.Email, email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.Iat,
                DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(),
                ClaimValueTypes.Integer64)
        };

        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_accessTokenMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        // 64 random bytes → 128-char hex string
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    public string HashRefreshToken(string rawToken)
    {
        var bytes = Encoding.UTF8.GetBytes(rawToken);
        var hash = SHA256.HashData(bytes);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
