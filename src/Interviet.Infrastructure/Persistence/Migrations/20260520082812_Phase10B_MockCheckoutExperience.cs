using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Interviet.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase10B_MockCheckoutExperience : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BillingPaymentAttempts",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CheckoutSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Provider = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Method = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PayerAccountNumberMasked = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PayerAccountName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    AmountPaid = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CurrencyCode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false, defaultValue: "VND"),
                    TransferContent = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    ExpectedTransferContent = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    TransactionReference = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    RejectionReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillingPaymentAttempts", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BillingPaymentAttempts_TransactionReference",
                schema: "app",
                table: "BillingPaymentAttempts",
                column: "TransactionReference");

            migrationBuilder.CreateIndex(
                name: "IX_BillingPaymentAttempts_UserId_CheckoutSessionId_CreatedAt",
                schema: "app",
                table: "BillingPaymentAttempts",
                columns: new[] { "UserId", "CheckoutSessionId", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BillingPaymentAttempts",
                schema: "app");
        }
    }
}
