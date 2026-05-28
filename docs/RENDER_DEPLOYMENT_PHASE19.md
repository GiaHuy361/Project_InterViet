# Deployment Guide - Phase 19: Render Deployment & PostgreSQL Migration

This document provides step-by-step instructions for deploying the C# backend API to the Render Dashboard, switching the database provider to PostgreSQL, configuring environment variables, executing database migrations, and configuring third-party integrations (Google OAuth, PayOS, SignalR).

---

## 1. Database Architecture & Switch

The system supports both **SQL Server** (local development default) and **PostgreSQL** (production default).

### How Provider Switching Works
- The database provider is determined at startup by looking at the `Database:Provider` configuration key (environment variable `Database__Provider`) or inspecting the connection string protocol scheme.
- If the connection string contains `postgres://` or `Host=`, the application automatically selects **PostgreSQL**.
- Column types like `nvarchar(max)` and filtered index brackets are dynamically rewritten for PostgreSQL compatibility in `AppDbContext.OnModelCreating`.
- SQL Server and PostgreSQL migrations are separated in independent directory structures to prevent namespace clashing:
  - **SQL Server**: `src/Interviet.Infrastructure/Persistence/Migrations/`
  - **PostgreSQL**: `src/Interviet.Infrastructure/Persistence/MigrationsPostgres/`

---

## 2. Render Environment Variables Reference

When creating a Web Service on Render, set the following environment variables:

| Environment Variable | Recommended Value / Description |
|---|---|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `Database__Provider` | `Postgres` |
| `ConnectionStrings__DefaultConnection` | `postgres://user:pass@host:port/db` (Auto-injected if linked to Render Managed DB) |
| `JwtSettings__Secret` | Random 256-bit key |
| `JwtSettings__Issuer` | `IntervietApi` |
| `JwtSettings__Audience` | `IntervietClient` |
| `JwtSettings__ExpiryMinutes` | `120` |
| `Google__ClientId` | *Your Google Cloud Console Client ID* |
| `Google__ClientSecret` | *Your Google Cloud Console Client Secret* |
| `Google__RedirectUri` | `https://<your-render-domain>/api/v1/auth/google/callback` |
| `Frontend__BaseUrl` | `https://<your-vercel-domain>` |
| `PayOS__ClientId` | *Your PayOS Dashboard Client ID* |
| `PayOS__ApiKey` | *Your PayOS Dashboard API Key* |
| `PayOS__ChecksumKey` | *Your PayOS Dashboard Checksum Key* |
| `PayOS__WebhookUrl` | `https://<your-render-domain>/api/v1/billing/payos/webhook` |
| `PayOS__Enabled` | `true` |
| `PaymentRedirect__ReturnUrl` | `https://<your-vercel-domain>/subscription/success` |
| `PaymentRedirect__CancelUrl` | `https://<your-vercel-domain>/subscription/cancel` |
| `Billing__MockPaymentsEnabled` | `false` |
| `AiServices__CvServiceBaseUrl` | `https://<your-python-ai-domain>` (If not deployed yet, use placeholder) |
| `AiServices__InterviewBaseUrl` | `https://<your-python-ai-domain>` |
| `Admin__SeedAdminEmail` | *E.g. admin@interviet.vn (Used to seed the first Administrator)* |

---

## 3. Database Migration Execution

Since Render databases are hosted in isolated networks, you have two options to apply database migrations to a fresh production database:

### Option A: Run locally against the External Connection String (Recommended)
1. Retrieve the **External Database URL** (e.g. `postgres://...`) from the Render Database Dashboard.
2. Open a local shell in the root of the project.
3. Run the following PowerShell commands:
   ```powershell
   # 1. Compile the project using the PostgreSQL MSBuild flag
   dotnet build /p:DatabaseProvider=Postgres

   # 2. Apply migrations against Render's database using --no-build
   $env:Database__Provider="Postgres"
   $env:ConnectionStrings__DefaultConnection="Host=<render-host>;Port=5432;Database=interviet;Username=postgres;Password=<render-password>;SSL Mode=Require;Trust Server Certificate=true"
   dotnet ef database update --project src/Interviet.Infrastructure --startup-project src/Interviet.Api --no-build
   ```

### Option B: Auto-Migrate on startup
The application includes an auto-migrate hook on startup when `ASPNETCORE_ENVIRONMENT` is set to `Staging` or `Development`. In `Production`, auto-migration is disabled by design to prevent race conditions during scaling.

---

## 4. SignalR & WebSockets

No special configuration is needed for SignalR to run under Render HTTPS, as Render automatically handles SSL termination and passes WebSockets traffic down to the Docker container.
- Ensure the frontend links to the `https://<your-render-domain>` URL.
- CORS rules are dynamically read from the `Frontend__BaseUrl` environment variable, enabling seamless connection handshakes.

---

## 5. File Uploads & Local Disk Warning

Render uses an ephemeral filesystem by default. Any PDF resumes uploaded locally under `wwwroot/uploads` will be wiped out whenever the container restarts or redeploys.
- **For local testing/development**: The local storage is perfectly suitable.
- **For production**: It is highly recommended to bind a persistent Disk Volume to the path `/app/wwwroot/uploads` or configure cloud storage provider options.

---

## 6. Docker Build Strategy

The project's [Dockerfile](file:///d:/Project_InterViet/Dockerfile) compiles the app in Release mode using multi-stage builds.
- By default, it passes the `/p:DatabaseProvider=Postgres` MSBuild argument to compile PostgreSQL migrations and exclude SQL Server migrations from the publish outputs.
- To configure this on Render, simply connect your GitHub repository and point to the `render.yaml` or use the Web Service UI targeting the `backend-csharp` branch.
