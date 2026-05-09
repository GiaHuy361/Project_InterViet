using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Billing;
using Interviet.Shared.Results;

namespace Interviet.Application.Billing.Queries.GetPlans;

public sealed record GetPlansQuery() : IRequest<Result<List<PlanResponse>>>;

public sealed class GetPlansQueryHandler : IRequestHandler<GetPlansQuery, Result<List<PlanResponse>>>
{
    private readonly IAppDbContext _db;

    public GetPlansQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<Result<List<PlanResponse>>> Handle(GetPlansQuery request, CancellationToken ct)
    {
        var plans = await _db.Plans
            .Where(p => p.IsActive)
            .OrderBy(p => p.SortOrder)
            .Select(p => new
            {
                p.Id,
                p.Code,
                p.Name,
                p.PriceAmount,
                p.CurrencyCode,
                p.BillingCycle,
                p.TrialDays,
                Quotas = _db.UsageQuotaPolicies
                    .Where(q => q.PlanId == p.Id)
                    .Select(q => new PlanFeatureResponse
                    {
                        FeatureKey = q.FeatureKey,
                        FeatureValue = q.IsUnlimited ? "unlimited" : q.MaxValue.ToString(),
                        ValueType = "quota"
                    }).ToList(),
                Entitlements = _db.PlanEntitlements
                    .Where(e => e.PlanId == p.Id)
                    .Select(e => new PlanFeatureResponse
                    {
                        FeatureKey = e.FeatureKey,
                        FeatureValue = e.FeatureValue,
                        ValueType = e.ValueType
                    }).ToList()
            })
            .ToListAsync(ct);

        var responses = plans.Select(p =>
        {
            return new PlanResponse
            {
                Id = p.Id,
                PlanKey = p.Code,
                Name = p.Name,
                Description = "Gói " + p.Name,
                PriceAmount = p.PriceAmount,
                DisplayPrice = p.Code == "quarterly" ? 129000 : (p.Code == "yearly" ? 109000 : null),
                Badge = p.Code == "quarterly" ? "Phổ biến nhất" : (p.Code == "yearly" ? "Tiết kiệm nhất" : null),
                CurrencyCode = p.CurrencyCode,
                BillingCycle = p.BillingCycle,
                TrialDays = p.TrialDays,
                Features = p.Quotas.Concat(p.Entitlements).ToList()
            };
        }).ToList();

        return Result<List<PlanResponse>>.Success(responses);
    }
}
