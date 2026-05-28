using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Interviet.Infrastructure.Persistence.MigrationsPostgres
{
    /// <inheritdoc />
    public partial class Phase19_PostgreSqlRenderMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "app");

            migrationBuilder.CreateTable(
                name: "AccountDeletionRequests",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    RequestedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ScheduledDeleteAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Reason = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccountDeletionRequests", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ActivityLogs",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ActionKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EntityType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    EntityId = table.Column<Guid>(type: "uuid", nullable: true),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    MetadataJson = table.Column<string>(type: "text", nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivityLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AdminActionLogs",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AdminUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ActionKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TargetEntityType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TargetEntityId = table.Column<Guid>(type: "uuid", nullable: true),
                    Details = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdminActionLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AiJobs",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    JobType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ReferenceType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ReferenceId = table.Column<Guid>(type: "uuid", nullable: true),
                    ExternalJobId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CorrelationId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IdempotencyKey = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    RequestedPayloadJson = table.Column<string>(type: "text", nullable: true),
                    ResponsePayloadJson = table.Column<string>(type: "text", nullable: true),
                    ErrorCode = table.Column<string>(type: "text", nullable: true),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true),
                    SchemaVersion = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    ModelVersion = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    RequestedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiJobs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ActorId = table.Column<Guid>(type: "uuid", nullable: true),
                    ActorEmail = table.Column<string>(type: "text", nullable: true),
                    ActorRole = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Action = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Resource = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ResourceId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    MetadataJson = table.Column<string>(type: "text", nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BillingPaymentAttempts",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CheckoutSessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Provider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Method = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PayerAccountNumberMasked = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PayerAccountName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    AmountPaid = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CurrencyCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "VND"),
                    TransferContent = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    ExpectedTransferContent = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    TransactionReference = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    RejectionReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillingPaymentAttempts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BillingProfiles",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    BillingName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    TaxCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CompanyName = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    BillingEmail = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: true),
                    BillingAddress = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillingProfiles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BlogArticles",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    Slug = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    Author = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    CoverImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IsPublished = table.Column<bool>(type: "boolean", nullable: false),
                    PublishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BlogArticles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CandidateProfiles",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Headline = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    Summary = table.Column<string>(type: "text", nullable: true),
                    DesiredRole = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    YearsOfExperience = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    CurrentLocation = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    PreferredLocation = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    SalaryExpectationMin = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    SalaryExpectationMax = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    CompletenessScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false, defaultValue: 0m),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CandidateProfiles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ConsentRecords",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ConsentType = table.Column<string>(type: "text", nullable: false),
                    Accepted = table.Column<bool>(type: "boolean", nullable: false),
                    Version = table.Column<string>(type: "text", nullable: false),
                    AcceptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    MetadataJson = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConsentRecords", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DashboardSnapshots",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    SnapshotDate = table.Column<DateOnly>(type: "date", nullable: false),
                    AverageMatchScore = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    BestMatchScore = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    CvOptimizationUsedToday = table.Column<int>(type: "integer", nullable: false),
                    InterviewUsedToday = table.Column<int>(type: "integer", nullable: false),
                    UpcomingMentorCount = table.Column<int>(type: "integer", nullable: false),
                    RecentSummaryJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DashboardSnapshots", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DataExportRequests",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ExportedFileId = table.Column<Guid>(type: "uuid", nullable: true),
                    RequestedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FailedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DataExportRequests", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EmailCenterMessages",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Subject = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    BodyPreview = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsMarketing = table.Column<bool>(type: "boolean", nullable: false),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    ReadAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RelatedEmailLogId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailCenterMessages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EmailMessageLogs",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    TemplateCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ToAddress = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    Subject = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Provider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ProviderMessageId = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true),
                    MetadataJson = table.Column<string>(type: "text", nullable: true),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailMessageLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EmailTemplates",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SubjectTemplate = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    BodyHtmlTemplate = table.Column<string>(type: "text", nullable: false),
                    BodyTextTemplate = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailTemplates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FaqItems",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Question = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Answer = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FaqItems", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "InterviewSessions",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ResumeVersionId = table.Column<Guid>(type: "uuid", nullable: true),
                    RoleName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    SeniorityLevel = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    InterviewType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DurationMinutes = table.Column<int>(type: "integer", nullable: false),
                    Goal = table.Column<string>(type: "text", nullable: true),
                    Mode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AiModel = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    InterviewerMode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ExternalSessionId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CorrelationId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FailedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ErrorCode = table.Column<string>(type: "text", nullable: true),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InterviewSessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Invoices",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    SubscriptionId = table.Column<Guid>(type: "uuid", nullable: true),
                    PaymentTransactionId = table.Column<Guid>(type: "uuid", nullable: true),
                    CheckoutSessionId = table.Column<Guid>(type: "uuid", nullable: true),
                    PlanId = table.Column<Guid>(type: "uuid", nullable: true),
                    PlanKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    InvoiceNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CurrencyCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    IssuedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DueAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PaidAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PdfFileId = table.Column<Guid>(type: "uuid", nullable: true),
                    MetadataJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Purpose = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "subscription_plan"),
                    ResourceId = table.Column<Guid>(type: "uuid", nullable: true),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Invoices", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "JobBookmarks",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    JobDescriptionId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobBookmarks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "JobDescriptions",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    CompanyName = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    Location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    SalaryText = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    SourceUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    RawText = table.Column<string>(type: "text", nullable: false),
                    NormalizedText = table.Column<string>(type: "text", nullable: true),
                    PostedAt = table.Column<DateOnly>(type: "date", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobDescriptions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MatchSessions",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ResumeId = table.Column<Guid>(type: "uuid", nullable: false),
                    ResumeVersionId = table.Column<Guid>(type: "uuid", nullable: false),
                    JobDescriptionId = table.Column<Guid>(type: "uuid", nullable: true),
                    SessionType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    TargetCount = table.Column<int>(type: "integer", nullable: false),
                    OverallBestScore = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    ExternalJobId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CorrelationId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    RequestId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    RequestedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FailedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ErrorCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ErrorMessage = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MatchSessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MentorProfiles",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsVerified = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    FullName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Headline = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    AvatarUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Bio = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ExpertiseJson = table.Column<string>(type: "text", nullable: true),
                    IndustriesJson = table.Column<string>(type: "text", nullable: true),
                    LanguagesJson = table.Column<string>(type: "text", nullable: true),
                    YearsOfExperience = table.Column<decimal>(type: "numeric(4,1)", nullable: false),
                    RatingAverage = table.Column<decimal>(type: "numeric(3,2)", nullable: false),
                    RatingCount = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
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
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MentorSpecialties", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NotificationPreferences",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    InAppNotificationsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    EmailNotificationsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    BillingNotificationsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    ResumeNotificationsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    MatchingNotificationsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    InterviewNotificationsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    MentorNotificationsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    SystemNotificationsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationPreferences", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Title = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    Message = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Priority = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "normal"),
                    ActionUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DataJson = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    ReadAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeduplicationKey = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OnboardingProgress",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    StepCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SkippedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OnboardingProgress", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PaymentTransactions",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    SubscriptionId = table.Column<Guid>(type: "uuid", nullable: true),
                    PlanId = table.Column<Guid>(type: "uuid", nullable: true),
                    PlanKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CheckoutSessionId = table.Column<Guid>(type: "uuid", nullable: true),
                    Provider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    MethodType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ExternalOrderId = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    ExternalTransactionId = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    IdempotencyKey = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CurrencyCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    PaidAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FailedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FailureCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    FailureMessage = table.Column<string>(type: "text", nullable: true),
                    RawPayloadJson = table.Column<string>(type: "text", nullable: true),
                    Purpose = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "subscription_plan"),
                    ResourceId = table.Column<Guid>(type: "uuid", nullable: true),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentTransactions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PaymentWebhookLogs",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Provider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ExternalEventId = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    SignatureValid = table.Column<bool>(type: "boolean", nullable: false),
                    PayloadJson = table.Column<string>(type: "text", nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ProcessingStatus = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentWebhookLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Plans",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    BillingCycle = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    PriceAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CurrencyCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "VND"),
                    TrialDays = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Plans", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PublicContactRequests",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FullName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    Phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Subject = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Message = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PublicContactRequests", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PublicStats",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Value = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Label = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Icon = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PublicStats", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "QuotaConsumptionLogs",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    FeatureKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PeriodType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PeriodKey = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    DeltaValue = table.Column<int>(type: "integer", nullable: false),
                    ReferenceType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ReferenceId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuotaConsumptionLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ReportShareLinks",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReportType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ResourceId = table.Column<Guid>(type: "uuid", nullable: false),
                    TokenHash = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TokenPreview = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RevokedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AllowPdfDownload = table.Column<bool>(type: "boolean", nullable: false),
                    ViewCount = table.Column<int>(type: "integer", nullable: false),
                    LastViewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReportShareLinks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ResumeOptimizationSessions",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ResumeVersionId = table.Column<Guid>(type: "uuid", nullable: false),
                    JobDescriptionId = table.Column<Guid>(type: "uuid", nullable: true),
                    MatchResultId = table.Column<Guid>(type: "uuid", nullable: true),
                    SuggestionsJson = table.Column<string>(type: "text", nullable: true),
                    ExportedPdfFileId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResumeOptimizationSessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Skills",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    NormalizedName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    SkillType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Skills", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StoredPaymentMethods",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Provider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    MethodType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ProviderReference = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    MaskedDisplay = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StoredPaymentMethods", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SupportTickets",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TicketNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Priority = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Subject = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    AssignedTo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ClosedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastMessageAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupportTickets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TermsAcceptances",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TermsVersion = table.Column<string>(type: "text", nullable: false),
                    PrivacyVersion = table.Column<string>(type: "text", nullable: true),
                    AcceptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TermsAcceptances", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Testimonials",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    AuthorRole = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Content = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    AvatarUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Rating = table.Column<decimal>(type: "numeric(3,2)", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsFeatured = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Testimonials", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UploadedFiles",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    FileCategory = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    OriginalFileName = table.Column<string>(type: "character varying(260)", maxLength: 260, nullable: false),
                    StoredFileName = table.Column<string>(type: "character varying(260)", maxLength: 260, nullable: false),
                    StorageProvider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    StoragePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    MimeType = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    FileExtension = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    Sha256Hash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UploadedFiles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UsageQuotaPolicies",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    FeatureKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PeriodType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    MaxValue = table.Column<int>(type: "integer", nullable: false),
                    ResetHourUtc = table.Column<byte>(type: "smallint", nullable: true),
                    IsUnlimited = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsageQuotaPolicies", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserDailyUsages",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    UsageDate = table.Column<DateOnly>(type: "date", nullable: false),
                    CvOptimizationCount = table.Column<int>(type: "integer", nullable: false),
                    InterviewCount = table.Column<int>(type: "integer", nullable: false),
                    MultiMatchCount = table.Column<int>(type: "integer", nullable: false),
                    MentorBookingCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserDailyUsages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserFeedbacks",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    FeedbackType = table.Column<string>(type: "text", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: true),
                    Content = table.Column<string>(type: "text", nullable: false),
                    MetadataJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserFeedbacks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserQuotaCounters",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    FeatureKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PeriodType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PeriodKey = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    UsedValue = table.Column<int>(type: "integer", nullable: false),
                    RemainingValue = table.Column<int>(type: "integer", nullable: true),
                    LastConsumedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "bytea", rowVersion: true, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserQuotaCounters", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    NormalizedEmail = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: true),
                    FullName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PhoneNumber = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    AvatarUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "active"),
                    CurrentPlanCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    IsEmailVerified = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    EmailVerifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LockedUntil = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FailedLoginCount = table.Column<int>(type: "integer", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TrialUsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TimeZone = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Locale = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "bytea", rowVersion: true, nullable: false),
                    RoleCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "candidate"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Certifications",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CandidateProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    Issuer = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    IssuedDate = table.Column<DateOnly>(type: "date", nullable: true),
                    ExpiryDate = table.Column<DateOnly>(type: "date", nullable: true),
                    CredentialId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CredentialUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Certifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Certifications_CandidateProfiles_CandidateProfileId",
                        column: x => x.CandidateProfileId,
                        principalSchema: "app",
                        principalTable: "CandidateProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Educations",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CandidateProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    SchoolName = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    Degree = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    FieldOfStudy = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: true),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Grade = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Educations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Educations_CandidateProfiles_CandidateProfileId",
                        column: x => x.CandidateProfileId,
                        principalSchema: "app",
                        principalTable: "CandidateProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ExternalLinks",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CandidateProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    LinkType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Title = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    Url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExternalLinks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExternalLinks_CandidateProfiles_CandidateProfileId",
                        column: x => x.CandidateProfileId,
                        principalSchema: "app",
                        principalTable: "CandidateProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LanguageProfiles",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CandidateProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    LanguageCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    LanguageName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ProficiencyLevel = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LanguageProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LanguageProfiles_CandidateProfiles_CandidateProfileId",
                        column: x => x.CandidateProfileId,
                        principalSchema: "app",
                        principalTable: "CandidateProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WorkExperiences",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CandidateProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyName = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    JobTitle = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    EmploymentType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: true),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: true),
                    IsCurrent = table.Column<bool>(type: "boolean", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    MetricsSummary = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkExperiences", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkExperiences_CandidateProfiles_CandidateProfileId",
                        column: x => x.CandidateProfileId,
                        principalSchema: "app",
                        principalTable: "CandidateProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "InterviewQuestions",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InterviewSessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestionNumber = table.Column<int>(type: "integer", nullable: false),
                    QuestionType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    QuestionText = table.Column<string>(type: "text", nullable: false),
                    ExpectedAnswerPointsJson = table.Column<string>(type: "text", nullable: true),
                    Difficulty = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    AskedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InterviewQuestions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InterviewQuestions_InterviewSessions_InterviewSessionId",
                        column: x => x.InterviewSessionId,
                        principalSchema: "app",
                        principalTable: "InterviewSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "InterviewRealtimeSessions",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InterviewSessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Provider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ProviderSessionId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Model = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ConnectUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ClientSecretHash = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EndedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ErrorCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ErrorMessage = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InterviewRealtimeSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InterviewRealtimeSessions_InterviewSessions_InterviewSessio~",
                        column: x => x.InterviewSessionId,
                        principalSchema: "app",
                        principalTable: "InterviewSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "InterviewReports",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InterviewSessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    OverallScore = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    ConfidenceScore = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    VoiceClarityScore = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    PaceScore = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    FillerWordScore = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    StrengthsJson = table.Column<string>(type: "text", nullable: true),
                    WeaknessesJson = table.Column<string>(type: "text", nullable: true),
                    RecommendationsJson = table.Column<string>(type: "text", nullable: true),
                    BenchmarkJson = table.Column<string>(type: "text", nullable: true),
                    SchemaVersion = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    ModelVersion = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ExportedPdfFileId = table.Column<Guid>(type: "uuid", nullable: true),
                    ScoreBreakdownsJson = table.Column<string>(type: "text", nullable: true),
                    FeedbackItemsJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InterviewReports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InterviewReports_InterviewSessions_InterviewSessionId",
                        column: x => x.InterviewSessionId,
                        principalSchema: "app",
                        principalTable: "InterviewSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "InterviewTranscripts",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InterviewSessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    FullTranscript = table.Column<string>(type: "text", nullable: true),
                    TranscriptLanguage = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InterviewTranscripts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InterviewTranscripts_InterviewSessions_InterviewSessionId",
                        column: x => x.InterviewSessionId,
                        principalSchema: "app",
                        principalTable: "InterviewSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MatchTargets",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MatchSessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    JobDescriptionId = table.Column<Guid>(type: "uuid", nullable: false),
                    RankOrder = table.Column<int>(type: "integer", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ErrorCode = table.Column<string>(type: "text", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MatchTargets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MatchTargets_MatchSessions_MatchSessionId",
                        column: x => x.MatchSessionId,
                        principalSchema: "app",
                        principalTable: "MatchSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MentorAvailabilitySlots",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MentorId = table.Column<Guid>(type: "uuid", nullable: false),
                    StartsAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndsAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ReservedUntil = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PriceAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CurrencyCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "VND")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MentorAvailabilitySlots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MentorAvailabilitySlots_MentorProfiles_MentorId",
                        column: x => x.MentorId,
                        principalSchema: "app",
                        principalTable: "MentorProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MentorProfileSpecialties",
                schema: "app",
                columns: table => new
                {
                    MentorId = table.Column<Guid>(type: "uuid", nullable: false),
                    SpecialtyId = table.Column<Guid>(type: "uuid", nullable: false)
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

            migrationBuilder.CreateTable(
                name: "BillingCheckoutSessions",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderCode = table.Column<long>(type: "bigint", nullable: false),
                    PlanId = table.Column<Guid>(type: "uuid", nullable: true),
                    PlanKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Provider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CurrencyCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "VND"),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ReturnUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CancelUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CheckoutUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FailureReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Purpose = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "subscription_plan"),
                    ResourceId = table.Column<Guid>(type: "uuid", nullable: true),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PaymentTransactionId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillingCheckoutSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BillingCheckoutSessions_PaymentTransactions_PaymentTransact~",
                        column: x => x.PaymentTransactionId,
                        principalSchema: "app",
                        principalTable: "PaymentTransactions",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "PlanEntitlements",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    FeatureKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FeatureValue = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ValueType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlanEntitlements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlanEntitlements_Plans_PlanId",
                        column: x => x.PlanId,
                        principalSchema: "app",
                        principalTable: "Plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Subscriptions",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    PlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    TrialStartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TrialEndsAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CurrentPeriodStartsAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CurrentPeriodEndsAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CancelAtPeriodEnd = table.Column<bool>(type: "boolean", nullable: false),
                    CancelledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExpiredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AutoRenewEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    StoredPaymentMethodId = table.Column<Guid>(type: "uuid", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "bytea", rowVersion: true, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Subscriptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Subscriptions_Plans_PlanId",
                        column: x => x.PlanId,
                        principalSchema: "app",
                        principalTable: "Plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CandidateSkills",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CandidateProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    SkillId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProficiencyLevel = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    YearsUsed = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    LastUsedYear = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CandidateSkills", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CandidateSkills_CandidateProfiles_CandidateProfileId",
                        column: x => x.CandidateProfileId,
                        principalSchema: "app",
                        principalTable: "CandidateProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CandidateSkills_Skills_SkillId",
                        column: x => x.SkillId,
                        principalSchema: "app",
                        principalTable: "Skills",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SupportTicketMessages",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SupportTicketId = table.Column<Guid>(type: "uuid", nullable: false),
                    SenderType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    SenderUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    MessageBody = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsInternalNote = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupportTicketMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SupportTicketMessages_SupportTickets_SupportTicketId",
                        column: x => x.SupportTicketId,
                        principalSchema: "app",
                        principalTable: "SupportTickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EmailVerificationTokens",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TokenHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsUsed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    UsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailVerificationTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmailVerificationTokens_Users_UserId",
                        column: x => x.UserId,
                        principalSchema: "app",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ExternalLogins",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Provider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ProviderKey = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    LastUsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExternalLogins", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExternalLogins_Users_UserId",
                        column: x => x.UserId,
                        principalSchema: "app",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PasswordResetTokens",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TokenHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsUsed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    UsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PasswordResetTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PasswordResetTokens_Users_UserId",
                        column: x => x.UserId,
                        principalSchema: "app",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RefreshTokens",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserSessionId = table.Column<Guid>(type: "uuid", nullable: true),
                    TokenHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    DeviceName = table.Column<string>(type: "text", nullable: true),
                    IpAddress = table.Column<string>(type: "text", nullable: true),
                    UserAgent = table.Column<string>(type: "text", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsRevoked = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    RevokedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReplacedByTokenHash = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefreshTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RefreshTokens_Users_UserId",
                        column: x => x.UserId,
                        principalSchema: "app",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserRoles",
                schema: "app",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoleId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AssignedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_UserRoles_Roles_RoleId",
                        column: x => x.RoleId,
                        principalSchema: "app",
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserRoles_Users_UserId",
                        column: x => x.UserId,
                        principalSchema: "app",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserSessions",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    DeviceName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    DeviceType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    LastSeenAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserSessions_Users_UserId",
                        column: x => x.UserId,
                        principalSchema: "app",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "InterviewAnswers",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InterviewQuestionId = table.Column<Guid>(type: "uuid", nullable: false),
                    AnswerText = table.Column<string>(type: "text", nullable: true),
                    AudioFileUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    AudioDurationSeconds = table.Column<int>(type: "integer", nullable: true),
                    TranscriptionConfidence = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    AnswerScore = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    Feedback = table.Column<string>(type: "text", nullable: true),
                    ClarityScore = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    RelevanceScore = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    CompletenessScore = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    PositivePointsJson = table.Column<string>(type: "text", nullable: true),
                    NegativePointsJson = table.Column<string>(type: "text", nullable: true),
                    SuggestionsJson = table.Column<string>(type: "text", nullable: true),
                    AnsweredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InterviewAnswers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InterviewAnswers_InterviewQuestions_InterviewQuestionId",
                        column: x => x.InterviewQuestionId,
                        principalSchema: "app",
                        principalTable: "InterviewQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "InterviewRealtimeEvents",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InterviewSessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    RealtimeSessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    SequenceNumber = table.Column<int>(type: "integer", nullable: false),
                    EventType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Role = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Text = table.Column<string>(type: "text", nullable: true),
                    ProviderEventId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    OccurredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    MetadataJson = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InterviewRealtimeEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InterviewRealtimeEvents_InterviewRealtimeSessions_RealtimeS~",
                        column: x => x.RealtimeSessionId,
                        principalSchema: "app",
                        principalTable: "InterviewRealtimeSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "InterviewFeedbackItems",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InterviewReportId = table.Column<Guid>(type: "uuid", nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Title = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    Details = table.Column<string>(type: "text", nullable: false),
                    PriorityLevel = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InterviewFeedbackItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InterviewFeedbackItems_InterviewReports_InterviewReportId",
                        column: x => x.InterviewReportId,
                        principalSchema: "app",
                        principalTable: "InterviewReports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "InterviewScoreBreakdowns",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InterviewReportId = table.Column<Guid>(type: "uuid", nullable: false),
                    DimensionCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DimensionName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Score = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    MaxScore = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InterviewScoreBreakdowns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InterviewScoreBreakdowns_InterviewReports_InterviewReportId",
                        column: x => x.InterviewReportId,
                        principalSchema: "app",
                        principalTable: "InterviewReports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "InterviewTranscriptSegments",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InterviewTranscriptId = table.Column<Guid>(type: "uuid", nullable: false),
                    Speaker = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    SegmentOrder = table.Column<int>(type: "integer", nullable: false),
                    StartedAtSeconds = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    EndedAtSeconds = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    Content = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InterviewTranscriptSegments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InterviewTranscriptSegments_InterviewTranscripts_InterviewT~",
                        column: x => x.InterviewTranscriptId,
                        principalSchema: "app",
                        principalTable: "InterviewTranscripts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MatchResults",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MatchSessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    MatchTargetId = table.Column<Guid>(type: "uuid", nullable: false),
                    TotalScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    TechnicalScore = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    ExperienceScore = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    EducationScore = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    SoftSkillScore = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    LanguageScore = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    MatchBand = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    SummaryText = table.Column<string>(type: "text", nullable: true),
                    MatchedSkillsJson = table.Column<string>(type: "text", nullable: true),
                    StrengthsJson = table.Column<string>(type: "text", nullable: true),
                    WeaknessesJson = table.Column<string>(type: "text", nullable: true),
                    MissingSkillsJson = table.Column<string>(type: "text", nullable: true),
                    SuggestionsJson = table.Column<string>(type: "text", nullable: true),
                    RawResponseJson = table.Column<string>(type: "text", nullable: true),
                    SchemaVersion = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    ModelVersion = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MatchResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MatchResults_MatchTargets_MatchTargetId",
                        column: x => x.MatchTargetId,
                        principalSchema: "app",
                        principalTable: "MatchTargets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "MentorBookings",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    MentorId = table.Column<Guid>(type: "uuid", nullable: false),
                    AvailabilitySlotId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ScheduledStartsAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ScheduledEndsAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ServiceType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CurrencyCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "VND"),
                    MeetingUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CandidateNotes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CancelReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MentorBookings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MentorBookings_MentorAvailabilitySlots_AvailabilitySlotId",
                        column: x => x.AvailabilitySlotId,
                        principalSchema: "app",
                        principalTable: "MentorAvailabilitySlots",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MentorBookings_MentorProfiles_MentorId",
                        column: x => x.MentorId,
                        principalSchema: "app",
                        principalTable: "MentorProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SubscriptionChangeLogs",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SubscriptionId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChangeType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FromPlanId = table.Column<Guid>(type: "uuid", nullable: true),
                    ToPlanId = table.Column<Guid>(type: "uuid", nullable: true),
                    EffectiveAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    MetadataJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubscriptionChangeLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SubscriptionChangeLogs_Subscriptions_SubscriptionId",
                        column: x => x.SubscriptionId,
                        principalSchema: "app",
                        principalTable: "Subscriptions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MatchInsights",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MatchResultId = table.Column<Guid>(type: "uuid", nullable: false),
                    InsightType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Title = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MatchInsights", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MatchInsights_MatchResults_MatchResultId",
                        column: x => x.MatchResultId,
                        principalSchema: "app",
                        principalTable: "MatchResults",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MentorReviews",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MentorBookingId = table.Column<Guid>(type: "uuid", nullable: false),
                    MentorId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: false),
                    Comment = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MentorReviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MentorReviews_MentorBookings_MentorBookingId",
                        column: x => x.MentorBookingId,
                        principalSchema: "app",
                        principalTable: "MentorBookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ResumeParsedData",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ResumeId = table.Column<Guid>(type: "uuid", nullable: false),
                    ResumeVersionId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RawText = table.Column<string>(type: "text", nullable: true),
                    DetectedLanguage = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    SectionsJson = table.Column<string>(type: "text", nullable: true),
                    SkillsJson = table.Column<string>(type: "text", nullable: true),
                    ExperiencesJson = table.Column<string>(type: "text", nullable: true),
                    EducationsJson = table.Column<string>(type: "text", nullable: true),
                    ProjectsJson = table.Column<string>(type: "text", nullable: true),
                    CertificationsJson = table.Column<string>(type: "text", nullable: true),
                    LanguagesJson = table.Column<string>(type: "text", nullable: true),
                    WarningsJson = table.Column<string>(type: "text", nullable: true),
                    ParseTextLength = table.Column<int>(type: "integer", nullable: true),
                    ParseWarningCount = table.Column<int>(type: "integer", nullable: true),
                    ParseConfidenceScore = table.Column<decimal>(type: "numeric", nullable: true),
                    ParseQuality = table.Column<string>(type: "text", nullable: true),
                    DetectedSectionsJson = table.Column<string>(type: "text", nullable: true),
                    MissingSectionsJson = table.Column<string>(type: "text", nullable: true),
                    ModelVersion = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    SchemaVersion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResumeParsedData", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ResumeParseJobs",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ResumeVersionId = table.Column<Guid>(type: "uuid", nullable: false),
                    ResumeId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Provider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "python"),
                    CorrelationId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    RequestId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ExternalJobId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    RawResponse = table.Column<string>(type: "text", nullable: true),
                    RequestedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ErrorCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ErrorMessage = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    RetryCount = table.Column<int>(type: "integer", nullable: false),
                    ModelVersion = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    SchemaVersion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResumeParseJobs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Resumes",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    VersionNumber = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    ActiveVersionId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Resumes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ResumeVersions",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ResumeId = table.Column<Guid>(type: "uuid", nullable: false),
                    UploadedFileId = table.Column<Guid>(type: "uuid", nullable: false),
                    VersionNumber = table.Column<int>(type: "integer", nullable: false),
                    ParseStatus = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Source = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "upload"),
                    ContentType = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    ExtractedText = table.Column<string>(type: "text", nullable: true),
                    ParsedJson = table.Column<string>(type: "text", nullable: true),
                    ParseError = table.Column<string>(type: "text", nullable: true),
                    ProcessingError = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    LastProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResumeVersions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ResumeVersions_Resumes_ResumeId",
                        column: x => x.ResumeId,
                        principalSchema: "app",
                        principalTable: "Resumes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ResumeVersions_UploadedFiles_UploadedFileId",
                        column: x => x.UploadedFileId,
                        principalSchema: "app",
                        principalTable: "UploadedFiles",
                        principalColumn: "Id");
                });

            migrationBuilder.InsertData(
                schema: "app",
                table: "Plans",
                columns: new[] { "Id", "BillingCycle", "Code", "CreatedAt", "CurrencyCode", "IsActive", "Name", "PriceAmount", "SortOrder", "TrialDays", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111111"), "free", "free", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "VND", true, "Free Plan", 0m, 1, 0, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("22222222-2222-2222-2222-222222222222"), "monthly", "monthly", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "VND", true, "Premium (Monthly)", 149000m, 2, 0, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("33333333-3333-3333-3333-333333333333"), "quarterly", "quarterly", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "VND", true, "Premium (Quarterly)", 387000m, 3, 0, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("44444444-4444-4444-4444-444444444444"), "yearly", "yearly", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "VND", true, "Premium (Yearly)", 1308000m, 4, 7, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.InsertData(
                schema: "app",
                table: "Roles",
                columns: new[] { "Id", "Code", "CreatedAt", "Description", "Name" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111111"), "candidate", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Candidate" },
                    { new Guid("22222222-2222-2222-2222-222222222222"), "mentor", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Mentor" },
                    { new Guid("33333333-3333-3333-3333-333333333333"), "admin", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Administrator" },
                    { new Guid("44444444-4444-4444-4444-444444444444"), "support", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Support" }
                });

            migrationBuilder.InsertData(
                schema: "app",
                table: "UsageQuotaPolicies",
                columns: new[] { "Id", "CreatedAt", "FeatureKey", "IsUnlimited", "MaxValue", "PeriodType", "PlanId", "ResetHourUtc" },
                values: new object[,]
                {
                    { new Guid("a1000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "cv.storage", false, 1, "total", new Guid("11111111-1111-1111-1111-111111111111"), null },
                    { new Guid("a2000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "cv.optimization", false, 3, "daily", new Guid("11111111-1111-1111-1111-111111111111"), null },
                    { new Guid("a3000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "interview.ai", false, 1, "daily", new Guid("11111111-1111-1111-1111-111111111111"), null },
                    { new Guid("a4000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "mentor.session", false, 0, "monthly", new Guid("11111111-1111-1111-1111-111111111111"), null },
                    { new Guid("a5000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "multi_jd.match", false, 3, "per_match", new Guid("11111111-1111-1111-1111-111111111111"), null },
                    { new Guid("a6000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "resume.upload", false, 3, "daily", new Guid("11111111-1111-1111-1111-111111111111"), null },
                    { new Guid("a7000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "resume.parse", false, 3, "daily", new Guid("11111111-1111-1111-1111-111111111111"), null },
                    { new Guid("a8000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "jobdescription.create", false, 5, "daily", new Guid("11111111-1111-1111-1111-111111111111"), null },
                    { new Guid("a9000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "match.create", false, 3, "daily", new Guid("11111111-1111-1111-1111-111111111111"), null },
                    { new Guid("b1000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "cv.storage", false, 5, "total", new Guid("22222222-2222-2222-2222-222222222222"), null },
                    { new Guid("b2000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "cv.optimization", false, 3, "daily", new Guid("22222222-2222-2222-2222-222222222222"), null },
                    { new Guid("b3000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "interview.ai", false, 1, "daily", new Guid("22222222-2222-2222-2222-222222222222"), null },
                    { new Guid("b4000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "mentor.session", false, 0, "monthly", new Guid("22222222-2222-2222-2222-222222222222"), null },
                    { new Guid("b5000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "multi_jd.match", false, 3, "per_match", new Guid("22222222-2222-2222-2222-222222222222"), null },
                    { new Guid("b6000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "resume.upload", false, 10, "daily", new Guid("22222222-2222-2222-2222-222222222222"), null },
                    { new Guid("b7000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "resume.parse", false, 10, "daily", new Guid("22222222-2222-2222-2222-222222222222"), null },
                    { new Guid("b8000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "jobdescription.create", false, 20, "daily", new Guid("22222222-2222-2222-2222-222222222222"), null },
                    { new Guid("b9000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "match.create", false, 10, "daily", new Guid("22222222-2222-2222-2222-222222222222"), null },
                    { new Guid("c1000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "cv.storage", false, 10, "total", new Guid("33333333-3333-3333-3333-333333333333"), null },
                    { new Guid("c2000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "cv.optimization", false, 5, "daily", new Guid("33333333-3333-3333-3333-333333333333"), null },
                    { new Guid("c3000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "interview.ai", false, 3, "daily", new Guid("33333333-3333-3333-3333-333333333333"), null },
                    { new Guid("c4000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "mentor.session", false, 3, "monthly", new Guid("33333333-3333-3333-3333-333333333333"), null },
                    { new Guid("c5000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "multi_jd.match", false, 10, "per_match", new Guid("33333333-3333-3333-3333-333333333333"), null },
                    { new Guid("c6000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "resume.upload", false, 30, "daily", new Guid("33333333-3333-3333-3333-333333333333"), null },
                    { new Guid("c7000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "resume.parse", false, 30, "daily", new Guid("33333333-3333-3333-3333-333333333333"), null },
                    { new Guid("c8000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "jobdescription.create", false, 50, "daily", new Guid("33333333-3333-3333-3333-333333333333"), null },
                    { new Guid("c9000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "match.create", false, 30, "daily", new Guid("33333333-3333-3333-3333-333333333333"), null },
                    { new Guid("d1000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "cv.storage", true, 999999, "total", new Guid("44444444-4444-4444-4444-444444444444"), null },
                    { new Guid("d2000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "cv.optimization", true, 999999, "daily", new Guid("44444444-4444-4444-4444-444444444444"), null },
                    { new Guid("d3000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "interview.ai", true, 999999, "daily", new Guid("44444444-4444-4444-4444-444444444444"), null },
                    { new Guid("d4000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "mentor.session", false, 4, "monthly", new Guid("44444444-4444-4444-4444-444444444444"), null },
                    { new Guid("d5000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "multi_jd.match", false, 20, "per_match", new Guid("44444444-4444-4444-4444-444444444444"), null },
                    { new Guid("d6000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "resume.upload", true, 999999, "daily", new Guid("44444444-4444-4444-4444-444444444444"), null },
                    { new Guid("d7000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "resume.parse", true, 999999, "daily", new Guid("44444444-4444-4444-4444-444444444444"), null },
                    { new Guid("d8000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "jobdescription.create", true, 999999, "daily", new Guid("44444444-4444-4444-4444-444444444444"), null },
                    { new Guid("d9000000-0000-0000-0000-000000000000"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "match.create", true, 999999, "daily", new Guid("44444444-4444-4444-4444-444444444444"), null }
                });

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

            migrationBuilder.CreateIndex(
                name: "IX_ActivityLogs_UserId_CreatedAt",
                schema: "app",
                table: "ActivityLogs",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AiJobs_CorrelationId",
                schema: "app",
                table: "AiJobs",
                column: "CorrelationId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AiJobs_IdempotencyKey",
                schema: "app",
                table: "AiJobs",
                column: "IdempotencyKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AiJobs_ReferenceType_ReferenceId_RequestedAt",
                schema: "app",
                table: "AiJobs",
                columns: new[] { "ReferenceType", "ReferenceId", "RequestedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_ActorId_CreatedAt",
                schema: "app",
                table: "AuditLogs",
                columns: new[] { "ActorId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_BillingCheckoutSessions_OrderCode",
                schema: "app",
                table: "BillingCheckoutSessions",
                column: "OrderCode",
                unique: true);

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

            migrationBuilder.CreateIndex(
                name: "IX_BillingProfiles_UserId",
                schema: "app",
                table: "BillingProfiles",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BlogArticles_Slug",
                schema: "app",
                table: "BlogArticles",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CandidateProfiles_UserId",
                schema: "app",
                table: "CandidateProfiles",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CandidateSkills_CandidateProfileId_SkillId",
                schema: "app",
                table: "CandidateSkills",
                columns: new[] { "CandidateProfileId", "SkillId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CandidateSkills_SkillId",
                schema: "app",
                table: "CandidateSkills",
                column: "SkillId");

            migrationBuilder.CreateIndex(
                name: "IX_Certifications_CandidateProfileId",
                schema: "app",
                table: "Certifications",
                column: "CandidateProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_DashboardSnapshots_UserId_SnapshotDate",
                schema: "app",
                table: "DashboardSnapshots",
                columns: new[] { "UserId", "SnapshotDate" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Educations_CandidateProfileId",
                schema: "app",
                table: "Educations",
                column: "CandidateProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_EmailMessageLogs_UserId_CreatedAt",
                schema: "app",
                table: "EmailMessageLogs",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_EmailTemplates_Code",
                schema: "app",
                table: "EmailTemplates",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EmailVerificationTokens_TokenHash",
                schema: "app",
                table: "EmailVerificationTokens",
                column: "TokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EmailVerificationTokens_UserId_IsUsed",
                schema: "app",
                table: "EmailVerificationTokens",
                columns: new[] { "UserId", "IsUsed" });

            migrationBuilder.CreateIndex(
                name: "IX_ExternalLinks_CandidateProfileId",
                schema: "app",
                table: "ExternalLinks",
                column: "CandidateProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_ExternalLogins_Provider_ProviderKey",
                schema: "app",
                table: "ExternalLogins",
                columns: new[] { "Provider", "ProviderKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ExternalLogins_UserId_Provider",
                schema: "app",
                table: "ExternalLogins",
                columns: new[] { "UserId", "Provider" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InterviewAnswers_InterviewQuestionId",
                schema: "app",
                table: "InterviewAnswers",
                column: "InterviewQuestionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InterviewFeedbackItems_InterviewReportId",
                schema: "app",
                table: "InterviewFeedbackItems",
                column: "InterviewReportId");

            migrationBuilder.CreateIndex(
                name: "IX_InterviewQuestions_InterviewSessionId_QuestionNumber",
                schema: "app",
                table: "InterviewQuestions",
                columns: new[] { "InterviewSessionId", "QuestionNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InterviewRealtimeEvents_InterviewSessionId",
                schema: "app",
                table: "InterviewRealtimeEvents",
                column: "InterviewSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_InterviewRealtimeEvents_RealtimeSessionId",
                schema: "app",
                table: "InterviewRealtimeEvents",
                column: "RealtimeSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_InterviewRealtimeEvents_RealtimeSessionId_SequenceNumber",
                schema: "app",
                table: "InterviewRealtimeEvents",
                columns: new[] { "RealtimeSessionId", "SequenceNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InterviewRealtimeSessions_InterviewSessionId",
                schema: "app",
                table: "InterviewRealtimeSessions",
                column: "InterviewSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_InterviewRealtimeSessions_InterviewSessionId_Status",
                schema: "app",
                table: "InterviewRealtimeSessions",
                columns: new[] { "InterviewSessionId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_InterviewRealtimeSessions_UserId",
                schema: "app",
                table: "InterviewRealtimeSessions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_InterviewReports_InterviewSessionId",
                schema: "app",
                table: "InterviewReports",
                column: "InterviewSessionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InterviewScoreBreakdowns_InterviewReportId",
                schema: "app",
                table: "InterviewScoreBreakdowns",
                column: "InterviewReportId");

            migrationBuilder.CreateIndex(
                name: "IX_InterviewSessions_Status_UpdatedAt",
                schema: "app",
                table: "InterviewSessions",
                columns: new[] { "Status", "UpdatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_InterviewSessions_UserId_CreatedAt",
                schema: "app",
                table: "InterviewSessions",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_InterviewSessions_UserId_Status",
                schema: "app",
                table: "InterviewSessions",
                columns: new[] { "UserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_InterviewTranscripts_InterviewSessionId",
                schema: "app",
                table: "InterviewTranscripts",
                column: "InterviewSessionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InterviewTranscriptSegments_InterviewTranscriptId_SegmentOr~",
                schema: "app",
                table: "InterviewTranscriptSegments",
                columns: new[] { "InterviewTranscriptId", "SegmentOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_CheckoutSessionId",
                schema: "app",
                table: "Invoices",
                column: "CheckoutSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_InvoiceNumber",
                schema: "app",
                table: "Invoices",
                column: "InvoiceNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_UserId_CreatedAt",
                schema: "app",
                table: "Invoices",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_JobBookmarks_UserId_JobDescriptionId",
                schema: "app",
                table: "JobBookmarks",
                columns: new[] { "UserId", "JobDescriptionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobDescriptions_UserId_CreatedAt",
                schema: "app",
                table: "JobDescriptions",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_LanguageProfiles_CandidateProfileId",
                schema: "app",
                table: "LanguageProfiles",
                column: "CandidateProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_MatchInsights_MatchResultId",
                schema: "app",
                table: "MatchInsights",
                column: "MatchResultId");

            migrationBuilder.CreateIndex(
                name: "IX_MatchResults_MatchSessionId_TotalScore",
                schema: "app",
                table: "MatchResults",
                columns: new[] { "MatchSessionId", "TotalScore" });

            migrationBuilder.CreateIndex(
                name: "IX_MatchResults_MatchTargetId",
                schema: "app",
                table: "MatchResults",
                column: "MatchTargetId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MatchSessions_JobDescriptionId_RequestedAt",
                schema: "app",
                table: "MatchSessions",
                columns: new[] { "JobDescriptionId", "RequestedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_MatchSessions_ResumeId_RequestedAt",
                schema: "app",
                table: "MatchSessions",
                columns: new[] { "ResumeId", "RequestedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_MatchSessions_Status_RequestedAt",
                schema: "app",
                table: "MatchSessions",
                columns: new[] { "Status", "RequestedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_MatchSessions_UserId_RequestedAt",
                schema: "app",
                table: "MatchSessions",
                columns: new[] { "UserId", "RequestedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_MatchTargets_MatchSessionId_JobDescriptionId",
                schema: "app",
                table: "MatchTargets",
                columns: new[] { "MatchSessionId", "JobDescriptionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MentorAvailabilitySlots_MentorId_StartsAt",
                schema: "app",
                table: "MentorAvailabilitySlots",
                columns: new[] { "MentorId", "StartsAt" });

            migrationBuilder.CreateIndex(
                name: "IX_MentorBookings_AvailabilitySlotId",
                schema: "app",
                table: "MentorBookings",
                column: "AvailabilitySlotId");

            migrationBuilder.CreateIndex(
                name: "IX_MentorBookings_MentorId",
                schema: "app",
                table: "MentorBookings",
                column: "MentorId");

            migrationBuilder.CreateIndex(
                name: "IX_MentorBookings_UserId_ScheduledStartsAt",
                schema: "app",
                table: "MentorBookings",
                columns: new[] { "UserId", "ScheduledStartsAt" });

            migrationBuilder.CreateIndex(
                name: "IX_MentorProfiles_UserId",
                schema: "app",
                table: "MentorProfiles",
                column: "UserId",
                unique: true,
                filter: "\"UserId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_MentorProfileSpecialties_SpecialtyId",
                schema: "app",
                table: "MentorProfileSpecialties",
                column: "SpecialtyId");

            migrationBuilder.CreateIndex(
                name: "IX_MentorReviews_MentorBookingId",
                schema: "app",
                table: "MentorReviews",
                column: "MentorBookingId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MentorSpecialties_Code",
                schema: "app",
                table: "MentorSpecialties",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NotificationPreferences_UserId",
                schema: "app",
                table: "NotificationPreferences",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId_CreatedAt",
                schema: "app",
                table: "Notifications",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId_DeduplicationKey",
                schema: "app",
                table: "Notifications",
                columns: new[] { "UserId", "DeduplicationKey" });

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId_IsRead",
                schema: "app",
                table: "Notifications",
                columns: new[] { "UserId", "IsRead" });

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId_Type",
                schema: "app",
                table: "Notifications",
                columns: new[] { "UserId", "Type" });

            migrationBuilder.CreateIndex(
                name: "IX_OnboardingProgress_UserId_StepCode",
                schema: "app",
                table: "OnboardingProgress",
                columns: new[] { "UserId", "StepCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetTokens_TokenHash",
                schema: "app",
                table: "PasswordResetTokens",
                column: "TokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetTokens_UserId_IsUsed",
                schema: "app",
                table: "PasswordResetTokens",
                columns: new[] { "UserId", "IsUsed" });

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_CheckoutSessionId",
                schema: "app",
                table: "PaymentTransactions",
                column: "CheckoutSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_ExternalTransactionId",
                schema: "app",
                table: "PaymentTransactions",
                column: "ExternalTransactionId",
                unique: true,
                filter: "\"ExternalTransactionId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_IdempotencyKey",
                schema: "app",
                table: "PaymentTransactions",
                column: "IdempotencyKey",
                unique: true,
                filter: "\"IdempotencyKey\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_UserId_CreatedAt",
                schema: "app",
                table: "PaymentTransactions",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_PaymentWebhookLogs_Provider_ExternalEventId",
                schema: "app",
                table: "PaymentWebhookLogs",
                columns: new[] { "Provider", "ExternalEventId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlanEntitlements_PlanId_FeatureKey",
                schema: "app",
                table: "PlanEntitlements",
                columns: new[] { "PlanId", "FeatureKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Plans_Code",
                schema: "app",
                table: "Plans",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PublicContactRequests_Email_CreatedAt",
                schema: "app",
                table: "PublicContactRequests",
                columns: new[] { "Email", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_PublicStats_Key",
                schema: "app",
                table: "PublicStats",
                column: "Key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuotaConsumptionLogs_UserId_FeatureKey_PeriodKey_CreatedAt",
                schema: "app",
                table: "QuotaConsumptionLogs",
                columns: new[] { "UserId", "FeatureKey", "PeriodKey", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_TokenHash",
                schema: "app",
                table: "RefreshTokens",
                column: "TokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UserId_IsRevoked",
                schema: "app",
                table: "RefreshTokens",
                columns: new[] { "UserId", "IsRevoked" });

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UserSessionId",
                schema: "app",
                table: "RefreshTokens",
                column: "UserSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_ReportShareLinks_ExpiresAt",
                schema: "app",
                table: "ReportShareLinks",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_ReportShareLinks_IsActive",
                schema: "app",
                table: "ReportShareLinks",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_ReportShareLinks_TokenHash",
                schema: "app",
                table: "ReportShareLinks",
                column: "TokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReportShareLinks_UserId_ReportType_ResourceId",
                schema: "app",
                table: "ReportShareLinks",
                columns: new[] { "UserId", "ReportType", "ResourceId" });

            migrationBuilder.CreateIndex(
                name: "IX_ResumeParsedData_ResumeId",
                schema: "app",
                table: "ResumeParsedData",
                column: "ResumeId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ResumeParsedData_ResumeVersionId",
                schema: "app",
                table: "ResumeParsedData",
                column: "ResumeVersionId");

            migrationBuilder.CreateIndex(
                name: "IX_ResumeParseJobs_ResumeId",
                schema: "app",
                table: "ResumeParseJobs",
                column: "ResumeId");

            migrationBuilder.CreateIndex(
                name: "IX_ResumeParseJobs_ResumeVersionId",
                schema: "app",
                table: "ResumeParseJobs",
                column: "ResumeVersionId");

            migrationBuilder.CreateIndex(
                name: "IX_ResumeParseJobs_Status",
                schema: "app",
                table: "ResumeParseJobs",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ResumeParseJobs_UserId",
                schema: "app",
                table: "ResumeParseJobs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Resumes_ActiveVersionId",
                schema: "app",
                table: "Resumes",
                column: "ActiveVersionId");

            migrationBuilder.CreateIndex(
                name: "IX_Resumes_UserId",
                schema: "app",
                table: "Resumes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Resumes_UserId_IsActive",
                schema: "app",
                table: "Resumes",
                columns: new[] { "UserId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_Resumes_UserId_IsActive_CreatedAt",
                schema: "app",
                table: "Resumes",
                columns: new[] { "UserId", "IsActive", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ResumeVersions_ResumeId_CreatedAt",
                schema: "app",
                table: "ResumeVersions",
                columns: new[] { "ResumeId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ResumeVersions_ResumeId_VersionNumber",
                schema: "app",
                table: "ResumeVersions",
                columns: new[] { "ResumeId", "VersionNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ResumeVersions_UploadedFileId",
                schema: "app",
                table: "ResumeVersions",
                column: "UploadedFileId");

            migrationBuilder.CreateIndex(
                name: "IX_Roles_Code",
                schema: "app",
                table: "Roles",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Skills_NormalizedName",
                schema: "app",
                table: "Skills",
                column: "NormalizedName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionChangeLogs_SubscriptionId",
                schema: "app",
                table: "SubscriptionChangeLogs",
                column: "SubscriptionId");

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_PlanId",
                schema: "app",
                table: "Subscriptions",
                column: "PlanId");

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_UserId_Status_CurrentPeriodEndsAt",
                schema: "app",
                table: "Subscriptions",
                columns: new[] { "UserId", "Status", "CurrentPeriodEndsAt" });

            migrationBuilder.CreateIndex(
                name: "IX_SupportTicketMessages_SupportTicketId",
                schema: "app",
                table: "SupportTicketMessages",
                column: "SupportTicketId");

            migrationBuilder.CreateIndex(
                name: "IX_SupportTickets_TicketNumber",
                schema: "app",
                table: "SupportTickets",
                column: "TicketNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SupportTickets_UserId_CreatedAt",
                schema: "app",
                table: "SupportTickets",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_UploadedFiles_UserId_CreatedAt",
                schema: "app",
                table: "UploadedFiles",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_UsageQuotaPolicies_PlanId_FeatureKey_PeriodType",
                schema: "app",
                table: "UsageQuotaPolicies",
                columns: new[] { "PlanId", "FeatureKey", "PeriodType" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserDailyUsages_UserId_UsageDate",
                schema: "app",
                table: "UserDailyUsages",
                columns: new[] { "UserId", "UsageDate" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserQuotaCounters_UserId_FeatureKey_PeriodType_PeriodKey",
                schema: "app",
                table: "UserQuotaCounters",
                columns: new[] { "UserId", "FeatureKey", "PeriodType", "PeriodKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserRoles_RoleId",
                schema: "app",
                table: "UserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_NormalizedEmail",
                schema: "app",
                table: "Users",
                column: "NormalizedEmail",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_RoleCode",
                schema: "app",
                table: "Users",
                column: "RoleCode");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Status",
                schema: "app",
                table: "Users",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_UserSessions_UserId_IsActive",
                schema: "app",
                table: "UserSessions",
                columns: new[] { "UserId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_WorkExperiences_CandidateProfileId_StartDate",
                schema: "app",
                table: "WorkExperiences",
                columns: new[] { "CandidateProfileId", "StartDate" });

            migrationBuilder.AddForeignKey(
                name: "FK_ResumeParsedData_ResumeVersions_ResumeVersionId",
                schema: "app",
                table: "ResumeParsedData",
                column: "ResumeVersionId",
                principalSchema: "app",
                principalTable: "ResumeVersions",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ResumeParsedData_Resumes_ResumeId",
                schema: "app",
                table: "ResumeParsedData",
                column: "ResumeId",
                principalSchema: "app",
                principalTable: "Resumes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ResumeParseJobs_ResumeVersions_ResumeVersionId",
                schema: "app",
                table: "ResumeParseJobs",
                column: "ResumeVersionId",
                principalSchema: "app",
                principalTable: "ResumeVersions",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Resumes_ResumeVersions_ActiveVersionId",
                schema: "app",
                table: "Resumes",
                column: "ActiveVersionId",
                principalSchema: "app",
                principalTable: "ResumeVersions",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Resumes_ResumeVersions_ActiveVersionId",
                schema: "app",
                table: "Resumes");

            migrationBuilder.DropTable(
                name: "AccountDeletionRequests",
                schema: "app");

            migrationBuilder.DropTable(
                name: "ActivityLogs",
                schema: "app");

            migrationBuilder.DropTable(
                name: "AdminActionLogs",
                schema: "app");

            migrationBuilder.DropTable(
                name: "AiJobs",
                schema: "app");

            migrationBuilder.DropTable(
                name: "AuditLogs",
                schema: "app");

            migrationBuilder.DropTable(
                name: "BillingCheckoutSessions",
                schema: "app");

            migrationBuilder.DropTable(
                name: "BillingPaymentAttempts",
                schema: "app");

            migrationBuilder.DropTable(
                name: "BillingProfiles",
                schema: "app");

            migrationBuilder.DropTable(
                name: "BlogArticles",
                schema: "app");

            migrationBuilder.DropTable(
                name: "CandidateSkills",
                schema: "app");

            migrationBuilder.DropTable(
                name: "Certifications",
                schema: "app");

            migrationBuilder.DropTable(
                name: "ConsentRecords",
                schema: "app");

            migrationBuilder.DropTable(
                name: "DashboardSnapshots",
                schema: "app");

            migrationBuilder.DropTable(
                name: "DataExportRequests",
                schema: "app");

            migrationBuilder.DropTable(
                name: "Educations",
                schema: "app");

            migrationBuilder.DropTable(
                name: "EmailCenterMessages",
                schema: "app");

            migrationBuilder.DropTable(
                name: "EmailMessageLogs",
                schema: "app");

            migrationBuilder.DropTable(
                name: "EmailTemplates",
                schema: "app");

            migrationBuilder.DropTable(
                name: "EmailVerificationTokens",
                schema: "app");

            migrationBuilder.DropTable(
                name: "ExternalLinks",
                schema: "app");

            migrationBuilder.DropTable(
                name: "ExternalLogins",
                schema: "app");

            migrationBuilder.DropTable(
                name: "FaqItems",
                schema: "app");

            migrationBuilder.DropTable(
                name: "InterviewAnswers",
                schema: "app");

            migrationBuilder.DropTable(
                name: "InterviewFeedbackItems",
                schema: "app");

            migrationBuilder.DropTable(
                name: "InterviewRealtimeEvents",
                schema: "app");

            migrationBuilder.DropTable(
                name: "InterviewScoreBreakdowns",
                schema: "app");

            migrationBuilder.DropTable(
                name: "InterviewTranscriptSegments",
                schema: "app");

            migrationBuilder.DropTable(
                name: "Invoices",
                schema: "app");

            migrationBuilder.DropTable(
                name: "JobBookmarks",
                schema: "app");

            migrationBuilder.DropTable(
                name: "JobDescriptions",
                schema: "app");

            migrationBuilder.DropTable(
                name: "LanguageProfiles",
                schema: "app");

            migrationBuilder.DropTable(
                name: "MatchInsights",
                schema: "app");

            migrationBuilder.DropTable(
                name: "MentorProfileSpecialties",
                schema: "app");

            migrationBuilder.DropTable(
                name: "MentorReviews",
                schema: "app");

            migrationBuilder.DropTable(
                name: "NotificationPreferences",
                schema: "app");

            migrationBuilder.DropTable(
                name: "Notifications",
                schema: "app");

            migrationBuilder.DropTable(
                name: "OnboardingProgress",
                schema: "app");

            migrationBuilder.DropTable(
                name: "PasswordResetTokens",
                schema: "app");

            migrationBuilder.DropTable(
                name: "PaymentWebhookLogs",
                schema: "app");

            migrationBuilder.DropTable(
                name: "PlanEntitlements",
                schema: "app");

            migrationBuilder.DropTable(
                name: "PublicContactRequests",
                schema: "app");

            migrationBuilder.DropTable(
                name: "PublicStats",
                schema: "app");

            migrationBuilder.DropTable(
                name: "QuotaConsumptionLogs",
                schema: "app");

            migrationBuilder.DropTable(
                name: "RefreshTokens",
                schema: "app");

            migrationBuilder.DropTable(
                name: "ReportShareLinks",
                schema: "app");

            migrationBuilder.DropTable(
                name: "ResumeOptimizationSessions",
                schema: "app");

            migrationBuilder.DropTable(
                name: "ResumeParsedData",
                schema: "app");

            migrationBuilder.DropTable(
                name: "ResumeParseJobs",
                schema: "app");

            migrationBuilder.DropTable(
                name: "StoredPaymentMethods",
                schema: "app");

            migrationBuilder.DropTable(
                name: "SubscriptionChangeLogs",
                schema: "app");

            migrationBuilder.DropTable(
                name: "SupportTicketMessages",
                schema: "app");

            migrationBuilder.DropTable(
                name: "TermsAcceptances",
                schema: "app");

            migrationBuilder.DropTable(
                name: "Testimonials",
                schema: "app");

            migrationBuilder.DropTable(
                name: "UsageQuotaPolicies",
                schema: "app");

            migrationBuilder.DropTable(
                name: "UserDailyUsages",
                schema: "app");

            migrationBuilder.DropTable(
                name: "UserFeedbacks",
                schema: "app");

            migrationBuilder.DropTable(
                name: "UserQuotaCounters",
                schema: "app");

            migrationBuilder.DropTable(
                name: "UserRoles",
                schema: "app");

            migrationBuilder.DropTable(
                name: "UserSessions",
                schema: "app");

            migrationBuilder.DropTable(
                name: "WorkExperiences",
                schema: "app");

            migrationBuilder.DropTable(
                name: "PaymentTransactions",
                schema: "app");

            migrationBuilder.DropTable(
                name: "Skills",
                schema: "app");

            migrationBuilder.DropTable(
                name: "InterviewQuestions",
                schema: "app");

            migrationBuilder.DropTable(
                name: "InterviewRealtimeSessions",
                schema: "app");

            migrationBuilder.DropTable(
                name: "InterviewReports",
                schema: "app");

            migrationBuilder.DropTable(
                name: "InterviewTranscripts",
                schema: "app");

            migrationBuilder.DropTable(
                name: "MatchResults",
                schema: "app");

            migrationBuilder.DropTable(
                name: "MentorSpecialties",
                schema: "app");

            migrationBuilder.DropTable(
                name: "MentorBookings",
                schema: "app");

            migrationBuilder.DropTable(
                name: "Subscriptions",
                schema: "app");

            migrationBuilder.DropTable(
                name: "SupportTickets",
                schema: "app");

            migrationBuilder.DropTable(
                name: "Roles",
                schema: "app");

            migrationBuilder.DropTable(
                name: "Users",
                schema: "app");

            migrationBuilder.DropTable(
                name: "CandidateProfiles",
                schema: "app");

            migrationBuilder.DropTable(
                name: "InterviewSessions",
                schema: "app");

            migrationBuilder.DropTable(
                name: "MatchTargets",
                schema: "app");

            migrationBuilder.DropTable(
                name: "MentorAvailabilitySlots",
                schema: "app");

            migrationBuilder.DropTable(
                name: "Plans",
                schema: "app");

            migrationBuilder.DropTable(
                name: "MatchSessions",
                schema: "app");

            migrationBuilder.DropTable(
                name: "MentorProfiles",
                schema: "app");

            migrationBuilder.DropTable(
                name: "ResumeVersions",
                schema: "app");

            migrationBuilder.DropTable(
                name: "Resumes",
                schema: "app");

            migrationBuilder.DropTable(
                name: "UploadedFiles",
                schema: "app");
        }
    }
}
