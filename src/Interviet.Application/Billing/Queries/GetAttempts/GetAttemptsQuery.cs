using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Common.Options;
using Interviet.Contracts.Billing;
using Interviet.Shared.Results;

namespace Interviet.Application.Billing.Queries.GetAttempts;

public sealed record GetAttemptsQuery(Guid UserId, Guid CheckoutSessionId)
    : IRequest<Result<List<AttemptResponse>>>;

public sealed class GetAttemptsQueryHandler
    : IRequestHandler<GetAttemptsQuery, Result<List<AttemptResponse>>>
{
    private readonly IAppDbContext _db;
    private readonly BillingOptions _billing;

    public GetAttemptsQueryHandler(
        IAppDbContext db,
        IOptions<BillingOptions> billing)
    {
        _db = db;
        _billing = billing.Value;
    }

    public async Task<Result<List<AttemptResponse>>> Handle(
        GetAttemptsQuery request, CancellationToken ct)
    {
        if (!_billing.MockPaymentsEnabled)
            return Error.ServiceUnavailable("Billing.MockDisabled",
                "Mock payment is not enabled in this environment.");

        var session = await _db.BillingCheckoutSessions
            .FirstOrDefaultAsync(s => s.Id == request.CheckoutSessionId, ct);

        if (session is null)
            return Error.NotFound("CheckoutSession.NotFound", "Checkout session not found.");

        if (session.UserId != request.UserId)
            return Error.Forbidden("CheckoutSession.Forbidden", "You do not own this checkout session.");

        var attempts = await _db.BillingPaymentAttempts
            .Where(a => a.CheckoutSessionId == request.CheckoutSessionId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new AttemptResponse
            {
                Id = a.Id,
                CheckoutSessionId = a.CheckoutSessionId,
                Provider = a.Provider,
                Method = a.Method,
                PayerAccountNumberMasked = a.PayerAccountNumberMasked,
                PayerAccountName = a.PayerAccountName,
                AmountPaid = a.AmountPaid,
                CurrencyCode = a.CurrencyCode,
                TransferContent = a.TransferContent,
                Status = a.Status,
                RejectionReason = a.RejectionReason,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync(ct);

        return attempts;
    }
}
