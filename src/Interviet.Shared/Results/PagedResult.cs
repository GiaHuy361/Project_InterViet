namespace Interviet.Shared.Results;

/// <summary>
/// Wraps paginated results for list endpoints.
/// </summary>
public sealed class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; }
    public int Page { get; }
    public int PageSize { get; }
    public long TotalItems { get; }
    public int TotalPages => (int)Math.Ceiling((double)TotalItems / PageSize);

    public PagedResult(IReadOnlyList<T> items, int page, int pageSize, long totalItems)
    {
        Items = items;
        Page = page;
        PageSize = pageSize;
        TotalItems = totalItems;
    }

    public static PagedResult<T> Empty(int page, int pageSize) =>
        new([], page, pageSize, 0);
}
