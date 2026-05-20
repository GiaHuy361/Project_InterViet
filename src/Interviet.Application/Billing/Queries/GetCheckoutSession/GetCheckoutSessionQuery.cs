using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Billing;
using Interviet.Shared.Results;

namespace Interviet.Application.Billing.Queries.GetCheckoutSession;

public sealed record GetCheckoutSessionQuery(Guid UserId, Guid CheckoutSessionId)
    : IRequest<Result<CheckoutSessionResponse>>;

public sealed class GetCheckoutSessionQueryHandler
    : IRequestHandler<GetCheckoutSessionQuery, Result<CheckoutSessionResponse>>
{
    private readonly IAppDbContext _db;

    public GetCheckoutSessionQueryHandler(IAppDbContext db) => _db = db;

    public async Task<Result<CheckoutSessionResponse>> Handle(
        GetCheckoutSessionQuery request, CancellationToken ct)
    {
        var session = await _db.BillingCheckoutSessions
            .FirstOrDefaultAsync(s => s.Id == request.CheckoutSessionId, ct);

        if (session is null)
            return Error.NotFound("CheckoutSession.NotFound", "Checkout session not found.");

        if (session.UserId != request.UserId)
            return Error.Forbidden("CheckoutSession.Forbidden", "You do not own this checkout session.");

        return new CheckoutSessionResponse
        {
            Id            = session.Id,
            PlanKey       = session.PlanKey,
            Provider      = session.Provider,
            Amount        = session.Amount,
            CurrencyCode  = session.CurrencyCode,
            Status        = session.Status,
            CheckoutUrl   = session.CheckoutUrl,
            ExpiresAt     = session.ExpiresAt,
            CompletedAt   = session.CompletedAt,
            FailureReason = session.FailureReason,
            CreatedAt     = session.CreatedAt
        };
    }
}
