namespace Interviet.Contracts.Common;

/// <summary>
/// Standard API response envelope.
/// All endpoints return this shape for consistent client parsing.
/// </summary>
public class ApiResponse<T>
{
    public bool Success { get; init; }
    public string? Message { get; init; }
    public T? Data { get; init; }
    public ApiMeta Meta { get; init; } = new();

    public static ApiResponse<T> Ok(T data, string? message = null) => new()
    {
        Success = true,
        Message = message,
        Data = data
    };

    public static ApiResponse<object> Fail(string message) => new()
    {
        Success = false,
        Message = message
    };
}

public class ApiMeta
{
    public string RequestId { get; init; } = string.Empty;
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;
}

/// <summary>Paginated response wrapper matching the blueprint pagination model.</summary>
public class PaginatedResponse<T>
{
    public bool Success { get; init; } = true;
    public IReadOnlyList<T> Data { get; init; } = [];
    public PaginationMeta Meta { get; init; } = new();
}

public class PaginationMeta
{
    public int Page { get; init; }
    public int PageSize { get; init; }
    public long TotalItems { get; init; }
    public int TotalPages => (int)Math.Ceiling((double)TotalItems / PageSize);
    public string RequestId { get; init; } = string.Empty;
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;
}
