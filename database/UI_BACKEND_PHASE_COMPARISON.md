# INTER-VIET - ĐỐI CHIẾU UI MOCKTEST VỚI 5 PHASES BACKEND

**Ngày:** 2026-05-09  
**Backend Roadmap:** Phase 0 → Phase 5  
**Mục đích:** Kiểm tra UI mocktest hiện tại khớp với từng phase backend như thế nào

---

## PHẦN 1 — TỔNG QUAN SẢN PHẨM THEO UI

### Mô tả sản phẩm

**INTER-VIET** là nền tảng cố vấn sự nghiệp AI cho người Việt, tập trung vào 3 tính năng chính:

1. **Tối ưu CV** - AI phân tích và đề xuất cải thiện CV
2. **Ghép nối JD** - So khớp CV với Job Description, đánh giá độ phù hợp
3. **Luyện phỏng vấn** - Phỏng vấn AI voice thời gian thực + kết nối Mentor

### Các nhóm chức năng chính trong sidebar/menu

| Menu | Mục đích business |
|------|-------------------|
| **Bảng điều khiển** (Dashboard) | Tổng quan hoạt động, thống kê CV/JD/interview, usage hiện tại |
| **CV Matching** | Upload CV + paste JD → AI phân tích độ phù hợp, đề xuất cải thiện |
| **Lịch sử CV** (CV History) | Xem tất cả CV đã upload, score, versions |
| **So khớp đa JD** (Multi-JD Matching) | So sánh 1 CV với nhiều JD cùng lúc, ranking JD phù hợp nhất |
| **Kết nối** (Network) | Kết nối với mentors theo ngành nghề, book sessions |
| **Phỏng vấn AI** (Interview) | Setup → Live voice interview → Report chi tiết |
| **Báo cáo** (Reports) | Thống kê, trends, insights, analytics nâng cao (premium) |
| **Thông báo** (Notifications) | Thông báo hệ thống, trial/subscription, mentor sessions |
| **Trợ giúp** (Help Center) | FAQ, tutorials, contact support |
| **Gói dịch vụ** (Subscription) | Xem/nâng cấp/hủy gói, so sánh plans |
| **Thanh toán** (Billing) | Lịch sử thanh toán, payment methods, hóa đơn |
| **Cài đặt** (Settings) | Profile, account, preferences, delete account |

---

## PHẦN 2 — ĐỐI CHIẾU PHASE 0 (PROJECT FOUNDATION)

### Phase 0 Backend Scope

- Project structure setup
- Routing foundation
- API versioning
- Health/diagnostic endpoints
- Multi-module architecture
- CORS configuration

### UI yêu cầu gì từ Foundation

| Yêu cầu | Hiển thị trong UI |
|---------|-------------------|
| **Routing** | ✅ UI có 40+ routes riêng biệt (marketing, auth, app, employer) |
| **Layout** | ✅ UI có 4 layouts: Public, Auth, App (sidebar), Employer |
| **Theme** | ✅ UI có light/dark mode toggle |
| **Multi-module** | ✅ UI phân biệt rõ Candidate vs Employer modules |
| **API groups** | ✅ UI cần API groups: Auth, Profile, CV, JD, Match, Interview, Subscription, Payment |
| **Health/diagnostic** | ⚠️ UI có Status page nhưng không thể hiện chi tiết |

### Kết luận Phase 0

**Backend cần:**
- ✅ Routing với `/api/v1` prefix
- ✅ CORS cho frontend React app
- ✅ Multi-layout support (PublicLayout, AuthLayout, AppLayout, EmployerLayout)
- ✅ Theme persistence (light/dark)
- ✅ Module separation: Candidate APIs vs Employer APIs
- ⚠️ Health endpoint `/health` (UI chưa dùng rõ ràng nhưng nên có)

**Đánh giá:** Phase 0 backend đúng hướng nếu làm các điểm trên.

---

## PHẦN 3 — ĐỐI CHIẾU PHASE 1 (AUTH + JWT + PROFILE)

### Phase 1 Backend Scope

- User registration
- Login/logout
- JWT token generation
- User profile CRUD
- Email verification
- Password reset

### UI có những flow Auth nào

| Flow | Route | Yêu cầu backend |
|------|-------|-----------------|
| **Đăng ký** | `/dang-ky` | POST `/api/v1/auth/register` |
| **Đăng nhập** | `/dang-nhap` | POST `/api/v1/auth/login` |
| **Xác minh email** | `/xac-minh-email` | POST `/api/v1/auth/verify-email` |
| **Quên mật khẩu** | `/quen-mat-khau` | POST `/api/v1/auth/forgot-password` |
| **Đặt lại mật khẩu** | `/dat-lai-mat-khau` | POST `/api/v1/auth/reset-password` |
| **Logout** | Button trong header | POST `/api/v1/auth/logout` |
| **Tài khoản bị khóa** | `/tai-khoan-bi-khoa` | GET user status từ API |

### UI có những thông tin Profile nào

| Thông tin | Hiển thị ở | Backend cần |
|-----------|-----------|-------------|
| **Email** | Settings, header badge | User.Email |
| **Họ tên** | Settings, header | User.FullName |
| **Số điện thoại** | Settings | User.PhoneNumber |
| **Avatar** | Header, profile | User.ProfilePictureUrl |
| **Ngày sinh** | Settings (nếu có) | Profile.DateOfBirth |
| **Giới tính** | Settings (nếu có) | Profile.Gender |
| **Địa chỉ** | Settings | Profile.City, District |
| **Kỹ năng** | Dashboard, profile | Skills[] table |
| **Kinh nghiệm** | Profile view | WorkExperiences[] table |
| **Học vấn** | Profile view | Educations[] table |
| **Chứng chỉ** | Profile view | Certifications[] table |

### UI có Google Login không?

⚠️ **KHÔNG** - UI mocktest hiện tại chỉ có email/password login, KHÔNG có Google OAuth button.

### Backend Phase 1 cần API gì

```
✅ Bắt buộc ngay:
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh-token
POST   /api/v1/auth/logout
POST   /api/v1/auth/verify-email
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password

GET    /api/v1/users/me
PUT    /api/v1/users/me
GET    /api/v1/profiles/me
PUT    /api/v1/profiles/me

GET    /api/v1/profiles/me/skills
POST   /api/v1/profiles/me/skills
PUT    /api/v1/profiles/me/skills/{id}
DELETE /api/v1/profiles/me/skills/{id}

GET    /api/v1/profiles/me/experiences
POST   /api/v1/profiles/me/experiences
PUT    /api/v1/profiles/me/experiences/{id}
DELETE /api/v1/profiles/me/experiences/{id}

GET    /api/v1/profiles/me/educations
POST   /api/v1/profiles/me/educations
PUT    /api/v1/profiles/me/educations/{id}
DELETE /api/v1/profiles/me/educations/{id}

❌ Không cần trong Phase 1:
POST   /api/v1/auth/google (UI không có Google login)
POST   /api/v1/auth/facebook (UI không có)
```

### Kết luận Phase 1

| Tiêu chí | Đánh giá |
|----------|----------|
| **Đúng hướng** | ✅ Có - UI rõ ràng cần Auth + JWT + Profile |
| **Thiếu gì** | ⚠️ Backend cần có email verification flow (send code + verify) |
| **Không cần làm** | ❌ Google/Facebook OAuth (UI không có) |
| **Nên làm tiếp** | ✅ Profile CRUD đầy đủ cho Skills/Experiences/Educations |

---

## PHẦN 4 — ĐỐI CHIẾU PHASE 2 (RESUME FOUNDATION + PYTHON CV PARSER)

### Phase 2 Backend Scope

- CV upload (file storage)
- CV list/view/delete
- Python service integration for CV parsing
- Extract text from PDF/DOCX
- Parse skills/experiences from CV

### UI yêu cầu gì về CV

| Tính năng | Route/Page | Backend cần |
|-----------|-----------|-------------|
| **Upload CV** | `/cv-matching` (upload step) | POST `/api/v1/cvs/upload` + file storage |
| **Danh sách CV** | `/cv-history` | GET `/api/v1/cvs` |
| **Xem CV detail** | CV History detail view | GET `/api/v1/cvs/{id}` |
| **Xóa CV** | CV History delete button | DELETE `/api/v1/cvs/{id}` |
| **CV score** | CV History shows score | Field: `analysisScore` |
| **CV status** | Analyzing/Done indicator | Field: `status` (processing/completed) |
| **Parse kết quả** | Không hiển thị trực tiếp | `extractedText`, `analysisData` JSON |
| **Set default CV** | CV History set default | PUT `/api/v1/cvs/{id}` → `isDefaultCV: true` |

### UI có yêu cầu "Tối ưu CV" không?

✅ **CÓ** - Tính năng "CV Optimization" là core feature, hiển thị:
- Score (0-100)
- Strengths (điểm mạnh)
- Weaknesses (điểm yếu)
- Suggestions (đề xuất cải thiện)

**Nhưng:** Tối ưu CV là **Python AI processing**, KHÔNG phải Phase 2 backend.

### Backend Phase 2 cần làm gì

```
✅ Bắt buộc trong Phase 2:
POST   /api/v1/cvs/upload
  → Upload file to Azure Blob Storage
  → Save record to CVs table
  → Trigger Python AI service (async)

GET    /api/v1/cvs
  → Return list CVs with score, status

GET    /api/v1/cvs/{id}
  → Return CV detail with analysisData

PUT    /api/v1/cvs/{id}
  → Update CV name, set default

DELETE /api/v1/cvs/{id}
  → Delete CV file + record

Internal endpoint cho Python callback:
PATCH  /internal/cvs/{id}/analysis
  → Python gọi sau khi parse xong
  → Update analysisScore, analysisData, status
```

### Python AI cần trả gì về cho C#

```json
{
  "cvId": "guid",
  "status": "completed",
  "analysisScore": 85.5,
  "analysisData": {
    "extractedText": "...",
    "skills": ["C#", "ASP.NET", "SQL"],
    "experiences": [...],
    "educations": [...],
    "strengths": [
      "5 năm kinh nghiệm .NET",
      "Có kinh nghiệm lead team"
    ],
    "weaknesses": [
      "Thiếu chứng chỉ",
      "Chưa có cloud experience"
    ],
    "suggestions": [
      "Nên lấy chứng chỉ Microsoft",
      "Bổ sung cloud projects"
    ]
  }
}
```

### Điểm nào UI có nhưng Phase 2 chưa cần làm

❌ **CV Templates** - UI có page `/cvs/templates` nhưng Phase 2 chưa cần làm.  
❌ **CV Builder** - UI không có, không cần.  
❌ **Multiple CV versions comparison** - UI có nhưng để Phase sau.

### Kết luận Phase 2

| Tiêu chí | Đánh giá |
|----------|----------|
| **Đúng hướng** | ✅ Có - CV upload + parse + storage đúng là foundation |
| **Thiếu gì** | ⚠️ Backend cần webhook/callback từ Python service |
| **Không nên làm sớm** | ❌ CV Templates, CV Builder |
| **Nên làm tiếp** | ✅ File upload to Azure Blob, async Python integration |

---

## PHẦN 5 — ĐỐI CHIẾU PHASE 3 (JOB DESCRIPTION + CV-JD MATCHING FOUNDATION)

### Phase 3 Backend Scope

- JD CRUD (create/read/update/delete)
- Single CV-JD matching (1 CV vs 1 JD)
- Python AI service for matching
- Match score calculation
- Match result storage

### UI yêu cầu gì về JD

| Tính năng | Route/Page | Backend cần |
|-----------|-----------|-------------|
| **Tạo JD** | `/cv-matching` (paste JD step) | POST `/api/v1/job-descriptions` |
| **Danh sách JD** | Không có page riêng | GET `/api/v1/job-descriptions` |
| **Sửa JD** | Không rõ trong UI | PUT `/api/v1/job-descriptions/{id}` |
| **Xóa JD** | Không rõ trong UI | DELETE `/api/v1/job-descriptions/{id}` |

### UI yêu cầu gì về CV-JD Matching

| Tính năng | Hiển thị | Backend cần |
|-----------|----------|-------------|
| **Match CV + JD** | `/cv-matching` main flow | POST `/ai/matching/single` (Python AI) |
| **Match score** | Hiển thị % (0-100) | Field: `matchScore` |
| **Match level** | Excellent/Good/Fair/Poor | Field: `matchLevel` |
| **Matched skills** | Danh sách skills khớp | Field: `matchedSkills[]` |
| **Missing skills** | Danh sách skills thiếu | Field: `missingSkills[]` |
| **Strengths** | Điểm mạnh của CV | Field: `strengthAreas[]` |
| **Weaknesses** | Điểm yếu | Field: `weaknessAreas[]` |
| **Recommendations** | Đề xuất cải thiện | Field: `recommendations[]` |
| **Lịch sử match** | Dashboard/Reports | GET `/api/v1/matchings` |

### UI có "So khớp đa JD" (Multi-JD Matching) không?

✅ **CÓ** - UI có route `/multi-jd-matching` với flow:
1. Upload 1 CV
2. Paste/upload NHIỀU JD (tối đa theo gói: 3-20 JDs)
3. AI so sánh CV với TẤT CẢ JDs
4. Ranking JDs theo match score
5. Xem JD nào phù hợp nhất

**Nhưng:** Đây là feature nâng cao, **KHÔNG NẾN LÀM TRONG PHASE 3**.

### Backend Phase 3 cần làm gì

```
✅ Bắt buộc trong Phase 3 (Single Match Foundation):
POST   /api/v1/job-descriptions
  → Tạo JD mới

GET    /api/v1/job-descriptions
  → List JDs của user

GET    /api/v1/job-descriptions/{id}
PUT    /api/v1/job-descriptions/{id}
DELETE /api/v1/job-descriptions/{id}

POST   /api/v1/matchings/single
  → C# nhận request với cvId + jdId
  → Forward to Python AI service
  → Save match result to CVJDMatchings table
  → Return result to frontend

GET    /api/v1/matchings
  → Lịch sử matching của user

GET    /api/v1/matchings/{id}
  → Chi tiết 1 matching

Internal endpoint cho Python:
POST   /internal/matchings
  → Python callback với match result
```

### Python AI cần trả gì về cho C# (Single Match)

```json
{
  "matchingId": "guid",
  "cvId": "guid",
  "jdId": "guid",
  "matchScore": 82.5,
  "matchLevel": "Excellent",
  "matchedSkills": [
    {
      "skill": "C#",
      "matchStrength": "strong",
      "cvExperience": 5,
      "jdRequirement": "3+ years"
    }
  ],
  "missingSkills": [
    {
      "skill": "Azure",
      "importance": "high",
      "jdRequirement": "preferred"
    }
  ],
  "matchedExperiences": [...],
  "strengthAreas": [
    "Technical skills rất phù hợp",
    "Kinh nghiệm vượt yêu cầu"
  ],
  "weaknessAreas": [
    "Thiếu cloud experience"
  ],
  "recommendations": [
    "Bổ sung Azure vào CV",
    "Highlight microservices projects"
  ]
}
```

### So khớp đa JD nên để Phase nào?

❌ **KHÔNG NÊN LÀM TRONG PHASE 3** - Lý do:
- Phase 3 chỉ làm **foundation** cho single match
- Multi-JD cần:
  - Batch processing
  - Parallel AI calls
  - Ranking algorithm
  - Complex result aggregation
  - Quota enforcement (limits per plan)

✅ **ĐỀ XUẤT:** Làm trong **Phase 6** (sau Phase 5 Subscription + Quota) vì:
- Cần quota enforcement (Free: 3 JDs, Yearly: 20 JDs)
- Cần check limits trước khi process
- Tính năng premium, phụ thuộc billing

### Kết luận Phase 3

| Tiêu chí | Đánh giá |
|----------|----------|
| **Đúng hướng** | ✅ Có - Single CV-JD matching là foundation đúng |
| **Thiếu gì** | ⚠️ Backend cần internal endpoint cho Python callback |
| **Không nên làm sớm** | ❌ Multi-JD Matching (để Phase 6) |
| **Nên làm tiếp** | ✅ JD CRUD + Single match + lưu lịch sử |

---

## PHẦN 6 — ĐỐI CHIẾU PHASE 4 (DASHBOARD + USAGE + ACTIVITY)

### Phase 4 Backend Scope

- Dashboard overview API
- Usage tracking
- Activity logs
- Recent actions
- Statistics aggregation

### UI yêu cầu gì ở Dashboard

| Widget | Hiển thị | Backend API cần trả |
|--------|----------|---------------------|
| **Thống kê tổng quan** | 4 cards | `totalCVs`, `totalMatches`, `avgMatchScore`, `totalInterviews` |
| **CV gần đây** | Table 5 CVs | `recentCVs[]` với `name`, `score`, `createdAt` |
| **Matches gần đây** | Table 5 matches | `recentMatches[]` với `cvName`, `jdTitle`, `score`, `createdAt` |
| **Usage hiện tại** | Progress bars | `currentUsage: { cvOptimizations: 2/3, interviews: 0/1 }` |
| **Gói hiện tại** | Badge + text | `subscriptionPlan`, `planName`, `expiryDate` |
| **Quick actions** | Buttons | Không cần API, chỉ navigation |

### UI yêu cầu gì ở Activity Log

| Thông tin | Hiển thị | Backend field |
|-----------|----------|---------------|
| **Activity type** | Icon + text | `activityType` (cv-upload, jd-match, payment, etc.) |
| **Description** | Text | `activityDescription` |
| **Timestamp** | Thời gian | `createdAt` |
| **Related entity** | Link nếu có | `relatedEntityType`, `relatedEntityId` |

### UI có Notifications không?

✅ **CÓ** - Route `/thong-bao` hiển thị:
- Notification list
- Unread badge
- Mark as read
- Types: info, success, warning, error

### Backend Phase 4 cần API gì

```
✅ Bắt buộc trong Phase 4:
GET    /api/v1/dashboard
Response:
{
  "statistics": {
    "totalCVs": 5,
    "totalMatches": 12,
    "avgMatchScore": 78.5,
    "bestMatchScore": 92.3,
    "totalInterviews": 3
  },
  "recentCVs": [
    { "cvId": "...", "name": "...", "score": 85.5, "createdAt": "..." }
  ],
  "recentMatches": [
    { "matchingId": "...", "cvName": "...", "jdTitle": "...", "score": 82, "createdAt": "..." }
  ],
  "currentUsage": {
    "cvOptimizationsDaily": 2,
    "cvOptimizationsLimit": 3,
    "interviewsDaily": 0,
    "interviewsLimit": 1
  },
  "subscription": {
    "plan": "free",
    "planName": "Gói Miễn phí",
    "status": "active",
    "expiryDate": null
  }
}

GET    /api/v1/activities
Response:
{
  "activities": [
    {
      "activityId": "...",
      "activityType": "cv-upload",
      "activityDescription": "Tải lên CV: Backend Developer 2024",
      "relatedEntityType": "CV",
      "relatedEntityId": "...",
      "createdAt": "..."
    }
  ]
}

GET    /api/v1/notifications
POST   /api/v1/notifications/{id}/mark-read
POST   /api/v1/notifications/mark-all-read

GET    /api/v1/subscriptions/usage
Response:
{
  "period": {
    "startDate": "2026-05-01",
    "endDate": "2026-06-01"
  },
  "limits": {
    "cvOptimizationsDaily": 3,
    "interviewsDaily": 1
  },
  "used": {
    "cvOptimizationsDaily": 2,
    "interviewsDaily": 0
  },
  "remaining": {
    "cvOptimizations": 1,
    "interviews": 1
  }
}
```

### Activity nào cần track

| Activity Type | Khi nào track |
|---------------|---------------|
| `cv-upload` | User upload CV mới |
| `cv-delete` | User xóa CV |
| `jd-create` | User tạo JD |
| `jd-match` | Match CV với JD |
| `interview-start` | Bắt đầu interview |
| `interview-complete` | Hoàn thành interview |
| `subscription-upgrade` | Nâng cấp gói |
| `subscription-cancel` | Hủy gói |
| `payment-success` | Thanh toán thành công |
| `payment-failed` | Thanh toán thất bại |
| `profile-update` | Cập nhật profile |

### Usage/Quota nào cần hiển thị

| Quota | Đơn vị | Reset |
|-------|--------|-------|
| CV Optimizations | Per day | 00:00 hàng ngày |
| Interviews | Per day | 00:00 hàng ngày |
| Mentor Sessions | Per month | Đầu tháng |
| Multi-JD Matching | Per account | Không reset (total quota) |

### Kết luận Phase 4

| Tiêu chí | Đánh giá |
|----------|----------|
| **Đúng hướng** | ✅ Có - Dashboard + Usage + Activity đúng scope |
| **Thiếu gì** | ⚠️ Backend cần logic reset daily/monthly usage |
| **Không nên làm sớm** | ❌ Advanced analytics (để sau Phase 5) |
| **Nên làm tiếp** | ✅ Dashboard API, Activity tracking, Usage API |

---

## PHẦN 7 — ĐỐI CHIẾU PHASE 5 (SUBSCRIPTION + BILLING + QUOTA ENFORCEMENT)

### Phase 5 Backend Scope

- Subscription plans management
- Upgrade/downgrade flow
- Payment gateway integration
- Quota enforcement
- Trial management

### Danh sách gói theo UI

#### **GÓI MIỄN PHÍ**

| Field | Value |
|-------|-------|
| **Plan key** | `free` |
| **Tên hiển thị** | Gói Miễn phí |
| **Giá hiển thị** | 0đ |
| **Chu kỳ thanh toán** | Miễn phí vĩnh viễn |
| **Số tiền thực tế** | 0đ |
| **Mô tả** | Dùng thử các tính năng cơ bản |
| **Badge** | Không có |
| **CTA button** | "Bắt đầu miễn phí" |

#### **GÓI THÁNG**

| Field | Value |
|-------|-------|
| **Plan key** | `monthly` |
| **Tên hiển thị** | Gói Tháng |
| **Giá hiển thị** | 149.000đ/tháng |
| **Chu kỳ thanh toán** | 1 tháng |
| **Số tiền thực tế** | 149.000đ mỗi tháng |
| **Mô tả** | Phù hợp người mới bắt đầu |
| **Badge** | Không có |
| **CTA button** | "Chọn gói Tháng" |

#### **GÓI QUÝ**

| Field | Value |
|-------|-------|
| **Plan key** | `quarterly` |
| **Tên hiển thị** | Gói Quý |
| **Giá hiển thị** | 129.000đ/tháng |
| **Chu kỳ thanh toán** | 3 tháng |
| **Số tiền thực tế** | 387.000đ mỗi quý |
| **Mô tả** | Tiết kiệm 60.000đ |
| **Badge** | "Phổ biến nhất" ⭐ |
| **CTA button** | "Chọn gói Quý" |

#### **GÓI NĂM**

| Field | Value |
|-------|-------|
| **Plan key** | `yearly` |
| **Tên hiển thị** | Gói Năm |
| **Giá hiển thị** | 109.000đ/tháng |
| **Chu kỳ thanh toán** | 12 tháng |
| **Số tiền thực tế** | 1.308.000đ mỗi năm |
| **Mô tả** | Tiết kiệm 480.000đ + Dùng thử 7 ngày |
| **Badge** | "Tiết kiệm nhất" 💰 |
| **CTA button** | "Dùng thử 7 ngày miễn phí" |

### Quota theo từng gói

| Quota | Free | Monthly | Quarterly | Yearly | Đơn vị |
|-------|------|---------|-----------|--------|--------|
| **CV Optimizations** | 3 | 3 | 5 | UNLIMITED | Per day |
| **AI Interviews** | 1 | 1 | 3 | UNLIMITED | Per day |
| **Mentor Sessions** | 0 | 0 | 3 | 4 | Per month |
| **Multi-JD Matching** | 3 JDs | 3 JDs | 10 JDs | 20 JDs | Max JDs per match |
| **CV Storage** | 1 CV | 5 CVs | 10 CVs | UNLIMITED | Total CVs |

### Feature availability theo từng gói

| Feature | Free | Monthly | Quarterly | Yearly | Data type |
|---------|------|---------|-----------|--------|-----------|
| **AI Model** | Basic | Stable | Premium | Premium | string |
| **Export PDF** | ❌ | ✅ | ✅ | ✅ | boolean |
| **Share Report** | ❌ | ✅ | ✅ | ✅ | boolean |
| **Advanced Analytics** | ❌ | ✅ | ✅ | ✅ | boolean |
| **Headhunter Access** | ❌ | ❌ | ❌ | ✅ | boolean |
| **Career Advancement Tools** | ❌ | ❌ | ❌ | ✅ | boolean |
| **Communication Analysis** | ❌ | ❌ | ✅ | ✅ | boolean |
| **Industry Benchmark** | ❌ | ❌ | ✅ | ✅ | boolean |
| **Choose Mentor by Industry** | ❌ | ❌ | ✅ | ✅ | boolean |
| **Unlimited History** | 30 days | 90 days | 1 year | UNLIMITED | string |
| **Support Level** | Email | Email | Priority | Priority 24/7 | string |

---

## PHẦN 8 — MAPPING BACKEND KEY ĐỀ XUẤT CHO PHASE 5

### Plan Keys

```csharp
public enum SubscriptionPlan
{
    Free = 0,
    Monthly = 1,
    Quarterly = 2,
    Yearly = 3
}

// Database: SubscriptionPlans.PlanCode
free
monthly
quarterly
yearly
```

### Quota Feature Keys (Period-based)

```csharp
// Field trong SubscriptionPlans table
CVAnalysisLimit         // int (-1 = unlimited)
JDMatchingLimit         // int (-1 = unlimited)
MultiJDLimit            // int (max JDs per multi-match)
InterviewSessionsLimit  // int (-1 = unlimited)
InterviewMinutesLimit   // int (-1 = unlimited)
MentorSessionsLimit     // int (monthly)
CVStorageLimit          // int (-1 = unlimited)
```

**Data type:** `int` (giá trị `-1` nghĩa là unlimited)

### Entitlement Keys (Boolean/String)

```csharp
// Field trong SubscriptionPlans table (boolean)
CVTemplatesAccess       // bool
PrioritySupport         // bool
ExportPDF               // bool
ShareReport             // bool
AdvancedAnalytics       // bool
HeadhunterAccess        // bool
CareerAdvancementTools  // bool
CommunicationAnalysis   // bool
IndustryBenchmark       // bool
ChooseMentorByIndustry  // bool

// String fields
AIModelTier             // string: "basic" | "stable" | "premium"
SupportLevel            // string: "email" | "priority" | "priority_24_7"
HistoryRetention        // string: "30_days" | "90_days" | "1_year" | "unlimited"
```

**Data type:**
- Boolean features: `bool` (BIT trong SQL)
- Tier/Level features: `string` (NVARCHAR)

---

## PHẦN 9 — SUBSCRIPTION STATE VÀ BUSINESS RULE

### User states theo UI

| User State | Ý nghĩa | Hiển thị trong UI |
|------------|---------|-------------------|
| `visitor` | Chưa đăng ký | Không login |
| `free` | Tài khoản miễn phí | Badge "Miễn phí" |
| `trial` | Đang dùng thử 7 ngày (chỉ Gói Năm) | Badge "Dùng thử" + countdown |
| `premium` | Đã thanh toán, đang active | Badge "Gói Tháng/Quý/Năm" |
| `cancelled` | Đã hủy nhưng còn hiệu lực | Badge "Hủy - Còn đến {date}" |
| `expired` | Hết hạn | Badge "Hết hạn" + nâng cấp |
| `suspended` | Bị khóa (chưa có UI) | Không thấy trong UI |

### UI có trial không?

✅ **CÓ** - Nhưng chỉ cho **Gói Năm**:
- Button CTA: "Dùng thử 7 ngày miễn phí"
- Gói Tháng: KHÔNG CÓ trial
- Gói Quý: KHÔNG CÓ trial
- Gói Năm: CÓ trial 7 ngày, chỉ dùng 1 lần

### Upgrade flow theo UI

**Free user bấm "Nâng cấp gói":**
1. Redirect to `/goi-dich-vu` (Subscription page)
2. Hiển thị 4 plans comparison
3. User chọn plan

**User bấm "Chọn Gói Tháng":**
1. Redirect to payment page
2. Chọn payment method (VNPay/MoMo/Credit Card/Bank Transfer)
3. Thanh toán
4. Sau khi thanh toán thành công → `role: 'premium'`, `plan: 'monthly'`

**User bấm "Chọn Gói Quý":**
- Tương tự Gói Tháng, thanh toán 387.000đ

**User bấm "Dùng thử 7 ngày miễn phí" (Gói Năm):**
1. Nếu user **chưa từng dùng trial** → Active ngay trial 7 ngày
2. `role: 'trial'`, `plan: 'yearly'`, `trialEndsAt: +7 days`
3. KHÔNG cần thanh toán ngay
4. Sau 7 ngày:
   - Nếu user thanh toán → `role: 'premium'`
   - Nếu không → `role: 'free'`

### UI có giảm giá không?

⚠️ **CHƯA CÓ** - UI không hiển thị:
- Promo code
- Discount percentage
- Limited time offer

### UI có gói phổ biến nhất không?

✅ **CÓ** - Gói Quý có badge "Phổ biến nhất" ⭐

### UI có gói tiết kiệm nhất không?

✅ **CÓ** - Gói Năm có badge "Tiết kiệm nhất" 💰

### UI có hủy gói không?

✅ **CÓ** - Route `/huy-goi` (Cancel Subscription page):
- Form nhập lý do hủy
- Sau khi hủy → `role: 'cancelled'`
- Vẫn dùng được đến hết kỳ đã thanh toán

### UI có gia hạn không?

✅ **CÓ** - Tự động gia hạn (auto-renew):
- Field `autoRenew: boolean`
- User có thể tắt auto-renew trong Billing page

### UI có downgrade không?

⚠️ **CHƯA RÕ** - UI không có flow downgrade rõ ràng.
- Có thể downgrade bằng cách cancel gói hiện tại, sau đó chọn gói thấp hơn

### UI có lịch sử thanh toán không?

✅ **CÓ** - Route `/thanh-toan` (Billing page):
- Table hiển thị payment history
- Fields: `orderId`, `amount`, `method`, `status`, `date`

### UI có hóa đơn không?

✅ **CÓ** - Route `/hoa-don` (Invoices page):
- Danh sách hóa đơn
- Download PDF invoice

### UI có payment method không?

✅ **CÓ** - Billing page có:
- Saved payment methods (Credit card, Bank account)
- Add new payment method
- Set default payment method

---

## PHẦN 10 — ĐỀ XUẤT THỨ TỰ IMPLEMENTATION BACKEND

### Phase 0-5 đã hợp lý chưa?

| Phase | Đánh giá |
|-------|----------|
| **Phase 0** | ✅ Hợp lý - Foundation cần thiết |
| **Phase 1** | ✅ Hợp lý - Auth + Profile đúng thứ tự |
| **Phase 2** | ✅ Hợp lý - CV foundation trước khi match |
| **Phase 3** | ✅ Hợp lý - JD + Single match là core |
| **Phase 4** | ✅ Hợp lý - Dashboard + Usage cần trước Billing |
| **Phase 5** | ✅ Hợp lý - Subscription + Billing sau khi có data |

### Feature nào nên để sau Phase 5?

| Feature | Đề xuất Phase | Lý do |
|---------|---------------|-------|
| **Multi-JD Matching** | Phase 6 | Cần quota enforcement từ Phase 5 |
| **AI Interview** | Phase 7 | Complex, cần voice processing, AI real-time |
| **Mentor/Network** | Phase 8 | Cần booking system, calendar, notifications |
| **Advanced Analytics** | Phase 9 | Cần nhiều data, reports complex |
| **Headhunter Connection** | Phase 10 | Marketplace feature, cần employer side |
| **CV Templates** | Phase 11 | Nice-to-have, không critical |

### Payment gateway thật nên để phase nào?

✅ **Phase 5** - Cần integrate ngay:
- VNPay (Vietnam market leader)
- MoMo (popular e-wallet)
- Credit Card (Stripe hoặc local gateway)

⚠️ **Nhưng:** Có thể làm mock payment flow trước, integrate gateway thật sau.

**Đề xuất:**
- Phase 5A: Mock payment (testing)
- Phase 5B: Real VNPay + MoMo integration (production)

### Mentor/Interview nên để phase nào?

❌ **KHÔNG NÊN LÀM TRONG 5 PHASES ĐẦU**

**Interview AI:** Phase 7 (sau Phase 6 Multi-JD)
- Lý do: Cần voice processing, real-time AI, complex scoring
- Phụ thuộc: OpenAI Whisper, real-time transcription, voice analysis
- Quota: Interviews per day đã có trong Phase 5

**Mentor/Network:** Phase 8
- Lý do: Cần booking system, mentor profiles, calendar integration
- Phụ thuộc: Notifications, scheduling, video call integration
- Quota: Mentor sessions per month đã có trong Phase 5

### So khớp đa JD nên để phase nào?

✅ **Phase 6** - Ngay sau Phase 5:
- Lý do: Cần quota enforcement (Free: 3 JDs, Yearly: 20 JDs)
- Foundation: Phase 3 đã có single match
- Backend cần:
  - Batch processing API
  - Parallel Python AI calls
  - Ranking & aggregation
  - Check quota before processing

---

## PHẦN 11 — KẾT LUẬN KIỂM TRA 5 PHASE

| Phase | Backend Scope | UI hỗ trợ | Đúng hướng | Thiếu gì | Nên làm tiếp |
|-------|---------------|-----------|------------|----------|--------------|
| **Phase 0** | Project Foundation | ✅ Có | ✅ Đúng | ⚠️ Health endpoint | Routing, CORS, layouts |
| **Phase 1** | Auth + JWT + Profile | ✅ Có | ✅ Đúng | ⚠️ Email verification | Profile CRUD đầy đủ |
| **Phase 2** | Resume + CV Parser | ✅ Có | ✅ Đúng | ⚠️ Python callback | File storage, async integration |
| **Phase 3** | JD + CV-JD Match | ✅ Có | ✅ Đúng | ⚠️ Internal endpoints | Single match foundation |
| **Phase 4** | Dashboard + Usage | ✅ Có | ✅ Đúng | ⚠️ Reset logic | Dashboard API, Activity tracking |
| **Phase 5** | Subscription + Billing | ✅ Có | ✅ Đúng | ⚠️ Trial logic | Plans, Quota, Payment gateway |

### Trạng thái tổng quan

✅ **TẤT CẢ 5 PHASES ĐÚNG HƯỚNG** - UI mocktest đầy đủ support roadmap backend.

---

## PHẦN 12 — OUTPUT CUỐI CÙNG CHO BACKEND

### ✅ Backend Phase 5 BẮT BUỘC phải làm ngay

1. **Subscription Plans Management**
   - Table `SubscriptionPlans` với 4 plans (Free/Monthly/Quarterly/Yearly)
   - Seed data với đầy đủ quotas và entitlements
   - API: `GET /api/v1/subscription-plans`

2. **User Subscription**
   - Table `Subscriptions` link User ↔ Plan
   - Fields: `status`, `startDate`, `endDate`, `autoRenew`
   - API: `GET /api/v1/subscriptions/me`

3. **Trial Logic (chỉ Gói Năm)**
   - Field `hasUsedTrial` trong Users (boolean)
   - Logic: User chỉ dùng trial 1 lần
   - Trial 7 ngày KHÔNG cần thanh toán ngay
   - Sau 7 ngày nếu không thanh toán → downgrade to Free

4. **Upgrade Flow**
   - API: `POST /api/v1/subscriptions/upgrade`
   - Input: `planCode`, `paymentMethod`
   - Output: `paymentUrl` hoặc activate trial ngay

5. **Quota Enforcement**
   - Stored procedure: `sp_CheckFeatureLimit`
   - Check trước khi cho phép action (CV optimization, interview, etc.)
   - Return `canUse: boolean`, `remaining: int`

6. **Usage Tracking**
   - Table `UsageTracking` theo period
   - Reset daily: CV optimizations, Interviews
   - Reset monthly: Mentor sessions
   - API: `GET /api/v1/subscriptions/usage`

7. **Payment Flow (Mock OK, real gateway nên có)**
   - API: `POST /api/v1/payments/create-order`
   - Support VNPay, MoMo (ít nhất mock)
   - Callback webhooks
   - Update subscription status sau payment

8. **Payments History**
   - Table `Payments` với status tracking
   - API: `GET /api/v1/payments/history`

9. **Invoices**
   - Table `Invoices`
   - Auto-generate invoice sau payment thành công
   - API: `GET /api/v1/invoices`, `GET /api/v1/invoices/{id}`

10. **Cancel Subscription**
    - API: `POST /api/v1/subscriptions/cancel`
    - `status: 'cancelled'` nhưng vẫn dùng đến hết kỳ
    - Sau expiry → `status: 'expired'`, downgrade to Free

### ⚠️ Backend Phase 5 NÊN CHUẨN BỊ nhưng chưa cần làm thật

1. **Payment Gateway Integration thật**
   - VNPay production credentials
   - MoMo production credentials
   - Stripe/local gateway for credit cards
   - → Có thể làm mock trước, integrate thật sau

2. **Promo Code / Discount**
   - UI chưa có → Chưa cần làm
   - Table `PromoCodes` → Để Phase 5.5 hoặc Phase 6

3. **Referral Program**
   - UI chưa có → Chưa cần làm

4. **Auto-renew Logic**
   - Cron job check subscriptions hết hạn
   - Auto charge payment method
   - → Có thể để Phase 5.5

5. **Payment Method Management**
   - Save card tokens
   - Set default payment method
   - → Nên có nhưng không urgent

### ❌ Backend KHÔNG NÊN LÀM trong Phase 5

1. **Multi-JD Matching** → Để Phase 6
2. **AI Interview** → Để Phase 7
3. **Mentor/Network Booking** → Để Phase 8
4. **Advanced Analytics** → Để Phase 9
5. **Headhunter Connection** → Để Phase 10
6. **CV Templates** → Để Phase 11
7. **Google/Facebook OAuth** → UI không có, không cần
8. **CV Builder** → UI không có, không cần
9. **Email Marketing Campaigns** → Để sau
10. **A/B Testing** → Để sau

---

## 🎯 CHECKLIST PHASE 5 BACKEND

```
✅ Database Tables
  ✅ SubscriptionPlans (seed 4 plans)
  ✅ Subscriptions
  ✅ UsageTracking
  ✅ Payments
  ✅ PaymentMethods
  ✅ Invoices

✅ APIs - Subscription
  ✅ GET  /api/v1/subscription-plans
  ✅ GET  /api/v1/subscriptions/me
  ✅ POST /api/v1/subscriptions/upgrade
  ✅ POST /api/v1/subscriptions/cancel
  ✅ GET  /api/v1/subscriptions/usage

✅ APIs - Payment
  ✅ POST /api/v1/payments/create-order
  ✅ POST /api/v1/payments/vnpay/callback
  ✅ POST /api/v1/payments/momo/callback
  ✅ GET  /api/v1/payments/history

✅ APIs - Invoice
  ✅ GET  /api/v1/invoices
  ✅ GET  /api/v1/invoices/{id}

✅ Business Logic
  ✅ Trial 7 ngày chỉ cho Yearly, chỉ 1 lần
  ✅ Quota enforcement (sp_CheckFeatureLimit)
  ✅ Usage reset (daily/monthly)
  ✅ Subscription state transitions
  ✅ Auto-generate invoice sau payment

⚠️ Payment Gateway
  ⚠️ VNPay integration (mock OK, real nên có)
  ⚠️ MoMo integration (mock OK, real nên có)
  ❌ Stripe (chưa cần)

❌ Không làm trong Phase 5
  ❌ Multi-JD Matching
  ❌ AI Interview
  ❌ Mentor Booking
  ❌ Advanced Analytics
```

---

**KẾT LUẬN CUỐI CÙNG:**

Backend C# roadmap 5 phases **HOÀN TOÀN ĐÚNG HƯỚNG** với UI mocktest hiện tại.

Phase 5 Subscription + Billing là **critical phase** cần làm kỹ vì:
- Đây là monetization core
- Quota enforcement ảnh hưởng tất cả features
- Trial logic (7 ngày chỉ Gói Năm) là business rule quan trọng
- Payment gateway cần test kỹ

Sau Phase 5 xong → Phase 6 nên làm **Multi-JD Matching** vì đã có quota enforcement.

---

**Ngày xuất:** 2026-05-09  
**Version:** 1.0  
**Tác giả:** Claude Code Analysis
