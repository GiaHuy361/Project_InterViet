using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Interviet.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase5_AdjustPlansToMocktest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                schema: "app",
                table: "PlanEntitlements",
                columns: new[] { "Id", "CreatedAt", "FeatureKey", "FeatureValue", "PlanId", "ValueType" },
                values: new object[,]
                {
                    { new Guid("e1000000-0000-0000-0000-000000000001"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "ai.model.tier", "Basic", new Guid("11111111-1111-1111-1111-111111111111"), "string" },
                    { new Guid("e1000000-0000-0000-0000-000000000002"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "report.export_pdf", "false", new Guid("11111111-1111-1111-1111-111111111111"), "boolean" },
                    { new Guid("e1000000-0000-0000-0000-000000000003"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "report.share", "false", new Guid("11111111-1111-1111-1111-111111111111"), "boolean" },
                    { new Guid("e1000000-0000-0000-0000-000000000004"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "analytics.advanced", "false", new Guid("11111111-1111-1111-1111-111111111111"), "boolean" },
                    { new Guid("e1000000-0000-0000-0000-000000000005"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "headhunter.access", "false", new Guid("11111111-1111-1111-1111-111111111111"), "boolean" },
                    { new Guid("e1000000-0000-0000-0000-000000000006"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "career.advancement", "false", new Guid("11111111-1111-1111-1111-111111111111"), "boolean" },
                    { new Guid("e1000000-0000-0000-0000-000000000007"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "communication.analysis", "false", new Guid("11111111-1111-1111-1111-111111111111"), "boolean" },
                    { new Guid("e1000000-0000-0000-0000-000000000008"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "industry.benchmark", "false", new Guid("11111111-1111-1111-1111-111111111111"), "boolean" },
                    { new Guid("e1000000-0000-0000-0000-000000000009"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "mentor.choose_by_industry", "false", new Guid("11111111-1111-1111-1111-111111111111"), "boolean" },
                    { new Guid("e1000000-0000-0000-0000-000000000010"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "history.retention", "30_days", new Guid("11111111-1111-1111-1111-111111111111"), "string" },
                    { new Guid("e1000000-0000-0000-0000-000000000011"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "support.level", "Email", new Guid("11111111-1111-1111-1111-111111111111"), "string" },
                    { new Guid("e2000000-0000-0000-0000-000000000001"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "ai.model.tier", "Stable", new Guid("22222222-2222-2222-2222-222222222222"), "string" },
                    { new Guid("e2000000-0000-0000-0000-000000000002"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "report.export_pdf", "true", new Guid("22222222-2222-2222-2222-222222222222"), "boolean" },
                    { new Guid("e2000000-0000-0000-0000-000000000003"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "report.share", "true", new Guid("22222222-2222-2222-2222-222222222222"), "boolean" },
                    { new Guid("e2000000-0000-0000-0000-000000000004"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "analytics.advanced", "true", new Guid("22222222-2222-2222-2222-222222222222"), "boolean" },
                    { new Guid("e2000000-0000-0000-0000-000000000005"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "headhunter.access", "false", new Guid("22222222-2222-2222-2222-222222222222"), "boolean" },
                    { new Guid("e2000000-0000-0000-0000-000000000006"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "career.advancement", "false", new Guid("22222222-2222-2222-2222-222222222222"), "boolean" },
                    { new Guid("e2000000-0000-0000-0000-000000000007"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "communication.analysis", "false", new Guid("22222222-2222-2222-2222-222222222222"), "boolean" },
                    { new Guid("e2000000-0000-0000-0000-000000000008"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "industry.benchmark", "false", new Guid("22222222-2222-2222-2222-222222222222"), "boolean" },
                    { new Guid("e2000000-0000-0000-0000-000000000009"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "mentor.choose_by_industry", "false", new Guid("22222222-2222-2222-2222-222222222222"), "boolean" },
                    { new Guid("e2000000-0000-0000-0000-000000000010"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "history.retention", "90_days", new Guid("22222222-2222-2222-2222-222222222222"), "string" },
                    { new Guid("e2000000-0000-0000-0000-000000000011"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "support.level", "Email", new Guid("22222222-2222-2222-2222-222222222222"), "string" },
                    { new Guid("e3000000-0000-0000-0000-000000000001"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "ai.model.tier", "Premium", new Guid("33333333-3333-3333-3333-333333333333"), "string" },
                    { new Guid("e3000000-0000-0000-0000-000000000002"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "report.export_pdf", "true", new Guid("33333333-3333-3333-3333-333333333333"), "boolean" },
                    { new Guid("e3000000-0000-0000-0000-000000000003"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "report.share", "true", new Guid("33333333-3333-3333-3333-333333333333"), "boolean" },
                    { new Guid("e3000000-0000-0000-0000-000000000004"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "analytics.advanced", "true", new Guid("33333333-3333-3333-3333-333333333333"), "boolean" },
                    { new Guid("e3000000-0000-0000-0000-000000000005"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "headhunter.access", "false", new Guid("33333333-3333-3333-3333-333333333333"), "boolean" },
                    { new Guid("e3000000-0000-0000-0000-000000000006"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "career.advancement", "false", new Guid("33333333-3333-3333-3333-333333333333"), "boolean" },
                    { new Guid("e3000000-0000-0000-0000-000000000007"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "communication.analysis", "true", new Guid("33333333-3333-3333-3333-333333333333"), "boolean" },
                    { new Guid("e3000000-0000-0000-0000-000000000008"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "industry.benchmark", "true", new Guid("33333333-3333-3333-3333-333333333333"), "boolean" },
                    { new Guid("e3000000-0000-0000-0000-000000000009"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "mentor.choose_by_industry", "true", new Guid("33333333-3333-3333-3333-333333333333"), "boolean" },
                    { new Guid("e3000000-0000-0000-0000-000000000010"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "history.retention", "1_year", new Guid("33333333-3333-3333-3333-333333333333"), "string" },
                    { new Guid("e3000000-0000-0000-0000-000000000011"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "support.level", "Priority", new Guid("33333333-3333-3333-3333-333333333333"), "string" },
                    { new Guid("e4000000-0000-0000-0000-000000000001"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "ai.model.tier", "Premium", new Guid("44444444-4444-4444-4444-444444444444"), "string" },
                    { new Guid("e4000000-0000-0000-0000-000000000002"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "report.export_pdf", "true", new Guid("44444444-4444-4444-4444-444444444444"), "boolean" },
                    { new Guid("e4000000-0000-0000-0000-000000000003"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "report.share", "true", new Guid("44444444-4444-4444-4444-444444444444"), "boolean" },
                    { new Guid("e4000000-0000-0000-0000-000000000004"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "analytics.advanced", "true", new Guid("44444444-4444-4444-4444-444444444444"), "boolean" },
                    { new Guid("e4000000-0000-0000-0000-000000000005"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "headhunter.access", "true", new Guid("44444444-4444-4444-4444-444444444444"), "boolean" },
                    { new Guid("e4000000-0000-0000-0000-000000000006"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "career.advancement", "true", new Guid("44444444-4444-4444-4444-444444444444"), "boolean" },
                    { new Guid("e4000000-0000-0000-0000-000000000007"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "communication.analysis", "true", new Guid("44444444-4444-4444-4444-444444444444"), "boolean" },
                    { new Guid("e4000000-0000-0000-0000-000000000008"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "industry.benchmark", "true", new Guid("44444444-4444-4444-4444-444444444444"), "boolean" },
                    { new Guid("e4000000-0000-0000-0000-000000000009"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "mentor.choose_by_industry", "true", new Guid("44444444-4444-4444-4444-444444444444"), "boolean" },
                    { new Guid("e4000000-0000-0000-0000-000000000010"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "history.retention", "unlimited", new Guid("44444444-4444-4444-4444-444444444444"), "string" },
                    { new Guid("e4000000-0000-0000-0000-000000000011"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "support.level", "Priority_24_7", new Guid("44444444-4444-4444-4444-444444444444"), "string" }
                });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "Plans",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "Code",
                value: "free");

            migrationBuilder.UpdateData(
                schema: "app",
                table: "Plans",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "Code", "PriceAmount" },
                values: new object[] { "monthly", 149000m });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "Plans",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "Code", "PriceAmount" },
                values: new object[] { "quarterly", 387000m });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "Plans",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                columns: new[] { "Code", "PriceAmount", "TrialDays" },
                values: new object[] { "yearly", 1308000m, 7 });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("a1000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "MaxValue", "PeriodType" },
                values: new object[] { "cv.storage", 1, "total" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("a2000000-0000-0000-0000-000000000000"),
                column: "FeatureKey",
                value: "cv.optimization");

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("a3000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "MaxValue" },
                values: new object[] { "interview.ai", 1 });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("a4000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "MaxValue", "PeriodType" },
                values: new object[] { "mentor.session", 0, "monthly" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("b1000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "MaxValue", "PeriodType" },
                values: new object[] { "cv.storage", 5, "total" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("b2000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "MaxValue" },
                values: new object[] { "cv.optimization", 3 });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("b3000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "MaxValue" },
                values: new object[] { "interview.ai", 1 });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("b4000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "MaxValue", "PeriodType" },
                values: new object[] { "mentor.session", 0, "monthly" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("c1000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "MaxValue", "PeriodType" },
                values: new object[] { "cv.storage", 10, "total" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("c2000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "MaxValue" },
                values: new object[] { "cv.optimization", 5 });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("c3000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "MaxValue" },
                values: new object[] { "interview.ai", 3 });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("c4000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "MaxValue", "PeriodType" },
                values: new object[] { "mentor.session", 3, "monthly" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("d1000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "IsUnlimited", "MaxValue", "PeriodType" },
                values: new object[] { "cv.storage", true, 999999, "total" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("d2000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "IsUnlimited", "MaxValue" },
                values: new object[] { "cv.optimization", true, 999999 });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("d3000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "IsUnlimited", "MaxValue" },
                values: new object[] { "interview.ai", true, 999999 });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("d4000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "MaxValue", "PeriodType" },
                values: new object[] { "mentor.session", 4, "monthly" });

            migrationBuilder.InsertData(
                schema: "app",
                table: "UsageQuotaPolicies",
                columns: new[] { "Id", "CreatedAt", "FeatureKey", "IsUnlimited", "MaxValue", "PeriodType", "PlanId", "ResetHourUtc" },
                values: new object[,]
                {
                    { new Guid("a5000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "multi_jd.match", false, 3, "per_match", new Guid("11111111-1111-1111-1111-111111111111"), null },
                    { new Guid("a6000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "resume.upload", false, 3, "daily", new Guid("11111111-1111-1111-1111-111111111111"), null },
                    { new Guid("a7000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "resume.parse", false, 3, "daily", new Guid("11111111-1111-1111-1111-111111111111"), null },
                    { new Guid("a8000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "jobdescription.create", false, 5, "daily", new Guid("11111111-1111-1111-1111-111111111111"), null },
                    { new Guid("a9000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "match.create", false, 3, "daily", new Guid("11111111-1111-1111-1111-111111111111"), null },
                    { new Guid("b5000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "multi_jd.match", false, 3, "per_match", new Guid("22222222-2222-2222-2222-222222222222"), null },
                    { new Guid("b6000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "resume.upload", false, 10, "daily", new Guid("22222222-2222-2222-2222-222222222222"), null },
                    { new Guid("b7000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "resume.parse", false, 10, "daily", new Guid("22222222-2222-2222-2222-222222222222"), null },
                    { new Guid("b8000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "jobdescription.create", false, 20, "daily", new Guid("22222222-2222-2222-2222-222222222222"), null },
                    { new Guid("b9000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "match.create", false, 10, "daily", new Guid("22222222-2222-2222-2222-222222222222"), null },
                    { new Guid("c5000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "multi_jd.match", false, 10, "per_match", new Guid("33333333-3333-3333-3333-333333333333"), null },
                    { new Guid("c6000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "resume.upload", false, 30, "daily", new Guid("33333333-3333-3333-3333-333333333333"), null },
                    { new Guid("c7000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "resume.parse", false, 30, "daily", new Guid("33333333-3333-3333-3333-333333333333"), null },
                    { new Guid("c8000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "jobdescription.create", false, 50, "daily", new Guid("33333333-3333-3333-3333-333333333333"), null },
                    { new Guid("c9000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "match.create", false, 30, "daily", new Guid("33333333-3333-3333-3333-333333333333"), null },
                    { new Guid("d5000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "multi_jd.match", false, 20, "per_match", new Guid("44444444-4444-4444-4444-444444444444"), null },
                    { new Guid("d6000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "resume.upload", true, 999999, "daily", new Guid("44444444-4444-4444-4444-444444444444"), null },
                    { new Guid("d7000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "resume.parse", true, 999999, "daily", new Guid("44444444-4444-4444-4444-444444444444"), null },
                    { new Guid("d8000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "jobdescription.create", true, 999999, "daily", new Guid("44444444-4444-4444-4444-444444444444"), null },
                    { new Guid("d9000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "match.create", true, 999999, "daily", new Guid("44444444-4444-4444-4444-444444444444"), null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000005"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000006"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000007"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000008"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000009"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000010"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000011"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000005"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000006"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000007"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000008"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000009"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000010"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000011"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000005"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000006"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000007"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000008"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000009"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000010"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000011"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000005"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000006"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000007"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000008"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000009"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000010"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "PlanEntitlements",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000011"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("a5000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("a6000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("a7000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("a8000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("a9000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("b5000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("b6000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("b7000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("b8000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("b9000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("c5000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("c6000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("c7000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("c8000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("c9000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("d5000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("d6000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("d7000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("d8000000-0000-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("d9000000-0000-0000-0000-000000000000"));

            migrationBuilder.UpdateData(
                schema: "app",
                table: "Plans",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "Code",
                value: "Free");

            migrationBuilder.UpdateData(
                schema: "app",
                table: "Plans",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "Code", "PriceAmount" },
                values: new object[] { "PremiumMonthly", 99000m });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "Plans",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "Code", "PriceAmount" },
                values: new object[] { "PremiumQuarterly", 249000m });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "Plans",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                columns: new[] { "Code", "PriceAmount", "TrialDays" },
                values: new object[] { "PremiumYearly", 899000m, 0 });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("a1000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "MaxValue", "PeriodType" },
                values: new object[] { "resume.upload", 3, "daily" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("a2000000-0000-0000-0000-000000000000"),
                column: "FeatureKey",
                value: "resume.parse");

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("a3000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "MaxValue" },
                values: new object[] { "jobdescription.create", 5 });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("a4000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "MaxValue", "PeriodType" },
                values: new object[] { "match.create", 3, "daily" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("b1000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "MaxValue", "PeriodType" },
                values: new object[] { "resume.upload", 20, "daily" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("b2000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "MaxValue" },
                values: new object[] { "resume.parse", 20 });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("b3000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "MaxValue" },
                values: new object[] { "jobdescription.create", 50 });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("b4000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "MaxValue", "PeriodType" },
                values: new object[] { "match.create", 30, "daily" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("c1000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "MaxValue", "PeriodType" },
                values: new object[] { "resume.upload", 30, "daily" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("c2000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "MaxValue" },
                values: new object[] { "resume.parse", 30 });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("c3000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "MaxValue" },
                values: new object[] { "jobdescription.create", 80 });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("c4000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "MaxValue", "PeriodType" },
                values: new object[] { "match.create", 50, "daily" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("d1000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "IsUnlimited", "MaxValue", "PeriodType" },
                values: new object[] { "resume.upload", false, 50, "daily" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("d2000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "IsUnlimited", "MaxValue" },
                values: new object[] { "resume.parse", false, 50 });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("d3000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "IsUnlimited", "MaxValue" },
                values: new object[] { "jobdescription.create", false, 150 });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("d4000000-0000-0000-0000-000000000000"),
                columns: new[] { "FeatureKey", "MaxValue", "PeriodType" },
                values: new object[] { "match.create", 100, "daily" });
        }
    }
}
