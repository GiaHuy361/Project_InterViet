using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Interviet.Application.Common.Interfaces;
using Interviet.Domain.Quotas;

namespace Interviet.Infrastructure.Services;

/// <summary>
/// Upserts UserDailyUsage counters for feature tracking.
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

    public Task TrackCvOptimizationAsync(Guid userId, DateOnly date, CancellationToken ct = default)
        => TrackAsync(userId, date, u => u.CvOptimizationCount++, ct);

    public Task TrackInterviewAsync(Guid userId, DateOnly date, CancellationToken ct = default)
        => TrackAsync(userId, date, u => u.InterviewCount++, ct);

    public Task TrackMultiMatchAsync(Guid userId, DateOnly date, CancellationToken ct = default)
        => TrackAsync(userId, date, u => u.MultiMatchCount++, ct);

    public Task TrackMentorBookingAsync(Guid userId, DateOnly date, CancellationToken ct = default)
        => TrackAsync(userId, date, u => u.MentorBookingCount++, ct);

    // ── Core upsert ───────────────────────────────────────────────────────────
    private async Task TrackAsync(
        Guid userId,
        DateOnly date,
        Action<UserDailyUsage> increment,
        CancellationToken ct)
    {
        const int MaxRetries = 3;

        for (int attempt = 0; attempt <= MaxRetries; attempt++)
        {
            try
            {
                var row = await _db.UserDailyUsages
                    .FirstOrDefaultAsync(u => u.UserId == userId && u.UsageDate == date, ct);

                if (row is null)
                {
                    row = new UserDailyUsage
                    {
                        Id        = Guid.NewGuid(),
                        UserId    = userId,
                        UsageDate = date,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _db.UserDailyUsages.Add(row);
                }

                increment(row);
                row.UpdatedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync(ct);
                return; // success
            }
            catch (DbUpdateConcurrencyException) when (attempt < MaxRetries)
            {
                // Retry on optimistic concurrency conflict
                _logger.LogDebug(
                    "UsageTracker concurrency conflict for UserId={UserId} Date={Date}, retrying attempt {Attempt}",
                    userId, date, attempt + 1);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "UsageTracker failed for UserId={UserId} Date={Date}", userId, date);
                return; // swallow — non-critical
            }
        }

        _logger.LogWarning(
            "UsageTracker gave up after {MaxRetries} retries for UserId={UserId} Date={Date}",
            MaxRetries, userId, date);
    }
}
