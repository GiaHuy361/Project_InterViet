# FRONTEND HANDOFF DRAFT — INTER-VIET Backend API

> **Status:** Backend Phase 8C complete. Ready for frontend integration.
> **Base URL (local):** `http://localhost:5000/api/v1`
> **Auth:** Bearer JWT (`Authorization: Bearer <accessToken>`)

---

## Auth Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/register` | ❌ | `{ fullName, email, password }` → 201 |
| POST | `/auth/login` | ❌ | `{ email, password, deviceName? }` → `{ accessToken, refreshToken }` |
| POST | `/auth/refresh` | ❌ | `{ refreshToken }` → new tokens |
| POST | `/auth/logout` | ❌ | `{ refreshToken }` → 204 |
| POST | `/auth/google-login` | ❌ | `{ idToken, deviceName? }` |
| POST | `/auth/forgot-password` | ❌ | Always 200 (anti-enumeration) |
| POST | `/auth/reset-password` | ❌ | `{ token, newPassword }` |
| POST | `/auth/verify-email` | ❌ | `{ token }` |
| GET  | `/auth/sessions` | ✅ | Active device sessions |
| DELETE | `/auth/sessions/{id}` | ✅ | Revoke session |

---

## Profile Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET  | `/profile/me` | ✅ | Full profile |
| PUT  | `/profile/me` | ✅ | Update name/phone/bio/etc |
| POST | `/profile/me/avatar` | ✅ | multipart/form-data |

---

## Resume Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST   | `/resumes` | ✅ | multipart/form-data, `{ file, title? }` |
| GET    | `/resumes` | ✅ | `?page&pageSize&status&isActive` |
| GET    | `/resumes/active` | ✅ | Active resume |
| GET    | `/resumes/{id}` | ✅ | Detail + parse metadata |
| PATCH  | `/resumes/{id}/active` | ✅ | Set as active |
| DELETE | `/resumes/{id}` | ✅ | Soft delete |
| POST   | `/resumes/{id}/reprocess` | ✅ | Re-run CV parsing |
| GET    | `/resumes/{id}/processing-jobs` | ✅ | Parse job history |
| GET    | `/resumes/{id}/download` | ✅ | Download file |

---

## Job Description Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST   | `/job-descriptions` | ✅ | `{ title, company, rawText, ... }` |
| GET    | `/job-descriptions` | ✅ | `?page&pageSize` |
| GET    | `/job-descriptions/{id}` | ✅ | Detail |
| PUT    | `/job-descriptions/{id}` | ✅ | Update |
| DELETE | `/job-descriptions/{id}` | ✅ | Delete |

---

## Matching Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/match/single` | ✅ | `{ resumeId, jdId }` |
| POST | `/match/multi` | ✅ | `{ resumeId, jdIds: [...] }` — async background |
| GET  | `/match/sessions` | ✅ | Match history |
| GET  | `/match/sessions/{id}` | ✅ | Detail with scores |

---

## Subscription & Plans

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET  | `/plans` | ❌ | Available plans |
| GET  | `/subscription/current` | ✅ | Current user subscription |
| POST | `/subscription/dev-activate` | ✅ | Dev-only: activate plan |
| GET  | `/billing/invoices` | ✅ | Invoice history |
| GET  | `/billing/payments` | ✅ | Payment history |

---

## AI Interview — Text Flow

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/interviews/check-quota` | ✅ | Check remaining quota (no consume) |
| POST | `/interviews` | ✅ | Create session `{ position, level, goal, duration, aiModel, interviewerMode }` |
| POST | `/interviews/{id}/start` | ✅ | Start → returns first AI question |
| POST | `/interviews/{id}/messages` | ✅ | Submit answer → get next question |
| POST | `/interviews/{id}/complete` | ✅ | Analyze → returns typed report |
| GET  | `/interviews` | ✅ | `?page&pageSize` |
| GET  | `/interviews/{id}` | ✅ | Detail with questions/answers/report |
| GET  | `/interviews/stats` | ✅ | Usage statistics |
| DELETE | `/interviews/{id}` | ✅ | Cancel session |

### Interview Session Status Flow
```
Draft → Live (on /start) → Processing (on /complete) → Completed
                         ↘ Cancelled / Failed
```

---

## AI Interview — Realtime Voice Flow

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/interviews/{id}/realtime/start` | ✅ | Start voice session — returns `clientSecret` (one-time) |
| POST | `/interviews/{id}/realtime/end` | ✅ | End voice call (idempotent) |
| POST | `/interviews/{id}/realtime/finalize` | ✅ | Submit transcript/Q&A → enables /complete |
| GET  | `/interviews/{id}/realtime` | ✅ | Session status + events |
| POST | `/interviews/{id}/complete` | ✅ | Run AI analysis after finalize |

### Realtime Flow
```
1. POST /interviews               → create session (get {id})
2. POST /interviews/{id}/realtime/start
   → { connectUrl, clientSecret, instructions, provider, expiresAt }
3. Frontend connects to provider WebRTC/WebSocket using clientSecret
4. [Voice call happens client-side]
5. POST /interviews/{id}/realtime/end
6. POST /interviews/{id}/realtime/finalize
   Body: { realtimeSessionId, qaPairs: [...], transcriptText }
7. POST /interviews/{id}/complete
   → { report: { overallScore, strengths[], weaknesses[], recommendations[], scoreBreakdowns[], feedbackItems[] } }
```

### Realtime Start Response
```json
{
  "sessionId": "...",
  "realtimeSessionId": "...",
  "status": "active",
  "provider": "openai",
  "model": "gpt-realtime",
  "providerSessionId": "...",
  "connectUrl": "...",
  "clientSecret": "...",      ← use ONCE, do not store
  "instructions": "...",      ← AI system prompt (display optional)
  "expiresAt": "...",
  "startedAt": "...",
  "isIdempotent": false
}
```

### Finalize Request Body
```json
{
  "realtimeSessionId": "...",
  "transcriptText": "Assistant: ...\nUser: ...",
  "qaPairs": [
    {
      "questionNumber": 1,
      "questionText": "Bạn hãy giới thiệu bản thân.",
      "answerText": "Tôi là backend developer...",
      "questionType": "opening",
      "difficulty": "easy",
      "askedAt": "2026-05-16T10:00:00Z",
      "answeredAt": "2026-05-16T10:01:00Z"
    }
  ],
  "modelVersion": "gpt-realtime",
  "schemaVersion": "interview-realtime-v1"
}
```

---

## Report Response Schema (after /complete)

```json
{
  "overallScore": 85.5,
  "confidenceScore": 80.0,
  "clarityScore": 88.0,
  "relevanceScore": 90.0,
  "strengths": [
    { "title": "...", "description": "..." }
  ],
  "weaknesses": [
    { "title": "...", "description": "..." }
  ],
  "recommendations": [
    { "priority": "high", "action": "...", "reason": "..." }
  ],
  "scoreBreakdowns": [
    { "category": "...", "score": 85, "maxScore": 100, "comment": "..." }
  ],
  "feedbackItems": [
    { "type": "positive", "questionNumber": 1, "feedback": "..." }
  ]
}
```

---

## Standard Response Envelope

All success responses follow:
```json
{
  "success": true,
  "message": null,
  "data": { ... },
  "meta": {
    "requestId": "...",
    "timestamp": "2026-05-16T..."
  }
}
```

All error responses follow:
```json
{
  "type": "https://api.interviet.vn/errors/interview-realtimenotfinalized",
  "title": "Interview.RealtimeNotFinalized",
  "detail": "Human-readable message",
  "code": "Interview.RealtimeNotFinalized"
}
```

---

## HTTP Status Code Map

| HTTP | When |
|---|---|
| 200 | Success |
| 201 | Created (register, upload CV) |
| 204 | No content (logout, delete, set-active) |
| 400 | Validation error, bad input |
| 401 | Missing/invalid JWT or API key |
| 403 | Wrong user (ownership violation) |
| 404 | Resource not found |
| 409 | State conflict (duplicate, wrong status) |
| 429 | Rate limit / quota exceeded |
| 503 | AI service disabled or unreachable |
| 500 | Unexpected server error |

---

## Dashboard / Utility

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/dashboard/summary` | ✅ | Overview stats |
| GET | `/dashboard/activity` | ✅ | Recent activity log |
| GET | `/dashboard/usage` | ✅ | Feature usage stats |
| GET | `/dashboard/quota` | ✅ | Current quota status |
| GET | `/health` | ❌ | Health check |

---

## Notes for Frontend Team

1. **JWT expiry**: Access token = 30 min, refresh = 30 days. Call `/auth/refresh` automatically.
2. **clientSecret**: Use exactly once for WebRTC connection. Never cache or store. Valid for `InterviewRealtimeTokenTtlSeconds` seconds (default 600).
3. **Realtime idempotency**: `POST /realtime/start` called twice returns `isIdempotent: true` and no `clientSecret` on second call — reconnect logic must request a new start if token expired.
4. **Quota**: `interview.ai` feature key is checked on session create. Check with `/interviews/check-quota` before showing the interview UI.
5. **File upload**: `POST /resumes` is `multipart/form-data`, not JSON.
6. **Internal endpoints** (`/api/v1/internal/...`) are Python→C# only — never call from browser.
