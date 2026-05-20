using MediatR;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Billing;
using Interviet.Shared.Results;

namespace Interviet.Application.Billing.Commands.SimulatePaymentSuccess;

public sealed record SimulatePaymentSuccessCommand(Guid UserId, Guid CheckoutSessionId)
    : IRequest<Result<SimulateSuccessResponse>>;

public sealed class SimulatePaymentSuccessCommandHandler
    : IRequestHandler<SimulatePaymentSuccessCommand, Result<SimulateSuccessResponse>>
{
    private readonly IBillingSuccessService _billingSuccessService;

    public SimulatePaymentSuccessCommandHandler(IBillingSuccessService billingSuccessService)
    {
        _billingSuccessService = billingSuccessService;
    }

    public async Task<Result<SimulateSuccessResponse>> Handle(
        SimulatePaymentSuccessCommand request, CancellationToken ct)
    {
        return await _billingSuccessService.ProcessPaymentSuccessAsync(
            request.UserId,
            request.CheckoutSessionId,
            methodType: "simulate",
            externalTxId: $"SIM-{request.CheckoutSessionId.ToString()[..8].ToUpper()}",
            ct: ct);
    }
}
