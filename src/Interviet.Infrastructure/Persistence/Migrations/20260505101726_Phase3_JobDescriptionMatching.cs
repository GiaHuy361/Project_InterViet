using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Interviet.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase3_JobDescriptionMatching : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MatchTargets_MatchResults_MatchTargetId",
                schema: "app",
                table: "MatchTargets");

            migrationBuilder.DropIndex(
                name: "IX_MatchTargets_MatchTargetId",
                schema: "app",
                table: "MatchTargets");

            migrationBuilder.DropColumn(
                name: "MatchTargetId",
                schema: "app",
                table: "MatchTargets");

            migrationBuilder.AlterColumn<string>(
                name: "ErrorMessage",
                schema: "app",
                table: "MatchSessions",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ErrorCode",
                schema: "app",
                table: "MatchSessions",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "JobDescriptionId",
                schema: "app",
                table: "MatchSessions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RequestId",
                schema: "app",
                table: "MatchSessions",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ResumeId",
                schema: "app",
                table: "MatchSessions",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "MatchedSkillsJson",
                schema: "app",
                table: "MatchResults",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SummaryText",
                schema: "app",
                table: "MatchResults",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MatchSessions_JobDescriptionId_RequestedAt",
                schema: "app",
                table: "MatchSessions",
                columns: new[] { "JobDescriptionId", "RequestedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_MatchSessions_ResumeId_RequestedAt",
                schema: "app",
                table: "MatchSessions",
                columns: new[] { "ResumeId", "RequestedAt" });

            migrationBuilder.AddForeignKey(
                name: "FK_MatchResults_MatchTargets_MatchTargetId",
                schema: "app",
                table: "MatchResults",
                column: "MatchTargetId",
                principalSchema: "app",
                principalTable: "MatchTargets",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MatchResults_MatchTargets_MatchTargetId",
                schema: "app",
                table: "MatchResults");

            migrationBuilder.DropIndex(
                name: "IX_MatchSessions_JobDescriptionId_RequestedAt",
                schema: "app",
                table: "MatchSessions");

            migrationBuilder.DropIndex(
                name: "IX_MatchSessions_ResumeId_RequestedAt",
                schema: "app",
                table: "MatchSessions");

            migrationBuilder.DropColumn(
                name: "JobDescriptionId",
                schema: "app",
                table: "MatchSessions");

            migrationBuilder.DropColumn(
                name: "RequestId",
                schema: "app",
                table: "MatchSessions");

            migrationBuilder.DropColumn(
                name: "ResumeId",
                schema: "app",
                table: "MatchSessions");

            migrationBuilder.DropColumn(
                name: "MatchedSkillsJson",
                schema: "app",
                table: "MatchResults");

            migrationBuilder.DropColumn(
                name: "SummaryText",
                schema: "app",
                table: "MatchResults");

            migrationBuilder.AddColumn<Guid>(
                name: "MatchTargetId",
                schema: "app",
                table: "MatchTargets",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ErrorMessage",
                schema: "app",
                table: "MatchSessions",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ErrorCode",
                schema: "app",
                table: "MatchSessions",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MatchTargets_MatchTargetId",
                schema: "app",
                table: "MatchTargets",
                column: "MatchTargetId");

            migrationBuilder.AddForeignKey(
                name: "FK_MatchTargets_MatchResults_MatchTargetId",
                schema: "app",
                table: "MatchTargets",
                column: "MatchTargetId",
                principalSchema: "app",
                principalTable: "MatchResults",
                principalColumn: "Id");
        }
    }
}
