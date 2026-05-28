using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Interviet.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase18_RealPayOSIntegration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "OrderCode",
                schema: "app",
                table: "BillingCheckoutSessions",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.CreateIndex(
                name: "IX_BillingCheckoutSessions_OrderCode",
                schema: "app",
                table: "BillingCheckoutSessions",
                column: "OrderCode",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_BillingCheckoutSessions_OrderCode",
                schema: "app",
                table: "BillingCheckoutSessions");

            migrationBuilder.DropColumn(
                name: "OrderCode",
                schema: "app",
                table: "BillingCheckoutSessions");
        }
    }
}
