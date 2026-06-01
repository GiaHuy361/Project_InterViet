using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using Interviet.Application.Billing.Commands.CreateCheckoutSession;
using Interviet.Application.Billing.Commands.SimulatePaymentSuccess;
using Interviet.Application.Billing.Commands.SimulatePaymentFailed;
using Interviet.Application.Billing.Commands.SimulatePaymentCancelled;
using Interviet.Application.Billing.Queries.GetCheckoutSession;
using Interviet.Application.Billing.Queries.GetMyInvoices;
using Interviet.Application.Billing.Queries.GetMyPayments;
using Interviet.Application.Billing.Queries.GetPaymentInstructions;
using Interviet.Application.Billing.Queries.GetPaymentById;
using Interviet.Application.Billing.Commands.SubmitBankTransfer;
using Interviet.Application.Billing.Queries.GetAttempts;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Common.Options;
using Interviet.Contracts.Billing;
using Microsoft.Extensions.Options;

namespace Interviet.Api.Controllers;

[Authorize]
[Route("api/v1/billing")]
public class BillingController : ApiControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;
    private readonly IBillingSuccessService _billingSuccessService;
    private readonly IAppDbContext _db;
    private readonly BillingOptions _billing;

    public BillingController(
        IMediator mediator,
        ICurrentUserService currentUser,
        IBillingSuccessService billingSuccessService,
        IAppDbContext db,
        IOptions<BillingOptions> billing)
    {
        _mediator              = mediator;
        _currentUser           = currentUser;
        _billingSuccessService = billingSuccessService;
        _db                    = db;
        _billing               = billing.Value;
    }

    // ── Providers ─────────────────────────────────────────────────────────────

    /// <summary>Lists all supported mock payment providers.</summary>
    [HttpGet("providers")]
    public IActionResult GetProviders()
    {
        var providers = MockProvider.Valid
            .Select(p => new ProviderResponse
            {
                Provider    = p,
                DisplayName = MockProvider.GetDisplayName(p),
                IsMock      = true,
                Enabled     = true
            })
            .OrderBy(p => p.DisplayName)
            .ToList();

        return Ok(providers);
    }

    // ── Checkout ──────────────────────────────────────────────────────────────

    /// <summary>Creates a checkout session for the specified plan and provider.</summary>
    [HttpPost("checkout")]
    public async Task<IActionResult> CreateCheckout([FromBody] CheckoutRequest request)
    {
        return FromResult(await _mediator.Send(new CreateCheckoutSessionCommand(
            UserId    : _currentUser.UserId,
            PlanId    : request.PlanId,
            PlanKey   : request.PlanKey,
            Provider  : request.Provider,
            ReturnUrl : request.ReturnUrl,
            CancelUrl : request.CancelUrl
        )));
    }

    /// <summary>Gets a single checkout session by ID (must be owned by the caller).</summary>
    [HttpGet("checkout-sessions/{id:guid}")]
    public async Task<IActionResult> GetCheckoutSession(Guid id)
    {
        return FromResult(await _mediator.Send(
            new GetCheckoutSessionQuery(_currentUser.UserId, id)));
    }

    /// <summary>
    /// POST /api/v1/billing/checkout-sessions/{id}/cancel
    /// Called by Frontend when PayOS redirects to cancelUrl (user cancelled on PayOS).
    /// PayOS does NOT send a webhook on cancellation, so frontend must explicitly notify backend.
    /// </summary>
    [HttpPost("checkout-sessions/{id:guid}/cancel")]
    public async Task<IActionResult> CancelCheckoutSession(Guid id, CancellationToken ct)
    {
        var session = await _db.BillingCheckoutSessions
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == _currentUser.UserId, ct);

        if (session is null)
            return NotFound(new { error = "Checkout session not found." });

        if (session.Status == CheckoutSessionStatus.Succeeded)
            return BadRequest(new { error = "Cannot cancel a completed payment session." });

        // Idempotent — already cancelled/failed/expired
        if (session.Status is CheckoutSessionStatus.Cancelled
            or CheckoutSessionStatus.Failed
            or CheckoutSessionStatus.Expired)
            return Ok(new { message = "Session already terminated.", status = session.Status });

        session.Status       = CheckoutSessionStatus.Cancelled;
        session.FailureReason = "Cancelled by user on PayOS payment page.";
        session.CompletedAt  = DateTime.UtcNow;
        session.UpdatedAt    = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        // If this is a mentor booking, release the slot reservation
        if (session.Purpose == "mentor_booking" && session.ResourceId.HasValue)
        {
            var booking = await _db.MentorBookings
                .Include(b => b.AvailabilitySlot)
                .FirstOrDefaultAsync(b => b.Id == session.ResourceId.Value, ct);

            if (booking is not null && booking.Status == "pending_payment")
            {
                booking.Status = "cancelled";
                booking.CancelReason = "Người dùng hủy thanh toán trên cổng PayOS.";
                booking.CancelledAt = DateTime.UtcNow;
                booking.UpdatedAt = DateTime.UtcNow;

                if (booking.AvailabilitySlot is not null)
                {
                    booking.AvailabilitySlot.Status = "available";
                    booking.AvailabilitySlot.ReservedUntil = null;
                }

                await _db.SaveChangesAsync(ct);
            }
        }

        return Ok(new
        {
            message = "Phiên thanh toán đã được hủy.",
            checkoutSessionId = session.Id,
            status = session.Status
        });
    }

    // ── Simulate endpoints ────────────────────────────────────────────────────

    /// <summary>Simulates a successful payment for the checkout session.</summary>
    [HttpPost("checkout-sessions/{id:guid}/simulate-success")]
    public async Task<IActionResult> SimulateSuccess(Guid id, [FromBody] SimulateSuccessRequest _)
    {
        return FromResult(await _mediator.Send(
            new SimulatePaymentSuccessCommand(_currentUser.UserId, id)));
    }

    /// <summary>Simulates a failed payment for the checkout session.</summary>
    [HttpPost("checkout-sessions/{id:guid}/simulate-failed")]
    public async Task<IActionResult> SimulateFailed(Guid id, [FromBody] SimulateFailedRequest request)
    {
        return FromResult(await _mediator.Send(
            new SimulatePaymentFailedCommand(_currentUser.UserId, id, request.Reason)));
    }

    /// <summary>Simulates a user-cancelled payment for the checkout session.</summary>
    [HttpPost("checkout-sessions/{id:guid}/simulate-cancelled")]
    public async Task<IActionResult> SimulateCancelled(Guid id, [FromBody] SimulateCancelledRequest request)
    {
        return FromResult(await _mediator.Send(
            new SimulatePaymentCancelledCommand(_currentUser.UserId, id, request.Reason)));
    }

    // ── Phase 10B: Mock Checkout Experience ────────────────────────────────────

    /// <summary>Gets mock bank transfer payment instructions and QR code for the session.</summary>
    [HttpGet("checkout-sessions/{id:guid}/payment-instructions")]
    public async Task<IActionResult> GetPaymentInstructions(Guid id)
    {
        return FromResult(await _mediator.Send(
            new GetPaymentInstructionsQuery(_currentUser.UserId, id)));
    }

    /// <summary>Submits mock bank transfer payment details for validation.</summary>
    [HttpPost("checkout-sessions/{id:guid}/submit-bank-transfer")]
    public async Task<IActionResult> SubmitBankTransfer(Guid id, [FromBody] SubmitBankTransferRequest request)
    {
        return FromResult(await _mediator.Send(new SubmitBankTransferCommand(
            UserId: _currentUser.UserId,
            CheckoutSessionId: id,
            PayerAccountNumber: request.PayerAccountNumber,
            PayerAccountName: request.PayerAccountName,
            AmountPaid: request.AmountPaid,
            TransferContent: request.TransferContent
        )));
    }

    /// <summary>Lists all mock bank transfer validation attempts for the session.</summary>
    [HttpGet("checkout-sessions/{id:guid}/attempts")]
    public async Task<IActionResult> GetAttempts(Guid id)
    {
        return FromResult(await _mediator.Send(
            new GetAttemptsQuery(_currentUser.UserId, id)));
    }

    // ── Invoices & Payments ───────────────────────────────────────────────────

    /// <summary>Returns the current user's invoices (paginated).</summary>
    [HttpGet("invoices")]
    public async Task<IActionResult> GetInvoices([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        return FromResult(await _mediator.Send(
            new GetMyInvoicesQuery(_currentUser.UserId, page, pageSize)));
    }

    /// <summary>Returns the current user's payment transactions (paginated).</summary>
    [HttpGet("payments")]
    public async Task<IActionResult> GetPayments([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        return FromResult(await _mediator.Send(
            new GetMyPaymentsQuery(_currentUser.UserId, page, pageSize)));
    }

    /// <summary>Gets a single payment transaction by ID (must be owned by the caller).</summary>
    [HttpGet("payments/{id:guid}")]
    public async Task<IActionResult> GetPayment(Guid id)
    {
        return FromResult(await _mediator.Send(
            new GetPaymentByIdQuery(_currentUser.UserId, id)));
    }

    /// <summary>Webhook receiver for PayOS payment updates.</summary>
    [AllowAnonymous]
    [HttpPost("payos/webhook")]
    public async Task<IActionResult> PayosWebhook([FromBody] PayOS.Models.Webhooks.Webhook webhook)
    {
        var result = await _billingSuccessService.ProcessPayosWebhookAsync(webhook);
        if (result.IsFailure)
        {
            return FromResult(result);
        }
        return Ok(new { success = true });
    }
}
