using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Common.Options;
using Interviet.Contracts.Billing;
using Interviet.Contracts.Notifications;
using Interviet.Domain.Billing;
using Interviet.Shared.Results;

namespace Interviet.Infrastructure.Services;

public sealed class BillingSuccessService : IBillingSuccessService
{
    private readonly IAppDbContext _db;
    private readonly BillingOptions _billing;
    private readonly IEmailService _emailService;
    private readonly INotificationService _notificationService;
    private readonly ILogger<BillingSuccessService> _logger;

    public BillingSuccessService(
        IAppDbContext db,
        IOptions<BillingOptions> billing,
        IEmailService emailService,
        INotificationService notificationService,
        ILogger<BillingSuccessService> logger)
    {
        _db                  = db;
        _billing             = billing.Value;
        _emailService        = emailService;
        _notificationService = notificationService;
        _logger              = logger;
    }

    public async Task<Result<SimulateSuccessResponse>> ProcessPaymentSuccessAsync(
        Guid userId,
        Guid checkoutSessionId,
        string? methodType = null,
        string? externalTxId = null,
        CancellationToken ct = default)
    {
        if (!_billing.MockPaymentsEnabled)
            return Error.ServiceUnavailable("Billing.MockDisabled",
                "Mock payment is not enabled in this environment.");

        // Load session
        var session = await _db.BillingCheckoutSessions
            .FirstOrDefaultAsync(s => s.Id == checkoutSessionId, ct);

        if (session is null)
            return Error.NotFound("CheckoutSession.NotFound", "Checkout session not found.");

        if (session.UserId != userId)
            return Error.Forbidden("CheckoutSession.Forbidden", "You do not own this checkout session.");

        // Idempotency: already succeeded
        if (session.Status == CheckoutSessionStatus.Succeeded)
        {
            var existingTx = await _db.PaymentTransactions
                .FirstOrDefaultAsync(t => t.CheckoutSessionId == session.Id, ct);
            var existingInv = await _db.Invoices
                .FirstOrDefaultAsync(i => i.CheckoutSessionId == session.Id, ct);
            var existingSub = await _db.Subscriptions
                .FirstOrDefaultAsync(s => s.UserId == userId
                    && s.Status == SubscriptionStatus.Active, ct);

            return new SimulateSuccessResponse
            {
                CheckoutSessionId    = session.Id,
                PaymentTransactionId = existingTx?.Id ?? Guid.Empty,
                InvoiceId            = existingInv?.Id ?? Guid.Empty,
                InvoiceNumber        = existingInv?.InvoiceNumber ?? string.Empty,
                IsIdempotent         = true,
                EmailSent            = false,
                SubscriptionId       = existingSub?.Id ?? Guid.Empty
            };
        }

        // Cannot succeed if already terminal
        if (session.Status is CheckoutSessionStatus.Failed or CheckoutSessionStatus.Cancelled)
            return Error.Conflict("CheckoutSession.AlreadyTerminal",
                $"Cannot simulate success: session is already '{session.Status}'.");

        if (session.Status == CheckoutSessionStatus.Expired || DateTime.UtcNow > session.ExpiresAt)
        {
            session.Status    = CheckoutSessionStatus.Expired;
            session.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return Error.Conflict("CheckoutSession.Expired", "This checkout session has expired.");
        }

        // Load plan + user
        var plan = await _db.Plans.FirstOrDefaultAsync(p => p.Id == session.PlanId, ct);
        if (plan is null)
            return Error.NotFound("Plan.NotFound", "Plan associated with checkout session not found.");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null)
            return Error.NotFound("User.NotFound", "User not found.");

        var now = DateTime.UtcNow;

        // ── Transaction: update session, create payment, invoice, activate subscription ──
        session.Status      = CheckoutSessionStatus.Succeeded;
        session.CompletedAt = now;
        session.UpdatedAt   = now;

        // Create payment transaction
        var tx = new PaymentTransaction
        {
            Id                  = Guid.NewGuid(),
            UserId              = userId,
            PlanId              = session.PlanId,
            PlanKey             = session.PlanKey,
            CheckoutSessionId   = session.Id,
            Provider            = session.Provider,
            MethodType          = methodType ?? "bank_transfer",
            ExternalTransactionId = externalTxId,
            Amount              = session.Amount,
            CurrencyCode        = session.CurrencyCode,
            Status              = PaymentStatus.Succeeded,
            PaidAt              = now,
            CreatedAt           = now,
            UpdatedAt           = now
        };
        _db.PaymentTransactions.Add(tx);

        // Generate invoice number: IVT-{yyyyMMdd}-{seq:D4}
        var todayStr = now.ToString("yyyyMMdd");
        var todayStart = now.Date;
        var todayEnd   = todayStart.AddDays(1);
        var countToday = await _db.Invoices
            .CountAsync(i => i.CreatedAt >= todayStart && i.CreatedAt < todayEnd, ct);
        var invoiceNumber = $"IVT-{todayStr}-{(countToday + 1):D4}";

        var invoice = new Invoice
        {
            Id                  = Guid.NewGuid(),
            UserId              = userId,
            PaymentTransactionId = tx.Id,
            CheckoutSessionId   = session.Id,
            PlanId              = session.PlanId,
            PlanKey             = session.PlanKey,
            InvoiceNumber       = invoiceNumber,
            Amount              = session.Amount,
            CurrencyCode        = session.CurrencyCode,
            Status              = InvoiceStatus.Paid,
            IssuedAt            = now,
            PaidAt              = now,
            CreatedAt           = now
        };
        _db.Invoices.Add(invoice);

        // Activate / update subscription
        var endsAt = plan.BillingCycle switch
        {
            "monthly"   => now.AddMonths(1),
            "quarterly" => now.AddMonths(3),
            "yearly"    => now.AddYears(1),
            _           => now.AddMonths(1)
        };

        var existingActiveSub = await _db.Subscriptions
            .FirstOrDefaultAsync(s => s.UserId == userId
                && (s.Status == SubscriptionStatus.Active
                    || s.Status == SubscriptionStatus.Trial
                    || s.Status == SubscriptionStatus.GracePeriod), ct);

        Guid subscriptionId;
        Guid? fromPlanId = null;

        if (existingActiveSub is not null)
        {
            fromPlanId = existingActiveSub.PlanId;
            existingActiveSub.PlanId                = plan.Id;
            existingActiveSub.Status                = SubscriptionStatus.Active;
            existingActiveSub.CurrentPeriodStartsAt = now;
            existingActiveSub.CurrentPeriodEndsAt   = endsAt;
            existingActiveSub.AutoRenewEnabled      = false; // mock: no real auto-renewal
            existingActiveSub.CancelAtPeriodEnd     = false;
            existingActiveSub.UpdatedAt             = now;
            subscriptionId = existingActiveSub.Id;

            _db.SubscriptionChangeLogs.Add(new SubscriptionChangeLog
            {
                Id             = Guid.NewGuid(),
                SubscriptionId = existingActiveSub.Id,
                UserId         = userId,
                ChangeType     = "mock_payment_upgrade",
                FromPlanId     = fromPlanId,
                ToPlanId       = plan.Id,
                EffectiveAt    = now,
                Reason         = $"Mock payment via {session.Provider} (invoice {invoiceNumber})",
                CreatedAt      = now
            });
        }
        else
        {
            var newSub = new Domain.Billing.Subscription
            {
                Id                      = Guid.NewGuid(),
                UserId                  = userId,
                PlanId                  = plan.Id,
                Status                  = SubscriptionStatus.Active,
                CurrentPeriodStartsAt   = now,
                CurrentPeriodEndsAt     = endsAt,
                AutoRenewEnabled        = false,
                CancelAtPeriodEnd       = false,
                CreatedAt               = now,
                UpdatedAt               = now
            };
            _db.Subscriptions.Add(newSub);
            subscriptionId = newSub.Id;

            _db.SubscriptionChangeLogs.Add(new SubscriptionChangeLog
            {
                Id             = Guid.NewGuid(),
                SubscriptionId = newSub.Id,
                UserId         = userId,
                ChangeType     = "mock_payment_activate",
                FromPlanId     = null,
                ToPlanId       = plan.Id,
                EffectiveAt    = now,
                Reason         = $"Mock payment via {session.Provider} (invoice {invoiceNumber})",
                CreatedAt      = now
            });
        }

        invoice.SubscriptionId = subscriptionId;

        await _db.SaveChangesAsync(ct);

        // ── Fire-and-forget email (do not rollback on email failure) ──────────
        var emailSent = false;
        try
        {
            var displayAmount = session.CurrencyCode == "VND"
                ? $"{session.Amount:N0} ₫"
                : $"{session.Amount:N2} {session.CurrencyCode}";

            var providerDisplay = MockProvider.GetDisplayName(session.Provider);
            var subscriptionUrl = $"{_billing.FrontendBaseUrl.TrimEnd('/')}/subscription";

            var htmlBody = $"""
                <h2>Thanh toán thành công!</h2>
                <p>Xin chào <strong>{user.FullName}</strong>,</p>
                <p>Gói <strong>{plan.Name}</strong> của bạn đã được kích hoạt thành công qua {providerDisplay}.</p>
                <table border="0" cellpadding="6" style="border-collapse:collapse;">
                  <tr><td><strong>Mã hóa đơn:</strong></td><td>{invoiceNumber}</td></tr>
                  <tr><td><strong>Số tiền:</strong></td><td>{displayAmount}</td></tr>
                  <tr><td><strong>Ngày thanh toán:</strong></td><td>{now:dd/MM/yyyy HH:mm} UTC</td></tr>
                  <tr><td><strong>Hiệu lực từ:</strong></td><td>{now:dd/MM/yyyy}</td></tr>
                  <tr><td><strong>Hiệu lực đến:</strong></td><td>{endsAt:dd/MM/yyyy}</td></tr>
                </table>
                <p style="margin-top:16px;">
                  <a href="{subscriptionUrl}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
                    Xem thông tin gói dịch vụ
                  </a>
                </p>
                <p style="margin-top:24px;color:#666;">Trân trọng,<br/>Đội ngũ INTER-VIET</p>
                """;

            await _emailService.SendAsync(new EmailMessage(
                ToAddress : user.Email,
                ToName    : user.FullName,
                Subject   : "Thanh toán INTER-VIET thành công",
                HtmlBody  : htmlBody
            ), ct);

            emailSent = true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Failed to send payment success email to user {UserId} for invoice {InvoiceNumber}",
                userId, invoiceNumber);
        }

        // ── Fire-and-forget in-app notification ──────────────────────────────
        _ = Task.Run(async () =>
        {
            try
            {
                var displayAmount = session.CurrencyCode == "VND"
                    ? $"{session.Amount:N0} ₫"
                    : $"{session.Amount:N2} {session.CurrencyCode}";

                await _notificationService.CreateAsync(
                    userId           : userId,
                    type             : NotificationType.BillingPaymentSucceeded,
                    title            : "Thanh toán thành công",
                    message          : $"Gói {plan.Name} của bạn đã được kích hoạt thành công. Số tiền: {displayAmount}.",
                    actionUrl        : "/subscription",
                    data             : new
                    {
                        checkoutSessionId = session.Id,
                        paymentId         = tx.Id,
                        invoiceId         = invoice.Id,
                        subscriptionId,
                        planKey           = session.PlanKey,
                        provider          = session.Provider,
                        amount            = session.Amount,
                        currencyCode      = session.CurrencyCode
                    },
                    priority         : NotificationPriority.Normal,
                    deduplicationKey : $"{NotificationType.BillingPaymentSucceeded}:{session.Id}");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to create payment success notification. UserId={UserId}", userId);
            }
        });

        return new SimulateSuccessResponse
        {
            CheckoutSessionId    = session.Id,
            PaymentTransactionId = tx.Id,
            InvoiceId            = invoice.Id,
            InvoiceNumber        = invoiceNumber,
            IsIdempotent         = false,
            EmailSent            = emailSent,
            SubscriptionId       = subscriptionId
        };
    }
}
