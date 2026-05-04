using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Interviet.Domain.Billing;
using Interviet.Domain.Quotas;
using Interviet.Domain.Notifications;
using Interviet.Domain.Support;
using Interviet.Domain.Dashboard;
using Interviet.Domain.AiIntegration;

namespace Interviet.Infrastructure.Persistence.Configurations;

// ── Billing ───────────────────────────────────────────────────────────────────
public class PlanConfiguration : IEntityTypeConfiguration<Plan>
{
    public void Configure(EntityTypeBuilder<Plan> b)
    {
        b.ToTable("Plans");
        b.HasKey(x => x.Id);
        b.Property(x => x.Code).HasMaxLength(50).IsRequired();
        b.Property(x => x.Name).HasMaxLength(100).IsRequired();
        b.Property(x => x.BillingCycle).HasMaxLength(30).IsRequired();
        b.Property(x => x.PriceAmount).HasColumnType("decimal(18,2)");
        b.Property(x => x.CurrencyCode).HasMaxLength(10).HasDefaultValue("VND");
        b.HasIndex(x => x.Code).IsUnique();
        b.HasMany(x => x.Entitlements).WithOne(e => e.Plan).HasForeignKey(e => e.PlanId);
    }
}

public class PlanEntitlementConfiguration : IEntityTypeConfiguration<PlanEntitlement>
{
    public void Configure(EntityTypeBuilder<PlanEntitlement> b)
    {
        b.ToTable("PlanEntitlements");
        b.HasKey(x => x.Id);
        b.Property(x => x.FeatureKey).HasMaxLength(100).IsRequired();
        b.Property(x => x.FeatureValue).HasMaxLength(200).IsRequired();
        b.Property(x => x.ValueType).HasMaxLength(30).IsRequired();
        b.HasIndex(x => new { x.PlanId, x.FeatureKey }).IsUnique();
    }
}

public class BillingProfileConfiguration : IEntityTypeConfiguration<BillingProfile>
{
    public void Configure(EntityTypeBuilder<BillingProfile> b)
    {
        b.ToTable("BillingProfiles");
        b.HasKey(x => x.Id);
        b.Property(x => x.BillingName).HasMaxLength(200);
        b.Property(x => x.TaxCode).HasMaxLength(50);
        b.Property(x => x.CompanyName).HasMaxLength(250);
        b.Property(x => x.BillingEmail).HasMaxLength(320);
        b.Property(x => x.BillingAddress).HasMaxLength(500);
        b.HasIndex(x => x.UserId).IsUnique();
    }
}

public class StoredPaymentMethodConfiguration : IEntityTypeConfiguration<StoredPaymentMethod>
{
    public void Configure(EntityTypeBuilder<StoredPaymentMethod> b)
    {
        b.ToTable("StoredPaymentMethods");
        b.HasKey(x => x.Id);
        b.Property(x => x.Provider).HasMaxLength(50).IsRequired();
        b.Property(x => x.MethodType).HasMaxLength(50).IsRequired();
        b.Property(x => x.ProviderReference).HasMaxLength(150);
        b.Property(x => x.MaskedDisplay).HasMaxLength(100);
    }
}

public class SubscriptionConfiguration : IEntityTypeConfiguration<Subscription>
{
    public void Configure(EntityTypeBuilder<Subscription> b)
    {
        b.ToTable("Subscriptions");
        b.HasKey(x => x.Id);
        b.Property(x => x.Status).HasMaxLength(30).IsRequired();
        b.Property(x => x.RowVersion).IsRowVersion();
        b.HasOne(x => x.Plan).WithMany().HasForeignKey(x => x.PlanId);
        b.HasMany(x => x.ChangeLogs).WithOne().HasForeignKey(c => c.SubscriptionId);
        b.HasIndex(x => new { x.UserId, x.Status, x.CurrentPeriodEndsAt });
    }
}

public class SubscriptionChangeLogConfiguration : IEntityTypeConfiguration<SubscriptionChangeLog>
{
    public void Configure(EntityTypeBuilder<SubscriptionChangeLog> b)
    {
        b.ToTable("SubscriptionChangeLogs");
        b.HasKey(x => x.Id);
        b.Property(x => x.ChangeType).HasMaxLength(50).IsRequired();
        b.Property(x => x.Reason).HasMaxLength(500);
    }
}

public class PaymentTransactionConfiguration : IEntityTypeConfiguration<PaymentTransaction>
{
    public void Configure(EntityTypeBuilder<PaymentTransaction> b)
    {
        b.ToTable("PaymentTransactions");
        b.HasKey(x => x.Id);
        b.Property(x => x.Provider).HasMaxLength(50).IsRequired();
        b.Property(x => x.MethodType).HasMaxLength(50);
        b.Property(x => x.ExternalOrderId).HasMaxLength(150);
        b.Property(x => x.ExternalTransactionId).HasMaxLength(150);
        b.Property(x => x.IdempotencyKey).HasMaxLength(150);
        b.Property(x => x.Amount).HasColumnType("decimal(18,2)");
        b.Property(x => x.CurrencyCode).HasMaxLength(10);
        b.Property(x => x.Status).HasMaxLength(30).IsRequired();
        b.Property(x => x.FailureCode).HasMaxLength(50);
        b.HasIndex(x => x.ExternalTransactionId).IsUnique();
        b.HasIndex(x => x.IdempotencyKey).IsUnique();
        b.HasIndex(x => new { x.UserId, x.CreatedAt });
    }
}

public class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> b)
    {
        b.ToTable("Invoices");
        b.HasKey(x => x.Id);
        b.Property(x => x.InvoiceNumber).HasMaxLength(50).IsRequired();
        b.Property(x => x.Amount).HasColumnType("decimal(18,2)");
        b.Property(x => x.CurrencyCode).HasMaxLength(10);
        b.Property(x => x.Status).HasMaxLength(30).IsRequired();
        b.HasIndex(x => x.InvoiceNumber).IsUnique();
    }
}

// ── Quota ─────────────────────────────────────────────────────────────────────
public class UsageQuotaPolicyConfiguration : IEntityTypeConfiguration<UsageQuotaPolicy>
{
    public void Configure(EntityTypeBuilder<UsageQuotaPolicy> b)
    {
        b.ToTable("UsageQuotaPolicies");
        b.HasKey(x => x.Id);
        b.Property(x => x.FeatureKey).HasMaxLength(100).IsRequired();
        b.Property(x => x.PeriodType).HasMaxLength(20).IsRequired();
        b.HasIndex(x => new { x.PlanId, x.FeatureKey, x.PeriodType }).IsUnique();
    }
}

public class UserQuotaCounterConfiguration : IEntityTypeConfiguration<UserQuotaCounter>
{
    public void Configure(EntityTypeBuilder<UserQuotaCounter> b)
    {
        b.ToTable("UserQuotaCounters");
        b.HasKey(x => x.Id);
        b.Property(x => x.FeatureKey).HasMaxLength(100).IsRequired();
        b.Property(x => x.PeriodType).HasMaxLength(20).IsRequired();
        b.Property(x => x.PeriodKey).HasMaxLength(30).IsRequired();
        b.Property(x => x.RowVersion).IsRowVersion();
        b.HasIndex(x => new { x.UserId, x.FeatureKey, x.PeriodType, x.PeriodKey }).IsUnique();
    }
}

public class QuotaConsumptionLogConfiguration : IEntityTypeConfiguration<QuotaConsumptionLog>
{
    public void Configure(EntityTypeBuilder<QuotaConsumptionLog> b)
    {
        b.ToTable("QuotaConsumptionLogs");
        b.HasKey(x => x.Id);
        b.Property(x => x.FeatureKey).HasMaxLength(100).IsRequired();
        b.Property(x => x.PeriodType).HasMaxLength(20).IsRequired();
        b.Property(x => x.PeriodKey).HasMaxLength(30).IsRequired();
        b.Property(x => x.ReferenceType).HasMaxLength(50).IsRequired();
        b.Property(x => x.Status).HasMaxLength(30).IsRequired();
        b.Property(x => x.Reason).HasMaxLength(500);
        b.HasIndex(x => new { x.UserId, x.FeatureKey, x.PeriodKey, x.CreatedAt });
    }
}

public class UserDailyUsageConfiguration : IEntityTypeConfiguration<UserDailyUsage>
{
    public void Configure(EntityTypeBuilder<UserDailyUsage> b)
    {
        b.ToTable("UserDailyUsages");
        b.HasKey(x => x.Id);
        b.HasIndex(x => new { x.UserId, x.UsageDate }).IsUnique();
    }
}

// ── Notifications ─────────────────────────────────────────────────────────────
public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> b)
    {
        b.ToTable("Notifications");
        b.HasKey(x => x.Id);
        b.Property(x => x.Category).HasMaxLength(50).IsRequired();
        b.Property(x => x.Type).HasMaxLength(20).IsRequired();
        b.Property(x => x.Channel).HasMaxLength(20).IsRequired().HasDefaultValue("in_app");
        b.Property(x => x.Title).HasMaxLength(250).IsRequired();
        b.Property(x => x.ActionUrl).HasMaxLength(500);
        b.HasIndex(x => new { x.UserId, x.IsRead, x.CreatedAt });
    }
}

public class EmailTemplateConfiguration : IEntityTypeConfiguration<EmailTemplate>
{
    public void Configure(EntityTypeBuilder<EmailTemplate> b)
    {
        b.ToTable("EmailTemplates");
        b.HasKey(x => x.Id);
        b.Property(x => x.Code).HasMaxLength(100).IsRequired();
        b.Property(x => x.SubjectTemplate).HasMaxLength(300).IsRequired();
        b.HasIndex(x => x.Code).IsUnique();
    }
}

public class EmailCenterMessageConfiguration : IEntityTypeConfiguration<EmailCenterMessage>
{
    public void Configure(EntityTypeBuilder<EmailCenterMessage> b)
    {
        b.ToTable("EmailCenterMessages");
        b.HasKey(x => x.Id);
        b.Property(x => x.Category).HasMaxLength(50).IsRequired();
        b.Property(x => x.Subject).HasMaxLength(300).IsRequired();
        b.Property(x => x.BodyPreview).HasMaxLength(1000);
    }
}

public class EmailMessageLogConfiguration : IEntityTypeConfiguration<EmailMessageLog>
{
    public void Configure(EntityTypeBuilder<EmailMessageLog> b)
    {
        b.ToTable("EmailMessageLogs");
        b.HasKey(x => x.Id);
        b.Property(x => x.TemplateCode).HasMaxLength(100);
        b.Property(x => x.ToAddress).HasMaxLength(320).IsRequired();
        b.Property(x => x.Subject).HasMaxLength(300).IsRequired();
        b.Property(x => x.Provider).HasMaxLength(50).IsRequired();
        b.Property(x => x.ProviderMessageId).HasMaxLength(150);
        b.Property(x => x.Status).HasMaxLength(30).IsRequired();
        b.HasIndex(x => new { x.UserId, x.CreatedAt });
    }
}

// ── Support & Privacy ─────────────────────────────────────────────────────────
public class ActivityLogConfiguration : IEntityTypeConfiguration<ActivityLog>
{
    public void Configure(EntityTypeBuilder<ActivityLog> b)
    {
        b.ToTable("ActivityLogs");
        b.HasKey(x => x.Id);
        b.Property(x => x.ActionKey).HasMaxLength(100).IsRequired();
        b.Property(x => x.EntityType).HasMaxLength(100);
        b.Property(x => x.Description).HasMaxLength(500);
        b.Property(x => x.IpAddress).HasMaxLength(64);
        b.Property(x => x.UserAgent).HasMaxLength(1000);
        b.HasIndex(x => new { x.UserId, x.CreatedAt });
    }
}

public class SupportTicketConfiguration : IEntityTypeConfiguration<SupportTicket>
{
    public void Configure(EntityTypeBuilder<SupportTicket> b)
    {
        b.ToTable("SupportTickets");
        b.HasKey(x => x.Id);
        b.Property(x => x.TicketNumber).HasMaxLength(50).IsRequired();
        b.Property(x => x.Category).HasMaxLength(50).IsRequired();
        b.Property(x => x.Priority).HasMaxLength(20).IsRequired();
        b.Property(x => x.Subject).HasMaxLength(250).IsRequired();
        b.Property(x => x.Status).HasMaxLength(30).IsRequired();
        b.Property(x => x.AssignedTo).HasMaxLength(100);
        b.HasIndex(x => x.TicketNumber).IsUnique();
        b.HasIndex(x => new { x.UserId, x.CreatedAt });
        b.HasMany(x => x.Messages).WithOne().HasForeignKey(m => m.SupportTicketId);
    }
}

public class SupportTicketMessageConfiguration : IEntityTypeConfiguration<SupportTicketMessage>
{
    public void Configure(EntityTypeBuilder<SupportTicketMessage> b)
    {
        b.ToTable("SupportTicketMessages");
        b.HasKey(x => x.Id);
        b.Property(x => x.SenderType).HasMaxLength(20).IsRequired();
    }
}

public class AdminActionLogConfiguration : IEntityTypeConfiguration<AdminActionLog>
{
    public void Configure(EntityTypeBuilder<AdminActionLog> b)
    {
        b.ToTable("AdminActionLogs");
        b.HasKey(x => x.Id);
        b.Property(x => x.ActionKey).HasMaxLength(100).IsRequired();
        b.Property(x => x.TargetEntityType).HasMaxLength(100).IsRequired();
    }
}

// ── Dashboard & AI ────────────────────────────────────────────────────────────
public class OnboardingProgressConfiguration : IEntityTypeConfiguration<OnboardingProgress>
{
    public void Configure(EntityTypeBuilder<OnboardingProgress> b)
    {
        b.ToTable("OnboardingProgress");
        b.HasKey(x => x.Id);
        b.Property(x => x.StepCode).HasMaxLength(100).IsRequired();
        b.Property(x => x.Status).HasMaxLength(20).IsRequired();
        b.HasIndex(x => new { x.UserId, x.StepCode }).IsUnique();
    }
}

public class DashboardSnapshotConfiguration : IEntityTypeConfiguration<DashboardSnapshot>
{
    public void Configure(EntityTypeBuilder<DashboardSnapshot> b)
    {
        b.ToTable("DashboardSnapshots");
        b.HasKey(x => x.Id);
        b.Property(x => x.AverageMatchScore).HasColumnType("decimal(5,2)");
        b.Property(x => x.BestMatchScore).HasColumnType("decimal(5,2)");
        b.HasIndex(x => new { x.UserId, x.SnapshotDate }).IsUnique();
    }
}

public class AiJobConfiguration : IEntityTypeConfiguration<AiJob>
{
    public void Configure(EntityTypeBuilder<AiJob> b)
    {
        b.ToTable("AiJobs");
        b.HasKey(x => x.Id);
        b.Property(x => x.JobType).HasMaxLength(50).IsRequired();
        b.Property(x => x.ReferenceType).HasMaxLength(50).IsRequired();
        b.Property(x => x.ExternalJobId).HasMaxLength(100);
        b.Property(x => x.CorrelationId).HasMaxLength(100).IsRequired();
        b.Property(x => x.IdempotencyKey).HasMaxLength(150);
        b.Property(x => x.Status).HasMaxLength(30).IsRequired();
        b.Property(x => x.SchemaVersion).HasMaxLength(30);
        b.Property(x => x.ModelVersion).HasMaxLength(100);
        b.HasIndex(x => x.CorrelationId).IsUnique();
        b.HasIndex(x => x.IdempotencyKey).IsUnique();
        b.HasIndex(x => new { x.ReferenceType, x.ReferenceId, x.RequestedAt });
    }
}

public class PaymentWebhookLogConfiguration : IEntityTypeConfiguration<PaymentWebhookLog>
{
    public void Configure(EntityTypeBuilder<PaymentWebhookLog> b)
    {
        b.ToTable("PaymentWebhookLogs");
        b.HasKey(x => x.Id);
        b.Property(x => x.Provider).HasMaxLength(50).IsRequired();
        b.Property(x => x.ExternalEventId).HasMaxLength(150).IsRequired();
        b.Property(x => x.ProcessingStatus).HasMaxLength(30).IsRequired();
        // Critical: prevent duplicate webhook processing
        b.HasIndex(x => new { x.Provider, x.ExternalEventId }).IsUnique();
    }
}
