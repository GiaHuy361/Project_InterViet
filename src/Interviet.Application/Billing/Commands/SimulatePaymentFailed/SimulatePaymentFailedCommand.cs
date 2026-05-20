using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Common.Options;
using Interviet.Contracts.Billing;
using Interviet.Shared.Results;

namespace Interviet.Application.Billing.Commands.SimulatePaymentFailed;

public sealed record SimulatePaymentFailedCommand(Guid UserId, Guid CheckoutSessionId, string? Reason)
    : IRequest<Result<SimulateFailedResponse>>;

public sealed class SimulatePaymentFailedCommandHandler
    : IRequestHandler<SimulatePaymentFailedCommand, Result<SimulateFailedResponse>>
{
    private readonly IAppDbContext _db;
    private readonly BillingOptions _billing;

    public SimulatePaymentFailedCommandHandler(IAppDbContext db, IOptions<BillingOptions> billing)
    {
        _db      = db;
        _billing = billing.Value;
    }

    public async Task<Result<SimulateFailedResponse>> Handle(
        SimulatePaymentFailedCommand request, CancellationToken ct)
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

        // Idempotency
        if (session.Status == CheckoutSessionStatus.Failed)
            return new SimulateFailedResponse
            {
                CheckoutSessionId = session.Id,
                Status            = session.Status,
                IsIdempotent      = true
            };

        if (session.Status == CheckoutSessionStatus.Succeeded)
            return Error.Conflict("CheckoutSession.AlreadySucceeded",
                "Cannot fail a session that has already succeeded.");

        if (session.Status == CheckoutSessionStatus.Cancelled)
            return Error.Conflict("CheckoutSession.AlreadyCancelled",
                "Cannot fail a session that has already been cancelled.");

        var now = DateTime.UtcNow;
        session.Status        = CheckoutSessionStatus.Failed;
        session.FailureReason = request.Reason ?? "Simulated failure";
        session.CompletedAt   = now;
        session.UpdatedAt     = now;

        await _db.SaveChangesAsync(ct);

        return new SimulateFailedResponse
        {
            CheckoutSessionId = session.Id,
            Status            = session.Status,
            IsIdempotent      = false
        };
    }
}
