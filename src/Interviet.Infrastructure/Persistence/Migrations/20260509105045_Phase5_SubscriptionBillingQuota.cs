using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Interviet.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase5_SubscriptionBillingQuota : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                schema: "app",
                table: "Plans",
                columns: new[] { "Id", "BillingCycle", "Code", "CreatedAt", "CurrencyCode", "IsActive", "Name", "PriceAmount", "SortOrder", "TrialDays", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111111"), "free", "Free", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "VND", true, "Free Plan", 0m, 1, 0, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("22222222-2222-2222-2222-222222222222"), "monthly", "PremiumMonthly", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "VND", true, "Premium (Monthly)", 99000m, 2, 0, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("33333333-3333-3333-3333-333333333333"), "quarterly", "PremiumQuarterly", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "VND", true, "Premium (Quarterly)", 249000m, 3, 0, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("44444444-4444-4444-4444-444444444444"), "yearly", "PremiumYearly", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "VND", true, "Premium (Yearly)", 899000m, 4, 0, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.InsertData(
                schema: "app",
                table: "UsageQuotaPolicies",
                columns: new[] { "Id", "CreatedAt", "FeatureKey", "IsUnlimited", "MaxValue", "PeriodType", "PlanId", "ResetHourUtc" },
                values: new object[,]
                {
                    { new Guid("a1000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "resume.upload", false, 3, "daily", new Guid("11111111-1111-1111-1111-111111111111"), null },
                    { new Guid("a2000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "resume.parse", false, 3, "daily", new Guid("11111111-1111-1111-1111-111111111111"), null },
                    { new Guid("a3000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "jobdescription.create", false, 5, "daily", new Guid("11111111-1111-1111-1111-111111111111"), null },
                    { new Guid("a4000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "match.create", false, 3, "daily", new Guid("11111111-1111-1111-1111-111111111111"), null },
                    { new Guid("b1000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "resume.upload", false, 20, "daily", new Guid("22222222-2222-2222-2222-222222222222"), null },
                    { new Guid("b2000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "resume.parse", false, 20, "daily", new Guid("22222222-2222-2222-2222-222222222222"), null },
                    { new Guid("b3000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "jobdescription.create", false, 50, "daily", new Guid("22222222-2222-2222-2222-222222222222"), null },
                    { new Guid("b4000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "match.create", false, 30, "daily", new Guid("22222222-2222-2222-2222-222222222222"), null },
                    { new Guid("c1000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "resume.upload", false, 30, "daily", new Guid("33333333-3333-3333-3333-333333333333"), null },
                    { new Guid("c2000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "resume.parse", false, 30, "daily", new Guid("33333333-3333-3333-3333-333333333333"), null },
                    { new Guid("c3000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "jobdescription.create", false, 80, "daily", new Guid("33333333-3333-3333-3333-333333333333"), null },
                    { new Guid("c4000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "match.create", false, 50, "daily", new Guid("33333333-3333-3333-3333-333333333333"), null },
                    { new Guid("d1000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "resume.upload", false, 50, "daily", new Guid("44444444-4444-4444-4444-444444444444"), null },
                    { new Guid("d2000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "resume.parse", false, 50, "daily", new Guid("44444444-4444-4444-4444-444444444444"), null },
                    { new Guid("d3000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "jobdescription.create", false, 150, "daily", new Guid("44444444-4444-4444-4444-444444444444"), null },
                    { new Guid("d4000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "match.create", false, 100, "daily", new Guid("44444444-4444-4444-4444-444444444444"), null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                schema: "app",
                table: "Plans",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "Plans",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "Plans",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "Plans",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("a1000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("a2000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("a3000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("a4000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("b1000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("b2000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("b3000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("b4000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("c1000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("c2000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("c3000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("c4000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("d1000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("d2000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("d3000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("d4000000-0000-0000-0000-000000000000"));
        }
    }
}
