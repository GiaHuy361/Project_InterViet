# Hướng dẫn Kỹ thuật: Phase 12 — Report Export / Share (PDF & Public Sharing)

Tài liệu này hướng dẫn chi tiết về cấu trúc, thiết kế kỹ thuật, cơ sở dữ liệu và các API đã triển khai cho tính năng **Report Export / Share (PDF & Public Sharing)** thuộc Hệ thống INTER-VIET AI Interview.

---

## 1. Giới thiệu Tính năng
Tính năng cho phép người dùng:
1. **Xuất PDF báo cáo kết quả** (Phỏng vấn AI và Đối sánh CV-JD) một cách trực quan, đẹp mắt và tối ưu hóa cho in ấn bằng công cụ **QuestPDF**.
2. **Tạo liên kết chia sẻ công khai (Public Share Link)** bảo mật cao sử dụng cơ chế Token ngẫu nhiên kết hợp băm SHA-256 dưới Database.
3. **Cấu hình chia sẻ chi tiết**:
   - Tùy chỉnh tiêu đề, mô tả hiển thị.
   - Bật/tắt khả năng tải xuống PDF của người xem liên kết công khai (`AllowPdfDownload`).
   - Cài đặt thời gian hết hạn của link chia sẻ (`ExpiresAt`).
   - Thu hồi link chia sẻ bất kỳ lúc nào (`RevokeShareAsync`).

---

## 2. Cơ sở Dữ liệu & Domain Model

### 2.1 Bảng `ReportShareLinks` (Entity: `ReportShareLink`)
Lưu trữ thông tin cấu hình và siêu dữ liệu cho các liên kết chia sẻ công khai.

| Trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `Id` | `Guid` (PK) | Định danh duy nhất của liên kết chia sẻ |
| `UserId` | `Guid` | Người sở hữu liên kết chia sẻ (User tạo) |
| `ReportType` | `string` | Loại báo cáo: `"interview"` hoặc `"match"` |
| `ResourceId` | `Guid` | ID của phiên phỏng vấn hoặc phiên đối sánh tương ứng |
| `TokenHash` | `string` | SHA-256 băm hex chữ thường của token ngẫu nhiên để lookup bảo mật |
| `TokenPreview` | `string?` | 8 ký tự cuối của token gốc để hiển thị trên danh sách quản lý |
| `Title` | `string` | Tiêu đề hiển thị của báo cáo được chia sẻ |
| `Description` | `string?` | Mô tả chi tiết kèm theo |
| `IsActive` | `bool` | Trạng thái liên kết (hoạt động/vô hiệu hóa) |
| `ExpiresAt` | `DateTime?` | Thời điểm liên kết hết hạn |
| `RevokedAt` | `DateTime?` | Thời điểm liên kết bị thu hồi chủ động |
| `AllowPdfDownload`| `bool` | Cho phép người xem link public tải PDF hay không |
| `ViewCount` | `int` | Số lượt truy cập xem báo cáo công khai |
| `LastViewedAt` | `DateTime?` | Lần truy cập xem báo cáo gần nhất |
| `CreatedAt` | `DateTime` | Thời gian tạo liên kết chia sẻ |

### 2.2 Mở rộng `InterviewReports`
Thêm các cột JSON phục vụ xuất QuestPDF và xem chi tiết đầy đủ hơn:
- `ScoreBreakdownsJson`: Lưu chi tiết điểm số từng tiêu chí (Dimension code, name, score, max score, notes).
- `FeedbackItemsJson`: Lưu chi tiết nhận xét từng tiêu chí (Category, title, details, priority level).

---

## 3. Danh sách Endpoints API

### 3.1 Nhóm API Quản lý Báo cáo & Chia sẻ (Yêu cầu Token JWT)
Áp dụng cơ chế phân quyền chặt chẽ (chỉ chủ sở hữu phiên mới được quyền xuất PDF/tạo link chia sẻ).

#### **A. AI Interview Report (`api/v1/interviews`)**
* **`GET /api/v1/interviews/{id}/report/export-pdf`**
  - Xuất báo cáo phỏng vấn thành file PDF nhị phân trực tiếp (`application/pdf`).
* **`POST /api/v1/interviews/{id}/report/share`**
  - Tạo liên kết chia sẻ mới cho báo cáo phỏng vấn.
  - Body: `CreateShareLinkRequest` (tiêu đề, mô tả, ngày hết hạn, tùy chọn cho phép tải PDF).
* **`GET /api/v1/interviews/{id}/report/shares`**
  - Lấy danh sách các liên kết chia sẻ đang hoạt động/chưa bị thu hồi của phiên phỏng vấn này.
* **`DELETE /api/v1/interviews/{id}/report/shares/{shareId}`**
  - Thu hồi chủ động liên kết chia sẻ (vô hiệu hóa lập tức).

#### **B. CV-JD Matching Report (`api/v1/matches`)**
* **`GET /api/v1/matches/{sessionId}/report/export-pdf`**
  - Xuất báo cáo đối sánh CV thành file PDF nhị phân trực tiếp.
* **`POST /api/v1/matches/{sessionId}/report/share`**
  - Tạo liên kết chia sẻ mới cho báo cáo đối sánh.
* **`GET /api/v1/matches/{sessionId}/report/shares`**
  - Lấy danh sách các liên kết chia sẻ hoạt động của phiên đối sánh này.
* **`DELETE /api/v1/matches/{sessionId}/report/shares/{shareId}`**
  - Thu hồi chủ động liên kết chia sẻ đối sánh.

---

### 3.2 Nhóm API Công khai (AllowAnonymous - Không cần JWT)
Route gốc: `/api/v1/reports/shared`

* **`GET /api/v1/reports/shared/{token}`**
  - Xem chi tiết báo cáo được chia sẻ.
  - Hệ thống tự động băm token nhận được thành SHA-256, kiểm tra hợp lệ/hết hạn, tự động tăng `ViewCount` và trả về cấu trúc dữ liệu tương ứng (`SharedInterviewReportResponse` hoặc `SharedMatchReportResponse`).
* **`GET /api/v1/reports/shared/{token}/export-pdf`**
  - Xuất PDF báo cáo công khai nếu cờ `AllowPdfDownload` của link chia sẻ được bật (`true`).
  - Nếu `AllowPdfDownload` là `false`, API sẽ trả về `403 Forbidden`.

---

## 4. Thiết kế PDF bằng QuestPDF
Giao diện báo cáo PDF được thiết kế chuyên nghiệp, rõ ràng:
- **A4 Layout**: Thiết kế chuẩn trang A4 với biên lề 1.8cm tối ưu.
- **Color Palette hiện đại**: Sử dụng tông màu HSL cao cấp (Dark Slate `#1e293b`, Royal Blue `#3b82f6`, Soft Slate `#f8fafc`, Emerald Green `#16a34a`).
- **Phân nhóm thông minh**: Sử dụng các bảng, card bo góc viền nhẹ và phân trang tự động (`PageBreak`) giữa các đối tượng để giữ cấu trúc sạch sẽ.
- **Thông tin đầy đủ**: Hiển thị điểm số tổng quan nổi bật, điểm thành phần chi tiết, điểm mạnh, điểm yếu, khuyến nghị phát triển và hiển thị toàn bộ Transcript Q&A phỏng vấn rõ ràng.

---

## 5. Hướng dẫn Cấu hình `appsettings.json`
Thêm cấu hình sau vào ứng dụng để tùy chỉnh thời hạn mặc định và tính năng chia sẻ:

```json
"Frontend": {
  "BaseUrl": "http://localhost:3000"
},
"Reports": {
  "SharingEnabled": true,
  "PdfExportEnabled": true,
  "DefaultShareExpiryDays": 30
}
```

- `Frontend:BaseUrl`: Sử dụng để sinh ra đường dẫn public trả về cho Client (ví dụ: `http://localhost:3000/shared-reports/{token}`).
- `Reports:DefaultShareExpiryDays`: Thời gian hết hạn mặc định của liên kết chia sẻ tính bằng ngày kể từ lúc tạo nếu người dùng không truyền giá trị.
