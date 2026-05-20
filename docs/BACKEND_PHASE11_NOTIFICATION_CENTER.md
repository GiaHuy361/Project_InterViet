# Backend Phase 11A — Notification Center

## Tổng quan

Phase 11A triển khai hệ thống thông báo in-app (polling-based) cho backend INTER-VIET. **Không dùng SignalR** trong phase này.

## Polling Strategy

Frontend **polling** `GET /api/v1/notifications/unread-count` mỗi **30-60 giây**. Khi có unread count > 0, hiển thị badge và trigger load danh sách.

---

## Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/v1/notifications` | Danh sách notifications (phân trang, lọc) |
| `GET` | `/api/v1/notifications/unread-count` | Số thông báo chưa đọc |
| `PATCH` | `/api/v1/notifications/{id}/read` | Đánh dấu 1 notification là đã đọc |
| `PATCH` | `/api/v1/notifications/read-all` | Đánh dấu tất cả đã đọc (optional: filter by type) |
| `DELETE` | `/api/v1/notifications/{id}` | Xóa mềm 1 notification |
| `GET` | `/api/v1/notifications/preferences` | Lấy notification preferences |
| `PUT` | `/api/v1/notifications/preferences` | Cập nhật notification preferences |
| `POST` | `/api/v1/notifications/test` | Tạo test notification (dev only) |

### Query Params cho GET /notifications

| Param | Type | Default | Mô tả |
|-------|------|---------|-------|
| `page` | int | 1 | Trang hiện tại |
| `pageSize` | int | 20 | Số items/trang (max: 100) |
| `isRead` | bool? | null | Lọc theo trạng thái đọc |
| `type` | string? | null | Lọc theo loại event |
| `priority` | string? | null | Lọc theo priority |

---

## Notification Types

| Type | Event | Trigger |
|------|-------|---------|
| `billing.payment_succeeded` | Thanh toán thành công | `BillingSuccessService.ProcessPaymentSuccessAsync` |
| `resume.parsed` | CV phân tích xong | Upload/Reprocess parse success |
| `resume.failed` | Phân tích CV thất bại | Upload/Reprocess parse failed |
| `match.completed` | Đối sánh hoàn thành | Single & Multi match complete |
| `match.failed` | Đối sánh thất bại | Single & Multi match failed |
| `interview.report_ready` | Báo cáo phỏng vấn sẵn sàng | `CompleteInterviewCommand` success |
| `interview.failed` | Phân tích phỏng vấn thất bại | `CompleteInterviewCommand` failed |
| `system.announcement` | Thông báo hệ thống | Test endpoint / manual |

## Priority Constants

| Priority | Dùng khi |
|----------|---------|
| `low` | Thông báo phụ |
| `normal` | Hầu hết các event (default) |
| `high` | Kết quả phỏng vấn, payment |
| `urgent` | Bảo mật, hệ thống khẩn |

---

## Preference Flags

| Flag | Mô tả |
|------|-------|
| `inAppNotificationsEnabled` | Master toggle |
| `emailNotificationsEnabled` | Email flag (Phase 11 flag only) |
| `billingNotificationsEnabled` | Billing events |
| `resumeNotificationsEnabled` | Resume events |
| `matchingNotificationsEnabled` | Match events |
| `interviewNotificationsEnabled` | Interview events |
| `mentorNotificationsEnabled` | Mentor events |
| `systemNotificationsEnabled` | System announcements |

**Default:** Tất cả = `true`. User chưa có record thì GET tự tạo record với defaults.

**Category mapping:**
- `billing.*` → `billingNotificationsEnabled`
- `resume.*` → `resumeNotificationsEnabled`
- `match.*` → `matchingNotificationsEnabled`
- `interview.*` → `interviewNotificationsEnabled`
- `system.*` → `systemNotificationsEnabled`

---

## Deduplication Strategy

**Query-before-insert** (không dùng DB unique constraint).

Format key: `{type}:{entityId}`

Ví dụ:
- `billing.payment_succeeded:{checkoutSessionId}`
- `resume.parsed:{resumeId}`
- `match.completed:{matchSessionId}`
- `interview.report_ready:{sessionId}`

Nếu đã có notification với cùng `deduplicationKey` (và chưa bị xóa mềm) → bỏ qua, log debug.

---

## Configuration

```json
{
  "Notifications": {
    "Enabled": true,
    "EnableTestEndpoint": true,
    "DefaultPageSize": 20,
    "MaxPageSize": 100
  }
}
```

**`Enabled: false`** → Không tạo notification nào (bỏ qua tất cả trigger).

**`EnableTestEndpoint: false`** → `POST /test` trả 403.

---

## Resilience

- `INotificationService.CreateAsync` **không throw exception** — log `Warning` và return silently.
- Tất cả triggers trong business flow được bọc trong `try-catch` để không làm hỏng flow chính.
- Notification failures không ảnh hưởng tới payment, CV parse, matching, hay interview.

---

## DB Tables

| Table | Mô tả |
|-------|-------|
| `app.Notifications` | In-app notifications |
| `app.NotificationPreferences` | User preferences (1 record/user) |

### Notification columns

| Column | Type | Mô tả |
|--------|------|-------|
| `Id` | UNIQUEIDENTIFIER | PK |
| `UserId` | UNIQUEIDENTIFIER | FK User |
| `Type` | NVARCHAR(100) | Event type |
| `Title` | NVARCHAR(250) | Tiêu đề |
| `Message` | NVARCHAR(2000) | Nội dung |
| `Priority` | NVARCHAR(20) | low/normal/high/urgent |
| `ActionUrl` | NVARCHAR(500) | Link action |
| `DataJson` | NVARCHAR(4000) | JSON payload |
| `IsRead` | BIT | Đã đọc |
| `ReadAt` | DATETIME2 | Thời điểm đọc |
| `DeduplicationKey` | NVARCHAR(200) | Dedup key |
| `CreatedAt` | DATETIME2 | Ngày tạo |
| `UpdatedAt` | DATETIME2? | Ngày update |
| `DeletedAt` | DATETIME2? | Soft delete |

---

## Migration

Migration name: `Phase11_NotificationCenter`

```bash
dotnet ef migrations add Phase11_NotificationCenter \
  --project src/Interviet.Infrastructure \
  --startup-project src/Interviet.Api

dotnet ef database update \
  --project src/Interviet.Infrastructure \
  --startup-project src/Interviet.Api
```

---

## Phase 11B (Future)

- SignalR real-time push notifications
- Admin broadcast notifications
- Email digest notifications
- Push notification (mobile)
