using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Common.Options;
using Interviet.Contracts.Billing;
using Interviet.Domain.Billing;
using Interviet.Shared.Results;

namespace Interviet.Application.Billing.Commands.SubmitBankTransfer;

public sealed record SubmitBankTransferCommand(
    Guid UserId,
    Guid CheckoutSessionId,
    string PayerAccountNumber,
    string PayerAccountName,
    decimal AmountPaid,
    string TransferContent)
    : IRequest<Result<SubmitBankTransferResponse>>;

public sealed class SubmitBankTransferCommandHandler
    : IRequestHandler<SubmitBankTransferCommand, Result<SubmitBankTransferResponse>>
{
    private readonly IAppDbContext _db;
    private readonly BillingOptions _billing;
    private readonly IBillingSuccessService _billingSuccessService;

    public SubmitBankTransferCommandHandler(
        IAppDbContext db,
        IOptions<BillingOptions> billing,
        IBillingSuccessService billingSuccessService)
    {
        _db = db;
        _billing = billing.Value;
        _billingSuccessService = billingSuccessService;
    }

    public async Task<Result<SubmitBankTransferResponse>> Handle(
        SubmitBankTransferCommand request, CancellationToken ct)
    {
        if (!_billing.MockPaymentsEnabled)
            return Error.ServiceUnavailable("Billing.MockDisabled",
                "Mock payment is not enabled in this environment.");

        // 1. Load checkout session
        var session = await _db.BillingCheckoutSessions
            .FirstOrDefaultAsync(s => s.Id == request.CheckoutSessionId, ct);

        if (session is null)
            return Error.NotFound("CheckoutSession.NotFound", "Checkout session not found.");

        if (session.UserId != request.UserId)
            return Error.Forbidden("CheckoutSession.Forbidden", "You do not own this checkout session.");

        // Idempotency: if session is already succeeded, return the successful state
        if (session.Status == CheckoutSessionStatus.Succeeded)
        {
            var acceptedAttempt = await _db.BillingPaymentAttempts
                .Where(a => a.CheckoutSessionId == session.Id && a.Status == "accepted")
                .OrderByDescending(a => a.CreatedAt)
                .FirstOrDefaultAsync(ct);

            var successResult = await _billingSuccessService.ProcessPaymentSuccessAsync(
                request.UserId,
                request.CheckoutSessionId,
                methodType: "bank_transfer",
                ct: ct);

            if (successResult.IsSuccess)
            {
                return new SubmitBankTransferResponse
                {
                    CheckoutSessionId = session.Id,
                    Status = CheckoutSessionStatus.Succeeded,
                    SuccessInfo = successResult.Value,
                    Attempt = acceptedAttempt is not null ? MapToAttemptResponse(acceptedAttempt) : new AttemptResponse
                    {
                        Id = Guid.Empty,
                        CheckoutSessionId = session.Id,
                        Provider = session.Provider,
                        Method = "bank_transfer",
                        PayerAccountNumberMasked = MaskAccountNumber(request.PayerAccountNumber),
                        PayerAccountName = request.PayerAccountName,
                        AmountPaid = request.AmountPaid,
                        CurrencyCode = session.CurrencyCode,
                        TransferContent = request.TransferContent,
                        Status = "accepted",
                        CreatedAt = session.CompletedAt ?? DateTime.UtcNow
                    }
                };
            }
        }

        // Cannot proceed if already terminal (failed/cancelled)
        if (session.Status is CheckoutSessionStatus.Failed or CheckoutSessionStatus.Cancelled)
            return Error.Conflict("CheckoutSession.AlreadyTerminal",
                $"Cannot submit transfer: session is already '{session.Status}'.");

        if (session.Status == CheckoutSessionStatus.Expired || DateTime.UtcNow > session.ExpiresAt)
        {
            session.Status = CheckoutSessionStatus.Expired;
            session.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return Error.Conflict("CheckoutSession.Expired", "This checkout session has expired.");
        }

        // 2. Validate input and calculate expected transfer content
        var shortId = session.Id.ToString()[..6].ToUpperInvariant();
        var dateStr = session.CreatedAt.ToString("yyyyMMdd");
        var expectedContent = $"IVT {dateStr} {shortId}";

        // Normalize transfer content for comparison (trim and case-insensitive)
        var normalizedInput = (request.TransferContent ?? string.Empty).Trim();
        var normalizedExpected = expectedContent.Trim();

        bool isAmountValid = request.AmountPaid == session.Amount;
        bool isContentValid = string.Equals(normalizedInput, normalizedExpected, StringComparison.OrdinalIgnoreCase);

        var maskedAccount = MaskAccountNumber(request.PayerAccountNumber);
        var txRef = $"MTR-{Guid.NewGuid().ToString()[..8].ToUpperInvariant()}";

        // 3. Handle validation failure (Sai amount/content -> rejected attempt -> 400 Bad Request)
        if (!isAmountValid || !isContentValid)
        {
            var rejectionReason = !isAmountValid ? "AmountPaidMismatch" : "TransferContentMismatch";
            var rejectionMsg = !isAmountValid
                ? $"Amount paid ({request.AmountPaid:N0}) does not match required session amount ({session.Amount:N0})."
                : $"Transfer content '{request.TransferContent}' does not match required content '{expectedContent}'.";

            var rejectedAttempt = new BillingPaymentAttempt
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                CheckoutSessionId = session.Id,
                Provider = session.Provider,
                Method = "bank_transfer",
                PayerAccountNumberMasked = maskedAccount,
                PayerAccountName = request.PayerAccountName,
                AmountPaid = request.AmountPaid,
                CurrencyCode = session.CurrencyCode,
                TransferContent = request.TransferContent ?? string.Empty,
                ExpectedTransferContent = expectedContent,
                TransactionReference = txRef,
                Status = "rejected",
                RejectionReason = rejectionReason,
                CreatedAt = DateTime.UtcNow
            };

            _db.BillingPaymentAttempts.Add(rejectedAttempt);
            await _db.SaveChangesAsync(ct);

            return Error.Validation($"Billing.{rejectionReason}", rejectionMsg);
        }

        // 4. Handle success (Đúng amount/content -> accepted attempt -> succeeded payment)
        var acceptedAttemptNew = new BillingPaymentAttempt
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            CheckoutSessionId = session.Id,
            Provider = session.Provider,
            Method = "bank_transfer",
            PayerAccountNumberMasked = maskedAccount,
            PayerAccountName = request.PayerAccountName,
            AmountPaid = request.AmountPaid,
            CurrencyCode = session.CurrencyCode,
            TransferContent = request.TransferContent ?? string.Empty,
            ExpectedTransferContent = expectedContent,
            TransactionReference = txRef,
            Status = "accepted",
            CreatedAt = DateTime.UtcNow
        };

        _db.BillingPaymentAttempts.Add(acceptedAttemptNew);
        await _db.SaveChangesAsync(ct);

        // Process successful payment, subscription upgrade, and invoice creation
        var successInfoResult = await _billingSuccessService.ProcessPaymentSuccessAsync(
            request.UserId,
            request.CheckoutSessionId,
            methodType: "bank_transfer",
            externalTxId: txRef,
            ct: ct);

        if (!successInfoResult.IsSuccess)
        {
            // Rollback attempt status to rejected if core success service failed (though rare)
            acceptedAttemptNew.Status = "rejected";
            acceptedAttemptNew.RejectionReason = "PaymentSuccessProcessingFailed";
            await _db.SaveChangesAsync(ct);
            return successInfoResult.Error;
        }

        return new SubmitBankTransferResponse
        {
            CheckoutSessionId = session.Id,
            Status = CheckoutSessionStatus.Succeeded,
            Attempt = MapToAttemptResponse(acceptedAttemptNew),
            SuccessInfo = successInfoResult.Value
        };
    }

    private static string MaskAccountNumber(string accountNumber)
    {
        if (string.IsNullOrWhiteSpace(accountNumber))
            return string.Empty;

        var cleaned = accountNumber.Replace(" ", "").Trim();
        if (cleaned.Length <= 4)
            return new string('*', cleaned.Length);

        return new string('*', cleaned.Length - 4) + cleaned[^4..];
    }

    private static AttemptResponse MapToAttemptResponse(BillingPaymentAttempt attempt)
    {
        return new AttemptResponse
        {
            Id = attempt.Id,
            CheckoutSessionId = attempt.CheckoutSessionId,
            Provider = attempt.Provider,
            Method = attempt.Method,
            PayerAccountNumberMasked = attempt.PayerAccountNumberMasked,
            PayerAccountName = attempt.PayerAccountName,
            AmountPaid = attempt.AmountPaid,
            CurrencyCode = attempt.CurrencyCode,
            TransferContent = attempt.TransferContent,
            Status = attempt.Status,
            RejectionReason = attempt.RejectionReason,
            CreatedAt = attempt.CreatedAt
        };
    }
}
