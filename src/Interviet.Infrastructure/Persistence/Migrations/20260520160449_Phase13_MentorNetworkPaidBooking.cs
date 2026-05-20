using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Interviet.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase13_MentorNetworkPaidBooking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MentorAvailabilitySlots_Mentors_MentorId",
                schema: "app",
                table: "MentorAvailabilitySlots");

            migrationBuilder.DropForeignKey(
                name: "FK_MentorBookings_Mentors_MentorId",
                schema: "app",
                table: "MentorBookings");

            migrationBuilder.DropTable(
                name: "Mentors",
                schema: "app");

            migrationBuilder.DropColumn(
                name: "MeetingMode",
                schema: "app",
                table: "MentorBookings");

            migrationBuilder.DropColumn(
                name: "SharedResumeVersionId",
                schema: "app",
                table: "MentorBookings");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                schema: "app",
                table: "MentorAvailabilitySlots");

            migrationBuilder.RenameColumn(
                name: "MeetingLink",
                schema: "app",
                table: "MentorBookings",
                newName: "MeetingUrl");

            migrationBuilder.AlterColumn<string>(
                name: "PlanKey",
                schema: "app",
                table: "PaymentTransactions",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                schema: "app",
                table: "PaymentTransactions",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Purpose",
                schema: "app",
                table: "PaymentTransactions",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "subscription_plan");

            migrationBuilder.AddColumn<Guid>(
                name: "ResourceId",
                schema: "app",
                table: "PaymentTransactions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Comment",
                schema: "app",
                table: "MentorReviews",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                schema: "app",
                table: "MentorReviews",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CandidateNotes",
                schema: "app",
                table: "MentorBookings",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CancelReason",
                schema: "app",
                table: "MentorBookings",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Amount",
                schema: "app",
                table: "MentorBookings",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "CurrencyCode",
                schema: "app",
                table: "MentorBookings",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "VND");

            migrationBuilder.AddColumn<string>(
                name: "ServiceType",
                schema: "app",
                table: "MentorBookings",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                schema: "app",
                table: "MentorBookings",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CurrencyCode",
                schema: "app",
                table: "MentorAvailabilitySlots",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "VND");

            migrationBuilder.AddColumn<decimal>(
                name: "PriceAmount",
                schema: "app",
                table: "MentorAvailabilitySlots",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReservedUntil",
                schema: "app",
                table: "MentorAvailabilitySlots",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "PlanKey",
                schema: "app",
                table: "Invoices",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                schema: "app",
                table: "Invoices",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Purpose",
                schema: "app",
                table: "Invoices",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "subscription_plan");

            migrationBuilder.AddColumn<Guid>(
                name: "ResourceId",
                schema: "app",
                table: "Invoices",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "PlanKey",
                schema: "app",
                table: "BillingCheckoutSessions",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<Guid>(
                name: "PlanId",
                schema: "app",
                table: "BillingCheckoutSessions",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                schema: "app",
                table: "BillingCheckoutSessions",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Purpose",
                schema: "app",
                table: "BillingCheckoutSessions",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "subscription_plan");

            migrationBuilder.AddColumn<Guid>(
                name: "ResourceId",
                schema: "app",
                table: "BillingCheckoutSessions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "MentorProfiles",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Headline = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    AvatarUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Bio = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    YearsOfExperience = table.Column<decimal>(type: "decimal(4,1)", nullable: false),
                    RatingAverage = table.Column<decimal>(type: "decimal(3,2)", nullable: false),
                    RatingCount = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MentorProfiles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MentorSpecialties",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MentorSpecialties", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MentorProfileSpecialties",
                schema: "app",
                columns: table => new
                {
                    MentorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SpecialtyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MentorProfileSpecialties", x => new { x.MentorId, x.SpecialtyId });
                    table.ForeignKey(
                        name: "FK_MentorProfileSpecialties_MentorProfiles_MentorId",
                        column: x => x.MentorId,
                        principalSchema: "app",
                        principalTable: "MentorProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MentorProfileSpecialties_MentorSpecialties_SpecialtyId",
                        column: x => x.SpecialtyId,
                        principalSchema: "app",
                        principalTable: "MentorSpecialties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MentorBookings_AvailabilitySlotId",
                schema: "app",
                table: "MentorBookings",
                column: "AvailabilitySlotId");

            migrationBuilder.CreateIndex(
                name: "IX_MentorProfileSpecialties_SpecialtyId",
                schema: "app",
                table: "MentorProfileSpecialties",
                column: "SpecialtyId");

            migrationBuilder.CreateIndex(
                name: "IX_MentorSpecialties_Code",
                schema: "app",
                table: "MentorSpecialties",
                column: "Code",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_MentorAvailabilitySlots_MentorProfiles_MentorId",
                schema: "app",
                table: "MentorAvailabilitySlots",
                column: "MentorId",
                principalSchema: "app",
                principalTable: "MentorProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_MentorBookings_MentorAvailabilitySlots_AvailabilitySlotId",
                schema: "app",
                table: "MentorBookings",
                column: "AvailabilitySlotId",
                principalSchema: "app",
                principalTable: "MentorAvailabilitySlots",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_MentorBookings_MentorProfiles_MentorId",
                schema: "app",
                table: "MentorBookings",
                column: "MentorId",
                principalSchema: "app",
                principalTable: "MentorProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MentorAvailabilitySlots_MentorProfiles_MentorId",
                schema: "app",
                table: "MentorAvailabilitySlots");

            migrationBuilder.DropForeignKey(
                name: "FK_MentorBookings_MentorAvailabilitySlots_AvailabilitySlotId",
                schema: "app",
                table: "MentorBookings");

            migrationBuilder.DropForeignKey(
                name: "FK_MentorBookings_MentorProfiles_MentorId",
                schema: "app",
                table: "MentorBookings");

            migrationBuilder.DropTable(
                name: "MentorProfileSpecialties",
                schema: "app");

            migrationBuilder.DropTable(
                name: "MentorProfiles",
                schema: "app");

            migrationBuilder.DropTable(
                name: "MentorSpecialties",
                schema: "app");

            migrationBuilder.DropIndex(
                name: "IX_MentorBookings_AvailabilitySlotId",
                schema: "app",
                table: "MentorBookings");

            migrationBuilder.DropColumn(
                name: "Description",
                schema: "app",
                table: "PaymentTransactions");

            migrationBuilder.DropColumn(
                name: "Purpose",
                schema: "app",
                table: "PaymentTransactions");

            migrationBuilder.DropColumn(
                name: "ResourceId",
                schema: "app",
                table: "PaymentTransactions");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                schema: "app",
                table: "MentorReviews");

            migrationBuilder.DropColumn(
                name: "Amount",
                schema: "app",
                table: "MentorBookings");

            migrationBuilder.DropColumn(
                name: "CurrencyCode",
                schema: "app",
                table: "MentorBookings");

            migrationBuilder.DropColumn(
                name: "ServiceType",
                schema: "app",
                table: "MentorBookings");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                schema: "app",
                table: "MentorBookings");

            migrationBuilder.DropColumn(
                name: "CurrencyCode",
                schema: "app",
                table: "MentorAvailabilitySlots");

            migrationBuilder.DropColumn(
                name: "PriceAmount",
                schema: "app",
                table: "MentorAvailabilitySlots");

            migrationBuilder.DropColumn(
                name: "ReservedUntil",
                schema: "app",
                table: "MentorAvailabilitySlots");

            migrationBuilder.DropColumn(
                name: "Description",
                schema: "app",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "Purpose",
                schema: "app",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "ResourceId",
                schema: "app",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "Description",
                schema: "app",
                table: "BillingCheckoutSessions");

            migrationBuilder.DropColumn(
                name: "Purpose",
                schema: "app",
                table: "BillingCheckoutSessions");

            migrationBuilder.DropColumn(
                name: "ResourceId",
                schema: "app",
                table: "BillingCheckoutSessions");

            migrationBuilder.RenameColumn(
                name: "MeetingUrl",
                schema: "app",
                table: "MentorBookings",
                newName: "MeetingLink");

            migrationBuilder.AlterColumn<string>(
                name: "PlanKey",
                schema: "app",
                table: "PaymentTransactions",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Comment",
                schema: "app",
                table: "MentorReviews",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CandidateNotes",
                schema: "app",
                table: "MentorBookings",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(2000)",
                oldMaxLength: 2000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CancelReason",
                schema: "app",
                table: "MentorBookings",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MeetingMode",
                schema: "app",
                table: "MentorBookings",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SharedResumeVersionId",
                schema: "app",
                table: "MentorBookings",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                schema: "app",
                table: "MentorAvailabilitySlots",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AlterColumn<string>(
                name: "PlanKey",
                schema: "app",
                table: "Invoices",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "PlanKey",
                schema: "app",
                table: "BillingCheckoutSessions",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "PlanId",
                schema: "app",
                table: "BillingCheckoutSessions",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "Mentors",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Bio = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpertiseJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FullName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Headline = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    RatingAverage = table.Column<decimal>(type: "decimal(4,2)", nullable: true),
                    RatingCount = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    YearsOfExperience = table.Column<decimal>(type: "decimal(5,2)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Mentors", x => x.Id);
                });

            migrationBuilder.AddForeignKey(
                name: "FK_MentorAvailabilitySlots_Mentors_MentorId",
                schema: "app",
                table: "MentorAvailabilitySlots",
                column: "MentorId",
                principalSchema: "app",
                principalTable: "Mentors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_MentorBookings_Mentors_MentorId",
                schema: "app",
                table: "MentorBookings",
                column: "MentorId",
                principalSchema: "app",
                principalTable: "Mentors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
