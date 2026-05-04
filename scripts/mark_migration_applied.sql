-- =============================================================================
-- INTER-VIET: Mark Phase 1 migration as applied without running DDL.
--
-- Chạy script này nếu database đã được bootstrap bằng SQL script TRƯỚC đó
-- và bạn không muốn EF Core chạy lại toàn bộ ALTER TABLE từ Phase 1.
--
-- ⚠️  Nếu database chưa có tables, hãy dùng "dotnet ef database update" thay thế.
-- =============================================================================

-- Tạo schema app nếu chưa có
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'app')
BEGIN
    EXEC ('CREATE SCHEMA [app]')
    PRINT 'Schema [app] created.'
END
GO

-- Tạo bảng migration history nếu chưa có
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = 'app' AND TABLE_NAME = '__EFMigrationsHistory'
)
BEGIN
    CREATE TABLE [app].[__EFMigrationsHistory] (
        [MigrationId]    NVARCHAR(150) NOT NULL CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY,
        [ProductVersion] NVARCHAR(32)  NOT NULL
    )
    PRINT 'Migration history table created.'
END
GO

-- Mark InitialCreate (Phase 0) as applied
IF NOT EXISTS (SELECT 1 FROM [app].[__EFMigrationsHistory] WHERE [MigrationId] LIKE '%_InitialCreate')
BEGIN
    INSERT INTO [app].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES ('20260423102050_InitialCreate', '8.0.14')
    PRINT 'Migration InitialCreate marked as applied.'
END
GO

-- Mark Phase1_IdentityAndProfile as applied
-- NOTE: Before running this, ensure your database schema already reflects Phase 1 changes:
--   - Users.IsEmailVerified (renamed from EmailVerified)
--   - Users.EmailVerifiedAt (new column)
--   - RefreshTokens.IsRevoked (bool column, was computed)
--   - RefreshTokens.UserSessionId (new FK column)
--   - UserSessions.IsActive (renamed from IsCurrent)
--   - EmailVerificationTokens.IsUsed, UsedAt (new columns)
--   - PasswordResetTokens.IsUsed, UsedAt (new columns)
--   - *Skill/Education/WorkExperience/ExternalLink: UpdatedAt columns added
IF NOT EXISTS (SELECT 1 FROM [app].[__EFMigrationsHistory] WHERE [MigrationId] LIKE '%Phase1_IdentityAndProfile')
BEGIN
    -- Replace timestamp with actual migration ID from Persistence/Migrations folder
    INSERT INTO [app].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES ('20260423104502_Phase1_IdentityAndProfile', '8.0.14')
    PRINT 'Migration Phase1_IdentityAndProfile marked as applied.'
END
ELSE
BEGIN
    PRINT 'Migration Phase1_IdentityAndProfile already marked as applied.'
END
GO

SELECT * FROM [app].[__EFMigrationsHistory]
GO
