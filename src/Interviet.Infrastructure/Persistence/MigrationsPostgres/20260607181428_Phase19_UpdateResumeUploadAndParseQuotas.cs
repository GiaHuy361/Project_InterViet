using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Interviet.Infrastructure.Persistence.MigrationsPostgres
{
    /// <inheritdoc />
    public partial class Phase19_UpdateResumeUploadAndParseQuotas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("a6000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 5, "total" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("a7000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 5, "total" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("b6000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 30, "subscription" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("b7000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 30, "subscription" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("c6000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 100, "subscription" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("c7000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 100, "subscription" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("d6000000-0000-0000-0000-000000000000"),
                column: "PeriodType",
                value: "subscription");

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("d7000000-0000-0000-0000-000000000000"),
                column: "PeriodType",
                value: "subscription");

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000000"),
                column: "PeriodType",
                value: "subscription");

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("e7000000-0000-0000-0000-000000000000"),
                column: "PeriodType",
                value: "subscription");

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("f6000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 15, "subscription" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("f7000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 15, "subscription" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("a6000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 3, "daily" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("a7000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 3, "daily" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("b6000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 10, "daily" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("b7000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 10, "daily" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("c6000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 30, "daily" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("c7000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 30, "daily" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("d6000000-0000-0000-0000-000000000000"),
                column: "PeriodType",
                value: "daily");

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("d7000000-0000-0000-0000-000000000000"),
                column: "PeriodType",
                value: "daily");

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000000"),
                column: "PeriodType",
                value: "daily");

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("e7000000-0000-0000-0000-000000000000"),
                column: "PeriodType",
                value: "daily");

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("f6000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 3, "daily" });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("f7000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 3, "daily" });
        }
    }
}
