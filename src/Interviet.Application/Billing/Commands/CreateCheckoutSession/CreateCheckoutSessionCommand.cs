using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Common.Options;
using Interviet.Contracts.Billing;
using Interviet.Domain.Billing;
using Interviet.Shared.Results;

namespace Interviet.Application.Billing.Commands.CreateCheckoutSession;

public sealed record CreateCheckoutSessionCommand(
    Guid UserId,
    string PlanKey,
    string Provider,
    string? ReturnUrl,
    string? CancelUrl
) : IRequest<Result<CheckoutResponse>>;

public sealed class CreateCheckoutSessionCommandHandler
    : IRequestHandler<CreateCheckoutSessionCommand, Result<CheckoutResponse>>
{
    private readonly IAppDbContext _db;
    private readonly BillingOptions _billing;

    public CreateCheckoutSessionCommandHandler(IAppDbContext db, IOptions<BillingOptions> billing)
    {
        _db = db;
        _billing = billing.Value;
    }

    public async Task<Result<CheckoutResponse>> Handle(
        CreateCheckoutSessionCommand request, CancellationToken ct)
    {
        if (!_billing.MockPaymentsEnabled)
            return Error.ServiceUnavailable("Billing.MockDisabled",
                "Mock payment is not enabled in this environment.");

        if (!MockProvider.IsValid(request.Provider))
            return Error.Validation("Billing.InvalidProvider",
                $"Provider '{request.Provider}' is not supported. Valid providers: {string.Join(", ", MockProvider.Valid)}.");

        var plan = await _db.Plans
            .FirstOrDefaultAsync(p => p.Code == request.PlanKey && p.IsActive, ct);

        if (plan is null)
            return Error.NotFound("Plan.NotFound", $"Plan '{request.PlanKey}' not found.");

        if (plan.PriceAmount <= 0)
            return Error.Validation("Billing.FreePlan",
                "Free plans cannot be purchased via checkout. Use dev-activate instead.");

        var now = DateTime.UtcNow;
        var session = new BillingCheckoutSession
        {
            Id            = Guid.NewGuid(),
            UserId        = request.UserId,
            PlanId        = plan.Id,
            PlanKey       = plan.Code,
            Provider      = request.Provider.ToLowerInvariant(),
            Amount        = plan.PriceAmount,
            CurrencyCode  = plan.CurrencyCode,
            Status        = CheckoutSessionStatus.Pending,
            ReturnUrl     = request.ReturnUrl,
            CancelUrl     = request.CancelUrl,
            ExpiresAt     = now.AddMinutes(_billing.MockCheckoutTtlMinutes),
            CreatedAt     = now,
            UpdatedAt     = now
        };

        session.CheckoutUrl =
            $"{_billing.FrontendBaseUrl.TrimEnd('/')}/subscription/mock-checkout?checkoutSessionId={session.Id}";

        _db.BillingCheckoutSessions.Add(session);
        await _db.SaveChangesAsync(ct);

        return new CheckoutResponse
        {
            CheckoutSessionId = session.Id,
            CheckoutUrl       = session.CheckoutUrl,
            Status            = session.Status,
            ExpiresAt         = session.ExpiresAt,
            Provider          = session.Provider,
            PlanKey           = session.PlanKey,
            Amount            = session.Amount,
            CurrencyCode      = session.CurrencyCode
        };
    }
}
