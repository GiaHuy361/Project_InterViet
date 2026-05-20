using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Common.Options;
using Interviet.Contracts.Billing;
using Interviet.Shared.Results;

namespace Interviet.Application.Billing.Queries.GetPaymentInstructions;

public sealed record GetPaymentInstructionsQuery(Guid UserId, Guid CheckoutSessionId)
    : IRequest<Result<PaymentInstructionsResponse>>;

public sealed class GetPaymentInstructionsQueryHandler
    : IRequestHandler<GetPaymentInstructionsQuery, Result<PaymentInstructionsResponse>>
{
    private readonly IAppDbContext _db;
    private readonly BillingOptions _billing;
    private readonly IQrCodeGenerator _qrCodeGenerator;

    public GetPaymentInstructionsQueryHandler(
        IAppDbContext db,
        IOptions<BillingOptions> billing,
        IQrCodeGenerator qrCodeGenerator)
    {
        _db = db;
        _billing = billing.Value;
        _qrCodeGenerator = qrCodeGenerator;
    }

    public async Task<Result<PaymentInstructionsResponse>> Handle(
        GetPaymentInstructionsQuery request, CancellationToken ct)
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

        if (session.Status == CheckoutSessionStatus.Expired || DateTime.UtcNow > session.ExpiresAt)
        {
            session.Status = CheckoutSessionStatus.Expired;
            session.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return Error.Conflict("CheckoutSession.Expired", "This checkout session has expired.");
        }

        // Format required transfer content: IVT {yyyyMMdd} {first 6 chars of sessionId}
        var shortId = session.Id.ToString()[..6].ToUpperInvariant();
        var dateStr = session.CreatedAt.ToString("yyyyMMdd");
        var requiredContent = $"IVT {dateStr} {shortId}";

        // QR Code payload
        var qrPayload = $"vietqr://payment?bank={_billing.MockMerchant.BankCode}&account={_billing.MockMerchant.AccountNumber}&amount={session.Amount:F0}&content={Uri.EscapeDataString(requiredContent)}&holder={Uri.EscapeDataString(_billing.MockMerchant.AccountName)}";

        // Generate base64 QR image offline using QrCodeGenerator
        string imageBase64;
        try
        {
            imageBase64 = _qrCodeGenerator.GeneratePngBase64(qrPayload, 10);
        }
        catch (Exception ex)
        {
            return Error.Failure("Billing.QrGenerationFailed", $"Failed to generate QR Code image: {ex.Message}");
        }

        var response = new PaymentInstructionsResponse
        {
            CheckoutSessionId = session.Id,
            PlanKey = session.PlanKey,
            Amount = session.Amount,
            CurrencyCode = session.CurrencyCode,
            Merchant = new MerchantResponse
            {
                MerchantName = _billing.MockMerchant.MerchantName,
                BankName = _billing.MockMerchant.BankName,
                BankCode = _billing.MockMerchant.BankCode,
                AccountNumber = _billing.MockMerchant.AccountNumber,
                AccountName = _billing.MockMerchant.AccountName
            },
            Transfer = new TransferResponse
            {
                RequiredContent = requiredContent,
                Amount = session.Amount,
                CurrencyCode = session.CurrencyCode
            },
            Qr = new QrResponse
            {
                Payload = qrPayload,
                ImageBase64 = imageBase64
            }
        };

        return response;
    }
}
