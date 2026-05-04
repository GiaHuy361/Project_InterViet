using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Interviet.Application.Common.Behaviors;

namespace Interviet.Application;

/// <summary>
/// DI registration entry point for the Application layer.
/// Registers MediatR with pipeline behaviors and FluentValidation validators.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = typeof(DependencyInjection).Assembly;

        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        });

        // Register all FluentValidation validators in the Application assembly
        services.AddValidatorsFromAssembly(assembly);

        return services;
    }
}
