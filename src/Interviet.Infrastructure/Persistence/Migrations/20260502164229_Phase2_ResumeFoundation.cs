using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Interviet.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase2_ResumeFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ResumeParseJobs_ResumeVersions_ResumeVersionId",
                schema: "app",
                table: "ResumeParseJobs");

            migrationBuilder.DropColumn(
                name: "FailedAt",
                schema: "app",
                table: "ResumeParseJobs");

            migrationBuilder.AddColumn<string>(
                name: "ContentType",
                schema: "app",
                table: "ResumeVersions",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastProcessedAt",
                schema: "app",
                table: "ResumeVersions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProcessingError",
                schema: "app",
                table: "ResumeVersions",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Source",
                schema: "app",
                table: "ResumeVersions",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "upload");

            migrationBuilder.AddColumn<int>(
                name: "VersionNumber",
                schema: "app",
                table: "Resumes",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AlterColumn<string>(
                name: "ErrorMessage",
                schema: "app",
                table: "ResumeParseJobs",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ErrorCode",
                schema: "app",
                table: "ResumeParseJobs",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                schema: "app",
                table: "ResumeParseJobs",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "ModelVersion",
                schema: "app",
                table: "ResumeParseJobs",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Provider",
                schema: "app",
                table: "ResumeParseJobs",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "python");

            migrationBuilder.AddColumn<string>(
                name: "RequestId",
                schema: "app",
                table: "ResumeParseJobs",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ResumeId",
                schema: "app",
                table: "ResumeParseJobs",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<int>(
                name: "RetryCount",
                schema: "app",
                table: "ResumeParseJobs",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "SchemaVersion",
                schema: "app",
                table: "ResumeParseJobs",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                schema: "app",
                table: "ResumeParseJobs",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                schema: "app",
                table: "ResumeParseJobs",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "ResumeParsedData",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ResumeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ResumeVersionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RawText = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DetectedLanguage = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    SectionsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SkillsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ExperiencesJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EducationsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ProjectsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CertificationsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LanguagesJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    WarningsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModelVersion = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SchemaVersion = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResumeParsedData", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ResumeParsedData_ResumeVersions_ResumeVersionId",
                        column: x => x.ResumeVersionId,
                        principalSchema: "app",
                        principalTable: "ResumeVersions",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ResumeParsedData_Resumes_ResumeId",
                        column: x => x.ResumeId,
                        principalSchema: "app",
                        principalTable: "Resumes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Resumes_UserId",
                schema: "app",
                table: "Resumes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Resumes_UserId_IsActive",
                schema: "app",
                table: "Resumes",
                columns: new[] { "UserId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_ResumeParseJobs_ResumeId",
                schema: "app",
                table: "ResumeParseJobs",
                column: "ResumeId");

            migrationBuilder.CreateIndex(
                name: "IX_ResumeParseJobs_Status",
                schema: "app",
                table: "ResumeParseJobs",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ResumeParseJobs_UserId",
                schema: "app",
                table: "ResumeParseJobs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ResumeParsedData_ResumeId",
                schema: "app",
                table: "ResumeParsedData",
                column: "ResumeId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ResumeParsedData_ResumeVersionId",
                schema: "app",
                table: "ResumeParsedData",
                column: "ResumeVersionId");

            migrationBuilder.AddForeignKey(
                name: "FK_ResumeParseJobs_ResumeVersions_ResumeVersionId",
                schema: "app",
                table: "ResumeParseJobs",
                column: "ResumeVersionId",
                principalSchema: "app",
                principalTable: "ResumeVersions",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ResumeParseJobs_ResumeVersions_ResumeVersionId",
                schema: "app",
                table: "ResumeParseJobs");

            migrationBuilder.DropTable(
                name: "ResumeParsedData",
                schema: "app");

            migrationBuilder.DropIndex(
                name: "IX_Resumes_UserId",
                schema: "app",
                table: "Resumes");

            migrationBuilder.DropIndex(
                name: "IX_Resumes_UserId_IsActive",
                schema: "app",
                table: "Resumes");

            migrationBuilder.DropIndex(
                name: "IX_ResumeParseJobs_ResumeId",
                schema: "app",
                table: "ResumeParseJobs");

            migrationBuilder.DropIndex(
                name: "IX_ResumeParseJobs_Status",
                schema: "app",
                table: "ResumeParseJobs");

            migrationBuilder.DropIndex(
                name: "IX_ResumeParseJobs_UserId",
                schema: "app",
                table: "ResumeParseJobs");

            migrationBuilder.DropColumn(
                name: "ContentType",
                schema: "app",
                table: "ResumeVersions");

            migrationBuilder.DropColumn(
                name: "LastProcessedAt",
                schema: "app",
                table: "ResumeVersions");

            migrationBuilder.DropColumn(
                name: "ProcessingError",
                schema: "app",
                table: "ResumeVersions");

            migrationBuilder.DropColumn(
                name: "Source",
                schema: "app",
                table: "ResumeVersions");

            migrationBuilder.DropColumn(
                name: "VersionNumber",
                schema: "app",
                table: "Resumes");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                schema: "app",
                table: "ResumeParseJobs");

            migrationBuilder.DropColumn(
                name: "ModelVersion",
                schema: "app",
                table: "ResumeParseJobs");

            migrationBuilder.DropColumn(
                name: "Provider",
                schema: "app",
                table: "ResumeParseJobs");

            migrationBuilder.DropColumn(
                name: "RequestId",
                schema: "app",
                table: "ResumeParseJobs");

            migrationBuilder.DropColumn(
                name: "ResumeId",
                schema: "app",
                table: "ResumeParseJobs");

            migrationBuilder.DropColumn(
                name: "RetryCount",
                schema: "app",
                table: "ResumeParseJobs");

            migrationBuilder.DropColumn(
                name: "SchemaVersion",
                schema: "app",
                table: "ResumeParseJobs");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                schema: "app",
                table: "ResumeParseJobs");

            migrationBuilder.DropColumn(
                name: "UserId",
                schema: "app",
                table: "ResumeParseJobs");

            migrationBuilder.AlterColumn<string>(
                name: "ErrorMessage",
                schema: "app",
                table: "ResumeParseJobs",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ErrorCode",
                schema: "app",
                table: "ResumeParseJobs",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FailedAt",
                schema: "app",
                table: "ResumeParseJobs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ResumeParseJobs_ResumeVersions_ResumeVersionId",
                schema: "app",
                table: "ResumeParseJobs",
                column: "ResumeVersionId",
                principalSchema: "app",
                principalTable: "ResumeVersions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
