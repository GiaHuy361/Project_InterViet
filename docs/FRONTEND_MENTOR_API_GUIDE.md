# 📘 HƯỚNG DẪN TÍCH HỢP FRONTEND - LUỒNG NGHIỆP VỤ MENTOR

Tài liệu này tổng hợp toàn bộ **luồng nghiệp vụ (flow)**, hướng dẫn các bước thực hiện và **chi tiết API Endpoints kèm JSON Payload mẫu** phục vụ cho việc tích hợp giao diện (Frontend) luồng Mentor trong hệ thống **INTER-VIET**.

---

## 🗺️ TỔNG QUAN CÁC BƯỚC THỰC HIỆN (FLOW WALKTHROUGH)

Để xây dựng một luồng Mentor hoàn chỉnh, Frontend cần thực hiện phối hợp các API theo 4 luồng chính sau:

```
LUỒNG 1: Đăng ký & Phê duyệt Chuyên gia
  Candidate → POST /api/v1/mentors/register
  Admin → POST /api/v1/mentor/admin/mentors/{id}/verify?verify=true
  Mentor → PUT /api/v1/mentor/profile (cập nhật hồ sơ đầy đủ)

LUỒNG 2: Cài đặt lịch rảnh
  Mentor → PUT /api/v1/mentor/availability

LUỒNG 3: Tìm kiếm → Đặt lịch → Thanh toán (PayOS)
  Candidate → GET /api/v1/mentors (tìm Mentor)
  Candidate → POST /api/v1/mentor-bookings (đặt lịch)
  Backend   → Trả về checkoutUrl (PayOS)
  Candidate → redirect sang checkoutUrl để thanh toán
  PayOS     → Webhook → Backend xác nhận → Booking thành succeeded
  Frontend  → Polling GET /api/v1/billing/payments/{paymentId} hoặc nhận SignalR

LUỒNG 4: Tiến hành hẹn & Đánh giá
  Mentor    → POST /api/v1/mentor/bookings/{id}/status (confirmed / completed)
  Candidate → POST /api/v1/mentor-bookings/{id}/review (đánh giá sao)
```

---

## 🗂️ CHI TIẾT API ENDPOINTS & PAYLOAD JSON MẪU

---

### Phân hệ 1: 🌐 Dành cho Ứng viên & Khách vãng lai (Public API)
*Không yêu cầu đăng nhập (AllowAnonymous), thích hợp dùng cho trang Landing Page, trang chủ.*

#### 1. Lấy danh sách Mentor công khai đã được Admin duyệt
* **HTTP Method:** `GET`
* **Route:** `/api/v1/public/mentors`
* **Query Params:**
  * `page` (Mặc định: 1)
  * `pageSize` (Mặc định: 20)
  * `search` (Tìm theo tên, bio, headline)
  * `specialty` (Mã chuyên môn, ví dụ: `dot-net`)
  * `minRating` (Đánh giá sao tối thiểu, ví dụ: `4.5`)
* **Response Body (200 OK):**
```json
{
  "total": 1,
  "page": 1,
  "pageSize": 20,
  "items": [
    {
      "id": "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
      "fullName": "Nguyễn Văn A",
      "headline": "Senior .NET Engineer @ TechCorp",
      "avatarUrl": "https://api.interviet.vn/avatars/mentor-a.jpg",
      "yearsOfExperience": 6.5,
      "ratingAverage": 4.9,
      "ratingCount": 12,
      "specialties": [
        {
          "id": "e1f2g3h4-i5j6-4k7l-8m9n-0o1p2q3r4s5t",
          "code": "dot-net",
          "name": ".NET Core",
          "description": "Lập trình C# Backend"
        }
      ]
    }
  ]
}
```

#### 2. Xem chi tiết hồ sơ công khai của 1 Mentor
* **HTTP Method:** `GET`
* **Route:** `/api/v1/public/mentors/{id:guid}`
* **Response Body (200 OK):**
```json
{
  "id": "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
  "fullName": "Nguyễn Văn A",
  "headline": "Senior .NET Engineer @ TechCorp",
  "avatarUrl": "https://api.interviet.vn/avatars/mentor-a.jpg",
  "bio": "Xin chào, mình có hơn 6 năm kinh nghiệm lập trình C# Backend và thiết kế hệ thống...",
  "yearsOfExperience": 6.5,
  "ratingAverage": 4.9,
  "ratingCount": 12,
  "expertise": ["Backend", "Microservices", "Docker"],
  "industries": ["Fintech", "E-commerce"],
  "languages": ["Tiếng Việt", "English"],
  "specialties": [
    {
      "id": "e1f2g3h4-i5j6-4k7l-8m9n-0o1p2q3r4s5t",
      "code": "dot-net",
      "name": ".NET Core",
      "description": "Lập trình C# Backend"
    }
  ],
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

#### 3. Lấy riêng danh sách khung giờ rảnh của 1 Mentor
* **HTTP Method:** `GET`
* **Route:** `/api/v1/public/mentors/{id:guid}/availability`
* **Response Body (200 OK):**
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

### Phân hệ 2: 💼 Dành cho bản thân Chuyên gia (Mentor Workspace API)
*Yêu cầu Token JWT của Mentor: `Headers -> Authorization: Bearer <Token_Mentor>`*

#### 4. Xem thông tin hồ sơ của tôi (Self Profile)
* **HTTP Method:** `GET`
* **Route:** `/api/v1/mentor/profile`
* **Response Body (200 OK):**
```json
{
  "id": "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
  "userId": "99999999-9999-9999-9999-999999999999",
  "isVerified": true,
  "fullName": "Nguyễn Văn A",
  "headline": "Senior .NET Engineer @ TechCorp",
  "avatarUrl": "https://...",
  "bio": "Hơn 6 năm kinh nghiệm...",
  "yearsOfExperience": 6.5,
  "ratingAverage": 4.9,
  "ratingCount": 12,
  "status": "active",
  "meetingUrl": "https://meet.google.com/abc-xyz-123",
  "expertise": ["Backend", "Microservices"],
  "industries": ["Fintech"],
  "languages": ["Tiếng Việt"],
  "specialties": []
}
```

#### 5. Tạo mới / Cập nhật hồ sơ chuyên gia của tôi
* **HTTP Method:** `PUT`
* **Route:** `/api/v1/mentor/profile`
* **Request Body (JSON):**
```json
{
  "fullName": "Nguyễn Văn A",
  "headline": "Senior .NET Engineer @ TechCorp",
  "avatarUrl": "https://api.interviet.vn/avatars/mentor-a.jpg",
  "bio": "Xin chào, mình có hơn 6 năm kinh nghiệm lập trình C# Backend...",
  "yearsOfExperience": 6.5,
  "expertise": ["Backend", "Microservices"],
  "industries": ["Fintech", "E-commerce"],
  "languages": ["Tiếng Việt", "English"],
  "meetingUrl": "https://meet.google.com/abc-xyz-123"
}
```
* **Response Body (200 OK):** Trả về thông tin hồ sơ đã cập nhật.

#### 6. Lấy danh sách danh mục Chuyên môn hệ thống (để hiển thị Selector cho Mentor chọn)
* **HTTP Method:** `GET`
* **Route:** `/api/v1/mentor/specialties`
* **Response Body (200 OK):**
```json
[
  {
    "id": "e1f2g3h4-i5j6-4k7l-8m9n-0o1p2q3r4s5t",
    "code": "dot-net",
    "name": ".NET Core",
    "description": "Lập trình C# Backend"
  }
]
```

#### 7. Gán chuyên môn vào hồ sơ cá nhân
* **HTTP Method:** `POST`
* **Route:** `/api/v1/mentor/profile/specialties`
* **Request Body (JSON):**
```json
{
  "specialtyIds": [
    "e1f2g3h4-i5j6-4k7l-8m9n-0o1p2q3r4s5t"
  ]
}
```
* **Response Body (200 OK):**
```json
{
  "mentorProfileId": "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
  "specialties": [
    {
      "id": "e1f2g3h4-i5j6-4k7l-8m9n-0o1p2q3r4s5t",
      "code": "dot-net",
      "name": ".NET Core"
    }
  ]
}
```

#### 8. Xem thống kê Dashboard của Mentor
* **HTTP Method:** `GET`
* **Route:** `/api/v1/mentor/dashboard/summary`
* **Response Body (200 OK):**
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

#### 9. Lấy danh sách lịch đặt hẹn của Mentor (Khách đặt lịch với mình)
* **HTTP Method:** `GET`
* **Route:** `/api/v1/mentor/bookings`
* **Query Params:** `status`, `search`, `page`, `pageSize`
* **Response Body (200 OK):**
```json
{
  "total": 1,
  "page": 1,
  "pageSize": 20,
  "items": [
    {
      "id": "b1b2b3b4-b5b6-4b7b-8b8b-9b9b9b9b9b9b",
      "userId": "11111111-1111-1111-1111-111111111111",
      "candidateName": "Ứng viên Nguyễn Văn B",
      "candidateEmail": "candidate.b@gmail.com",
      "candidateAvatarUrl": "https://...",
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

#### 10. Xem chi tiết 1 lịch đặt hẹn (dưới góc nhìn Mentor)
* **HTTP Method:** `GET`
* **Route:** `/api/v1/mentor/bookings/{id:guid}`
* **Response Body (200 OK):** Trả về chi tiết bản ghi bao gồm thông tin ứng viên và review nếu có.

#### 11. Cập nhật trạng thái cuộc hẹn (Mentor ấn Xác nhận, Hủy hoặc Hoàn thành)
* **HTTP Method:** `POST`
* **Route:** `/api/v1/mentor/bookings/{id:guid}/status`
* **Request Body (JSON):**
```json
{
  "status": "confirmed",
  "cancelReason": "Bận lịch đột xuất",
  "meetingUrl": "https://meet.google.com/abc-xyz-123"
}
```
> ⚠️ `cancelReason` bắt buộc khi `status = cancelled`. `meetingUrl` bắt buộc khi `status = confirmed`.

* **Response Body (200 OK):**
```json
{
  "message": "Cập nhật trạng thái lịch hẹn thành công.",
  "previousStatus": "pending_payment",
  "currentStatus": "confirmed"
}
```

#### 12. Cập nhật Link phòng họp trực tuyến (Meeting URL) của lịch hẹn
* **HTTP Method:** `PATCH`
* **Route:** `/api/v1/mentor/bookings/{id:guid}/meeting-url`
* **Request Body (JSON):**
```json
{
  "meetingUrl": "https://meet.google.com/abc-xyz-123"
}
```
* **Response Body (200 OK):**
```json
{
  "message": "Cập nhật link phòng họp thành công.",
  "meetingUrl": "https://meet.google.com/abc-xyz-123"
}
```

#### 13. Xem danh sách khung giờ rảnh cá nhân đã cấu hình
* **HTTP Method:** `GET`
* **Route:** `/api/v1/mentor/availability`

#### 14. Cài đặt / Cập nhật khung giờ rảnh mới (Thêm lịch rảnh)
* **HTTP Method:** `PUT`
* **Route:** `/api/v1/mentor/availability`
* **Request Body (JSON):**
```json
{
  "slots": [
    {
      "startsAt": "2026-06-01T08:00:00Z",
      "endsAt": "2026-06-01T09:00:00Z",
      "priceAmount": 200000.0,
      "currencyCode": "VND"
    },
    {
      "startsAt": "2026-06-01T09:30:00Z",
      "endsAt": "2026-06-01T10:30:00Z",
      "priceAmount": 200000.0,
      "currencyCode": "VND"
    }
  ]
}
```
* **Response Body (200 OK):**
```json
{
  "clearedCount": 2,
  "addedCount": 2
}
```

---

### Phân hệ 3: 🎓 Dành cho Ứng viên đã đăng nhập (Candidate API)
*Yêu cầu Token JWT của Candidate: `Headers -> Authorization: Bearer <Token_Candidate>`*

#### 15. Đăng ký trở thành Mentor (Mentor Onboarding Application)
* **HTTP Method:** `POST`
* **Route:** `/api/v1/mentors/register`
* **Request Body (JSON):**
```json
{
  "fullName": "Nguyễn Văn A",
  "headline": "Senior .NET Engineer @ TechCorp",
  "bio": "Xin chào, mình có hơn 6 năm kinh nghiệm lập trình C# Backend...",
  "yearsOfExperience": 6.5,
  "expertise": ["Backend", "Microservices"],
  "industries": ["Fintech", "E-commerce"],
  "languages": ["Tiếng Việt", "English"],
  "specialtyIds": [
    "e1f2g3h4-i5j6-4k7l-8m9n-0o1p2q3r4s5t"
  ],
  "meetingUrl": "https://meet.google.com/abc-xyz-123"
}
```
* **Response Body (201 Created):**
```json
{
  "message": "Đăng ký thành công. Vui lòng chờ quản trị viên phê duyệt hồ sơ của bạn.",
  "mentorProfileId": "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c"
}
```

#### 16. Duyệt danh sách Mentor dành cho Candidate đã đăng nhập
* **HTTP Method:** `GET`
* **Route:** `/api/v1/mentors`
* **Query Params:** `specialty`, `serviceType`, `rating`, `search`, `page`, `pageSize`

#### 17. Xem chi tiết Mentor (Yêu cầu đăng nhập)
* **HTTP Method:** `GET`
* **Route:** `/api/v1/mentors/{id:guid}`

#### 18. Xem khung giờ rảnh của Mentor (Yêu cầu đăng nhập)
* **HTTP Method:** `GET`
* **Route:** `/api/v1/mentors/{id:guid}/availability`

#### 19. Gửi yêu cầu đặt lịch hẹn (Book Mentor)
* **HTTP Method:** `POST`
* **Route:** `/api/v1/mentor-bookings`
* **Request Body (JSON):**
```json
{
  "slotId": "a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p",
  "serviceType": "cv_review",
  "candidateNotes": "Nhờ mentor xem kỹ giúp em phần kinh nghiệm dự án .NET..."
}
```
> `serviceType` hợp lệ: `cv_review` | `mock_interview` | `career_coaching` | `technical_mentoring`

* **Response Body (200 OK):**
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

> ✅ **Frontend chỉ cần lấy `checkoutUrl` và redirect người dùng sang đó.** Không gọi `paymentInstructionsUrl` (deprecated).

#### 20. Xem danh sách lịch hẹn đã đặt của Candidate
* **HTTP Method:** `GET`
* **Route:** `/api/v1/mentor-bookings`
* **Query Params:** `page`, `pageSize`, `status`
* **Response Body (200 OK):**
```json
{
  "total": 1,
  "page": 1,
  "pageSize": 20,
  "items": [
    {
      "id": "b1b2b3b4-b5b6-4b7b-8b8b-9b9b9b9b9b9b",
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

#### 21. Xem chi tiết lịch hẹn đã đặt
* **HTTP Method:** `GET`
* **Route:** `/api/v1/mentor-bookings/{id:guid}`

#### 22. Candidate chủ động Hủy lịch hẹn
* **HTTP Method:** `POST`
* **Route:** `/api/v1/mentor-bookings/{id:guid}/cancel`
* **Request Body (JSON):**
```json
{
  "reason": "Em có việc bận đột xuất giờ đó."
}
```

#### 23. Candidate gửi đánh giá & viết nhận xét (Sau khi hoàn thành cuộc hẹn)
* **HTTP Method:** `POST`
* **Route:** `/api/v1/mentor-bookings/{id:guid}/review`
* **Request Body (JSON):**
```json
{
  "rating": 5,
  "comment": "Mentor chỉ ra các lỗi CV rất chi tiết, hướng đi rõ ràng."
}
```
* **Response Body (200 OK):** Trả về bản ghi nhận xét vừa lưu thành công.

---

### Phân hệ 4: 👑 Dành cho Quản trị viên (Admin API)
*Yêu cầu Token JWT của Admin: `Headers -> Authorization: Bearer <Token_Admin>`*

#### 24. Lấy toàn bộ danh sách Mentor trong hệ thống để duyệt
* **HTTP Method:** `GET`
* **Route:** `/api/v1/mentor/admin/mentors`
* **Query Params:** `search`, `isVerified`

#### 25. Phê duyệt / Hủy duyệt hồ sơ chuyên gia
* **HTTP Method:** `POST`
* **Route:** `/api/v1/mentor/admin/mentors/{id:guid}/verify?verify=true`
* **Query Params:** `verify=true` (Duyệt) | `verify=false` (Hủy duyệt)

#### 26. Đóng / Mở hoạt động hồ sơ Mentor
* **HTTP Method:** `POST`
* **Route:** `/api/v1/mentor/admin/mentors/{id:guid}/status?status=active`
* **Query Params:** `status=active` | `status=inactive`

#### 27. Quản lý xem toàn bộ các Booking trong hệ thống
* **HTTP Method:** `GET`
* **Route:** `/api/v1/admin/mentor-bookings`

#### 28. Thêm mới / Cập nhật chuyên mục hệ thống (CRUD Chuyên Môn)
* **HTTP Method:** `POST` (Tạo mới) | `PUT` (Cập nhật) | `DELETE` (Xóa)
* **Route:** `/api/v1/admin/mentors/specialties` hoặc `/api/v1/admin/mentors/specialties/{id:guid}`

---

## 💳 LUỒNG THANH TOÁN PAYOS CHO MENTOR BOOKING (QUAN TRỌNG)

> ⚠️ **Lưu ý:** Từ Phase 18 trở đi, toàn bộ thanh toán đều dùng **PayOS thật**. Không còn sử dụng mock payment hay bank transfer thủ công nữa.

### Sơ đồ luồng đầy đủ:

```
[1] POST /api/v1/mentor-bookings
         ↓
  Backend tạo Booking (pending_payment) + CheckoutSession + gọi PayOS
         ↓
  Response trả về: checkoutUrl + checkoutSessionId + bookingId
         ↓
[2] Frontend redirect: window.location.href = checkoutUrl
         ↓
  Người dùng thanh toán trên trang PayOS (quét QR hoặc thẻ ngân hàng)
         ↓
[3] PayOS gọi Webhook → Backend (POST /api/v1/billing/payos/webhook)
  Backend xác nhận chữ ký → cập nhật Booking thành "confirmed" + tạo Invoice
         ↓
[4] PayOS redirect người dùng về returnUrl:
  https://interviet-frontend.vercel.app/payment/success?paymentId=xxx
         ↓
[5] Frontend tại trang /payment/success:
  → Gọi GET /api/v1/billing/payments/{paymentId} để kiểm tra status
  → Lắng nghe SignalR event "payment.updated" hoặc "subscription.activated"
         ↓
[6] Nếu status = "succeeded" → Hiển thị màn hình thành công
    Nếu status = "failed" / "cancelled" → Hiển thị lỗi + nút thử lại
```

---

### API Thanh toán chi tiết:

#### A. Kiểm tra trạng thái thanh toán (Polling tại trang Success/Cancel)
* **HTTP Method:** `GET`
* **Route:** `/api/v1/billing/payments/{paymentId}`
* **Lưu ý:** `paymentId` = `checkoutSessionId` (cùng một giá trị GUID)
* **Response Body (200 OK):**
```json
{
  "id": "08be8dfa-8091-46c5-8e57-ac646083e843",
  "provider": "payos",
  "planKey": null,
  "checkoutSessionId": "08be8dfa-8091-46c5-8e57-ac646083e843",
  "purpose": "mentor_booking",
  "description": "Đặt lịch mentor - CV Review",
  "amount": 200000.0,
  "currencyCode": "VND",
  "status": "succeeded",
  "paidAt": "2026-06-01T08:15:00Z",
  "failedAt": null
}
```

#### B. Xem chi tiết Checkout Session (nếu cần kiểm tra thêm)
* **HTTP Method:** `GET`
* **Route:** `/api/v1/billing/checkout-sessions/{id:guid}`
* **Response Body (200 OK):**
```json
{
  "id": "08be8dfa-8091-46c5-8e57-ac646083e843",
  "planKey": null,
  "provider": "payos",
  "purpose": "mentor_booking",
  "description": "Đặt lịch mentor - CV Review",
  "amount": 200000.0,
  "currencyCode": "VND",
  "status": "succeeded",
  "expiresAt": "2026-06-01T08:45:00Z",
  "completedAt": "2026-06-01T08:15:00Z",
  "failureReason": null,
  "createdAt": "2026-06-01T08:00:00Z"
}
```

#### C. Resume phiên thanh toán thất bại (Retry Payment)
> Dùng khi Booking ở trạng thái `pending_payment` nhưng session bị `failed` / `expired` / `cancelled`

* **HTTP Method:** `POST`
* **Route:** `/api/v1/billing/checkout-sessions/{id:guid}/resume`
* **Body:** Không cần body
* **Response Body (200 OK):**
```json
{
  "message": "Khôi phục phiên thanh toán thành công. Bạn có thể tiến hành thanh toán lại.",
  "checkoutSessionId": "08be8dfa-8091-46c5-8e57-ac646083e843",
  "status": "pending",
  "expiresAt": "2026-06-01T09:15:00Z",
  "paymentInstructionsUrl": "/api/v1/billing/checkout-sessions/08be8dfa-.../payment-instructions"
}
```
> ✅ Sau khi resume thành công → Gọi lại `GET /api/v1/billing/checkout-sessions/{id}` để lấy `checkoutUrl` mới rồi redirect sang PayOS lại.

---

### Sự kiện SignalR cần lắng nghe (tại trang /payment/success):

**Hub Endpoint:** `wss://interviet-backend-api.onrender.com/hubs/notifications`

```typescript
// Lắng nghe kết quả thanh toán mentor booking
connection.on("payment.updated", (payload) => {
  // payload.paymentId, payload.status ("succeeded" | "failed"), payload.purpose
  if (payload.purpose === "mentor_booking" && payload.paymentId === currentPaymentId) {
    if (payload.status === "succeeded") showSuccessUI();
    if (payload.status === "failed") showFailedUI();
  }
});
```

---

### Bảng trạng thái Booking Status:

| Status | Ý nghĩa | Hành vi UI |
|---|---|---|
| `pending_payment` | Chờ thanh toán qua PayOS | Hiện nút "Thanh toán ngay", spinner chờ |
| `confirmed` | Đã thanh toán + Mentor xác nhận | Hiện meetingUrl, đếm ngược đến giờ hẹn |
| `completed` | Buổi hẹn kết thúc | Hiện nút "Viết đánh giá" |
| `cancelled` | Bị hủy (bởi Mentor hoặc Candidate) | Hiện lý do hủy, nút đặt lại |

---

### Bảng trạng thái Checkout Session / Payment:

| Status | Ý nghĩa | Hành vi UI |
|---|---|---|
| `pending` | Đang chờ thanh toán | Hiện spinner, lắng nghe SignalR / polling |
| `succeeded` | Thanh toán thành công | ✅ Hiện màn hình chúc mừng |
| `failed` | Lỗi thanh toán từ PayOS | ❌ Hiện lỗi + nút Resume/Retry |
| `cancelled` | Người dùng hủy trên cổng PayOS | ❌ Hiện thông báo hủy + nút Resume/Retry |
| `expired` | Hết hạn 15 phút chưa thanh toán | ⏰ Hiện thông báo hết hạn + nút Resume/Retry |

---

## 💡 CÁC LƯU Ý KỸ THUẬT QUAN TRỌNG CHO FRONTEND

1. **Không dùng `paymentInstructionsUrl`**: Trường này đã deprecated. Frontend **tuyệt đối không** gọi endpoint `/payment-instructions` hay render UI chuyển khoản thủ công trong luồng PayOS.

2. **Không tin tưởng query params URL từ PayOS**: Khi PayOS redirect về `/payment/success?status=PAID`, **không** tự động cập nhật trạng thái dựa vào tham số URL. Luôn gọi `GET /api/v1/billing/payments/{id}` để xác nhận từ Backend.

3. **Polling fallback**: Nếu SignalR không hoạt động, chạy polling mỗi 5 giây, tối đa 20 lần (khoảng 100 giây). Sau đó hiển thị nút "Kiểm tra lại thủ công".

4. **Kiểu Dịch vụ (`serviceType`):** Phải thuộc 1 trong 4 giá trị sau:
   * `cv_review` (Đánh giá CV)
   * `mock_interview` (Phỏng vấn thử)
   * `career_coaching` (Định hướng nghề nghiệp)
   * `technical_mentoring` (Cố vấn kỹ thuật)

5. **Định dạng thời gian (Datetime):** Tất cả datetime đều là **ISO 8601 UTC** (kết thúc bằng `Z`). Frontend cần chuyển sang GMT+7 khi hiển thị.

6. **Email bất đồng bộ**: Toàn bộ email xác nhận đặt lịch, hóa đơn... được gửi bằng Background Task. API phản hồi `200 OK` ngay lập tức, không cần chờ email.

7. **Thời gian giữ chỗ slot**: Sau khi đặt lịch, slot bị lock **15 phút**. Nếu không thanh toán trong 15 phút, session hết hạn (`expired`) và slot được giải phóng. Frontend nên hiển thị countdown timer.

8. **Nút Resume/Retry**: Khi session ở trạng thái `failed` / `cancelled` / `expired`, hiển thị nút **"Thử lại thanh toán"** → gọi `POST /billing/checkout-sessions/{id}/resume` → redirect lại sang `checkoutUrl` mới.
