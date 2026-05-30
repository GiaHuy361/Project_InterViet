using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Interviet.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase13_AddMentorDefaultMeetingUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MeetingUrl",
                schema: "app",
                table: "MentorProfiles",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MeetingUrl",
                schema: "app",
                table: "MentorProfiles");
        }
    }
}
