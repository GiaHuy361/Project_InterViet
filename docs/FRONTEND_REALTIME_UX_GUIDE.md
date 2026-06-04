# HƯỚNG DẪN TÍCH HỢP SIGNALR REAL-TIME NOTIFICATION (FRONTEND)

Tài liệu này hướng dẫn cách kết nối và lắng nghe sự kiện từ SignalR Hub để tối ưu hóa trải nghiệm người dùng (UX) khi tải lên CV và đối sánh JD (JD Matching) chạy dưới nền (background jobs).

---

## 1. Kết nối tới SignalR Hub

* **Hub Endpoint**: `/hubs/notifications` (Ví dụ: `https://api.interviet.vn/hubs/notifications`)
* **Xác thực**: Yêu cầu đính kèm JWT Token trong query string hoặc header khi kết nối.

### Ví dụ kết nối bằng thư viện `@microsoft/signalr`:

```typescript
import * as signalR from "@microsoft/signalr";

const connection = new signalR.HubConnectionBuilder()
    .withUrl("https://api.interviet.vn/hubs/notifications", {
        accessTokenFactory: () => {
            // Trả về token hiện tại của user đang đăng nhập
            return localStorage.getItem("token") || ""; 
        }
    })
    .withAutomaticReconnect()
    .build();

// Khởi chạy connection
async function startConnection() {
    try {
        await connection.start();
        console.log("SignalR Connected to NotificationHub!");
    } catch (err) {
        console.error("SignalR Connection Failed: ", err);
        setTimeout(startConnection, 5000);
    }
}

startConnection();
```

---

## 2. Lắng nghe Sự kiện `notification`

Sự kiện `notification` sẽ được push trực tiếp tới người dùng khi hệ thống xử lý xong các tác vụ dưới nền.

```typescript
connection.on("notification", (notif: AppNotification) => {
    console.log("Nhận thông báo mới:", notif);
    
    // Xử lý logic hiển thị dựa trên type
    handleRealtimeNotification(notif);
});

interface AppNotification {
    id: string;        // Guid định danh thông báo
    type: string;      // Loại thông báo (VD: "resume.parsed")
    title: string;     // Tiêu đề hiển thị
    message: string;   // Nội dung mô tả chi tiết
    actionUrl: string; // URL hướng dẫn đi tới kết quả (nếu có)
    data: any;         // Dữ liệu bổ sung đi kèm
    createdAt: string; // Thời gian tạo
}
```

---

## 3. Danh sách các Types và Payload chi tiết

### 3.1. Phân tích CV xong (`resume.parsed`)
* **Khi nào**: Hệ thống AI đã parse thành công CV vừa upload.
* **UX gợi ý**: Ẩn Spinner/Skeleton tải, hiển thị Toast thành công, reload danh sách CV.
* **Payload mẫu**:
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "type": "resume.parsed",
  "title": "CV đã được phân tích xong",
  "message": "CV của bạn đã được phân tích thành công và sẵn sàng sử dụng.",
  "actionUrl": "/cv/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "data": {
    "resumeId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
  },
  "createdAt": "2026-06-04T16:35:10Z"
}
```

### 3.2. Phân tích CV thất bại (`resume.failed`)
* **Khi nào**: Xảy ra lỗi (Lỗi service Python, lỗi tệp tin hỏng...).
* **UX gợi ý**: Ẩn Spinner/Skeleton, hiển thị Toast cảnh báo đỏ kèm mã lỗi để người dùng thử lại.
* **Payload mẫu**:
```json
{
  "id": "f5b61a3d-4c8d-4e9e-a0f1-1a2b3c4d5e6f",
  "type": "resume.failed",
  "title": "Phân tích CV thất bại",
  "message": "Quá trình phân tích CV gặp sự cố. Vui lòng thử lại. (PARSING_ERROR)",
  "actionUrl": "/cv/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "data": {
    "resumeId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "errorCode": "PARSING_ERROR"
  },
  "createdAt": "2026-06-04T16:35:15Z"
}
```

### 3.3. Đối sánh JD hoàn thành (`match.completed`)
* **Khi nào**: Phiên đối sánh một hoặc nhiều JD (Parallel Multi-JD Matching) đã chạy xong thành công.
* **UX gợi ý**: Tải lại danh sách/bảng kết quả đối sánh tại URL tương ứng.
* **Payload mẫu**:
```json
{
  "id": "e9b5f903-f0e2-45e3-85bb-5942ad76cd21",
  "type": "match.completed",
  "title": "Kết quả đối sánh đã sẵn sàng",
  "message": "Đã đối sánh 3/3 vị trí thành công. Xem kết quả chi tiết.",
  "actionUrl": "/matches/c6f4efe1-1cbd-4a22-bdcc-18886eba78d2",
  "data": {
    "matchSessionId": "c6f4efe1-1cbd-4a22-bdcc-18886eba78d2",
    "completed": 3,
    "total": 3
  },
  "createdAt": "2026-06-04T16:36:00Z"
}
```

### 3.4. Đối sánh JD thất bại (`match.failed`)
* **Khi nào**: Hệ thống AI gặp sự cố trong quá trình đối sánh toàn bộ các JD.
* **UX gợi ý**: Ẩn trạng thái chờ, toast báo lỗi.
* **Payload mẫu**:
```json
{
  "id": "7b8a9c0d-e1f2-3a4b-5c6d-7e8f9a0b1c2d",
  "type": "match.failed",
  "title": "Đối sánh nhiều JD thất bại",
  "message": "Quá trình đối sánh gặp sự cố. Vui lòng thử lại.",
  "actionUrl": "/matches/c6f4efe1-1cbd-4a22-bdcc-18886eba78d2",
  "data": {
    "matchSessionId": "c6f4efe1-1cbd-4a22-bdcc-18886eba78d2"
  },
  "createdAt": "2026-06-04T16:36:05Z"
}
```

---

## 4. Hướng dẫn UX Flow đề xuất

1. **Khi người dùng Upload CV**:
   * API `/api/v1/resumes/upload` sẽ trả về `200 OK` ngay lập tức kèm payload CV ở trạng thái `queued`.
   * Frontend lưu ID và đưa CV này vào danh sách kèm trạng thái "Đang phân tích..." (hiển thị Spinner hoặc Skeleton tại dòng tương ứng).
   * Khi nhận được sự kiện `resume.parsed` từ SignalR, cập nhật trạng thái CV thành "Sẵn sàng" và cập nhật thông tin UI.

2. **Khi người dùng bấm "Matching" nhiều JD**:
   * API `/api/v1/matches/multi` trả về `200 OK` ngay kèm `sessionId` và danh sách target đang `pending`.
   * Frontend chuyển hướng người dùng sang trang chi tiết session `/matches/{sessionId}` (hoặc hiển thị modal tiến độ). Hiển thị trạng thái chờ xử lý toàn bộ.
   * Khi nhận được sự kiện `match.completed` từ SignalR, tự động reload lại data của session đó để render bảng kết quả đối sánh.
