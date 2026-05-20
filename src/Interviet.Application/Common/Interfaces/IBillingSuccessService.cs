using Interviet.Contracts.Billing;
using Interviet.Shared.Results;

namespace Interviet.Application.Common.Interfaces;

public interface IBillingSuccessService
{
    Task<Result<SimulateSuccessResponse>> ProcessPaymentSuccessAsync(
        Guid userId,
        Guid checkoutSessionId,
        string? methodType = null,
        string? externalTxId = null,
        CancellationToken ct = default);
}
