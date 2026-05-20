using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Interviet.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase14_AdminSupportOperation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastMessageAt",
                schema: "app",
                table: "SupportTickets",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsInternalNote",
                schema: "app",
                table: "SupportTicketMessages",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ActorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ActorEmail = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ActorRole = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Action = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Resource = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ResourceId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    MetadataJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IpAddress = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    UserAgent = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_ActorId_CreatedAt",
                schema: "app",
                table: "AuditLogs",
                columns: new[] { "ActorId", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditLogs",
                schema: "app");

            migrationBuilder.DropColumn(
                name: "LastMessageAt",
                schema: "app",
                table: "SupportTickets");

            migrationBuilder.DropColumn(
                name: "IsInternalNote",
                schema: "app",
                table: "SupportTicketMessages");
        }
    }
}
