using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Internal;
using System.Reflection;

namespace Interviet.Infrastructure.Persistence;

#pragma warning disable EF1001 // Internal EF Core API usage.
public class DbProviderMigrationsAssembly : MigrationsAssembly
{
    private readonly DbContext _context;

    public DbProviderMigrationsAssembly(
        ICurrentDbContext currentContext,
        IDbContextOptions options,
        IMigrationsIdGenerator idGenerator,
        IDiagnosticsLogger<DbLoggerCategory.Migrations> logger)
        : base(currentContext, options, idGenerator, logger)
    {
        _context = currentContext.Context;
    }

    public override IReadOnlyDictionary<string, TypeInfo> Migrations
    {
        get
        {
            var allMigrations = base.Migrations;
            var isPostgres = _context.Database.ProviderName == "Npgsql.EntityFrameworkCore.PostgreSQL";

            // Filter by namespace depending on the active provider.
            // Postgres migrations will reside in MigrationsPostgres namespace.
            // SqlServer migrations will reside in Migrations namespace.
            var targetNamespace = isPostgres
                ? "Interviet.Infrastructure.Persistence.MigrationsPostgres"
                : "Interviet.Infrastructure.Persistence.Migrations";

            var filtered = allMigrations
                .Where(m => m.Value.Namespace == targetNamespace)
                .ToDictionary(m => m.Key, m => m.Value);

            return filtered;
        }
    }

    public override ModelSnapshot? ModelSnapshot
    {
        get
        {
            var isPostgres = _context.Database.ProviderName == "Npgsql.EntityFrameworkCore.PostgreSQL";
            var targetNamespace = isPostgres
                ? "Interviet.Infrastructure.Persistence.MigrationsPostgres"
                : "Interviet.Infrastructure.Persistence.Migrations";

            Console.WriteLine($"[DIAGNOSTIC] DbProviderMigrationsAssembly.ModelSnapshot active provider is Postgres={isPostgres}, targeting namespace={targetNamespace}");

            var assembly = Assembly;
            Console.WriteLine($"[DIAGNOSTIC] Migrations assembly name: {assembly?.FullName}");

            var types = assembly?.GetTypes() ?? Array.Empty<Type>();
            Console.WriteLine($"[DIAGNOSTIC] Total types in assembly: {types.Length}");

            foreach (var t in types)
            {
                if (typeof(ModelSnapshot).IsAssignableFrom(t))
                {
                    Console.WriteLine($"[DIAGNOSTIC] Found ModelSnapshot subclass: {t.FullName}, Namespace={t.Namespace}");
                }
            }

            var snapshotType = types
                .FirstOrDefault(t => typeof(ModelSnapshot).IsAssignableFrom(t) && t.Namespace == targetNamespace);

            Console.WriteLine($"[DIAGNOSTIC] Selected snapshot type: {snapshotType?.FullName}");

            if (snapshotType == null)
            {
                return null;
            }

            return Activator.CreateInstance(snapshotType) as ModelSnapshot;
        }
    }
}
#pragma warning restore EF1001
