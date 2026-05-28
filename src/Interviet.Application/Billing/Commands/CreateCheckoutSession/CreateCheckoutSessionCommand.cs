using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Common.Options;
using Interviet.Contracts.Billing;
using Interviet.Domain.Billing;
using Interviet.Shared.Results;
using PayOS;
using PayOS.Models.V2.PaymentRequests;
using Microsoft.Extensions.Logging;

namespace Interviet.Application.Billing.Commands.CreateCheckoutSession;

public sealed record CreateCheckoutSessionCommand(
    Guid UserId,
    Guid? PlanId,
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
    private readonly PayOSClient _payOSClient;
    private readonly PayosConfigOptions _payosOptions;
    private readonly PaymentRedirectOptions _redirectOptions;
    private readonly ILogger<CreateCheckoutSessionCommandHandler> _logger;

    public CreateCheckoutSessionCommandHandler(
        IAppDbContext db,
        IOptions<BillingOptions> billing,
        PayOSClient payOSClient,
        IOptions<PayosConfigOptions> payosOptions,
        IOptions<PaymentRedirectOptions> redirectOptions,
        ILogger<CreateCheckoutSessionCommandHandler> logger)
    {
        _db = db;
        _billing = billing.Value;
        _payOSClient = payOSClient;
        _payosOptions = payosOptions.Value;
        _redirectOptions = redirectOptions.Value;
        _logger = logger;
    }

    public async Task<Result<CheckoutResponse>> Handle(
        CreateCheckoutSessionCommand request, CancellationToken ct)
    {
        // For PayOS, the provider code is usually "payos".
        // If PayOS is enabled, we bypass the mock check unless they explicitly ask for another mock provider and PayOS is disabled.
        var isPayos = request.Provider.Equals("payos", StringComparison.OrdinalIgnoreCase);

        if (isPayos && !_payosOptions.Enabled)
        {
            return Error.Validation("Billing.PayosDisabled", "PayOS payment provider is currently disabled.");
        }

        if (!isPayos)
        {
            if (!_billing.MockPaymentsEnabled)
                return Error.ServiceUnavailable("Billing.MockDisabled",
                    "Mock payment is not enabled in this environment.");

            if (!MockProvider.IsValid(request.Provider))
                return Error.Validation("Billing.InvalidProvider",
                    $"Provider '{request.Provider}' is not supported. Valid providers: {string.Join(", ", MockProvider.Valid)}.");
        }

        Plan? plan = null;
        if (request.PlanId.HasValue && request.PlanId.Value != Guid.Empty)
        {
            plan = await _db.Plans.FirstOrDefaultAsync(p => p.Id == request.PlanId.Value && p.IsActive, ct);
        }
        else if (!string.IsNullOrWhiteSpace(request.PlanKey))
        {
            plan = await _db.Plans.FirstOrDefaultAsync(p => p.Code == request.PlanKey && p.IsActive, ct);
        }

        if (plan is null)
            return Error.NotFound("Plan.NotFound", "Plan not found.");

        if (plan.PriceAmount <= 0)
            return Error.Validation("Billing.FreePlan",
                "Free plans cannot be purchased via checkout. Use dev-activate instead.");

        var now = DateTime.UtcNow;
        var expiresAt = now.AddMinutes(_billing.MockCheckoutTtlMinutes);

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
            ExpiresAt     = expiresAt,
            CreatedAt     = now,
            UpdatedAt     = now
        };

        int maxRetries = 3;
        string? payosErrorMessage = null;

        for (int retry = 1; retry <= maxRetries; retry++)
        {
            // Generate unique long orderCode using timestamp offset from 1/1/2026
            // If it is a retry, add a small offset (retry - 1) to resolve collisions
            var epoch = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            long orderCode = (long)(DateTime.UtcNow - epoch).TotalMilliseconds + (retry - 1);
            session.OrderCode = orderCode;

            if (isPayos && _payosOptions.Enabled)
            {
                // Build a short description (PayOS description limit is 25 chars)
                var description = $"Nap goi {plan.Code}".Length > 25
                    ? $"Nap goi {plan.Code}".Substring(0, 25)
                    : $"Nap goi {plan.Code}";

                int amount = (int)plan.PriceAmount;
                var returnUrl = !string.IsNullOrWhiteSpace(request.ReturnUrl) ? request.ReturnUrl : _redirectOptions.ReturnUrl;
                var cancelUrl = !string.IsNullOrWhiteSpace(request.CancelUrl) ? request.CancelUrl : _redirectOptions.CancelUrl;

                var payosRequest = new CreatePaymentLinkRequest
                {
                    OrderCode = orderCode,
                    Amount = amount,
                    Description = description,
                    Items = new List<PaymentLinkItem>
                    {
                        new PaymentLinkItem
                        {
                            Name = plan.Name,
                            Quantity = 1,
                            Price = amount
                        }
                    },
                    ReturnUrl = returnUrl,
                    CancelUrl = cancelUrl
                };

                try
                {
                    var payosResponse = await _payOSClient.PaymentRequests.CreateAsync(payosRequest);
                    session.CheckoutUrl = payosResponse.CheckoutUrl;
                }
                catch (Exception ex)
                {
                    payosErrorMessage = ex.Message;
                    _logger.LogWarning(ex, "Failed to create PayOS link (Attempt {Attempt}/{MaxRetries}) using OrderCode {OrderCode}.", retry, maxRetries, orderCode);
                    if (retry == maxRetries)
                    {
                        return Error.Failure("Billing.PayOSError", $"Failed to create PayOS payment link: {payosErrorMessage}");
                    }
                    continue; // Retry with another generated OrderCode
                }
            }
            else
            {
                // Fallback to mock checkout URL
                session.CheckoutUrl = $"{_billing.FrontendBaseUrl.TrimEnd('/')}/subscription/mock-checkout?checkoutSessionId={Guid.NewGuid()}";
            }

            try
            {
                if (retry == 1)
                {
                    _db.BillingCheckoutSessions.Add(session);
                }
                
                await _db.SaveChangesAsync(ct);
                break;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogWarning(ex, "OrderCode unique constraint collision detected for code {OrderCode}. Retrying (Attempt {Attempt}/{MaxRetries})...", orderCode, retry, maxRetries);
                
                if (retry == maxRetries)
                {
                    return Error.Conflict("Billing.OrderCodeCollision", "Failed to create checkout session due to persistent unique OrderCode collisions.");
                }
            }
        }

        return new CheckoutResponse
        {
            CheckoutSessionId = session.Id,
            PaymentId         = session.Id,
            CheckoutUrl       = session.CheckoutUrl ?? string.Empty,
            Status            = session.Status,
            ExpiresAt         = session.ExpiresAt,
            ExpiredAt         = session.ExpiresAt,
            Provider          = session.Provider,
            PlanKey           = session.PlanKey,
            Amount            = session.Amount,
            CurrencyCode      = session.CurrencyCode,
            PaymentInstructionsUrl = $"/api/v1/billing/checkout-sessions/{session.Id}/payment-instructions"
        };
    }
}
