using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Interviet.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase7_AIInterviewFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AiModel",
                schema: "app",
                table: "InterviewSessions",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InterviewerMode",
                schema: "app",
                table: "InterviewSessions",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "InterviewQuestions",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InterviewSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QuestionNumber = table.Column<int>(type: "int", nullable: false),
                    QuestionType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    QuestionText = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ExpectedAnswerPointsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Difficulty = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    AskedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InterviewQuestions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InterviewQuestions_InterviewSessions_InterviewSessionId",
                        column: x => x.InterviewSessionId,
                        principalSchema: "app",
                        principalTable: "InterviewSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "InterviewAnswers",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InterviewQuestionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AnswerText = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AudioFileUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    AudioDurationSeconds = table.Column<int>(type: "int", nullable: true),
                    TranscriptionConfidence = table.Column<decimal>(type: "decimal(5,4)", nullable: true),
                    AnswerScore = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    Feedback = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClarityScore = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    RelevanceScore = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    CompletenessScore = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    PositivePointsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NegativePointsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SuggestionsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AnsweredAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InterviewAnswers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InterviewAnswers_InterviewQuestions_InterviewQuestionId",
                        column: x => x.InterviewQuestionId,
                        principalSchema: "app",
                        principalTable: "InterviewQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_InterviewSessions_UserId_Status",
                schema: "app",
                table: "InterviewSessions",
                columns: new[] { "UserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_InterviewAnswers_InterviewQuestionId",
                schema: "app",
                table: "InterviewAnswers",
                column: "InterviewQuestionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InterviewQuestions_InterviewSessionId_QuestionNumber",
                schema: "app",
                table: "InterviewQuestions",
                columns: new[] { "InterviewSessionId", "QuestionNumber" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InterviewAnswers",
                schema: "app");

            migrationBuilder.DropTable(
                name: "InterviewQuestions",
                schema: "app");

            migrationBuilder.DropIndex(
                name: "IX_InterviewSessions_UserId_Status",
                schema: "app",
                table: "InterviewSessions");

            migrationBuilder.DropColumn(
                name: "AiModel",
                schema: "app",
                table: "InterviewSessions");

            migrationBuilder.DropColumn(
                name: "InterviewerMode",
                schema: "app",
                table: "InterviewSessions");
        }
    }
}
