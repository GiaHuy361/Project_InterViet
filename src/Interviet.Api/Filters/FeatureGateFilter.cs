using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;

namespace Interviet.Api.Filters;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class FeatureGateAttribute : Attribute, IActionFilter
{
    private readonly string _featureName;

    public FeatureGateAttribute(string featureName)
    {
        _featureName = featureName;
    }

    public void OnActionExecuting(ActionExecutingContext context)
    {
        var config = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
        
        if (_featureName.Equals("Admin", StringComparison.OrdinalIgnoreCase))
        {
            var adminEnabled = config.GetValue<bool>("Admin:Enabled", true);
            if (!adminEnabled)
            {
                context.Result = new ObjectResult(new
                {
                    type = "https://api.interviet.vn/errors/service-unavailable",
                    title = "ServiceUnavailable",
                    detail = "Admin features are currently disabled.",
                    code = "Admin.Disabled"
                }) { StatusCode = StatusCodes.Status503ServiceUnavailable };
            }
        }
        else if (_featureName.Equals("Support", StringComparison.OrdinalIgnoreCase))
        {
            var supportEnabled = config.GetValue<bool>("Support:Enabled", true);
            if (!supportEnabled)
            {
                context.Result = new ObjectResult(new
                {
                    type = "https://api.interviet.vn/errors/service-unavailable",
                    title = "SupportUnavailable",
                    detail = "Support features are currently disabled.",
                    code = "Support.Disabled"
                }) { StatusCode = StatusCodes.Status503ServiceUnavailable };
            }
        }
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
        // No-op
    }
}
