using Interviet.Domain.Common;

namespace Interviet.Domain.Identity;

// ──────────────────────────────────────────────
// Users
// ──────────────────────────────────────────────
public class User : AuditableEntity
{
    public string Email { get; set; } = string.Empty;
    public string NormalizedEmail { get; set; } = string.Empty;
    public string? PasswordHash { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? AvatarUrl { get; set; }

    /// <summary>UserState: visitor | free | trial | premium | cancelled | expired | suspended</summary>
    public string Status { get; set; } = UserStatus.Free;

    public string? CurrentPlanCode { get; set; }
    public bool IsEmailVerified { get; set; }
    public DateTime? EmailVerifiedAt { get; set; }
    public DateTime? LockedUntil { get; set; }
    public int FailedLoginCount { get; set; }
    public DateTime? LastLoginAt { get; set; }

    /// <summary>Set once when the user activates a trial. Null means trial never used.</summary>
    public DateTime? TrialUsedAt { get; set; }

    public string? TimeZone { get; set; }
    public string? Locale { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }

    /// <summary>EF Core optimistic concurrency token (ROWVERSION).</summary>
    public byte[] RowVersion { get; set; } = [];

    /// <summary>System role: candidate | admin | mentor | support</summary>
    public string RoleCode { get; set; } = RoleCodes.Candidate;

    // Navigation
    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
    public ICollection<UserSession> Sessions { get; set; } = [];
}

public static class UserStatus
{
    public const string Visitor = "visitor";
    public const string Free = "free";
    public const string Trial = "trial";
    public const string Premium = "premium";
    public const string Cancelled = "cancelled";
    public const string Expired = "expired";
    public const string Suspended = "suspended";
}

// ──────────────────────────────────────────────
// Roles
// ──────────────────────────────────────────────
public class Role : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public static class RoleCodes
{
    public const string Candidate = "candidate";
    public const string Admin = "admin";
    public const string Mentor = "mentor";
    public const string Support = "support";
}

// ──────────────────────────────────────────────
// UserRoles (join table)
// ──────────────────────────────────────────────
public class UserRole
{
    public Guid UserId { get; set; }
    public Guid RoleId { get; set; }
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public Guid? AssignedBy { get; set; }

    public User User { get; set; } = null!;
    public Role Role { get; set; } = null!;
}

// ──────────────────────────────────────────────
// RefreshTokens
// ──────────────────────────────────────────────
public class RefreshToken : BaseEntity
{
    public Guid UserId { get; set; }

    /// <summary>FK to the session this token was issued for.</summary>
    public Guid? UserSessionId { get; set; }

    public string TokenHash { get; set; } = string.Empty;
    public string? DeviceName { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime ExpiresAt { get; set; }

    /// <summary>Stored separately so IsRevoked is a real column (for EF query filtering).</summary>
    public bool IsRevoked { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? ReplacedByTokenHash { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsActive => !IsRevoked && !IsExpired;

    public User User { get; set; } = null!;
}

// ──────────────────────────────────────────────
// UserSessions
// ──────────────────────────────────────────────
public class UserSession : BaseEntity
{
    public Guid UserId { get; set; }
    public string? DeviceName { get; set; }
    public string? DeviceType { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }

    /// <summary>True when session is active (not revoked/logged out).</summary>
    public bool IsActive { get; set; } = true;
    public DateTime LastSeenAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

// ──────────────────────────────────────────────
// EmailVerificationTokens
// ──────────────────────────────────────────────
public class EmailVerificationToken : BaseEntity
{
    public Guid UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; }
    public DateTime? UsedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

// ──────────────────────────────────────────────
// PasswordResetTokens
// ──────────────────────────────────────────────
public class PasswordResetToken : BaseEntity
{
    public Guid UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; }
    public DateTime? UsedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
