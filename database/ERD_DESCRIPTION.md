# INTER-VIET - Entity Relationship Diagram

## Database Relationships Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CORE USER MODULE                            │
│                                                                      │
│  ┌──────────┐                                                       │
│  │  Users   │◄──────────┐                                           │
│  └────┬─────┘           │                                           │
│       │                 │                                           │
│       │ 1:1             │ 1:N                                       │
│       ▼                 │                                           │
│  ┌────────────────┐     │                                           │
│  │ UserSessions   │     │                                           │
│  └────────────────┘     │                                           │
└─────────────────────────┼───────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┬───────────────────────────┐
          │               │               │                           │
          ▼               ▼               ▼                           ▼
┌─────────────────┐ ┌────────────┐ ┌────────────┐           ┌────────────────┐
│  PROFILE MODULE │ │ CV MODULE  │ │ JD MODULE  │           │ BILLING MODULE │
└─────────────────┘ └────────────┘ └────────────┘           └────────────────┘
```

---

## 1. Core User & Authentication

### Users (Central Table)
**Primary Key:** `UserId`

**Related Tables:**
- **UserSessions** (1:N) - Refresh tokens
- **CandidateProfiles** (1:1) - Extended profile
- **CVs** (1:N) - User's CVs
- **JobDescriptions** (1:N) - User's JDs
- **Subscriptions** (1:N) - User subscriptions
- **Payments** (1:N) - Payment history
- **InterviewSessions** (1:N) - Interview sessions
- **Notifications** (1:N) - User notifications
- **ActivityLogs** (1:N) - User activities
- **SupportTickets** (1:N) - Support tickets

```sql
Users (UserId PK)
  ├─► UserSessions (UserId FK) [1:N]
  ├─► CandidateProfiles (UserId FK) [1:1 UNIQUE]
  ├─► CVs (UserId FK) [1:N]
  ├─► JobDescriptions (UserId FK) [1:N]
  ├─► Subscriptions (UserId FK) [1:N]
  ├─► Payments (UserId FK) [1:N]
  ├─► InterviewSessions (UserId FK) [1:N]
  ├─► Notifications (UserId FK) [1:N]
  ├─► ActivityLogs (UserId FK) [1:N]
  └─► SupportTickets (UserId FK) [1:N]
```

---

## 2. Profile Module

### CandidateProfiles
**Primary Key:** `ProfileId`  
**Foreign Key:** `UserId` (UNIQUE - 1:1 relationship)

**Child Tables:**
- **Skills** (1:N)
- **WorkExperiences** (1:N)
- **Educations** (1:N)
- **Certifications** (1:N)

```sql
Users (UserId PK)
  └─► CandidateProfiles (ProfileId PK, UserId FK UNIQUE) [1:1]
       ├─► Skills (SkillId PK, UserId FK) [1:N]
       ├─► WorkExperiences (ExperienceId PK, UserId FK) [1:N]
       ├─► Educations (EducationId PK, UserId FK) [1:N]
       └─► Certifications (CertificationId PK, UserId FK) [1:N]
```

**Note:** Profile child tables reference `Users.UserId` directly (not `ProfileId`) for simpler queries.

---

## 3. CV Module

### CVs
**Primary Key:** `CVId`  
**Foreign Key:** `UserId`

**Related Tables:**
- **CVTemplates** (N:1) - Optional template reference
- **CVJDMatchings** (1:N) - Matching results
- **MultiJDMatchings** (1:N) - Multi-JD matching results

```sql
Users (UserId PK)
  └─► CVs (CVId PK, UserId FK) [1:N]
       ├─► CVJDMatchings (MatchingId PK, CVId FK) [1:N]
       └─► MultiJDMatchings (MultiMatchingId PK, CVId FK) [1:N]

CVTemplates (TemplateId PK)
  └─► CVs (TemplateId FK) [1:N] (optional)
```

---

## 4. Job Description & Matching Module

### JobDescriptions
**Primary Key:** `JDId`  
**Foreign Key:** `UserId`

**Related Tables:**
- **CVJDMatchings** (1:N) - Matching results
- **InterviewSessions** (1:N) - Interviews for this JD

```sql
Users (UserId PK)
  └─► JobDescriptions (JDId PK, UserId FK) [1:N]
       ├─► CVJDMatchings (MatchingId PK, JDId FK) [1:N]
       └─► InterviewSessions (SessionId PK, JDId FK) [1:N] (optional)
```

### CVJDMatchings (Composite relationship)
**Primary Key:** `MatchingId`  
**Foreign Keys:** `UserId`, `CVId`, `JDId`

```sql
CVJDMatchings (MatchingId PK, UserId FK, CVId FK, JDId FK)
  ├── References: Users (UserId)
  ├── References: CVs (CVId)
  └── References: JobDescriptions (JDId)
```

**Why 3 FKs?**
- `UserId`: Ownership & authorization check
- `CVId`: Which CV was matched
- `JDId`: Against which JD

### MultiJDMatchings
**Primary Key:** `MultiMatchingId`  
**Foreign Keys:** `UserId`, `CVId`

```sql
MultiJDMatchings (MultiMatchingId PK, UserId FK, CVId FK)
  ├── References: Users (UserId)
  └── References: CVs (CVId)
  
  Contains JSON field `MatchingResults` with array of:
  - JDId
  - MatchScore
  - ... other matching data
```

---

## 5. Interview Module

### InterviewSessions
**Primary Key:** `SessionId`  
**Foreign Keys:** `UserId`, `JDId` (optional)

**Child Tables:**
- **InterviewQuestions** (1:N)
  - **InterviewAnswers** (1:1)

```sql
Users (UserId PK)
  └─► InterviewSessions (SessionId PK, UserId FK, JDId FK nullable) [1:N]
       └─► InterviewQuestions (QuestionId PK, SessionId FK) [1:N]
            └─► InterviewAnswers (AnswerId PK, QuestionId FK) [1:1]

JobDescriptions (JDId PK)
  └─► InterviewSessions (JDId FK) [1:N] (optional)
```

**Cascade:**
- Delete `InterviewSession` → CASCADE delete all `InterviewQuestions`
- Delete `InterviewQuestion` → CASCADE delete `InterviewAnswer`

---

## 6. Subscription & Billing Module

### SubscriptionPlans (Reference Table)
**Primary Key:** `PlanId`

**Related Tables:**
- **Subscriptions** (1:N)

```sql
SubscriptionPlans (PlanId PK)
  └─► Subscriptions (SubscriptionId PK, PlanId FK) [1:N]
```

### Subscriptions
**Primary Key:** `SubscriptionId`  
**Foreign Keys:** `UserId`, `PlanId`, `LastPaymentId` (optional)

```sql
Users (UserId PK)
  └─► Subscriptions (SubscriptionId PK, UserId FK, PlanId FK) [1:N]
       └─► Payments (PaymentId PK, SubscriptionId FK) [1:N]

SubscriptionPlans (PlanId PK)
  └─► Subscriptions (PlanId FK) [1:N]

Payments (PaymentId PK)
  └─► Subscriptions (LastPaymentId FK) [N:1] (self-reference)
```

### UsageTracking
**Primary Key:** `UsageId`  
**Foreign Keys:** `UserId`, `SubscriptionId`

```sql
Users (UserId PK)
  └─► UsageTracking (UsageId PK, UserId FK, SubscriptionId FK) [1:N]

Subscriptions (SubscriptionId PK)
  └─► UsageTracking (SubscriptionId FK) [1:N]
```

**Business Logic:**
- New `UsageTracking` record created each billing period
- Tracks usage against subscription limits

---

## 7. Payment Module

### Payments
**Primary Key:** `PaymentId`  
**Foreign Keys:** `UserId`, `SubscriptionId` (optional)

**Related Tables:**
- **Invoices** (1:1)

```sql
Users (UserId PK)
  └─► Payments (PaymentId PK, UserId FK, SubscriptionId FK) [1:N]
       └─► Invoices (InvoiceId PK, PaymentId FK) [1:1]

Subscriptions (SubscriptionId PK)
  └─► Payments (SubscriptionId FK) [1:N]
```

### PaymentMethods
**Primary Key:** `PaymentMethodId`  
**Foreign Key:** `UserId`

```sql
Users (UserId PK)
  └─► PaymentMethods (PaymentMethodId PK, UserId FK) [1:N]
```

**Note:** `PaymentMethods` stores tokenized card/bank info for future payments. Not directly linked to `Payments` table.

---

## 8. Support Module

### SupportTickets
**Primary Key:** `TicketId`  
**Foreign Key:** `UserId`

**Child Tables:**
- **SupportMessages** (1:N)

```sql
Users (UserId PK)
  └─► SupportTickets (TicketId PK, UserId FK) [1:N]
       └─► SupportMessages (MessageId PK, TicketId FK) [1:N]
```

---

## 9. System & Activity Tracking

### Notifications
**Primary Key:** `NotificationId`  
**Foreign Key:** `UserId`

```sql
Users (UserId PK)
  └─► Notifications (NotificationId PK, UserId FK) [1:N]
```

### ActivityLogs
**Primary Key:** `ActivityId`  
**Foreign Key:** `UserId`

```sql
Users (UserId PK)
  └─► ActivityLogs (ActivityId PK, UserId FK) [1:N]
```

**Note:** `RelatedEntityId` is a GUID that can point to any entity (CV, JD, Payment, etc.) - not a real FK.

### AuditLogs
**Primary Key:** `AuditId`  
**Foreign Key:** `UserId` (optional - for tracking who made change)

```sql
Users (UserId PK)
  └─► AuditLogs (AuditId PK, UserId FK nullable) [1:N]
```

**Note:** `RecordId` is a GUID of the changed record - not a real FK. Used for compliance tracking.

---

## Key Relationships Summary

### 1:1 Relationships
```
Users ──[1:1]── CandidateProfiles
InterviewQuestions ──[1:1]── InterviewAnswers
Payments ──[1:1]── Invoices
```

### 1:N Relationships (Parent → Children)
```
Users ──[1:N]── CVs
Users ──[1:N]── JobDescriptions
Users ──[1:N]── Subscriptions
CVs ──[1:N]── CVJDMatchings
InterviewSessions ──[1:N]── InterviewQuestions
SupportTickets ──[1:N]── SupportMessages
```

### N:1 Relationships (Many → One)
```
Subscriptions ──[N:1]── SubscriptionPlans
CVs ──[N:1]── CVTemplates (optional)
InterviewSessions ──[N:1]── JobDescriptions (optional)
```

### Composite/Junction Relationships
```
CVJDMatchings:
  - UserId FK → Users
  - CVId FK → CVs
  - JDId FK → JobDescriptions
  
(Acts as junction table for many-to-many between CVs and JDs,
 with additional matching data)
```

---

## Cascade Delete Behaviors

### CASCADE (children deleted automatically)
```
Users → UserSessions (CASCADE)
Users → CandidateProfiles (CASCADE)
Users → Skills (CASCADE)
Users → CVs (CASCADE)
Users → Subscriptions (CASCADE)
InterviewSessions → InterviewQuestions → InterviewAnswers (CASCADE)
SupportTickets → SupportMessages (CASCADE)
Payments → Invoices (CASCADE)
```

### NO ACTION (prevent delete if children exist)
```
CVJDMatchings → CVs (NO ACTION)
CVJDMatchings → JobDescriptions (NO ACTION)
MultiJDMatchings → CVs (NO ACTION)

Reason: Preserve historical matching data even if CV/JD deleted
```

### SET NULL (nullable FKs)
```
InterviewSessions → JobDescriptions (SET NULL)
Subscriptions → Payments.LastPaymentId (SET NULL)

Reason: Allow deletion of JD without losing interview history
```

---

## Index Strategy

### Primary Indexes (Auto-created)
- All primary keys have clustered index

### Foreign Key Indexes
All foreign keys have non-clustered indexes:
```sql
IX_UserSessions_UserId
IX_CandidateProfiles_UserId
IX_CVs_UserId
IX_JobDescriptions_UserId
IX_Subscriptions_UserId
IX_Payments_UserId
IX_CVJDMatchings_UserId
IX_CVJDMatchings_CVId
IX_CVJDMatchings_JDId
... etc
```

### Business Logic Indexes
```sql
IX_Users_Email (UNIQUE)
IX_Users_UserStatus
IX_Subscriptions_Status
IX_Subscriptions_EndDate
IX_Payments_Status
IX_Payments_TransactionId (UNIQUE)
IX_Payments_OrderId (UNIQUE)
IX_Notifications_IsRead
IX_ActivityLogs_ActivityType
```

**Purpose:** Optimize common queries (login, subscription checks, payment lookups, etc.)

---

## Query Optimization Examples

### Get user with active subscription
```sql
SELECT u.*, s.*, sp.*
FROM Users u
LEFT JOIN Subscriptions s ON u.UserId = s.UserId
  AND s.Status IN ('active', 'trial')
  AND (s.EndDate IS NULL OR s.EndDate > GETUTCDATE())
LEFT JOIN SubscriptionPlans sp ON s.PlanId = sp.PlanId
WHERE u.UserId = @UserId;

-- Uses: IX_Subscriptions_UserId + IX_Subscriptions_Status + IX_Subscriptions_EndDate
```

### Get user's CVs with matching scores
```sql
SELECT 
  cv.*,
  COUNT(m.MatchingId) AS TotalMatches,
  AVG(m.MatchScore) AS AvgMatchScore,
  MAX(m.MatchScore) AS BestMatchScore
FROM CVs cv
LEFT JOIN CVJDMatchings m ON cv.CVId = m.CVId
WHERE cv.UserId = @UserId
GROUP BY cv.CVId, cv.CVName, ...;

-- Uses: IX_CVs_UserId + IX_CVJDMatchings_CVId
```

### Check feature limit
```sql
DECLARE @CanUse BIT, @Remaining INT;
EXEC sp_CheckFeatureLimit 
  @UserId = @UserId,
  @FeatureName = 'cv-analysis',
  @CanUse = @CanUse OUTPUT,
  @RemainingCount = @Remaining OUTPUT;

-- Stored procedure uses:
-- IX_Subscriptions_UserId + IX_Subscriptions_Status
-- IX_UsageTracking_UserId
```

---

## Data Integrity Rules

### Business Constraints

1. **User can only have ONE active subscription at a time**
   - Enforced in application logic (C# API)
   - Query: `WHERE Status IN ('active', 'trial') AND EndDate > GETUTCDATE()`

2. **Only ONE default CV per user**
   - Enforced in application logic
   - When setting `IsDefaultCV = 1`, update all other user CVs to `IsDefaultCV = 0`

3. **Trial period only for YEARLY plan**
   - `SubscriptionPlans.HasTrial = 1` only for `PlanCode = 'YEARLY'`
   - Enforced by seed data + application logic

4. **Payment must complete before subscription activates (except FREE)**
   - Workflow: Create Payment → Payment completes → Activate Subscription
   - Exception: FREE plan activates immediately on registration

5. **Usage limits reset each billing period**
   - New `UsageTracking` record created at start of each period
   - Old records kept for analytics

---

## Visual ERD (Simplified)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                              Users (Central)                            │
│                                   │                                     │
│      ┌────────────────────────────┼────────────────────────────┐       │
│      │                            │                            │       │
│      ▼                            ▼                            ▼       │
│  ┌────────────┐            ┌─────────────┐             ┌──────────┐   │
│  │  Profile   │            │     CVs     │             │   JDs    │   │
│  │            │            │             │             │          │   │
│  │ - Skills   │            │ ┌─────────┐ │             │          │   │
│  │ - WorkExp  │            │ │ CV-JD   │◄┼─────────────┤          │   │
│  │ - Education│            │ │Matchings│ │             │          │   │
│  │ - Certs    │            │ └─────────┘ │             │          │   │
│  └────────────┘            └─────────────┘             └──────────┘   │
│                                   │                            │       │
│                                   │                            │       │
│                                   └────────────┬───────────────┘       │
│                                                │                       │
│      ┌─────────────────────────────────────────┼───────────────┐       │
│      │                                         │               │       │
│      ▼                                         ▼               ▼       │
│  ┌─────────────┐                      ┌──────────────┐  ┌──────────┐  │
│  │Subscriptions│                      │  Interview   │  │ Activity │  │
│  │             │                      │  Sessions    │  │   Logs   │  │
│  │ - Plans     │                      │              │  │          │  │
│  │ - Usage     │                      │ - Questions  │  │ Notif.   │  │
│  │ - Payments  │                      │ - Answers    │  │          │  │
│  │ - Invoices  │                      │              │  │ Support  │  │
│  └─────────────┘                      └──────────────┘  └──────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Database Size Estimates (1 year, 10K users)

```
Users:                    10,000 rows      ~2 MB
CandidateProfiles:        10,000 rows      ~5 MB
Skills:                   50,000 rows      ~10 MB
CVs:                      30,000 rows      ~20 MB
JobDescriptions:          50,000 rows      ~50 MB
CVJDMatchings:           200,000 rows      ~200 MB
InterviewSessions:        50,000 rows      ~100 MB
InterviewAnswers:        250,000 rows      ~500 MB
Subscriptions:            20,000 rows      ~5 MB
Payments:                 15,000 rows      ~10 MB
ActivityLogs:            500,000 rows      ~300 MB
Notifications:           200,000 rows      ~50 MB
AuditLogs:               100,000 rows      ~100 MB

Total:                                    ~1.4 GB
```

**Note:** File storage (PDFs, audio) not included - stored in Azure Blob/S3.

---

**For visual ERD generation, use:**
- **dbdiagram.io** - paste CREATE TABLE statements
- **SQL Server Management Studio** - Database Diagrams
- **Azure Data Studio** - ER Diagram extension

