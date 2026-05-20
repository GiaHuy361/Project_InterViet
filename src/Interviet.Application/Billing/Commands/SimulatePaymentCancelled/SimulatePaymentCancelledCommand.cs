using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Common.Options;
using Interviet.Contracts.Billing;
using Interviet.Shared.Results;

namespace Interviet.Application.Billing.Commands.SimulatePaymentCancelled;

public sealed record SimulatePaymentCancelledCommand(Guid UserId, Guid CheckoutSessionId, string? Reason)
    : IRequest<Result<SimulateCancelledResponse>>;

public sealed class SimulatePaymentCancelledCommandHandler
    : IRequestHandler<SimulatePaymentCancelledCommand, Result<SimulateCancelledResponse>>
{
    private readonly IAppDbContext _db;
    private readonly BillingOptions _billing;

    public SimulatePaymentCancelledCommandHandler(IAppDbContext db, IOptions<BillingOptions> billing)
    {
        _db      = db;
        _billing = billing.Value;
    }

    public async Task<Result<SimulateCancelledResponse>> Handle(
        SimulatePaymentCancelledCommand request, CancellationToken ct)
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
        if (session.Status == CheckoutSessionStatus.Cancelled)
            return new SimulateCancelledResponse
            {
                CheckoutSessionId = session.Id,
                Status            = session.Status,
                IsIdempotent      = true
            };

        if (session.Status == CheckoutSessionStatus.Succeeded)
            return Error.Conflict("CheckoutSession.AlreadySucceeded",
                "Cannot cancel a session that has already succeeded.");

        if (session.Status == CheckoutSessionStatus.Failed)
            return Error.Conflict("CheckoutSession.AlreadyFailed",
                "Cannot cancel a session that has already failed.");

        var now = DateTime.UtcNow;
        session.Status        = CheckoutSessionStatus.Cancelled;
        session.FailureReason = request.Reason ?? "User cancelled";
        session.CompletedAt   = now;
        session.UpdatedAt     = now;

        await _db.SaveChangesAsync(ct);

        return new SimulateCancelledResponse
        {
            CheckoutSessionId = session.Id,
            Status            = session.Status,
            IsIdempotent      = false
        };
    }
}
