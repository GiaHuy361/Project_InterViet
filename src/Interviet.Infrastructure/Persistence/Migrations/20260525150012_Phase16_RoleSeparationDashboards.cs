using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Interviet.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase16_RoleSeparationDashboards : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ExpertiseJson",
                schema: "app",
                table: "MentorProfiles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IndustriesJson",
                schema: "app",
                table: "MentorProfiles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsVerified",
                schema: "app",
                table: "MentorProfiles",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "LanguagesJson",
                schema: "app",
                table: "MentorProfiles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                schema: "app",
                table: "MentorProfiles",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MentorProfiles_UserId",
                schema: "app",
                table: "MentorProfiles",
                column: "UserId",
                unique: true,
                filter: "[UserId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MentorProfiles_UserId",
                schema: "app",
                table: "MentorProfiles");

            migrationBuilder.DropColumn(
                name: "ExpertiseJson",
                schema: "app",
                table: "MentorProfiles");

            migrationBuilder.DropColumn(
                name: "IndustriesJson",
                schema: "app",
                table: "MentorProfiles");

            migrationBuilder.DropColumn(
                name: "IsVerified",
                schema: "app",
                table: "MentorProfiles");

            migrationBuilder.DropColumn(
                name: "LanguagesJson",
                schema: "app",
                table: "MentorProfiles");

            migrationBuilder.DropColumn(
                name: "UserId",
                schema: "app",
                table: "MentorProfiles");
        }
    }
}
