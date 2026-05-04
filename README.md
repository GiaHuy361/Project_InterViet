# INTER-VIET Candidate Platform

INTER-VIET là nền tảng hỗ trợ ứng viên quản lý hồ sơ, CV, matching với JD và luyện phỏng vấn bằng AI.

Dự án được chia thành 2 phần chính:

```text
ASP.NET Core API  = core platform
Python AI Service = AI intelligence
```

Frontend chỉ gọi vào C# API. Python service đứng phía sau C# và chỉ xử lý AI theo contract.

---

## Architecture

```text
Frontend
   ↓
ASP.NET Core API
   ↓
SQL Server / Storage / Email
   ↓
Python AI Services
   ↓
ASP.NET Core API lưu kết quả
```

C# là source of truth cho user, auth, profile, resume lifecycle, quota, billing, business state và database chính.

Python không quản user, không trừ quota, không xử lý billing và không truy cập trực tiếp database chính của C#.

---

## Tech Stack

### Backend C#

```text
.NET 8
ASP.NET Core Web API
Entity Framework Core
SQL Server
JWT Bearer
Swagger / OpenAPI
Serilog
SMTP Email
Google Login
```

### Python AI

```text
FastAPI
Pydantic
CV Intelligence Service
Interview Intelligence Service
```

---

## Project Structure

```text
Project_InterViet/
├── src/
│   ├── Interviet.Api
│   ├── Interviet.Application
│   ├── Interviet.Domain
│   ├── Interviet.Infrastructure
│   ├── Interviet.Contracts
│   └── Interviet.Shared
├── scripts/
├── Interviet.sln
└── README.md
```

---

## Current Progress

```text
Phase 0    Project Foundation                  Done
Phase 1    Identity + Candidate Profile         Done
Phase 1.1  Auth/Email/Google/Swagger Hardening  Done
Phase 2    Resume Foundation                    Done
Phase 3    Matching Foundation                  Next
```

---

## Completed Modules

### Phase 0 — Project Foundation

Đã dựng nền backend C#:

```text
Solution structure
Clean Architecture style
ASP.NET Core API
EF Core + SQL Server
Swagger
Health check
Middleware
Logging
CorrelationId
Base Result/Error handling
```

### Phase 1 — Identity + Candidate Profile

Đã có các flow chính:

```text
Register / Login / Logout
Refresh token
Verify email
Resend verification email
Forgot password
Reset password
Google login
JWT Bearer
User sessions
Single-role foundation
Candidate profile
Skills CRUD
Education CRUD
Work experience CRUD
External links CRUD
```

User thường mặc định là:

```text
candidate
```

Role model hiện tại:

```text
1 user = 1 role
Users.RoleCode
```

### Phase 2 — Resume Foundation

Đã có module quản lý CV:

```text
Upload CV PDF/DOC/DOCX
Validate file
Store file locally
Store metadata in SQL Server
List resumes
Resume detail
Active resume
Set active resume
Delete resume
Download resume
Resume parse job tracking
Python CV integration-ready
```

Resume dùng versioned model:

```text
Resume
   └── ResumeVersion
          ├── UploadedFile
          ├── ResumeParseJob
          └── ResumeParsedData
```

Khi Python CV Service chưa bật, upload CV vẫn thành công. Parse job sẽ có trạng thái:

```text
service_unavailable
```

C# không fake dữ liệu AI.

---

## Resume API

Tất cả endpoint Resume yêu cầu JWT Bearer.

```text
POST   /api/v1/resumes
GET    /api/v1/resumes
GET    /api/v1/resumes/active
GET    /api/v1/resumes/{resumeId}
PATCH  /api/v1/resumes/{resumeId}/active
DELETE /api/v1/resumes/{resumeId}
POST   /api/v1/resumes/{resumeId}/reprocess
GET    /api/v1/resumes/{resumeId}/processing-jobs
GET    /api/v1/resumes/{resumeId}/download
```

Upload dùng:

```text
multipart/form-data
```

Fields:

```text
file
title
```

---

## Python AI Services

### CV Intelligence Service

Dự kiến chạy tại:

```text
http://localhost:8001
```

Endpoint đầu tiên cần có:

```text
POST /v1/cv/parse
```

Service này phụ trách:

```text
Parse CV
Extract text từ PDF/DOC/DOCX
Tách section cơ bản
Nhận diện skills
Nhận diện education / experience
Chuẩn bị cho CV-JD matching
```

### Interview Intelligence Service

Dự kiến chạy tại:

```text
http://localhost:8002
```

Endpoint đầu tiên cần có:

```text
POST /v1/interview/report
```

Service này phụ trách:

```text
Transcript analysis
Interview scoring
Feedback generation
Strengths / weaknesses
Actionable feedback
Interview report
```

---

## Development Rule

Không fake AI result trong flow chính.

Nếu Python service chưa sẵn sàng, C# phải lưu trạng thái rõ ràng như:

```text
queued
failed
service_unavailable
```

Không tự bịa:

```text
rawText
skills
scores
recommendations
interview report
```

---

## Local Setup

Clone repository:

```bash
git clone https://github.com/GiaHuy361/Project_InterViet.git
cd Project_InterViet
```

Restore packages:

```bash
dotnet restore
```

Build:

```bash
dotnet build
```

Apply migrations:

```bash
dotnet ef database update --project src/Interviet.Infrastructure --startup-project src/Interviet.Api
```

Run API:

```bash
dotnet run --project src/Interviet.Api
```

Swagger:

```text
http://localhost:5000/swagger
```

Health check:

```text
http://localhost:5000/api/v1/health
```

---

## Configuration

Không commit secret thật lên GitHub.

File local cần tự tạo:

```text
src/Interviet.Api/appsettings.Development.json
```

Ví dụ config local:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=IntervietCore;User Id=sa;Password=your_password;TrustServerCertificate=True"
  },
  "Storage": {
    "Provider": "Local",
    "BasePath": "wwwroot/uploads",
    "PublicBaseUrl": "http://localhost:5000/uploads",
    "MaxResumeFileSizeMb": 10
  },
  "AiServices": {
    "CvServiceEnabled": false,
    "CvServiceBaseUrl": "http://localhost:8001",
    "TimeoutSeconds": 60,
    "ApiKey": ""
  }
}
```

Các thông tin như Gmail password, Google secret, SQL password, JWT secret không được commit.

---

## Branch Strategy

```text
main                      Stable code
develop                   Integration branch
backend-csharp            C# backend work
python-cv-service         Python CV AI service
python-interview-service  Python Interview AI service
docs                      Documentation
```

Không code trực tiếp trên `main`.

Code mới đi vào nhánh theo vai trò, sau đó merge về `develop`. Khi `develop` ổn định thì merge vào `main`.

---

## Roadmap

```text
Phase 3   Matching Foundation
Phase 4   Dashboard + Usage
Phase 5   Subscription + Billing
Phase 6   CV AI Integration
Phase 7   Interview Orchestration
Phase 8   Interview AI Integration
Phase 9   Mentor + Notifications
Phase 10  Privacy + Support + Admin Ops
Phase 11  Hardening + UAT + Release Prep
```

### Phase 3 — Matching Foundation

Dự kiến làm tiếp:

```text
Job Description CRUD
Bookmark jobs
Match sessions
Match targets
Match results
CV-JD matching integration
No fake AI score
```

---

## Team Ownership

### C# Backend

```text
Core platform
Auth
Profile
Resume lifecycle
Database chính
Quota / billing
API cho frontend
Business state
Persist AI results
```

### Python CV Service

```text
CV parsing
Text extraction
Skill extraction
CV-JD matching
Multi-match
Skill gap analysis
```

### Python Interview Service

```text
Transcript analysis
Interview scoring
Feedback generation
Interview report
Question-level feedback
```

---

## Notes

Repo này đang trong quá trình phát triển MVP.

Ưu tiên hiện tại:

```text
Ổn định Phase 2 Resume Foundation
Hoàn thiện Python CV parse service
Chuẩn bị Phase 3 Matching Foundation
```
