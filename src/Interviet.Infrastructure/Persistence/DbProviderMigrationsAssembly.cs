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
}
#pragma warning restore EF1001
