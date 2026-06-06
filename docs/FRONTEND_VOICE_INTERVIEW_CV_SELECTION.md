# FRONTEND — Tích hợp chọn CV vào màn hình tạo phỏng vấn Voice

> **Ngày:** 2026-06-06  
> **Tính năng:** Cho phép người dùng chọn CV đã upload để AI hỏi câu hỏi dựa trên CV của họ  
> **Không cần thay đổi Backend**

---

## 1. Tổng quan

Khi bắt đầu phỏng vấn voice, người dùng có thể **chọn một CV đã upload sẵn** (optional).  
Nếu có CV → AI interviewer sẽ hỏi câu hỏi dựa trên kinh nghiệm và kỹ năng trong CV.  
Nếu không có CV / không chọn → AI hỏi câu hỏi chung theo vị trí và level như cũ.

---

## 2. Thay đổi API

### Endpoint: `POST /api/v1/interviews/{id}/realtime/start`

Thêm 1 field optional vào request body:

**Trước:**
```json
{
  "mode": "voice",
  "aiModel": "gpt-4o-mini",
  "voice": "alloy",
  "language": "vi",
  "enableTranscript": true
}
```

**Sau:**
```json
{
  "mode": "voice",
  "aiModel": "gpt-4o-mini",
  "voice": "alloy",
  "language": "vi",
  "enableTranscript": true,
  "resumeId": "3c9192ea-7816-4b15-bf4d-a48cb86d6b14"
}
```

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `resumeId` | `string (UUID)` | ❌ Optional | ID của CV đã upload. Null = AI hỏi câu hỏi chung |

> Backend tự lookup nội dung CV từ DB theo `resumeId`. Frontend **không cần** truyền nội dung CV.

---

## 3. API lấy danh sách CV của người dùng

Để hiển thị dropdown chọn CV, dùng endpoint đã có sẵn:

```
GET /api/v1/resumes
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "3c9192ea-7816-4b15-bf4d-a48cb86d6b14",
      "title": "CV Backend Developer 2025",
      "versionNumber": 2,
      "isActive": true,
      "activeVersion": {
        "parseStatus": "parsed",
        "createdAt": "2026-05-20T08:00:00Z"
      },
      "createdAt": "2026-05-15T10:00:00Z"
    },
    {
      "id": "a1b2c3d4-...",
      "title": "CV AI Engineer",
      "versionNumber": 1,
      "isActive": true,
      "activeVersion": {
        "parseStatus": "uploaded"
      }
    }
  ]
}
```

> **Lưu ý:** Chỉ hiển thị CV có `activeVersion.parseStatus === "parsed"` trong dropdown để đảm bảo AI có đủ nội dung để đọc. CV chưa parse (`"uploaded"`, `"processing"`) vẫn có thể dùng nhưng AI sẽ có ít thông tin hơn.

---

## 4. UX Flow — 3 trường hợp

### Trường hợp 1: Người dùng có CV đã upload

Hiển thị dropdown chọn CV trong form tạo phỏng vấn:

```
┌─────────────────────────────────────────────────────┐
│  Chọn CV để AI phỏng vấn theo (không bắt buộc)      │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  CV Backend Developer 2025  ▾                │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ○ CV Backend Developer 2025   (đã phân tích)        │
│  ○ CV AI Engineer              (đã phân tích)        │
│  ─────────────────────────────────────────────────  │
│  ○ Không dùng CV (hỏi câu hỏi chung)                │
└─────────────────────────────────────────────────────┘
```

---

### Trường hợp 2: Người dùng chưa có CV nào

Hiển thị banner gợi ý:

```
┌─────────────────────────────────────────────────────┐
│  💡 Bạn chưa có CV nào được upload                  │
│                                                      │
│  Upload CV để AI có thể hỏi câu hỏi phù hợp hơn     │
│  với kinh nghiệm của bạn.                           │
│                                                      │
│  [ Upload CV ngay ]   [ Bỏ qua, tiếp tục ]          │
└─────────────────────────────────────────────────────┘
```

- **"Upload CV ngay"** → redirect tới `/resumes` hoặc `/resumes/upload`
- **"Bỏ qua, tiếp tục"** → không truyền `resumeId`, vẫn tạo phỏng vấn bình thường

---

### Trường hợp 3: Người dùng không muốn dùng CV

Luôn có option "Không dùng CV" trong dropdown → `resumeId = null`.

---

## 5. Code mẫu

### Fetch danh sách CV
```typescript
// services/resumeService.ts
async function getUserResumes() {
  const res = await api.get('/resumes');
  return res.data.data as Resume[];
}
```

### Component chọn CV trong VoiceSetupPage
```tsx
// VoiceSetupPage.tsx

const [resumes, setResumes] = useState<Resume[]>([]);
const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

useEffect(() => {
  getUserResumes().then(setResumes);
}, []);

// Trong JSX form:
<div className="cv-selector">
  <label>Chọn CV để AI phỏng vấn theo (không bắt buộc)</label>

  {resumes.length === 0 ? (
    // Trường hợp chưa có CV
    <div className="no-cv-banner">
      <p>💡 Bạn chưa có CV nào. Upload CV để AI hỏi câu hỏi phù hợp hơn.</p>
      <button onClick={() => navigate('/resumes/upload')}>Upload CV ngay</button>
      <button variant="ghost" onClick={() => setSelectedResumeId(null)}>
        Bỏ qua, tiếp tục
      </button>
    </div>
  ) : (
    // Trường hợp có CV
    <select
      value={selectedResumeId ?? ''}
      onChange={(e) => setSelectedResumeId(e.target.value || null)}
    >
      <option value="">Không dùng CV (hỏi câu hỏi chung)</option>
      {resumes
        .filter(r => r.isActive && !r.isDeleted)
        .map(r => (
          <option key={r.id} value={r.id}>
            {r.title}
            {r.activeVersion?.parseStatus === 'parsed' ? ' ✓' : ' (chưa phân tích)'}
          </option>
        ))
      }
    </select>
  )}
</div>
```

### Gọi API start realtime
```typescript
// Khi user bấm "Bắt đầu phỏng vấn"
await api.post(`/interviews/${interviewId}/realtime/start`, {
  mode: 'voice',
  aiModel: 'gpt-4o-mini',
  voice: selectedVoice,
  language: 'vi',
  enableTranscript: true,
  resumeId: selectedResumeId ?? undefined, // undefined = không gửi field
});
```

---

## 6. Tóm tắt

| Trường hợp | `resumeId` gửi lên | AI hỏi như thế nào |
|---|---|---|
| Chọn CV cụ thể | UUID của CV | Dựa trên kinh nghiệm & kỹ năng trong CV |
| Không chọn CV | `null` / không gửi | Hỏi câu hỏi chung theo position + level |
| Chưa có CV, bỏ qua | `null` / không gửi | Hỏi câu hỏi chung theo position + level |

> Backend xử lý hoàn toàn tự động — Frontend chỉ cần truyền đúng `resumeId` là xong.
