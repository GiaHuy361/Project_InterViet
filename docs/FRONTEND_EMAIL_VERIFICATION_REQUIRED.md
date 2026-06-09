# Hướng Dẫn Frontend: Luồng Bắt Buộc Xác Minh Email

> **Phiên bản:** Phase 20 (cập nhật 2026-06-09)
> **Backend liên quan:** Email Verification Gate — áp dụng cho các tính năng cốt lõi

---

> [!IMPORTANT]
> **BREAKING CHANGE — Cập nhật 2026-06-09**
> Backend đã **thay đổi format response lỗi** cho toàn bộ hệ thống (tất cả 4xx/5xx).
> Format cũ dùng `{ title, detail, code, type }` — **đã bị xóa**.
> Format mới thống nhất là `{ success: false, error: { code, description } }`.
> Frontend cần cập nhật tất cả chỗ đang đọc `response.data.code` → thành `response.data.error.code`.

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

## 2. Format Response Lỗi (Áp Dụng Toàn Hệ Thống)

Tất cả lỗi từ Backend (400, 401, 403, 404, 409, 429, 503...) đều trả về **cùng một format**:

**HTTP Status:** tương ứng với từng loại lỗi (ví dụ `403 Forbidden`)

**Body JSON — Format thống nhất:**
```json
{
  "success": false,
  "error": {
    "code": "User.EmailNotVerified",
    "description": "Vui lòng xác minh địa chỉ email của bạn trước khi thực hiện hành động này."
  }
}
```

**Ví dụ một số lỗi khác cùng format:**
```json
// 404 Not Found
{ "success": false, "error": { "code": "Match.ResumeNotFound", "description": "Không tìm thấy CV." } }

// 429 Too Many Requests (hết quota)
{ "success": false, "error": { "code": "Quota.Exceeded", "description": "Bạn đã hết lượt sử dụng..." } }

// 400 Bad Request
{ "success": false, "error": { "code": "Interview.PositionRequired", "description": "Vui lòng nhập vị trí phỏng vấn." } }
```

> [!WARNING]
> **Không còn các field `title`, `detail`, `type`, `code` ở root level nữa.**
> Chỉ đọc qua `response.data.error.code` và `response.data.error.description`.

---

## 3. Xử Lý Phía Frontend

### 3.1. Cập Nhật Global Error Handler (Axios Interceptor)

```typescript
// axiosInstance.ts (hoặc httpClient.ts)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorCode = error.response?.data?.error?.code;
    const status    = error.response?.status;

    // Bắt lỗi chưa xác minh email
    if (status === 403 && errorCode === 'User.EmailNotVerified') {
      window.dispatchEvent(new CustomEvent('email-not-verified'));
    }

    // Có thể bắt thêm các lỗi global khác tại đây
    // if (status === 401) { ... xử lý hết phiên đăng nhập ... }
    // if (status === 429) { ... thông báo hết quota ... }

    return Promise.reject(error);
  }
);
```

### 3.2. Đọc Mã Lỗi Từ Response (Helper)

Nên tạo một helper để đọc lỗi nhất quán:

```typescript
// utils/apiError.ts
export function getErrorCode(error: unknown): string | undefined {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.code;
  }
  return undefined;
}

export function getErrorDescription(error: unknown): string | undefined {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.description;
  }
  return undefined;
}

// Dùng trong component:
try {
  await api.createMatch(payload);
} catch (error) {
  const code = getErrorCode(error);
  if (code === 'User.EmailNotVerified') { /* ... */ }
  if (code === 'Quota.Exceeded')        { /* ... */ }
}
```

### 3.3. Thiết Kế Modal Nhắc Xác Minh Email

Khi bắt được sự kiện `email-not-verified`, hiển thị một Modal:

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

### 3.4. API Gửi Lại Email Xác Minh

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
- ❌ Thất bại → Đọc `error.code` để hiển thị thông báo lỗi phù hợp.

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

Nếu `isEmailVerified === false`, nên hiển thị **banner cảnh báo** ở đầu trang (dưới Navbar):

```
⚠️  Email của bạn chưa được xác minh. Một số tính năng sẽ bị hạn chế.
[Gửi lại email xác minh]
```

### 4.3. Vô Hiệu Hóa Nút (Optional Enhancement)

Có thể vô hiệu hóa (`disabled`) các nút Upload CV, Tạo JD, So khớp, Phỏng vấn khi `isEmailVerified === false`, kèm tooltip giải thích.

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
        └─── [IsEmailVerified = false] ─→ 403 Forbidden
                        │                { success: false,
                        │                  error: { code: "User.EmailNotVerified", ... } }
                        ▼
              Axios Interceptor bắt error.response.data.error.code
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

- `[ ]` **[BREAKING]** Cập nhật tất cả chỗ đọc lỗi từ `response.data.code` → `response.data.error.code`
- `[ ]` **[BREAKING]** Cập nhật tất cả chỗ đọc message lỗi từ `response.data.detail` → `response.data.error.description`
- `[ ]` Thêm interceptor bắt lỗi `User.EmailNotVerified` vào HTTP client
- `[ ]` Xây dựng component Modal xác minh email (reusable)
- `[ ]` Gọi API `POST /api/v1/auth/resend-verification-email` khi nhấn nút gửi lại
- `[ ]` Hiển thị banner cảnh báo khi `isEmailVerified === false`
- `[ ]` (Optional) Disable các nút hành động khi chưa xác minh, kèm tooltip

---

*Mọi thắc mắc về API hoặc response format, vui lòng liên hệ đội ngũ Backend.*
