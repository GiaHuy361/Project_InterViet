using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Common.Options;
using Interviet.Contracts.Billing;
using Interviet.Contracts.Notifications;
using Interviet.Domain.Billing;
using Interviet.Shared.Results;
using PayOS;
using PayOS.Models.Webhooks;
using Microsoft.AspNetCore.SignalR;
using Interviet.Infrastructure.Hubs;

namespace Interviet.Infrastructure.Services;

public sealed class BillingSuccessService : IBillingSuccessService
{
    private readonly IAppDbContext _db;
    private readonly BillingOptions _billing;
    private readonly MentorNetworkOptions _mentorOptions;
    private readonly IEmailService _emailService;
    private readonly INotificationService _notificationService;
    private readonly ILogger<BillingSuccessService> _logger;
    private readonly PayOSClient _payOSClient;
    private readonly IHubContext<NotificationHub> _hubContext;

    public BillingSuccessService(
        IAppDbContext db,
        IOptions<BillingOptions> billing,
        IOptions<MentorNetworkOptions> mentorOptions,
        IEmailService emailService,
        INotificationService notificationService,
        ILogger<BillingSuccessService> logger,
        PayOSClient payOSClient,
        IHubContext<NotificationHub> hubContext)
    {
        _db                  = db;
        _billing             = billing.Value;
        _mentorOptions       = mentorOptions.Value;
        _emailService        = emailService;
        _notificationService = notificationService;
        _logger              = logger;
        _payOSClient         = payOSClient;
        _hubContext          = hubContext;
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

            Guid existingSubId = Guid.Empty;
            if (session.Purpose != "mentor_booking")
            {
                var existingSub = await _db.Subscriptions
                    .FirstOrDefaultAsync(s => s.UserId == userId
                        && s.Status == SubscriptionStatus.Active, ct);
                existingSubId = existingSub?.Id ?? Guid.Empty;
            }

            return new SimulateSuccessResponse
            {
                CheckoutSessionId    = session.Id,
                PaymentTransactionId = existingTx?.Id ?? Guid.Empty,
                InvoiceId            = existingInv?.Id ?? Guid.Empty,
                InvoiceNumber        = existingInv?.InvoiceNumber ?? string.Empty,
                IsIdempotent         = true,
                EmailSent            = false,
                SubscriptionId       = existingSubId
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

        return await CompletePaymentAsync(session, methodType ?? "bank_transfer", externalTxId, ct);
    }

    public async Task<Result<SimulateSuccessResponse>> ProcessPayosWebhookAsync(
        Webhook webhook,
        CancellationToken ct = default)
    {
        // 1. Verify webhook signature
        WebhookData webhookData;
        try
        {
            webhookData = await _payOSClient.Webhooks.VerifyAsync(webhook);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to verify PayOS webhook signature. Signature: {Signature}", webhook.Signature);
            return Error.Validation("Billing.WebhookSignatureInvalid", "Webhook signature verification failed.");
        }

        // 2. Load session by unique OrderCode
        var session = await _db.BillingCheckoutSessions
            .FirstOrDefaultAsync(s => s.OrderCode == webhookData.OrderCode, ct);

        if (session is null)
        {
            _logger.LogWarning("PayOS Webhook: Checkout session with OrderCode {OrderCode} not found in database. Treating as a test/ping request for PayOS validation.", webhookData.OrderCode);
            return new SimulateSuccessResponse
            {
                CheckoutSessionId = Guid.Empty,
                InvoiceNumber = "PING-SUCCESS",
                IsIdempotent = true,
                EmailSent = false
            };
        }

        // 3. Idempotency check: already succeeded
        if (session.Status == CheckoutSessionStatus.Succeeded)
        {
            _logger.LogInformation("PayOS Webhook: Checkout session {CheckoutSessionId} with OrderCode {OrderCode} is already succeeded. Returning 200 (idempotent).", session.Id, session.OrderCode);
            
            var existingTx = await _db.PaymentTransactions
                .FirstOrDefaultAsync(t => t.CheckoutSessionId == session.Id, ct);
            var existingInv = await _db.Invoices
                .FirstOrDefaultAsync(i => i.CheckoutSessionId == session.Id, ct);

            Guid existingSubId = Guid.Empty;
            if (session.Purpose != "mentor_booking")
            {
                var existingSub = await _db.Subscriptions
                    .FirstOrDefaultAsync(s => s.UserId == session.UserId
                        && s.Status == SubscriptionStatus.Active, ct);
                existingSubId = existingSub?.Id ?? Guid.Empty;
            }

            return new SimulateSuccessResponse
            {
                CheckoutSessionId    = session.Id,
                PaymentTransactionId = existingTx?.Id ?? Guid.Empty,
                InvoiceId            = existingInv?.Id ?? Guid.Empty,
                InvoiceNumber        = existingInv?.InvoiceNumber ?? string.Empty,
                IsIdempotent         = true,
                EmailSent            = false,
                SubscriptionId       = existingSubId
            };
        }

        // 4. Verify payment status
        if (!webhook.Success || webhook.Code != "00" || webhookData.Code != "00")
        {
            _logger.LogWarning("PayOS Webhook reported transaction failure. Success={Success}, Code={Code}, DataCode={DataCode}, OrderCode={OrderCode}", webhook.Success, webhook.Code, webhookData.Code, webhookData.OrderCode);
            
            session.Status = CheckoutSessionStatus.Failed;
            session.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            
            // Push SignalR payment.updated
            try
            {
                await _hubContext.Clients.Group($"user:{session.UserId}").SendAsync("payment.updated", new
                {
                    paymentId = session.Id,
                    orderCode = session.OrderCode,
                    status = CheckoutSessionStatus.Failed,
                    provider = session.Provider,
                    subscriptionId = (Guid?)null
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to push SignalR failed payment event for user {UserId}", session.UserId);
            }

            return Error.Conflict("Billing.PaymentFailed", "Payment failed reported by PayOS.");
        }

        // 5. Complete payment and activate subscription
        return await CompletePaymentAsync(session, "payos", webhookData.PaymentLinkId, ct);
    }

    private async Task<Result<SimulateSuccessResponse>> CompletePaymentAsync(
        BillingCheckoutSession session,
        string methodType,
        string? externalTxId,
        CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var userId = session.UserId;

        if (session.Purpose == "mentor_booking")
        {
            var bookingId = session.ResourceId ?? Guid.Empty;
            var booking = await _db.MentorBookings
                .Include(b => b.Mentor)
                .Include(b => b.AvailabilitySlot)
                .FirstOrDefaultAsync(b => b.Id == bookingId, ct);
            
            if (booking is null)
                return Error.NotFound("MentorBooking.NotFound", "Mentor booking not found.");

            var bookingUser = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
            if (bookingUser is null)
                return Error.NotFound("User.NotFound", "User not found.");

            session.Status      = CheckoutSessionStatus.Succeeded;
            session.CompletedAt = now;
            session.UpdatedAt   = now;

            var bookingTx = new PaymentTransaction
            {
                Id                  = Guid.NewGuid(),
                UserId              = userId,
                CheckoutSessionId   = session.Id,
                Provider            = session.Provider,
                MethodType          = methodType,
                ExternalTransactionId = externalTxId,
                Amount              = session.Amount,
                CurrencyCode        = session.CurrencyCode,
                Status              = PaymentStatus.Succeeded,
                PaidAt              = now,
                CreatedAt           = now,
                UpdatedAt           = now,
                Purpose             = "mentor_booking",
                ResourceId          = bookingId,
                Description         = session.Description
            };
            _db.PaymentTransactions.Add(bookingTx);

            var bookingTodayStr = now.ToString("yyyyMMdd");
            var bookingTodayStart = now.Date;
            var bookingTodayEnd   = bookingTodayStart.AddDays(1);
            var bookingCountToday = await _db.Invoices
                .CountAsync(i => i.CreatedAt >= bookingTodayStart && i.CreatedAt < bookingTodayEnd, ct);
            var bookingInvoiceNumber = $"IVT-{bookingTodayStr}-{(bookingCountToday + 1):D4}";

            var bookingInvoice = new Invoice
            {
                Id                  = Guid.NewGuid(),
                UserId              = userId,
                PaymentTransactionId = bookingTx.Id,
                CheckoutSessionId   = session.Id,
                InvoiceNumber       = bookingInvoiceNumber,
                Amount              = session.Amount,
                CurrencyCode        = session.CurrencyCode,
                Status              = InvoiceStatus.Paid,
                IssuedAt            = now,
                PaidAt              = now,
                CreatedAt           = now,
                Purpose             = "mentor_booking",
                ResourceId          = bookingId,
                Description         = session.Description
            };
            _db.Invoices.Add(bookingInvoice);

            booking.Status = "confirmed";
            booking.MeetingUrl = booking.Mentor.MeetingUrl; // Use the Mentor's custom Meeting URL from their profile
            booking.UpdatedAt = now;

            if (booking.AvailabilitySlot is not null)
            {
                booking.AvailabilitySlot.Status = "booked";
            }

            await _db.SaveChangesAsync(ct);

            // SignalR Payment Events
            _ = Task.Run(async () =>
            {
                try
                {
                    await _hubContext.Clients.Group($"user:{userId}").SendAsync("payment.updated", new
                    {
                        paymentId = session.Id,
                        orderCode = session.OrderCode,
                        status = session.Status,
                        provider = session.Provider,
                        subscriptionId = (Guid?)null
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to push SignalR mentor booking payment event for user {UserId}", userId);
                }
            });

            var bookingEmailSent = true;
            _ = Task.Run(async () =>
            {
                try
                {
                    var displayAmount = session.CurrencyCode == "VND"
                        ? $"{session.Amount:N0} ₫"
                        : $"{session.Amount:N2} {session.CurrencyCode}";

                    var providerDisplay = MockProvider.GetDisplayName(session.Provider);
                    var serviceTypeDisplay = booking.ServiceType switch
                    {
                        "cv_review" => "CV Review",
                        "mock_interview" => "Mock Interview",
                        "career_coaching" => "Career Coaching",
                        "technical_mentoring" => "Technical Mentoring",
                        _ => booking.ServiceType
                    };

                    var htmlBody = $"""
                        <h2>Thanh toán lịch hẹn Mentor thành công!</h2>
                        <p>Xin chào <strong>{bookingUser.FullName}</strong>,</p>
                        <p>Lịch hẹn của bạn với Mentor <strong>{booking.Mentor.FullName}</strong> đã được xác nhận thành công.</p>
                        <table border="0" cellpadding="6" style="border-collapse:collapse;">
                          <tr><td><strong>Dịch vụ:</strong></td><td>{serviceTypeDisplay}</td></tr>
                          <tr><td><strong>Thời gian bắt đầu:</strong></td><td>{booking.ScheduledStartsAt:dd/MM/yyyy HH:mm} UTC</td></tr>
                          <tr><td><strong>Thời gian kết thúc:</strong></td><td>{booking.ScheduledEndsAt:dd/MM/yyyy HH:mm} UTC</td></tr>
                          <tr><td><strong>Mã hóa đơn:</strong></td><td>{bookingInvoiceNumber}</td></tr>
                          <tr><td><strong>Số tiền đã thanh toán:</strong></td><td>{displayAmount}</td></tr>
                          <tr><td><strong>Phương thức:</strong></td><td>{providerDisplay}</td></tr>
                          <tr><td><strong>Link tham gia họp:</strong></td><td><a href="{booking.MeetingUrl}">{booking.MeetingUrl}</a></td></tr>
                        </table>
                        <p style="margin-top:24px;color:#666;">Trân trọng,<br/>Đội ngũ INTER-VIET</p>
                        """;

                    await _emailService.SendAsync(new EmailMessage(
                        ToAddress : bookingUser.Email,
                        ToName    : bookingUser.FullName,
                        Subject   : "Xác nhận lịch đặt Mentor thành công",
                        HtmlBody  : htmlBody
                    ), CancellationToken.None);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex,
                        "Failed to send mentor booking success email to user {UserId} for invoice {InvoiceNumber}",
                        userId, bookingInvoiceNumber);
                }
            });

            _ = Task.Run(async () =>
            {
                try
                {
                    await _notificationService.CreateAsync(
                        userId           : userId,
                        type             : "mentor.booking_confirmed",
                        title            : "Lịch hẹn Mentor đã xác nhận",
                        message          : $"Lịch đặt với {booking.Mentor.FullName} đã được xác nhận thành công. Link phòng họp trực tuyến của bạn đã sẵn sàng.",
                        actionUrl        : $"/mentor-bookings/{bookingId}",
                        data             : new
                        {
                            bookingId = booking.Id,
                            mentorId = booking.MentorId,
                            mentorName = booking.Mentor.FullName,
                            startsAt = booking.ScheduledStartsAt,
                            endsAt = booking.ScheduledEndsAt,
                            meetingUrl = booking.MeetingUrl
                        },
                        priority         : NotificationPriority.Normal,
                        deduplicationKey : $"mentor.booking_confirmed:{bookingId}");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to create booking confirmed notification. UserId={UserId}", userId);
                }
            });

            return new SimulateSuccessResponse
            {
                CheckoutSessionId    = session.Id,
                PaymentTransactionId = bookingTx.Id,
                InvoiceId            = bookingInvoice.Id,
                InvoiceNumber        = bookingInvoiceNumber,
                IsIdempotent         = false,
                EmailSent            = bookingEmailSent,
                SubscriptionId       = Guid.Empty
            };
        }

        // Load plan + user
        var plan = await _db.Plans.FirstOrDefaultAsync(p => p.Id == session.PlanId, ct);
        if (plan is null)
            return Error.NotFound("Plan.NotFound", "Plan associated with checkout session not found.");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null)
            return Error.NotFound("User.NotFound", "User not found.");

        // Update session
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
            MethodType          = methodType,
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
            "weekly"    => now.AddDays(7),
            "combo"     => now.AddYears(10),
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
                ChangeType     = "payment_upgrade",
                FromPlanId     = fromPlanId,
                ToPlanId       = plan.Id,
                EffectiveAt    = now,
                Reason         = $"Payment via {session.Provider} (invoice {invoiceNumber})",
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
                ChangeType     = "payment_activate",
                FromPlanId     = null,
                ToPlanId       = plan.Id,
                EffectiveAt    = now,
                Reason         = $"Payment via {session.Provider} (invoice {invoiceNumber})",
                CreatedAt      = now
            });
        }

        invoice.SubscriptionId = subscriptionId;

        await _db.SaveChangesAsync(ct);

        // SignalR Payment Events
        _ = Task.Run(async () =>
        {
            try
            {
                // Push payment.updated
                await _hubContext.Clients.Group($"user:{userId}").SendAsync("payment.updated", new
                {
                    paymentId = session.Id,
                    orderCode = session.OrderCode,
                    status = session.Status,
                    provider = session.Provider,
                    subscriptionId = subscriptionId
                });

                // Push subscription.activated
                await _hubContext.Clients.Group($"user:{userId}").SendAsync("subscription.activated", new
                {
                    paymentId = session.Id,
                    orderCode = session.OrderCode,
                    status = session.Status,
                    provider = session.Provider,
                    subscriptionId = subscriptionId
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to push SignalR payment success events for user {UserId}", userId);
            }
        });

        // Fire-and-forget email
        var emailSent = true;
        _ = Task.Run(async () =>
        {
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
                ), CancellationToken.None);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Failed to send payment success email to user {UserId} for invoice {InvoiceNumber}",
                    userId, invoiceNumber);
            }
        });

        // Fire-and-forget in-app notification
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
