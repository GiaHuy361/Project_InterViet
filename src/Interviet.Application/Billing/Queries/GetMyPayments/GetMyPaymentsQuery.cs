using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Billing;
using Interviet.Shared.Results;

namespace Interviet.Application.Billing.Queries.GetMyPayments;

public sealed record GetMyPaymentsQuery(Guid UserId, int Page = 1, int PageSize = 20)
    : IRequest<Result<PagedResult<PaymentTransactionResponse>>>;

public sealed class GetMyPaymentsQueryHandler
    : IRequestHandler<GetMyPaymentsQuery, Result<PagedResult<PaymentTransactionResponse>>>
{
    private readonly IAppDbContext _db;

    public GetMyPaymentsQueryHandler(IAppDbContext db) => _db = db;

    public async Task<Result<PagedResult<PaymentTransactionResponse>>> Handle(
        GetMyPaymentsQuery request, CancellationToken ct)
    {
        var page     = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);

        var query = _db.PaymentTransactions.Where(t => t.UserId == request.UserId);
        var total = await query.LongCountAsync(ct);

        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new PaymentTransactionResponse
            {
                Id                = t.Id,
                Provider          = t.Provider,
                PlanKey           = t.PlanKey,
                CheckoutSessionId = t.CheckoutSessionId,
                Amount            = t.Amount,
                CurrencyCode      = t.CurrencyCode,
                Status            = t.Status,
                PaidAt            = t.PaidAt,
                FailedAt          = t.FailedAt
            })
            .ToListAsync(ct);

        return Result<PagedResult<PaymentTransactionResponse>>.Success(
            new PagedResult<PaymentTransactionResponse>(items, page, pageSize, total));
    }
}
