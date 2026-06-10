using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Interviet.Infrastructure.Persistence.MigrationsPostgres
{
    /// <inheritdoc />
    public partial class UpdateCvQuotaPolicies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("a1000000-0000-0000-0000-000000000000"),
                column: "MaxValue",
                value: 5);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("a2000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 5, "total" });

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
                keyValue: new Guid("b1000000-0000-0000-0000-000000000000"),
                column: "MaxValue",
                value: 30);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("b2000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 30, "subscription" });

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
                keyValue: new Guid("c1000000-0000-0000-0000-000000000000"),
                column: "MaxValue",
                value: 100);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("c2000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 100, "subscription" });

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
                keyValue: new Guid("d2000000-0000-0000-0000-000000000000"),
                column: "PeriodType",
                value: "subscription");

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
                keyValue: new Guid("e1000000-0000-0000-0000-000000000000"),
                column: "MaxValue",
                value: 3);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000000"),
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
                keyValue: new Guid("f1000000-0000-0000-0000-000000000000"),
                column: "MaxValue",
                value: 15);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("f2000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 15, "subscription" });

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
                keyValue: new Guid("a1000000-0000-0000-0000-000000000000"),
                column: "MaxValue",
                value: 1);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("a2000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 3, "daily" });

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
                keyValue: new Guid("b1000000-0000-0000-0000-000000000000"),
                column: "MaxValue",
                value: 5);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("b2000000-0000-0000-0000-000000000000"),
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
                keyValue: new Guid("c1000000-0000-0000-0000-000000000000"),
                column: "MaxValue",
                value: 10);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("c2000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 5, "daily" });

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
                keyValue: new Guid("d2000000-0000-0000-0000-000000000000"),
                column: "PeriodType",
                value: "daily");

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
                keyValue: new Guid("e1000000-0000-0000-0000-000000000000"),
                column: "MaxValue",
                value: 1);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000000"),
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
                keyValue: new Guid("f1000000-0000-0000-0000-000000000000"),
                column: "MaxValue",
                value: 1);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "UsageQuotaPolicies",
                keyColumn: "Id",
                keyValue: new Guid("f2000000-0000-0000-0000-000000000000"),
                columns: new[] { "MaxValue", "PeriodType" },
                values: new object[] { 3, "daily" });

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
