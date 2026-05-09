using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using Interviet.Application.Billing.Queries.GetPlans;

namespace Interviet.Api.Controllers;

[Route("api/v1/[controller]")]
public class PlansController : ApiControllerBase
{
    private readonly IMediator _mediator;

    public PlansController(IMediator mediator) 
    { 
        _mediator = mediator;
    }

    [HttpGet]
    [AllowAnonymous] // Anyone can view plans
    public async Task<IActionResult> GetPlans()
    {
        return FromResult(await _mediator.Send(new GetPlansQuery()));
    }
}
