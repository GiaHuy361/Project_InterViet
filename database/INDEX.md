# INTER-VIET Database - Documentation Index

## 📚 Tài liệu đầy đủ cho Database & API Setup

Thư mục này chứa toàn bộ tài liệu database, API contracts và hướng dẫn setup cho dự án **INTER-VIET** - Nền tảng Cố vấn Sự nghiệp AI cho Người Việt.

---

## 📋 Mục lục

### 1️⃣ [README.md](./README.md) - **ĐỌC ĐẦU TIÊN**
**Nội dung:**
- Tổng quan về database schema
- Cấu trúc 10 modules chính
- Chi tiết 30+ tables
- Stored procedures và views
- Phân chia API giữa C# và Python
- Connection strings
- Migration và deployment notes

**Dành cho:** Toàn bộ team (C#, Python, Frontend)  
**Thời gian đọc:** 15-20 phút

---

### 2️⃣ [interviet_candidate_schema.sql](./interviet_candidate_schema.sql) - **DATABASE SCHEMA**
**Nội dung:**
- Full SQL Server schema cho candidate system
- 30+ tables với indexes và relationships
- Triggers cho auto-update timestamps
- Stored procedures (sp_CheckFeatureLimit)
- Views (vw_ActiveUsers, vw_UserDashboard)
- Seed data cho 4 subscription plans

**Dành cho:** C# Backend team, Database Admins  
**Action:** Execute script để tạo database

```bash
sqlcmd -S localhost -U sa -P "Password" -d INTERVIET_DB -i interviet_candidate_schema.sql
```

---

### 3️⃣ [test_data.sql](./test_data.sql) - **TEST DATA**
**Nội dung:**
- 4 test users (Free, Trial, Monthly, Yearly)
- Sample profiles, skills, work experiences
- Sample CVs, JDs, matchings
- Sample subscriptions, payments, invoices
- Sample interviews, notifications, activities

**Dành cho:** Toàn bộ team cho testing  
**Action:** Execute sau khi chạy schema

```bash
sqlcmd -S localhost -U sa -P "Password" -d INTERVIET_DB -i test_data.sql
```

**Test credentials:**
```
nguyen.vana@gmail.com / Password123!  (Free user)
tran.thib@gmail.com / Password123!    (Trial - Yearly plan)
le.vanc@gmail.com / Password123!      (Monthly user)
pham.thid@gmail.com / Password123!    (Yearly user)
```

---

### 4️⃣ [API_CONTRACT.md](./API_CONTRACT.md) - **API SPECIFICATIONS**
**Nội dung:**
- **C# Backend APIs**: Auth, Profiles, CVs, JDs, Subscriptions, Payments, Support
- **Python AI APIs**: CV Analysis, CV-JD Matching, AI Interview, Voice Processing
- Request/Response formats với examples
- Authentication (JWT Bearer)
- Error responses
- Service-to-service communication
- Rate limiting

**Dành cho:** 
- **C# team:** Implement controller endpoints
- **Python team:** Implement AI processing endpoints
- **Frontend team:** Consume APIs

**Thời gian đọc:** 30-40 phút

**Key sections:**
```
C# APIs:
- POST /auth/register
- POST /auth/login
- GET /cvs
- POST /cvs/upload
- POST /ai/cv/analyze
- POST /ai/matching/single
- POST /ai/interview/start

Python AI APIs:
- POST /ai/cv/analyze
- POST /ai/matching/single
- POST /ai/matching/multi
- POST /ai/interview/answer
```

---

### 5️⃣ [SETUP_GUIDE.md](./SETUP_GUIDE.md) - **HƯỚNG DẪN CÀI ĐẶT**
**Nội dung:**
1. **Database Setup** (SQL Server)
   - Windows, macOS, Linux (Docker)
   - Create database
   - Verify installation

2. **C# Backend Setup** (ASP.NET Core)
   - Prerequisites (.NET 8 SDK)
   - Create project structure
   - Install NuGet packages
   - Configure appsettings.json
   - Setup Entity Framework
   - Run application

3. **Python AI Backend Setup** (FastAPI)
   - Prerequisites (Python 3.11+)
   - Create virtual environment
   - Install dependencies (ML models, NLP, etc.)
   - Configure .env
   - Database connection (pyodbc)
   - Run application

4. **Testing End-to-End**
   - Start all services
   - Test with curl/Postman

5. **Deployment** (Production)
   - Azure/AWS recommendations

**Dành cho:** DevOps, Backend teams  
**Thời gian:** 2-3 giờ để setup đầy đủ

---

### 6️⃣ [ERD_DESCRIPTION.md](./ERD_DESCRIPTION.md) - **DATABASE RELATIONSHIPS**
**Nội dung:**
- Visual representation của database structure
- Chi tiết relationships giữa các tables
- 1:1, 1:N, N:1 relationships
- Composite/junction tables
- Cascade delete behaviors
- Index strategy
- Query optimization examples
- Data integrity rules
- Database size estimates

**Dành cho:** 
- Database architects
- Backend developers cần hiểu data model
- Code reviewers

**Thời gian đọc:** 20-25 phút

**Key diagrams:**
```
Users → Profiles (1:1)
Users → CVs (1:N)
Users → Subscriptions (1:N)
CVs × JDs → CVJDMatchings (M:N with data)
InterviewSessions → Questions → Answers (1:N:1)
```

---

## 🚀 Quick Start Guide

### Cho người mới bắt đầu:

**Bước 1:** Đọc [README.md](./README.md) để hiểu tổng quan  
**Bước 2:** Đọc [SETUP_GUIDE.md](./SETUP_GUIDE.md) phần Database Setup  
**Bước 3:** Execute [interviet_candidate_schema.sql](./interviet_candidate_schema.sql)  
**Bước 4:** Execute [test_data.sql](./test_data.sql)  
**Bước 5:** Verify database với sample queries trong README

### Cho C# Backend Developer:

**Bước 1:** Setup database (see above)  
**Bước 2:** Đọc [API_CONTRACT.md](./API_CONTRACT.md) phần C# APIs  
**Bước 3:** Follow [SETUP_GUIDE.md](./SETUP_GUIDE.md) phần C# Backend Setup  
**Bước 4:** Đọc [ERD_DESCRIPTION.md](./ERD_DESCRIPTION.md) để hiểu relationships  
**Bước 5:** Start coding controllers & services

**Key files to reference:**
- `appsettings.json` template trong SETUP_GUIDE
- C# API endpoints trong API_CONTRACT
- Database models trong ERD_DESCRIPTION

### Cho Python AI Developer:

**Bước 1:** Setup database (see above)  
**Bước 2:** Đọc [API_CONTRACT.md](./API_CONTRACT.md) phần Python AI APIs  
**Bước 3:** Follow [SETUP_GUIDE.md](./SETUP_GUIDE.md) phần Python AI Setup  
**Bước 4:** Đọc [ERD_DESCRIPTION.md](./ERD_DESCRIPTION.md) để biết tables nào cần access  
**Bước 5:** Start coding ML/AI services

**Key files to reference:**
- `.env` template trong SETUP_GUIDE
- Python AI endpoints trong API_CONTRACT
- Database access patterns trong ERD_DESCRIPTION

### Cho Frontend Developer:

**Bước 1:** Đọc [API_CONTRACT.md](./API_CONTRACT.md)  
**Bước 2:** Test APIs với credentials trong [test_data.sql](./test_data.sql)  
**Bước 3:** Implement API calls trong React app  

**Key endpoints to integrate:**
```typescript
// Auth
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh-token

// CV
GET /api/v1/cvs
POST /api/v1/cvs/upload
GET /api/v1/cvs/{id}

// Matching
POST /ai/matching/single
POST /ai/matching/multi

// Interview
POST /ai/interview/start
POST /ai/interview/answer
```

---

## 📊 File Statistics

| File | Lines | Size | Purpose |
|------|-------|------|---------|
| `interviet_candidate_schema.sql` | 1,200+ | ~60 KB | Full database schema |
| `test_data.sql` | 400+ | ~25 KB | Sample data for testing |
| `API_CONTRACT.md` | 1,000+ | ~50 KB | Complete API documentation |
| `SETUP_GUIDE.md` | 800+ | ~40 KB | Setup instructions |
| `ERD_DESCRIPTION.md` | 600+ | ~30 KB | Database relationships |
| `README.md` | 400+ | ~20 KB | Overview & documentation |

**Total:** ~225 KB of documentation

---

## 🎯 Learning Path

### Week 1: Database Fundamentals
- [ ] Read README.md
- [ ] Setup local SQL Server
- [ ] Execute schema & test data
- [ ] Practice sample queries
- [ ] Understand ERD_DESCRIPTION.md

### Week 2: Backend Development (C#)
- [ ] Read API_CONTRACT.md (C# section)
- [ ] Follow SETUP_GUIDE.md (C# section)
- [ ] Implement User & Auth endpoints
- [ ] Implement Profile endpoints
- [ ] Test with Postman

### Week 3: AI Integration (Python)
- [ ] Read API_CONTRACT.md (Python section)
- [ ] Follow SETUP_GUIDE.md (Python section)
- [ ] Implement CV Analysis
- [ ] Implement CV-JD Matching
- [ ] Test integration with C# backend

### Week 4: Testing & Deployment
- [ ] End-to-end testing
- [ ] Performance testing
- [ ] Security review
- [ ] Deployment setup

---

## 🔗 External Resources

### SQL Server
- [Download SQL Server](https://www.microsoft.com/sql-server/sql-server-downloads)
- [SQL Server Documentation](https://docs.microsoft.com/sql/sql-server/)
- [SSMS Download](https://aka.ms/ssmsfullsetup)

### .NET / C#
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [ASP.NET Core Documentation](https://docs.microsoft.com/aspnet/core/)
- [Entity Framework Core](https://docs.microsoft.com/ef/core/)

### Python
- [Python Download](https://www.python.org/downloads/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Sentence Transformers](https://www.sbert.net/)

### Tools
- [Azure Data Studio](https://aka.ms/azuredatastudio)
- [Postman](https://www.postman.com/downloads/)
- [VS Code](https://code.visualstudio.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

## ❓ FAQ

**Q: Tôi nên bắt đầu từ đâu?**  
A: Đọc README.md trước, sau đó follow SETUP_GUIDE.md theo role của bạn (C#/Python/Frontend).

**Q: Database chạy trên platform nào?**  
A: SQL Server (Windows, macOS/Linux qua Docker, hoặc Azure SQL Database).

**Q: C# và Python communicate như thế nào?**  
A: REST APIs qua HTTP. C# gọi Python AI endpoints khi cần AI processing. Xem API_CONTRACT.md.

**Q: Test data có đủ để develop không?**  
A: Có. test_data.sql có 4 users với đủ data cho mọi tính năng.

**Q: Production deployment như thế nào?**  
A: Xem SETUP_GUIDE.md section "Deployment (Production)".

**Q: Làm sao tạo ERD diagram visual?**  
A: Copy CREATE TABLE statements vào dbdiagram.io hoặc dùng SSMS Database Diagrams.

---

## 📞 Support

**Team Lead:** [Tên của bạn]  
**Email:** team@interviet.com  
**Slack:** #interviet-dev  

**Issues:** Report bugs và feature requests tại [GitHub Issues](#)

---

## 📝 Change Log

### Version 1.0.0 (2026-04-23)
- ✅ Initial database schema
- ✅ Complete API contracts
- ✅ Setup guides for C# & Python
- ✅ Test data
- ✅ ERD documentation

---

## ✅ Checklist Before Starting Development

- [ ] SQL Server installed and running
- [ ] Database created (`INTERVIET_DB`)
- [ ] Schema executed successfully
- [ ] Test data loaded
- [ ] Can connect to database from C# app
- [ ] Can connect to database from Python app
- [ ] Read and understood API_CONTRACT.md
- [ ] Environment variables configured (.env, appsettings.json)
- [ ] Team has access to documentation

---

**Happy coding! 🚀**

Last updated: 2026-04-23
