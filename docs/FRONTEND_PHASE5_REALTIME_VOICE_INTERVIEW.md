# INTER-VIET Frontend Phase 5 — Realtime Voice Interview
# Tài liệu Tích hợp Frontend — Đầy đủ 100%

> **Phiên bản tài liệu**: 1.0.0  
> **Ngày soạn**: 2026-05-21  
> **Phạm vi**: Phase 5 — Realtime Voice Interview (Candidate Only)  
> **Không bao gồm**: Auth, CV/JD/Matching, Payment, Employer, Internal Endpoints

---

## MỤC LỤC

1. [Mục tiêu Phase 5](#1-mục-tiêu-phase-5)
2. [Điều kiện tiên quyết](#2-điều-kiện-tiên-quyết)
3. [Local Setup](#3-local-setup)
4. [Quy tắc chung bắt buộc](#4-quy-tắc-chung-bắt-buộc)
5. [Kiến trúc Service Layer](#5-kiến-trúc-service-layer)
6. [Frontend Routes](#6-frontend-routes)
7. [Bảng Endpoint tổng quan](#7-bảng-endpoint-tổng-quan)
8. [Chuẩn Response Envelope](#8-chuẩn-response-envelope)
9. [Create Voice Interview Session](#9-create-voice-interview-session)
10. [Start Realtime Session](#10-start-realtime-session)
11. [connectUrl Format — Chi tiết theo Provider](#11-connecturl-format--chi-tiết-theo-provider)
12. [clientSecret Security Rules](#12-clientsecret-security-rules)
13. [Session Expiry Handling](#13-session-expiry-handling)
14. [Provider OpenAI — WebRTC/SDP Flow chi tiết](#14-provider-openai--webrtcsdp-flow-chi-tiết)
15. [Provider Gemini — Scope Phase 5](#15-provider-gemini--scope-phase-5)
16. [Voice UI State Machine](#16-voice-ui-state-machine)
17. [End Realtime Session](#17-end-realtime-session)
18. [Transcript Event Format — OpenAI Realtime API](#18-transcript-event-format--openai-realtime-api)
19. [Transcript Builder Rules](#19-transcript-builder-rules)
20. [Finalize Realtime Session](#20-finalize-realtime-session)
21. [Complete Interview sau Finalize](#21-complete-interview-sau-finalize)
22. [GET Interview Detail — Voice Mode](#22-get-interview-detail--voice-mode)
23. [GET Realtime Session & Events](#23-get-realtime-session--events)
24. [Internal Endpoints — Tuyệt đối không dùng](#24-internal-endpoints--tuyệt-đối-không-dùng)
25. [Microphone / Browser Permission Handling](#25-microphone--browser-permission-handling)
26. [UI Requirements từng màn hình](#26-ui-requirements-từng-màn-hình)
27. [Error Handling Phase 5](#27-error-handling-phase-5)
28. [Realtime Disabled / Config Behavior](#28-realtime-disabled--config-behavior)
29. [Business Rules Phase 5](#29-business-rules-phase-5)
30. [Fallback Strategy khi WebRTC chưa hoàn thiện](#30-fallback-strategy-khi-webrtc-chưa-hoàn-thiện)
31. [Flow Summary toàn bộ Phase 5](#31-flow-summary-toàn-bộ-phase-5)
32. [Test Checklist](#32-test-checklist)
33. [Acceptance Criteria](#33-acceptance-criteria)
34. [Deliverables cần báo lại](#34-deliverables-cần-báo-lại)
35. [Không được làm trong Phase 5](#35-không-được-làm-trong-phase-5)

---

## 1. MỤC TIÊU PHASE 5

Phase 5 kết nối luồng phỏng vấn AI realtime voice vào backend C# thật.

### Phase 5 LÀM:
- Create interview session với `mode="voice"`
- Start realtime session — nhận `connectUrl`, `clientSecret`, `instructions`, `provider`, `model`
- Voice UI state machine (11 states)
- Kết nối realtime provider (OpenAI WebRTC/SDP)
- End realtime session
- Finalize transcript và Q/A pairs
- Complete interview sau finalize
- Render report giống Phase 4
- GET realtime session/events cho debug
- Handle idempotency, state machine, security, errors

### Phase 5 KHÔNG LÀM:
- Auth foundation
- CV/JD/Matching
- Payment gateway thật
- Employer/Recruiter UI
- Internal callback endpoints
- Fake report / fake transcript
- Gọi Python generate/analyze trực tiếp
- Đưa `X-Interviet-Api-Key` vào frontend
- Gemini WebSocket adapter (xem mục 15)

---

## 2. ĐIỀU KIỆN TIÊN QUYẾT

Phase 5 chỉ bắt đầu khi tất cả các phase sau đã pass:

| Phase | Yêu cầu |
|-------|---------|
| Phase 1 | Auth Foundation đã pass |
| Phase 2 | Dashboard + Profile + Subscription/Quota đã pass |
| Phase 3 | CV + JD + Matching đã pass |
| Phase 4 | Interview Text flow đã pass |
| API Client | Đã có Bearer token, refresh token, error handling |
| Backend | C# backend chạy port 5000 |
| Python | Interview Service 8002 cần bật khi test realtime voice |

---

## 3. LOCAL SETUP

### Các service cần chạy cho Phase 5:

| Service | Port | Ghi chú |
|---------|------|---------|
| SQL Server | 1433 | Bắt buộc |
| C# Backend | 5000 | Bắt buộc |
| Python Interview Service | 8002 | Bắt buộc khi test realtime |
| Frontend | 3000 | Bắt buộc |
| Python CV Service | 8001 | **Không cần** trong Phase 5 |

### URLs:

```
C# Backend:       http://localhost:5000
API Base:         http://localhost:5000/api/v1
Swagger:          http://localhost:5000/swagger
Python Interview: http://localhost:8002
Python Docs:      http://localhost:8002/docs
Frontend:         http://localhost:3000
```

### Frontend `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_GOOGLE_CLIENT_ID=964232858341-5tr0k7mju0l31mg9amdlvf74eacau5tr.apps.googleusercontent.com
VITE_ENABLE_DEV_BILLING=true
```

> **Quan trọng**: Frontend không gọi Python trực tiếp. Ngoại lệ duy nhất: sau khi C# trả `connectUrl` và `clientSecret`, frontend dùng đúng `connectUrl`/`clientSecret` đó để kết nối realtime provider/proxy — không hardcode URL Python.

---

## 4. QUY TẮC CHUNG BẮT BUỘC

```
✅ Frontend chỉ gọi C# API cho business flow: http://localhost:5000/api/v1
✅ Tất cả public realtime endpoints yêu cầu JWT Bearer token
✅ clientSecret chỉ giữ trong memory state/ref
❌ Không gọi Python generate/analyze trực tiếp
❌ Không fake realtime result
❌ Không fake report
❌ Không hardcode provider API key (OpenAI/Gemini/etc.)
❌ Không log clientSecret ra console
❌ Không lưu clientSecret vào localStorage / sessionStorage / IndexedDB
❌ Không expose X-Interviet-Api-Key trong frontend
❌ Không gọi internal callback endpoints
```

---

## 5. KIẾN TRÚC SERVICE LAYER

### Tiếp tục dùng API client từ Phase 1. Không tạo mới.

### Gợi ý cấu trúc file mới:

```
src/
├── services/
│   └── interviewRealtimeService.ts      # Business API calls
├── lib/
│   └── realtime/
│       ├── openAiWebRtcClient.ts        # OpenAI WebRTC/SDP adapter
│       ├── geminiWebSocketClient.ts     # Gemini adapter (stub Phase 5)
│       └── transcriptBuilder.ts        # Build transcript + qaPairs từ events
└── pages/
    └── interview/
        └── voice/
            ├── VoiceSetupPage.tsx
            ├── VoiceLivePage.tsx
            ├── VoiceReviewPage.tsx
            └── VoiceReportPage.tsx
```

### Functions trong `interviewRealtimeService.ts`:

```typescript
interviewRealtimeService.createVoiceInterview(payload)     // POST /interviews
interviewRealtimeService.startRealtime(interviewId, payload)   // POST /interviews/{id}/realtime/start
interviewRealtimeService.endRealtime(interviewId, payload)     // POST /interviews/{id}/realtime/end
interviewRealtimeService.finalizeRealtime(interviewId, payload) // POST /interviews/{id}/realtime/finalize
interviewRealtimeService.getRealtime(interviewId, params?)     // GET /interviews/{id}/realtime
interviewRealtimeService.completeInterview(interviewId)        // POST /interviews/{id}/complete
interviewRealtimeService.getInterview(interviewId)             // GET /interviews/{id}
```

---

## 6. FRONTEND ROUTES

Frontend phải định nghĩa các routes sau cho Phase 5:

| Route | Component | Mục đích |
|-------|-----------|---------|
| `/interview/voice/new` | `VoiceSetupPage` | Form tạo phiên voice interview mới |
| `/interview/voice/:id/live` | `VoiceLivePage` | Màn hình gọi realtime đang diễn ra |
| `/interview/voice/:id/review` | `VoiceReviewPage` | Review transcript + Q/A pairs trước finalize |
| `/interview/voice/:id/report` | `VoiceReportPage` | Hiển thị report sau complete |
| `/interview/voice/:id/debug` | `VoiceDebugPage` (optional) | Debug realtime events — chỉ dev mode |

### Route navigation flow:

```
/interview/voice/new
    → (create + start thành công)
/interview/voice/:id/live
    → (user bấm End)
/interview/voice/:id/review
    → (finalize + canComplete=true)
/interview/voice/:id/report
```

---

## 7. BẢNG ENDPOINT TỔNG QUAN

| Method | Path | Auth | Mục đích |
|--------|------|------|---------|
| `POST` | `/interviews` | ✅ Bearer | Create interview session, `mode="voice"` |
| `POST` | `/interviews/{id}/realtime/start` | ✅ Bearer | Lấy `connectUrl`/`clientSecret`/`instructions` |
| `POST` | `/interviews/{id}/realtime/end` | ✅ Bearer | Kết thúc realtime session |
| `POST` | `/interviews/{id}/realtime/finalize` | ✅ Bearer | Nộp transcript + qaPairs |
| `POST` | `/interviews/{id}/complete` | ✅ Bearer | Chấm điểm sau finalize |
| `GET` | `/interviews/{id}` | ✅ Bearer | Lấy detail/report |
| `GET` | `/interviews/{id}/realtime` | ✅ Bearer | Lấy realtime state/events (debug) |

### Tuyệt đối KHÔNG gọi:

```
❌ POST /api/v1/internal/interviews/realtime/events
❌ POST /api/v1/internal/interviews/realtime/finalize
```

---

## 8. CHUẨN RESPONSE ENVELOPE

> **Quan trọng**: Tất cả API response của hệ thống đều được bọc trong envelope sau. Frontend phải đọc `data` bên trong, không đọc trực tiếp root.

### Success Response:

```json
{
  "success": true,
  "message": "Mô tả kết quả thành công hoặc null",
  "data": {
    "...": "payload thực sự nằm ở đây"
  },
  "meta": {
    "requestId": "0HMTRSPV9QNS5",
    "timestamp": "2026-05-21T10:00:00.123Z"
  }
}
```

### Error Response (RFC 7807):

```json
{
  "type": "https://api.interviet.vn/errors/validation",
  "title": "Validation",
  "detail": "Mô tả lỗi chi tiết",
  "code": "Interview.RealtimeNotFinalized"
}
```

> Frontend đọc `code` để xử lý lỗi, không parse chuỗi `detail`.

---

## 9. CREATE VOICE INTERVIEW SESSION

**Endpoint**: `POST /api/v1/interviews`  
**Auth**: Bearer token bắt buộc

### Request Body:

```json
{
  "position": "Backend Developer",
  "level": "mid",
  "interviewType": "technical",
  "goal": "Luyện phỏng vấn backend bằng giọng nói",
  "durationMinutes": 30,
  "mode": "voice",
  "interviewerMode": "professional",
  "aiModel": "gpt-4o-mini"
}
```

### Field rules:

| Field | Required | Giá trị Phase 5 | Ghi chú |
|-------|----------|-----------------|---------|
| `position` | ✅ | Người dùng điền | Tên vị trí ứng tuyển |
| `level` | ✅ | `junior`/`mid`/`senior` | Level ứng viên |
| `interviewType` | ✅ | `technical`/`behavioral`/`mixed` | Loại phỏng vấn |
| `goal` | ❌ | Người dùng điền | Mục tiêu buổi luyện |
| `durationMinutes` | ✅ | `15`/`30`/`45`/`60` | Thời lượng |
| `mode` | ✅ | **`"voice"`** | Phase 5 luôn là voice |
| `interviewerMode` | ❌ | `professional`/`friendly`/`strict` | Tính cách AI |
| `aiModel` | ❌ | `gpt-4o-mini` | Model realtime-friendly |

> **Không dùng `mode=text` trong Phase 5.**

### Response (HTTP 200):

```json
{
  "success": true,
  "message": "Interview session created successfully.",
  "data": {
    "id": "8f8b7d6a-ae4f-4d2b-bf38-5188bcda91ff",
    "status": "created",
    "mode": "voice",
    "position": "Backend Developer",
    "level": "mid",
    "interviewType": "technical",
    "goal": "Luyện phỏng vấn backend bằng giọng nói",
    "durationMinutes": 30,
    "interviewerMode": "professional",
    "aiModel": "gpt-4o-mini",
    "createdAt": "2026-05-21T10:00:00Z"
  },
  "meta": {
    "requestId": "0HMTRSPV9QNA1",
    "timestamp": "2026-05-21T10:00:00.123Z"
  }
}
```

### Sau create thành công:
- Lưu `interviewId` = `data.id`
- Gọi ngay `/interviews/{id}/realtime/start`
- **Không gọi** `/interviews/{id}/start` (đó là text flow)

---

## 10. START REALTIME SESSION

**Endpoint**: `POST /api/v1/interviews/{id}/realtime/start`  
**Auth**: Bearer token bắt buộc

### Request Body:

```json
{
  "mode": "voice",
  "aiModel": "gpt-4o-mini",
  "voice": "alloy",
  "language": "vi",
  "enableTranscript": true
}
```

### Field rules:

| Field | Required | Default | Ghi chú |
|-------|----------|---------|---------|
| `mode` | ✅ | - | Luôn `"voice"` |
| `aiModel` | ❌ | Backend default | Gợi ý `gpt-4o-mini` |
| `voice` | ❌ | `"alloy"` | Giọng AI: `alloy`/`echo`/`shimmer`/`nova`/`onyx`/`fable` |
| `language` | ❌ | `"vi"` | Ngôn ngữ phỏng vấn |
| `enableTranscript` | ❌ | `true` | Luôn gửi `true` để broker transcript hoạt động |

### Response (HTTP 200):

```json
{
  "success": true,
  "message": "Realtime session started successfully.",
  "data": {
    "sessionId": "8f8b7d6a-ae4f-4d2b-bf38-5188bcda91ff",
    "realtimeSessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "active",
    "provider": "openai",
    "model": "gpt-4o-mini",
    "providerSessionId": "sess_abc123xyz",
    "connectUrl": "http://localhost:8002/ai/interviews/realtime/openai/sdp",
    "clientSecret": "ek_abc123456789xyz",
    "instructions": "Bạn là interviewer chuyên nghiệp đang phỏng vấn ứng viên cho vị trí Backend Developer...",
    "expiresAt": "2026-05-21T10:15:00Z",
    "startedAt": "2026-05-21T10:00:00Z",
    "isIdempotent": false
  },
  "meta": {
    "requestId": "0HMTRSPV9QNA2",
    "timestamp": "2026-05-21T10:00:00.456Z"
  }
}
```

### Frontend phải lưu trong memory state (KHÔNG localStorage):

```typescript
interface RealtimeSessionState {
  sessionId: string;           // = interviewId
  realtimeSessionId: string;
  provider: string;            // "openai" | "gemini"
  model: string;
  providerSessionId: string;
  connectUrl: string;
  clientSecret: string;        // ⚠️ CHỈ MEMORY, không persist
  instructions: string;
  expiresAt: string;           // ISO datetime
  startedAt: string;
  isIdempotent: boolean;
}
```

### Response khi gọi start lần 2 (idempotent):

```json
{
  "success": true,
  "message": "Realtime session already active.",
  "data": {
    "sessionId": "8f8b7d6a-ae4f-4d2b-bf38-5188bcda91ff",
    "realtimeSessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "active",
    "provider": "openai",
    "model": "gpt-4o-mini",
    "providerSessionId": "sess_abc123xyz",
    "connectUrl": "http://localhost:8002/ai/interviews/realtime/openai/sdp",
    "clientSecret": null,
    "instructions": null,
    "expiresAt": "2026-05-21T10:15:00Z",
    "startedAt": "2026-05-21T10:00:00Z",
    "isIdempotent": true
  }
}
```

> **Khi `isIdempotent: true`, `clientSecret` và `instructions` sẽ là `null`** vì backend không lưu raw secret. Frontend mất secret → phải end session và tạo lại, không fake.

---

## 11. connectUrl FORMAT — CHI TIẾT THEO PROVIDER

Backend C# đóng vai trò pass-through. `connectUrl` và `clientSecret` do Python service sinh ra và trả về qua C#.

### Provider: `"openai"` — Python Proxy Mode

```
connectUrl = "http://localhost:8002/ai/interviews/realtime/openai/sdp"
```

- Đây là **Python proxy endpoint**, không phải OpenAI trực tiếp.
- Frontend POST SDP offer tới URL này.
- Python proxy sẽ forward tới OpenAI Realtime API và trả SDP answer về.

### Provider: `"openai"` — Direct Mode (nếu Python config khác)

```
connectUrl = "https://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview"
```

- Đây là OpenAI endpoint trực tiếp.
- Frontend dùng `clientSecret` làm Bearer token khi POST SDP.
- **`clientSecret` trong trường hợp này là ephemeral key của OpenAI**, không phải key của InterViet.

### Provider: `"gemini"`

```
connectUrl = "wss://localhost:8002/ai/interviews/realtime/gemini/ws"
// hoặc production:
connectUrl = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent"
```

> **Phase 5**: Gemini **KHÔNG trong scope**. Xem mục 15.

### Cách frontend xác định kết nối:

```typescript
function connectToProvider(session: RealtimeSessionState) {
  if (session.provider === 'openai') {
    return connectOpenAiWebRtc(session);
  } else if (session.provider === 'gemini') {
    // Phase 5: Show unsupported state
    setUiState('Error');
    setError('Gemini provider chưa được hỗ trợ trong phiên bản này.');
    return;
  } else {
    setUiState('Error');
    setError(`Provider "${session.provider}" chưa được hỗ trợ.`);
  }
}
```

---

## 12. clientSecret SECURITY RULES

`clientSecret` là ephemeral token, thời gian sống ngắn theo TTL backend/Python config.

### Rules tuyệt đối:

```
✅ Chỉ giữ trong React state / useRef / memory variable
❌ Không lưu localStorage
❌ Không lưu sessionStorage
❌ Không lưu IndexedDB
❌ Không lưu cookie
❌ Không log console (kể cả console.debug, console.warn)
❌ Không gửi về server khác
❌ Không commit vào source code
❌ Không đưa vào Redux DevTools nếu có thể tránh
```

### Recommended storage pattern:

```typescript
// ✅ Dùng useRef để tránh expose vào DevTools
const clientSecretRef = useRef<string | null>(null);

// Khi nhận từ API:
clientSecretRef.current = data.clientSecret;

// Khi kết nối xong:
// Giữ trong ref suốt thời gian session active

// Khi end session:
clientSecretRef.current = null; // Xóa khỏi memory
```

---

## 13. SESSION EXPIRY HANDLING

Backend trả `expiresAt` trong response của `/realtime/start`. Frontend phải xử lý.

### TTL mặc định: 600 giây (10 phút) — theo config backend

```json
"AiServices": {
  "InterviewRealtimeTokenTtlSeconds": 600
}
```

### Flow xử lý expiry:

```
expiresAt - now > 120s  →  Session bình thường, không cần làm gì
expiresAt - now ≤ 120s  →  Hiển thị warning banner: "Phiên gọi sẽ kết thúc trong X giây"
expiresAt - now ≤ 0     →  Session đã hết hạn
```

### Khi session hết hạn (`expiresAt` đã qua):

1. Provider connection sẽ tự đóng (WebRTC/WebSocket bị server cắt)
2. Frontend catch connection closed event
3. Chuyển state sang `'Ended'` hoặc `'Error'`
4. Hiển thị: **"Phiên realtime đã hết thời gian. Vui lòng xem lại transcript và tiếp tục finalize."**
5. Vẫn cho phép người dùng finalize transcript đã thu thập được

### Không thể refresh clientSecret:

- `clientSecret` không thể renew bằng cách gọi `/realtime/start` lần 2 (trả `null`)
- Nếu session expire trước khi user kết thúc → end session → tạo interview mới nếu cần

### Countdown timer implementation:

```typescript
useEffect(() => {
  if (!expiresAt) return;

  const interval = setInterval(() => {
    const remainingSeconds = Math.floor(
      (new Date(expiresAt).getTime() - Date.now()) / 1000
    );

    if (remainingSeconds <= 0) {
      clearInterval(interval);
      handleSessionExpired();
    } else if (remainingSeconds <= 120) {
      setExpiryWarning(`Phiên gọi kết thúc sau ${remainingSeconds} giây`);
    }
  }, 1000);

  return () => clearInterval(interval);
}, [expiresAt]);
```

---

## 14. PROVIDER OPENAI — WebRTC/SDP FLOW CHI TIẾT

### Điều kiện tiên quyết:
- `provider === "openai"`
- Đã có `connectUrl`, `clientSecret`, `instructions` trong memory
- Microphone permission đã được cấp

### Bước 1: Tạo RTCPeerConnection

```typescript
const pc = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});
```

### Bước 2: Xin quyền microphone và add audio track

```typescript
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
stream.getAudioTracks().forEach(track => pc.addTrack(track, stream));
```

### Bước 3: Tạo audio element để nhận audio từ AI

```typescript
const audioEl = document.createElement('audio');
audioEl.autoplay = true;
pc.ontrack = (e) => {
  audioEl.srcObject = e.streams[0];
};
```

### Bước 4: Tạo Data Channel (để gửi instructions/events)

```typescript
const dc = pc.createDataChannel('oai-events');
dc.onopen = () => {
  // Gửi session.update với instructions nếu proxy yêu cầu
  // Nếu Python proxy đã gài instructions server-side, bước này có thể skip
  const sessionUpdate = {
    type: 'session.update',
    session: {
      instructions: instructions, // từ /realtime/start response
      input_audio_transcription: { model: 'whisper-1' },
      turn_detection: { type: 'server_vad' }
    }
  };
  dc.send(JSON.stringify(sessionUpdate));
};

// Nhận events từ OpenAI qua data channel
dc.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  transcriptBuilder.handleEvent(msg);
};
```

### Bước 5: Tạo SDP Offer

```typescript
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
```

### Bước 6: POST SDP Offer tới connectUrl

```typescript
const response = await fetch(connectUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${clientSecret}`,
    'Content-Type': 'application/sdp'
  },
  body: offer.sdp
});
```

### Bước 7: Nhận SDP Answer

#### Response khi thành công (HTTP 200 hoặc 201):

```
Content-Type: application/sdp

v=0
o=- 123456 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0
...
```

> **Lưu ý**: Response body là raw SDP string, **không phải JSON**. `Content-Type` là `application/sdp`.

#### Xử lý response:

```typescript
if (!response.ok) {
  const errText = await response.text();
  throw new Error(`SDP negotiation failed: ${response.status} — ${errText}`);
}

const sdpAnswer = await response.text(); // raw SDP, không JSON.parse
await pc.setRemoteDescription({
  type: 'answer',
  sdp: sdpAnswer
});
```

### Bước 8: Kết nối thành công

```typescript
pc.onconnectionstatechange = () => {
  if (pc.connectionState === 'connected') {
    setUiState('Live');
  } else if (pc.connectionState === 'failed') {
    setUiState('Error');
    setError('Kết nối thất bại. Vui lòng thử lại.');
  }
};
```

### Cleanup khi end:

```typescript
function cleanupConnection() {
  stream.getTracks().forEach(track => track.stop()); // Dừng mic
  dc?.close();
  pc?.close();
  clientSecretRef.current = null;
}
```

---

## 15. PROVIDER GEMINI — SCOPE PHASE 5

> **Gemini WebSocket adapter KHÔNG trong scope Phase 5.**

Khi `provider === "gemini"`:
- Frontend hiển thị thông báo: **"Provider Gemini chưa được hỗ trợ trong phiên bản này."**
- Không kết nối WebSocket
- Không fake call success
- Chuyển state sang `'Error'`
- User có thể quay lại và tạo phiên mới với model OpenAI

### Stub implementation:

```typescript
// src/lib/realtime/geminiWebSocketClient.ts
export class GeminiWebSocketClient {
  connect(): never {
    throw new Error('Gemini WebSocket adapter is not implemented in Phase 5.');
  }
}
```

> **Post-Phase 5**: Khi Gemini adapter được implement, message format audio là raw PCM 16-bit / 24kHz mono base64-encoded, gửi qua WebSocket message có dạng `{ realtimeInput: { mediaChunks: [{ mimeType: "audio/pcm", data: "<base64>" }] } }`.

---

## 16. VOICE UI STATE MACHINE

### 11 States:

| State | Mô tả | Action cho phép |
|-------|-------|----------------|
| `Setup` | User điền form voice interview | Submit form |
| `Starting` | Đang gọi `/interviews` và `/realtime/start` | Cancel (nếu chưa xong) |
| `Connecting` | Có `connectUrl/clientSecret`, đang mở WebRTC | Abort |
| `Live` | Kết nối thành công, mic mở | End call |
| `Ending` | Đóng provider connection + gọi `/end` | - |
| `Ended` | Realtime session đã end | Go to Review |
| `Finalizing` | Đang gửi transcript/qaPairs lên `/finalize` | - |
| `ReadyToComplete` | `finalize` success, `canComplete=true` | Complete |
| `Completing` | Đang gọi `/complete` | - |
| `Report` | Hiển thị report | Back to history |
| `Error` | Lỗi token/provider/quota/service | Retry / Home |

### State transitions:

```
Setup
  → [form submit + mic check OK] → Starting
  → [mic denied] → Error

Starting
  → [create + start API thành công] → Connecting
  → [API error] → Error

Connecting
  → [WebRTC connected] → Live
  → [SDP fail / connection fail] → Error

Live
  → [user bấm End] → Ending
  → [provider dropped / timeout] → Ending
  → [expiresAt reached] → Ending

Ending
  → [close connection + /end API success] → Ended
  → [/end API error] → Error (vẫn cho finalize nếu có transcript)

Ended
  → [user xem transcript + confirm] → Finalizing

Finalizing
  → [/finalize success + canComplete=true] → ReadyToComplete
  → [/finalize success + canComplete=false] → Error (message: không đủ câu trả lời)
  → [/finalize API error] → Error

ReadyToComplete
  → [user bấm Complete] → Completing

Completing
  → [/complete success] → Report
  → [/complete error] → Error

Report → [done]

Error → [retry phù hợp với state] → Setup hoặc Ended hoặc ReadyToComplete
```

---

## 17. END REALTIME SESSION

**Endpoint**: `POST /api/v1/interviews/{id}/realtime/end`  
**Auth**: Bearer token bắt buộc

### Request Body:

```json
{
  "realtimeSessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "reason": "user_ended"
}
```

### Giá trị `reason` hợp lệ:

| Value | Khi nào dùng |
|-------|-------------|
| `user_ended` | User bấm nút "Kết thúc cuộc gọi" |
| `timeout` | `expiresAt` đã hết |
| `error` | Lỗi kết nối không khôi phục được |
| `connection_lost` | Provider connection bị mất đột ngột |

### Response (HTTP 200):

```json
{
  "success": true,
  "message": "Realtime session ended successfully.",
  "data": {
    "sessionId": "8f8b7d6a-ae4f-4d2b-bf38-5188bcda91ff",
    "realtimeSessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "ended",
    "endedAt": "2026-05-21T10:12:00Z"
  },
  "meta": {
    "requestId": "0HMTRSPV9QNA3",
    "timestamp": "2026-05-21T10:12:00.789Z"
  }
}
```

### Frontend behavior khi end:

```
1. User bấm "Kết thúc cuộc gọi"
2. Disable End button (chống double-click)
3. Dừng microphone tracks: stream.getTracks().forEach(t => t.stop())
4. Đóng RTCPeerConnection: pc.close()
5. Gọi POST /realtime/end với realtimeSessionId + reason
6. Xóa clientSecret khỏi memory: clientSecretRef.current = null
7. Chuyển state sang 'Ended'
8. Navigate sang /interview/voice/:id/review
```

### Idempotency khi end nhiều lần:

- UI phải disable button khi đang loading
- Nếu backend trả success/idempotent → coi như ended, tiếp tục flow
- Nếu `realtimeSessionId` sai → show error, fetch GET `/realtime` để lấy session ID đúng

---

## 18. TRANSCRIPT EVENT FORMAT — OPENAI REALTIME API

Frontend nhận events từ OpenAI qua **Data Channel** (`dc.onmessage`). Đây là format của các event quan trọng cần xử lý để build transcript.

### Event 1: AI nói xong một câu (Assistant transcript)

```json
{
  "type": "response.audio_transcript.done",
  "event_id": "evt_001",
  "response_id": "resp_abc",
  "item_id": "item_001",
  "output_index": 0,
  "content_index": 0,
  "transcript": "Xin chào, hãy giới thiệu bản thân bạn nhé?"
}
```

→ Đây là **câu hỏi** của interviewer AI. Dùng làm `questionText`.

---

### Event 2: User nói xong (User transcript — final)

```json
{
  "type": "conversation.item.input_audio_transcription.completed",
  "event_id": "evt_002",
  "item_id": "item_002",
  "content_index": 0,
  "transcript": "Tôi tên là Nguyễn Văn A, có 3 năm kinh nghiệm lập trình backend..."
}
```

→ Đây là **câu trả lời** của user. Dùng làm `answerText`.

---

### Event 3: AI bắt đầu nói (streaming — partial transcript)

```json
{
  "type": "response.audio_transcript.delta",
  "event_id": "evt_003",
  "response_id": "resp_abc",
  "item_id": "item_001",
  "output_index": 0,
  "content_index": 0,
  "delta": "Xin chào"
}
```

→ Streaming partial. Dùng để hiển thị live transcript, **không dùng để build qaPairs** (chờ `done` event).

---

### Event 4: Session created (xác nhận kết nối)

```json
{
  "type": "session.created",
  "event_id": "evt_000",
  "session": {
    "id": "sess_abc123xyz",
    "model": "gpt-4o-mini-realtime-preview",
    "voice": "alloy",
    "instructions": "Bạn là interviewer...",
    "input_audio_transcription": { "model": "whisper-1" },
    "turn_detection": { "type": "server_vad" }
  }
}
```

→ Xác nhận kết nối thành công. Chuyển UI state sang `'Live'`.

---

### Event 5: Error từ provider

```json
{
  "type": "error",
  "event_id": "evt_999",
  "error": {
    "type": "invalid_request_error",
    "code": "session_expired",
    "message": "Your session has expired."
  }
}
```

→ Xử lý trong `handleProviderError()`, chuyển state sang `'Error'` hoặc `'Ending'`.

---

### Event 6: Turn detection — AI bắt đầu xử lý (user dừng nói)

```json
{
  "type": "input_audio_buffer.speech_stopped",
  "event_id": "evt_010",
  "audio_end_ms": 4200,
  "item_id": "item_002"
}
```

→ Có thể dùng để hiển thị "đang xử lý..." indicator.

---

### Mapping events sang `qaPairs`:

```typescript
// transcriptBuilder.ts
interface QAPair {
  questionNumber: number;
  questionText: string;
  answerText: string;
  questionType?: string;
  difficulty?: string;
}

class TranscriptBuilder {
  private qaPairs: QAPair[] = [];
  private currentQuestion: Partial<QAPair> = {};
  private questionCounter = 0;
  private fullTranscript = '';

  handleEvent(event: any) {
    switch (event.type) {
      case 'response.audio_transcript.done':
        // AI hỏi xong → lưu làm questionText
        this.questionCounter++;
        this.currentQuestion = {
          questionNumber: this.questionCounter,
          questionText: event.transcript.trim(),
          answerText: '',
        };
        this.fullTranscript += `\nInterviewer: ${event.transcript}`;
        break;

      case 'conversation.item.input_audio_transcription.completed':
        // User trả lời xong → gắn vào currentQuestion
        if (this.currentQuestion.questionText) {
          this.currentQuestion.answerText = event.transcript.trim();
          this.qaPairs.push(this.currentQuestion as QAPair);
          this.currentQuestion = {};
        }
        this.fullTranscript += `\nCandidate: ${event.transcript}`;
        break;
    }
  }

  build(): { transcriptText: string; qaPairs: QAPair[] } {
    return {
      transcriptText: this.fullTranscript.trim(),
      qaPairs: this.qaPairs.filter(
        p => p.questionText.trim().length > 0 && p.answerText.trim().length > 0
      )
    };
  }
}
```

---

## 19. TRANSCRIPT BUILDER RULES

### Quy tắc khi build `qaPairs`:

| Rule | Chi tiết |
|------|---------|
| `questionText` | Từ assistant/interviewer utterances |
| `answerText` | Từ user/candidate utterances |
| `questionNumber` | Bắt đầu từ 1, tăng dần theo thứ tự |
| Skip | Bỏ qua pair có `questionText` rỗng |
| Invalid | Pair có `answerText` rỗng → không tính là valid answer |
| `transcriptText` | Raw full conversation, giữ nguyên cho debug |

### Validation trước khi gọi `/finalize`:

```typescript
const { transcriptText, qaPairs } = transcriptBuilder.build();

const validPairs = qaPairs.filter(
  p => p.questionText.trim().length > 0 && p.answerText.trim().length > 0
);

if (validPairs.length === 0) {
  // Hiện thông báo, không auto-complete
  showWarning('Chưa có câu trả lời hợp lệ để chấm điểm. Vui lòng chỉnh sửa transcript.');
  return;
}

// Tiến hành finalize với validPairs
await finalizeRealtime(interviewId, { transcriptText, qaPairs: validPairs });
```

---

## 20. FINALIZE REALTIME SESSION

**Endpoint**: `POST /api/v1/interviews/{id}/realtime/finalize`  
**Auth**: Bearer token bắt buộc

### Request Body:

```json
{
  "realtimeSessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "transcriptText": "Interviewer: Xin chào, hãy giới thiệu bản thân bạn nhé?\nCandidate: Tôi tên là Nguyễn Văn A, có 3 năm kinh nghiệm lập trình backend...",
  "qaPairs": [
    {
      "questionNumber": 1,
      "questionText": "Xin chào, hãy giới thiệu bản thân bạn nhé?",
      "answerText": "Tôi tên là Nguyễn Văn A, có 3 năm kinh nghiệm lập trình backend với C# và .NET Core.",
      "questionType": "opening",
      "difficulty": "easy"
    },
    {
      "questionNumber": 2,
      "questionText": "Bạn đã từng xây dựng RESTful API chưa? Mô tả quy trình bạn thường làm?",
      "answerText": "Có, tôi đã xây dựng nhiều RESTful API. Quy trình của tôi bắt đầu từ thiết kế endpoint...",
      "questionType": "technical",
      "difficulty": "medium"
    }
  ],
  "modelVersion": "gpt-realtime",
  "schemaVersion": "interview-realtime-v1"
}
```

### Field rules:

| Field | Required | Ghi chú |
|-------|----------|---------|
| `realtimeSessionId` | ✅ | Từ `/realtime/start` response |
| `transcriptText` | ❌ | Nên gửi, dùng cho debug/context |
| `qaPairs` | ✅ | Array, có thể rỗng nhưng `canComplete=false` |
| `qaPairs[].questionNumber` | ✅ | Bắt đầu từ 1 |
| `qaPairs[].questionText` | ✅ | Câu hỏi của AI |
| `qaPairs[].answerText` | ✅ | Câu trả lời của user |
| `qaPairs[].questionType` | ❌ | `opening`/`technical`/`behavioral`/`closing` |
| `qaPairs[].difficulty` | ❌ | `easy`/`medium`/`hard` |
| `modelVersion` | ❌ | Gợi ý: `"gpt-realtime"` |
| `schemaVersion` | ❌ | Gợi ý: `"interview-realtime-v1"` |

### Response — Thành công (HTTP 200):

```json
{
  "success": true,
  "message": "Realtime transcript finalized successfully.",
  "data": {
    "sessionId": "8f8b7d6a-ae4f-4d2b-bf38-5188bcda91ff",
    "realtimeSessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "savedQuestionCount": 2,
    "savedAnswerCount": 2,
    "canComplete": true,
    "isIdempotent": false,
    "status": "completed",
    "message": "Realtime transcript finalized successfully."
  },
  "meta": {
    "requestId": "0HMTRSPV9QNA4",
    "timestamp": "2026-05-21T10:14:00.123Z"
  }
}
```

### Response — Idempotent (gọi lần 2):

```json
{
  "success": true,
  "message": "Realtime transcript already finalized.",
  "data": {
    "sessionId": "8f8b7d6a-ae4f-4d2b-bf38-5188bcda91ff",
    "realtimeSessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "savedQuestionCount": 0,
    "savedAnswerCount": 0,
    "canComplete": true,
    "isIdempotent": true,
    "status": "completed",
    "message": "Realtime transcript already finalized."
  }
}
```

### Response — Không đủ câu trả lời:

```json
{
  "success": true,
  "message": "No valid answers found.",
  "data": {
    "sessionId": "8f8b7d6a-ae4f-4d2b-bf38-5188bcda91ff",
    "realtimeSessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "savedQuestionCount": 0,
    "savedAnswerCount": 0,
    "canComplete": false,
    "isIdempotent": false,
    "status": "completed",
    "message": "No valid answers found."
  }
}
```

### Frontend behavior sau finalize:

```
canComplete = true  → Hiển thị nút "Chấm điểm" và/hoặc tự gọi /complete
canComplete = false → Hiển thị: "Chưa có câu trả lời hợp lệ để chấm điểm."
                      Cho phép user chỉnh sửa Q/A và finalize lại
isIdempotent = true → Coi như thành công, không duplicate UI
```

### Idempotency rules:

- Finalize an toàn để gọi nhiều lần
- `questionNumber` trùng sẽ bị backend skip (không duplicate)
- `savedQuestionCount = 0` khi idempotent là bình thường
- Disable button finalize khi đang loading

---

## 21. COMPLETE INTERVIEW SAU FINALIZE

**Endpoint**: `POST /api/v1/interviews/{id}/complete`  
**Auth**: Bearer token bắt buộc

### Request Body: (empty hoặc không cần body)

```json
{}
```

### Response thành công (HTTP 200):

```json
{
  "success": true,
  "message": "Interview completed successfully.",
  "data": {
    "id": "8f8b7d6a-ae4f-4d2b-bf38-5188bcda91ff",
    "status": "completed",
    "mode": "voice",
    "completedAt": "2026-05-21T10:15:00Z",
    "report": {
      "overallScore": 78,
      "confidenceScore": 72,
      "clarityScore": 80,
      "relevanceScore": 82,
      "strengths": [
        "Kiến thức vững về RESTful API design",
        "Trình bày logic rõ ràng"
      ],
      "weaknesses": [
        "Chưa đề cập đến error handling strategy",
        "Thiếu kinh nghiệm với distributed systems"
      ],
      "recommendations": [
        "Tìm hiểu thêm về Circuit Breaker pattern",
        "Luyện tập mô tả kiến trúc microservices"
      ],
      "scoreBreakdowns": [
        {
          "category": "Technical Knowledge",
          "score": 80,
          "maxScore": 100,
          "comment": "Nắm vững kiến thức nền tảng"
        }
      ],
      "feedbackItems": [
        {
          "questionNumber": 1,
          "questionText": "Hãy giới thiệu bản thân bạn?",
          "answerText": "Tôi tên là Nguyễn Văn A...",
          "score": 75,
          "feedback": "Giới thiệu rõ ràng nhưng chưa nêu bật điểm nổi bật",
          "suggestedAnswer": "Nên thêm thành tích cụ thể và con số để tạo ấn tượng..."
        }
      ],
      "modelVersion": "gpt-4o-mini",
      "schemaVersion": "interview-report-v2"
    }
  },
  "meta": {
    "requestId": "0HMTRSPV9QNA5",
    "timestamp": "2026-05-21T10:15:00.456Z"
  }
}
```

### Report fields — đọc trực tiếp là typed array, KHÔNG JSON.parse:

| Field | Type | Ghi chú |
|-------|------|---------|
| `overallScore` | `number` | 0-100 |
| `confidenceScore` | `number` | 0-100 |
| `clarityScore` | `number` | 0-100 |
| `relevanceScore` | `number` | 0-100 |
| `strengths` | `string[]` | Array string |
| `weaknesses` | `string[]` | Array string |
| `recommendations` | `string[]` | Array string |
| `scoreBreakdowns` | `object[]` | Array object |
| `feedbackItems` | `object[]` | Array object |
| `modelVersion` | `string` | Model đã dùng |
| `schemaVersion` | `string` | Schema version |

### Các trường hợp lỗi của `/complete`:

```
400 Interview.RealtimeNotFinalized  → Chưa finalize, hướng dẫn finalize trước
400 Interview.NoAnswers             → canComplete=false, hướng dẫn thêm câu trả lời
409 Invalid State                   → Realtime session vẫn active, hướng dẫn end trước
```

### Complete idempotency:

- Gọi `/complete` lần 2 sau khi đã completed → Backend trả về report hiện có (không chấm lại)
- Frontend kiểm tra `data.status === 'completed'` trước khi gọi `/complete` để tránh duplicate call

---

## 22. GET INTERVIEW DETAIL — VOICE MODE

**Endpoint**: `GET /api/v1/interviews/{id}`  
**Auth**: Bearer token bắt buộc

### Response khi interview đã completed (HTTP 200):

```json
{
  "success": true,
  "message": null,
  "data": {
    "id": "8f8b7d6a-ae4f-4d2b-bf38-5188bcda91ff",
    "status": "completed",
    "mode": "voice",
    "position": "Backend Developer",
    "level": "mid",
    "interviewType": "technical",
    "goal": "Luyện phỏng vấn backend bằng giọng nói",
    "durationMinutes": 30,
    "aiModel": "gpt-4o-mini",
    "createdAt": "2026-05-21T10:00:00Z",
    "startedAt": "2026-05-21T10:00:30Z",
    "completedAt": "2026-05-21T10:15:00Z",
    "realtimeSession": {
      "realtimeSessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "status": "ended",
      "provider": "openai",
      "model": "gpt-4o-mini",
      "startedAt": "2026-05-21T10:00:30Z",
      "endedAt": "2026-05-21T10:12:00Z"
    },
    "report": {
      "overallScore": 78,
      "confidenceScore": 72,
      "clarityScore": 80,
      "relevanceScore": 82,
      "strengths": ["..."],
      "weaknesses": ["..."],
      "recommendations": ["..."],
      "scoreBreakdowns": [],
      "feedbackItems": [],
      "modelVersion": "gpt-4o-mini",
      "schemaVersion": "interview-report-v2"
    }
  },
  "meta": {
    "requestId": "0HMTRSPV9QNA6",
    "timestamp": "2026-05-21T10:16:00.123Z"
  }
}
```

### Response khi interview chưa completed:

```json
{
  "data": {
    "id": "8f8b7d6a-ae4f-4d2b-bf38-5188bcda91ff",
    "status": "in_progress",
    "mode": "voice",
    "report": null,
    "realtimeSession": {
      "status": "active",
      "...": "..."
    }
  }
}
```

> Frontend kiểm tra `data.report !== null` trước khi render Report screen.

---

## 23. GET REALTIME SESSION & EVENTS

**Endpoint**: `GET /api/v1/interviews/{id}/realtime?eventPage=1&eventPageSize=50`  
**Auth**: Bearer token bắt buộc

### Mục đích:
- Debug realtime session state
- Xem active/latest realtime session
- View events từ Python internal callbacks (nếu available)

> **Quan trọng**: Response KHÔNG bao giờ chứa `clientSecret`. Không thể recover secret từ endpoint này.

### Response (HTTP 200):

```json
{
  "success": true,
  "message": null,
  "data": {
    "sessionId": "8f8b7d6a-ae4f-4d2b-bf38-5188bcda91ff",
    "realtimeSession": {
      "realtimeSessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "status": "active",
      "provider": "openai",
      "model": "gpt-4o-mini",
      "providerSessionId": "sess_abc123xyz",
      "startedAt": "2026-05-21T10:00:30Z",
      "expiresAt": "2026-05-21T10:10:30Z",
      "endedAt": null
    },
    "events": [
      {
        "id": "e1b2c3d4-e5f6-7890-abcd-ef1234567891",
        "sequenceNumber": 1,
        "eventType": "user_transcript_final",
        "role": "user",
        "text": "Tôi là backend developer.",
        "providerEventId": "evt_001",
        "occurredAt": "2026-05-21T10:01:00Z",
        "metadata": {},
        "createdAt": "2026-05-21T10:01:01Z"
      },
      {
        "id": "e1b2c3d4-e5f6-7890-abcd-ef1234567892",
        "sequenceNumber": 2,
        "eventType": "assistant_transcript_final",
        "role": "assistant",
        "text": "Bạn có thể mô tả kinh nghiệm backend của mình không?",
        "providerEventId": "evt_002",
        "occurredAt": "2026-05-21T10:01:30Z",
        "metadata": {},
        "createdAt": "2026-05-21T10:01:31Z"
      }
    ],
    "eventPage": 1,
    "eventPageSize": 50,
    "totalEvents": 2
  },
  "meta": {
    "requestId": "0HMTRSPV9QNA7",
    "timestamp": "2026-05-21T10:05:00.123Z"
  }
}
```

> Events từ GET realtime chủ yếu cho debug/dev panel, không phụ thuộc làm nguồn transcript chính nếu Python flow chưa push events đầy đủ.

---

## 24. INTERNAL ENDPOINTS — TUYỆT ĐỐI KHÔNG DÙNG

```
❌ POST /api/v1/internal/interviews/realtime/events
❌ POST /api/v1/internal/interviews/realtime/finalize
```

- Chỉ dành cho Python service dùng với `X-Interviet-Api-Key`
- Frontend gọi → 401 Unauthorized
- **Không bao giờ đưa `X-Interviet-Api-Key` vào frontend code hoặc `.env`**

---

## 25. MICROPHONE / BROWSER PERMISSION HANDLING

### Thứ tự đề xuất (để tránh lãng phí `clientSecret`):

```
1. Check mic permission (getUserMedia test)
2. POST /interviews (create)
3. POST /interviews/{id}/realtime/start (nhận clientSecret)
4. Connect provider với connectUrl/clientSecret
```

> Kiểm tra mic TRƯỚC khi gọi `/realtime/start` để tránh lãng phí clientSecret khi user từ chối mic.

### Xử lý các lỗi browser:

| Error | Thông báo tiếng Việt |
|-------|---------------------|
| `NotAllowedError` | "Bạn chưa cấp quyền microphone. Vui lòng cho phép truy cập microphone trong cài đặt trình duyệt." |
| `NotFoundError` | "Không tìm thấy microphone. Vui lòng kết nối microphone và thử lại." |
| `NotReadableError` | "Microphone đang được ứng dụng khác sử dụng. Vui lòng đóng ứng dụng đó và thử lại." |
| `OverconstrainedError` | "Microphone không đáp ứng yêu cầu âm thanh. Vui lòng thử microphone khác." |
| Browser unsupported | "Trình duyệt của bạn chưa hỗ trợ tính năng gọi realtime. Vui lòng dùng Chrome hoặc Edge phiên bản mới nhất." |

### Check mic permission:

```typescript
async function checkMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop()); // Release ngay
    return true;
  } catch (err: any) {
    const errorMessages: Record<string, string> = {
      NotAllowedError: 'Bạn chưa cấp quyền microphone...',
      NotFoundError: 'Không tìm thấy microphone...',
      NotReadableError: 'Microphone đang được ứng dụng khác sử dụng...',
    };
    setError(errorMessages[err.name] ?? 'Lỗi microphone không xác định.');
    return false;
  }
}
```

### Kiểm tra browser support:

```typescript
function isBrowserSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof RTCPeerConnection !== 'undefined'
  );
}
```

---

## 26. UI REQUIREMENTS TỪNG MÀN HÌNH

### Màn hình 1: Voice Setup (`/interview/voice/new`)

**Fields bắt buộc:**
- Position (text input)
- Level (select: junior/mid/senior)
- Interview Type (select: technical/behavioral/mixed)
- Duration (select: 15/30/45/60 phút)

**Fields tùy chọn:**
- Goal (textarea)
- Interviewer Mode (select: professional/friendly/strict)
- AI Model (select: gpt-4o-mini/gpt-4o)
- Voice (select: alloy/echo/shimmer/nova/onyx/fable)
- Language (select: Tiếng Việt/English)
- Enable Transcript (toggle, default: on)

**UI elements:**
- Warning banner: "Phiên realtime chỉ có thể bắt đầu 1 lần. Không thể lấy lại session token nếu mất kết nối."
- Microphone check indicator (test mic trước khi submit)
- Submit button: "Bắt đầu phỏng vấn"

---

### Màn hình 2: Live Call (`/interview/voice/:id/live`)

**Hiển thị:**
- Connection status indicator (Connecting... / Live / Error)
- Mic status (on/off/muted)
- Timer (thời gian đã nói)
- Countdown warning khi `expiresAt` còn ≤ 120 giây
- Optional: live transcript stream
- Error banner (nếu có)

**Actions:**
- "Kết thúc cuộc gọi" button (disable khi loading)
- Mute/unmute mic

---

### Màn hình 3: Transcript Review (`/interview/voice/:id/review`)

**Hiển thị:**
- Full transcript text (read-only hoặc editable)
- Q/A pairs table (có thể edit questionText/answerText)
- Warning nếu `validPairs.length === 0`

**Actions:**
- "Finalize & Chấm điểm" button
- Hoặc nếu `canComplete = false` sau finalize: "Chỉnh sửa lại câu trả lời"

---

### Màn hình 4: Report (`/interview/voice/:id/report`)

**Giống Phase 4 hoàn toàn.** Hiển thị:
- Overall score (progress circle)
- Score breakdown (confidenceScore, clarityScore, relevanceScore)
- Strengths / Weaknesses / Recommendations (lists)
- Per-question feedback (feedbackItems)
- Nút: "Lịch sử phỏng vấn", "Luyện lại"

---

## 27. ERROR HANDLING PHASE 5

### Bảng mã lỗi và xử lý:

| HTTP | Code | Thông báo tiếng Việt | Hành động Frontend |
|------|------|---------------------|-------------------|
| `400` | `Validation` | "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại." | Highlight form field lỗi |
| `400` | `Interview.RealtimeNotFinalized` | "Vui lòng kết thúc và finalize phiên voice trước khi chấm điểm." | Show button "Finalize ngay" |
| `400` | `Interview.NoAnswers` | "Cần ít nhất một câu trả lời hợp lệ để chấm điểm." | Show transcript review |
| `401` | `Unauthorized` | "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." | Redirect `/login` |
| `403` | `Quota.Exceeded` | "Bạn đã dùng hết lượt phỏng vấn AI trong gói hiện tại." | Show upgrade CTA |
| `404` | `NotFound` | "Không tìm thấy phiên phỏng vấn." | Redirect `/interviews` |
| `404` | `RealtimeSessionNotFound` | "Không tìm thấy phiên realtime." | Fetch GET `/realtime` để debug |
| `409` | `InvalidState` | "Trạng thái phiên hiện tại không hợp lệ. Vui lòng tải lại." | Reload + fetch status |
| `429` | `RateLimitExceeded` | "Hệ thống AI đang quá tải. Vui lòng thử lại sau ít phút." | Retry với exponential backoff |
| `500` | `ServerError` | "Có lỗi hệ thống. Vui lòng thử lại." | Show retry button |
| `503` | `Interview.RealtimeUnavailable` | "Tính năng phỏng vấn realtime hiện chưa khả dụng." | Show maintenance state |
| `503` | `ServiceUnavailable` | "Dịch vụ realtime AI hiện tạm thời không khả dụng." | Show maintenance state |

### Quy tắc bắt buộc:

```
❌ Không hiện stack trace trong UI
❌ Không hiện raw Python/provider error trong UI
❌ Không log clientSecret trong error log
✅ Luôn log requestId từ meta để debug
```

---

## 28. REALTIME DISABLED / CONFIG BEHAVIOR

### Khi backend tắt tính năng realtime:

```json
"AiServices": {
  "InterviewRealtimeEnabled": false
}
```

→ `/realtime/start` trả về `503 Service Unavailable`

### Frontend message:

> **"Tính năng phỏng vấn realtime hiện chưa khả dụng. Vui lòng thử lại sau hoặc sử dụng chế độ phỏng vấn văn bản."**

### Local backend config cần có:

```json
{
  "AiServices": {
    "InterviewRealtimeEnabled": true,
    "InterviewRealtimeBaseUrl": "http://localhost:8002",
    "InterviewRealtimeTokenTtlSeconds": 600
  }
}
```

### Staging/Production lưu ý:

- `connectUrl` phải là public HTTPS/WSS để browser reach được
- `localhost` connectUrl từ server không work cho remote frontend users
- Realtime provider connection cần HTTPS secure context (ngoại lệ: localhost)

---

## 29. BUSINESS RULES PHASE 5

| Rule | Chi tiết |
|------|---------|
| Mode | User tạo interview với `mode="voice"` |
| clientSecret once | `/realtime/start` chỉ trả `clientSecret` lần đầu |
| Active blocks complete | Realtime session còn active → `/complete` bị block |
| Order | `end` → `finalize` → `complete` (thứ tự bắt buộc) |
| Finalize with no answers | Trả `canComplete=false` |
| Complete requires answers | Cần ít nhất 1 saved answer |
| Finalize idempotent | An toàn gọi nhiều lần |
| Duplicate questionNumber | Backend skip, không duplicate |
| GET realtime no secret | GET realtime không bao giờ trả `clientSecret` |
| No internal endpoints | Internal endpoints chỉ dành cho Python service |
| Manual fallback | Cho phép manual transcript/Q&A review trong dev nếu realtime client chưa hoàn thiện |

---

## 30. FALLBACK STRATEGY KHI WEBRTC CHƯA HOÀN THIỆN

Nếu WebRTC/WebSocket adapter chưa hoàn thiện trong lần đầu:

### Vẫn phải implement đủ API flow:

```
create → realtime/start → realtime/end → realtime/finalize → complete
```

### Không được:
- Fake report
- Fake backend response
- Skip `/realtime/end` hoặc `/realtime/finalize`

### Được phép:

1. Hiển thị: **"Realtime client integration pending — Provider connection not yet implemented"**
2. Dùng **manual transcript/Q&A form** trong dev để test `/finalize` và `/complete`:

```
Manual form fields:
- Transcript text (textarea)
- Q/A pairs (có thể add/remove)
  - questionNumber
  - questionText
  - answerText
  - questionType (select)
  - difficulty (select)
```

> Manual form **chỉ để dev/test Phase 5 API flow**, không được đưa vào production build.

### Recommended flag:

```typescript
const IS_MANUAL_MODE = import.meta.env.DEV && import.meta.env.VITE_VOICE_MANUAL_MODE === 'true';
```

---

## 31. FLOW SUMMARY TOÀN BỘ PHASE 5

```
1.  User mở /interview/voice/new
2.  Frontend check mic permission
3.  User điền form và submit
4.  POST /api/v1/interviews (mode="voice")
    → Lưu interviewId
5.  POST /api/v1/interviews/{id}/realtime/start
    → Lưu connectUrl, clientSecret (memory only), instructions, expiresAt
6.  Bắt đầu expiry countdown timer
7.  Connect provider:
    - provider=openai → OpenAI WebRTC/SDP flow
    - provider=gemini → Show unsupported (Phase 5)
    - provider=other  → Show unsupported
8.  UI state → 'Live'
9.  Transcript builder thu thập events từ Data Channel
10. User bấm "Kết thúc cuộc gọi"
11. Dừng mic tracks, đóng RTCPeerConnection
12. POST /api/v1/interviews/{id}/realtime/end (reason="user_ended")
13. Xóa clientSecret khỏi memory
14. Navigate sang /interview/voice/:id/review
15. Hiển thị transcript + Q/A pairs (editable)
16. User confirm/edit Q/A pairs
17. POST /api/v1/interviews/{id}/realtime/finalize
    - Nếu canComplete=true → Enable "Chấm điểm" button
    - Nếu canComplete=false → Show warning, cho sửa lại
18. POST /api/v1/interviews/{id}/complete
19. Navigate sang /interview/voice/:id/report
20. Render report từ data.report
```

---

## 32. TEST CHECKLIST

### Create / Start:

- [ ] Create interview gửi `mode="voice"`
- [ ] Realtime start gửi `mode`, `aiModel`, `voice`, `language`, `enableTranscript=true`
- [ ] Start response lưu `connectUrl`/`clientSecret`/`instructions` vào memory (không localStorage)
- [ ] `clientSecret` không được log ra console
- [ ] `clientSecret` không xuất hiện trong Redux DevTools / React DevTools state tree
- [ ] Start idempotent với `clientSecret=null` được xử lý đúng (không crash)
- [ ] Expiry countdown timer chạy đúng từ `expiresAt`

### Mic permission:

- [ ] Mic check xảy ra TRƯỚC khi gọi `/realtime/start`
- [ ] Mic denied → hiện thông báo tiếng Việt đúng, không gọi provider
- [ ] Mic NotFoundError → hiện thông báo đúng
- [ ] Browser unsupported → hiện thông báo đúng

### Provider connection (OpenAI):

- [ ] RTCPeerConnection được tạo
- [ ] getUserMedia audio track được add
- [ ] SDP offer được POST tới `connectUrl` với header `Authorization: Bearer <clientSecret>`
- [ ] Content-Type: `application/sdp` trong POST
- [ ] SDP answer được parse là raw text, không JSON.parse
- [ ] `pc.setRemoteDescription` được gọi với SDP answer
- [ ] Connection state `connected` → UI state chuyển sang `'Live'`
- [ ] Connection fail → UI state chuyển sang `'Error'`

### Provider connection (Gemini):

- [ ] Provider=gemini → hiện "chưa được hỗ trợ", không fake connect

### Transcript builder:

- [ ] `response.audio_transcript.done` → tạo `questionText`
- [ ] `conversation.item.input_audio_transcription.completed` → tạo `answerText`
- [ ] Pairs với `answerText` rỗng không được tính là valid
- [ ] `questionNumber` tăng đúng thứ tự từ 1

### End / Finalize:

- [ ] End call dừng mic tracks (`getTracks().forEach(t => t.stop())`)
- [ ] POST `/realtime/end` được gọi với `realtimeSessionId` và `reason`
- [ ] `clientSecret` bị xóa khỏi memory sau end
- [ ] Transcript review page hiển thị đúng
- [ ] Finalize gửi `realtimeSessionId`/`transcriptText`/`qaPairs`
- [ ] Finalize idempotent response không duplicate UI
- [ ] `canComplete=false` → không hiện nút Complete, hiện warning
- [ ] Disable finalize button khi loading

### Complete / Report:

- [ ] Complete bị block khi realtime vẫn active → hiện đúng error
- [ ] Complete bị block khi chưa finalize → hiện đúng error
- [ ] Complete sau finalize thành công → sinh report
- [ ] Report render đúng tất cả typed arrays (không JSON.parse thủ công)
- [ ] `overallScore`, `strengths[]`, `feedbackItems[]` hiển thị đúng

### GET Realtime / Debug:

- [ ] GET `/realtime` không expose `clientSecret`
- [ ] Debug events hiển thị đúng (nếu có debug panel)

### Security:

- [ ] Không có `X-Interviet-Api-Key` trong frontend code hoặc `.env`
- [ ] Không có provider API key trong frontend
- [ ] `clientSecret` không persist sau page reload
- [ ] `clientSecret` không xuất hiện trong network requests (ngoại trừ POST SDP tới `connectUrl`)

### Errors:

- [ ] 401 → redirect `/login`
- [ ] 403 Quota.Exceeded → show upgrade CTA
- [ ] 400 RealtimeNotFinalized → show finalize guidance
- [ ] 400 NoAnswers → show transcript/Q&A required
- [ ] 503 RealtimeUnavailable → show feature unavailable
- [ ] 429 → show retry later
- [ ] Provider error event → friendly message, không expose raw error

### Candidate-only:

- [ ] Không có employer/recruiter UI

---

## 33. ACCEPTANCE CRITERIA

Phase 5 chỉ được coi là **PASS** khi toàn bộ các điều kiện sau được thỏa mãn:

| # | Criteria | Pass/Fail |
|---|----------|-----------|
| 1 | Voice interview create gọi API thật với `mode="voice"` | |
| 2 | Realtime start gọi API thật | |
| 3 | `connectUrl`/`clientSecret`/`instructions` nhận từ backend thật | |
| 4 | `clientSecret` chỉ giữ trong memory | |
| 5 | `clientSecret` không log | |
| 6 | `clientSecret` không lưu localStorage/sessionStorage | |
| 7 | End realtime gọi API thật | |
| 8 | Finalize realtime gọi API thật | |
| 9 | Finalize `qaPairs` map vào questions/answers thật | |
| 10 | Complete sau finalize gọi API thật | |
| 11 | Report render từ backend response thật | |
| 12 | Active realtime blocks complete được handle đúng | |
| 13 | `canComplete=false` được handle đúng, không gọi `/complete` | |
| 14 | GET realtime debug không phụ thuộc `clientSecret` | |
| 15 | Không gọi internal endpoints | |
| 16 | Không expose `X-Interviet-Api-Key` | |
| 17 | Không gọi Python generate/analyze trực tiếp | |
| 18 | Không fake report | |
| 19 | Không tạo employer/recruiter | |
| 20 | Loading / empty / error states đầy đủ | |
| 21 | Build/lint pass | |

---

## 34. DELIVERABLES CẦN BÁO LẠI

Sau khi hoàn thành Phase 5, Frontend dev báo lại:

```
Files tạo mới: [list]
Files sửa: [list]
Realtime service: src/services/interviewRealtimeService.ts
Provider adapter: src/lib/realtime/openAiWebRtcClient.ts
Transcript builder: src/lib/realtime/transcriptBuilder.ts
Voice setup route: /interview/voice/new
Voice live route: /interview/voice/:id/live
Transcript review route: /interview/voice/:id/review
Report route: /interview/voice/:id/report
clientSecret storage: useRef (memory only)
OpenAI WebRTC: done / pending
Gemini WebSocket: out of scope Phase 5
Manual transcript fallback: có / không
End/finalize/complete flow test: [mô tả]
Security checklist: pass / fail / partial
Test checklist: X/33 pass
Build/lint: pass / fail
Known issues: [list nếu có]
```

---

## 35. KHÔNG ĐƯỢC LÀM TRONG PHASE 5

```
❌ Auth
❌ CV/JD/Matching
❌ Payment gateway
❌ Employer/Recruiter UI
❌ Gọi Python generate/analyze trực tiếp
❌ Gọi internal callback endpoints
❌ Expose X-Interviet-Api-Key
❌ Hardcode OpenAI/Gemini API key
❌ Lưu clientSecret localStorage/sessionStorage
❌ Log clientSecret
❌ Fake transcript (nếu user không có transcript/Q&A)
❌ Fake report
❌ Tự chấm điểm
❌ Sửa backend
```

---

*Tài liệu này đầy đủ 100% để Frontend implement Phase 5 Realtime Voice Interview.*  
*Mọi thắc mắc về SDP format, event format, hoặc provider behavior → liên hệ Backend team với `requestId` cụ thể để debug.*
