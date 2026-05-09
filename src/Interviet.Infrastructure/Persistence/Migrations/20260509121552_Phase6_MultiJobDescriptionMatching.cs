using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Interviet.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase6_MultiJobDescriptionMatching : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                schema: "app",
                table: "MatchTargets",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ErrorCode",
                schema: "app",
                table: "MatchTargets",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                schema: "app",
                table: "MatchTargets",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompletedAt",
                schema: "app",
                table: "MatchTargets");

            migrationBuilder.DropColumn(
                name: "ErrorCode",
                schema: "app",
                table: "MatchTargets");

            migrationBuilder.DropColumn(
                name: "Status",
                schema: "app",
                table: "MatchTargets");
        }
    }
}
