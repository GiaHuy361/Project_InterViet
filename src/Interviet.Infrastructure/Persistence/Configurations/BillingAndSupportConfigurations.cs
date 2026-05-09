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

        var now = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        b.HasData(
            new Plan { Id = Guid.Parse("11111111-1111-1111-1111-111111111111"), Code = "free", Name = "Free Plan", BillingCycle = "free", PriceAmount = 0, CurrencyCode = "VND", TrialDays = 0, IsActive = true, SortOrder = 1, CreatedAt = now, UpdatedAt = now },
            new Plan { Id = Guid.Parse("22222222-2222-2222-2222-222222222222"), Code = "monthly", Name = "Premium (Monthly)", BillingCycle = "monthly", PriceAmount = 149000, CurrencyCode = "VND", TrialDays = 0, IsActive = true, SortOrder = 2, CreatedAt = now, UpdatedAt = now },
            new Plan { Id = Guid.Parse("33333333-3333-3333-3333-333333333333"), Code = "quarterly", Name = "Premium (Quarterly)", BillingCycle = "quarterly", PriceAmount = 387000, CurrencyCode = "VND", TrialDays = 0, IsActive = true, SortOrder = 3, CreatedAt = now, UpdatedAt = now },
            new Plan { Id = Guid.Parse("44444444-4444-4444-4444-444444444444"), Code = "yearly", Name = "Premium (Yearly)", BillingCycle = "yearly", PriceAmount = 1308000, CurrencyCode = "VND", TrialDays = 7, IsActive = true, SortOrder = 4, CreatedAt = now, UpdatedAt = now }
        );
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

        var now = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var fId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var mId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var qId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        var yId = Guid.Parse("44444444-4444-4444-4444-444444444444");

        b.HasData(
            // Free
            new PlanEntitlement { Id = Guid.Parse("E1000000-0000-0000-0000-000000000001"), PlanId = fId, FeatureKey = "ai.model.tier", FeatureValue = "Basic", ValueType = "string", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E1000000-0000-0000-0000-000000000002"), PlanId = fId, FeatureKey = "report.export_pdf", FeatureValue = "false", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E1000000-0000-0000-0000-000000000003"), PlanId = fId, FeatureKey = "report.share", FeatureValue = "false", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E1000000-0000-0000-0000-000000000004"), PlanId = fId, FeatureKey = "analytics.advanced", FeatureValue = "false", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E1000000-0000-0000-0000-000000000005"), PlanId = fId, FeatureKey = "headhunter.access", FeatureValue = "false", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E1000000-0000-0000-0000-000000000006"), PlanId = fId, FeatureKey = "career.advancement", FeatureValue = "false", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E1000000-0000-0000-0000-000000000007"), PlanId = fId, FeatureKey = "communication.analysis", FeatureValue = "false", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E1000000-0000-0000-0000-000000000008"), PlanId = fId, FeatureKey = "industry.benchmark", FeatureValue = "false", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E1000000-0000-0000-0000-000000000009"), PlanId = fId, FeatureKey = "mentor.choose_by_industry", FeatureValue = "false", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E1000000-0000-0000-0000-000000000010"), PlanId = fId, FeatureKey = "history.retention", FeatureValue = "30_days", ValueType = "string", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E1000000-0000-0000-0000-000000000011"), PlanId = fId, FeatureKey = "support.level", FeatureValue = "Email", ValueType = "string", CreatedAt = now },

            // Monthly
            new PlanEntitlement { Id = Guid.Parse("E2000000-0000-0000-0000-000000000001"), PlanId = mId, FeatureKey = "ai.model.tier", FeatureValue = "Stable", ValueType = "string", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E2000000-0000-0000-0000-000000000002"), PlanId = mId, FeatureKey = "report.export_pdf", FeatureValue = "true", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E2000000-0000-0000-0000-000000000003"), PlanId = mId, FeatureKey = "report.share", FeatureValue = "true", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E2000000-0000-0000-0000-000000000004"), PlanId = mId, FeatureKey = "analytics.advanced", FeatureValue = "true", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E2000000-0000-0000-0000-000000000005"), PlanId = mId, FeatureKey = "headhunter.access", FeatureValue = "false", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E2000000-0000-0000-0000-000000000006"), PlanId = mId, FeatureKey = "career.advancement", FeatureValue = "false", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E2000000-0000-0000-0000-000000000007"), PlanId = mId, FeatureKey = "communication.analysis", FeatureValue = "false", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E2000000-0000-0000-0000-000000000008"), PlanId = mId, FeatureKey = "industry.benchmark", FeatureValue = "false", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E2000000-0000-0000-0000-000000000009"), PlanId = mId, FeatureKey = "mentor.choose_by_industry", FeatureValue = "false", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E2000000-0000-0000-0000-000000000010"), PlanId = mId, FeatureKey = "history.retention", FeatureValue = "90_days", ValueType = "string", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E2000000-0000-0000-0000-000000000011"), PlanId = mId, FeatureKey = "support.level", FeatureValue = "Email", ValueType = "string", CreatedAt = now },

            // Quarterly
            new PlanEntitlement { Id = Guid.Parse("E3000000-0000-0000-0000-000000000001"), PlanId = qId, FeatureKey = "ai.model.tier", FeatureValue = "Premium", ValueType = "string", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E3000000-0000-0000-0000-000000000002"), PlanId = qId, FeatureKey = "report.export_pdf", FeatureValue = "true", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E3000000-0000-0000-0000-000000000003"), PlanId = qId, FeatureKey = "report.share", FeatureValue = "true", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E3000000-0000-0000-0000-000000000004"), PlanId = qId, FeatureKey = "analytics.advanced", FeatureValue = "true", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E3000000-0000-0000-0000-000000000005"), PlanId = qId, FeatureKey = "headhunter.access", FeatureValue = "false", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E3000000-0000-0000-0000-000000000006"), PlanId = qId, FeatureKey = "career.advancement", FeatureValue = "false", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E3000000-0000-0000-0000-000000000007"), PlanId = qId, FeatureKey = "communication.analysis", FeatureValue = "true", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E3000000-0000-0000-0000-000000000008"), PlanId = qId, FeatureKey = "industry.benchmark", FeatureValue = "true", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E3000000-0000-0000-0000-000000000009"), PlanId = qId, FeatureKey = "mentor.choose_by_industry", FeatureValue = "true", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E3000000-0000-0000-0000-000000000010"), PlanId = qId, FeatureKey = "history.retention", FeatureValue = "1_year", ValueType = "string", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E3000000-0000-0000-0000-000000000011"), PlanId = qId, FeatureKey = "support.level", FeatureValue = "Priority", ValueType = "string", CreatedAt = now },

            // Yearly
            new PlanEntitlement { Id = Guid.Parse("E4000000-0000-0000-0000-000000000001"), PlanId = yId, FeatureKey = "ai.model.tier", FeatureValue = "Premium", ValueType = "string", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E4000000-0000-0000-0000-000000000002"), PlanId = yId, FeatureKey = "report.export_pdf", FeatureValue = "true", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E4000000-0000-0000-0000-000000000003"), PlanId = yId, FeatureKey = "report.share", FeatureValue = "true", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E4000000-0000-0000-0000-000000000004"), PlanId = yId, FeatureKey = "analytics.advanced", FeatureValue = "true", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E4000000-0000-0000-0000-000000000005"), PlanId = yId, FeatureKey = "headhunter.access", FeatureValue = "true", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E4000000-0000-0000-0000-000000000006"), PlanId = yId, FeatureKey = "career.advancement", FeatureValue = "true", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E4000000-0000-0000-0000-000000000007"), PlanId = yId, FeatureKey = "communication.analysis", FeatureValue = "true", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E4000000-0000-0000-0000-000000000008"), PlanId = yId, FeatureKey = "industry.benchmark", FeatureValue = "true", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E4000000-0000-0000-0000-000000000009"), PlanId = yId, FeatureKey = "mentor.choose_by_industry", FeatureValue = "true", ValueType = "boolean", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E4000000-0000-0000-0000-000000000010"), PlanId = yId, FeatureKey = "history.retention", FeatureValue = "unlimited", ValueType = "string", CreatedAt = now },
            new PlanEntitlement { Id = Guid.Parse("E4000000-0000-0000-0000-000000000011"), PlanId = yId, FeatureKey = "support.level", FeatureValue = "Priority_24_7", ValueType = "string", CreatedAt = now }
        );
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

        var now = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var fId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var mId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var qId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        var yId = Guid.Parse("44444444-4444-4444-4444-444444444444");

        b.HasData(
            // --- Free ---
            new UsageQuotaPolicy { Id = Guid.Parse("A1000000-0000-0000-0000-000000000000"), PlanId = fId, FeatureKey = "cv.storage", PeriodType = "total", MaxValue = 1, IsUnlimited = false, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("A2000000-0000-0000-0000-000000000000"), PlanId = fId, FeatureKey = "cv.optimization", PeriodType = "daily", MaxValue = 3, IsUnlimited = false, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("A3000000-0000-0000-0000-000000000000"), PlanId = fId, FeatureKey = "interview.ai", PeriodType = "daily", MaxValue = 1, IsUnlimited = false, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("A4000000-0000-0000-0000-000000000000"), PlanId = fId, FeatureKey = "mentor.session", PeriodType = "monthly", MaxValue = 0, IsUnlimited = false, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("A5000000-0000-0000-0000-000000000000"), PlanId = fId, FeatureKey = "multi_jd.match", PeriodType = "per_match", MaxValue = 3, IsUnlimited = false, CreatedAt = now },
            // internal legacy quotas
            new UsageQuotaPolicy { Id = Guid.Parse("A6000000-0000-0000-0000-000000000000"), PlanId = fId, FeatureKey = "resume.upload", PeriodType = "daily", MaxValue = 3, IsUnlimited = false, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("A7000000-0000-0000-0000-000000000000"), PlanId = fId, FeatureKey = "resume.parse", PeriodType = "daily", MaxValue = 3, IsUnlimited = false, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("A8000000-0000-0000-0000-000000000000"), PlanId = fId, FeatureKey = "jobdescription.create", PeriodType = "daily", MaxValue = 5, IsUnlimited = false, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("A9000000-0000-0000-0000-000000000000"), PlanId = fId, FeatureKey = "match.create", PeriodType = "daily", MaxValue = 3, IsUnlimited = false, CreatedAt = now },

            // --- Monthly ---
            new UsageQuotaPolicy { Id = Guid.Parse("B1000000-0000-0000-0000-000000000000"), PlanId = mId, FeatureKey = "cv.storage", PeriodType = "total", MaxValue = 5, IsUnlimited = false, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("B2000000-0000-0000-0000-000000000000"), PlanId = mId, FeatureKey = "cv.optimization", PeriodType = "daily", MaxValue = 3, IsUnlimited = false, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("B3000000-0000-0000-0000-000000000000"), PlanId = mId, FeatureKey = "interview.ai", PeriodType = "daily", MaxValue = 1, IsUnlimited = false, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("B4000000-0000-0000-0000-000000000000"), PlanId = mId, FeatureKey = "mentor.session", PeriodType = "monthly", MaxValue = 0, IsUnlimited = false, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("B5000000-0000-0000-0000-000000000000"), PlanId = mId, FeatureKey = "multi_jd.match", PeriodType = "per_match", MaxValue = 3, IsUnlimited = false, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("B6000000-0000-0000-0000-000000000000"), PlanId = mId, FeatureKey = "resume.upload", PeriodType = "daily", MaxValue = 10, IsUnlimited = false, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("B7000000-0000-0000-0000-000000000000"), PlanId = mId, FeatureKey = "resume.parse", PeriodType = "daily", MaxValue = 10, IsUnlimited = false, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("B8000000-0000-0000-0000-000000000000"), PlanId = mId, FeatureKey = "jobdescription.create", PeriodType = "daily", MaxValue = 20, IsUnlimited = false, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("B9000000-0000-0000-0000-000000000000"), PlanId = mId, FeatureKey = "match.create", PeriodType = "daily", MaxValue = 10, IsUnlimited = false, CreatedAt = now },

            // --- Quarterly ---
            new UsageQuotaPolicy { Id = Guid.Parse("C1000000-0000-0000-0000-000000000000"), PlanId = qId, FeatureKey = "cv.storage", PeriodType = "total", MaxValue = 10, IsUnlimited = false, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("C2000000-0000-0000-0000-000000000000"), PlanId = qId, FeatureKey = "cv.optimization", PeriodType = "daily", MaxValue = 5, IsUnlimited = false, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("C3000000-0000-0000-0000-000000000000"), PlanId = qId, FeatureKey = "interview.ai", PeriodType = "daily", MaxValue = 3, IsUnlimited = false, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("C4000000-0000-0000-0000-000000000000"), PlanId = qId, FeatureKey = "mentor.session", PeriodType = "monthly", MaxValue = 3, IsUnlimited = false, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("C5000000-0000-0000-0000-000000000000"), PlanId = qId, FeatureKey = "multi_jd.match", PeriodType = "per_match", MaxValue = 10, IsUnlimited = false, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("C6000000-0000-0000-0000-000000000000"), PlanId = qId, FeatureKey = "resume.upload", PeriodType = "daily", MaxValue = 30, IsUnlimited = false, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("C7000000-0000-0000-0000-000000000000"), PlanId = qId, FeatureKey = "resume.parse", PeriodType = "daily", MaxValue = 30, IsUnlimited = false, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("C8000000-0000-0000-0000-000000000000"), PlanId = qId, FeatureKey = "jobdescription.create", PeriodType = "daily", MaxValue = 50, IsUnlimited = false, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("C9000000-0000-0000-0000-000000000000"), PlanId = qId, FeatureKey = "match.create", PeriodType = "daily", MaxValue = 30, IsUnlimited = false, CreatedAt = now },

            // --- Yearly ---
            new UsageQuotaPolicy { Id = Guid.Parse("D1000000-0000-0000-0000-000000000000"), PlanId = yId, FeatureKey = "cv.storage", PeriodType = "total", MaxValue = 999999, IsUnlimited = true, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("D2000000-0000-0000-0000-000000000000"), PlanId = yId, FeatureKey = "cv.optimization", PeriodType = "daily", MaxValue = 999999, IsUnlimited = true, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("D3000000-0000-0000-0000-000000000000"), PlanId = yId, FeatureKey = "interview.ai", PeriodType = "daily", MaxValue = 999999, IsUnlimited = true, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("D4000000-0000-0000-0000-000000000000"), PlanId = yId, FeatureKey = "mentor.session", PeriodType = "monthly", MaxValue = 4, IsUnlimited = false, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("D5000000-0000-0000-0000-000000000000"), PlanId = yId, FeatureKey = "multi_jd.match", PeriodType = "per_match", MaxValue = 20, IsUnlimited = false, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("D6000000-0000-0000-0000-000000000000"), PlanId = yId, FeatureKey = "resume.upload", PeriodType = "daily", MaxValue = 999999, IsUnlimited = true, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("D7000000-0000-0000-0000-000000000000"), PlanId = yId, FeatureKey = "resume.parse", PeriodType = "daily", MaxValue = 999999, IsUnlimited = true, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("D8000000-0000-0000-0000-000000000000"), PlanId = yId, FeatureKey = "jobdescription.create", PeriodType = "daily", MaxValue = 999999, IsUnlimited = true, CreatedAt = now },
            new UsageQuotaPolicy { Id = Guid.Parse("D9000000-0000-0000-0000-000000000000"), PlanId = yId, FeatureKey = "match.create", PeriodType = "daily", MaxValue = 999999, IsUnlimited = true, CreatedAt = now }
        );
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
