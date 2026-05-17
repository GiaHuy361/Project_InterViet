# INTER-VIET - Setup Guide

## Tổng quan kiến trúc

```
Frontend (React + Tailwind)
    ↓
C# Backend (ASP.NET Core)
    ↓
SQL Server Database
    ↑
Python AI (FastAPI)
```

---

## 1. Database Setup

### Bước 1: Cài đặt SQL Server

#### Windows:
1. Download **SQL Server 2022 Developer Edition** (free): https://www.microsoft.com/sql-server/sql-server-downloads
2. Install với default settings
3. Install **SQL Server Management Studio (SSMS)**: https://aka.ms/ssmsfullsetup

#### macOS/Linux (Docker):
```bash
docker pull mcr.microsoft.com/mssql/server:2022-latest

docker run -e "ACCEPT_EULA=Y" \
  -e "MSSQL_SA_PASSWORD=YourStrong@Password123" \
  -p 1433:1433 \
  --name sql_server_2022 \
  -d mcr.microsoft.com/mssql/server:2022-latest
```

### Bước 2: Tạo Database

#### Option A: Using SSMS (Windows)
1. Mở SSMS, connect với:
   - Server: `localhost`
   - Authentication: `SQL Server Authentication`
   - Login: `sa`
   - Password: `YourStrong@Password123`

2. Open file `interviet_candidate_schema.sql`
3. Execute (F5)

#### Option B: Using sqlcmd (All platforms)
```bash
# Create database
sqlcmd -S localhost -U sa -P "YourStrong@Password123" -Q "CREATE DATABASE INTERVIET_DB"

# Run schema
sqlcmd -S localhost -U sa -P "YourStrong@Password123" -d INTERVIET_DB -i interviet_candidate_schema.sql

# Load test data
sqlcmd -S localhost -U sa -P "YourStrong@Password123" -d INTERVIET_DB -i test_data.sql
```

#### Option C: Using Azure Data Studio (Cross-platform)
1. Download: https://aka.ms/azuredatastudio
2. Connect to localhost
3. Open `.sql` files và execute

### Bước 3: Verify Database

```sql
USE INTERVIET_DB;
GO

-- Check tables
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

-- Check test data
SELECT u.FullName, u.Email, sp.PlanName, s.Status
FROM Users u
LEFT JOIN Subscriptions s ON u.UserId = s.UserId
LEFT JOIN SubscriptionPlans sp ON s.PlanId = sp.PlanId;

-- Check subscription plans
SELECT * FROM SubscriptionPlans ORDER BY DisplayOrder;
```

### Bước 4: Tạo Database User cho Applications

```sql
USE INTERVIET_DB;
GO

-- Create login
CREATE LOGIN interviet_app WITH PASSWORD = 'App@Password123';

-- Create user
CREATE USER interviet_app FOR LOGIN interviet_app;

-- Grant permissions
ALTER ROLE db_datareader ADD MEMBER interviet_app;
ALTER ROLE db_datawriter ADD MEMBER interviet_app;
GRANT EXECUTE TO interviet_app;

GO
```

---

## 2. C# Backend Setup

### Prerequisites
- **.NET 8 SDK**: https://dotnet.microsoft.com/download/dotnet/8.0
- **Visual Studio 2022** hoặc **VS Code** + C# extension
- **SQL Server** (đã setup ở trên)

### Bước 1: Tạo Project

```bash
# Tạo solution
dotnet new sln -n InterViet

# Tạo Web API project
dotnet new webapi -n InterViet.API
cd InterViet.API

# Add to solution
cd ..
dotnet sln add InterViet.API/InterViet.API.csproj
```

### Bước 2: Install NuGet Packages

```bash
cd InterViet.API

# Database
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Tools

# Authentication
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package BCrypt.Net-Next

# Validation
dotnet add package FluentValidation.AspNetCore

# Logging
dotnet add package Serilog.AspNetCore
dotnet add package Serilog.Sinks.Console
dotnet add package Serilog.Sinks.File

# HTTP Client
dotnet add package Microsoft.Extensions.Http.Polly

# File Storage (Azure Blob)
dotnet add package Azure.Storage.Blobs

# Payment Gateways
dotnet add package VnPayLibrary # (hoặc tự implement)

# API Documentation
dotnet add package Swashbuckle.AspNetCore
```

### Bước 3: appsettings.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=INTERVIET_DB;User Id=interviet_app;Password=App@Password123;TrustServerCertificate=True;MultipleActiveResultSets=true"
  },
  "JwtSettings": {
    "Secret": "your-secret-key-at-least-32-characters-long",
    "Issuer": "https://api.interviet.com",
    "Audience": "https://interviet.com",
    "ExpirationMinutes": 60,
    "RefreshTokenExpirationDays": 7
  },
  "PythonAI": {
    "BaseUrl": "http://localhost:8000/api/v1",
    "ServiceToken": "service-token-here"
  },
  "AzureBlobStorage": {
    "ConnectionString": "your-azure-connection-string",
    "ContainerName": "interviet-files"
  },
  "VNPay": {
    "TmnCode": "your-vnpay-tmn-code",
    "HashSecret": "your-vnpay-hash-secret",
    "Url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    "ReturnUrl": "https://interviet.com/payment/vnpay/callback"
  },
  "MoMo": {
    "PartnerCode": "your-momo-partner-code",
    "AccessKey": "your-momo-access-key",
    "SecretKey": "your-momo-secret-key",
    "Endpoint": "https://test-payment.momo.vn/v2/gateway/api/create",
    "ReturnUrl": "https://interviet.com/payment/momo/callback",
    "IpnUrl": "https://api.interviet.com/api/v1/payments/momo/ipn"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "Cors": {
    "AllowedOrigins": ["http://localhost:3000", "https://interviet.com"]
  }
}
```

### Bước 4: Database Context (Entity Framework)

**Models/User.cs:**
```csharp
public class User
{
    public Guid UserId { get; set; }
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public string UserStatus { get; set; } = "free";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime? EmailVerifiedAt { get; set; }
    public bool IsEmailVerified { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public CandidateProfile? Profile { get; set; }
    public ICollection<CV> CVs { get; set; } = new List<CV>();
    public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
}
```

**Data/ApplicationDbContext.cs:**
```csharp
using Microsoft.EntityFrameworkCore;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<CandidateProfile> CandidateProfiles { get; set; }
    public DbSet<Skill> Skills { get; set; }
    public DbSet<WorkExperience> WorkExperiences { get; set; }
    public DbSet<Education> Educations { get; set; }
    public DbSet<Certification> Certifications { get; set; }
    public DbSet<CV> CVs { get; set; }
    public DbSet<JobDescription> JobDescriptions { get; set; }
    public DbSet<CVJDMatching> CVJDMatchings { get; set; }
    public DbSet<InterviewSession> InterviewSessions { get; set; }
    public DbSet<SubscriptionPlan> SubscriptionPlans { get; set; }
    public DbSet<Subscription> Subscriptions { get; set; }
    public DbSet<Payment> Payments { get; set; }
    // ... more DbSets

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure entities
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.FullName).HasMaxLength(200);
        });

        // ... configure other entities

        // Seed subscription plans
        modelBuilder.Entity<SubscriptionPlan>().HasData(
            new SubscriptionPlan
            {
                PlanId = Guid.NewGuid(),
                PlanCode = "FREE",
                PlanName = "Gói Miễn phí",
                Price = 0,
                // ... other properties
            }
            // ... other plans
        );
    }
}
```

**Program.cs:**
```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

builder.Host.UseSerilog();

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = Encoding.UTF8.GetBytes(jwtSettings["Secret"]);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(secretKey)
        };
    });

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>())
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ICVService, CVService>();
// ... register other services

// HTTP Client for Python AI
builder.Services.AddHttpClient("PythonAI", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["PythonAI:BaseUrl"]);
    client.DefaultRequestHeaders.Add("Authorization", 
        $"Bearer {builder.Configuration["PythonAI:ServiceToken"]}");
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseSerilogRequestLogging();
app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

### Bước 5: Run C# API

```bash
cd InterViet.API

# Apply migrations (first time only)
dotnet ef migrations add InitialCreate
dotnet ef database update

# Run
dotnet run

# API sẽ chạy tại: http://localhost:5000
# Swagger UI: http://localhost:5000/swagger
```

---

## 3. Python AI Backend Setup

### Prerequisites
- **Python 3.11+**: https://www.python.org/downloads/
- **pip** và **venv**
- **SQL Server ODBC Driver**: https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server

### Bước 1: Tạo Project

```bash
mkdir interviet-ai
cd interviet-ai

# Create virtual environment
python -m venv venv

# Activate
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
```

### Bước 2: Install Dependencies

**requirements.txt:**
```txt
fastapi==0.110.0
uvicorn[standard]==0.29.0
pydantic==2.6.0
pydantic-settings==2.2.0

# Database
pyodbc==5.1.0
sqlalchemy==2.0.29

# Authentication
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9

# HTTP Client
httpx==0.27.0

# ML/AI
sentence-transformers==2.5.1
transformers==4.38.1
torch==2.2.1
scikit-learn==1.4.1
numpy==1.26.4
pandas==2.2.1

# NLP
spacy==3.7.4
# python -m spacy download en_core_web_sm
# python -m spacy download vi_core_news_lg

# PDF Processing
PyPDF2==3.0.1
pdfplumber==0.11.0

# Voice/Audio
openai-whisper==20231117
pydub==0.25.1

# Azure Blob Storage (for file access)
azure-storage-blob==12.19.1

# Logging
python-json-logger==2.0.7

# Testing
pytest==8.1.1
pytest-asyncio==0.23.5
```

```bash
pip install -r requirements.txt

# Download spaCy models
python -m spacy download en_core_web_sm
python -m spacy download vi_core_news_lg
```

### Bước 3: Project Structure

```
interviet-ai/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── cv.py
│   │   ├── jd.py
│   │   └── interview.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── cv_analyzer.py
│   │   ├── cv_jd_matcher.py
│   │   ├── interview_ai.py
│   │   └── voice_processor.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── cv.py
│   │   ├── matching.py
│   │   └── interview.py
│   └── utils/
│       ├── __init__.py
│       ├── auth.py
│       └── csharp_client.py
├── tests/
├── .env
├── requirements.txt
└── README.md
```

### Bước 4: Configuration

**.env:**
```env
# App
APP_NAME=InterViet AI
APP_VERSION=1.0.0
DEBUG=True

# Database
DB_SERVER=localhost
DB_NAME=INTERVIET_DB
DB_USER=interviet_app
DB_PASSWORD=App@Password123
DB_DRIVER=ODBC Driver 17 for SQL Server

# C# Backend API
CSHARP_API_URL=http://localhost:5000/api/v1
CSHARP_SERVICE_TOKEN=service-token-here

# JWT
JWT_SECRET=your-secret-key-at-least-32-characters-long
JWT_ALGORITHM=HS256

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=your-connection-string

# OpenAI (for Whisper, GPT)
OPENAI_API_KEY=your-openai-api-key

# Models
CV_ANALYSIS_MODEL=sentence-transformers/paraphrase-multilingual-mpnet-base-v2
MATCHING_MODEL=sentence-transformers/paraphrase-multilingual-mpnet-base-v2
```

**app/config.py:**
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str
    app_version: str
    debug: bool = False
    
    db_server: str
    db_name: str
    db_user: str
    db_password: str
    db_driver: str
    
    csharp_api_url: str
    csharp_service_token: str
    
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    
    azure_storage_connection_string: str
    openai_api_key: str
    
    cv_analysis_model: str
    matching_model: str
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### Bước 5: Database Connection

**app/database.py:**
```python
import pyodbc
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings

# PyODBC connection string
connection_string = (
    f"DRIVER={{{settings.db_driver}}};"
    f"SERVER={settings.db_server};"
    f"DATABASE={settings.db_name};"
    f"UID={settings.db_user};"
    f"PWD={settings.db_password}"
)

# SQLAlchemy engine
sqlalchemy_url = f"mssql+pyodbc:///?odbc_connect={connection_string}"
engine = create_engine(sqlalchemy_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Bước 6: Main Application

**app/main.py:**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import cv, matching, interview

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(cv.router, prefix="/api/v1/ai/cv", tags=["CV Analysis"])
app.include_router(matching.router, prefix="/api/v1/ai/matching", tags=["CV-JD Matching"])
app.include_router(interview.router, prefix="/api/v1/ai/interview", tags=["AI Interview"])

@app.get("/")
async def root():
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "status": "running"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

### Bước 7: CV Analysis Example

**app/api/cv.py:**
```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services.cv_analyzer import CVAnalyzer
from app.database import get_db

router = APIRouter()
cv_analyzer = CVAnalyzer()

class CVAnalysisRequest(BaseModel):
    cvId: str
    userId: str
    fileUrl: str

@router.post("/analyze")
async def analyze_cv(request: CVAnalysisRequest, db = Depends(get_db)):
    try:
        result = await cv_analyzer.analyze(
            cv_id=request.cvId,
            user_id=request.userId,
            file_url=request.fileUrl
        )
        
        # Update database via C# API
        await update_cv_analysis(request.cvId, result)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**app/services/cv_analyzer.py:**
```python
from sentence_transformers import SentenceTransformer
import PyPDF2
import httpx

class CVAnalyzer:
    def __init__(self):
        self.model = SentenceTransformer('paraphrase-multilingual-mpnet-base-v2')
    
    async def analyze(self, cv_id: str, user_id: str, file_url: str):
        # Download PDF
        text = await self.extract_text_from_pdf(file_url)
        
        # Extract skills, experiences, etc.
        extracted_data = self.extract_data(text)
        
        # Analyze strengths/weaknesses
        analysis = self.analyze_content(extracted_data)
        
        return {
            "cvId": cv_id,
            "analysisScore": analysis["score"],
            "analysisData": {
                "strengths": analysis["strengths"],
                "weaknesses": analysis["weaknesses"],
                "suggestions": analysis["suggestions"],
                "extractedData": extracted_data
            }
        }
    
    async def extract_text_from_pdf(self, file_url: str) -> str:
        # Download and extract text
        async with httpx.AsyncClient() as client:
            response = await client.get(file_url)
            # Use PyPDF2 or pdfplumber
            pass
    
    def extract_data(self, text: str):
        # Use NLP to extract skills, experiences, etc.
        pass
    
    def analyze_content(self, data):
        # Analyze and score
        pass
```

### Bước 8: Run Python AI

```bash
# Development
uvicorn app.main:app --reload --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# API sẽ chạy tại: http://localhost:8000
# Docs: http://localhost:8000/docs
```

---

## 4. Frontend Setup (Reference)

```bash
# Tạo React app với Vite
npm create vite@latest interviet-web -- --template react-ts
cd interviet-web
npm install

# Install dependencies
npm install react-router-dom axios
npm install @tanstack/react-query
npm install zustand # state management
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Run
npm run dev
```

---

## 5. Testing End-to-End

### Test Flow: User Registration → CV Upload → CV Analysis

1. **Start all services:**
```bash
# Terminal 1: SQL Server (if Docker)
docker start sql_server_2022

# Terminal 2: C# API
cd InterViet.API
dotnet run

# Terminal 3: Python AI
cd interviet-ai
uvicorn app.main:app --reload

# Terminal 4: Frontend (optional)
cd interviet-web
npm run dev
```

2. **Test with curl/Postman:**

**Register user:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "fullName": "Test User"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

**Upload CV:**
```bash
curl -X POST http://localhost:5000/api/v1/cvs/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "cvName=My CV" \
  -F "file=@/path/to/cv.pdf"
```

**Check CV Analysis (should be triggered automatically):**
```bash
curl http://localhost:5000/api/v1/cvs/{cvId} \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 6. Deployment (Production)

### Database:
- **Azure SQL Database** hoặc **AWS RDS for SQL Server**

### C# Backend:
- **Azure App Service** hoặc **AWS Elastic Beanstalk**
- Hoặc containerize với Docker + **Azure Container Apps** / **AWS ECS**

### Python AI:
- **Azure Container Instances** hoặc **AWS Lambda** (với container)
- Hoặc **Google Cloud Run**

### Frontend:
- **Vercel** hoặc **Netlify** hoặc **Azure Static Web Apps**

### File Storage:
- **Azure Blob Storage** hoặc **AWS S3**

---

## 7. Monitoring & Logging

### C# API:
- **Application Insights** (Azure)
- **Serilog** → File/Console/Seq

### Python AI:
- **Python logging** → CloudWatch (AWS) / Azure Monitor
- **Prometheus** + **Grafana** for metrics

---

## Troubleshooting

### SQL Server connection issues:
```bash
# Test connection
sqlcmd -S localhost -U sa -P "YourPassword" -Q "SELECT @@VERSION"

# Check if SQL Server is running
docker ps # if using Docker
```

### C# API CORS errors:
- Check `appsettings.json` → `Cors:AllowedOrigins`
- Make sure frontend URL is included

### Python AI model loading slow:
- First time loading SentenceTransformers models can take time
- Models are cached after first load

---

**Ready to start!** 🚀

Liên hệ team lead nếu gặp vấn đề.
