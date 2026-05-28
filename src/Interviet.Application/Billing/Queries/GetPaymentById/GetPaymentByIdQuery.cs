using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Billing;
using Interviet.Shared.Results;

namespace Interviet.Application.Billing.Queries.GetPaymentById;

public sealed record GetPaymentByIdQuery(Guid UserId, Guid PaymentId)
    : IRequest<Result<PaymentTransactionResponse>>;

public sealed class GetPaymentByIdQueryHandler
    : IRequestHandler<GetPaymentByIdQuery, Result<PaymentTransactionResponse>>
{
    private readonly IAppDbContext _db;

    public GetPaymentByIdQueryHandler(IAppDbContext db) => _db = db;

    public async Task<Result<PaymentTransactionResponse>> Handle(
        GetPaymentByIdQuery request, CancellationToken ct)
    {
        var payment = await _db.PaymentTransactions
            .FirstOrDefaultAsync(t => t.Id == request.PaymentId || t.CheckoutSessionId == request.PaymentId, ct);

        if (payment is null)
            return Error.NotFound("Payment.NotFound", "Payment transaction not found.");

        if (payment.UserId != request.UserId)
            return Error.Forbidden("Payment.Forbidden", "You do not own this payment transaction.");

        return new PaymentTransactionResponse
        {
            Id                = payment.Id,
            Provider          = payment.Provider,
            PlanKey           = payment.PlanKey,
            CheckoutSessionId = payment.CheckoutSessionId,
            Purpose           = payment.Purpose,
            Description       = payment.Description,
            Amount            = payment.Amount,
            CurrencyCode      = payment.CurrencyCode,
            Status            = payment.Status,
            PaidAt            = payment.PaidAt,
            FailedAt          = payment.FailedAt
        };
    }
}
