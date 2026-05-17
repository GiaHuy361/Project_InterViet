# INTER-VIET - Database Schema Documentation

## Tổng quan
Database schema cho INTER-VIET Candidate System (SQL Server) - Nền tảng cố vấn sự nghiệp AI cho người Việt.

## Cấu trúc chính

### 1. **USERS & AUTHENTICATION** (2 tables)
- `Users` - Thông tin người dùng và authentication
- `UserSessions` - Quản lý refresh tokens và sessions

**User Status Flow:**
```
visitor → free → trial (chỉ Gói Năm) → premium → expired/cancelled/suspended
```

### 2. **USER PROFILES** (5 tables)
- `CandidateProfiles` - Thông tin cá nhân và career preferences
- `Skills` - Kỹ năng của ứng viên
- `WorkExperiences` - Kinh nghiệm làm việc
- `Educations` - Học vấn
- `Certifications` - Chứng chỉ

### 3. **CVs & DOCUMENTS** (2 tables)
- `CVs` - Quản lý CV files và AI analysis
- `CVTemplates` - Templates CV cho premium users

### 4. **JOB DESCRIPTIONS & MATCHING** (3 tables)
- `JobDescriptions` - JD được user tải lên hoặc import
- `CVJDMatchings` - Kết quả matching 1 CV vs 1 JD
- `MultiJDMatchings` - Kết quả matching 1 CV vs nhiều JDs

**Match Score Levels:**
- 80-100: Excellent
- 60-79: Good  
- 40-59: Fair
- 0-39: Poor

### 5. **AI INTERVIEW PRACTICE** (3 tables)
- `InterviewSessions` - Phiên phỏng vấn
- `InterviewQuestions` - Câu hỏi AI tạo ra
- `InterviewAnswers` - Câu trả lời (text + voice) và evaluations

**Interview Types:**
- behavioral, technical, case-study, general

### 6. **SUBSCRIPTIONS & BILLING** (3 tables)
- `SubscriptionPlans` - 4 gói dịch vụ
- `Subscriptions` - Gói đăng ký của users
- `UsageTracking` - Theo dõi usage limits

**Plans (đã có data):**
```
FREE:      0đ      - 3 CV analysis, 5 JD matches, 3 JDs/multi-match, 1 interview (30 mins)
MONTHLY:   149k/tháng - 20 CV, 50 JD, 10 JDs/multi, 10 interviews (300 mins)
QUARTERLY: 129k/tháng - 60 CV, 150 JD, 15 JDs/multi, 30 interviews (900 mins)
YEARLY:    109k/tháng - UNLIMITED + 7 days trial
```

**Business Rules:**
- ✅ Gói Năm: có trial 7 ngày (`HasTrial=1, TrialDays=7`)
- ❌ Gói Tháng/Quý: KHÔNG có trial (`HasTrial=0`)

### 7. **PAYMENTS** (4 tables)
- `Payments` - Giao dịch thanh toán
- `PaymentMethods` - Phương thức thanh toán đã lưu
- `Invoices` - Hóa đơn

**Payment Methods:** VNPay, MoMo, Credit Card, Bank Transfer

**Payment Status Flow:**
```
pending → processing → completed/failed/refunded
```

### 8. **NOTIFICATIONS & ACTIVITIES** (2 tables)
- `Notifications` - Thông báo cho users
- `ActivityLogs` - Lịch sử hoạt động

### 9. **SUPPORT & FEEDBACK** (2 tables)
- `SupportTickets` - Ticket hỗ trợ
- `SupportMessages` - Chat messages trong ticket

### 10. **SYSTEM TABLES** (2 tables)
- `SystemSettings` - Cấu hình hệ thống
- `AuditLogs` - Audit trail cho compliance

## Stored Procedures

### `sp_CheckFeatureLimit`
Kiểm tra user có thể sử dụng feature không dựa trên subscription limits.

**Usage:**
```sql
DECLARE @CanUse BIT, @Remaining INT;

EXEC sp_CheckFeatureLimit 
    @UserId = 'user-guid',
    @FeatureName = 'cv-analysis', -- or 'jd-matching', 'interview-session'
    @CanUse = @CanUse OUTPUT,
    @RemainingCount = @Remaining OUTPUT;

-- @CanUse = 1 (can use), 0 (limit reached)
-- @Remaining = -1 (unlimited), or count remaining
```

## Views

### `vw_ActiveUsers`
Danh sách users active với subscription info.

### `vw_UserDashboard`
Tổng hợp thống kê cho user dashboard (CVs, JDs, matches, interviews).

## API Phân chia giữa C# và Python

### **C# Backend APIs (CRUD + Business Logic)**

#### Auth & Users
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh-token
POST   /api/auth/logout
GET    /api/users/me
PUT    /api/users/me
```

#### Profiles
```
GET    /api/profiles/me
PUT    /api/profiles/me
POST   /api/profiles/skills
PUT    /api/profiles/skills/{id}
DELETE /api/profiles/skills/{id}
POST   /api/profiles/experiences
PUT    /api/profiles/experiences/{id}
DELETE /api/profiles/experiences/{id}
POST   /api/profiles/educations
PUT    /api/profiles/educations/{id}
DELETE /api/profiles/educations/{id}
POST   /api/profiles/certifications
PUT    /api/profiles/certifications/{id}
DELETE /api/profiles/certifications/{id}
```

#### CVs (CRUD only, AI processing → Python)
```
GET    /api/cvs
POST   /api/cvs/upload
GET    /api/cvs/{id}
PUT    /api/cvs/{id}
DELETE /api/cvs/{id}
GET    /api/cvs/templates
```

#### Job Descriptions (CRUD only)
```
GET    /api/job-descriptions
POST   /api/job-descriptions
GET    /api/job-descriptions/{id}
PUT    /api/job-descriptions/{id}
DELETE /api/job-descriptions/{id}
```

#### Subscriptions & Billing
```
GET    /api/subscription-plans
GET    /api/subscriptions/me
POST   /api/subscriptions/upgrade
POST   /api/subscriptions/cancel
GET    /api/subscriptions/usage
```

#### Payments
```
POST   /api/payments/create-order
POST   /api/payments/vnpay/callback
POST   /api/payments/momo/callback
GET    /api/payments/history
GET    /api/invoices/{id}
```

#### Support
```
GET    /api/support/tickets
POST   /api/support/tickets
GET    /api/support/tickets/{id}
POST   /api/support/tickets/{id}/messages
```

### **Python AI APIs (ML/AI Processing)**

#### CV Analysis (AI)
```
POST   /ai/cv/analyze
  Request: { cvId, userId }
  Response: { score, strengths[], weaknesses[], suggestions[] }
  → Updates CVs.AnalysisScore, CVs.AnalysisData
```

#### CV-JD Matching (AI)
```
POST   /ai/matching/single
  Request: { cvId, jdId, userId }
  Response: { matchScore, matchedSkills[], missingSkills[], recommendations[] }
  → Inserts CVJDMatchings record

POST   /ai/matching/multi
  Request: { cvId, jdIds[], userId }
  Response: { matchingId, results[], bestMatch, avgScore }
  → Inserts MultiJDMatchings + multiple CVJDMatchings
```

#### Interview AI
```
POST   /ai/interview/start
  Request: { userId, jdId?, sessionType, level }
  Response: { sessionId, firstQuestion }
  → Creates InterviewSessions + first InterviewQuestion

POST   /ai/interview/answer
  Request: { questionId, answerText, audioUrl? }
  Response: { evaluation, nextQuestion }
  → Inserts InterviewAnswer + evaluates + creates next InterviewQuestion

POST   /ai/interview/complete
  Request: { sessionId }
  Response: { overallScore, feedback, strengths[], improvements[] }
  → Updates InterviewSessions with final scores
```

#### Voice Processing
```
POST   /ai/voice/transcribe
  Request: { audioUrl }
  Response: { transcribedText }

POST   /ai/voice/analyze
  Request: { audioUrl, transcribedText }
  Response: { confidenceScore, clarityScore, paceAnalysis }
```

## C# Connection String Example

```csharp
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=INTERVIET_DB;User Id=sa;Password=YourPassword;TrustServerCertificate=True;MultipleActiveResultSets=true"
  }
}
```

## Python Database Access

Python team chỉ cần:
1. **Read access** cho: `Users`, `CVs`, `JobDescriptions`, `CandidateProfiles`, `Skills`, `WorkExperiences`, `Educations`
2. **Write access** cho: `CVJDMatchings`, `MultiJDMatchings`, `InterviewSessions`, `InterviewQuestions`, `InterviewAnswers`
3. **Update access** cho: `CVs.AnalysisScore`, `CVs.AnalysisData`, `CVs.LastAnalyzedAt`

**Python Connection Example (pyodbc):**
```python
import pyodbc

conn = pyodbc.connect(
    'DRIVER={ODBC Driver 17 for SQL Server};'
    'SERVER=localhost;'
    'DATABASE=INTERVIET_DB;'
    'UID=sa;'
    'PWD=YourPassword'
)
```

## Migration & Deployment

### 1. Tạo Database
```sql
CREATE DATABASE INTERVIET_DB;
GO
USE INTERVIET_DB;
GO
```

### 2. Run Schema
```bash
sqlcmd -S localhost -U sa -P YourPassword -d INTERVIET_DB -i interviet_candidate_schema.sql
```

### 3. Verify
```sql
-- Check tables created
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

-- Check plans inserted
SELECT * FROM SubscriptionPlans ORDER BY DisplayOrder;

-- Check views
SELECT * FROM vw_ActiveUsers;
```

## Important Notes

### Indexes
Tất cả foreign keys và frequently queried columns đã có indexes để tối ưu performance.

### JSON Columns
Một số columns lưu JSON (NVARCHAR(MAX)) cho flexibility:
- `CVs.AnalysisData`
- `CVJDMatchings.MatchedSkills`, `MissingSkills`, `Recommendations`
- `InterviewAnswers.PositivePoints`, `NegativePoints`, `Suggestions`

**C# Access:**
```csharp
using System.Text.Json;

var analysisData = JsonSerializer.Deserialize<AnalysisResult>(cv.AnalysisData);
```

**Python Access:**
```python
import json

analysis_data = json.loads(cv['AnalysisData'])
```

### Security
- ⚠️ `PasswordHash` dùng bcrypt hoặc PBKDF2 (C# implementation)
- ⚠️ `PaymentMethods.BankAccountNumber` phải encrypt
- ⚠️ API keys/secrets KHÔNG lưu trong database

### File Storage
File URLs (CV, audio, images) nên lưu trên:
- Azure Blob Storage / AWS S3 (production)
- Local file system (development)

Database chỉ lưu URLs, không lưu binary data.

## Testing Data

Script tạo test data sẽ có trong file riêng `test_data.sql`.

## Questions?

Contact: [Your Team Lead]
