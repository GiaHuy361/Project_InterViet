using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Interviet.Infrastructure.Persistence.MigrationsPostgres
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260530072250_Phase13_AddMentorDefaultMeetingUrl")]
    public partial class Phase13_AddMentorDefaultMeetingUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MeetingUrl",
                schema: "app",
                table: "MentorProfiles",
                type: "character varying(500)",
                maxLength: 500,
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
