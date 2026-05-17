# FIGMA MAKE — INTER-VIET FRONTEND INTEGRATION PROMPT

## Project Overview

Build the **candidate-only** frontend for **INTER-VIET**, an AI-powered career platform.

**INTER-VIET helps candidates:**
- Upload and manage their CV/Resume
- Create and manage Job Descriptions they want to apply to
- Run AI-powered CV ↔ JD matching (single and multi-JD)
- Practice AI Text Interviews
- Practice AI Realtime Voice Interviews
- View detailed AI analysis reports

> ⚠️ **CRITICAL: This is CANDIDATE-ONLY.** There is NO employer portal, NO recruiter dashboard, NO mentor booking, NO employer login. Do NOT create any employer/recruiter routes, pages, or components. The cleanup has already been done on the backend.

---

## A. Local Development Setup

| Service | URL |
|---|---|
| **C# API (backend)** | `http://localhost:5000` |
| **Swagger UI** | `http://localhost:5000/swagger` |
| Python CV Service | `http://localhost:8001` (internal only) |
| Python Interview Service | `http://localhost:8002` (internal only) |

> **Frontend ONLY calls the C# API.** Never call Python services directly. Python is an internal dependency of the C# API.
>
> **Exception:** After `POST /interviews/{id}/realtime/start` returns a `connectUrl` and `clientSecret`, the frontend uses those to connect to the **provider** (OpenAI WebRTC/SDP). This is the ONLY direct non-C# call.

---

## B. Environment Variables

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

---

## C. API Client Layer

Create a shared API service layer with:

### Base Client
- Base URL from `VITE_API_BASE_URL`
- Default headers: `Content-Type: application/json`, `Accept: application/json`
- Attach `Authorization: Bearer <accessToken>` to every authenticated request
- On `401` response: attempt token refresh once, then redirect to login
- On `429`: show "Too many requests, please wait" toast
- On `503`: show "AI service temporarily unavailable" toast

### Response Envelope (all C# responses)
```typescript
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta: { requestId: string; timestamp: string; };
}
```

### Error Shape
```typescript
interface ApiError {
  type: string;       // URL reference
  title: string;      // error code e.g. "Interview.RealtimeNotFinalized"
  detail: string;     // human-readable message
  code: string;       // same as title
}
```

### HTTP Status Handling
| Status | Action |
|---|---|
| 400 | Show validation message from `detail` |
| 401 | Refresh token or redirect to login |
| 403 | Show "Access denied" or quota exceeded message |
| 404 | Show "Not found" state |
| 409 | Show conflict message from `detail` |
| 429 | Show rate limit toast |
| 503 | Show "AI service unavailable" banner |
| 500 | Show generic error, log to console |

### Token Storage
Store `accessToken` and `refreshToken` in memory or `httpOnly` cookies (never `localStorage` for refresh token if security is a concern). Implement auto-refresh using `/auth/refresh` before expiry.

---

## D. Auth Flow

**Base path:** `/api/v1/auth`

### Endpoints

```
POST /auth/register
Body: { fullName: string, email: string, password: string }
Response 201: { accessToken, refreshToken, user: { id, email, fullName } }

POST /auth/login
Body: { email: string, password: string, deviceName?: string }
Response 200: { accessToken, refreshToken, user: { id, email, fullName } }

POST /auth/refresh
Body: { refreshToken: string }
Response 200: { accessToken, refreshToken }

POST /auth/logout
Body: { refreshToken: string }
Response 204: (no body)

POST /auth/google-login
Body: { idToken: string, deviceName?: string }
Response 200: { accessToken, refreshToken, user }

POST /auth/forgot-password
Body: { email: string }
Response 200: always (anti-enumeration)

POST /auth/reset-password
Body: { token: string, newPassword: string }
Response 204

POST /auth/verify-email
Body: { token: string }
Response 204

GET /auth/sessions              (requires JWT)
Response 200: { data: SessionDto[] }

DELETE /auth/sessions/{id}      (requires JWT)
Response 204
```

### UI Requirements
- Candidate-only login. No "employer login" link.
- Route guard: redirect unauthenticated users to `/login`
- Protected routes: `/dashboard`, `/resumes`, `/job-descriptions`, `/matches`, `/interviews`, `/profile`, `/subscription`
- After login → redirect to `/dashboard`
- Logout clears tokens and redirects to `/login`

---

## E. Dashboard

**Base path:** `/api/v1/dashboard`

```
GET /dashboard/summary          → overall stats (resumes, matches, interviews, score)
GET /dashboard/activity         → ?page&pageSize — recent activity timeline
GET /dashboard/usage            → ?from&to (YYYY-MM-DD) — daily usage breakdown
GET /dashboard/quota            → current quota counters per feature
```

Display on dashboard:
- Quota remaining for `interview.ai`
- Recent interviews with scores
- Recent match sessions
- Quick action buttons: "Upload CV", "New Interview", "New Match"

---

## F. Profile

**Base path:** `/api/v1/profile`

```
GET  /profile                   → full profile
PATCH /profile                  → update basic info
Body: {
  fullName?, phoneNumber?, headline?, summary?,
  desiredRole?, yearsOfExperience?, currentLocation?,
  preferredLocation?, salaryExpectationMin?, salaryExpectationMax?
}

POST   /profile/skills          → { skillName, proficiencyLevel?, yearsUsed?, lastUsedYear? }
PUT    /profile/skills/{id}     → { proficiencyLevel?, yearsUsed?, lastUsedYear? }
DELETE /profile/skills/{id}

POST   /profile/educations      → { schoolName, degree?, fieldOfStudy?, startDate?, endDate?, grade?, description? }
PUT    /profile/educations/{id}
DELETE /profile/educations/{id}

POST   /profile/experiences     → { companyName, jobTitle, employmentType?, startDate, endDate?, isCurrent, description?, metricsSummary? }
PUT    /profile/experiences/{id}
DELETE /profile/experiences/{id}

POST   /profile/links           → { linkType, title?, url }
PUT    /profile/links/{id}
DELETE /profile/links/{id}
```

---

## G. Resume / CV Flow

**Base path:** `/api/v1/resumes`

```
POST   /resumes                         → multipart/form-data { file, title? }
GET    /resumes                         → ?page&pageSize&status&isActive
GET    /resumes/active                  → active resume
GET    /resumes/{resumeId}              → detail + parse metadata
PATCH  /resumes/{resumeId}/active       → set as active
DELETE /resumes/{resumeId}
POST   /resumes/{resumeId}/reprocess    → re-trigger CV parsing
GET    /resumes/{resumeId}/processing-jobs
GET    /resumes/{resumeId}/download     → file stream
```

### Upload Form
- `Content-Type: multipart/form-data`
- Field name: `file` (IFormFile)
- Optional field: `title` (string)
- Frontend validation: `.pdf`, `.doc`, `.docx`, `.jpg`, `.png` — max 10MB
- Backend is source of truth for validation

### Resume Status Values
```
queued | processing | parsed | failed | service_unavailable
```

Show clear status badge for each. If `service_unavailable`, show: "CV parsing service is temporarily unavailable. Try reprocessing later."

### States Required
- Loading skeleton while fetching
- Empty state: "Upload your first CV to get started"
- Error state with retry button

---

## H. Job Description Flow

**Base path:** `/api/v1/job-descriptions`

```
POST   /job-descriptions
Body: {
  title?: string,
  companyName?: string,
  location?: string,
  salaryText?: string,
  sourceUrl?: string,
  rawText: string,      ← REQUIRED for matching
  postedAt?: "YYYY-MM-DD"
}
Response 201: JobDescriptionResponse

GET    /job-descriptions            → ?page&pageSize
GET    /job-descriptions/{id}
PUT    /job-descriptions/{id}       → same body as create (all optional)
DELETE /job-descriptions/{id}       → 204
```

### JobDescriptionResponse Shape
```typescript
{
  id: string;
  userId: string;
  title?: string;
  companyName?: string;
  location?: string;
  salaryText?: string;
  sourceUrl?: string;
  rawText: string;
  postedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## I. Matching Flow

**Base path:** `/api/v1/matches`

```
POST /matches
Body: { resumeId: string, jobDescriptionId: string }
Response 202: { sessionId, resumeId, jobDescriptionId, status: "pending", requestedAt }

POST /matches/multi
Body: { resumeId: string, jobDescriptionIds: string[], title?: string }
Response 202: { sessionId, resumeId, status: "pending", targetCount, requestedAt }

GET  /matches               → ?page&pageSize
GET  /matches/{sessionId}
```

### Match Session Statuses
```
pending | processing | completed | failed | partial
```

### Single Match Result (MatchResultResponse)
```typescript
{
  id: string;
  totalScore: number;
  technicalScore?: number;
  experienceScore?: number;
  educationScore?: number;
  languageScore?: number;
  matchBand?: string;               // "excellent" | "good" | "fair" | "poor"
  summaryText?: string;
  matchedSkillsJson?: string;       // JSON array — parse before rendering
  missingSkillsJson?: string;       // JSON array — parse before rendering
  strengthsJson?: string;           // JSON array
  weaknessesJson?: string;          // JSON array
  suggestionsJson?: string;         // JSON array
}
```

> ⚠️ Fields ending in `Json` are JSON strings from the backend. Parse them into arrays before rendering. Do not display raw JSON strings to users.

### Multi Match (MatchTargetResponse array)
```typescript
{
  targetId: string;
  jobDescriptionId: string;
  jobTitle?: string;
  companyName?: string;
  status: string;
  totalScore?: number;
  technicalScore?: number;
  experienceScore?: number;
  educationScore?: number;
  languageScore?: number;
  summaryText?: string;
  matchedSkillsJson?: string;
  missingSkillsJson?: string;
  completedAt?: string;
  errorCode?: string;
}
```

### UI Requirements
- Poll `GET /matches/{sessionId}` every 3–5 seconds while status is `pending|processing`
- Stop polling when `completed|failed|partial`
- Do NOT calculate scores client-side
- Handle `503` → "Matching service temporarily unavailable"
- Handle quota exceeded `403` → "Daily matching limit reached. Upgrade your plan."

---

## J. Subscription & Plans

**Base paths:** `/api/v1/plans`, `/api/v1/subscription`

```
GET  /plans                         → public, no auth needed
GET  /subscription                  → current user subscription (requires JWT)
POST /subscription/dev-activate     → dev/testing only
Body: { planKey: string }           → planKey: "free" | "monthly" | "quarterly" | "yearly"
POST /subscription/cancel
```

### Interview Quota by Plan
| Plan | interview.ai per day |
|---|---|
| free | 1 |
| monthly | 1 |
| quarterly | 3 |
| yearly | unlimited |

> Do NOT build a real payment gateway in this phase. Use `dev-activate` for local testing. Show a "Upgrade Plan" CTA that links to a pricing page (can be static for now).

---

## K. AI Interview — Text Flow

**Base path:** `/api/v1/interviews`

### Step-by-step API Call Order
```
1. POST /interviews/check-quota         → check before showing UI
2. POST /interviews                     → create session
3. POST /interviews/{id}/start          → get first question
4. POST /interviews/{id}/messages       → submit answer, get next question
   (repeat until hasNextQuestion = false)
5. POST /interviews/{id}/complete       → trigger AI analysis
6. GET  /interviews/{id}                → get full report
```

### Create Session Request
```json
{
  "position": "Backend Developer",
  "level": "mid",
  "interviewType": "technical",
  "goal": "Practice system design",
  "durationMinutes": 30,
  "mode": "text",
  "interviewerMode": "professional",
  "aiModel": "gpt-4o-mini"
}
```

**Valid `level` values:** `junior | mid | senior | lead | manager`
**Valid `interviewType` values:** `technical | behavioral | general | case_study`
**Valid `mode` values:** `text | voice | hybrid`
**Valid `interviewerMode` values:** `professional | friendly | strict`
**Valid `aiModel` values:** `gpt-4o-mini | gpt-4o | gemini-3-flash-preview | standard | basic | advanced | free | monthly | quarterly | yearly`

### Submit Message Request
```json
{
  "questionId": "optional-guid",
  "answerText": "My answer here...",
  "audioFileUrl": null,
  "audioDurationSeconds": null
}
```

### StartInterviewResponse
```typescript
{
  sessionId: string;
  status: string;
  startedAt: string;
  firstQuestion: InterviewQuestionResponse;
}
```

### SubmitInterviewMessageResponse
```typescript
{
  sessionId: string;
  answerId: string;
  status: string;
  hasNextQuestion: boolean;
  nextQuestion?: InterviewQuestionResponse;  // null when done
}
```

### InterviewQuestionResponse
```typescript
{
  questionId: string;
  questionNumber: number;
  questionType: string;
  questionText: string;
  difficulty?: string;
  expectedAnswerPoints: string[];   // typed array, may be empty
  askedAt?: string;
  hasAnswer: boolean;
  answer?: InterviewAnswerResponse;
}
```

### CompleteInterviewResponse
```typescript
{
  sessionId: string;
  status: string;
  completedAt?: string;
  report?: InterviewReportResponse;
  message?: string;
}
```

### InterviewReportResponse
```typescript
{
  overallScore?: number;
  confidenceScore?: number;
  clarityScore?: number;
  relevanceScore?: number;
  paceScore?: number;
  strengths: string[];          // typed array — render as list
  weaknesses: string[];         // typed array — render as list
  recommendations: string[];    // typed array — render as list
  scoreBreakdowns: object[];    // typed array of objects
  feedbackItems: object[];      // typed array of objects
  modelVersion?: string;
  schemaVersion?: string;
}
```

> ⚠️ All arrays are already typed. Do NOT parse JSON strings manually. Render directly.

### Session Status Values
```
Draft → Live → Processing → Completed
              ↘ Cancelled / Failed / Abandoned
```

### Other Interview Endpoints
```
GET    /interviews              → ?page&pageSize (default pageSize=20)
GET    /interviews/stats        → totals, averages, recent sessions
GET    /interviews/{id}         → full detail with questions/answers/report
DELETE /interviews/{id}         → cancel/delete session
```

### InterviewStatsResponse
```typescript
{
  totalSessions: number;
  completedSessions: number;
  averageScore?: number;
  bestScore?: number;
  totalMinutes: number;
  recentSessions: InterviewSessionListItemResponse[];
}
```

---

## L. AI Interview — Realtime Voice Flow

### Step-by-step API Call Order
```
1. POST /interviews                         → create session (mode: "voice")
2. POST /interviews/{id}/realtime/start     → get provider credentials
3. [Frontend connects to provider via connectUrl + clientSecret]
4. [Voice call happens client-side]
5. POST /interviews/{id}/realtime/end       → mark ended
6. POST /interviews/{id}/realtime/finalize  → submit transcript + Q/A
7. POST /interviews/{id}/complete           → run AI analysis
8. GET  /interviews/{id}                    → view report
```

### realtime/start Request
```json
{
  "mode": "voice",
  "aiModel": "gpt-4o-mini",
  "voice": "alloy",
  "language": "vi",
  "enableTranscript": true
}
```

### realtime/start Response (StartInterviewRealtimeResponse)
```typescript
{
  sessionId: string;
  realtimeSessionId: string;
  status: string;               // "active"
  provider?: string;            // "openai" | "gemini"
  model?: string;
  providerSessionId?: string;
  connectUrl?: string;          // URL to connect to provider
  clientSecret?: string;        // ⚠️ ONE-TIME USE — never log, never store
  instructions?: string;        // AI system prompt — optional display
  expiresAt?: string;
  startedAt?: string;
  isIdempotent: boolean;        // true = second call, no new clientSecret
}
```

> ⚠️ `clientSecret` is returned **once only**. Store in memory for the session duration. Never log it. Never persist to localStorage or DB. When `isIdempotent=true`, no new `clientSecret` is returned — request a fresh start if expired.

### Provider Connection Logic
```
if (provider === "openai") {
  // Use WebRTC + SDP negotiation via connectUrl
  // Send clientSecret as Bearer token to connectUrl
}
if (provider === "gemini") {
  // Use WebSocket to connectUrl
  // Send clientSecret as auth header
}
```

### realtime/end Request
```json
{
  "realtimeSessionId": "guid",
  "reason": "user_ended"    // user_ended | timeout | error | system
}
```

### realtime/finalize Request
```json
{
  "realtimeSessionId": "guid",
  "transcriptText": "Assistant: Xin chào...\nUser: Tôi là...",
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

### realtime/finalize Response (PublicFinalizeRealtimeResponse)
```typescript
{
  sessionId: string;
  realtimeSessionId: string;
  status: string;               // "finalized"
  savedQuestionCount: number;
  savedAnswerCount: number;
  canComplete: boolean;         // true = safe to call /complete
  isIdempotent: boolean;
  message?: string;
}
```

### GET realtime Response
```typescript
{
  sessionId: string;
  activeRealtimeSession?: {
    realtimeSessionId: string;
    status: string;
    provider?: string;
    model?: string;
    connectUrl?: string;
    expiresAt?: string;
    startedAt?: string;
    endedAt?: string;
    errorCode?: string;
    createdAt: string;
  };
  events: RealtimeEvent[];
  totalEvents: number;
}
```

### UI State Machine for Voice Interview Screen
```
Ready → Connecting → Connected → Listening ⇄ Speaking → Ended → Finalizing → Completed
                                                                            ↘ Error
```

States:
- **Ready**: Show "Start Voice Interview" button
- **Connecting**: Spinner, "Connecting to AI interviewer..."
- **Connected**: Show live waveform, AI is speaking first question
- **Listening**: User is speaking — show mic indicator
- **Speaking**: AI is responding — show audio waveform
- **Ended**: Call ended — show "Submitting transcript..." button or auto-submit
- **Finalizing**: Calling `/realtime/finalize`
- **Completed**: `canComplete=true` — show "Analyze My Interview" button
- **Error**: Show error message with retry option

> If realtime client is not yet fully integrated, still build the UI flow and wire all API calls correctly. Mark the WebRTC/WebSocket connection step as "Realtime Client Integration Pending" but keep all other API calls functional.

---

## M. Interview History & Report

```
GET /interviews             → paginated list
GET /interviews/stats       → aggregated stats
GET /interviews/{id}        → full session detail
```

### InterviewSessionListItemResponse
```typescript
{
  sessionId: string;
  status: string;
  position: string;
  level: string;
  interviewType: string;
  mode: string;
  aiModel?: string;
  durationMinutes: number;
  questionCount: number;
  answeredCount: number;
  overallScore?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}
```

### InterviewSessionDetailResponse (full)
```typescript
{
  sessionId: string;
  status: string;
  position: string;
  level: string;
  interviewType: string;
  goal?: string;
  durationMinutes: number;
  mode: string;
  interviewerMode?: string;
  aiModel?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  totalExpectedQuestions: number;
  answeredCount: number;
  questions: InterviewQuestionResponse[];
  report?: InterviewReportResponse;
}
```

Render report with:
- Score gauges: `overallScore`, `confidenceScore`, `clarityScore`, `relevanceScore`, `paceScore`
- Strengths list (string[])
- Weaknesses list (string[])
- Recommendations list (string[])
- Score breakdown cards (scoreBreakdowns array)
- Per-question feedback (feedbackItems array)

---

## N. Error / Loading / Empty States

**Every screen must have:**

| State | Requirement |
|---|---|
| Loading | Skeleton or spinner |
| Empty | Friendly empty state with action CTA |
| Error | Error message + retry button |
| Partial error | Show what loaded, flag what failed |

**User-friendly error messages:**

| Error Code | Message to show |
|---|---|
| `Interview.RealtimeNotFinalized` | "Please end and finalize your voice interview before running analysis." |
| `Interview.AlreadyCompleted` | "This interview has already been completed." |
| `Interview.NoAnswers` | "Please answer at least one question before completing." |
| `Quota.Exceeded` | "You've reached your daily interview limit. Upgrade your plan for more." |
| `Interview.ServiceUnavailable` | "AI service is temporarily unavailable. Please try again later." |
| `Interview.RateLimitExceeded` | "Too many requests. Please wait a moment and try again." |
| `Interview.AiModelUnsupported` | "The selected AI model is not supported. Please choose another." |
| `Auth.InvalidCredentials` | "Invalid email or password." |
| `Auth.TokenExpired` | "Your session has expired. Please log in again." |

---

## O. File Upload Notes

- CV upload: `multipart/form-data`, field name `file`
- Validate `.pdf`, `.doc`, `.docx`, `.jpg`, `.png` and max 10MB **before** submit (for UX)
- Backend validates again — respect backend error messages
- Show upload progress bar if possible
- Never convert to base64 and send as JSON

---

## P. What NOT to Build

- ❌ Employer login / employer dashboard
- ❌ Recruiter portal / recruiter routes
- ❌ Mentor booking system
- ❌ Real payment gateway (Stripe/VNPay) — use `dev-activate` for testing
- ❌ Direct calls to Python services (port 8001 or 8002)
- ❌ Hardcode any provider API key (OpenAI/Gemini) in frontend
- ❌ Fake/mock AI reports, scores, or match results
- ❌ Log or store `clientSecret` from realtime
- ❌ Routes: `/employer/*`, `/recruiter/*`, `/admin/*`, `/mentor/*`

---

## Q. Screens Required

| Screen | Route | Notes |
|---|---|---|
| Login | `/login` | Email/password + Google |
| Register | `/register` | Candidate only |
| Forgot Password | `/forgot-password` | |
| Reset Password | `/reset-password` | |
| Dashboard | `/dashboard` | Summary, quota, recent activity |
| Profile | `/profile` | Edit profile, skills, education, experience, links |
| Resume List | `/resumes` | Upload, list, set active |
| Resume Detail | `/resumes/{id}` | Parse status, download |
| JD List | `/job-descriptions` | Create, list |
| JD Detail/Edit | `/job-descriptions/{id}` | Edit, delete |
| Match List | `/matches` | History |
| Match Detail | `/matches/{id}` | Score breakdown, skills |
| New Match | `/matches/new` | Select resume + JD(s) |
| Interview List | `/interviews` | History + stats |
| Interview Setup | `/interviews/new` | Choose position/level/mode/model |
| Interview Text | `/interviews/{id}/session` | Q&A chat interface |
| Interview Realtime | `/interviews/{id}/realtime` | Voice call UI |
| Interview Report | `/interviews/{id}/report` | Scores + typed arrays |
| Subscription | `/subscription` | Current plan, quota, upgrade CTA |
| Plans | `/plans` | Pricing (public, no auth needed) |

---

## R. Frontend Test Checklist

Figma Make must verify these flows before handoff:

**Auth:**
- [ ] Register new account → auto-login
- [ ] Login → redirect to dashboard
- [ ] Logout → redirect to login
- [ ] Refresh token on 401

**Profile:**
- [ ] GET and display profile
- [ ] PATCH update basic fields
- [ ] Add/edit/delete skill
- [ ] Add/edit/delete education
- [ ] Add/edit/delete experience
- [ ] Add/edit/delete external link

**Resume:**
- [ ] Upload CV (PDF) → show processing status
- [ ] List CVs with status badges
- [ ] Set active resume
- [ ] View detail + parsed data
- [ ] Reprocess
- [ ] Delete

**JD:**
- [ ] Create JD with rawText
- [ ] List JDs
- [ ] Edit JD
- [ ] Delete JD

**Matching:**
- [ ] Single match → 202 accepted → poll for result
- [ ] Multi match → 202 accepted → poll for all targets
- [ ] Render scores and skill arrays
- [ ] Handle service unavailable

**Subscription:**
- [ ] GET current plan
- [ ] GET plans list
- [ ] Dev-activate a plan
- [ ] View quota from `/dashboard/quota`

**Interview Text:**
- [ ] Check quota before creating
- [ ] Create session → start → receive first question
- [ ] Submit answer → receive next question
- [ ] Complete → receive report
- [ ] Report renders typed arrays (no raw JSON)
- [ ] List and stats

**Interview Realtime:**
- [ ] Create session (mode: voice)
- [ ] Call `/realtime/start` → receive clientSecret
- [ ] Connect to provider (or stub if pending)
- [ ] Call `/realtime/end`
- [ ] Call `/realtime/finalize` with qaPairs
- [ ] Call `/complete`
- [ ] View report

**Error states:**
- [ ] 503 from AI service → friendly message
- [ ] Quota exceeded → upgrade CTA
- [ ] 401 → auto-refresh then retry

---

## S. Deliverables Figma Make Must Report

After completing implementation, report:

1. **Files created/modified** — component tree, service layer, pages
2. **API client structure** — how auth/interceptors/refresh are implemented
3. **Screens with live API** — list every screen connected to a real endpoint
4. **Screens still mocked** — list any screens not yet connected
5. **Additional env vars needed** — beyond `VITE_API_BASE_URL`
6. **How to run frontend locally** — exact commands
7. **Test checklist result** — pass/fail/pending for each item above
8. **Known limitations or TODOs** — anything deferred

---

## T. Notes on Realtime Voice Integration

The realtime voice flow requires WebRTC (OpenAI) or WebSocket (Gemini). If this client-side integration is not complete:

- Build all screens and API wiring (create → start → end → finalize → complete → report)
- Mock the actual WebRTC/WebSocket connection with a stub that simulates the voice call
- Add a placeholder UI component labeled "🎙️ Voice call active (stub)"
- All other API calls (start, end, finalize, complete) must use real endpoints
- This allows backend integration to be tested independently of the voice client

When voice client is ready, replace only the stub with the real WebRTC/WebSocket implementation — all other code remains unchanged.
