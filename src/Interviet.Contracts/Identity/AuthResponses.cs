namespace Interviet.Contracts.Identity;

public sealed record AuthResponse(
    Guid UserId,
    string Email,
    string FullName,
    string Status,
    string AccessToken,
    DateTime AccessTokenExpiry,
    string RefreshToken,
    DateTime RefreshTokenExpiry,
    bool EmailVerified
);

public sealed record SessionDto(
    Guid SessionId,
    string? DeviceName,
    string? DeviceType,
    string? IpAddress,
    bool IsCurrent,
    DateTime LastSeenAt,
    DateTime CreatedAt
);

public sealed record UserProfileSummaryDto(
    Guid UserId,
    string Email,
    string FullName,
    string? AvatarUrl,
    string Status,
    bool EmailVerified
);
