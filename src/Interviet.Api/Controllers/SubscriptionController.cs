using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using Interviet.Application.Common.Interfaces;
using Interviet.Application.Subscription.Commands.ActivateDevSubscription;
using Interviet.Application.Subscription.Commands.CancelSubscription;
using Interviet.Application.Subscription.Queries.GetMySubscription;
using Interviet.Contracts.Subscription;

namespace Interviet.Api.Controllers;

[Authorize]
[Route("api/v1/[controller]")]
public class SubscriptionController : ApiControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUserService;

    public SubscriptionController(IMediator mediator, ICurrentUserService currentUserService)
    {
        _mediator = mediator;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<IActionResult> GetMySubscription()
    {
        return FromResult(await _mediator.Send(new GetMySubscriptionQuery(_currentUserService.UserId)));
    }

    [HttpPost("dev-activate")]
    public async Task<IActionResult> DevActivate([FromBody] DevActivateSubscriptionRequest request)
    {
        return FromResult(await _mediator.Send(new ActivateDevSubscriptionCommand(_currentUserService.UserId, request.PlanKey)));
    }

    [HttpPost("cancel")]
    public async Task<IActionResult> Cancel()
    {
        return FromResult(await _mediator.Send(new CancelSubscriptionCommand(_currentUserService.UserId)));
    }
}
