using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using Interviet.Contracts.Billing;

namespace Interviet.Api.Controllers;

[Authorize]
[Route("api/v1/[controller]")]
public class BillingController : ApiControllerBase
{
    public BillingController() { }

    [HttpGet("invoices")]
    public IActionResult GetInvoices()
    {
        // Skeleton for future implementation
        return Ok(new { data = new List<InvoiceResponse>() });
    }

    [HttpGet("payments")]
    public IActionResult GetPayments()
    {
        // Skeleton for future implementation
        return Ok(new { data = new List<PaymentTransactionResponse>() });
    }
}
