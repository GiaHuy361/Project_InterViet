# FRONTEND — Cập nhật trạng thái lịch hẹn Mentor: `payment_expired`

> **Phiên bản backend áp dụng:** từ commit `5aa9637` trên nhánh `backend-csharp`  
> **Ngày:** 2026-06-04

---

## 1. Bối cảnh

Backend đã triển khai **MentorBookingCleanupBackgroundService** — một background worker chạy mỗi **5 phút**, tự động xử lý các lịch đặt Mentor bị bỏ dở (người dùng tạo checkout nhưng không thanh toán, tắt trình duyệt ngang):

| Trước | Sau (worker tự động làm) |
|---|---|
| Checkout session: `pending` → **`expired`** | ✅ |
| Lịch hẹn: `pending_payment` → **`payment_expired`** | ✅ |
| Khung giờ: `reserved` → **`available`** (giải phóng cho người khác đặt) | ✅ |

---

## 2. Trạng thái mới cần xử lý: `payment_expired`

### Danh sách đầy đủ trạng thái lịch hẹn (MentorBooking.Status)

| Status | Ý nghĩa |
|---|---|
| `pending_payment` | Đang chờ thanh toán (đã tạo checkout, chưa trả tiền) |
| `confirmed` | Đã thanh toán, xác nhận lịch hẹn thành công |
| `completed` | Đã hoàn thành buổi tư vấn |
| `cancelled` | Bị hủy (bởi người dùng hoặc mentor) |
| `payment_failed` | Thanh toán thất bại (PayOS trả về lỗi) |
| `payment_cancelled` | Người dùng bấm "Hủy thanh toán" trong trang checkout |
| **`payment_expired`** ⭐ **MỚI** | Phiên thanh toán hết hạn — hệ thống tự động hủy |

---

## 3. Những chỗ cần cập nhật trong Frontend

### 3.1. Badge / Label trạng thái lịch hẹn

Tìm file định nghĩa map trạng thái (thường là `utils/booking.ts`, `constants/booking.ts` hoặc tương tự), thêm vào:

```ts
// Ví dụ: utils/bookingStatus.ts

export const BOOKING_STATUS_LABEL: Record<string, string> = {
  pending_payment:    "Chờ thanh toán",
  confirmed:          "Đã xác nhận",
  completed:          "Hoàn thành",
  cancelled:          "Đã hủy",
  payment_failed:     "Thanh toán thất bại",
  payment_cancelled:  "Đã hủy thanh toán",
  payment_expired:    "Hết hạn thanh toán", // ← THÊM DÒNG NÀY
};

export const BOOKING_STATUS_COLOR: Record<string, string> = {
  pending_payment:    "yellow",
  confirmed:          "green",
  completed:          "blue",
  cancelled:          "gray",
  payment_failed:     "red",
  payment_cancelled:  "orange",
  payment_expired:    "gray", // ← THÊM DÒNG NÀY (dùng cùng màu với cancelled)
};
```

---

### 3.2. Badge UI Component

Nếu dùng switch/case hoặc if/else trong component, thêm nhánh mới:

```tsx
// Ví dụ: components/BookingStatusBadge.tsx

function BookingStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending_payment":
      return <Badge color="yellow">Chờ thanh toán</Badge>;
    case "confirmed":
      return <Badge color="green">Đã xác nhận</Badge>;
    case "completed":
      return <Badge color="blue">Hoàn thành</Badge>;
    case "cancelled":
      return <Badge color="gray">Đã hủy</Badge>;
    case "payment_failed":
      return <Badge color="red">Thanh toán thất bại</Badge>;
    case "payment_cancelled":
      return <Badge color="orange">Đã hủy thanh toán</Badge>;

    // ──────────────────────────────────────────
    // THÊM CASE MỚI NÀY:
    case "payment_expired":
      return <Badge color="gray">Hết hạn thanh toán</Badge>;
    // ──────────────────────────────────────────

    default:
      return <Badge color="gray">{status}</Badge>;
  }
}
```

---

### 3.3. Trang lịch sử đặt lịch của người dùng (Booking History)

Trạng thái `payment_expired` nên được hiển thị cùng nhóm với `cancelled` và `payment_failed` (nhóm "Không thành công").

**Gợi ý UX:**

```
❌ Hết hạn thanh toán
   Phiên thanh toán đã hết hạn. Khung giờ đã được giải phóng,
   bạn có thể đặt lại nếu muốn.
   [Đặt lại] ← nút dẫn tới trang chi tiết Mentor
```

---

### 3.4. Filter / Tab lọc trạng thái (nếu có)

Nếu trang lịch sử có tab lọc theo trạng thái, thêm `payment_expired` vào nhóm **"Không thành công"** hoặc **"Đã hủy"**:

```ts
// Ví dụ logic grouping
const FAILED_STATUSES = [
  "cancelled",
  "payment_failed",
  "payment_cancelled",
  "payment_expired", // ← THÊM
];
```

---

## 4. Hành vi phía người dùng sau khi bị `payment_expired`

| Tình huống | Hành vi |
|---|---|
| Người dùng mở lại trang lịch sử | Thấy lịch hẹn có badge "Hết hạn thanh toán" |
| Người dùng muốn đặt lại | Khung giờ đã được giải phóng → vào trang Mentor đặt bình thường |
| Người dùng đang trên trang checkout khi hết hạn | PayOS tự redirect về `cancel_url`, hiển thị màn hình hủy như bình thường |

---

## 5. Không cần thay đổi gì thêm ✅

| Tính năng | Lý do |
|---|---|
| Trang danh sách khung giờ Mentor | Backend tự trả về slot đúng trạng thái `available` |
| Trang quản lý lịch của Mentor | Slot quá hạn tạm giữ tự động hiển thị `available` |
| Countdown timer checkout | Không đổi — khi hết giờ vẫn redirect về cancel_url |
| Webhook PayOS | Không đổi |
