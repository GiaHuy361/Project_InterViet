using FluentValidation;
using MediatR;
using Interviet.Shared.Results;

namespace Interviet.Application.Common.Behaviors;

/// <summary>
/// MediatR pipeline behavior that runs FluentValidation before any handler executes.
/// Only runs on requests where validators exist — silent pass-through otherwise.
/// For commands/queries that return Result or Result&lt;T&gt;, validation failures
/// are converted to Validation Error results instead of throwing exceptions.
/// </summary>
public sealed class ValidationBehavior<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (!_validators.Any())
            return await next();

        var context = new ValidationContext<TRequest>(request);
        var results = await Task.WhenAll(
            _validators.Select(v => v.ValidateAsync(context, cancellationToken)));

        var failures = results
            .SelectMany(r => r.Errors)
            .Where(f => f != null)
            .ToList();

        if (failures.Count == 0)
            return await next();

        var message = string.Join(" | ", failures.Select(f => f.ErrorMessage));
        var error = Error.Validation("Validation.Failed", message);

        // Try to construct a failure result using implicit conversion from Error
        var responseType = typeof(TResponse);
        if (responseType == typeof(Result))
            return (TResponse)(object)Result.Failure(error);

        if (responseType.IsGenericType &&
            responseType.GetGenericTypeDefinition() == typeof(Result<>))
        {
            var failureMethod = typeof(Result)
                .GetMethod(nameof(Result.Failure), 1, new[] { typeof(Error) })!
                .MakeGenericMethod(responseType.GetGenericArguments()[0]);
            return (TResponse)failureMethod.Invoke(null, new object[] { error })!;
        }

        // For non-Result responses, just throw (shouldn't happen in this codebase)
        throw new ValidationException(failures);
    }
}
