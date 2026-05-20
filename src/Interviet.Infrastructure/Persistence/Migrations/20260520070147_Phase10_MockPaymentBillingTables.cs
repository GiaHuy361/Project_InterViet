using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Interviet.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase10_MockPaymentBillingTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CheckoutSessionId",
                schema: "app",
                table: "PaymentTransactions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlanKey",
                schema: "app",
                table: "PaymentTransactions",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "CheckoutSessionId",
                schema: "app",
                table: "Invoices",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PlanId",
                schema: "app",
                table: "Invoices",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlanKey",
                schema: "app",
                table: "Invoices",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "BillingCheckoutSessions",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PlanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PlanKey = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Provider = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CurrencyCode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false, defaultValue: "VND"),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    ReturnUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CancelUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CheckoutUrl = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FailureReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    PaymentTransactionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillingCheckoutSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BillingCheckoutSessions_PaymentTransactions_PaymentTransactionId",
                        column: x => x.PaymentTransactionId,
                        principalSchema: "app",
                        principalTable: "PaymentTransactions",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_CheckoutSessionId",
                schema: "app",
                table: "PaymentTransactions",
                column: "CheckoutSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_CheckoutSessionId",
                schema: "app",
                table: "Invoices",
                column: "CheckoutSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_UserId_CreatedAt",
                schema: "app",
                table: "Invoices",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_BillingCheckoutSessions_PaymentTransactionId",
                schema: "app",
                table: "BillingCheckoutSessions",
                column: "PaymentTransactionId");

            migrationBuilder.CreateIndex(
                name: "IX_BillingCheckoutSessions_UserId_ExpiresAt",
                schema: "app",
                table: "BillingCheckoutSessions",
                columns: new[] { "UserId", "ExpiresAt" });

            migrationBuilder.CreateIndex(
                name: "IX_BillingCheckoutSessions_UserId_Status_CreatedAt",
                schema: "app",
                table: "BillingCheckoutSessions",
                columns: new[] { "UserId", "Status", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BillingCheckoutSessions",
                schema: "app");

            migrationBuilder.DropIndex(
                name: "IX_PaymentTransactions_CheckoutSessionId",
                schema: "app",
                table: "PaymentTransactions");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_CheckoutSessionId",
                schema: "app",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_UserId_CreatedAt",
                schema: "app",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "CheckoutSessionId",
                schema: "app",
                table: "PaymentTransactions");

            migrationBuilder.DropColumn(
                name: "PlanKey",
                schema: "app",
                table: "PaymentTransactions");

            migrationBuilder.DropColumn(
                name: "CheckoutSessionId",
                schema: "app",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "PlanId",
                schema: "app",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "PlanKey",
                schema: "app",
                table: "Invoices");
        }
    }
}
