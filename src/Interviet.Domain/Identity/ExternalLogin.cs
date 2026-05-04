using Interviet.Domain.Common;

namespace Interviet.Domain.Identity;

/// <summary>
/// Maps a third-party login provider (e.g. Google) to an internal User.
/// </summary>
public class ExternalLogin : AuditableEntity
{
    public Guid UserId { get; set; }
    
    /// <summary>E.g. "Google", "Facebook"</summary>
    public string Provider { get; set; } = string.Empty;
    
    /// <summary>The unique ID from the provider (e.g. Google's Subject ID)</summary>
    public string ProviderKey { get; set; } = string.Empty;
    
    public string? ProviderDisplayName { get; set; }
    public string Email { get; set; } = string.Empty;
    public DateTime? LastUsedAt { get; set; }

    public User User { get; set; } = null!;
}
