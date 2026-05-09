using Interviet.Shared.Results;
using Interviet.Contracts.Dashboard;

namespace Interviet.Application.Common.Interfaces;

public interface IQuotaService
{
    Task<Result> CheckAsync(Guid userId, string featureKey, int amount = 1, CancellationToken ct = default);
    
    Task<Result> ConsumeAsync(Guid userId, string featureKey, int amount = 1, string referenceType = "", Guid? referenceId = null, CancellationToken ct = default);
    
    Task RefundAsync(Guid userId, string featureKey, int amount = 1, string referenceType = "", Guid? referenceId = null, string reason = "", CancellationToken ct = default);
}
