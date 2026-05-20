namespace Interviet.Application.Common.Interfaces;

public interface IAuditLogService
{
    Task LogAsync(string action, string? resource = null, string? resourceId = null, object? metadata = null);
}
