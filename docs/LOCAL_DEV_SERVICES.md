# LOCAL DEV SERVICES — INTER-VIET

## Service URLs

| Service | URL | Swagger / Docs |
|---|---|---|
| C# API | http://localhost:5000 | http://localhost:5000/swagger |
| Python CV Service | http://localhost:8001 | http://localhost:8001/docs |
| Python Interview Service | http://localhost:8002 | http://localhost:8002/docs |

---

## appsettings.Development.json — Key Config

> ⚠️ **This file is in `.gitignore` and must NOT be committed.** Create it locally from the template below.

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=...;Database=IntervietCore;..."
  },
  "Jwt": {
    "Issuer": "Interviet",
    "Audience": "Interviet.Client",
    "SigningKey": "<your-local-secret>",
    "AccessTokenMinutes": 30,
    "RefreshTokenDays": 30
  },
  "AiServices": {
    "CvServiceEnabled": true,
    "MatchingEnabled": true,
    "InterviewEnabled": true,
    "InterviewRealtimeEnabled": true,
    "CvServiceBaseUrl": "http://localhost:8001",
    "InterviewBaseUrl": "http://localhost:8002",
    "InterviewRealtimeBaseUrl": "http://localhost:8002",
    "InterviewRealtimeTokenTtlSeconds": 600,
    "ApiKey": "dev-secret-key",
    "TimeoutSeconds": 60
  }
}
```

---

## AiServices Config Keys Reference

| Key | Default (prod) | Purpose |
|---|---|---|
| `AiServices:CvServiceEnabled` | `false` | Enable CV parse/reprocess via Python 8001 |
| `AiServices:MatchingEnabled` | `false` | Enable JD matching via Python 8001 |
| `AiServices:InterviewEnabled` | `false` | Enable AI text interview via Python 8002 |
| `AiServices:InterviewRealtimeEnabled` | `false` | Enable realtime voice interview via Python 8002 |
| `AiServices:CvServiceBaseUrl` | `http://localhost:8001` | Python CV service base URL |
| `AiServices:InterviewBaseUrl` | `http://localhost:8002` | Python Interview service base URL |
| `AiServices:InterviewRealtimeBaseUrl` | _(InterviewBaseUrl fallback)_ | Realtime broker URL (defaults to InterviewBaseUrl) |
| `AiServices:InterviewRealtimeTokenTtlSeconds` | `600` | Ephemeral token TTL in seconds |
| `AiServices:ApiKey` | _(required)_ | Shared secret for internal Python→C# callbacks |
| `AiServices:TimeoutSeconds` | `60` | HTTP client timeout for AI calls |

> Production: all `*Enabled` keys default to `false`. Enable explicitly in each environment config.

---

## Starting Services Locally

```powershell
# Terminal 1: C# API
cd src/Interviet.Api
dotnet run

# Terminal 2: Python CV Service (port 8001)
cd python/cv_service
uvicorn main:app --port 8001 --reload

# Terminal 3: Python Interview Service (port 8002)
cd python/interview_service
uvicorn main:app --port 8002 --reload
```

---

## Migration

```powershell
# Apply pending migrations
dotnet ef database update --project src/Interviet.Infrastructure --startup-project src/Interviet.Api

# Add new migration
dotnet ef migrations add <Name> --project src/Interviet.Infrastructure --startup-project src/Interviet.Api
```

---

## Internal Callback Security

Internal endpoints (`/api/v1/internal/...`) are secured by `X-Interviet-Api-Key` header, NOT JWT.

**Python service must send:**
```
X-Interviet-Api-Key: <value of AiServices:ApiKey>
```

Missing or wrong key → `401 Unauthorized`.

---

## Security Notes

- `appsettings.Development.json` → **gitignored** (contains DB password, JWT key)
- `clientSecret` from realtime provider → **never logged, never stored raw** (SHA256 hash only)
- Provider API keys → **only in Python service env vars**, never flow through C#
- User data isolation → all queries filter by `UserId` from JWT claims
