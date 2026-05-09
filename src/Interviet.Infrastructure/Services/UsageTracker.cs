using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Interviet.Application.Common.Interfaces;
using Interviet.Domain.Quotas;

namespace Interviet.Infrastructure.Services;

/// <summary>
/// Upserts UserDailyUsage counters and UserQuotaCounter for feature tracking.
/// Also writes QuotaConsumptionLog for audit trail.
/// Never throws externally — on error logs warning and swallows the exception.
/// </summary>
public sealed class UsageTracker : IUsageTracker
{
    private readonly IAppDbContext _db;
    private readonly ILogger<UsageTracker> _logger;

    public UsageTracker(IAppDbContext db, ILogger<UsageTracker> logger)
    {
        _db     = db;
        _logger = logger;
    }

    public async Task TrackAsync(
        Guid userId,
        string featureKey,
        string referenceType,
        Guid? referenceId = null,
        CancellationToken ct = default)
    {
        var today     = DateOnly.FromDateTime(DateTime.UtcNow);
        var periodKey = today.ToString("yyyy-MM-dd"); // daily period

        const int MaxRetries = 3;

        for (int attempt = 0; attempt <= MaxRetries; attempt++)
        {
            try
            {
                // ── 1. Upsert UserDailyUsage ─────────────────────────────────
                var daily = await _db.UserDailyUsages
                    .FirstOrDefaultAsync(u => u.UserId == userId && u.UsageDate == today, ct);

                if (daily is null)
                {
                    daily = new UserDailyUsage
                    {
                        Id        = Guid.NewGuid(),
                        UserId    = userId,
                        UsageDate = today,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _db.UserDailyUsages.Add(daily);
                }

                IncrementDailyUsage(daily, featureKey);
                daily.UpdatedAt = DateTime.UtcNow;

                // ── 2. Upsert UserQuotaCounter (daily) ───────────────────────
                var counter = await _db.UserQuotaCounters
                    .FirstOrDefaultAsync(c =>
                        c.UserId     == userId     &&
                        c.FeatureKey == featureKey &&
                        c.PeriodType == "daily"    &&
                        c.PeriodKey  == periodKey, ct);

                if (counter is null)
                {
                    counter = new UserQuotaCounter
                    {
                        Id         = Guid.NewGuid(),
                        UserId     = userId,
                        FeatureKey = featureKey,
                        PeriodType = "daily",
                        PeriodKey  = periodKey,
                        UsedValue  = 0,
                        CreatedAt  = DateTime.UtcNow,
                        UpdatedAt  = DateTime.UtcNow
                    };
                    _db.UserQuotaCounters.Add(counter);
                }

                counter.UsedValue++;
                counter.LastConsumedAt = DateTime.UtcNow;
                counter.UpdatedAt      = DateTime.UtcNow;

                // ── 3. Write QuotaConsumptionLog ─────────────────────────────
                _db.QuotaConsumptionLogs.Add(new QuotaConsumptionLog
                {
                    Id            = Guid.NewGuid(),
                    UserId        = userId,
                    FeatureKey    = featureKey,
                    PeriodType    = "daily",
                    PeriodKey     = periodKey,
                    DeltaValue    = 1,
                    ReferenceType = referenceType,
                    ReferenceId   = referenceId,
                    Status        = "consumed",
                    CreatedAt     = DateTime.UtcNow
                });

                await _db.SaveChangesAsync(ct);
                return; // success
            }
            catch (DbUpdateConcurrencyException) when (attempt < MaxRetries)
            {
                _logger.LogDebug(
                    "UsageTracker concurrency conflict UserId={UserId} Feature={Feature}, retry {Attempt}",
                    userId, featureKey, attempt + 1);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "UsageTracker failed UserId={UserId} Feature={Feature}", userId, featureKey);
                return; // swallow — non-critical
            }
        }

        _logger.LogWarning(
            "UsageTracker gave up after {MaxRetries} retries UserId={UserId} Feature={Feature}",
            MaxRetries, userId, featureKey);
    }

    // ── Maps featureKey → the correct UserDailyUsage DB column ───────────────
    // DB column           → DTO field          → featureKeys tracked
    // CvOptimizationCount → ResumeActivityCount → resume.upload, resume.parse
    // MultiMatchCount     → MatchActivityCount  → match.create, match.complete
    // InterviewCount      → InterviewCount      → (future: interview feature)
    // MentorBookingCount  → MentorBookingCount  → (future: mentor booking)
    private static void IncrementDailyUsage(UserDailyUsage daily, string featureKey)
    {
        switch (featureKey)
        {
            case QuotaFeatureKeys.ResumeUpload:
            case QuotaFeatureKeys.ResumeParse:
                daily.CvOptimizationCount++;  // → DTO: ResumeActivityCount
                break;
            case QuotaFeatureKeys.MatchCreate:
            case QuotaFeatureKeys.MatchComplete:
                daily.MultiMatchCount++;      // → DTO: MatchActivityCount
                break;
            case QuotaFeatureKeys.JdCreate:
                // No dedicated column in UserDailyUsage — only tracked via
                // UserQuotaCounter + QuotaConsumptionLog (quota endpoint)
                break;
        }
    }
}
