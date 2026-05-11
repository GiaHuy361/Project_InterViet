using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Interviet.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase6_ParseMetadataAndMatchCompatibility : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DetectedSectionsJson",
                schema: "app",
                table: "ResumeParsedData",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MissingSectionsJson",
                schema: "app",
                table: "ResumeParsedData",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ParseConfidenceScore",
                schema: "app",
                table: "ResumeParsedData",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ParseQuality",
                schema: "app",
                table: "ResumeParsedData",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ParseTextLength",
                schema: "app",
                table: "ResumeParsedData",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ParseWarningCount",
                schema: "app",
                table: "ResumeParsedData",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DetectedSectionsJson",
                schema: "app",
                table: "ResumeParsedData");

            migrationBuilder.DropColumn(
                name: "MissingSectionsJson",
                schema: "app",
                table: "ResumeParsedData");

            migrationBuilder.DropColumn(
                name: "ParseConfidenceScore",
                schema: "app",
                table: "ResumeParsedData");

            migrationBuilder.DropColumn(
                name: "ParseQuality",
                schema: "app",
                table: "ResumeParsedData");

            migrationBuilder.DropColumn(
                name: "ParseTextLength",
                schema: "app",
                table: "ResumeParsedData");

            migrationBuilder.DropColumn(
                name: "ParseWarningCount",
                schema: "app",
                table: "ResumeParsedData");
        }
    }
}
