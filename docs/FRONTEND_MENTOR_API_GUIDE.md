# 📘 HƯỚNG DẪN TÍCH HỢP FRONTEND - LUỒNG NGHIỆP VỤ MENTOR

Tài liệu này tổng hợp toàn bộ **luồng nghiệp vụ (flow)**, hướng dẫn các bước thực hiện và **chi tiết API Endpoints kèm JSON Payload mẫu** phục vụ cho việc tích hợp giao diện (Frontend) luồng Mentor trong hệ thống **INTER-VIET**.

> ⚠️ **Lưu ý quan trọng:** Toàn bộ thanh toán trong hệ thống (bao gồm Mentor Booking) đều dùng **PayOS thật**. Không còn mock payment, không còn bank transfer thủ công, không dùng `paymentInstructionsUrl`.

---

## 🗺️ TỔNG QUAN LUỒNG (FLOW WALKTHROUGH)

```
LUỒNG 1: Đăng ký & Phê duyệt Chuyên gia
  Candidate → POST /api/v1/mentors/register
  Admin     → POST /api/v1/mentor/admin/mentors/{id}/verify?verify=true
  Mentor    → PUT  /api/v1/mentor/profile (cập nhật hồ sơ đầy đủ)

LUỒNG 2: Cài đặt lịch rảnh
  Mentor → PUT /api/v1/mentor/availability

LUỒNG 3: Tìm kiếm → Đặt lịch → Thanh toán PayOS (QUAN TRỌNG)
  Candidate → GET  /api/v1/mentors (tìm Mentor)
  Candidate → POST /api/v1/mentor-bookings (đặt lịch)
              Backend tạo Booking (pending_payment) + gọi PayOS API lấy link thật
              Response trả về checkoutUrl + checkoutSessionId
  Candidate → redirect window.location.href = checkoutUrl
  PayOS     → Người dùng thanh toán (QR hoặc thẻ ngân hàng)
  PayOS     → Webhook → Backend xác nhận → Booking thành "confirmed"
  Frontend  → Polling GET /api/v1/billing/checkout-sessions/{checkoutSessionId}
              (KHÔNG dùng /payments/{id} vì record chỉ tạo sau khi webhook về)

LUỒNG 4: Tiến hành hẹn & Đánh giá
  Mentor    → POST /api/v1/mentor/bookings/{id}/status (confirmed / completed)
  Candidate → POST /api/v1/mentor-bookings/{id}/review (đánh giá sao)
```

---

## 🗂️ CHI TIẾT API ENDPOINTS & PAYLOAD JSON MẪU

---

### Phân hệ 1: 🌐 Public API (Không cần đăng nhập)

#### 1. Lấy danh sách Mentor công khai
* **Route:** `GET /api/v1/public/mentors`
* **Query Params:** `page`, `pageSize`, `search`, `specialty`, `minRating`
* **Response (200):**
```json
{
  "total": 1, "page": 1, "pageSize": 20,
  "items": [
    {
      "id": "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
      "fullName": "Nguyễn Văn A",
      "headline": "Senior .NET Engineer @ TechCorp",
      "avatarUrl": "https://...",
      "yearsOfExperience": 6.5,
      "ratingAverage": 4.9,
      "ratingCount": 12,
      "specialties": [{ "code": "dot-net", "name": ".NET Core" }]
    }
  ]
}
```

#### 2. Xem chi tiết hồ sơ Mentor (Public)
* **Route:** `GET /api/v1/public/mentors/{id:guid}`
* **Response (200):**
```json
{
  "id": "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
  "fullName": "Nguyễn Văn A",
  "headline": "Senior .NET Engineer @ TechCorp",
  "bio": "Hơn 6 năm kinh nghiệm...",
  "yearsOfExperience": 6.5,
  "ratingAverage": 4.9,
  "ratingCount": 12,
  "expertise": ["Backend", "Microservices"],
  "industries": ["Fintech"],
  "languages": ["Tiếng Việt", "English"],
  "specialties": [{ "code": "dot-net", "name": ".NET Core" }],
  "availabilitySlots": [
    {
      "id": "a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p",
      "startsAt": "2026-06-01T08:00:00Z",
      "endsAt": "2026-06-01T09:00:00Z",
      "status": "available",
      "priceAmount": 200000.0,
      "currencyCode": "VND"
    }
  ]
}
```

#### 3. Lấy khung giờ rảnh của Mentor (Public)
* **Route:** `GET /api/v1/public/mentors/{id:guid}/availability`
* **Response (200):**
```json
[
  {
    "id": "a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p",
    "startsAt": "2026-06-01T08:00:00Z",
    "endsAt": "2026-06-01T09:00:00Z",
    "status": "available",
    "priceAmount": 200000.0,
    "currencyCode": "VND"
  }
]
```

---

### Phân hệ 2: 💼 Mentor Workspace API
*Header: `Authorization: Bearer <Token_Mentor>`*

#### 4. Xem hồ sơ của tôi
* **Route:** `GET /api/v1/mentor/profile`
* **Response (200):**
```json
{
  "id": "c1a2b3c4-...",
  "userId": "99999999-...",
  "isVerified": true,
  "fullName": "Nguyễn Văn A",
  "headline": "Senior .NET Engineer @ TechCorp",
  "bio": "Hơn 6 năm kinh nghiệm...",
  "yearsOfExperience": 6.5,
  "status": "active",
  "meetingUrl": "https://meet.google.com/abc-xyz-123",
  "ratingAverage": 4.9,
  "ratingCount": 12,
  "expertise": ["Backend"],
  "industries": ["Fintech"],
  "languages": ["Tiếng Việt"],
  "specialties": []
}
```

#### 5. Cập nhật hồ sơ Mentor
* **Route:** `PUT /api/v1/mentor/profile`
* **Body:**
```json
{
  "fullName": "Nguyễn Văn A",
  "headline": "Senior .NET Engineer @ TechCorp",
  "avatarUrl": "https://...",
  "bio": "Hơn 6 năm kinh nghiệm...",
  "yearsOfExperience": 6.5,
  "expertise": ["Backend", "Microservices"],
  "industries": ["Fintech"],
  "languages": ["Tiếng Việt", "English"],
  "meetingUrl": "https://meet.google.com/abc-xyz-123"
}
```

#### 6. Lấy danh mục Chuyên môn hệ thống
* **Route:** `GET /api/v1/mentor/specialties`
* **Response (200):**
```json
[{ "id": "e1f2...", "code": "dot-net", "name": ".NET Core", "description": "Lập trình C# Backend" }]
```

#### 7. Gán chuyên môn vào hồ sơ
* **Route:** `POST /api/v1/mentor/profile/specialties`
* **Body:**
```json
{ "specialtyIds": ["e1f2g3h4-i5j6-4k7l-8m9n-0o1p2q3r4s5t"] }
```
* **Response (200):**
```json
{
  "mentorProfileId": "c1a2b3c4-...",
  "specialties": [{ "code": "dot-net", "name": ".NET Core" }]
}
```

#### 8. Xem thống kê Dashboard Mentor
* **Route:** `GET /api/v1/mentor/dashboard/summary`
* **Response (200):**
```json
{
  "pendingBookingsCount": 1,
  "confirmedBookingsCount": 5,
  "completedBookingsCount": 10,
  "cancelledBookingsCount": 2,
  "totalEarningsAmount": 2000000.0,
  "currencyCode": "VND",
  "averageRating": 4.9,
  "recentBookings": []
}
```

#### 9. Danh sách lịch đặt hẹn (Mentor nhìn)
* **Route:** `GET /api/v1/mentor/bookings`
* **Query Params:** `status`, `search`, `page`, `pageSize`
* **Response (200):**
```json
{
  "total": 1, "page": 1, "pageSize": 20,
  "items": [
    {
      "id": "b1b2b3b4-...",
      "candidateName": "Nguyễn Văn B",
      "candidateEmail": "b@gmail.com",
      "status": "confirmed",
      "scheduledStartsAt": "2026-06-01T08:00:00Z",
      "scheduledEndsAt": "2026-06-01T09:00:00Z",
      "serviceType": "cv_review",
      "amount": 200000.0,
      "currencyCode": "VND",
      "meetingUrl": "https://meet.google.com/abc-xyz-123"
    }
  ]
}
```

#### 10. Chi tiết lịch hẹn (Mentor nhìn)
* **Route:** `GET /api/v1/mentor/bookings/{id:guid}`

#### 11. Cập nhật trạng thái cuộc hẹn
* **Route:** `POST /api/v1/mentor/bookings/{id:guid}/status`
* **Body:**
```json
{
  "status": "confirmed",
  "cancelReason": "Bận lịch đột xuất",
  "meetingUrl": "https://meet.google.com/abc-xyz-123"
}
```
> `cancelReason` bắt buộc khi `status=cancelled`. `meetingUrl` bắt buộc khi `status=confirmed`.

* **Response (200):**
```json
{ "message": "Cập nhật trạng thái thành công.", "previousStatus": "pending_payment", "currentStatus": "confirmed" }
```

#### 12. Cập nhật Meeting URL
* **Route:** `PATCH /api/v1/mentor/bookings/{id:guid}/meeting-url`
* **Body:**
```json
{ "meetingUrl": "https://meet.google.com/abc-xyz-123" }
```

#### 13. Xem danh sách khung giờ rảnh của mình
* **Route:** `GET /api/v1/mentor/availability`

#### 14. Cài đặt khung giờ rảnh
* **Route:** `PUT /api/v1/mentor/availability`
* **Body:**
```json
{
  "slots": [
    { "startsAt": "2026-06-01T08:00:00Z", "endsAt": "2026-06-01T09:00:00Z", "priceAmount": 200000.0, "currencyCode": "VND" },
    { "startsAt": "2026-06-01T09:30:00Z", "endsAt": "2026-06-01T10:30:00Z", "priceAmount": 200000.0, "currencyCode": "VND" }
  ]
}
```
* **Response (200):**
```json
{ "clearedCount": 2, "addedCount": 2 }
```

---

### Phân hệ 3: 🎓 Candidate API
*Header: `Authorization: Bearer <Token_Candidate>`*

#### 15. Đăng ký trở thành Mentor
* **Route:** `POST /api/v1/mentors/register`
* **Body:**
```json
{
  "fullName": "Nguyễn Văn A",
  "headline": "Senior .NET Engineer @ TechCorp",
  "bio": "Hơn 6 năm kinh nghiệm...",
  "yearsOfExperience": 6.5,
  "expertise": ["Backend"],
  "industries": ["Fintech"],
  "languages": ["Tiếng Việt"],
  "specialtyIds": ["e1f2g3h4-i5j6-4k7l-8m9n-0o1p2q3r4s5t"],
  "meetingUrl": "https://meet.google.com/abc-xyz-123"
}
```
* **Response (201):**
```json
{
  "message": "Đăng ký thành công. Vui lòng chờ quản trị viên phê duyệt.",
  "mentorProfileId": "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c"
}
```

#### 16. Tìm kiếm Mentor (cần đăng nhập)
* **Route:** `GET /api/v1/mentors`
* **Query Params:** `specialty`, `serviceType`, `rating`, `search`, `page`, `pageSize`

#### 17. Xem chi tiết Mentor (cần đăng nhập)
* **Route:** `GET /api/v1/mentors/{id:guid}`

#### 18. Xem khung giờ rảnh của Mentor (cần đăng nhập)
* **Route:** `GET /api/v1/mentors/{id:guid}/availability`

#### 19. ⚡ Đặt lịch hẹn & khởi tạo thanh toán PayOS
* **Route:** `POST /api/v1/mentor-bookings`
* **Body:**
```json
{
  "slotId": "a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p",
  "serviceType": "cv_review",
  "candidateNotes": "Nhờ mentor xem kỹ giúp em phần kinh nghiệm dự án .NET..."
}
```
> `serviceType` hợp lệ: `cv_review` | `mock_interview` | `career_coaching` | `technical_mentoring`

* **Response (200):**
```json
{
  "bookingId": "b1b2b3b4-b5b6-4b7b-8b8b-9b9b9b9b9b9b",
  "status": "pending_payment",
  "amount": 200000.0,
  "currencyCode": "VND",
  "checkoutSessionId": "08be8dfa-8091-46c5-8e57-ac646083e843",
  "checkoutUrl": "https://pay.payos.vn/web/fbaac18082b943b2bf60cfdd89d04dc7",
  "paymentInstructionsUrl": null
}
```

> ✅ **Frontend nhận `checkoutUrl` → redirect ngay: `window.location.href = checkoutUrl`**
> ❌ **Không dùng `paymentInstructionsUrl` (null / deprecated)**

* **Lỗi PayOS bị tắt (400):**
```json
{ "error": "Cổng thanh toán PayOS hiện đang tạm thời bị tắt. Vui lòng thử lại sau." }
```
* **Lỗi slot đã hết (400):**
```json
{ "error": "Availability slot is no longer available or is already reserved." }
```

#### 20. Danh sách lịch hẹn đã đặt (Candidate nhìn)
* **Route:** `GET /api/v1/mentor-bookings`
* **Query Params:** `page`, `pageSize`, `status`
* **Response (200):**
```json
{
  "total": 1, "page": 1, "pageSize": 20,
  "items": [
    {
      "id": "b1b2b3b4-...",
      "mentorName": "Nguyễn Văn A",
      "mentorAvatarUrl": "https://...",
      "status": "confirmed",
      "scheduledStartsAt": "2026-06-01T08:00:00Z",
      "scheduledEndsAt": "2026-06-01T09:00:00Z",
      "serviceType": "cv_review",
      "amount": 200000.0,
      "currencyCode": "VND",
      "meetingUrl": "https://meet.google.com/abc-xyz-123"
    }
  ]
}
```

#### 21. Chi tiết lịch hẹn đã đặt
* **Route:** `GET /api/v1/mentor-bookings/{id:guid}`

#### 22. Hủy lịch hẹn
* **Route:** `POST /api/v1/mentor-bookings/{id:guid}/cancel`
* **Body:**
```json
{ "reason": "Em có việc bận đột xuất." }
```

#### 23. Gửi đánh giá sau buổi hẹn
* **Route:** `POST /api/v1/mentor-bookings/{id:guid}/review`
* **Body:**
```json
{ "rating": 5, "comment": "Mentor chỉ ra lỗi CV rất chi tiết, hướng đi rõ ràng." }
```

---

### Phân hệ 4: 👑 Admin API
*Header: `Authorization: Bearer <Token_Admin>`*

#### 24. Danh sách toàn bộ Mentor (Admin)
* **Route:** `GET /api/v1/mentor/admin/mentors`
* **Query Params:** `search`, `isVerified`

#### 25. Phê duyệt / Hủy duyệt hồ sơ Mentor
* **Route:** `POST /api/v1/mentor/admin/mentors/{id:guid}/verify?verify=true`

#### 26. Đóng / Mở hoạt động Mentor
* **Route:** `POST /api/v1/mentor/admin/mentors/{id:guid}/status?status=active`

#### 27. Xem toàn bộ Booking (Admin)
* **Route:** `GET /api/v1/admin/mentor-bookings`

#### 28. CRUD Chuyên môn hệ thống
* **Route:** `POST|PUT|DELETE /api/v1/admin/mentors/specialties[/{id:guid}]`

---

## 💳 LUỒNG THANH TOÁN PAYOS - CHI TIẾT ĐẦY ĐỦ

### Sơ đồ toàn bộ:
```
[B1] POST /api/v1/mentor-bookings
     → Response: { checkoutUrl, checkoutSessionId, bookingId }
         ↓
[B2] Lưu checkoutSessionId vào state, redirect:
     window.location.href = checkoutUrl
     → Người dùng thanh toán trên trang PayOS (QR / thẻ ngân hàng)
         ↓
[B3] PayOS → Webhook → Backend
     → Backend xác nhận chữ ký → Booking: pending_payment → confirmed
     → PaymentTransaction được TẠO RA tại đây (chưa có trước thời điểm này!)
     → SignalR đẩy event: "payment.updated"
         ↓
[B4] PayOS redirect về:
     /payment/success?checkoutSessionId={id}&orderCode={code}  (thành công)
     /payment/cancel?checkoutSessionId={id}&orderCode={code}   (hủy)
         ↓
[B5] Frontend tại trang /payment/success — POLLING ĐÚNG CÁCH:
     ⚠️ KHÔNG gọi /billing/payments/{id} ngay — record chưa tồn tại!
     ✅ Gọi GET /api/v1/billing/checkout-sessions/{checkoutSessionId} (polling mỗi 5s)
     ✅ Lắng nghe SignalR event "payment.updated" song song
         ↓
     Nếu session.status = "pending"   → tiếp tục polling
     Nếu session.status = "succeeded" → gọi GET /billing/payments/{checkoutSessionId}
                                         để lấy thông tin đầy đủ → hiển thị thành công
     Nếu session.status = "failed"/"cancelled"/"expired" → hiển thị lỗi
```

> ⚠️ **QUAN TRỌNG**: `PaymentTransaction` chỉ được tạo ra SAU KHI PayOS Webhook bắn về thành công.
> Nếu polling `/billing/payments/{id}` ngay khi redirect về sẽ nhận lỗi `Payment.NotFound (404)`.
> **Phải dùng `/billing/checkout-sessions/{id}` để polling trước.**

---

### API 1: Polling trạng thái (dùng ngay khi về trang /payment/success)

#### `GET /api/v1/billing/checkout-sessions/{checkoutSessionId}`
> Endpoint này **luôn có dữ liệu** ngay từ lúc tạo booking. Dùng để polling.

* **Response (200) — Đang chờ:**
```json
{
  "id": "08be8dfa-8091-46c5-8e57-ac646083e843",
  "provider": "payos",
  "purpose": "mentor_booking",
  "description": "Đặt lịch Mentor với Nguyễn Văn A",
  "amount": 200000.0,
  "currencyCode": "VND",
  "status": "pending",
  "expiresAt": "2026-06-01T08:45:00Z",
  "completedAt": null,
  "failureReason": null,
  "createdAt": "2026-06-01T08:00:00Z"
}
```

* **Response (200) — Đã thanh toán thành công:**
```json
{
  "id": "08be8dfa-8091-46c5-8e57-ac646083e843",
  "status": "succeeded",
  "completedAt": "2026-06-01T08:15:00Z",
  ...
}
```

---

### API 2: Lấy thông tin payment (chỉ gọi SAU KHI status = "succeeded")

#### `GET /api/v1/billing/payments/{checkoutSessionId}`
> Chỉ tồn tại sau khi PayOS Webhook về thành công.

* **Response (200):**
```json
{
  "id": "08be8dfa-8091-46c5-8e57-ac646083e843",
  "provider": "payos",
  "planKey": null,
  "checkoutSessionId": "08be8dfa-8091-46c5-8e57-ac646083e843",
  "purpose": "mentor_booking",
  "description": "Đặt lịch Mentor với Nguyễn Văn A",
  "amount": 200000.0,
  "currencyCode": "VND",
  "status": "succeeded",
  "paidAt": "2026-06-01T08:15:00Z",
  "failedAt": null
}
```

---

### SignalR — Lắng nghe kết quả thanh toán

**Hub:** `wss://interviet-backend-api.onrender.com/hubs/notifications`

```typescript
connection.on("payment.updated", (payload) => {
  // payload: { paymentId, status, provider, purpose }
  if (payload.purpose === "mentor_booking" && payload.paymentId === currentPaymentId) {
    if (payload.status === "succeeded") showSuccessUI();
    if (payload.status === "failed")   showFailedUI();
  }
});
```

---

### URL Redirect từ PayOS về Frontend

| Kịch bản | URL |
|---|---|
| Thanh toán thành công | `https://interviet-frontend.vercel.app/payment/success?paymentId={id}` |
| Người dùng hủy | `https://interviet-frontend.vercel.app/payment/cancel?paymentId={id}` |

> ❌ **Không tin tưởng query params trên URL.** Luôn gọi API Backend để xác nhận status thật.

---

### Bảng trạng thái Booking:

| Status | Ý nghĩa | Hành vi UI |
|---|---|---|
| `pending_payment` | Chưa thanh toán / đang chờ PayOS | Hiện nút "Thanh toán ngay", đếm ngược 15 phút |
| `confirmed` | Đã thanh toán xong, Mentor xác nhận | Hiện meetingUrl, đếm ngược đến giờ hẹn |
| `completed` | Buổi hẹn kết thúc | Hiện nút "Viết đánh giá" |
| `cancelled` | Bị hủy | Hiện lý do hủy, nút đặt lại |

### Bảng trạng thái Payment:

| Status | Ý nghĩa | Hành vi UI |
|---|---|---|
| `pending` | Đang chờ PayOS | Spinner + polling |
| `succeeded` | ✅ Thanh toán OK | Màn hình thành công |
| `failed` | ❌ Lỗi PayOS | Lỗi + nút "Đặt lịch lại" |
| `cancelled` | Người dùng hủy trên PayOS | Thông báo + nút "Đặt lịch lại" |
| `expired` | Hết 15 phút chưa thanh toán | Thông báo hết hạn + nút "Đặt lịch lại" |

---

## 💡 CÁC LƯU Ý KỸ THUẬT QUAN TRỌNG

1. **❌ Không gọi `/payment-instructions`**: Endpoint này chỉ dành cho mock (đã tắt trên production). Không dựng UI chuyển khoản thủ công.

2. **❌ Không tin tưởng query params URL**: Khi PayOS redirect về, không tự cập nhật trạng thái dựa vào `?status=PAID`. Luôn gọi API Backend để xác nhận.

3. **🚨 Polling đúng thứ tự**:
   - Dùng `GET /billing/checkout-sessions/{id}` để polling (luôn tồn tại ngay từ đầu)
   - Chỉ gọi `GET /billing/payments/{id}` sau khi session `status = "succeeded"` (record mới được tạo)
   - Gọi `/billing/payments/{id}` ngay khi mới redirect về sẽ nhận `404 Payment.NotFound`

4. **⏱️ Slot bị lock 15 phút**: Sau khi đặt lịch, slot bị giữ 15 phút. Nếu không thanh toán → slot được giải phóng. Frontend nên hiển thị countdown timer.

5. **🔄 Nếu thanh toán thất bại**: Slot được giải phóng → User phải **đặt lịch lại từ đầu** (`POST /mentor-bookings` lần nữa).

6. **📡 Polling Fallback**: SignalR là realtime chính. Nếu SignalR lỗi → polling `GET /billing/checkout-sessions/{id}` mỗi 5s, tối đa 20 lần (~100s) rồi hiện nút kiểm tra thủ công.

7. **📅 Định dạng thời gian**: Tất cả datetime là **ISO 8601 UTC** (kết thúc bằng `Z`). Frontend chuyển sang GMT+7 khi hiển thị.

8. **📧 Email bất đồng bộ**: Email xác nhận gửi bằng Background Task. API trả `200 OK` ngay lập tức, không cần chờ email.

9. **🔑 serviceType hợp lệ**: `cv_review` | `mock_interview` | `career_coaching` | `technical_mentoring`

---

## 🧪 Pseudocode mẫu cho trang /payment/success

```typescript
async function handlePaymentSuccessPage(checkoutSessionId: string) {
  showLoadingSpinner();

  // Kết nối SignalR song song
  connection.on("payment.updated", (payload) => {
    if (payload.paymentId === checkoutSessionId && payload.purpose === "mentor_booking") {
      clearInterval(pollingInterval);
      if (payload.status === "succeeded") showSuccessUI();
      else showFailedUI(payload.status);
    }
  });

  // Polling checkout-sessions (KHÔNG phải /payments)
  let attempt = 0;
  const pollingInterval = setInterval(async () => {
    attempt++;
    if (attempt > 20) { // ~100 giây
      clearInterval(pollingInterval);
      showManualCheckUI(); // "Vui lòng kiểm tra lại lịch hẹn của bạn"
      return;
    }

    const session = await api.get(`/billing/checkout-sessions/${checkoutSessionId}`);
    const status = session.data.status;

    if (status === "succeeded") {
      clearInterval(pollingInterval);
      // Lúc này PaymentTransaction đã tồn tại → có thể gọi tiếp nếu cần
      // const payment = await api.get(`/billing/payments/${checkoutSessionId}`);
      showSuccessUI();
    } else if (["failed", "cancelled", "expired"].includes(status)) {
      clearInterval(pollingInterval);
      showFailedUI(status); // Nút "Đặt lịch lại"
    }
    // Nếu "pending" → tiếp tục polling
  }, 5000);
}
```
