using Microsoft.AspNetCore.Mvc;

namespace Interviet.Api.Controllers;

/// <summary>
/// Base controller providing common helper methods for all API controllers.
/// - Never place business logic here.
/// - Controllers only receive, delegate, and return.
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public abstract class ApiControllerBase : ControllerBase
{
    /// <summary>Returns 200 with the standard envelope.</summary>
    protected IActionResult Ok<T>(T data, string? message = null) =>
        base.Ok(new
        {
            success = true,
            message,
            data,
            meta = new { requestId = HttpContext.TraceIdentifier, timestamp = DateTime.UtcNow }
        });

    /// <summary>Returns 201 Created with the standard envelope.</summary>
    protected IActionResult Created<T>(string routeName, object routeValues, T data) =>
        base.CreatedAtRoute(routeName, routeValues, new
        {
            success = true,
            data,
            meta = new { requestId = HttpContext.TraceIdentifier, timestamp = DateTime.UtcNow }
        });

    /// <summary>Maps a Result to the appropriate HTTP response.</summary>
    protected IActionResult FromResult<T>(Shared.Results.Result<T> result)
    {
        if (result.IsSuccess)
            return Ok(result.Value);

        return result.Error.Type switch
        {
            Shared.Results.ErrorType.NotFound     => NotFound(Problem(result.Error)),
            Shared.Results.ErrorType.Validation   => BadRequest(Problem(result.Error)),
            Shared.Results.ErrorType.Conflict     => Conflict(Problem(result.Error)),
            Shared.Results.ErrorType.Forbidden    => StatusCode(StatusCodes.Status403Forbidden, Problem(result.Error)),
            Shared.Results.ErrorType.Unauthorized => Unauthorized(Problem(result.Error)),
            _                                     => StatusCode(500, Problem(result.Error))
        };
    }

    /// <summary>Maps a non-generic Result to the appropriate HTTP response.</summary>
    protected IActionResult FromResult(Shared.Results.Result result)
    {
        if (result.IsSuccess)
            return NoContent();

        return result.Error.Type switch
        {
            Shared.Results.ErrorType.NotFound     => NotFound(Problem(result.Error)),
            Shared.Results.ErrorType.Validation   => BadRequest(Problem(result.Error)),
            Shared.Results.ErrorType.Conflict     => Conflict(Problem(result.Error)),
            Shared.Results.ErrorType.Forbidden    => StatusCode(StatusCodes.Status403Forbidden, Problem(result.Error)),
            Shared.Results.ErrorType.Unauthorized => Unauthorized(Problem(result.Error)),
            _                                     => StatusCode(500, Problem(result.Error))
        };
    }

    private static object Problem(Shared.Results.Error error) => new
    {
        type = $"https://api.interviet.vn/errors/{error.Code.ToLower().Replace('.', '-')}",
        title = error.Code,
        detail = error.Description,
        code = error.Code
    };
}
