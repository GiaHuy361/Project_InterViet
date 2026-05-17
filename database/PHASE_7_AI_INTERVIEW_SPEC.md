# PHASE 7 — AI INTERVIEW FOUNDATION SPEC

**Project:** INTER-VIET  
**Phase:** Phase 7 - AI Interview Foundation  
**Date:** 2026-05-09  
**Status:** Ready for Implementation

---

## 📋 1. MÀN INTERVIEW AI HIỆN TẠI TRONG MOCKTEST

UI mocktest có **4 screens** cho Interview AI flow:

| Screen | Route | Mục đích |
|--------|-------|----------|
| **Interview Setup** | `/phong-van-setup` | Thiết lập cấu hình: vị trí, level, mục tiêu, thời lượng, AI model, nhà tuyển dụng |
| **Interview Pre-Call** | `/phong-van-pre-call` | Kiểm tra microphone, audio, internet trước khi bắt đầu |
| **Interview Live** | `/phong-van-live` | Phỏng vấn trực tiếp với AI voice, transcript real-time |
| **Interview Report** | `/phong-van-report/:id` | **⚠️ Chưa implement** - Báo cáo chi tiết sau phỏng vấn |

### Reports/Dashboard hiển thị:
- Dashboard có widget "Recent Interviews"
- Reports page `/bao-cao` hiển thị danh sách interview reports
- Mỗi report có: score, position, level, type, duration, createdAt

---

## 🔄 2. USER FLOW CHUẨN

### Flow đầy đủ:

```
Dashboard/Menu
  ↓ Click "Phỏng vấn AI"
InterviewSetupPage
  ↓ User chọn đầy đủ config
  ↓ Click "Tiếp tục"
InterviewPreCallPage
  ↓ Kiểm tra microphone
  ↓ Click "Bắt đầu phỏng vấn"
InterviewLivePage
  ↓ Phỏng vấn voice real-time
  ↓ Click "Kết thúc & tạo báo cáo"
Processing Screen (3s)
  ↓ AI analyze transcript
ReportsPage (redirect to `/bao-cao`)
  ↓ User click vào 1 report
InterviewReportPage `/phong-van-report/:id`
  ↓ Xem chi tiết
```

### **Bắt buộc chọn CV không?**

❌ **KHÔNG** - UI không yêu cầu user chọn CV hoặc JD trước khi phỏng vấn.

Interview AI hoàn toàn độc lập, chỉ cần:
- Chọn **vị trí** (position)
- Chọn **cấp độ** (level)
- Chọn **mục tiêu** (goal: reflection/STAR/confidence)
- Chọn **thời lượng** (duration)
- Chọn **AI model**
- Chọn **interviewer mode**

### **Bắt buộc chọn JD không?**

❌ **KHÔNG** - UI không liên kết với JD. Interview AI generate câu hỏi dựa trên:
- Position selected
- Level selected
- Interviewer mode (HR basic, HR strict, Tech Lead, etc.)

### **Có cho chọn match result đã có sẵn không?**

❌ **KHÔNG** - UI hiện tại không link interview với CV/JD match results.

**Đề xuất:** Phase 7 chỉ làm **generic interview** (không link CV/JD). Phase 8 có thể làm "Interview based on CV-JD match" nếu cần.

### **User tạo interview session xong thì vào màn hỏi đáp ngay hay chờ AI generate câu hỏi trước?**

✅ **VÀO NGAY** - Flow:
1. Setup page → chọn config → Click "Tiếp tục"
2. Pre-call page → test mic → Click "Bắt đầu"
3. **Live page mở ngay**, AI nói lời chào đầu tiên trong 1s

AI **KHÔNG generate toàn bộ câu hỏi trước**, mà **hỏi từng câu theo câu trả lời** của user.

---

## 🎯 3. CÁC LOẠI PHỎNG VẤN UI ĐANG SUPPORT

UI mocktest có **6 loại Interviewer Mode:**

| Interviewer Mode | Icon | Mô tả | Premium | Đề xuất Phase 7 |
|------------------|------|-------|---------|-----------------|
| **HR cơ bản** | 👔 | Nhà tuyển dụng thân thiện, câu hỏi cơ bản | ❌ Free | ✅ Làm |
| **HR khó tính** | 🎯 | Stress-test với câu hỏi khó, chi tiết | ✅ Premium | ✅ Làm |
| **Trưởng phòng kỹ thuật** | 💻 | Tập trung vào kỹ năng chuyên môn sâu | ✅ Premium | ✅ Làm |
| **Nhà tuyển dụng startup** | 🚀 | Linh hoạt, tập trung vào tư duy sáng tạo | ✅ Premium | ⚠️ Có thể skip |
| **Nhà tuyển dụng tập đoàn** | 🏢 | Chuyên nghiệp, quy trình chặt chẽ | ✅ Premium | ⚠️ Có thể skip |
| **Phỏng vấn chuyên sâu** | 🎓 | Câu hỏi chuyên ngành, case study thực tế | ✅ Premium | ⚠️ Có thể skip |

### **Đề xuất Phase 7:**

Làm **3 loại chính đầu tiên** đủ để MVP:
1. **HR cơ bản** (Free) - Behavioral questions
2. **HR khó tính** (Premium) - Stress-test behavioral
3. **Trưởng phòng kỹ thuật** (Premium) - Technical questions

3 loại còn lại (Startup/Corporate/Specialized) có thể để Phase 8.

### **Mapping backend key:**

```csharp
public enum InterviewerMode
{
    BasicHR = 0,         // HR cơ bản - free
    StrictHR = 1,        // HR khó tính - premium
    TechLead = 2,        // Tech Lead - premium
    Startup = 3,         // Startup - premium (Phase 8)
    Corporate = 4,       // Corporate - premium (Phase 8)
    Specialized = 5      // Specialized - premium (Phase 8)
}
```

---

## 📊 4. INTERVIEW SESSION CẦN HIỂN THỊ NHỮNG TRẠNG THÁI NÀO

### UI mocktest đang dùng status:

UI **KHÔNG hiển thị trạng thái rõ ràng** trong danh sách sessions. Chỉ có:
- Interview reports (completed)
- Current live session (in-progress)

### **Backend nên implement statuses:**

```csharp
public enum InterviewSessionStatus
{
    Draft = 0,          // User tạo config nhưng chưa start (chưa cần trong Phase 7)
    InProgress = 1,     // Đang phỏng vấn live
    Completed = 2,      // Hoàn thành, đã có report
    Abandoned = 3,      // User thoát giữa chừng (exit button)
    Failed = 4          // Technical error (optional Phase 7)
}
```

### **Phase 7 chỉ cần:**
- `InProgress` - Session đang live
- `Completed` - Session đã xong, có report
- `Abandoned` - User exit giữa chừng

---

## 💬 5. AI SẼ HỎI THEO KIỂU NÀO

### **Một lần generate danh sách câu hỏi trước?**

❌ **KHÔNG** - UI mocktest cho thấy AI **hỏi từng câu theo câu trả lời user**.

### **Hỏi từng câu theo câu trả lời của user?**

✅ **CÓ** - Flow:
1. AI nói lời chào đầu tiên
2. User trả lời (voice → transcript)
3. AI phân tích câu trả lời
4. AI generate câu hỏi tiếp theo **dựa trên context**
5. Lặp lại cho đến hết thời gian hoặc user kết thúc

### **Có cần follow-up question không?**

✅ **CÓ** - AI có thể hỏi follow-up dựa trên câu trả lời user.

Example từ UI mocktest:
```
AI: "Bạn có thể kể thêm về một dự án mà bạn tự hào nhất không?"
User: "Dự án tôi tự hào nhất là..."
AI: "Tôi hiểu rồi. Bạn đã học được gì từ những thử thách đó?" ← Follow-up
```

### **Có cần chấm điểm từng câu không?**

⚠️ **TÙY CHỌN** - UI mocktest **không hiển thị** score từng câu trong live screen, chỉ có:
- Overall score sau khi kết thúc
- Communication/Technical/Confidence scores

**Phase 7:** Có thể skip scoring từng câu, chỉ score overall sau khi hoàn thành.

### **Có cần transcript không?**

✅ **CÓ** - UI có real-time transcript trong InterviewLivePage.

Backend cần lưu:
- Full conversation transcript
- Timestamp từng message
- Role (AI vs User)

---

## 🎤 6. USER TRẢ LỜI BẰNG GÌ

### UI mocktest support:

✅ **VOICE/AUDIO** - UI đã có:
- Microphone permission check
- Audio visualization (waveform animation)
- Real-time voice detection
- Transcript hiển thị real-time

### **Phase 7 nên làm gì?**

**Option A: Text-only prototype (nhanh)**
- User type câu trả lời
- AI trả lời bằng text
- Skip voice processing
- **Ưu điểm:** Nhanh, dễ test, không cần OpenAI Whisper
- **Nhược điểm:** Không match UI mocktest

**Option B: Voice-to-text + Text-to-speech (đầy đủ)**
- User nói → OpenAI Whisper → text
- AI response text → Azure TTS/ElevenLabs → voice
- **Ưu điểm:** Match UI mocktest 100%
- **Nhược điểm:** Phức tạp, cần integrate nhiều services

**Option C: Voice-to-text only (hybrid)**
- User nói → OpenAI Whisper → text
- AI response bằng TEXT (không có voice)
- **Ưu điểm:** Balance giữa complexity và UX
- **Nhược điểm:** UI có animation voice nhưng không có audio thật

### **ĐỀ XUẤT CHO PHASE 7:**

✅ **Option C - Voice-to-text only**

**Lý do:**
- UI mocktest đã có voice input UI → nên support voice input
- Voice output (TTS) có thể để Phase 8
- Phase 7 focus vào core: Speech-to-text → AI → Scoring

**Backend Phase 7 cần:**
```
User speaks → Frontend record audio → POST /api/v1/interviews/{id}/answer
  → Backend upload to Azure Blob
  → Call Python AI service for transcription (OpenAI Whisper)
  → Python returns transcript
  → Call LLM for AI response
  → Return text response + next question
```

### **Video?**

❌ **KHÔNG** - UI không có video, Phase 7 không cần làm.

---

## 📈 7. MÀN KẾT QUẢ CẦN NHỮNG CHỈ SỐ NÀO

### UI mocktest đang có (trong InterviewReport interface):

```typescript
interface InterviewReport {
  id: string;
  position: string;      // "Software Engineer"
  level: string;         // "Junior"
  type: string;          // "HR cơ bản"
  score: number;         // 65-95
  createdAt: Date;       // Timestamp
  duration: number;      // Minutes
}
```

### **UI mocktest CHI TIẾT hơn cần gì:**

Dựa trên dialog "Upgrade Modal" trong InterviewSetupPage, UI mong đợi:

| Chỉ số | Hiển thị trong UI | Backend field |
|--------|-------------------|---------------|
| **Overall score** | ✅ Main score | `overallScore` (0-100) |
| **Communication score** | ✅ "Phân tích kỹ năng giao tiếp" | `communicationScore` |
| **Technical score** | ✅ "Kỹ năng chuyên môn" | `technicalScore` |
| **Confidence score** | ✅ Mentioned | `confidenceScore` |
| **Strengths** | ✅ "Điểm mạnh" | `strengths[]` |
| **Weaknesses** | ✅ "Điểm yếu" | `weaknesses[]` |
| **Improvement tips** | ✅ "Nhận xét từ nhà tuyển dụng" | `improvementTips[]` |
| **Progress comparison** | ✅ "So sánh tiến bộ qua nhiều buổi" | Computed from multiple reports |
| **Question-by-question feedback** | ⚠️ Chưa rõ trong UI | Optional `questionFeedbacks[]` |

### **Suggested answers?**

⚠️ **Chưa thấy trong UI** - Phase 7 có thể skip.

### **Experience score?**

⚠️ **Chưa thấy trong UI** - Phase 7 có thể dùng `technicalScore` thay thế.

---

## 🔢 8. QUOTA PHASE 7 CẦN MAP THẾ NÀO

### **Feature key backend đã có:**

```
interview.ai (hoặc InterviewSessionsLimit trong SubscriptionPlans)
```

### **Quota theo từng gói (từ UI mocktest):**

| Gói | Quota | Đơn vị | Reset |
|-----|-------|--------|-------|
| **Free** | 1 | Per day | 00:00 hàng ngày |
| **Monthly** | 1 | Per day | 00:00 hàng ngày |
| **Quarterly** | 3 | Per day | 00:00 hàng ngày |
| **Yearly** | UNLIMITED | - | Không reset |

**Source:** `subscriptionLimits.ts`
```typescript
case 'free':
  return {
    interviewsDaily: 1,
    ...
  };
case 'monthly':
  return {
    interviewsDaily: 1,  // ⚠️ Giống free
    ...
  };
case 'quarterly':
  return {
    interviewsDaily: 3,
    ...
  };
case 'yearly':
  return {
    interviewsDaily: 'unlimited',
    ...
  };
```

### **Mapping vào database:**

#### **SubscriptionPlans table:**

| PlanCode | InterviewSessionsLimit | InterviewMinutesLimit |
|----------|------------------------|----------------------|
| FREE | 1 | 30 (tổng phút/ngày) |
| MONTHLY | 1 | 30 |
| QUARTERLY | 3 | 90 (3 sessions × 30 mins) |
| YEARLY | -1 (unlimited) | -1 (unlimited) |

#### **UsageTracking table:**

Thêm fields:
```sql
InterviewSessionsUsed INT NOT NULL DEFAULT 0,
InterviewMinutesUsed INT NOT NULL DEFAULT 0,
LastInterviewResetDate DATETIME2
```

### **Business logic:**

```csharp
// Check quota before creating session
var canUse = await CheckFeatureLimit(userId, "interview-session");
if (!canUse) {
    return Forbid("Bạn đã hết lượt phỏng vấn hôm nay");
}

// After session ends, update usage
await UpdateUsage(userId, "interview-session", sessionDurationMinutes);
```

---

## 🔌 9. BACKEND API CẦN TRẢ NHỮNG DATA NÀO

### **Danh sách interview sessions:**

```http
GET /api/v1/interviews
```

**Response:**
```json
{
  "sessions": [
    {
      "sessionId": "guid",
      "position": "Software Engineer",
      "level": "Junior",
      "interviewerMode": "HR cơ bản",
      "status": "completed",
      "overallScore": 78.5,
      "duration": 12,
      "createdAt": "2026-05-09T10:30:00Z",
      "completedAt": "2026-05-09T10:42:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 45
  }
}
```

### **Interview detail:**

```http
GET /api/v1/interviews/{sessionId}
```

**Response:**
```json
{
  "sessionId": "guid",
  "userId": "guid",
  "position": "Software Engineer",
  "level": "Junior",
  "goal": "Cải thiện phản xạ",
  "duration": 12,
  "interviewerMode": "HR cơ bản",
  "aiModel": "GPT-4o mini",
  "status": "completed",
  "startedAt": "2026-05-09T10:30:00Z",
  "completedAt": "2026-05-09T10:42:00Z",
  "overallScore": 78.5,
  "communicationScore": 82.0,
  "technicalScore": 75.0,
  "confidenceScore": 80.0,
  "strengths": [
    "Trả lời rõ ràng, có cấu trúc",
    "Sử dụng ví dụ cụ thể tốt",
    "Thể hiện sự tự tin"
  ],
  "weaknesses": [
    "Có thể thêm metrics vào câu trả lời",
    "Nên đào sâu hơn về impact"
  ],
  "improvementTips": [
    "Luyện tập cấu trúc STAR nhiều hơn",
    "Chuẩn bị thêm stories về leadership"
  ],
  "transcript": [
    {
      "messageId": "guid",
      "role": "ai",
      "text": "Xin chào! Tôi là HR cơ bản...",
      "timestamp": "2026-05-09T10:30:15Z"
    },
    {
      "messageId": "guid",
      "role": "user",
      "text": "Tôi có hơn 3 năm kinh nghiệm...",
      "timestamp": "2026-05-09T10:31:20Z",
      "audioUrl": "https://storage.../audio1.mp3"
    }
  ],
  "questionFeedbacks": [
    {
      "questionId": "guid",
      "questionText": "Bạn có thể giới thiệu về bản thân?",
      "answerText": "Tôi có hơn 3 năm kinh nghiệm...",
      "answerScore": 80.0,
      "feedback": "Câu trả lời tốt, có cấu trúc. Nên thêm về motivation."
    }
  ]
}
```

### **Question item:**

```json
{
  "questionId": "guid",
  "sessionId": "guid",
  "questionNumber": 1,
  "questionType": "behavioral",
  "questionText": "Bạn có thể giới thiệu về bản thân?",
  "askedAt": "2026-05-09T10:30:15Z"
}
```

### **Answer item:**

```json
{
  "answerId": "guid",
  "questionId": "guid",
  "answerText": "Tôi có hơn 3 năm kinh nghiệm...",
  "audioUrl": "https://storage.../audio1.mp3",
  "audioDurationSeconds": 45,
  "answerScore": 80.0,
  "feedback": "Câu trả lời tốt...",
  "clarityScore": 85.0,
  "relevanceScore": 78.0,
  "completenessScore": 82.0,
  "answeredAt": "2026-05-09T10:31:20Z"
}
```

### **Result/feedback:**

Đã bao gồm trong `GET /api/v1/interviews/{sessionId}` ở trên.

---

## ❌ 10. NHỮNG PHẦN NÀO KHÔNG LÀM Ở PHASE 7

### **KHÔNG LÀM:**

1. ❌ **Phỏng vấn với mentor/người thật** - Đây là feature riêng (Phase 8+)
2. ❌ **Video call thật** - UI không có video, chỉ có voice
3. ❌ **Payment gateway** - Đã có ở Phase 5
4. ❌ **Lịch đặt mentor** - Feature riêng, không liên quan AI interview
5. ❌ **Live speech-to-text realtime** - Phase 7 có thể dùng batch transcription (user nói xong → transcribe)
6. ❌ **Text-to-speech (TTS)** - AI response bằng text, không cần voice output
7. ❌ **Interviewer modes 4-6** - Chỉ làm 3 modes chính (HR basic, HR strict, Tech Lead)
8. ❌ **CV/JD integration** - Interview AI độc lập, không cần link với CV/JD
9. ❌ **Suggested answers** - UI không có, Phase 7 skip
10. ❌ **Question-by-question scoring trong live screen** - Chỉ score overall sau khi kết thúc
11. ❌ **Interview templates/presets** - User tự chọn config, không có templates
12. ❌ **Multi-user interview** - Chỉ 1-on-1 (User vs AI)
13. ❌ **Interview recording playback** - Chỉ có transcript, không playback audio
14. ❌ **Advanced analytics** - Phase 7 chỉ có basic scores
15. ❌ **Progress comparison charts** - Để Phase 8

---

## 📄 11. BACKEND-READY SPEC

### **PHASE 7 GOAL**

Xây dựng nền tảng Interview AI cho phép user:
1. Thiết lập cấu hình phỏng vấn (vị trí, level, loại)
2. Phỏng vấn voice với AI (speech-to-text)
3. Nhận câu hỏi follow-up từ AI dựa trên câu trả lời
4. Kết thúc và nhận báo cáo chi tiết (scores + feedback)

**Out of scope:** Video, TTS, mentor booking, CV/JD integration

---

### **USER STORIES**

#### **US-1: User tạo interview session**

**As a** user  
**I want to** thiết lập cấu hình phỏng vấn AI  
**So that** tôi có thể luyện tập phỏng vấn cho vị trí mong muốn

**Acceptance Criteria:**
- ✅ User chọn position (8 options, 2 free + 6 premium)
- ✅ User chọn level (4 options: intern/junior free, mid/senior premium)
- ✅ User chọn goal (reflection/STAR free, confidence premium)
- ✅ User chọn duration (5/10 phút free, 20 phút premium)
- ✅ User chọn AI model (GPT-4o mini/3.5 free, others premium)
- ✅ User chọn interviewer mode (HR basic free, others premium)
- ✅ System kiểm tra quota (Free: 1/day, Quarterly: 3/day, Yearly: unlimited)
- ✅ Nếu hết quota → hiển thị upgrade modal
- ✅ Nếu OK → navigate to pre-call page

#### **US-2: User kiểm tra microphone**

**As a** user  
**I want to** kiểm tra microphone trước khi bắt đầu  
**So that** phỏng vấn không bị gián đoạn do technical issues

**Acceptance Criteria:**
- ✅ System request microphone permission
- ✅ User test mic → audio visualization
- ✅ System check internet connection
- ✅ Hiển thị status: mic (granted/denied), internet (good/poor)
- ✅ Nếu mic denied → không cho start
- ✅ Nếu OK → navigate to live interview

#### **US-3: User phỏng vấn với AI**

**As a** user  
**I want to** trả lời câu hỏi AI bằng voice  
**So that** tôi có thể luyện tập speaking skills

**Acceptance Criteria:**
- ✅ AI tự động nói lời chào đầu tiên trong 1s
- ✅ User nói câu trả lời (voice)
- ✅ System transcribe voice → text (OpenAI Whisper)
- ✅ Display transcript real-time
- ✅ AI generate câu hỏi tiếp theo dựa trên context
- ✅ Lặp lại cho đến user click "Kết thúc"
- ✅ Timer hiển thị thời gian thực

#### **US-4: User kết thúc và nhận báo cáo**

**As a** user  
**I want to** kết thúc phỏng vấn và nhận báo cáo  
**So that** tôi biết điểm mạnh/yếu và cách cải thiện

**Acceptance Criteria:**
- ✅ User click "Kết thúc & tạo báo cáo"
- ✅ System show processing screen (3s)
- ✅ Python AI analyze full transcript
- ✅ Return: overallScore, communicationScore, technicalScore, confidenceScore
- ✅ Return: strengths[], weaknesses[], improvementTips[]
- ✅ Update usage tracking (+1 session)
- ✅ Save interview report to database
- ✅ Navigate to Reports page

#### **US-5: User xem lịch sử interview**

**As a** user  
**I want to** xem lại các buổi phỏng vấn đã làm  
**So that** tôi có thể theo dõi tiến bộ

**Acceptance Criteria:**
- ✅ GET `/api/v1/interviews` trả về list sessions
- ✅ Hiển thị: position, score, duration, date
- ✅ User click vào 1 session → navigate to detail
- ✅ Detail hiển thị: full transcript, scores, feedback

---

### **SCREENS**

#### **Screen 1: Interview Setup**
- **Route:** `/phong-van-setup`
- **Components:**
  - Position dropdown (8 options)
  - Level dropdown (4 options)
  - Goal buttons (3 options)
  - Duration buttons (3 options)
  - AI Model dropdown (7 options)
  - Interviewer Mode cards (6 options)
  - Summary card
  - "Tiếp tục" button
- **API calls:** None (pure frontend)
- **State:** Lưu config vào sessionStorage

#### **Screen 2: Pre-Call Check**
- **Route:** `/phong-van-pre-call`
- **Components:**
  - Interview summary card
  - System check list (Internet, Mic, Audio)
  - Mic test button + audio visualization
  - Tips card
  - "Bắt đầu phỏng vấn" button
- **API calls:**
  ```
  POST /api/v1/interviews/check-quota (check before start)
  POST /api/v1/interviews (create session)
  ```

#### **Screen 3: Live Interview**
- **Route:** `/phong-van-live`
- **Components:**
  - Header: interviewer info, timer
  - Left panel: AI avatar + audio visualization
  - Right panel: real-time transcript
  - Bottom bar: "Kết thúc & tạo báo cáo" button
- **API calls:**
  ```
  POST /api/v1/interviews/{id}/start (when enter screen)
  POST /api/v1/interviews/{id}/messages (send each user answer)
  POST /api/v1/interviews/{id}/complete (when click end)
  ```

#### **Screen 4: Processing**
- **Route:** Same as Live Interview (modal overlay)
- **Components:**
  - Animated processing card
  - Progress indicators
- **API calls:**
  ```
  Waiting for Python AI callback with analysis results
  ```

#### **Screen 5: Interview Report (NEW)**
- **Route:** `/phong-van-report/:id`
- **Components:**
  - Header: position, level, date, duration
  - Overall score badge
  - Score breakdown (communication, technical, confidence)
  - Strengths section
  - Weaknesses section
  - Improvement tips section
  - Full transcript (collapsible)
  - Export PDF button (premium)
- **API calls:**
  ```
  GET /api/v1/interviews/{id}
  ```

---

### **API MAPPING ĐỀ XUẤT**

#### **C# Backend APIs:**

```
POST   /api/v1/interviews/check-quota
  → Check if user can start interview
  Response: { canUse: true, remaining: 2 }

POST   /api/v1/interviews
  → Create interview session
  Request:
  {
    "position": "Software Engineer",
    "level": "Junior",
    "goal": "reflection",
    "duration": 10,
    "interviewerMode": "basic-hr",
    "aiModel": "gpt-4o-mini"
  }
  Response:
  {
    "sessionId": "guid",
    "status": "in_progress",
    "createdAt": "2026-05-09T10:30:00Z"
  }

POST   /api/v1/interviews/{id}/start
  → Start interview (trigger Python AI for first question)
  Response:
  {
    "firstQuestion": {
      "questionId": "guid",
      "questionText": "Xin chào! Bạn có thể giới thiệu về bản thân?",
      "questionType": "behavioral"
    }
  }

POST   /api/v1/interviews/{id}/messages
  → User submit answer (voice or text)
  Request:
  {
    "questionId": "guid",
    "answerText": "Tôi có 3 năm kinh nghiệm...",
    "audioUrl": "https://storage.../audio1.mp3" (optional),
    "audioDurationSeconds": 45
  }
  Response:
  {
    "nextQuestion": {
      "questionId": "guid",
      "questionText": "Bạn có thể kể thêm về dự án...",
      "questionType": "follow-up"
    }
  }

POST   /api/v1/interviews/{id}/complete
  → End interview, trigger Python AI analysis
  Response:
  {
    "status": "processing",
    "estimatedTime": 3
  }
  → After processing:
  {
    "status": "completed",
    "reportUrl": "/phong-van-report/{id}"
  }

GET    /api/v1/interviews
  → List user's interview sessions
  Query params: status, page, pageSize

GET    /api/v1/interviews/{id}
  → Get interview detail with full transcript and scores

DELETE /api/v1/interviews/{id}
  → Delete interview session (optional)

GET    /api/v1/interviews/stats
  → Get user's interview statistics for dashboard
  Response:
  {
    "totalSessions": 12,
    "averageScore": 78.5,
    "bestScore": 92.3,
    "totalMinutes": 180,
    "recentSessions": [...]
  }
```

#### **Python AI APIs:**

```
POST   /ai/interviews/generate-question
  → Generate first or next question
  Request:
  {
    "sessionId": "guid",
    "position": "Software Engineer",
    "level": "Junior",
    "interviewerMode": "basic-hr",
    "conversationHistory": [
      { "role": "ai", "text": "..." },
      { "role": "user", "text": "..." }
    ]
  }
  Response:
  {
    "questionId": "guid",
    "questionText": "Bạn có thể giới thiệu về bản thân?",
    "questionType": "behavioral",
    "expectedAnswerPoints": [
      "Background",
      "Experience",
      "Motivation"
    ]
  }

POST   /ai/interviews/transcribe
  → Transcribe user voice to text
  Request:
  {
    "audioUrl": "https://storage.../audio1.mp3"
  }
  Response:
  {
    "transcribedText": "Tôi có 3 năm kinh nghiệm...",
    "confidence": 0.95,
    "durationSeconds": 45
  }

POST   /ai/interviews/analyze
  → Analyze full interview transcript
  Request:
  {
    "sessionId": "guid",
    "position": "Software Engineer",
    "level": "Junior",
    "interviewerMode": "basic-hr",
    "transcript": [
      { "role": "ai", "text": "..." },
      { "role": "user", "text": "...", "audioUrl": "..." }
    ],
    "duration": 12
  }
  Response:
  {
    "overallScore": 78.5,
    "communicationScore": 82.0,
    "technicalScore": 75.0,
    "confidenceScore": 80.0,
    "strengths": [
      "Trả lời rõ ràng, có cấu trúc",
      "Sử dụng ví dụ cụ thể"
    ],
    "weaknesses": [
      "Có thể thêm metrics",
      "Nên đào sâu về impact"
    ],
    "improvementTips": [
      "Luyện tập STAR framework",
      "Chuẩn bị stories về leadership"
    ],
    "questionFeedbacks": [
      {
        "questionId": "guid",
        "answerScore": 80.0,
        "feedback": "Câu trả lời tốt..."
      }
    ]
  }
```

**Python AI then calls C# API:**
```
PATCH  /internal/interviews/{id}/results
  → Update interview results from Python
```

---

### **DATA FIELDS CẦN CÓ**

#### **Database Tables:**

**InterviewSessions:**
```sql
SessionId UNIQUEIDENTIFIER PRIMARY KEY,
UserId UNIQUEIDENTIFIER NOT NULL,
JDId UNIQUEIDENTIFIER NULL,  -- Optional, null trong Phase 7

Position NVARCHAR(200) NOT NULL,
Level NVARCHAR(50) NOT NULL,
Goal NVARCHAR(100),
Duration INT,  -- Expected duration in minutes
InterviewerMode NVARCHAR(50) NOT NULL,
AIModel NVARCHAR(100),

Status NVARCHAR(50) NOT NULL DEFAULT 'in_progress',
StartedAt DATETIME2 NOT NULL,
CompletedAt DATETIME2,
DurationSeconds INT,  -- Actual duration

OverallScore DECIMAL(5,2),
CommunicationScore DECIMAL(5,2),
TechnicalScore DECIMAL(5,2),
ConfidenceScore DECIMAL(5,2),

OverallFeedback NVARCHAR(MAX),
StrengthAreas NVARCHAR(MAX),  -- JSON array
ImprovementAreas NVARCHAR(MAX),  -- JSON array
ActionableAdvice NVARCHAR(MAX),  -- JSON array

CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
```

**InterviewQuestions:**
```sql
QuestionId UNIQUEIDENTIFIER PRIMARY KEY,
SessionId UNIQUEIDENTIFIER NOT NULL,
QuestionNumber INT NOT NULL,
QuestionType NVARCHAR(50),
QuestionText NVARCHAR(MAX) NOT NULL,
ExpectedAnswerPoints NVARCHAR(MAX),  -- JSON array
Difficulty NVARCHAR(50),
AskedAt DATETIME2 NOT NULL
```

**InterviewAnswers:**
```sql
AnswerId UNIQUEIDENTIFIER PRIMARY KEY,
QuestionId UNIQUEIDENTIFIER NOT NULL,
AnswerText NVARCHAR(MAX),
AudioFileUrl NVARCHAR(1000),
AudioDurationSeconds INT,

AnswerScore DECIMAL(5,2),
Feedback NVARCHAR(MAX),
ClarityScore DECIMAL(5,2),
RelevanceScore DECIMAL(5,2),
CompletenessScore DECIMAL(5,2),

PositivePoints NVARCHAR(MAX),  -- JSON array
NegativePoints NVARCHAR(MAX),  -- JSON array
Suggestions NVARCHAR(MAX),  -- JSON array

AnsweredAt DATETIME2 NOT NULL
```

---

### **QUOTA RULES**

```csharp
// SubscriptionPlans table
PlanCode   | InterviewSessionsLimit | InterviewMinutesLimit
-----------|------------------------|---------------------
FREE       | 1                      | 30
MONTHLY    | 1                      | 30
QUARTERLY  | 3                      | 90
YEARLY     | -1 (unlimited)         | -1 (unlimited)

// UsageTracking table
InterviewSessionsUsed INT,
InterviewMinutesUsed INT,
LastInterviewResetDate DATETIME2

// Reset logic
IF (TODAY > LastInterviewResetDate) THEN
  InterviewSessionsUsed = 0
  InterviewMinutesUsed = 0
  LastInterviewResetDate = TODAY
END IF

// Check before create session
IF (InterviewSessionsUsed >= InterviewSessionsLimit) THEN
  RETURN 403 Forbidden "Bạn đã hết lượt phỏng vấn hôm nay"
END IF

// After session completes
InterviewSessionsUsed += 1
InterviewMinutesUsed += actualDurationMinutes
```

---

### **ACCEPTANCE CRITERIA**

#### **Functional:**

- ✅ Free user có thể tạo 1 interview/day với HR basic mode
- ✅ Premium user có thể tạo unlimited interviews (Yearly) hoặc 3/day (Quarterly)
- ✅ User có thể chọn position, level, goal, duration, AI model, interviewer mode
- ✅ System kiểm tra microphone permission trước khi start
- ✅ User có thể nói câu trả lời bằng voice
- ✅ Voice được transcribe thành text real-time
- ✅ AI generate câu hỏi tiếp theo dựa trên câu trả lời
- ✅ User có thể kết thúc phỏng vấn bất kỳ lúc nào
- ✅ System generate báo cáo với scores và feedback trong 3s
- ✅ User có thể xem lại lịch sử interviews
- ✅ User có thể xem chi tiết 1 interview (transcript, scores)

#### **Non-functional:**

- ✅ Voice transcription < 2s
- ✅ AI response generation < 3s
- ✅ Full analysis after completion < 5s
- ✅ Support 5 concurrent interviews
- ✅ Audio files stored in Azure Blob Storage
- ✅ Transcript saved to database
- ✅ API response time < 500ms (except AI calls)

---

### **OUT OF SCOPE**

❌ **Phase 7 KHÔNG LÀM:**

1. Video interview
2. Text-to-speech (AI voice output)
3. Realtime voice streaming
4. Mentor/người thật interview
5. CV/JD integration
6. Interview based on match results
7. Suggested answers
8. Live scoring (chỉ overall scoring sau khi kết thúc)
9. Interviewer modes 4-6 (Startup/Corporate/Specialized)
10. Advanced analytics
11. Progress comparison charts
12. Interview templates
13. Multi-user interview
14. Audio playback
15. Export PDF (có thể để Phase 8 hoặc làm nhanh trong Phase 7)

---

### **RISK/NOTES CHO BACKEND C#**

#### **Risks:**

1. **Voice upload size** - Audio files có thể lớn (1-2MB per answer)
   - **Mitigation:** Compress audio trên frontend, upload to Azure Blob ngay, chỉ lưu URL

2. **Python AI service timeout** - Transcription + LLM generation có thể > 5s
   - **Mitigation:** Implement async pattern, polling, hoặc webhook callback

3. **Concurrent interviews** - Nhiều users phỏng vấn cùng lúc → load cao
   - **Mitigation:** Rate limiting, queue system cho Python AI requests

4. **Quota enforcement race condition** - 2 requests cùng lúc bypass quota
   - **Mitigation:** Use database transaction lock khi check + update usage

5. **Session abandonment** - User thoát giữa chừng không click "Kết thúc"
   - **Mitigation:** Implement session timeout (30 mins), auto-save transcript

#### **Technical Challenges:**

1. **Real-time transcript sync** - Frontend cần poll hoặc websocket?
   - **Solution:** Polling mỗi 2s, hoặc WebSocket nếu có time

2. **Audio storage** - Lưu audio files ở đâu lâu dài?
   - **Solution:** Azure Blob Storage hot tier, auto-delete sau 90 days

3. **Large transcript** - Transcript dài có thể > 10KB
   - **Solution:** Lưu JSON compressed, hoặc separate table

4. **AI model selection** - User chọn GPT-4o vs GPT-3.5 → khác API?
   - **Solution:** Python AI service handle model routing

#### **Dependencies:**

- Azure Blob Storage (file upload)
- Python AI service (transcription + LLM)
- OpenAI API key (for Whisper + GPT)
- Background job service (optional, for async processing)

---

### **RISK/NOTES CHO PYTHON AI SERVICE**

#### **Risks:**

1. **OpenAI API rate limits** - Whisper + GPT calls có thể bị rate limit
   - **Mitigation:** Implement retry logic, queue system, cache common questions

2. **Whisper transcription accuracy** - Voice chất lượng kém → transcript sai
   - **Mitigation:** Preprocessing audio (noise reduction), confidence score threshold

3. **LLM hallucination** - AI generate câu hỏi không liên quan
   - **Mitigation:** System prompt engineering, context window management

4. **Cost** - Mỗi interview cost: Whisper (~$0.01/min) + GPT-4o (~$0.05 per request)
   - **Mitigation:** Use GPT-3.5 for free users, GPT-4o for premium

5. **Response time** - Whisper + GPT sequential calls → slow
   - **Mitigation:** Parallel processing where possible, cache common patterns

#### **Technical Challenges:**

1. **Context window management** - Transcript dài → exceed LLM context
   - **Solution:** Summarize older messages, keep last 10 turns

2. **Interviewer personality** - HR basic vs HR strict → khác prompt
   - **Solution:** Template system prompts cho từng interviewer mode

3. **Question quality** - Avoid repetitive questions
   - **Solution:** Track asked question types, diversify follow-ups

4. **Scoring algorithm** - Làm sao score objective?
   - **Solution:** Rubric-based scoring với LLM, multiple criteria

#### **Dependencies:**

- OpenAI API (Whisper + GPT-4o/GPT-3.5)
- Audio processing libraries (pydub, ffmpeg)
- LLM prompt templates
- Scoring rubrics database

#### **Python AI Service Architecture:**

```
POST /ai/interviews/transcribe
  → Download audio from Azure Blob
  → Preprocess (noise reduction, format conversion)
  → Call OpenAI Whisper API
  → Return transcript + confidence

POST /ai/interviews/generate-question
  → Load interviewer personality prompt
  → Build context from conversation history
  → Call OpenAI GPT-4o/3.5
  → Parse response (question + type)
  → Return structured question

POST /ai/interviews/analyze
  → Load conversation transcript
  → Apply scoring rubric
  → Call OpenAI GPT-4o for detailed analysis
  → Aggregate scores (communication/technical/confidence)
  → Generate strengths/weaknesses/tips
  → Return structured feedback
```

---

## ✅ PHASE 7 CHECKLIST

### **Backend C# Tasks:**

- [ ] Tạo database tables (InterviewSessions, InterviewQuestions, InterviewAnswers)
- [ ] API: POST /api/v1/interviews/check-quota
- [ ] API: POST /api/v1/interviews (create session)
- [ ] API: POST /api/v1/interviews/{id}/start
- [ ] API: POST /api/v1/interviews/{id}/messages
- [ ] API: POST /api/v1/interviews/{id}/complete
- [ ] API: GET /api/v1/interviews
- [ ] API: GET /api/v1/interviews/{id}
- [ ] Internal API: PATCH /internal/interviews/{id}/results
- [ ] Quota enforcement logic (daily reset)
- [ ] Azure Blob Storage integration (audio upload)
- [ ] Python AI service integration (HTTP client)
- [ ] Session timeout handling (30 mins auto-complete)

### **Python AI Tasks:**

- [ ] API: POST /ai/interviews/transcribe (OpenAI Whisper)
- [ ] API: POST /ai/interviews/generate-question (GPT-4o/3.5)
- [ ] API: POST /ai/interviews/analyze (full analysis)
- [ ] Interviewer personality prompts (HR basic, HR strict, Tech Lead)
- [ ] Scoring rubrics (communication, technical, confidence)
- [ ] Context window management (summarize old messages)
- [ ] Audio preprocessing (noise reduction)
- [ ] Question diversification logic
- [ ] C# callback integration (PATCH results)

### **Frontend Tasks:**

- [ ] InterviewReportPage implementation (hiện tại chưa có)
- [ ] Voice recording component
- [ ] Audio upload to backend
- [ ] Real-time transcript display
- [ ] Polling for AI responses
- [ ] Processing screen animation
- [ ] Report detail view với scores/feedback

---

**TỔNG KẾT:**

Phase 7 - AI Interview Foundation là **phase phức tạp nhất** sau Phase 5, yêu cầu:
- C# backend (API layer + storage)
- Python AI (Whisper + GPT + scoring)
- Azure Blob Storage (audio files)
- Real-time UX (voice recording + transcript)

**Timeline estimate:** 3-4 weeks (C# 1.5 weeks, Python 1.5 weeks, Integration 1 week)

**Priority:** HIGH - Đây là 1 trong 3 tính năng core của INTER-VIET (CV, JD Matching, Interview AI)

---

**Ngày xuất:** 2026-05-09  
**Version:** 1.0  
**Tác giả:** Claude Code Analysis
