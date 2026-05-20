# Phase 14 — Admin / Support / Operation API Documentation

## Overview

Phase 14 introduces administrative, support, and operational capabilities for the INTER-VIET platform. It provides:

- **Support Ticket System** — Candidates create and track support tickets; admins/support staff manage, assign, reply, and override statuses.
- **Admin User Management** — Paginated user listing, detailed user view, and user status modification.
- **Admin Billing** — View payment transactions, invoices, and subscriptions.
- **Admin Mentor Bookings & Report Shares** — View all mentor bookings and report share links.
- **Broadcast Notifications** — Send system announcements to all candidates.
- **System Audit Logging** — Tracks administrative actions with actor context.
- **Operational Health Check** — Diagnostic check of system components.
- **Feature Gate** — `[FeatureGate]` attribute returns 503 when a feature is disabled.
- **Admin Bootstrap** — Startup seed admin promotion and dev promote endpoint.

---

## Configuration

### appsettings.json

```json
{
  "Admin": {
    "Enabled": true,
    "EnableDevBootstrap": true,
    "SeedAdminEmail": "admin@interviet.com"
  },
  "Support": {
    "Enabled": true
  }
}
```

- `Admin:Enabled` / `Support:Enabled` — When `false`, all endpoints decorated with `[FeatureGate("Admin")]` or `[FeatureGate("Support")]` return **503 Service Unavailable**.
- `Admin:EnableDevBootstrap` — Enables the dev promote endpoint and startup seed admin.
- `Admin:SeedAdminEmail` — Email of the user to auto-promote to admin role on startup.

---

## Authorization Policies

| Policy | Allowed Roles |
|---|---|
| `AdminOnly` | `admin` |
| `AdminOrSupport` | `admin`, `support` |

---

## Endpoints

### 1. Candidate Support Tickets

**Base route:** `GET/POST /api/v1/support/tickets`
**Auth:** `[Authorize]` (any authenticated user)
**Feature gate:** `[FeatureGate("Support")]`

| Method | Route | Description |
|---|---|---|
| `POST /` | Create ticket | Creates a new support ticket. |
| `GET /` | List tickets | Paginated list of own tickets. Query: `page`, `pageSize`. |
| `GET /{id}` | Get ticket detail | Returns ticket with public messages only (excludes internal notes). |
| `POST /{id}/messages` | Reply to ticket | Adds a user reply. **Reopens ticket** if status was `resolved` or `closed`. |
| `POST /{id}/close` | Close ticket | Sets status to `closed`, sets `ClosedAt`. |

#### Create Ticket Request

```json
{
  "category": "technical",
  "priority": "medium",
  "subject": "Cannot upload resume",
  "description": "Getting error when uploading PDF file..."
}
```

#### Ticket Detail Response

```json
{
  "id": "guid",
  "ticketNumber": "TK-20260520120000-123",
  "category": "technical",
  "priority": "medium",
  "subject": "Cannot upload resume",
  "status": "open",
  "description": "...",
  "assignedTo": null,
  "createdAt": "2026-05-20T12:00:00Z",
  "closedAt": null,
  "lastMessageAt": null,
  "messages": [
    {
      "id": "guid",
      "senderType": "user",
      "senderUserId": "guid",
      "messageBody": "...",
      "createdAt": "2026-05-20T12:05:00Z",
      "isInternalNote": false
    }
  ]
}
```

---

### 2. Admin Support Tickets

**Base route:** `/api/v1/admin/support/tickets`
**Auth:** `[Authorize(Policy = "AdminOrSupport")]`
**Feature gate:** `[FeatureGate("Support")]`

| Method | Route | Description |
|---|---|---|
| `GET /` | List all tickets | Paginated. Filters: `status`, `category`, `priority`, `userId`. |
| `GET /{id}` | Get ticket detail | Includes **all messages** including internal notes. |
| `POST /{id}/assign` | Assign ticket | Sets `AssignedTo`. Auto-transitions `open` → `in_progress`. |
| `POST /{id}/messages` | Add message/note | Public reply (`isInternalNote: false`) or internal note (`isInternalNote: true`). |
| `POST /{id}/status` | Override status | Direct status override: `open`, `in_progress`, `resolved`, `closed`. |

#### Assign Request
```json
{ "assignedTo": "support-staff-name" }
```

#### Admin Message Request
```json
{ "messageBody": "We are investigating...", "isInternalNote": false }
```

#### Status Override Request
```json
{ "status": "resolved" }
```

---

### 3. Admin Dashboard Summary

**Route:** `GET /api/v1/admin/dashboard/summary`
**Auth:** `AdminOnly`

Returns aggregated system-wide statistics:

```json
{
  "totalUsers": 150,
  "newUsersToday": 5,
  "newUsersThisWeek": 23,
  "activeSubscriptions": 45,
  "totalSubscriptionRevenue": 15000000,
  "totalPayments": 80,
  "totalMockRevenue": 20000000,
  "totalResumesOptimized": 200,
  "totalMatchingSessions": 300,
  "totalInterviewSessions": 120,
  "totalMentorBookings": 50,
  "totalBookingRevenue": 5000000,
  "totalReportShares": 35,
  "supportTicketsByStatus": {
    "open": 5,
    "in_progress": 3,
    "resolved": 10,
    "closed": 20
  }
}
```

---

### 4. Admin User Management

**Base route:** `/api/v1/admin/users`
**Auth:** `AdminOnly`

| Method | Route | Description |
|---|---|---|
| `GET /` | List users | Paginated. Filters: `search`, `role`, `status`, `emailVerified`, `page`, `pageSize`. |
| `GET /{id}` | User detail | Summary + profile + subscription + quotas + recent payments + recent bookings + ticket count. |
| `PATCH /{id}/status` | Update status | Allowed statuses: `active`, `suspended`, `disabled`. Audit logged. |

#### Update Status Request
```json
{ "status": "suspended" }
```

#### User Detail Response
```json
{
  "userSummary": { "id": "...", "email": "...", "fullName": "...", "role": "candidate", "status": "active", "emailVerified": true, "createdAt": "...", "lastLoginAt": "..." },
  "profileSummary": { "headline": "...", "bio": "...", "yearsOfExperience": "3.5", "skills": ["C#", "React"] },
  "currentSubscription": { "subscriptionId": "...", "planKey": "pro_monthly", "status": "active", "startsAt": "...", "endsAt": "..." },
  "quotaSummary": { "dailyMatchUsed": 2, "dailyMatchLimit": 10, "dailyInterviewUsed": 1, "dailyInterviewLimit": 5, "dailyOptimizeUsed": 0, "dailyOptimizeLimit": 5 },
  "recentPayments": [],
  "recentBookings": [],
  "supportTicketCount": 3
}
```

---

### 5. Admin Billing

**Auth:** `AdminOnly`

| Method | Route | Filters |
|---|---|---|
| `GET /api/v1/admin/billing/payments` | Payment transactions | `status`, `purpose`, `provider`, `userId`, `page`, `pageSize` |
| `GET /api/v1/admin/billing/invoices` | Invoices | `status`, `purpose`, `userId`, `page`, `pageSize` |
| `GET /api/v1/admin/subscriptions` | Subscriptions | `status`, `userId`, `page`, `pageSize` |

---

### 6. Admin Mentor Bookings

**Route:** `GET /api/v1/admin/mentor-bookings`
**Auth:** `AdminOnly`
**Filters:** `status`, `mentorId`, `userId`, `from`, `to`, `page`, `pageSize`

---

### 7. Admin Report Shares

**Route:** `GET /api/v1/admin/reports/shares`
**Auth:** `AdminOnly`
**Filters:** `reportType`, `userId`, `isActive`, `page`, `pageSize`

> **Security:** Tokens are **never** exposed in full. Only `tokenPreview` (first/last 6 chars) is returned.

---

### 8. Broadcast Notification

**Route:** `POST /api/v1/admin/notifications/broadcast`
**Auth:** `AdminOnly`

```json
{
  "title": "Hệ thống bảo trì",
  "message": "Hệ thống sẽ bảo trì từ 2:00 AM - 4:00 AM ngày 21/05.",
  "priority": "high",
  "target": "all"
}
```

Creates `system.announcement` notification for all active candidates.

---

### 9. Dev Promote

**Route:** `POST /api/v1/admin/dev/promote`
**Auth:** `AdminOnly`
**Prerequisite:** `Admin:EnableDevBootstrap` must be `true`.

```json
{ "email": "user@example.com", "roleCode": "admin" }
```

Valid roles: `admin`, `support`, `mentor`, `candidate`.

---

### 10. Audit Logs

**Route:** `GET /api/v1/admin/audit-logs`
**Auth:** `AdminOnly`
**Filters:** `actorRole`, `action`, `resource`, `resourceId`, `page`, `pageSize`

#### Tracked Actions

| Action Key | Trigger |
|---|---|
| `support.ticket_created` | Candidate creates a ticket |
| `support.ticket_replied` | User or admin replies to ticket |
| `support.ticket_status_updated` | Admin overrides ticket status |
| `support.ticket_assigned` | Admin assigns ticket to staff |
| `admin.user_status_updated` | Admin changes user status |
| `admin.notification_broadcast` | Admin sends broadcast notification |
| `admin.dev_promote` | Admin promotes a user role |

Each audit log entry captures: `actorId`, `actorEmail`, `actorRole`, `action`, `resource`, `resourceId`, `metadataJson`, `ipAddress`, `userAgent`, `createdAt`.

---

### 11. Operational Health

**Route:** `GET /api/v1/admin/health`
**Auth:** `AdminOnly`

```json
{
  "status": "Healthy",
  "timestamp": "2026-05-20T12:00:00Z",
  "components": {
    "database": { "status": "Healthy", "details": "SQL Server connection successful." },
    "email": { "status": "Healthy", "details": "Email provider configured: Smtp (Credentials strictly masked)." },
    "googleAuth": { "status": "Healthy", "details": "Google OAuth integration is Configured." },
    "aiServices": { "status": "Healthy", "details": "AI match and optimization host: http://localhost:8001." }
  }
}
```

> **Security:** No credentials, passwords, API keys, or connection strings are ever exposed.

---

## Database Changes

### New Table
- `AuditLogs` — System-wide audit log.

### Modified Tables
- `SupportTickets` — Added `LastMessageAt` (DateTime?).
- `SupportTicketMessages` — Added `IsInternalNote` (bool, default false).

### Migration
- Name: `Phase14_AdminSupportOperation`

---

## New Files

| File | Description |
|---|---|
| `Api/Controllers/AdminController.cs` | All admin endpoints (dashboard, users, billing, bookings, shares, broadcast, health, audit, dev promote) |
| `Api/Controllers/AdminSupportTicketsController.cs` | Admin support ticket management |
| `Api/Controllers/SupportTicketsController.cs` | Candidate support ticket endpoints |
| `Api/Filters/FeatureGateFilter.cs` | Feature gate attribute for 503 gatekeeping |
| `Application/Common/Interfaces/IAuditLogService.cs` | Audit log service interface |
| `Infrastructure/Services/AuditLogService.cs` | Audit log service implementation |
| `Contracts/Admin/AdminContracts.cs` | Admin DTOs and request/response records |
| `Contracts/Support/SupportTicketContracts.cs` | Support ticket DTOs |

## Modified Files

| File | Change |
|---|---|
| `appsettings.json` | Added `Admin` and `Support` config sections |
| `Domain/Support/SupportEntities.cs` | Added `AuditLog` entity, `LastMessageAt`, `IsInternalNote` |
| `Application/Common/Interfaces/IAppDbContext.cs` | Added `DbSet<AuditLog>` |
| `Infrastructure/Persistence/AppDbContext.cs` | Added `DbSet<AuditLog>` |
| `Infrastructure/Persistence/Configurations/BillingAndSupportConfigurations.cs` | Added `AuditLogConfiguration` |
| `Infrastructure/DependencyInjection.cs` | Registered `IAuditLogService` |
| `Api/Program.cs` | Added policies, admin bootstrap |
| `Application/Common/Options/AppOptions.cs` | Added `AdminOptions` |
