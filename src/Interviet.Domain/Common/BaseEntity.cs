namespace Interviet.Domain.Common;

/// <summary>
/// Base entity with UUID primary key and optimistic concurrency support.
/// All tables in the app schema use UNIQUEIDENTIFIER PKs.
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
}

/// <summary>
/// Entities that track creation and last-update timestamps.
/// Maps to CreatedAt / UpdatedAt columns (DATETIME2(0)).
/// </summary>
public abstract class AuditableEntity : BaseEntity
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Entities that support soft-delete.
/// </summary>
public abstract class SoftDeletableEntity : AuditableEntity
{
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}
