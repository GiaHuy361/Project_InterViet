using System.Globalization;
using Interviet.Application.Common.Interfaces;

namespace Interviet.Infrastructure.Services;

/// <summary>
/// System clock backed by DateTime.UtcNow. Replace with a fake in tests.
/// </summary>
public sealed class DateTimeProvider : IDateTimeProvider
{
    public DateTime UtcNow => DateTime.UtcNow;
    public DateOnly TodayUtc => DateOnly.FromDateTime(DateTime.UtcNow);

    public string DailyPeriodKey(DateTime date) =>
        date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

    public string MonthlyPeriodKey(DateTime date) =>
        date.ToString("yyyy-MM", CultureInfo.InvariantCulture);

    public string WeeklyPeriodKey(DateTime date)
    {
        var cal = CultureInfo.InvariantCulture.Calendar;
        int week = cal.GetWeekOfYear(date, CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday);
        return $"{date:yyyy}-W{week:D2}";
    }
}
