using Google.Apis.Auth;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Common.Options;

namespace Interviet.Infrastructure.Services;

public sealed class GoogleAuthService : IGoogleAuthService
{
    private readonly GoogleAuthOptions _options;
    private readonly ILogger<GoogleAuthService> _logger;

    public GoogleAuthService(IOptions<GoogleAuthOptions> options, ILogger<GoogleAuthService> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task<GoogleUserPayload?> ValidateIdTokenAsync(string idToken)
    {
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings()
            {
                Audience = new[] { _options.ClientId }
            };
            
            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
            
            return new GoogleUserPayload(
                Email: payload.Email,
                Name: payload.Name,
                Picture: payload.Picture,
                Subject: payload.Subject,
                EmailVerified: payload.EmailVerified
            );
        }
        catch (InvalidJwtException ex)
        {
            _logger.LogWarning(ex, "Invalid Google ID token.");
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during Google ID token validation.");
            return null;
        }
    }
}
