using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Interviet.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase8A_RealtimeInterviewFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "InterviewRealtimeSessions",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InterviewSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Provider = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ProviderSessionId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Model = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    ConnectUrl = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ClientSecretHash = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EndedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ErrorCode = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ErrorMessage = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InterviewRealtimeSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InterviewRealtimeSessions_InterviewSessions_InterviewSessionId",
                        column: x => x.InterviewSessionId,
                        principalSchema: "app",
                        principalTable: "InterviewSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "InterviewRealtimeEvents",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InterviewSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RealtimeSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SequenceNumber = table.Column<int>(type: "int", nullable: false),
                    EventType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Role = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    Text = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ProviderEventId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    OccurredAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    MetadataJson = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InterviewRealtimeEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InterviewRealtimeEvents_InterviewRealtimeSessions_RealtimeSessionId",
                        column: x => x.RealtimeSessionId,
                        principalSchema: "app",
                        principalTable: "InterviewRealtimeSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_InterviewRealtimeEvents_InterviewSessionId",
                schema: "app",
                table: "InterviewRealtimeEvents",
                column: "InterviewSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_InterviewRealtimeEvents_RealtimeSessionId",
                schema: "app",
                table: "InterviewRealtimeEvents",
                column: "RealtimeSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_InterviewRealtimeEvents_RealtimeSessionId_SequenceNumber",
                schema: "app",
                table: "InterviewRealtimeEvents",
                columns: new[] { "RealtimeSessionId", "SequenceNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InterviewRealtimeSessions_InterviewSessionId",
                schema: "app",
                table: "InterviewRealtimeSessions",
                column: "InterviewSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_InterviewRealtimeSessions_InterviewSessionId_Status",
                schema: "app",
                table: "InterviewRealtimeSessions",
                columns: new[] { "InterviewSessionId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_InterviewRealtimeSessions_UserId",
                schema: "app",
                table: "InterviewRealtimeSessions",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InterviewRealtimeEvents",
                schema: "app");

            migrationBuilder.DropTable(
                name: "InterviewRealtimeSessions",
                schema: "app");
        }
    }
}
