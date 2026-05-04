namespace Interviet.Contracts.Identity;

public sealed record RegisterRequest(
    string FullName,
    string Email,
    string Password
);

public sealed record LoginRequest(
    string Email,
    string Password,
    string? DeviceName = null
);

public sealed record RefreshTokenRequest(
    string RefreshToken
);

public sealed record VerifyEmailRequest(
    string Token
);

public sealed record ResendVerificationEmailRequest(
    string Email
);

public sealed record ForgotPasswordRequest(
    string Email
);

public sealed record ResetPasswordRequest(
    string Token,
    string NewPassword
);

public sealed record GoogleLoginRequest(
    string IdToken,
    string? DeviceName = null
);
