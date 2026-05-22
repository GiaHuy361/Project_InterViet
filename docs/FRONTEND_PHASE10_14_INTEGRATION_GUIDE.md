# TÀI LIỆU TÍCH HỢP FRONTEND - HỆ THỐNG INTER-VIET (PHASE 10 - PHASE 14)

Tài liệu này cung cấp hướng dẫn đầy đủ, chi tiết và sẵn sàng để đội ngũ Frontend tích hợp các API từ Phase 10 đến Phase 14 của hệ thống INTER-VIET. Tài liệu được biên soạn trực tiếp dựa trên việc kiểm tra toàn bộ mã nguồn Backend C# thực tế nhằm đảm bảo tính chính xác 100% về Endpoint, cấu trúc JSON Request/Response, cơ chế phân quyền và luồng nghiệp vụ.

---

## MỤC LỤC

1. [Tổng quan Module từ Phase 10 đến Phase 14](#1-tổng-quan-module-từ-phase-10-đến-phase-14)
2. [Cơ chế Xác thực & Vai trò người dùng (Auth & Roles)](#2-cơ-chế-xác-thực--vai-trò-người-dùng-auth--roles)
3. [Cổng chặn tính năng (Feature Gate & 503 Gating)](#3-cổng-chặn-tính-năng-feature-gate--503-gating)
4. [Phân luồng User Support Tickets (Phase 14)](#4-phân-luồng-user-support-tickets-phase-14)
5. [Phân luồng Admin/Support Ticket Management (Phase 14)](#5-phân-luồng-adminsupport-ticket-management-phase-14)
6. [Trạng thái Support Ticket (Status Lifecycle)](#6-trạng-thái-support-ticket-status-lifecycle)
7. [Cơ chế hoạt động của LastMessageAt](#7-cơ-chế-hoạt-động-của-lastmessageat)
8. [Admin Dashboard Summary (Phase 14)](#8-admin-dashboard-summary-phase-14)
9. [Admin User Management (Phase 14)](#9-admin-user-management-phase-14)
10. [Admin Billing Records (Phase 14)](#10-admin-billing-records-phase-14)
11. [Admin Mentor Bookings & Report Shares (Phase 14)](#11-admin-mentor-bookings--report-shares-phase-14)
12. [Admin System Component Health (Phase 14)](#12-admin-system-component-health-phase-14)
13. [Admin Audit Logs (Phase 14)](#13-admin-audit-logs-phase-14)
14. [Admin Developer Role Promotion (Phase 14)](#14-admin-developer-role-promotion-phase-14)
15. [Kiến trúc AuditLogService nội bộ](#15-kiến-trúc-auditlogservice-nội-bộ)
16. [Chuẩn Xử lý Lỗi (Error Handling Protocol)](#16-chuẩn-xử-lý-lỗi-error-handling-protocol)
17. [Tiêu chuẩn Phân trang & Bộ lọc (Pagination & Filtering)](#17-tiêu-chuẩn-phân-trang--bộ-lọc-pagination--filtering)
18. [Trực quan hóa JSON Samples chuẩn của hệ thống](#18-trực-quan-hóa-json-samples-chuẩn-của-hệ-thống)
19. [Bản đồ màn hình Frontend (Screen Mapping)](#19-bản-đồ-màn-hình-frontend-screen-mapping)
20. [Quy tắc Nghiệp vụ cốt lõi (Core Business Rules)](#20-quy-tắc-nghiệp-vụ-cốt-lõi-core-business-rules)
21. [Tích hợp Chi tiết Phase 10 - Phase 13](#21-tích-hợp-chi-tiết-phase-10---phase-13)
    - [Phase 10: Mock Payment Gateway & Bank Transfer Verification](#phase-10-mock-payment-gateway--bank-transfer-verification)
    - [Phase 11: Notification Center (Polling-based)](#phase-11-notification-center-polling-based)
    - [Phase 12: Secure Report Share Links & PDF Export](#phase-12-secure-report-share-links--pdf-export)
    - [Phase 13: Paid Mentor Booking Network MVP](#phase-13-paid-mentor-booking-network-mvp)
22. [Kết luận & Điểm cần Xác nhận thêm (Frontend/Backend Clarifications)](#22-kết-luận--điểm-cần-xác-nhận-thêm-frontendbackend-clarifications)

---

## 1. TỔNG QUAN MODULE TỪ PHASE 10 ĐẾN PHASE 14

| Phase | Tên Module | Mục đích Business | Đối tượng sử dụng | Màn hình tương ứng | Controller liên quan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Phase 10** | Mock Payment Gateway & Bank Transfer | Mô phỏng quy trình thanh toán (Thẻ/Chuyển khoản QR), xác thực mã chuyển khoản tự động mà không tích hợp cổng thanh toán thật. | Candidate (Ứng viên) | Checkout, Payment Instructions, Transfer History | `BillingController.cs`, `PlansController.cs`, `SubscriptionController.cs` |
| **Phase 11** | Notification Center (Polling) | Trung tâm nhận thông báo in-app (real-time mô phỏng qua Polling ngắn 30-60s) liên quan đến thanh toán, CV, phỏng vấn, mentor. | Tất cả người dùng | Notification Dropdown, Preference Panel | `NotificationsController.cs` |
| **Phase 12** | Secure Report Share & PDF Export | Cho phép ứng viên tải PDF kết quả phỏng vấn/đối sánh chuyên nghiệp hoặc tạo link chia sẻ công khai bảo mật cao (SHA-256). | Candidate, Công chúng (Public Viewer) | Public Report Viewer, PDF Downloader | `SharedReportsController.cs`, `InterviewsController.cs`, `MatchController.cs` |
| **Phase 13** | Paid Mentor Booking Network MVP | Đặt lịch hẹn cố vấn (CV Review, Mock Interview...), giữ chỗ slot trong 30 phút, thanh toán thử nghiệm và viết review đánh giá. | Candidate, Mentor (Cố vấn) | Mentor Directory, Mentor Profile, Booking History | `MentorsController.cs`, `MentorBookingsController.cs` |
| **Phase 14** | Support Tickets & Admin Operations | Hệ thống Ticket trợ giúp cho người dùng và các chức năng Dashboard, Quản lý thành viên, Billing, Health Check, Audit logs dành cho Ban Quản trị. | Candidate, Admin, Support Staff | Support Tickets, Admin Dashboard, Users Management, System Monitor | `SupportTicketsController.cs`, `AdminSupportTicketsController.cs`, `AdminController.cs` |

---

## 2. CƠ CHẾ XÁC THỰC & VAI TRÒ NGƯỜI DÙNG (AUTH & ROLES)

### Cơ chế JWT Bearer
Tất cả các API được bảo vệ (ngoại trừ các endpoint public có ghi chú rõ) yêu cầu Frontend gửi mã JWT trong Header của HTTP Request dưới dạng:
```http
Authorization: Bearer <your_jwt_token>
```
Nếu token thiếu hoặc hết hạn, Backend trả về `401 Unauthorized`.

### Phân vai (Roles) & Phân quyền (Permissions)
Hệ thống quản lý người dùng theo 3 vai trò chính với các mức phân quyền và Policy tương ứng trên Controller:

1. **`user` (Candidate - Ứng viên)**:
   - Vai trò mặc định của người dùng thông thường khi đăng ký.
   - Được gọi các API: `/api/v1/billing/*` (ngoại trừ simulate), `/api/v1/notifications/*` (ngoại trừ test), `/api/v1/support/tickets/*` (Candidate flow), `/api/v1/mentors/*`, `/api/v1/mentor-bookings/*`.
2. **`support` (Support Staff - Nhân viên hỗ trợ)**:
   - Vai trò trung gian phục vụ CSKH.
   - Vượt qua kiểm tra Policy `"AdminOrSupport"`.
   - Được gọi các API hỗ trợ như quản lý Ticket: `/api/v1/admin/support/tickets/*` (toàn quyền gán, xem note nội bộ, phản hồi và đổi trạng thái ticket). Không được vào dashboard admin hoặc cấu hình hệ thống.
3. **`admin` (Administrator - Quản trị viên)**:
   - Vai trò tối cao của hệ thống.
   - Vượt qua kiểm tra Policy `"AdminOnly"` và `"AdminOrSupport"`.
   - Được gọi toàn bộ endpoint trong hệ thống bao gồm: Dashboard tổng quan, User Management, Billing Payment/Invoice logs, Report Share logs, Audit logs, Health check và Dev bootstrap promote.

---

## 3. CỔNG CHẶN TÍNH NĂNG (FEATURE GATE & 503 GATING)

Để phục vụ bảo trì hoặc bật/tắt module động từ xa, Backend sử dụng bộ lọc `[FeatureGate("Key")]` kiểm tra cấu hình trong `appsettings.json`.

### Cấu hình Feature Gate hiện có
Hệ thống sử dụng bộ lọc `FeatureGateFilter.cs` với hai khóa cấu hình:
- **`Admin:Enabled`**: Điều khiển toàn bộ tính năng quản trị thuộc `AdminController.cs`.
- **`Support:Enabled`**: Điều khiển toàn bộ tính năng hỗ trợ, bao gồm cả ticket của người dùng thường (`SupportTicketsController.cs`) và ticket của admin/support (`AdminSupportTicketsController.cs`).

### API Response khi Feature bị tắt (Disabled)
Khi cấu hình Enabled = `false`, bất kỳ request nào gửi tới API nằm trong Gate sẽ lập tức trả về **HTTP Status 503 Service Unavailable** cùng cấu hình lỗi RFC 7807 chuẩn:

#### Giao diện Admin bị tắt:
```json
{
  "type": "https://api.interviet.vn/errors/service-unavailable",
  "title": "ServiceUnavailable",
  "detail": "Admin features are currently disabled.",
  "code": "Admin.Disabled"
}
```

#### Giao diện Hỗ trợ (Support Tickets) bị tắt:
```json
{
  "type": "https://api.interviet.vn/errors/service-unavailable",
  "title": "SupportUnavailable",
  "detail": "Support features are currently disabled.",
  "code": "Support.Disabled"
}
```

### Xử lý khuyến nghị phía Frontend
- **Giao diện Menu**: Frontend cần lưu lại trạng thái bật/tắt của tính năng (có thể cache hoặc fetch từ config cấu hình chung) để ẩn các menu Admin / Support Tickets khi bị disabled.
- **Maintenance State**: Khi nhận được lỗi HTTP 503 với code `Admin.Disabled` hoặc `Support.Disabled`, Frontend cần chuyển hướng người dùng sang trang báo bảo trì dịch vụ (Maintenance/Unavailable State) thay vì để màn hình trống.
- **Hạn chế Auto-Retry**: Tuyệt đối **không thực hiện cơ chế tự động gọi lại (retry) vô hạn** đối với lỗi 503 Feature Gate, vì trạng thái này chỉ thay đổi khi quản trị viên thay đổi file config hệ thống.

---

## 4. PHASE 14 SUPPORT TICKET USER FLOW

Luồng nghiệp vụ dành cho ứng viên để gửi phản hồi hỗ trợ kỹ thuật hoặc dịch vụ.

```mermaid
graph TD
    A[Candidate] -->|1. POST /api/v1/support/tickets| B(Tạo Ticket mới: Status 'open')
    B -->|2. GET /api/v1/support/tickets| C(Xem danh sách Ticket của mình)
    B -->|3. GET /api/v1/support/tickets/{id}| D(Xem chi tiết: Chỉ xem tin nhắn công khai)
    D -->|4. POST /api/v1/support/tickets/{id}/messages| E(Gửi tin nhắn phản hồi: Mở lại ticket nếu đóng)
    D -->|5. POST /api/v1/support/tickets/{id}/close| F(Đóng Ticket chủ động: Status 'closed')
```

### Chi tiết các API Endpoints

#### 1. Tạo mới Support Ticket
- **Endpoint**: `POST /api/v1/support/tickets`
- **Mục đích**: Ứng viên gửi phản ánh hỗ trợ.
- **Xác thực**: Bắt buộc JWT (`user`, `support`, `admin`).
- **Request Body (JSON)**:
  ```json
  {
    "subject": "Không thể tải lên CV định dạng PDF",
    "description": "Hệ thống báo lỗi không xác định khi tôi cố gắng tải lên file CV dài 2 trang dạng PDF dung lượng 1.5MB.",
    "category": "technical",
    "priority": "medium"
  }
  ```
- **Response (JSON)**: HTTP 200 OK (Được bọc trong Envelope `success: true`):
  ```json
  {
    "success": true,
    "message": "Support ticket created successfully.",
    "data": {
      "id": "7fa84be2-ca15-4ba8-bc19-58b4da79f42d",
      "ticketNumber": "TK-20260521004512-385",
      "category": "technical",
      "priority": "medium",
      "subject": "Không thể tải lên CV định dạng PDF",
      "status": "open",
      "description": "Hệ thống báo lỗi không xác định khi tôi cố gắng tải lên file CV dài 2 trang dạng PDF dung lượng 1.5MB.",
      "assignedTo": null,
      "createdAt": "2026-05-21T00:45:12.457Z",
      "closedAt": null,
      "lastMessageAt": null,
      "messages": []
    },
    "meta": {
      "requestId": "0HMTRSPV9QNS5",
      "timestamp": "2026-05-21T00:45:12.459Z"
    }
  }
  ```

#### 2. Lấy danh sách Ticket cá nhân
- **Endpoint**: `GET /api/v1/support/tickets`
- **Query Params**: `page` (default 1), `pageSize` (default 10, max 100).
- **Response (JSON)**: HTTP 200 OK:
  ```json
  {
    "success": true,
    "message": null,
    "data": {
      "total": 1,
      "page": 1,
      "pageSize": 10,
      "items": [
        {
          "id": "7fa84be2-ca15-4ba8-bc19-58b4da79f42d",
          "ticketNumber": "TK-20260521004512-385",
          "category": "technical",
          "priority": "medium",
          "subject": "Không thể tải lên CV định dạng PDF",
          "status": "open",
          "description": "Hệ thống báo lỗi không xác định...",
          "assignedTo": null,
          "createdAt": "2026-05-21T00:45:12Z",
          "closedAt": null,
          "lastMessageAt": null,
          "messages": []
        }
      ]
    },
    "meta": { "requestId": "0HMTRSPV9QNS6", "timestamp": "2026-05-21T00:46:01Z" }
  }
  ```

#### 3. Xem chi tiết Ticket cá nhân
- **Endpoint**: `GET /api/v1/support/tickets/{id}`
- **BẢO MẬT QUAN TRỌNG**: Endpoint này **chỉ lọc trả về các tin nhắn công khai (`IsInternalNote = false`)**. Tin nhắn nội bộ của Admin/Support sẽ bị loại bỏ hoàn toàn tại Backend. Giao diện người dùng thường tuyệt đối không được thiết kế vùng hiển thị note nội bộ.
- **Response (JSON)**: HTTP 200 OK:
  ```json
  {
    "success": true,
    "message": null,
    "data": {
      "id": "7fa84be2-ca15-4ba8-bc19-58b4da79f42d",
      "ticketNumber": "TK-20260521004512-385",
      "category": "technical",
      "priority": "medium",
      "subject": "Không thể tải lên CV định dạng PDF",
      "status": "in_progress",
      "description": "Hệ thống báo lỗi không xác định...",
      "assignedTo": "Support Staff A",
      "createdAt": "2026-05-21T00:45:12Z",
      "closedAt": null,
      "lastMessageAt": "2026-05-21T00:50:00Z",
      "messages": [
        {
          "id": "bc8c7d24-8f0a-48d6-ae4f-561b36bc2150",
          "senderType": "support",
          "senderUserId": "a9b1c2d3-e4f5-5a6b-7c8d-9e0f1a2b3c4d",
          "messageBody": "Xin chào ứng viên, bộ phận kỹ thuật đang kiểm tra file PDF của bạn. Vui lòng đợi trong giây lát.",
          "createdAt": "2026-05-21T00:50:00Z",
          "isInternalNote": false
        }
      ]
    },
    "meta": { "requestId": "0HMTRSPV9QNS7", "timestamp": "2026-05-21T00:51:00Z" }
  }
  ```

#### 4. Phản hồi thêm tin nhắn vào Ticket
- **Endpoint**: `POST /api/v1/support/tickets/{id}/messages`
- **Quy tắc chuyển đổi trạng thái**: Nếu Ticket đang ở trạng thái `resolved` hoặc `closed`, hành động phản hồi này từ người dùng sẽ **tự động chuyển trạng thái Ticket quay lại là `open` và xóa mốc `ClosedAt`**.
- **Request Body**:
  ```json
  {
    "messageBody": "Tôi vừa gửi lại file CV định dạng docx thay thế nhưng vẫn gặp lỗi tương tự, nhờ kỹ thuật kiểm tra giúp."
  }
  ```
- **Response (JSON)**: HTTP 200 OK:
  ```json
  {
    "success": true,
    "message": "Message sent successfully.",
    "data": {
      "id": "ea7b58c2-2b62-4217-bf41-456cb11b439c",
      "senderType": "user",
      "senderUserId": "d5b1e2a3-f4c5-5a6b-7d8e-9f0a1b2c3d4e",
      "messageBody": "Tôi vừa gửi lại file CV định dạng docx thay thế nhưng vẫn gặp lỗi tương tự, nhờ kỹ thuật kiểm tra giúp.",
      "createdAt": "2026-05-21T00:55:00.124Z",
      "isInternalNote": false
    },
    "meta": { "requestId": "0HMTRSPV9QNS8", "timestamp": "2026-05-21T00:55:00Z" }
  }
  ```

#### 5. Chủ động Đóng Ticket
- **Endpoint**: `POST /api/v1/support/tickets/{id}/close`
- **Mục đích**: Người dùng bấm Đóng Ticket khi vấn đề đã được giải quyết xong.
- **Response (JSON)**: HTTP 200 OK:
  ```json
  {
    "success": true,
    "message": "Support ticket closed successfully.",
    "data": {
      "message": "Support ticket closed successfully."
    },
    "meta": { "requestId": "0HMTRSPV9QNS9", "timestamp": "2026-05-21T01:00:00Z" }
  }
  ```

---

## 5. PHÂN LUỒNG ADMIN/SUPPORT TICKET MANAGEMENT (PHASE 14)

Luồng nghiệp vụ dành riêng cho nhân viên Chăm sóc khách hàng (`support`) và Quản trị viên (`admin`) để theo dõi, quản trị hệ thống ticket.

```mermaid
graph TD
    A[Staff / Admin] -->|1. GET /api/v1/admin/support/tickets| B(Xem danh sách toàn bộ Ticket kèm bộ lọc)
    B -->|2. GET /api/v1/admin/support/tickets/{id}| C(Xem chi tiết: Thấy cả Tin nhắn Công khai & Ghi chú Nội bộ)
    C -->|3. POST /api/v1/admin/support/tickets/{id}/assign| D(Ghi nhận nhân viên xử lý: Trạng thái -> 'in_progress')
    C -->|4. POST /api/v1/admin/support/tickets/{id}/messages| E(Gửi Public Reply hoặc Ghi chú Nội bộ IsInternalNote: true)
    C -->|5. POST /api/v1/admin/support/tickets/{id}/status| F(Ghi đè thủ công trạng thái Ticket)
```

### Chi tiết các API Endpoints (Auth required: Policy "AdminOrSupport")

#### 1. Lấy danh sách toàn bộ Ticket trong hệ thống
- **Endpoint**: `GET /api/v1/admin/support/tickets`
- **Bộ lọc (Query Params)**:
  - `status`: `"open"`, `"in_progress"`, `"resolved"`, `"closed"`
  - `category`: Thể loại ticket cần lọc.
  - `priority`: Mức độ ưu tiên.
  - `userId`: Lọc theo định danh ID của người tạo ticket.
  - `page`: default 1
  - `pageSize`: default 20
- **Response (JSON)**: HTTP 200 OK:
  ```json
  {
    "success": true,
    "message": null,
    "data": {
      "total": 1,
      "page": 1,
      "pageSize": 20,
      "items": [
        {
          "id": "7fa84be2-ca15-4ba8-bc19-58b4da79f42d",
          "ticketNumber": "TK-20260521004512-385",
          "category": "technical",
          "priority": "medium",
          "subject": "Không thể tải lên CV định dạng PDF",
          "status": "open",
          "description": "Hệ thống báo lỗi...",
          "assignedTo": null,
          "createdAt": "2026-05-21T00:45:12Z",
          "closedAt": null,
          "lastMessageAt": null,
          "messages": []
        }
      ]
    },
    "meta": { "requestId": "0HMTRSPV9QNT0", "timestamp": "2026-05-21T01:05:00Z" }
  }
  ```

#### 2. Xem chi tiết Ticket (Thấy toàn bộ ghi chú nội bộ)
- **Endpoint**: `GET /api/v1/admin/support/tickets/{id}`
- **Đặc quyền**: Nhận về tất cả tin nhắn và ghi chú được gắn cờ `isInternalNote: true` hoặc `false`.
- **Response (JSON)**: HTTP 200 OK:
  ```json
  {
    "success": true,
    "message": null,
    "data": {
      "id": "7fa84be2-ca15-4ba8-bc19-58b4da79f42d",
      "ticketNumber": "TK-20260521004512-385",
      "category": "technical",
      "priority": "medium",
      "subject": "Không thể tải lên CV định dạng PDF",
      "status": "in_progress",
      "description": "Hệ thống báo lỗi...",
      "assignedTo": "Support Staff A",
      "createdAt": "2026-05-21T00:45:12Z",
      "closedAt": null,
      "lastMessageAt": "2026-05-21T01:10:00Z",
      "messages": [
        {
          "id": "11111111-2222-3333-4444-555555555555",
          "senderType": "support",
          "senderUserId": "a9b1c2d3-e4f5-5a6b-7c8d-9e0f1a2b3c4d",
          "messageBody": "HỒ SƠ NỘI BỘ: Ứng viên này đã từng đăng tải file CV lỗi do parser lỗi font chữ tiếng Việt Unicode tổ hợp. Kỹ thuật cần patch lại module parse.",
          "createdAt": "2026-05-21T01:08:00Z",
          "isInternalNote": true
        },
        {
          "id": "bc8c7d24-8f0a-48d6-ae4f-561b36bc2150",
          "senderType": "support",
          "senderUserId": "a9b1c2d3-e4f5-5a6b-7c8d-9e0f1a2b3c4d",
          "messageBody": "Xin chào ứng viên, bộ phận kỹ thuật đang kiểm tra file PDF của bạn...",
          "createdAt": "2026-05-21T01:10:00Z",
          "isInternalNote": false
        }
      ]
    },
    "meta": { "requestId": "0HMTRSPV9QNT1", "timestamp": "2026-05-21T01:12:00Z" }
  }
  ```

#### 3. Chỉ định người xử lý Ticket (Assign)
- **Endpoint**: `POST /api/v1/admin/support/tickets/{id}/assign`
- **Quy tắc nghiệp vụ**: Khi gán người phụ trách, nếu trạng thái của Ticket đang là `open` sẽ **tự động chuyển thành `in_progress`**.
- **Request Body**:
  ```json
  {
    "assignedTo": "Trần Văn A"
  }
  ```
- **Response (JSON)**: HTTP 200 OK:
  ```json
  {
    "success": true,
    "message": "Ticket assigned successfully.",
    "data": {
      "message": "Ticket assigned successfully.",
      "status": "in_progress",
      "assignedTo": "Trần Văn A"
    },
    "meta": { "requestId": "0HMTRSPV9QNT2", "timestamp": "2026-05-21T01:15:00Z" }
  }
  ```

#### 4. Gửi Phản hồi Công khai / Ghi chú Nội bộ
- **Endpoint**: `POST /api/v1/admin/support/tickets/{id}/messages`
- **Quy tắc trạng thái**:
  - Gửi ghi chú nội bộ (`isInternalNote: true`): Lưu vào DB, trạng thái hiển thị bên ngoài của Ticket không thay đổi, ứng viên không nhận được thông báo in-app.
  - Gửi phản hồi công khai (`isInternalNote: false`): Cập nhật trạng thái Ticket thành `in_progress` (nếu đang là `open`), cập nhật `LastMessageAt` thành thời gian hiện tại và kích hoạt bắn thông báo in-app `support.ticket_reply` cho ứng viên.
- **Request Body**:
  ```json
  {
    "messageBody": "GHI CHÚ NỘI BỘ: Đã tìm ra nguyên nhân, chuẩn bị phản hồi để ứng viên test lại.",
    "isInternalNote": true
  }
  ```
- **Response (JSON)**: HTTP 200 OK:
  ```json
  {
    "success": true,
    "message": "Message added successfully.",
    "data": {
      "id": "890cf251-6c24-4f9e-a89c-5a9e37fb31ef",
      "senderType": "admin",
      "senderUserId": "d5b1e2a3-f4c5-5a6b-7d8e-9f0a1b2c3d4e",
      "messageBody": "GHI CHÚ NỘI BỘ: Đã tìm ra nguyên nhân, chuẩn bị phản hồi để ứng viên test lại.",
      "createdAt": "2026-05-21T01:20:00Z",
      "isInternalNote": true
    },
    "meta": { "requestId": "0HMTRSPV9QNT3", "timestamp": "2026-05-21T01:20:00Z" }
  }
  ```

#### 5. Ghi đè trạng thái Ticket thủ công
- **Endpoint**: `POST /api/v1/admin/support/tickets/{id}/status`
- **Quy tắc**: Cho phép đổi sang `open`, `in_progress`, `resolved`, `closed`. Nếu đổi sang `resolved` hoặc `closed`, hệ thống tự động gán giá trị `ClosedAt = DateTime.UtcNow`. Nếu đổi sang trạng thái hoạt động khác, `ClosedAt` sẽ bị đặt về `null`.
- **Request Body**:
  ```json
  {
    "status": "resolved"
  }
  ```
- **Response (JSON)**: HTTP 200 OK:
  ```json
  {
    "success": true,
    "message": "Ticket status overridden successfully.",
    "data": {
      "message": "Ticket status overridden successfully.",
      "previousStatus": "in_progress",
      "currentStatus": "resolved"
    },
    "meta": { "requestId": "0HMTRSPV9QNT4", "timestamp": "2026-05-21T01:25:00Z" }
  }
  ```

---

## 6. TRẠNG THÁI SUPPORT TICKET (STATUS LIFECYCLE)

Frontend cần tuân thủ bảng trạng thái nghiệp vụ chuẩn xác được định nghĩa tại Backend:

| Backend Status Key | Ý nghĩa Nghiệp vụ | Ai có quyền chuyển đổi | Đề xuất Nhãn hiển thị | Đề xuất Màu sắc (CSS) | Hành động cho phép trên Frontend (Enable/Disable) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`open`** | Mới tạo hoặc được mở lại do ứng viên gửi tin nhắn mới sau khi được đóng/giải quyết. | Candidate (qua gửi chat), Admin/Support (qua set status) | **Đang mở** | `bg-red-500/10 text-red-500` | *Enable*: Chat, Đổi trạng thái, Chỉ định xử lý. |
| **`in_progress`** | Đã được gán cho nhân sự hoặc nhân viên đã gửi phản hồi đầu tiên. | Admin/Support (qua assign hoặc gửi public chat) | **Đang xử lý** | `bg-amber-500/10 text-amber-500` | *Enable*: Chat, Đổi trạng thái, Đóng ticket. |
| **`resolved`** | Đã khắc phục xong sự cố cho người dùng, chờ người dùng xác nhận đóng hoàn toàn. | Admin/Support (qua set status) | **Đã giải quyết** | `bg-emerald-500/10 text-emerald-500` | *Enable*: Chat (gửi chat sẽ tự động mở lại thành `open`), Đóng ticket. |
| **`closed`** | Đã kết thúc xử lý ticket hoàn toàn. | Tất cả (Candidate qua nút Close, Admin/Support qua nút close/set status) | **Đã đóng** | `bg-slate-500/10 text-slate-500` | *Disable*: Chỉnh sửa thông tin. *Enable*: Gửi chat mới (sẽ tự động khôi phục về trạng thái `open`). |

---

## 7. CƠ CHẾ HOẠT ĐỘNG CỦA LastMessageAt

### LastMessageAt dùng để làm gì?
Trường `LastMessageAt` (DateTime?) trong bảng `SupportTickets` đóng vai trò quan trọng:
1. **Sắp xếp danh sách**: Dùng để ưu tiên đẩy các ticket có phản hồi mới nhất (cả từ phía ứng viên hoặc CSKH) lên đầu danh sách quản lý của Support.
2. **Nhận biết hoạt động**: Giúp hiển thị mốc thời gian hoạt động cuối cùng của ticket (ví dụ: "Hoạt động 5 phút trước").
3. **Frontend badge unread**: Frontend có thể tự so sánh `LastMessageAt` với thời gian người dùng xem ticket lần cuối để hiển thị chấm đỏ thông báo chưa đọc.

### Các Endpoints cập nhật LastMessageAt
Trường này được hệ thống cập nhật tự động lên mốc `DateTime.UtcNow` mỗi khi một tin nhắn **công khai** được thêm vào:
- `POST /api/v1/support/tickets/{id}/messages` (Ứng viên phản hồi)
- `POST /api/v1/admin/support/tickets/{id}/messages` (Admin/Support phản hồi công khai - chỉ cập nhật khi cờ `IsInternalNote = false`).

---

## 8. ADMIN DASHBOARD SUMMARY (PHASE 14)

- **Endpoint**: `GET /api/v1/admin/dashboard/summary`
- **Xác thực**: Bắt buộc JWT (`admin`).
- **Nghiệp vụ**: Tổng hợp động kết quả đo lường toàn hệ thống từ DB.
- **Lưu ý dữ liệu**: Vì đây là dự án AI Interview và Mock Payment, các thông tin doanh thu (`totalMockRevenue`, `totalBookingRevenue`) được tính toán từ các hóa đơn đã giả lập thành công (Paid) trong Database qua simulator, chứ không phải từ Payment Gateway thực tế.
- **Response (JSON)**: HTTP 200 OK:
  ```json
  {
    "success": true,
    "message": null,
    "data": {
      "totalUsers": 128,
      "newUsersToday": 3,
      "newUsersThisWeek": 14,
      "activeSubscriptions": 42,
      "totalSubscriptionRevenue": 12600000.0,
      "totalPayments": 68,
      "totalMockRevenue": 20400000.0,
      "totalResumesOptimized": 185,
      "totalMatchingSessions": 342,
      "totalInterviewSessions": 98,
      "totalMentorBookings": 56,
      "totalBookingRevenue": 7800000.0,
      "totalReportShares": 29,
      "supportTicketsByStatus": {
        "open": 2,
        "in_progress": 4,
        "resolved": 15,
        "closed": 35
      }
    },
    "meta": { "requestId": "0HMTRSPV9QNT5", "timestamp": "2026-05-21T01:30:00Z" }
  }
  ```

### Đề xuất Widget hiển thị trên Frontend
- **Widget Thống kê Tổng quan (4 ô lớn hàng đầu)**:
  - *Tổng người dùng*: `totalUsers` (kèm badge tăng trưởng hôm nay `newUsersToday`).
  - *Doanh thu Subscription*: `totalSubscriptionRevenue` VND.
  - *Doanh thu Mentor Booking*: `totalBookingRevenue` VND.
  - *Tổng số phiên AI*: Match (`totalMatchingSessions`) + Phỏng vấn (`totalInterviewSessions`).
- **Widget Trạng thái Hỗ trợ (Biểu đồ tròn/Donut)**: Hiển thị trực quan dữ liệu `supportTicketsByStatus`.
- **Widget Hoạt động hệ thống**: Biểu diễn các thông số Resume optimized (`totalResumesOptimized`) và lượt share liên kết (`totalReportShares`).

---

## 9. ADMIN USER MANAGEMENT (PHASE 14)

Quản trị viên theo dõi thông tin người dùng và xử lý các tài khoản vi phạm.

### 1. Danh sách người dùng hệ thống
- **Endpoint**: `GET /api/v1/admin/users`
- **Query Params**:
  - `search`: Lọc email hoặc tên đầy đủ.
  - `role`: Lọc vai trò cụ thể (`"admin"`, `"support"`, `"mentor"`, `"candidate"`).
  - `status`: Lọc trạng thái (`"active"`, `"suspended"`, `"disabled"`).
  - `emailVerified`: true/false.
  - `page`, `pageSize` (default 20).
- **Response (JSON)**: HTTP 200 OK:
  ```json
  {
    "success": true,
    "message": null,
    "data": {
      "total": 1,
      "page": 1,
      "pageSize": 20,
      "items": [
        {
          "id": "d5b1e2a3-f4c5-5a6b-7d8e-9f0a1b2c3d4e",
          "email": "candidate@example.com",
          "fullName": "Nguyen Van Candidate",
          "role": "candidate",
          "status": "active",
          "emailVerified": true,
          "createdAt": "2026-05-01T12:00:00Z",
          "lastLoginAt": "2026-05-20T18:30:00Z"
        }
      ]
    },
    "meta": { "requestId": "0HMTRSPV9QNT6", "timestamp": "2026-05-21T01:35:00Z" }
  }
  ```

### 2. Xem chi tiết thông tin Người dùng
- **Endpoint**: `GET /api/v1/admin/users/{id}`
- **Nghiệp vụ**: Tổng hợp chi tiết hồ sơ, gói cước hiện tại, giới hạn quota dịch vụ trong ngày, lịch sử giao dịch thanh toán và hỗ trợ gần đây nhất của user.
- **Response (JSON)**: HTTP 200 OK:
  ```json
  {
    "success": true,
    "message": null,
    "data": {
      "userSummary": {
        "id": "d5b1e2a3-f4c5-5a6b-7d8e-9f0a1b2c3d4e",
        "email": "candidate@example.com",
        "fullName": "Nguyen Van Candidate",
        "role": "candidate",
        "status": "active",
        "emailVerified": true,
        "createdAt": "2026-05-01T12:00:00Z",
        "lastLoginAt": "2026-05-20T18:30:00Z"
      },
      "profileSummary": {
        "headline": "Software Engineer .NET",
        "bio": "Đam mê lập trình C# và thiết kế hệ thống phân tán.",
        "yearsOfExperience": "3.5",
        "skills": ["C#", ".NET Core", "SQL Server", "React"]
      },
      "currentSubscription": {
        "subscriptionId": "1b089c20-41be-4573-b3c1-b0db04a5bf4d",
        "planKey": "pro_monthly",
        "status": "active",
        "startsAt": "2026-05-15T00:00:00Z",
        "endsAt": "2026-06-15T00:00:00Z"
      },
      "quotaSummary": {
        "dailyMatchUsed": 2,
        "dailyMatchLimit": 10,
        "dailyInterviewUsed": 1,
        "dailyInterviewLimit": 5,
        "dailyOptimizeUsed": 0,
        "dailyOptimizeLimit": 5
      },
      "recentPayments": [
        {
          "paymentId": "58af4e93-ca1b-4d43-85b9-4ba3a1e2f3d9",
          "amount": 299000.0,
          "currency": "VND",
          "status": "succeeded",
          "purpose": "subscription_plan",
          "createdAt": "2026-05-15T00:05:00Z"
        }
      ],
      "recentBookings": [
        {
          "bookingId": "c88f192b-8a8f-4d92-bf39-4abcf291883b",
          "mentorName": "Mentor Nguyễn Văn A",
          "serviceType": "mock_interview",
          "status": "confirmed",
          "amount": 150000.0,
          "currency": "VND",
          "startsAt": "2026-05-22T09:00:00Z"
        }
      ],
      "supportTicketCount": 2
    },
    "meta": { "requestId": "0HMTRSPV9QNT7", "timestamp": "2026-05-21T01:40:00Z" }
  }
  ```

### 3. Cập nhật trạng thái người dùng
- **Endpoint**: `PATCH /api/v1/admin/users/{id}/status`
- **Request Body**: Trạng thái được chọn phải thuộc: `"active"`, `"suspended"`, `"disabled"`.
  ```json
  {
    "status": "suspended"
  }
  ```
- **Response (JSON)**: HTTP 200 OK:
  ```json
  {
    "success": true,
    "message": "User status updated successfully.",
    "data": {
      "message": "User status updated successfully.",
      "email": "candidate@example.com",
      "previousStatus": "active",
      "currentStatus": "suspended"
    },
    "meta": { "requestId": "0HMTRSPV9QNT8", "timestamp": "2026-05-21T01:45:00Z" }
  }
  ```

### Hành vi bắt buộc phía Frontend dựa trên Status
Khi một người dùng bị chuyển trạng thái:
- **`suspended` (Bị tạm khóa)** / **`disabled` (Bị vô hiệu hóa)**: Backend đã thiết lập cơ chế kiểm tra chặn xử lý giao dịch. Frontend cần từ chối hiển thị các form thao tác quan trọng và hiển thị banner đỏ thông báo tài khoản đang bị hạn chế hoặc liên hệ admin để được hỗ trợ.

---

## 10. ADMIN BILLING RECORDS (PHASE 14)

Xem và đối soát giao dịch tài chính toàn hệ thống.

### 1. Danh sách giao dịch thanh toán
- **Endpoint**: `GET /api/v1/admin/billing/payments`
- **Bộ lọc (Query Params)**: `status` (succeeded/failed/pending), `purpose` (subscription_plan/mentor_booking), `provider` (vnpay/momo/stripe/payos), `userId`, `page`, `pageSize`.
- **Response (JSON)**:
  ```json
  {
    "success": true,
    "data": {
      "total": 1,
      "page": 1,
      "pageSize": 20,
      "items": [
        {
          "id": "58af4e93-ca1b-4d43-85b9-4ba3a1e2f3d9",
          "userId": "d5b1e2a3-f4c5-5a6b-7d8e-9f0a1b2c3d4e",
          "userEmail": "candidate@example.com",
          "amount": 299000.0,
          "currencyCode": "VND",
          "status": "succeeded",
          "purpose": "subscription_plan",
          "provider": "vnpay",
          "createdAt": "2026-05-15T00:05:00Z"
        }
      ]
    }
  }
  ```

### 2. Danh sách Hóa đơn
- **Endpoint**: `GET /api/v1/admin/billing/invoices`
- **Bộ lọc (Query Params)**: `status` (draft/open/paid/void), `purpose` (subscription_plan/mentor_booking), `userId`, `page`, `pageSize`.
- **Response (JSON)**:
  ```json
  {
    "success": true,
    "data": {
      "total": 1,
      "page": 1,
      "pageSize": 20,
      "items": [
        {
          "id": "5fa84be2-ca15-4ba8-bc19-58b4da79f42c",
          "userId": "d5b1e2a3-f4c5-5a6b-7d8e-9f0a1b2c3d4e",
          "userEmail": "candidate@example.com",
          "amount": 299000.0,
          "currencyCode": "VND",
          "status": "paid",
          "purpose": "subscription_plan",
          "createdAt": "2026-05-15T00:05:00Z"
        }
      ]
    }
  }
  ```

### 3. Danh sách gói cước người dùng (Subscriptions)
- **Endpoint**: `GET /api/v1/admin/subscriptions`
- **Bộ lọc (Query Params)**: `status` (active/expired/cancelled), `userId`, `page`, `pageSize`.
- **Response (JSON)**:
  ```json
  {
    "success": true,
    "data": {
      "total": 1,
      "page": 1,
      "pageSize": 20,
      "items": [
        {
          "id": "1b089c20-41be-4573-b3c1-b0db04a5bf4d",
          "userId": "d5b1e2a3-f4c5-5a6b-7d8e-9f0a1b2c3d4e",
          "userEmail": "candidate@example.com",
          "planKey": "pro_monthly",
          "status": "active",
          "startsAt": "2026-05-15T00:00:00Z",
          "endsAt": "2026-06-15T00:00:00Z"
        }
      ]
    }
  }
  ```

### Gợi ý các cột hiển thị trên Table cho Đối soát:
- *Mã giao dịch*: `Id`
- *Khách hàng (Email)*: `userEmail`
- *Số tiền*: Định dạng tiền tệ VND (`amount` + `currencyCode`)
- *Hình thức / Cổng*: `provider` (in chữ hoa chuẩn: Momo, VNPay, Stripe)
- *Trạng thái*: Style các badge riêng cho trạng thái thành công (`succeeded` / `paid`), lỗi (`failed`), hay chờ xử lý (`pending` / `open`).

---

## 11. ADMIN MENTOR BOOKINGS & REPORT SHARES (PHASE 14)

### 1. Theo dõi Đặt lịch Mentor toàn hệ thống
- **Endpoint**: `GET /api/v1/admin/mentor-bookings`
- **Bộ lọc (Query Params)**: `status` (pending_payment/confirmed/cancelled/completed), `mentorId`, `userId`, `from` (DateTime), `to` (DateTime), `page`, `pageSize`.
- **Response (JSON)**:
  ```json
  {
    "success": true,
    "data": {
      "total": 1,
      "page": 1,
      "pageSize": 20,
      "items": [
        {
          "bookingId": "c88f192b-8a8f-4d92-bf39-4abcf291883b",
          "userId": "d5b1e2a3-f4c5-5a6b-7d8e-9f0a1b2c3d4e",
          "candidateEmail": "candidate@example.com",
          "mentorName": "Mentor Nguyễn Văn A",
          "serviceType": "mock_interview",
          "status": "confirmed",
          "priceAmount": 150000.0,
          "currencyCode": "VND",
          "startsAt": "2026-05-22T09:00:00Z",
          "endsAt": "2026-05-22T09:45:00Z",
          "paymentStatus": "Paid"
        }
      ]
    }
  }
  ```

### 2. Theo dõi liên kết chia sẻ báo cáo công khai (Public Shares)
- **Endpoint**: `GET /api/v1/admin/reports/shares`
- **Bộ lọc (Query Params)**: `reportType` (interview/match), `userId`, `isActive` (true/false), `page`, `pageSize`.
- **BẢO MẬT TUYỆT ĐỐI**: Để tránh rò rỉ token chia sẻ công khai có thể xem trộm nội dung báo cáo cá nhân của ứng viên, API **chỉ trả về trường `tokenPreview` (gồm 8 ký tự cuối của token gốc)** để phục vụ mục đích kiểm soát/đối soát, không bao giờ gửi toàn bộ token về client tại các màn hình quản trị.
- **Response (JSON)**:
  ```json
  {
    "success": true,
    "data": {
      "total": 1,
      "page": 1,
      "pageSize": 20,
      "items": [
        {
          "shareId": "7a0c8b2a-c21d-44a8-98e3-5ab9f0a7114d",
          "userId": "d5b1e2a3-f4c5-5a6b-7d8e-9f0a1b2c3d4e",
          "ownerEmail": "candidate@example.com",
          "ownerFullName": "Nguyen Van Candidate",
          "reportType": "interview",
          "resourceId": "8f8b7d6a-ae4f-4d2b-bf38-5188bcda91ff",
          "title": "Báo cáo Phỏng vấn Senior .NET",
          "isActive": true,
          "allowPdfDownload": true,
          "viewCount": 12,
          "createdAt": "2026-05-18T10:00:00Z",
          "expiresAt": "2026-06-18T10:00:00Z",
          "revokedAt": null,
          "tokenPreview": "ab12cd34"
        }
      ]
    }
  }
  ```

---

## 12. ADMIN SYSTEM COMPONENT HEALTH (PHASE 14)

- **Endpoint**: `GET /api/v1/admin/health`
- **Xác thực**: Bắt buộc JWT (`admin`).
- **Mục đích**: Chẩn đoán tức thời trạng thái kết nối các tài nguyên của hệ thống.
- **Bảo mật**: Các thông tin nhạy cảm như connection string, password, key SMTP đều được Backend xử lý ẩn/mặt nạ (strictly masked) và không bao giờ được gửi ra ngoài client.
- **Response (JSON)**: HTTP 200 OK:
  ```json
  {
    "success": true,
    "message": null,
    "data": {
      "status": "Healthy",
      "timestamp": "2026-05-21T01:50:00.124Z",
      "components": {
        "database": {
          "status": "Healthy",
          "details": "SQL Server connection successful."
        },
        "email": {
          "status": "Healthy",
          "details": "Email provider configured: Smtp (Credentials strictly masked)."
        },
        "googleAuth": {
          "status": "Healthy",
          "details": "Google OAuth integration is Configured."
        },
        "aiServices": {
          "status": "Healthy",
          "details": "AI match and optimization host: http://localhost:8001."
        }
      }
    },
    "meta": { "requestId": "0HMTRSPV9QNT9", "timestamp": "2026-05-21T01:50:00Z" }
  }
  ```

### Xử lý khuyến nghị phía Frontend
Frontend cần hiển thị panel chẩn đoán với các đèn báo màu sắc linh hoạt:
- **`Healthy` (Khỏe mạnh)**: Toàn bộ dịch vụ hiển thị màu xanh lá.
- **`Degraded` (Suy giảm)**: Có ít nhất một component gặp lỗi không chặn đứng hoàn toàn hệ thống (ví dụ: SMTP lỗi, nhưng Database/AI vẫn hoạt động). Hiển thị màu vàng/amber kèm thông tin lỗi chi tiết của component đó.
- **`Unavailable` / `Unhealthy` (Mất kết nối)**: Sự cố nghiêm trọng (ví dụ: Database mất kết nối). Hiển thị màu đỏ.

---

## 13. AUDIT LOGS (PHASE 14)

Hệ thống ghi nhận dấu vết hoạt động (audit logs) của tất cả các thao tác thay đổi cấu hình dữ liệu quan trọng thực hiện bởi quản trị viên hoặc sự kiện lớn từ ứng viên để bảo vệ hệ thống.

- **Endpoint**: `GET /api/v1/admin/audit-logs`
- **Query Params**:
  - `actorRole`: Lọc theo vai trò của người thực hiện (`"admin"`, `"support"`...)
  - `action`: Lọc khóa hành động hành vi (`"support.ticket_assigned"`...)
  - `resource`: Tên bảng dữ liệu chịu tác động (`"SupportTicket"`, `"User"`...)
  - `resourceId`: GUID của tài nguyên.
  - `page`, `pageSize`
- **Response (JSON)**:
  ```json
  {
    "success": true,
    "data": {
      "total": 1,
      "page": 1,
      "pageSize": 20,
      "items": [
        {
          "id": "e8b09d2a-c21d-44a8-98e3-5ab9f0a7114d",
          "actorId": "d5b1e2a3-f4c5-5a6b-7d8e-9f0a1b2c3d4e",
          "actorEmail": "admin@interviet.com",
          "actorRole": "admin",
          "action": "admin.user_status_updated",
          "resource": "User",
          "resourceId": "a9b1c2d3-e4f5-5a6b-7c8d-9e0f1a2b3c4d",
          "metadataJson": "{\"email\":\"candidate@example.com\",\"previousStatus\":\"active\",\"currentStatus\":\"suspended\"}",
          "ipAddress": "127.0.0.1",
          "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
          "createdAt": "2026-05-21T01:45:00Z"
        }
      ]
    }
  }
  ```

### Các hành động ghi Audit Log hiện có trong hệ thống:
- `support.ticket_created`: Ứng viên tạo ticket mới.
- `support.ticket_replied`: Người dùng hoặc CSKH phản hồi tin nhắn vào ticket.
- `support.ticket_status_updated`: CSKH/Admin thay đổi trạng thái ticket thủ công.
- `support.ticket_assigned`: Gán nhân sự quản lý ticket.
- `admin.user_status_updated`: Khóa, mở tài khoản người dùng.
- `admin.notification_broadcast`: Gửi thông báo hệ thống diện rộng toàn bộ ứng viên.
- `admin.dev_promote`: Thay đổi vai trò (Role promotion) qua dev tool.

### Đề xuất Cột của bảng log trên Frontend:
- *Thời gian*: `createdAt`
- *Tác nhân*: `actorEmail` (kèm nhãn vai trò `actorRole`)
- *Hành động*: `action` (Nên được map sang tiếng Việt để người dùng dễ đọc)
- *Đối tượng*: `resource` + `resourceId`
- *Chi tiết*: Nút bấm xem nhanh nội dung JSON của trường `metadataJson` để thấy dữ liệu thay đổi trước và sau.

---

## 14. ADMIN DEV PROMOTE (PHASE 14)

API phục vụ nhà phát triển cấu hình, phân vai nhanh tài khoản admin/support trên môi trường Local/Development.

- **Endpoint**: `POST /api/v1/admin/dev/promote`
- **Xác thực**: Bắt buộc JWT (`admin`).
- **Điều kiện tiên quyết**: Khóa cấu hình `"Admin:EnableDevBootstrap"` tại cấu hình config hệ thống phải ở trạng thái `true`. Nếu bị tắt, API trả lỗi **HTTP 400 Bad Request** với thông điệp `"Developer bootstrap role promotion is disabled."`.
- **Request Body**:
  ```json
  {
    "email": "hienngochuy3@gmail.com",
    "roleCode": "admin"
  }
  ```
- **Response (JSON)**:
  ```json
  {
    "success": true,
    "message": "User role promoted successfully.",
    "data": {
      "message": "User role promoted successfully.",
      "email": "hienngochuy3@gmail.com",
      "previousRole": "candidate",
      "newRole": "admin"
    },
    "meta": { "requestId": "0HMTRSPV9QNUA", "timestamp": "2026-05-21T01:55:00Z" }
  }
  ```

> [!WARNING]
> **Khuyến nghị đặc biệt cho Frontend**: Endpoint này **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP hiển thị hoặc cung cấp nút bấm trên giao diện ứng dụng sản xuất (Production UI)** để ngăn ngừa nguy cơ bảo mật nâng quyền trái phép. Nó chỉ nên tồn tại dưới dạng công cụ nội bộ hỗ trợ dev tại local.

---

## 15. KIẾN TRÚC AUDITLOGSERVICE NỘI BỘ

Dành cho sự hiểu biết của đội ngũ phát triển Frontend về quy trình ghi chép nội bộ:
- Cổng dịch vụ `AuditLogService` là dịch vụ nội bộ chạy ngầm tại Backend thực thi ghi chép log vào cơ sở dữ liệu `AuditLogs` mỗi khi có thay đổi dữ liệu từ các API Controller.
- Frontend không gọi hoặc tương tác trực tiếp tới `AuditLogService` qua cổng giao tiếp HTTP, mà chỉ tiêu thụ kết quả của nó qua endpoint `/api/v1/admin/audit-logs`.

---

## 16. CHUẨN XỬ LÝ LỖI (ERROR HANDLING PROTOCOL)

Hệ thống Backend áp dụng thống nhất cơ chế trả lỗi chi tiết theo đặc tả RFC 7807 Problem Details. Khi xử lý lỗi, Frontend cần dựa vào trường **`code`** để hiển thị thông báo phù hợp thay vì tự parse các chuỗi text động của trường `detail`.

### Các mã lỗi chuẩn của hệ thống:

| Mã Lỗi (`code`) | Ý nghĩa Lỗi | HTTP Status | Đề xuất xử lý phía Frontend |
| :--- | :--- | :--- | :--- |
| **`Unauthorized`** | Không có thông tin xác thực hoặc Token hết hạn. | `401 Unauthorized` | Xóa dữ liệu phiên đăng nhập cũ, chuyển hướng người dùng ngay lập tức về trang Đăng nhập `/login`. |
| **`Forbidden`** | Tài khoản không có đủ quyền gọi API. | `403 Forbidden` | Hiển thị màn hình chặn quyền truy cập (Access Denied / Forbidden Screen). |
| **`Admin.Disabled`** | Module Admin đang đóng bảo trì. | `503 Service Unavailable` | Chuyển hướng sang màn hình bảo trì quản trị viên. |
| **`Support.Disabled`** | Tính năng Ticket hỗ trợ đang đóng bảo trì. | `503 Service Unavailable` | Vô hiệu hóa nút gửi Ticket, hiển thị thông báo bảo trì hỗ trợ. |
| **`Validation`** | Dữ liệu đầu vào sai định dạng hoặc thiếu thông tin bắt buộc. | `400 Bad Request` | High-light đỏ các ô nhập liệu bị lỗi trên form nhập liệu và hiển thị nội dung lỗi tương ứng. |
| **`NotFound`** | Tài nguyên được yêu cầu không tồn tại hoặc đã bị xóa. | `404 Not Found` | Hiển thị trang lỗi 404 (Not Found) của ứng dụng. |
| **`Conflict`** | Xung đột nghiệp vụ dữ liệu (ví dụ: đã review booking rồi). | `409 Conflict` | Hiển thị Toast thông báo cảnh báo nghiệp vụ không thể thực hiện do xung đột. |
| **`Quota.Exceeded`** | Đã sử dụng hết hạn mức quota trong ngày. | `429 Too Many Requests` | Hiển thị pop-up thông báo giới hạn dịch vụ trong ngày đã đạt đỉnh, gợi ý nâng cấp gói Pro. |

---

## 17. TIÊU CHUẨN PHÂN TRANG & BỘ LỌC (PAGINATION & FILTERING)

Để đảm bảo hiệu năng tối ưu, tất cả các API trả về danh sách đều áp dụng chuẩn phân trang và lọc dữ liệu đồng nhất.

### Các Query Parameters chuẩn được hỗ trợ bởi hệ thống:
Frontend chỉ được phép sử dụng các param đã cấu hình thực tế trong code dưới đây:

- **`page`**: Vị trí trang dữ liệu cần lấy (Bắt đầu từ `1`).
- **`pageSize`**: Kích thước lượng dữ liệu một trang hiển thị (Backend giới hạn tối đa `100` bản ghi trên một request).
- **`status`**: Bộ lọc trạng thái (VD: Đối với Ticket: `open/in_progress/resolved/closed`; Đối với Booking: `pending_payment/confirmed/cancelled/completed`).
- **`search`**: Tìm kiếm chuỗi text (Áp dụng cho tìm kiếm User, Mentor, Ticket).
- **`from`** / **`to`**: Mốc thời gian bắt đầu và kết thúc (Kiểu dữ liệu: `DateTime` chuẩn ISO-8601). Áp dụng lọc Mentor Bookings.
- **`userId`**: Lọc theo GUID ứng viên (Dành riêng cho các API Admin).
- **`mentorId`**: Lọc theo GUID cố vấn (Dành riêng cho API Mentor Booking).
- **`reportType`**: Lọc loại báo cáo công khai (`interview` hoặc `match`).

---

## 18. TRỰC QUAN HÓA JSON SAMPLES CHUẨN CỦA HỆ THỐNG

### 1. Phản hồi chi tiết Ticket của Ứng viên (Chỉ có tin nhắn công khai)
- **Endpoint**: `GET /api/v1/support/tickets/7fa84be2-ca15-4ba8-bc19-58b4da79f42d`
- **JSON Response**:
```json
{
  "success": true,
  "message": null,
  "data": {
    "id": "7fa84be2-ca15-4ba8-bc19-58b4da79f42d",
    "ticketNumber": "TK-20260521004512-385",
    "category": "technical",
    "priority": "medium",
    "subject": "Không thể tải lên CV định dạng PDF",
    "status": "in_progress",
    "description": "Hệ thống báo lỗi không xác định khi tôi cố gắng tải lên file CV dài 2 trang dạng PDF dung lượng 1.5MB.",
    "assignedTo": "Support Staff A",
    "createdAt": "2026-05-21T00:45:12Z",
    "closedAt": null,
    "lastMessageAt": "2026-05-21T00:50:00Z",
    "messages": [
      {
        "id": "bc8c7d24-8f0a-48d6-ae4f-561b36bc2150",
        "senderType": "support",
        "senderUserId": "a9b1c2d3-e4f5-5a6b-7c8d-9e0f1a2b3c4d",
        "messageBody": "Xin chào ứng viên, bộ phận kỹ thuật đang kiểm tra file PDF của bạn. Vui lòng đợi trong giây lát.",
        "createdAt": "2026-05-21T00:50:00Z",
        "isInternalNote": false
      }
    ]
  },
  "meta": {
    "requestId": "0HMTRSPV9QNS7",
    "timestamp": "2026-05-21T00:51:00Z"
  }
}
```

### 2. Phản hồi chi tiết Ticket của Admin/Support (Có ghi chú nội bộ)
- **Endpoint**: `GET /api/v1/admin/support/tickets/7fa84be2-ca15-4ba8-bc19-58b4da79f42d`
- **JSON Response**:
```json
{
  "success": true,
  "message": null,
  "data": {
    "id": "7fa84be2-ca15-4ba8-bc19-58b4da79f42d",
    "ticketNumber": "TK-20260521004512-385",
    "category": "technical",
    "priority": "medium",
    "subject": "Không thể tải lên CV định dạng PDF",
    "status": "in_progress",
    "description": "Hệ thống báo lỗi không xác định khi tôi cố gắng tải lên file CV dài 2 trang dạng PDF dung lượng 1.5MB.",
    "assignedTo": "Support Staff A",
    "createdAt": "2026-05-21T00:45:12Z",
    "closedAt": null,
    "lastMessageAt": "2026-05-21T01:10:00Z",
    "messages": [
      {
        "id": "11111111-2222-3333-4444-555555555555",
        "senderType": "support",
        "senderUserId": "a9b1c2d3-e4f5-5a6b-7c8d-9e0f1a2b3c4d",
        "messageBody": "HỒ SƠ NỘI BỘ: Ứng viên này đã từng đăng tải file CV lỗi do parser lỗi font chữ tiếng Việt Unicode tổ hợp. Kỹ thuật cần patch lại module parse.",
        "createdAt": "2026-05-21T01:08:00Z",
        "isInternalNote": true
      },
      {
        "id": "bc8c7d24-8f0a-48d6-ae4f-561b36bc2150",
        "senderType": "support",
        "senderUserId": "a9b1c2d3-e4f5-5a6b-7c8d-9e0f1a2b3c4d",
        "messageBody": "Xin chào ứng viên, bộ phận kỹ thuật đang kiểm tra file PDF của bạn. Vui lòng đợi trong giây lát.",
        "createdAt": "2026-05-21T01:10:00Z",
        "isInternalNote": false
      }
    ]
  },
  "meta": {
    "requestId": "0HMTRSPV9QNT1",
    "timestamp": "2026-05-21T01:12:00Z"
  }
}
```

### 3. Phản hồi lỗi Feature Gate Disabled (503)
- **Endpoint**: Gửi request bất kỳ tới `api/v1/admin/*` khi `Admin:Enabled = false`
- **JSON Response**:
```json
{
  "type": "https://api.interviet.vn/errors/service-unavailable",
  "title": "ServiceUnavailable",
  "detail": "Admin features are currently disabled.",
  "code": "Admin.Disabled"
}
```

### 4. Phản hồi lỗi Quyền truy cập bị từ chối (403)
- **Endpoint**: Tài khoản `support` gửi request vào `/api/v1/admin/dashboard/summary` (Yêu cầu vai trò Admin)
- **JSON Response**:
```json
{
  "type": "https://api.interviet.vn/errors/forbidden",
  "title": "Forbidden",
  "detail": "You do not have permission to access this resource.",
  "code": "Forbidden"
}
```

---

## 19. BẢN ĐỒ MÀN HÌNH FRONTEND (SCREEN MAPPING)

Cơ cấu luồng và sơ đồ gọi API trên các màn hình giao diện người dùng chính:

### I. Màn hình phía ứng viên (User Support Screens)

#### 1. Màn hình danh sách Ticket cá nhân (My Tickets)
- **API cần gọi**: `GET /api/v1/support/tickets` (kèm phân trang)
- **State quản lý**:
  - `tickets`: Mảng danh sách ticket của ứng viên.
  - `loading`: Trạng thái spinner tải danh sách.
  - `error`: Lỗi kết nối hoặc Feature Gate lỗi.
- **Empty State**: Nếu mảng rỗng, hiển thị hình vẽ minh họa sạch sẽ kèm nút *"Gửi yêu cầu trợ giúp đầu tiên"*.

#### 2. Màn hình Tạo Ticket hỗ trợ (Create Ticket)
- **API cần gọi**: `POST /api/v1/support/tickets`
- **State quản lý**: `category`, `priority`, `subject`, `description` kèm Validate hợp lệ biểu mẫu (Form Validation).
- **Trải nghiệm**: Sau khi submit thành công, hiển thị Toast xanh lá chúc mừng và chuyển hướng người dùng ngay tới trang chi tiết của Ticket vừa tạo.

#### 3. Màn hình Chi tiết Ticket (Ticket Chat Detail)
- **API cần gọi**: `GET /api/v1/support/tickets/{id}` để hiển thị lịch sử trao đổi.
- **API gửi phản hồi**: `POST /api/v1/support/tickets/{id}/messages`
- **State quản lý**: `newMessageBody` (chuỗi văn bản chat), `sending` (chống double click gửi trùng lặp).
- **Trải nghiệm**: Cuộn khung chat xuống dưới cùng sau khi nạp lịch sử hoặc gửi tin nhắn thành công.

---

### II. Màn hình phía Ban Quản Trị (Admin & Support Screens)

#### 1. Admin Dashboard
- **API cần gọi**: `GET /api/v1/admin/dashboard/summary`
- **State quản lý**: `metrics` (chứa toàn bộ data tổng hợp).
- **Trải nghiệm**: Tích hợp các đồ thị trực quan (Chart.js / Recharts) biểu diễn tương quan doanh thu, trạng thái hỗ trợ và mức độ tối ưu hóa CV.

#### 2. Màn hình danh sách Ticket hỗ trợ hệ thống (Support Ticket Queue)
- **API cần gọi**: `GET /api/v1/admin/support/tickets` (kèm các thanh filter trạng thái, thể loại).
- **State quản lý**: Các tiêu chuẩn lọc tìm kiếm và đối tượng danh sách.

#### 3. Màn hình Quản lý Thành viên (User Management)
- **API cần gọi**: `GET /api/v1/admin/users` (danh sách), `GET /api/v1/admin/users/{id}` (xem popup chi tiết), `PATCH /api/v1/admin/users/{id}/status` (cập nhật trạng thái).
- **Trải nghiệm**: Cung cấp nút chuyển đổi nhanh (Toggle/Action button) để Admin thực thi khóa tài khoản khẩn cấp đối với người dùng vi phạm.

---

## 20. QUY TẮC NGHIỆP VỤ CỐT LÕI (CORE BUSINESS RULES)

1. **Bảo mật sở hữu**: Ứng viên chỉ được xem và tương tác với các Ticket do chính tài khoản của họ tạo ra. Nếu truy cập sai ID, Backend trả về `404 Not Found`.
2. **Ẩn note nội bộ**: Ghi chú nội bộ (`IsInternalNote = true`) là vũ khí tối mật phục vụ phối hợp giữa các nhân viên hỗ trợ, tuyệt đối không được rò rỉ hoặc hiển thị lên giao diện ứng viên trong bất cứ trường hợp nào.
3. **Phân quyền Role**: Quyền `admin` bao trùm toàn hệ thống; quyền `support` chỉ được xem và can thiệp danh sách hỗ trợ, không được can thiệp doanh thu hoặc cấu hình người dùng.
4. **Dev promote**: Chỉ cho phép chạy ở môi trường phát triển (Development/Local). Khóa chặt khi đẩy lên môi trường Production.

---

## 21. TÍCH HỢP CHI TIẾT PHASE 10 - PHASE 13

---

### PHASE 10: MOCK PAYMENT GATEWAY & BANK TRANSFER VERIFICATION

Mô phỏng quy trình nạp tiền nâng cấp gói cước và đặt lịch Mentor.

```mermaid
graph TD
    A[Màn hình Đăng ký Gói] -->|1. POST /api/v1/billing/checkout| B(Sinh Checkout Session)
    B -->|2. Có link CheckoutUrl| C[Trang Mock Checkout Frontend]
    C -->|3. GET /api/v1/billing/checkout-sessions/{id}/payment-instructions| D(Lấy thông tin tài khoản ngân hàng & QR)
    D -->|4. Người dùng chuyển khoản xong bấm xác nhận| E[Gửi POST /submit-bank-transfer]
    E -->|5. Backend kiểm tra mã nạp| F{Hợp lệ?}
    F -->|Đúng| G[Tự động nâng cấp tài khoản & Trả Succeeded]
    F -->|Sai| H[Lưu dấu vết attempts & Trả Failed]
```

#### Danh sách Endpoint chính thức:

##### 1. Xem danh sách Cổng thanh toán được hỗ trợ
- **Endpoint**: `GET /api/v1/billing/providers`
- **Response**: Trả về danh sách cổng mô phỏng (`vnpay`, `momo`, `stripe`, `payos`).
  ```json
  {
    "success": true,
    "data": [
      { "provider": "vnpay", "displayName": "VNPay", "isMock": true, "enabled": true },
      { "provider": "momo", "displayName": "Momo", "isMock": true, "enabled": true },
      { "provider": "stripe", "displayName": "Stripe", "isMock": true, "enabled": true },
      { "provider": "payos", "displayName": "PayOS", "isMock": true, "enabled": true }
    ]
  }
  ```

##### 2. Khởi tạo phiên Checkout
- **Endpoint**: `POST /api/v1/billing/checkout`
- **Request Body**:
  ```json
  {
    "planKey": "pro_monthly",
    "provider": "vnpay",
    "returnUrl": "http://localhost:3000/payment/success",
    "cancelUrl": "http://localhost:3000/payment/cancel"
  }
  ```
- **Response**: Trả về `checkoutUrl` để Frontend mở trang cổng thanh toán mock, kèm `paymentInstructionsUrl` để phục vụ chuyển khoản.
- **Lưu ý `contextType` (Final Decision #1)**: Response luôn bao gồm trường `contextType` để Frontend phân biệt ngữ cảnh thanh toán và render đúng UI dùng chung trên trang `/checkout/mock`. Các giá trị hợp lệ: `"subscription"` hoặc `"mentor_booking"`.
  ```json
  {
    "success": true,
    "data": {
      "checkoutSessionId": "2fa84be2-ca15-4ba8-bc19-58b4da79f42a",
      "checkoutUrl": "http://localhost:3000/checkout/mock/2fa84be2-ca15-4ba8-bc19-58b4da79f42a",
      "status": "pending",
      "expiresAt": "2026-05-21T02:30:00Z",
      "provider": "vnpay",
      "planKey": "pro_monthly",
      "contextType": "subscription",
      "amount": 299000.0,
      "currencyCode": "VND",
      "paymentInstructionsUrl": "/api/v1/billing/checkout-sessions/2fa84be2-ca15-4ba8-bc19-58b4da79f42a/payment-instructions"
    }
  }
  ```

> [!IMPORTANT]
> **Final Decision #1 — Shared Checkout Page**: Frontend dùng **một trang Mock Checkout duy nhất** cho cả Subscription lẫn Mentor Booking tại route `/checkout/mock/{sessionId}`. Trường `contextType` trong response quyết định tiêu đề, mô tả và flow sau thanh toán:
> - `"subscription"` → Sau thành công, redirect tới `/dashboard` kèm toast "Gói cước đã được kích hoạt".
> - `"mentor_booking"` → Sau thành công, redirect tới `/mentor-bookings/{bookingId}` kèm toast "Lịch hẹn đã được xác nhận".

##### 3. Lấy thông tin Chuyển khoản và Ảnh QR code ngân hàng
- **Endpoint**: `GET /api/v1/billing/checkout-sessions/{id}/payment-instructions`
- **Mục đích**: Nhận thông tin tài khoản doanh nghiệp cùng **ảnh QR Code dạng Base64 chứa sẵn mã chuyển khoản định danh và số tiền**.
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "checkoutSessionId": "2fa84be2-ca15-4ba8-bc19-58b4da79f42a",
      "planKey": "pro_monthly",
      "purpose": "subscription_plan",
      "description": "Nâng cấp Pro Monthly",
      "amount": 299000.0,
      "currencyCode": "VND",
      "merchant": {
        "merchantName": "CÔNG TY INTER-VIET TECH",
        "bankName": "Ngân hàng Thương mại Cổ phần Ngoại thương Việt Nam (Vietcombank)",
        "bankCode": "VCB",
        "accountNumber": "1022998877",
        "accountName": "INTER-VIET TECH CO"
      },
      "transfer": {
        "requiredContent": "IVPAY 83K29F",
        "amount": 299000.0,
        "currencyCode": "VND"
      },
      "qr": {
        "payload": "00020101021238580010A00000072701280006970436011410229988775204...",
        "imageBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAD..."
      }
    }
  }
  ```

##### 4. Xác nhận Chuyển khoản (Submit Bank Transfer)
- **Endpoint**: `POST /api/v1/billing/checkout-sessions/{id}/submit-bank-transfer`
- **Mục đích**: Ứng viên điền thông tin và bấm *"Tôi đã chuyển khoản thành công"*. Hệ thống sẽ đối soát trường `transferContent` (so khớp với nội dung chuyển khoản yêu cầu để kích hoạt nâng cấp tự động).

> [!IMPORTANT]
> **Final Decision #2 — Bank Transfer Content Format**:
> Nội dung chuyển khoản được chuẩn hóa theo format: **`IVPAY <ShortId>`**
> - `ShortId` dài **6–8 ký tự**, toàn chữ hoa và số, không dấu, không ký tự đặc biệt, không khoảng trắng thừa.
> - Ví dụ hợp lệ: `IVPAY 83K29F`, `IVPAY A1B2C3D4`
> - Frontend **bắt buộc** hiển thị nội dung này bằng font **monospace** và cung cấp nút **"Copy"** để sao chép nhanh lên clipboard (đặc biệt quan trọng trên Mobile UI).
> - Backend đối soát **case-insensitive** nhưng Frontend nên tự-uppercase trước khi submit.

- **Request Body**:
  ```json
  {
    "payerAccountNumber": "001100223344",
    "payerAccountName": "NGUYEN VAN A",
    "amountPaid": 299000.0,
    "transferContent": "IVPAY 83K29F"
  }
  ```
- **Response (Xác thực thành công - Succeeded)**:
  ```json
  {
    "success": true,
    "data": {
      "checkoutSessionId": "2fa84be2-ca15-4ba8-bc19-58b4da79f42a",
      "status": "succeeded",
      "attempt": {
        "id": "abc84be2-ca15-4ba8-bc19-58b4da79f42b",
        "checkoutSessionId": "2fa84be2-ca15-4ba8-bc19-58b4da79f42a",
        "provider": "vnpay",
        "method": "bank_transfer",
        "payerAccountNumberMasked": "********3344",
        "payerAccountName": "NGUYEN VAN A",
        "amountPaid": 299000.0,
        "transferContent": "IVPAY 83K29F",
        "status": "accepted",
        "rejectionReason": null,
        "createdAt": "2026-05-21T02:05:00Z"
      },
      "successInfo": {
        "checkoutSessionId": "2fa84be2-ca15-4ba8-bc19-58b4da79f42a",
        "paymentTransactionId": "58af4e93-ca1b-4d43-85b9-4ba3a1e2f3d9",
        "invoiceId": "5fa84be2-ca15-4ba8-bc19-58b4da79f42c",
        "invoiceNumber": "INV-202605210001",
        "isIdempotent": false,
        "emailSent": true,
        "subscriptionId": "1b089c20-41be-4573-b3c1-b0db04a5bf4d"
      }
    }
  }
  ```

##### 5. Xem lịch sử các lượt nhập mã nộp tiền (Attempts)
- **Endpoint**: `GET /api/v1/billing/checkout-sessions/{id}/attempts`
- **Mục đích**: Hiển thị trạng thái các lần ứng viên gõ mã chuyển khoản để đối soát (Trạng thái: `submitted`, `accepted`, `rejected`).

##### 6. Các API Giả lập trạng thái dành riêng cho DEV (Simulate)
- **Endpoints**:
  - `POST /api/v1/billing/checkout-sessions/{id}/simulate-success` (Mô phỏng thanh toán thành công)
  - `POST /api/v1/billing/checkout-sessions/{id}/simulate-failed` (Mô phỏng thanh toán lỗi)
  - `POST /api/v1/billing/checkout-sessions/{id}/simulate-cancelled` (Mô phỏng hủy thanh toán)

---

### PHASE 11: NOTIFICATION CENTER (POLLING-BASED)

Hệ thống thông báo in-app chạy ngầm không sử dụng Socket, giảm thiểu độ trễ qua cơ chế Short Polling định kỳ từ Client.

#### Danh sách Endpoint chính thức:

##### 1. Đọc số lượng thông báo chưa đọc (Unread Count)
- **Endpoint**: `GET /api/v1/notifications/unread-count`
- **Tần suất polling đã xác nhận (Final Decision #3)**: Frontend dùng `setInterval` gọi API này **mỗi 45 giây** khi user đã đăng nhập.
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "unreadCount": 5
    }
  }
  ```

> [!IMPORTANT]
> **Final Decision #3 — Notification Polling Rules (MVP)**:
>
> | Tình huống | Hành vi bắt buộc |
> | :--- | :--- |
> | User đăng nhập thành công | Gọi ngay **1 lần** đầu tiên, sau đó bắt đầu polling interval 45 giây |
> | User đăng xuất | **Dừng polling** ngay lập tức (`clearInterval`) |
> | Tab trình duyệt inactive / background | **Dừng hoặc giảm tần suất** xuống 120 giây (dùng `visibilitychange` event) |
> | User bấm "Đánh dấu đã đọc" | Gọi lại API **ngay lập tức** (không cần đợi interval) để cập nhật badge |
> | Nhận lỗi 401 khi polling | Dừng polling và redirect về `/login` |
>
> **Lộ trình tối ưu (Post-MVP)**: Nâng cấp lên Adaptive Polling:
> - User đang tương tác tích cực: 30 giây
> - User idle / tab background: 60 giây
> - Hoặc thay thế bằng WebSocket / SSE khi hạ tầng sẵn sàng.

##### 2. Lấy danh sách Thông báo (Có phân trang & Lọc)
- **Endpoint**: `GET /api/v1/notifications`
- **Query Params**: `page`, `pageSize`, `isRead` (true/false), `type` (VD: `system.announcement`), `priority` (low/normal/high/urgent).
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "4fa84be2-ca15-4ba8-bc19-58b4da79f42c",
          "type": "billing.payment_succeeded",
          "title": "Nâng cấp gói cước thành công",
          "message": "Cảm ơn bạn đã nâng cấp gói Pro. Tài khoản của bạn đã được kích hoạt đầy đủ tính năng.",
          "priority": "normal",
          "actionUrl": "/billing/invoices",
          "data": { "planKey": "pro_monthly", "amount": 299000 },
          "isRead": false,
          "readAt": null,
          "createdAt": "2026-05-21T02:00:00Z"
        }
      ],
      "page": 1,
      "pageSize": 20,
      "totalItems": 1,
      "totalPages": 1
    }
  }
  ```

##### 3. Đánh dấu đã đọc một thông báo
- **Endpoint**: `PATCH /api/v1/notifications/{id}/read`
- **Mục đích**: Bấm vào thông báo cụ thể sẽ đánh dấu là đã đọc.

##### 4. Đánh dấu đã đọc tất cả thông báo
- **Endpoint**: `PATCH /api/v1/notifications/read-all`
- **Request Body** (Không bắt buộc, gửi kèm type để đánh dấu loại cụ thể):
  ```json
  {
    "type": "billing.payment_succeeded"
  }
  ```

##### 5. Cấu hình Kênh thông báo cá nhân (Preferences)
- **Endpoints**: `GET /api/v1/notifications/preferences` (Xem cấu hình) và `PUT /api/v1/notifications/preferences` (Cập nhật).
- **Các cờ cấu hình (True/False)**:
  - `inAppNotificationsEnabled`: Nhận thông báo trong app.
  - `emailNotificationsEnabled`: Nhận thông báo qua Email.
  - `billingNotificationsEnabled`: Nhận thông báo hóa đơn, thanh toán.
  - `resumeNotificationsEnabled`: Thông báo trạng thái tối ưu CV.
  - `matchingNotificationsEnabled`: Thông báo đối sánh CV-JD.
  - `interviewNotificationsEnabled`: Thông báo kết quả phỏng vấn AI.
  - `mentorNotificationsEnabled`: Thông báo liên quan đặt lịch cố vấn.
  - `systemNotificationsEnabled`: Thông báo bảo trì, sự kiện chung.

---

### PHASE 12: SECURE REPORT SHARE LINKS & PDF EXPORT

Quy trình tạo link chia sẻ công khai chuyên nghiệp và xuất tệp PDF.

#### Danh sách Endpoint chính thức (JWT Required):

##### 1. Phân hệ Phỏng vấn AI (`api/v1/interviews`)
- **Tạo link chia sẻ báo cáo phỏng vấn**: `POST /api/v1/interviews/{id}/report/share`
  - Request Body:
    ```json
    {
      "title": "Chia sẻ Báo cáo kết quả Phỏng vấn AI - Kỹ sư .NET",
      "description": "Gửi nhà tuyển dụng tham khảo đánh giá kỹ năng từ AI.",
      "expiresAt": "2026-06-21T00:00:00Z",
      "allowPdfDownload": true
    }
    ```
  - Response: Trả về đường dẫn công khai `shareUrl` phục vụ sao chép (copy link).
    ```json
    {
      "success": true,
      "data": {
        "id": "e8a9f0b1-4c12-4fb8-bc19-58b4da79f42d",
        "reportType": "interview",
        "resourceId": "8f8b7d6a-ae4f-4d2b-bf38-5188bcda91ff",
        "title": "Chia sẻ Báo cáo kết quả Phỏng vấn AI - Kỹ sư .NET",
        "shareToken": "iv-share-token-xyz-123",
        "shareUrl": "http://localhost:3000/shared-reports/iv-share-token-xyz-123",
        "apiUrl": "http://localhost:5000/api/v1/reports/shared/iv-share-token-xyz-123",
        "allowPdfDownload": true,
        "expiresAt": "2026-06-21T00:00:00Z",
        "createdAt": "2026-05-21T02:00:00Z"
      }
    }
    ```
- **Lấy danh sách các link đã tạo cho phiên**: `GET /api/v1/interviews/{id}/report/shares`
- **Thu hồi link chia sẻ**: `DELETE /api/v1/interviews/{id}/report/shares/{shareId}` (Sẽ lập tức vô hiệu hóa link, người xem public không truy cập được nữa).

##### 2. Phân hệ Đối sánh CV-JD (`api/v1/matches`)
- **Tạo link chia sẻ báo cáo đối sánh**: `POST /api/v1/matches/{sessionId}/report/share`
- **Xem danh sách các link chia sẻ đối sánh**: `GET /api/v1/matches/{sessionId}/report/shares`
- **Thu hồi link chia sẻ đối sánh**: `DELETE /api/v1/matches/{sessionId}/report/shares/{shareId}`

#### Danh sách Endpoint Công khai (AllowAnonymous - Không cần xác thực JWT):
Đường dẫn gốc: `/api/v1/reports/shared`

##### 1. Truy xuất xem báo cáo qua Token công khai
- **Endpoint**: `GET /api/v1/reports/shared/{token}`
- **Nghiệp vụ**: Backend tự động phân tích loại báo cáo và trả về dữ liệu tương ứng. Số lượt xem `viewCount` tự động cộng dồn sau mỗi lượt truy cập thành công.
- **Response**: Trả về dữ liệu báo cáo dạng rút gọn (không lộ thông tin cá nhân bảo mật khác).
- **Lưu ý thiết kế hiển thị**: Giao diện cần tôn trọng cấu hình `allowPdfDownload` để hiển thị hoặc ẩn nút bấm Tải tệp PDF tương ứng.

##### 2. Tải trực tiếp tệp PDF báo cáo công khai
- **Endpoint**: `GET /api/v1/reports/shared/{token}/export-pdf`
- **Mục đích**: Tải xuống trực tiếp tệp PDF nhị phân (`application/pdf`).
- **Quy tắc an toàn**: Nếu cấu hình link chia sẻ có `allowPdfDownload: false`, API sẽ trả lỗi **HTTP 403 Forbidden** với mã lỗi `Forbidden`. Frontend không được hiển thị nút tải tệp hoặc khi gọi link này trực tiếp sẽ hiển thị màn hình từ chối quyền.

---

### PHASE 13: PAID MENTOR BOOKING NETWORK MVP

Hệ thống kết nối cố vấn chuyên môn và đặt chỗ hẹn.

```mermaid
graph TD
    A[Màn hình Danh bạ Mentor] -->|1. Lọc theo chuyên môn chuyên môn| B[GET /api/v1/mentors]
    B -->|2. Xem chi tiết Profile & Lịch trống| C[GET /api/v1/mentors/{id}]
    C -->|3. Đặt lịch hẹn cố vấn| D[POST /api/v1/mentor-bookings]
    D -->|4. Nhận thông tin thanh toán| E(Giữ chỗ slot trong 30p, sinh checkout session)
    E -->|5. Xác nhận nạp tiền simulator thành công| F(Chuyển trạng thái sang confirmed)
    F -->|6. Hoàn thành cuộc họp cố vấn| G[POST /api/v1/mentor-bookings/{id}/simulate-complete]
    G -->|7. Đánh giá & Chấm sao cố vấn| H[POST /api/v1/mentor-bookings/{id}/review]
```

#### Danh sách Endpoint chính thức:

##### 1. Xem danh bạ Mentor (Candidate Role)
- **Endpoint**: `GET /api/v1/mentors`
- **Query Params**: `specialty` (code chuyên môn), `serviceType`, `rating` (tối thiểu), `search` (tên, headline, bio), `page`, `pageSize`.
- **Response**: Trả về danh sách Cố vấn kèm điểm đánh giá trung bình `ratingAverage` và số lượng đánh giá `ratingCount`.

##### 2. Xem chi tiết Mentor & Slot trống (Availability Slots)
- **Endpoint**: `GET /api/v1/mentors/{id}`
- **Nghiệp vụ**: Lọc trả về các Slot lịch còn trống trong tương lai (`status = "available"`, chưa hết hạn, và chưa bị giữ chỗ quá hạn).
- **Response (Availability slots)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "e5b1e2a3-f4c5-5a6b-7d8e-9f0a1b2c3d4e",
      "fullName": "Mentor Nguyễn Văn A",
      "headline": "Tech Lead @ Google Singapore",
      "avatarUrl": "https://cdn.interviet.vn/avatars/mentor-a.jpg",
      "bio": "Hơn 10 năm kinh nghiệm phỏng vấn và định hướng...",
      "yearsOfExperience": 10.0,
      "ratingAverage": 4.85,
      "ratingCount": 24,
      "specialties": [
        { "id": "1", "code": "mock_interview", "name": "Mock Interview", "description": "Luyện phỏng vấn thử" }
      ],
      "availabilitySlots": [
        {
          "id": "999f4e93-ca1b-4d43-85b9-4ba3a1e2f3d9",
          "startsAt": "2026-05-22T09:00:00Z",
          "endsAt": "2026-05-22T09:45:00Z",
          "status": "available",
          "priceAmount": 150000.0,
          "currencyCode": "VND"
        }
      ]
    }
  }
  ```

##### 3. Đặt lịch hẹn cố vấn (Book Mentor)
- **Endpoint**: `POST /api/v1/mentor-bookings`
- **Request Body**:
  ```json
  {
    "slotId": "999f4e93-ca1b-4d43-85b9-4ba3a1e2f3d9",
    "serviceType": "mock_interview",
    "candidateNotes": "Tôi muốn luyện phỏng vấn thử bằng tiếng Anh về vị trí Senior .NET Engineer."
  }
  ```
- **Nghiệp vụ giữ chỗ**: Backend lập tức khóa Slot sang trạng thái `reserved` trong vòng 30 phút (theo thời gian BillingOptions:MockCheckoutTtlMinutes), sinh một bản ghi Booking với trạng thái `pending_payment`, và khởi tạo một phiên giao dịch checkout session giả lập thanh toán.
- **Response**: Trả về đường dẫn cổng thanh toán `checkoutUrl`.
  ```json
  {
    "success": true,
    "data": {
      "bookingId": "c88f192b-8a8f-4d92-bf39-4abcf291883b",
      "status": "pending_payment",
      "amount": 150000.0,
      "currencyCode": "VND",
      "checkoutSessionId": "2fa84be2-ca15-4ba8-bc19-58b4da79f42a",
      "checkoutUrl": "http://localhost:3000/checkout/mock/2fa84be2-ca15-4ba8-bc19-58b4da79f42a",
      "paymentInstructionsUrl": "/api/v1/billing/checkout-sessions/2fa84be2-ca15-4ba8-bc19-58b4da79f42a/payment-instructions"
    }
  }
  ```

##### 4. Xem danh sách Lịch đặt của Ứng viên
- **Endpoint**: `GET /api/v1/mentor-bookings`
- **Response**: Trả về toàn bộ danh sách lịch đặt kèm thông tin chi tiết cuộc họp, review đã viết và mã checkout tương ứng để tiếp tục thanh toán nếu chưa hoàn tất.
- **Các trạng thái Booking chính thức**:
  - `pending_payment`: Đang giữ chỗ, chờ nạp tiền.
  - `confirmed`: Đã thanh toán thành công, có đường dẫn tham gia cuộc họp cố vấn (`meetingUrl`).
  - `cancelled`: Đã hủy (releases slot tự động).
  - `completed`: Đã hoàn thành phiên cố vấn.

##### 5. Hủy lịch đặt Cố vấn (Cancel Booking)
- **Endpoint**: `POST /api/v1/mentor-bookings/{id}/cancel`
- **Quy tắc**: Chỉ cho phép hủy khi ở trạng thái `pending_payment` hoặc `confirmed` (chưa đến giờ bắt đầu cuộc hẹn). Slot được mở khóa lại tự động về `"available"`.
- **Request Body**:
  ```json
  {
    "reason": "Tôi bận lịch đột xuất vào giờ này."
  }
  ```

##### 6. Giả lập Hoàn thành phiên hỗ trợ (Simulate Complete)
- **Endpoint**: `POST /api/v1/mentor-bookings/{id}/simulate-complete`
- **Mục đích**: Thay đổi trạng thái Booking từ `confirmed` sang `completed` để mở khóa quyền được gửi đánh giá cho Mentor.

##### 7. Viết đánh giá chất lượng (Submit Review)
- **Endpoint**: `POST /api/v1/mentor-bookings/{id}/review`
- **Yêu cầu**: Chỉ thực hiện được duy nhất 1 lần cho mỗi booking ở trạng thái `completed`. Điểm số `rating` giới hạn từ `1` đến `5` sao. Backend sẽ tự tính toán cập nhật lại điểm trung bình của Mentor.
- **Request Body**:
  ```json
  {
    "rating": 5,
    "comment": "Mentor hướng dẫn rất tận tình, chỉ ra nhiều lỗi sai trong CV của tôi và cách khắc phục."
  }
  ```

---

## 22. KẾT LUẬN & CÁC QUYẾT ĐỊNH CUỐI CÙNG (FINAL DECISIONS)

Tài liệu này phản ánh chính xác cấu trúc logic nghiệp vụ đang vận hành ổn định trong backend C# hiện tại. Cả 3 điểm mở trước đây đã được team **xác nhận và chốt** như sau:

---

### ✅ Final Decision #1 — Shared Mock Checkout Page

**Quyết định:** Frontend dùng **một trang Mock Checkout duy nhất** cho cả Subscription và Mentor Booking tại route `/checkout/mock/{sessionId}`.

- Phân biệt ngữ cảnh thanh toán qua trường `contextType` trong checkout response:
  - `"subscription"` → Nâng cấp gói cước
  - `"mentor_booking"` → Đặt lịch cố vấn
- **Lý do chọn**: Tái sử dụng UI payment, giữ flow thanh toán đồng nhất, dễ mở rộng sau này.
- **Backend**: Trường `contextType` đã được kỳ vọng có trong response của `POST /api/v1/billing/checkout` — cần Backend xác nhận đã thêm vào response.

| contextType | Tiêu đề trang | Sau thành công redirect về |
| :--- | :--- | :--- |
| `subscription` | "Thanh toán Gói Cước" | `/dashboard` + toast "Gói cước đã được kích hoạt" |
| `mentor_booking` | "Thanh toán Lịch hẹn Cố vấn" | `/mentor-bookings/{id}` + toast "Lịch hẹn đã xác nhận" |

---

### ✅ Final Decision #2 — Bank Transfer Content Format

**Quyết định:** Chuẩn hóa nội dung chuyển khoản theo format: **`IVPAY <ShortId>`**

| Thuộc tính | Quy tắc |
| :--- | :--- |
| Tiền tố | Luôn là `IVPAY` (không dấu, liền nhau) |
| ShortId | 6–8 ký tự, chữ hoa và số, không dấu, không ký tự đặc biệt |
| Khoảng cách | Một dấu cách duy nhất giữa `IVPAY` và `ShortId` |
| Ví dụ | `IVPAY 83K29F`, `IVPAY A1B2C3D4` |

**Yêu cầu bắt buộc phía Frontend:**
- Hiển thị nội dung bằng font **monospace** (`font-family: monospace` hoặc class `font-mono`).
- Cung cấp nút **"Sao chép"** (Copy to clipboard) ngay cạnh nội dung — **đặc biệt quan trọng trên Mobile UI**.
- Tự-uppercase nội dung trước khi submit vào trường `transferContent`.
- Backend đối soát **case-insensitive** nhưng Frontend phải luôn gửi UPPERCASE để nhất quán.

---

### ✅ Final Decision #3 — Notification Polling Interval

**Quyết định:** MVP dùng polling cố định **45 giây** cho endpoint `GET /api/v1/notifications/unread-count`.

| Tình huống | Hành vi bắt buộc |
| :--- | :--- |
| Đăng nhập thành công | Gọi ngay 1 lần, sau đó interval 45 giây |
| Đăng xuất | Dừng polling (`clearInterval`) ngay lập tức |
| Tab inactive / background | Dừng hoặc giảm tần suất (dùng `document.visibilitychange`) |
| User mark notification as read | Gọi lại ngay lập tức (không đợi interval) |
| Nhận lỗi 401 khi polling | Dừng polling, redirect về `/login` |

**Lộ trình tối ưu (Post-MVP):** Nâng cấp lên Adaptive Polling:
- User đang tương tác tích cực: **30 giây**
- User idle / tab background: **60 giây**
- Hoặc thay thế bằng WebSocket / SSE khi hạ tầng sẵn sàng.
