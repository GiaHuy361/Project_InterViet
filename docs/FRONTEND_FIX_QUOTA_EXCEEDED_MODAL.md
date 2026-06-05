# FRONTEND — Sửa lỗi Quota.Exceeded bị redirect sang trang /forbidden

> **Ngày:** 2026-06-05  
> **Ưu tiên:** Cao — ảnh hưởng trực tiếp UX người dùng

---

## 1. Vấn đề hiện tại

Khi người dùng hết quota (ví dụ: lưu CV), thay vì hiện thông báo ngay trong trang, app bị **văng ra ngoài trang `/forbidden`** với URL:

```
/forbidden?code=Quota.Exceeded&title=Quota.Exceeded&detail=Bạn+đã+dùng+hết+quota...
```

**Nguyên nhân:** Frontend đang có 1 HTTP interceptor toàn cục bắt **tất cả lỗi 403** và redirect sang `/forbidden` — kể cả `Quota.Exceeded` lẽ ra chỉ nên hiện modal/toast tại chỗ.

---

## 2. Hành vi Backend (không thay đổi)

Khi hết quota, backend trả về:

```
HTTP 403 Forbidden
```

```json
{
  "code": "Quota.Exceeded",
  "title": "Quota.Exceeded",
  "detail": "Bạn đã dùng hết quota cho tính năng cv.storage."
}
```

Trường `code` luôn là `"Quota.Exceeded"` — dùng trường này để phân biệt với các lỗi 403 thông thường.

---

## 3. Cần sửa ở đâu

### Bước 1 — Sửa HTTP interceptor toàn cục

Tìm file interceptor (thường là `lib/axios.ts`, `utils/api.ts`, `services/http.ts` hoặc tương tự), tìm đoạn xử lý lỗi 403:

**Trước (đang bị lỗi):**
```ts
if (error.response?.status === 403) {
  // Redirect TẤT CẢ lỗi 403 → sai với Quota.Exceeded
  router.push(
    `/forbidden?code=${data.code}&title=${data.title}&detail=${data.detail}`
  );
}
```

**Sau (đã sửa):**
```ts
if (error.response?.status === 403) {
  const code = error.response.data?.code;

  // Quota.Exceeded → KHÔNG redirect, throw lên để component tự hiện modal
  if (code === "Quota.Exceeded") {
    return Promise.reject(error);
  }

  // Các lỗi 403 khác (không có quyền) → redirect như cũ
  router.push(
    `/forbidden?code=${code}&title=${error.response.data?.title}&detail=${error.response.data?.detail}`
  );
}
```

---

### Bước 2 — Bắt lỗi trong từng component gọi API có quota

Tại các component upload CV, tạo CV, phân tích CV, đối sánh JD... thêm xử lý:

```ts
try {
  await uploadCV(file); // hoặc bất kỳ action nào có quota
} catch (error: any) {
  if (error?.response?.data?.code === "Quota.Exceeded") {
    // Hiện modal nâng cấp gói thay vì để app redirect
    setShowQuotaModal(true);
    return;
  }
  // Các lỗi khác xử lý bình thường
  toast.error("Đã có lỗi xảy ra, vui lòng thử lại.");
}
```

---

### Bước 3 — Modal nâng cấp gói (UI gợi ý)

Khi `showQuotaModal === true`, hiển thị modal với nội dung:

```
🔒 Bạn đã dùng hết quota

Bạn đã đạt giới hạn sử dụng cho tính năng này.
Nâng cấp gói để tiếp tục sử dụng không giới hạn.

[ Nâng cấp gói ]    [ Để sau ]
```

Nút **Nâng cấp gói** → điều hướng đến `/pricing` hoặc trang thanh toán.  
Nút **Để sau** → đóng modal, người dùng vẫn ở nguyên trang hiện tại.

---

## 4. Các tính năng có quota cần kiểm tra lại

Tìm tất cả các API call có thể trả về `Quota.Exceeded` và đảm bảo đều đã có xử lý modal:

| Tính năng | API endpoint |
|---|---|
| Upload / lưu CV | `POST /api/v1/resumes` |
| Phân tích CV | `POST /api/v1/resumes/{id}/parse` |
| Đối sánh JD | `POST /api/v1/matching/...` |
| Tạo báo cáo | `POST /api/v1/reports/...` |
| Luyện phỏng vấn | `POST /api/v1/interviews/...` |

---

## 5. Tóm tắt

| | Trước | Sau |
|---|---|---|
| Khi hết quota | Redirect sang `/forbidden` | Hiện modal nâng cấp tại chỗ |
| Người dùng bị văng ra ngoài | ✅ (xấu) | ❌ (đã fix) |
| UX giữ nguyên luồng | ❌ | ✅ |
| Backend cần sửa | — | **Không cần** |
| Frontend cần sửa | — | **Interceptor + component catch** |
