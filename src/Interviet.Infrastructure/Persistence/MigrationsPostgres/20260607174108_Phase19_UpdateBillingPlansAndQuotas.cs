using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Interviet.Infrastructure.Persistence.MigrationsPostgres
{
    /// <inheritdoc />
    public partial class Phase19_UpdateBillingPlansAndQuotas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<byte[]>(
                name: "RowVersion",
                schema: "app",
                table: "Users",
                type: "bytea",
                nullable: true,
                oldClrType: typeof(byte[]),
                oldType: "bytea",
                oldRowVersion: true);

            migrationBuilder.AlterColumn<byte[]>(
                name: "RowVersion",
                schema: "app",
                table: "UserQuotaCounters",
                type: "bytea",
                nullable: true,
                oldClrType: typeof(byte[]),
                oldType: "bytea",
                oldRowVersion: true);

            migrationBuilder.AlterColumn<byte[]>(
                name: "RowVersion",
                schema: "app",
                table: "Subscriptions",
                type: "bytea",
                nullable: true,
                oldClrType: typeof(byte[]),
                oldType: "bytea",
                oldRowVersion: true);



            migrationBuilder.UpdateData(
                schema: "app",
                table: "Plans",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                column: "PriceAmount",
                value: 299000m);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "Plans",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                column: "PriceAmount",
                value: 499000m);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "Plans",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                columns: new[] { "PriceAmount", "TrialDays" },
                values: new object[] { 2999000m, 0 });

            migrationBuilder.InsertData(
                schema: "app",
                table: "Plans",
                columns: new[] { "Id", "BillingCycle", "Code", "CreatedAt", "CurrencyCode", "IsActive", "Name", "PriceAmount", "SortOrder", "TrialDays", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("55555555-5555-5555-5555-555555555555"), "combo", "combo", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "VND", true, "Gói Combo", 29000m, 5, 0, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("66666666-6666-6666-6666-666666666666"), "weekly", "weekly", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "VND", true, "Premium (Weekly)", 109000m, 6, 0, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("a3000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 3, "total" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("a9000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 5, "total" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("b3000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 10, "subscription" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("b9000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 30, "subscription" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("c3000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 24, "subscription" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("c9000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 100, "subscription" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("d3000000-0000-0000-0000-000000000000"),
                columns: new[] { "IsUnlimited", "MaxValue", "PeriodType" },
                values: new object[] { false, 60, "subscription" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("d9000000-0000-0000-0000-000000000000"),
                column: "PeriodType",
                value: "subscription");

            migrationBuilder.InsertData(
                schema: "app",
                table: "UsageQuotaPolicies",
                columns: new[] { "Id", "CreatedAt", "FeatureKey", "IsUnlimited", "MaxValue", "PeriodType", "PlanId", "ResetHourUtc" },
                values: new object[,]
                {
                    { new Guid("aa000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "interview.max_duration", false, 5, "total", new Guid("11111111-1111-1111-1111-111111111111"), null },
                    { new Guid("ba000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "interview.max_duration", false, 15, "total", new Guid("22222222-2222-2222-2222-222222222222"), null },
                    { new Guid("ca000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "interview.max_duration", false, 20, "total", new Guid("33333333-3333-3333-3333-333333333333"), null },
                    { new Guid("da000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "interview.max_duration", false, 25, "total", new Guid("44444444-4444-4444-4444-444444444444"), null },
                    { new Guid("e1000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "cv.storage", false, 1, "total", new Guid("55555555-5555-5555-5555-555555555555"), null },
                    { new Guid("e2000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "cv.optimization", false, 3, "daily", new Guid("55555555-5555-5555-5555-555555555555"), null },
                    { new Guid("e3000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "interview.ai", false, 1, "subscription", new Guid("55555555-5555-5555-5555-555555555555"), null },
                    { new Guid("e4000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "mentor.session", false, 0, "monthly", new Guid("55555555-5555-5555-5555-555555555555"), null },
                    { new Guid("e5000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "multi_jd.match", false, 3, "per_match", new Guid("55555555-5555-5555-5555-555555555555"), null },
                    { new Guid("e6000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "resume.upload", false, 3, "daily", new Guid("55555555-5555-5555-5555-555555555555"), null },
                    { new Guid("e7000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "resume.parse", false, 3, "daily", new Guid("55555555-5555-5555-5555-555555555555"), null },
                    { new Guid("e8000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "jobdescription.create", false, 5, "daily", new Guid("55555555-5555-5555-5555-555555555555"), null },
                    { new Guid("e9000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "match.create", false, 3, "subscription", new Guid("55555555-5555-5555-5555-555555555555"), null },
                    { new Guid("ea000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "interview.max_duration", false, 5, "total", new Guid("55555555-5555-5555-5555-555555555555"), null },
                    { new Guid("f1000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "cv.storage", false, 1, "total", new Guid("66666666-6666-6666-6666-666666666666"), null },
                    { new Guid("f2000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "cv.optimization", false, 3, "daily", new Guid("66666666-6666-6666-6666-666666666666"), null },
                    { new Guid("f3000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "interview.ai", false, 5, "subscription", new Guid("66666666-6666-6666-6666-666666666666"), null },
                    { new Guid("f4000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "mentor.session", false, 0, "monthly", new Guid("66666666-6666-6666-6666-666666666666"), null },
                    { new Guid("f5000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "multi_jd.match", false, 3, "per_match", new Guid("66666666-6666-6666-6666-666666666666"), null },
                    { new Guid("f6000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "resume.upload", false, 3, "daily", new Guid("66666666-6666-6666-6666-666666666666"), null },
                    { new Guid("f7000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "resume.parse", false, 3, "daily", new Guid("66666666-6666-6666-6666-666666666666"), null },
                    { new Guid("f8000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "jobdescription.create", false, 5, "daily", new Guid("66666666-6666-6666-6666-666666666666"), null },
                    { new Guid("f9000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "match.create", false, 15, "subscription", new Guid("66666666-6666-6666-6666-666666666666"), null },
                    { new Guid("fa000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "interview.max_duration", false, 5, "total", new Guid("66666666-6666-6666-6666-666666666666"), null }
                });

            migrationBuilder.InsertData(
                schema: "app",
                table: "PlanEntitlements",
                columns: new[] { "Id", "CreatedAt", "FeatureKey", "FeatureValue", "PlanId", "ValueType" },
                values: new object[,]
                {
                    { new Guid("e5000000-0000-0000-0000-000000000001"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "ai.model.tier", "Basic", new Guid("55555555-5555-5555-5555-555555555555"), "string" },
                    { new Guid("e5000000-0000-0000-0000-000000000002"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "report.export_pdf", "false", new Guid("55555555-5555-5555-5555-555555555555"), "boolean" },
                    { new Guid("e5000000-0000-0000-0000-000000000003"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "report.share", "false", new Guid("55555555-5555-5555-5555-555555555555"), "boolean" },
                    { new Guid("e5000000-0000-0000-0000-000000000004"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "analytics.advanced", "false", new Guid("55555555-5555-5555-5555-555555555555"), "boolean" },
                    { new Guid("e5000000-0000-0000-0000-000000000005"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "headhunter.access", "false", new Guid("55555555-5555-5555-5555-555555555555"), "boolean" },
                    { new Guid("e5000000-0000-0000-0000-000000000006"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "career.advancement", "false", new Guid("55555555-5555-5555-5555-555555555555"), "boolean" },
                    { new Guid("e5000000-0000-0000-0000-000000000007"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "communication.analysis", "false", new Guid("55555555-5555-5555-5555-555555555555"), "boolean" },
                    { new Guid("e5000000-0000-0000-0000-000000000008"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "industry.benchmark", "false", new Guid("55555555-5555-5555-5555-555555555555"), "boolean" },
                    { new Guid("e5000000-0000-0000-0000-000000000009"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "mentor.choose_by_industry", "false", new Guid("55555555-5555-5555-5555-555555555555"), "boolean" },
                    { new Guid("e5000000-0000-0000-0000-000000000010"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "history.retention", "30_days", new Guid("55555555-5555-5555-5555-555555555555"), "string" },
                    { new Guid("e5000000-0000-0000-0000-000000000011"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "support.level", "Email", new Guid("55555555-5555-5555-5555-555555555555"), "string" },
                    { new Guid("e6000000-0000-0000-0000-000000000001"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "ai.model.tier", "Basic", new Guid("66666666-6666-6666-6666-666666666666"), "string" },
                    { new Guid("e6000000-0000-0000-0000-000000000002"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "report.export_pdf", "false", new Guid("66666666-6666-6666-6666-666666666666"), "boolean" },
                    { new Guid("e6000000-0000-0000-0000-000000000003"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "report.share", "false", new Guid("66666666-6666-6666-6666-666666666666"), "boolean" },
                    { new Guid("e6000000-0000-0000-0000-000000000004"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "analytics.advanced", "false", new Guid("66666666-6666-6666-6666-666666666666"), "boolean" },
                    { new Guid("e6000000-0000-0000-0000-000000000005"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "headhunter.access", "false", new Guid("66666666-6666-6666-6666-666666666666"), "boolean" },
                    { new Guid("e6000000-0000-0000-0000-000000000006"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "career.advancement", "false", new Guid("66666666-6666-6666-6666-666666666666"), "boolean" },
                    { new Guid("e6000000-0000-0000-0000-000000000007"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "communication.analysis", "false", new Guid("66666666-6666-6666-6666-666666666666"), "boolean" },
                    { new Guid("e6000000-0000-0000-0000-000000000008"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "industry.benchmark", "false", new Guid("66666666-6666-6666-6666-666666666666"), "boolean" },
                    { new Guid("e6000000-0000-0000-0000-000000000009"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "mentor.choose_by_industry", "false", new Guid("66666666-6666-6666-6666-666666666666"), "boolean" },
                    { new Guid("e6000000-0000-0000-0000-000000000010"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "history.retention", "30_days", new Guid("66666666-6666-6666-6666-666666666666"), "string" },
                    { new Guid("e6000000-0000-0000-0000-000000000011"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "support.level", "Email", new Guid("66666666-6666-6666-6666-666666666666"), "string" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e5000000-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e5000000-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e5000000-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e5000000-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e5000000-0000-0000-0000-000000000005"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e5000000-0000-0000-0000-000000000006"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e5000000-0000-0000-0000-000000000007"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e5000000-0000-0000-0000-000000000008"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e5000000-0000-0000-0000-000000000009"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e5000000-0000-0000-0000-000000000010"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e5000000-0000-0000-0000-000000000011"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000005"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000006"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000007"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000008"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000009"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000010"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000011"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("aa000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("ba000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("ca000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("da000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("e5000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("e7000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("e8000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("e9000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("ea000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("f1000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("f2000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("f3000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("f4000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("f5000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("f6000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("f7000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("f8000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("f9000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("fa000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "Plans",
                keyColumn: "Id",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "Plans",
                keyColumn: "Id",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"));



            migrationBuilder.AlterColumn<byte[]>(
                name: "RowVersion",
                schema: "app",
                table: "Users",
                type: "bytea",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0],
                oldClrType: typeof(byte[]),
                oldType: "bytea",
                oldNullable: true);

            migrationBuilder.AlterColumn<byte[]>(
                name: "RowVersion",
                schema: "app",
                table: "UserQuotaCounters",
                type: "bytea",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0],
                oldClrType: typeof(byte[]),
                oldType: "bytea",
                oldNullable: true);

            migrationBuilder.AlterColumn<byte[]>(
                name: "RowVersion",
                schema: "app",
                table: "Subscriptions",
                type: "bytea",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0],
                oldClrType: typeof(byte[]),
                oldType: "bytea",
                oldNullable: true);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "Plans",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                column: "PriceAmount",
                value: 149000m);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "Plans",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                column: "PriceAmount",
                value: 387000m);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "Plans",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                columns: new[] { "PriceAmount", "TrialDays" },
                values: new object[] { 1308000m, 7 });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("a3000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 1, "daily" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("a9000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 3, "daily" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("b3000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 1, "daily" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("b9000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 10, "daily" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("c3000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 3, "daily" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("c9000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 30, "daily" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("d3000000-0000-0000-0000-000000000000"),
                columns: new[] { "IsUnlimited", "MaxValue", "PeriodType" },
                values: new object[] { true, 999999, "daily" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("d9000000-0000-0000-0000-000000000000"),
                column: "PeriodType",
                value: "daily");
        }
    }
}
