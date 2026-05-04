using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Interviet.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase1_IdentityAndProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserRoles_Roles_RoleId",
                schema: "app",
                table: "UserRoles");

            migrationBuilder.DropIndex(
                name: "IX_UserSessions_UserId_LastSeenAt",
                schema: "app",
                table: "UserSessions");

            migrationBuilder.DropIndex(
                name: "IX_RefreshTokens_UserId_ExpiresAt",
                schema: "app",
                table: "RefreshTokens");

            migrationBuilder.DropIndex(
                name: "IX_PasswordResetTokens_UserId",
                schema: "app",
                table: "PasswordResetTokens");

            migrationBuilder.DropIndex(
                name: "IX_EmailVerificationTokens_UserId",
                schema: "app",
                table: "EmailVerificationTokens");

            migrationBuilder.DropColumn(
                name: "IsCurrent",
                schema: "app",
                table: "UserSessions");

            migrationBuilder.DropColumn(
                name: "EmailVerified",
                schema: "app",
                table: "Users");

            migrationBuilder.RenameColumn(
                name: "ConsumedAt",
                schema: "app",
                table: "PasswordResetTokens",
                newName: "UsedAt");

            migrationBuilder.RenameColumn(
                name: "VerifiedAt",
                schema: "app",
                table: "EmailVerificationTokens",
                newName: "UsedAt");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                schema: "app",
                table: "WorkExperiences",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AlterColumn<string>(
                name: "UserAgent",
                schema: "app",
                table: "UserSessions",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "IpAddress",
                schema: "app",
                table: "UserSessions",
                type: "nvarchar(45)",
                maxLength: 45,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(64)",
                oldMaxLength: 64,
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                schema: "app",
                table: "UserSessions",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AlterColumn<string>(
                name: "PasswordHash",
                schema: "app",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EmailVerifiedAt",
                schema: "app",
                table: "Users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsEmailVerified",
                schema: "app",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                schema: "app",
                table: "Skills",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                schema: "app",
                table: "Roles",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "UserAgent",
                schema: "app",
                table: "RefreshTokens",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "TokenHash",
                schema: "app",
                table: "RefreshTokens",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.AlterColumn<string>(
                name: "ReplacedByTokenHash",
                schema: "app",
                table: "RefreshTokens",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "IpAddress",
                schema: "app",
                table: "RefreshTokens",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(64)",
                oldMaxLength: 64,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "DeviceName",
                schema: "app",
                table: "RefreshTokens",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200,
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsRevoked",
                schema: "app",
                table: "RefreshTokens",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "UserSessionId",
                schema: "app",
                table: "RefreshTokens",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "TokenHash",
                schema: "app",
                table: "PasswordResetTokens",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.AddColumn<bool>(
                name: "IsUsed",
                schema: "app",
                table: "PasswordResetTokens",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                schema: "app",
                table: "ExternalLinks",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AlterColumn<string>(
                name: "TokenHash",
                schema: "app",
                table: "EmailVerificationTokens",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.AddColumn<bool>(
                name: "IsUsed",
                schema: "app",
                table: "EmailVerificationTokens",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                schema: "app",
                table: "Educations",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                schema: "app",
                table: "CandidateSkills",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateIndex(
                name: "IX_UserSessions_UserId_IsActive",
                schema: "app",
                table: "UserSessions",
                columns: new[] { "UserId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_Users_Status",
                schema: "app",
                table: "Users",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_TokenHash",
                schema: "app",
                table: "RefreshTokens",
                column: "TokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UserId_IsRevoked",
                schema: "app",
                table: "RefreshTokens",
                columns: new[] { "UserId", "IsRevoked" });

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UserSessionId",
                schema: "app",
                table: "RefreshTokens",
                column: "UserSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetTokens_TokenHash",
                schema: "app",
                table: "PasswordResetTokens",
                column: "TokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetTokens_UserId_IsUsed",
                schema: "app",
                table: "PasswordResetTokens",
                columns: new[] { "UserId", "IsUsed" });

            migrationBuilder.CreateIndex(
                name: "IX_EmailVerificationTokens_TokenHash",
                schema: "app",
                table: "EmailVerificationTokens",
                column: "TokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EmailVerificationTokens_UserId_IsUsed",
                schema: "app",
                table: "EmailVerificationTokens",
                columns: new[] { "UserId", "IsUsed" });

            migrationBuilder.AddForeignKey(
                name: "FK_UserRoles_Roles_RoleId",
                schema: "app",
                table: "UserRoles",
                column: "RoleId",
                principalSchema: "app",
                principalTable: "Roles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserRoles_Roles_RoleId",
                schema: "app",
                table: "UserRoles");

            migrationBuilder.DropIndex(
                name: "IX_UserSessions_UserId_IsActive",
                schema: "app",
                table: "UserSessions");

            migrationBuilder.DropIndex(
                name: "IX_Users_Status",
                schema: "app",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_RefreshTokens_TokenHash",
                schema: "app",
                table: "RefreshTokens");

            migrationBuilder.DropIndex(
                name: "IX_RefreshTokens_UserId_IsRevoked",
                schema: "app",
                table: "RefreshTokens");

            migrationBuilder.DropIndex(
                name: "IX_RefreshTokens_UserSessionId",
                schema: "app",
                table: "RefreshTokens");

            migrationBuilder.DropIndex(
                name: "IX_PasswordResetTokens_TokenHash",
                schema: "app",
                table: "PasswordResetTokens");

            migrationBuilder.DropIndex(
                name: "IX_PasswordResetTokens_UserId_IsUsed",
                schema: "app",
                table: "PasswordResetTokens");

            migrationBuilder.DropIndex(
                name: "IX_EmailVerificationTokens_TokenHash",
                schema: "app",
                table: "EmailVerificationTokens");

            migrationBuilder.DropIndex(
                name: "IX_EmailVerificationTokens_UserId_IsUsed",
                schema: "app",
                table: "EmailVerificationTokens");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                schema: "app",
                table: "WorkExperiences");

            migrationBuilder.DropColumn(
                name: "IsActive",
                schema: "app",
                table: "UserSessions");

            migrationBuilder.DropColumn(
                name: "EmailVerifiedAt",
                schema: "app",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsEmailVerified",
                schema: "app",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                schema: "app",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "IsRevoked",
                schema: "app",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "UserSessionId",
                schema: "app",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "IsUsed",
                schema: "app",
                table: "PasswordResetTokens");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                schema: "app",
                table: "ExternalLinks");

            migrationBuilder.DropColumn(
                name: "IsUsed",
                schema: "app",
                table: "EmailVerificationTokens");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                schema: "app",
                table: "Educations");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                schema: "app",
                table: "CandidateSkills");

            migrationBuilder.RenameColumn(
                name: "UsedAt",
                schema: "app",
                table: "PasswordResetTokens",
                newName: "ConsumedAt");

            migrationBuilder.RenameColumn(
                name: "UsedAt",
                schema: "app",
                table: "EmailVerificationTokens",
                newName: "VerifiedAt");

            migrationBuilder.AlterColumn<string>(
                name: "UserAgent",
                schema: "app",
                table: "UserSessions",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "IpAddress",
                schema: "app",
                table: "UserSessions",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(45)",
                oldMaxLength: 45,
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsCurrent",
                schema: "app",
                table: "UserSessions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<string>(
                name: "PasswordHash",
                schema: "app",
                table: "Users",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EmailVerified",
                schema: "app",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                schema: "app",
                table: "Roles",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "UserAgent",
                schema: "app",
                table: "RefreshTokens",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "TokenHash",
                schema: "app",
                table: "RefreshTokens",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(128)",
                oldMaxLength: 128);

            migrationBuilder.AlterColumn<string>(
                name: "ReplacedByTokenHash",
                schema: "app",
                table: "RefreshTokens",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "IpAddress",
                schema: "app",
                table: "RefreshTokens",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "DeviceName",
                schema: "app",
                table: "RefreshTokens",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "TokenHash",
                schema: "app",
                table: "PasswordResetTokens",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(128)",
                oldMaxLength: 128);

            migrationBuilder.AlterColumn<string>(
                name: "TokenHash",
                schema: "app",
                table: "EmailVerificationTokens",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(128)",
                oldMaxLength: 128);

            migrationBuilder.CreateIndex(
                name: "IX_UserSessions_UserId_LastSeenAt",
                schema: "app",
                table: "UserSessions",
                columns: new[] { "UserId", "LastSeenAt" });

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UserId_ExpiresAt",
                schema: "app",
                table: "RefreshTokens",
                columns: new[] { "UserId", "ExpiresAt" });

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetTokens_UserId",
                schema: "app",
                table: "PasswordResetTokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_EmailVerificationTokens_UserId",
                schema: "app",
                table: "EmailVerificationTokens",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_UserRoles_Roles_RoleId",
                schema: "app",
                table: "UserRoles",
                column: "RoleId",
                principalSchema: "app",
                principalTable: "Roles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
