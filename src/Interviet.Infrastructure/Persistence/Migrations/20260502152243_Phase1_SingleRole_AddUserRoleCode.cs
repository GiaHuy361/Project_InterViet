using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Interviet.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase1_SingleRole_AddUserRoleCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RoleCode",
                schema: "app",
                table: "Users",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "candidate");

            migrationBuilder.UpdateData(
                schema: "app",
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "Code", "Name" },
                values: new object[] { "mentor", "Mentor" });

            migrationBuilder.InsertData(
                schema: "app",
                table: "Roles",
                columns: new[] { "Id", "Code", "CreatedAt", "Description", "Name" },
                values: new object[] { new Guid("44444444-4444-4444-4444-444444444444"), "support", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Support" });

            migrationBuilder.CreateIndex(
                name: "IX_Users_RoleCode",
                schema: "app",
                table: "Users",
                column: "RoleCode");

            // Drop UserRoles join table — business logic now uses User.RoleCode (single-role model)
            migrationBuilder.Sql("DELETE FROM [app].[UserRoles]");
            migrationBuilder.DropTable(name: "UserRoles", schema: "app");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Recreate UserRoles for rollback
            migrationBuilder.CreateTable(
                name: "UserRoles",
                schema: "app",
                columns: table => new
                {
                    UserId    = table.Column<Guid>(nullable: false),
                    RoleId    = table.Column<Guid>(nullable: false),
                    AssignedAt = table.Column<DateTime>(nullable: false),
                    AssignedBy = table.Column<Guid>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey("FK_UserRoles_Roles_RoleId",  x => x.RoleId, principalSchema: "app", principalTable: "Roles", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
                    table.ForeignKey("FK_UserRoles_Users_UserId",  x => x.UserId, principalSchema: "app", principalTable: "Users", principalColumn: "Id", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.DropIndex(name: "IX_Users_RoleCode", schema: "app", table: "Users");

            migrationBuilder.DeleteData(schema: "app", table: "Roles", keyColumn: "Id", keyValue: new Guid("44444444-4444-4444-4444-444444444444"));

            migrationBuilder.DropColumn(name: "RoleCode", schema: "app", table: "Users");

            migrationBuilder.UpdateData(
                schema: "app",
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "Code", "Name" },
                values: new object[] { "employer", "Employer" });
        }
    }
}
