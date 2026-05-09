using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Interviet.Application.Common.Interfaces;
using Interviet.Domain.Quotas;
using Interviet.Domain.Billing;
using Interviet.Shared.Results;

namespace Interviet.Infrastructure.Services;

public sealed class QuotaService : IQuotaService
{
    private readonly IAppDbContext _db;
    private readonly ILogger<QuotaService> _logger;

    public QuotaService(IAppDbContext db, ILogger<QuotaService> logger)
    {
        _db = db;
        _logger = logger;
    }

    private async Task<(Guid PlanId, UsageQuotaPolicy? Policy)> GetPolicyAsync(Guid userId, string featureKey, CancellationToken ct)
    {
        // Get active subscription
        var sub = await _db.Subscriptions
            .Where(s => s.UserId == userId && (s.Status == SubscriptionStatus.Active || s.Status == SubscriptionStatus.Trial))
            .OrderByDescending(s => s.CurrentPeriodEndsAt)
            .FirstOrDefaultAsync(ct);

        Guid planId;
        if (sub != null)
        {
            planId = sub.PlanId;
        }
        else
        {
            // Default to Free plan
            var freePlan = await _db.Plans.FirstOrDefaultAsync(p => p.Code == "free", ct);
            planId = freePlan?.Id ?? Guid.Parse("11111111-1111-1111-1111-111111111111");
        }

        var policy = await _db.UsageQuotaPolicies
            .FirstOrDefaultAsync(p => p.PlanId == planId && p.FeatureKey == featureKey, ct);

        return (planId, policy);
    }

    public async Task<Result> CheckAsync(Guid userId, string featureKey, int amount = 1, CancellationToken ct = default)
    {
        var (_, policy) = await GetPolicyAsync(userId, featureKey, ct);
        if (policy == null || (!policy.IsUnlimited && policy.MaxValue == 0)) 
            return Error.Forbidden("Quota.Exceeded", "Bạn không có quyền sử dụng tính năng này.");

        if (policy.IsUnlimited) return Result.Success();

        var periodType = policy.PeriodType;
        var periodKey = periodType switch
        {
            "daily" => DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd"),
            "monthly" => DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM"),
            "total" => "total",
            _ => "total"
        };

        var counter = await _db.UserQuotaCounters
            .FirstOrDefaultAsync(c => c.UserId == userId && c.FeatureKey == featureKey && c.PeriodType == periodType && c.PeriodKey == periodKey, ct);

        int used = counter?.UsedValue ?? 0;
        
        if (used + amount > policy.MaxValue)
        {
            return Error.Forbidden("Quota.Exceeded", $"Bạn đã dùng hết quota cho tính năng {featureKey}.");
        }

        return Result.Success();
    }

    public async Task<Result> ConsumeAsync(Guid userId, string featureKey, int amount = 1, string referenceType = "", Guid? referenceId = null, CancellationToken ct = default)
    {
        var (_, policy) = await GetPolicyAsync(userId, featureKey, ct);
        if (policy == null || (!policy.IsUnlimited && policy.MaxValue == 0)) 
            return Error.Forbidden("Quota.Exceeded", "Bạn không có quyền sử dụng tính năng này.");

        var periodType = policy.PeriodType;
        var periodKey = periodType switch
        {
            "daily" => DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd"),
            "monthly" => DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM"),
            "total" => "total",
            _ => "total"
        };

        const int MaxRetries = 3;

        for (int attempt = 0; attempt <= MaxRetries; attempt++)
        {
            try
            {
                var counter = await _db.UserQuotaCounters
                    .FirstOrDefaultAsync(c => c.UserId == userId && c.FeatureKey == featureKey && c.PeriodType == periodType && c.PeriodKey == periodKey, ct);

                if (counter == null)
                {
                    counter = new UserQuotaCounter
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        FeatureKey = featureKey,
                        PeriodType = periodType,
                        PeriodKey = periodKey,
                        UsedValue = 0,
                        RemainingValue = policy.IsUnlimited ? null : policy.MaxValue,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _db.UserQuotaCounters.Add(counter);
                }

                if (!policy.IsUnlimited && counter.UsedValue + amount > policy.MaxValue)
                {
                    return Error.Forbidden("Quota.Exceeded", $"Bạn đã dùng hết quota cho tính năng {featureKey}.");
                }

                counter.UsedValue += amount;
                counter.RemainingValue = policy.IsUnlimited ? null : Math.Max(0, policy.MaxValue - counter.UsedValue);
                counter.LastConsumedAt = DateTime.UtcNow;
                counter.UpdatedAt = DateTime.UtcNow;

                _db.QuotaConsumptionLogs.Add(new QuotaConsumptionLog
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    FeatureKey = featureKey,
                    PeriodType = periodType,
                    PeriodKey = periodKey,
                    DeltaValue = amount,
                    ReferenceType = referenceType,
                    ReferenceId = referenceId,
                    Status = "consumed",
                    CreatedAt = DateTime.UtcNow
                });

                await _db.SaveChangesAsync(ct);
                return Result.Success();
            }
            catch (DbUpdateConcurrencyException) when (attempt < MaxRetries)
            {
                _logger.LogDebug("QuotaService concurrency conflict UserId={UserId} Feature={Feature}, retry {Attempt}", userId, featureKey, attempt + 1);
            }
        }

        _logger.LogWarning("QuotaService gave up after {MaxRetries} retries UserId={UserId} Feature={Feature}", MaxRetries, userId, featureKey);
        return Error.Conflict("Quota.Conflict", "Lỗi đồng bộ quota, vui lòng thử lại.");
    }

    public async Task RefundAsync(Guid userId, string featureKey, int amount = 1, string referenceType = "", Guid? referenceId = null, string reason = "", CancellationToken ct = default)
    {
        var (_, policy) = await GetPolicyAsync(userId, featureKey, ct);
        if (policy == null) return;

        var periodType = policy.PeriodType;
        var periodKey = periodType switch
        {
            "daily" => DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd"),
            "monthly" => DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM"),
            "total" => "total",
            _ => "total"
        };

        const int MaxRetries = 3;

        for (int attempt = 0; attempt <= MaxRetries; attempt++)
        {
            try
            {
                var counter = await _db.UserQuotaCounters
                    .FirstOrDefaultAsync(c => c.UserId == userId && c.FeatureKey == featureKey && c.PeriodType == periodType && c.PeriodKey == periodKey, ct);

                if (counter != null && counter.UsedValue >= amount)
                {
                    counter.UsedValue -= amount;
                    counter.RemainingValue = policy.IsUnlimited ? null : (policy.MaxValue > 0 ? policy.MaxValue - counter.UsedValue : null);
                    counter.UpdatedAt = DateTime.UtcNow;

                    _db.QuotaConsumptionLogs.Add(new QuotaConsumptionLog
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        FeatureKey = featureKey,
                        PeriodType = periodType,
                        PeriodKey = periodKey,
                        DeltaValue = -amount,
                        ReferenceType = referenceType,
                        ReferenceId = referenceId,
                        Status = "refunded",
                        Reason = reason,
                        CreatedAt = DateTime.UtcNow
                    });

                    await _db.SaveChangesAsync(ct);
                }
                return;
            }
            catch (DbUpdateConcurrencyException) when (attempt < MaxRetries)
            {
                _logger.LogDebug("QuotaService refund concurrency conflict UserId={UserId} Feature={Feature}, retry {Attempt}", userId, featureKey, attempt + 1);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "QuotaService refund failed UserId={UserId} Feature={Feature}", userId, featureKey);
                return;
            }
        }
    }
}
