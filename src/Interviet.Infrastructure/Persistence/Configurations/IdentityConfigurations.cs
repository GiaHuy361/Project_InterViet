using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Interviet.Domain.Identity;

namespace Interviet.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> b)
    {
        b.ToTable("Users");
        b.HasKey(x => x.Id);
        b.Property(x => x.Email).HasMaxLength(320).IsRequired();
        b.Property(x => x.NormalizedEmail).HasMaxLength(320).IsRequired();
        b.Property(x => x.FullName).HasMaxLength(200).IsRequired();
        b.Property(x => x.PhoneNumber).HasMaxLength(30);
        b.Property(x => x.AvatarUrl).HasMaxLength(500);
        b.Property(x => x.Status).HasMaxLength(30).IsRequired().HasDefaultValue("free");
        b.Property(x => x.CurrentPlanCode).HasMaxLength(50);
        b.Property(x => x.IsEmailVerified).HasDefaultValue(false);
        b.Property(x => x.TimeZone).HasMaxLength(100);
        b.Property(x => x.Locale).HasMaxLength(20);
        b.Property(x => x.RowVersion).IsRowVersion();
        b.Property(x => x.RoleCode).HasMaxLength(50).IsRequired().HasDefaultValue("candidate");
        b.HasIndex(x => x.RoleCode);
        b.HasIndex(x => x.NormalizedEmail).IsUnique();
        b.HasIndex(x => x.Status);
    }
}

public class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> b)
    {
        b.ToTable("Roles");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).HasMaxLength(100).IsRequired();
        b.Property(x => x.Code).HasMaxLength(50).IsRequired();
        b.HasIndex(x => x.Code).IsUnique();

        // Seed roles — lookup only; auth logic uses User.RoleCode
        // IDs must match Phase1_SeedRoles migration exactly:
        //   111=candidate, 222=employer→mentor(repurposed), 333=admin, 444=support(new)
        b.HasData(
            new Role { Id = Guid.Parse("11111111-1111-1111-1111-111111111111"), Code = "candidate", Name = "Candidate",     CreatedAt = DateTime.SpecifyKind(new DateTime(2024, 1, 1), DateTimeKind.Utc) },
            new Role { Id = Guid.Parse("22222222-2222-2222-2222-222222222222"), Code = "mentor",    Name = "Mentor",        CreatedAt = DateTime.SpecifyKind(new DateTime(2024, 1, 1), DateTimeKind.Utc) },
            new Role { Id = Guid.Parse("33333333-3333-3333-3333-333333333333"), Code = "admin",     Name = "Administrator", CreatedAt = DateTime.SpecifyKind(new DateTime(2024, 1, 1), DateTimeKind.Utc) },
            new Role { Id = Guid.Parse("44444444-4444-4444-4444-444444444444"), Code = "support",   Name = "Support",       CreatedAt = DateTime.SpecifyKind(new DateTime(2024, 1, 1), DateTimeKind.Utc) }
        );
    }
}

/// <summary>
/// UserRoles join table — kept in EF model ONLY so that migration can drop the table cleanly.
/// Business logic no longer uses many-to-many; User.RoleCode is the single source of truth.
/// </summary>
public class UserRoleConfiguration : IEntityTypeConfiguration<UserRole>
{
    public void Configure(EntityTypeBuilder<UserRole> b)
    {
        b.ToTable("UserRoles");
        b.HasKey(x => new { x.UserId, x.RoleId });
        // No navigation on User side (removed). Keep Role nav for FK constraint.
        b.HasOne(x => x.Role).WithMany().HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> b)
    {
        b.ToTable("RefreshTokens");
        b.HasKey(x => x.Id);
        b.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();
        b.Property(x => x.IsRevoked).HasDefaultValue(false);
        b.HasIndex(x => x.TokenHash).IsUnique();
        b.HasIndex(x => new { x.UserId, x.IsRevoked });
        b.HasOne(x => x.User).WithMany(u => u.RefreshTokens).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        // Optional FK to session — no navigation back to avoid circular includes
        b.HasIndex(x => x.UserSessionId);
    }
}

public class UserSessionConfiguration : IEntityTypeConfiguration<UserSession>
{
    public void Configure(EntityTypeBuilder<UserSession> b)
    {
        b.ToTable("UserSessions");
        b.HasKey(x => x.Id);
        b.Property(x => x.DeviceName).HasMaxLength(200);
        b.Property(x => x.DeviceType).HasMaxLength(50);
        b.Property(x => x.IpAddress).HasMaxLength(45);
        b.Property(x => x.IsActive).HasDefaultValue(true);
        b.HasIndex(x => new { x.UserId, x.IsActive });
        b.HasOne(x => x.User).WithMany(u => u.Sessions).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class EmailVerificationTokenConfiguration : IEntityTypeConfiguration<EmailVerificationToken>
{
    public void Configure(EntityTypeBuilder<EmailVerificationToken> b)
    {
        b.ToTable("EmailVerificationTokens");
        b.HasKey(x => x.Id);
        b.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();
        b.Property(x => x.IsUsed).HasDefaultValue(false);
        b.HasIndex(x => x.TokenHash).IsUnique();
        b.HasIndex(x => new { x.UserId, x.IsUsed });
        b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class PasswordResetTokenConfiguration : IEntityTypeConfiguration<PasswordResetToken>
{
    public void Configure(EntityTypeBuilder<PasswordResetToken> b)
    {
        b.ToTable("PasswordResetTokens");
        b.HasKey(x => x.Id);
        b.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();
        b.Property(x => x.IsUsed).HasDefaultValue(false);
        b.HasIndex(x => x.TokenHash).IsUnique();
        b.HasIndex(x => new { x.UserId, x.IsUsed });
        b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class ExternalLoginConfiguration : IEntityTypeConfiguration<ExternalLogin>
{
    public void Configure(EntityTypeBuilder<ExternalLogin> b)
    {
        b.ToTable("ExternalLogins");
        b.HasKey(x => x.Id);
        b.Property(x => x.Provider).HasMaxLength(50).IsRequired();
        b.Property(x => x.ProviderKey).HasMaxLength(200).IsRequired();
        b.Property(x => x.ProviderDisplayName).HasMaxLength(100);
        b.Property(x => x.Email).HasMaxLength(320).IsRequired();
        
        b.HasIndex(x => new { x.Provider, x.ProviderKey }).IsUnique();
        b.HasIndex(x => new { x.UserId, x.Provider }).IsUnique(); // One Google account per User max
        
        b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}
