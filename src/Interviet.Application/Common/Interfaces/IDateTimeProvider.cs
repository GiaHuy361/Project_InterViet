namespace Interviet.Application.Common.Interfaces;

/// <summary>
/// Testable clock abstraction — avoids DateTime.UtcNow calls sprinkled in handlers.
/// </summary>
public interface IDateTimeProvider
{
    DateTime UtcNow { get; }
    DateOnly TodayUtc { get; }
    string DailyPeriodKey(DateTime date);   // e.g. "2026-04-23"
    string MonthlyPeriodKey(DateTime date); // e.g. "2026-04"
    string WeeklyPeriodKey(DateTime date);  // e.g. "2026-W17"
}
