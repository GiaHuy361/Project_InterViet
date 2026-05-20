using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Billing;
using Interviet.Shared.Results;

namespace Interviet.Application.Billing.Queries.GetMyInvoices;

public sealed record GetMyInvoicesQuery(Guid UserId, int Page = 1, int PageSize = 20)
    : IRequest<Result<Interviet.Shared.Results.PagedResult<InvoiceResponse>>>;

public sealed class GetMyInvoicesQueryHandler
    : IRequestHandler<GetMyInvoicesQuery, Result<Interviet.Shared.Results.PagedResult<InvoiceResponse>>>
{
    private readonly IAppDbContext _db;

    public GetMyInvoicesQueryHandler(IAppDbContext db) => _db = db;

    public async Task<Result<Interviet.Shared.Results.PagedResult<InvoiceResponse>>> Handle(
        GetMyInvoicesQuery request, CancellationToken ct)
    {
        var page     = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);

        var query = _db.Invoices.Where(i => i.UserId == request.UserId);
        var total = await query.LongCountAsync(ct);

        var items = await query
            .OrderByDescending(i => i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(i => new InvoiceResponse
            {
                Id            = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                PlanKey       = i.PlanKey,
                Provider      = i.CheckoutSessionId.HasValue
                    ? _db.BillingCheckoutSessions
                        .Where(cs => cs.Id == i.CheckoutSessionId)
                        .Select(cs => cs.Provider)
                        .FirstOrDefault() ?? string.Empty
                    : string.Empty,
                Purpose      = i.Purpose,
                Description  = i.Description,
                Amount       = i.Amount,
                CurrencyCode = i.CurrencyCode,
                Status       = i.Status,
                IssuedAt     = i.IssuedAt,
                DueAt        = i.DueAt,
                PaidAt       = i.PaidAt
            })
            .ToListAsync(ct);

        return Interviet.Shared.Results.Result<Interviet.Shared.Results.PagedResult<InvoiceResponse>>.Success(
            new Interviet.Shared.Results.PagedResult<InvoiceResponse>(items, page, pageSize, total));
    }
}
