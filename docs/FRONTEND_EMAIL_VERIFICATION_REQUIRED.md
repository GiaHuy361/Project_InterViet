# Hướng Dẫn Frontend: Luồng Bắt Buộc Xác Minh Email

> **Phiên bản:** Phase 20  
> **Ngày cập nhật:** 2026-06-08  
> **Backend liên quan:** Email Verification Gate — áp dụng cho các tính năng cốt lõi

---

## 1. Tổng Quan

Từ phiên bản này, Backend **bắt buộc người dùng phải xác minh email** trước khi thực hiện các hành động tốn tài nguyên AI/lưu trữ. Điều này nhằm ngăn chặn các tài khoản ảo/spam lạm dụng hệ thống.

**Các hành động bị chặn nếu chưa xác minh email:**

| Hành động | Endpoint | Mô tả |
| :--- | :--- | :--- |
| Tải lên CV | `POST /api/v1/resumes` | Upload và phân tích CV bằng AI |
| Tạo mô tả công việc (JD) | `POST /api/v1/jobdescriptions` | Tạo JD mới |
| So khớp đơn lẻ | `POST /api/v1/matches` | So khớp 1 CV với 1 JD |
| So khớp đa điểm | `POST /api/v1/matches/multi` | So khớp 1 CV với nhiều JD |
| Tạo phiên phỏng vấn AI | `POST /api/v1/interviews` | Khởi tạo phỏng vấn AI & Realtime |

> [!NOTE]
> **Tài khoản đăng nhập qua Google** đã được tự động đánh dấu xác minh email (`IsEmailVerified = true`) nên sẽ **không bị chặn**.

---

## 2. Response Lỗi Từ Backend

Khi người dùng chưa xác minh email và gọi vào một trong các endpoint trên, Backend trả về:

**HTTP Status:** `403 Forbidden`

**Body JSON:**
```json
{
  "success": false,
  "error": {
    "code": "User.EmailNotVerified",
    "description": "Vui lòng xác minh địa chỉ email của bạn trước khi thực hiện hành động này."
  }
}
```

---

## 3. Xử Lý Phía Frontend

### 3.1. Bắt Lỗi Tại HTTP Client (Axios Interceptor)

Thêm interceptor vào global HTTP client để bắt lỗi `User.EmailNotVerified` và hiển thị Modal xác minh email:

```typescript
// axiosInstance.ts (hoặc httpClient.ts)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 403 &&
      error.response?.data?.error?.code === 'User.EmailNotVerified'
    ) {
      // Dispatch event hoặc gọi trực tiếp để mở Modal xác minh email
      window.dispatchEvent(new CustomEvent('email-not-verified'));
    }
    return Promise.reject(error);
  }
);
```

### 3.2. Thiết Kế Modal Nhắc Xác Minh Email

Khi bắt được sự kiện `email-not-verified`, hiển thị một Modal với nội dung gợi ý:

```
🔒 Xác minh email của bạn

Bạn cần xác minh địa chỉ email để sử dụng tính năng này.
Chúng tôi đã gửi một email kích hoạt đến: [email của user]

[Gửi lại email xác minh]   [Đóng]
```

**Các yếu tố cần có trong Modal:**
- Tiêu đề rõ ràng (ví dụ: "Xác minh email")
- Email hiện tại của người dùng (lấy từ auth store/context)
- Nút **"Gửi lại email xác minh"** → gọi API `POST /api/v1/auth/resend-verification-email`
- Nút **"Đóng"** để dismiss Modal

### 3.3. API Gửi Lại Email Xác Minh

```
POST /api/v1/auth/resend-verification-email
Authorization: Bearer <token>
Body: (không cần body)
```

**Response thành công:**
```json
{
  "success": true,
  "message": "Email xác minh đã được gửi lại."
}
```

**Xử lý sau khi gọi API:**
- ✅ Thành công → Hiển thị thông báo: *"Email xác minh đã được gửi! Vui lòng kiểm tra hộp thư (kể cả mục Spam)."*
- ❌ Thất bại (rate-limit hoặc lỗi khác) → Hiển thị thông báo lỗi tương ứng.

---

## 4. Hiển Thị Trạng Thái Xác Minh Email Trên UI

### 4.1. Lấy Trạng Thái Từ API

Trạng thái xác minh email (`isEmailVerified`) được trả về trong response của API:
- `GET /api/v1/auth/me` — profile của người dùng hiện tại
- `POST /api/v1/auth/login` / `POST /api/v1/auth/register` — response đăng nhập/đăng ký

**Field cần dùng:**
```json
{
  "isEmailVerified": false
}
```

### 4.2. Banner Cảnh Báo (Proactive Warning)

Nếu `isEmailVerified === false`, nên hiển thị **banner cảnh báo** ở đầu trang (dưới Navbar) với nội dung:

```
⚠️  Email của bạn chưa được xác minh. Một số tính năng sẽ bị hạn chế.
[Gửi lại email xác minh]
```

Điều này giúp người dùng biết trước thay vì gặp lỗi khi thực hiện hành động.

### 4.3. Vô Hiệu Hóa Nút (Optional Enhancement)

Có thể vô hiệu hóa (`disabled`) các nút liên quan đến Upload CV, Tạo JD, So khớp, Phỏng vấn khi `isEmailVerified === false`, kèm tooltip giải thích.

---

## 5. Luồng Xử Lý Tổng Thể (Flow Diagram)

```
Người dùng nhấn [Upload CV / Tạo JD / So khớp / Phỏng vấn]
        │
        ▼
Backend kiểm tra IsEmailVerified
        │
        ├─── [IsEmailVerified = true] ──→ Xử lý bình thường ✅
        │
        └─── [IsEmailVerified = false] ─→ 403 User.EmailNotVerified
                        │
                        ▼
              Axios Interceptor bắt lỗi
                        │
                        ▼
              Hiển thị Modal xác minh email
                        │
                  [Gửi lại email]
                        │
                        ▼
              POST /api/v1/auth/resend-verification-email
                        │
                        ▼
              Thông báo: "Email đã được gửi!"
                        │
              Người dùng kiểm tra email → Click link xác minh
                        │
                        ▼
              isEmailVerified = true → Tính năng mở khóa ✅
```

---

## 6. Checklist Tích Hợp

- `[ ]` Thêm interceptor bắt lỗi `User.EmailNotVerified` vào HTTP client
- `[ ]` Xây dựng component Modal xác minh email (reusable)
- `[ ]` Gọi API `POST /api/v1/auth/resend-verification-email` khi nhấn nút gửi lại
- `[ ]` Hiển thị banner cảnh báo khi `isEmailVerified === false`
- `[ ]` (Optional) Disable các nút hành động khi chưa xác minh, kèm tooltip

---

*Mọi thắc mắc về API hoặc response format, vui lòng liên hệ đội ngũ Backend.*
