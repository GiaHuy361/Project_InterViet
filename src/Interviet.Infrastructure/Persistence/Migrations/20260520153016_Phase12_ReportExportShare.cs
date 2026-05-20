using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Interviet.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase12_ReportExportShare : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FeedbackItemsJson",
                schema: "app",
                table: "InterviewReports",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ScoreBreakdownsJson",
                schema: "app",
                table: "InterviewReports",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ReportShareLinks",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReportType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ResourceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TokenHash = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    TokenPreview = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RevokedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AllowPdfDownload = table.Column<bool>(type: "bit", nullable: false),
                    ViewCount = table.Column<int>(type: "int", nullable: false),
                    LastViewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReportShareLinks", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ReportShareLinks_ExpiresAt",
                schema: "app",
                table: "ReportShareLinks",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_ReportShareLinks_IsActive",
                schema: "app",
                table: "ReportShareLinks",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_ReportShareLinks_TokenHash",
                schema: "app",
                table: "ReportShareLinks",
                column: "TokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReportShareLinks_UserId_ReportType_ResourceId",
                schema: "app",
                table: "ReportShareLinks",
                columns: new[] { "UserId", "ReportType", "ResourceId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReportShareLinks",
                schema: "app");

            migrationBuilder.DropColumn(
                name: "FeedbackItemsJson",
                schema: "app",
                table: "InterviewReports");

            migrationBuilder.DropColumn(
                name: "ScoreBreakdownsJson",
                schema: "app",
                table: "InterviewReports");
        }
    }
}
