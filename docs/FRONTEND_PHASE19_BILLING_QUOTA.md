# Hướng Dẫn Tích Hợp Frontend: Hệ Thống Gói Cước (Plans), Quota & Giới Hạn Thời Lượng Phỏng Vấn

Tài liệu này hướng dẫn chi tiết cho đội ngũ Frontend cách tích hợp các cập nhật mới nhất từ Backend liên quan đến các gói cước dịch vụ, hạn mức sử dụng (Quotas) và các ràng buộc nghiệp vụ mới (như giới hạn thời lượng cuộc phỏng vấn tối đa theo gói).

---

## 1. Tổng Quan Các Gói Dịch Vụ & Hạn Mức (Quota)

Hệ thống đã cấu hình 6 gói dịch vụ với các thông số như sau:

| Tên Gói (Name) | Mã Gói (Code) | Giá (VND) | Hạn mức CV Matching (`match.create`) | Hạn mức Phỏng vấn (`interview.ai`) | Thời lượng PV tối đa (`interview.max_duration`) | Chu kỳ Reset Quota |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Free Plan** | `free` | 0 | 5 lần | 3 lần | 5 phút | **Vĩnh viễn** (`total` - không reset) |
| **Combo** | `combo` | 29.000 | +3 lần | +1 lần | 5 phút | **Theo lượt mua** (`combo` - tích lũy) |
| **Premium Weekly** | `weekly` | 109.000 | 15 lần | 5 lần | 5 phút | **Hàng tuần** (`weekly`) |
| **Premium Monthly** | `monthly` | 299.000 | 30 lần | 10 lần | 15 phút | **Hàng tháng** (`monthly`) |
| **Premium Quarterly** | `quarterly` | 499.000 | 100 lần | 24 lần | 20 phút | **Hàng quý** (`quarterly`) |
| **Premium Yearly** | `yearly` | 2.999.000 | Không giới hạn | 60 lần | 25 phút | **Hàng năm** (`yearly`) |

> [!NOTE]
> - **Gói Free**: Giới hạn 5 lần Matching và 3 lần Phỏng vấn là **tổng số lần tối đa vĩnh viễn** trên tài khoản đó. Khi hết, người dùng bắt buộc phải nâng cấp hoặc mua thêm (gói Combo) thay vì chờ reset qua ngày.
> - **Chu kỳ Reset "subscription"**: Với các gói trả phí tuần, tháng, quý, năm, Backend sẽ tự động reset quota của người dùng **khi bắt đầu chu kỳ thanh toán mới** hoặc khi họ đổi gói (thay vì reset theo ngày/tháng cố định).

---

## 2. Các API Tích Hợp Mới & Thay Đổi

### 2.1. Lấy danh sách gói cước để hiển thị bảng giá (Pricing Table)
- **Endpoint:** `GET /api/v1/plans`
- **Authentication:** Không bắt buộc (hoặc có).
- **Cấu trúc JSON trả về tiêu biểu:**
```json
{
  "success": true,
  "data": [
    {
      "id": "11111111-1111-1111-1111-111111111111",
      "planKey": "free",
      "name": "Free Plan",
      "description": "Gói Free Plan",
      "priceAmount": 0,
      "displayPrice": null,
      "currencyCode": "VND",
      "billingCycle": "free",
      "badge": null,
      "trialDays": 0,
      "features": [
        { "featureKey": "match.create", "featureValue": "5", "valueType": "quota" },
        { "featureKey": "interview.ai", "featureValue": "3", "valueType": "quota" },
        { "featureKey": "interview.max_duration", "featureValue": "5", "valueType": "quota" },
        { "featureKey": "ai.model.tier", "featureValue": "Basic", "valueType": "string" }
      ]
    },
    {
      "id": "22222222-2222-2222-2222-222222222222",
      "planKey": "monthly",
      "name": "Premium (Monthly)",
      "description": "Gói Premium (Monthly)",
      "priceAmount": 299000,
      "displayPrice": null,
      "currencyCode": "VND",
      "billingCycle": "monthly",
      "badge": null,
      "trialDays": 0,
      "features": [
        { "featureKey": "match.create", "featureValue": "30", "valueType": "quota" },
        { "featureKey": "interview.ai", "featureValue": "10", "valueType": "quota" },
        { "featureKey": "interview.max_duration", "featureValue": "15", "valueType": "quota" },
        { "featureKey": "ai.model.tier", "featureValue": "Stable", "valueType": "string" }
      ]
    },
    {
      "id": "33333333-3333-3333-3333-333333333333",
      "planKey": "quarterly",
      "name": "Premium (Quarterly)",
      "description": "Gói Premium (Quarterly)",
      "priceAmount": 499000,
      "displayPrice": 166333,
      "currencyCode": "VND",
      "billingCycle": "quarterly",
      "badge": "Phổ biến nhất",
      "trialDays": 0,
      "features": [
        { "featureKey": "match.create", "featureValue": "100", "valueType": "quota" },
        { "featureKey": "interview.ai", "featureValue": "24", "valueType": "quota" },
        { "featureKey": "interview.max_duration", "featureValue": "20", "valueType": "quota" },
        { "featureKey": "ai.model.tier", "featureValue": "Premium", "valueType": "string" }
      ]
    },
    {
      "id": "44444444-4444-4444-4444-444444444444",
      "planKey": "yearly",
      "name": "Premium (Yearly)",
      "description": "Gói Premium (Yearly)",
      "priceAmount": 2999000,
      "displayPrice": 249916,
      "currencyCode": "VND",
      "billingCycle": "yearly",
      "badge": "Tiết kiệm nhất",
      "trialDays": 0,
      "features": [
        { "featureKey": "match.create", "featureValue": "unlimited", "valueType": "quota" },
        { "featureKey": "interview.ai", "featureValue": "60", "valueType": "quota" },
        { "featureKey": "interview.max_duration", "featureValue": "25", "valueType": "quota" },
        { "featureKey": "ai.model.tier", "featureValue": "Premium", "valueType": "string" }
      ]
    },
    {
      "id": "55555555-5555-5555-5555-555555555555",
      "planKey": "combo",
      "name": "Gói Combo",
      "description": "Gói Gói Combo",
      "priceAmount": 29000,
      "displayPrice": null,
      "currencyCode": "VND",
      "billingCycle": "combo",
      "badge": "Mua thêm lượt",
      "trialDays": 0,
      "features": [
        { "featureKey": "match.create", "featureValue": "3", "valueType": "quota" },
        { "featureKey": "interview.ai", "featureValue": "1", "valueType": "quota" },
        { "featureKey": "interview.max_duration", "featureValue": "5", "valueType": "quota" }
      ]
    }
  ]
}
```

> [!TIP]
> - **`displayPrice` (nếu khác null):** Là giá quy đổi trung bình mỗi tháng (Ví dụ: Gói Quý 499k có `displayPrice = 166333` ~ 166k/tháng; Gói Năm 2999k có `displayPrice = 249916` ~ 250k/tháng). Frontend nên dùng giá trị này để hiển thị nhỏ bên dưới giá gốc nhằm kích thích người dùng mua gói dài hạn.
> - **`badge` (nếu khác null):** Nội dung nổi bật cần gắn lên thẻ gói cước (ví dụ: *"Phổ biến nhất"*, *"Tiết kiệm nhất"*, *"Mua thêm lượt"*).

---

### 2.2. Lấy thông tin đăng ký (Subscription) của người dùng hiện tại
- **Endpoint:** `GET /api/v1/subscription`
- **Authentication:** Bắt buộc (Bearer Token).
- **Cấu trúc JSON trả về:**
```json
{
  "success": true,
  "data": {
    "id": "787f7112-9c1a-4d43-85fe-1a4be9fb093c",
    "planId": "22222222-2222-2222-2222-222222222222",
    "planName": "Premium (Monthly)",
    "status": "active",
    "currentPeriodStartsAt": "2026-06-08T00:00:00Z",
    "currentPeriodEndsAt": "2026-07-08T00:00:00Z",
    "autoRenewEnabled": true,
    "cancelAtPeriodEnd": false
  }
}
```
*Lưu ý:* Nếu người dùng chưa từng mua gói cước, API vẫn trả về thành công với trạng thái mặc định là gói `Free Plan` (`status = "free"` và `id = "00000000-0000-0000-0000-000000000000"`).

---

### 2.3. Hủy tự động gia hạn gói cước
- **Endpoint:** `POST /api/v1/subscription/cancel`
- **Authentication:** Bắt buộc.
- **Mục đích:** Người dùng yêu cầu không tự động gia hạn khi chu kỳ hiện tại kết thúc (`cancelAtPeriodEnd` sẽ chuyển thành `true`).

---

### 2.4. Kích hoạt nhanh gói cước (Dành riêng cho môi trường DEV / TEST)
- **Endpoint:** `POST /api/v1/subscription/dev-activate`
- **Authentication:** Bắt buộc.
- **Request Body:**
```json
{
  "planKey": "monthly" 
}
```
*(Các giá trị planKey hợp lệ: `free`, `monthly`, `quarterly`, `yearly`, `combo`, `weekly`)*.
- **Mục đích:** Giúp lập trình viên frontend hoặc tester nhanh chóng chuyển đổi tài khoản sang gói cước mong muốn để kiểm tra giao diện và hạn mức tương ứng mà không cần đi qua cổng thanh toán thật.

---

## 3. Các Nghiệp Vụ Quan Trọng Cần Xử Lý Trên Frontend

### 3.1. Giới hạn thời lượng cuộc phỏng vấn Realtime (Voice Interview Duration Limit)
Khi người dùng chuẩn bị bắt đầu một phiên phỏng vấn thử (Voice Interview), giao diện thường cho phép chọn thời lượng cuộc phỏng vấn (ví dụ: 5, 10, 15, 20, 25 phút).
- **Cách xử lý:**
  1. Đọc giá trị `interview.max_duration` từ tính năng (features) của gói cước hiện tại của người dùng.
  2. Ở màn hình cấu hình trước khi phỏng vấn, **vô hiệu hóa (disable) hoặc ẩn** các lựa chọn thời lượng vượt quá hạn mức này.
     - *Ví dụ:* Người dùng gói `Free`, `Combo`, hoặc `Weekly` chỉ được chọn tối đa **5 phút**. Nếu cố tình gửi request lớn hơn lên API bắt đầu phỏng vấn (`POST /api/v1/interviews/realtime/start` hoặc tương đương), Backend sẽ trả về lỗi `400 Bad Request` hoặc `403 Forbidden`.

### 3.2. Hiển thị thông báo và chuyển hướng khi hết Quota
Khi người dùng thực hiện CV Matching (`POST /api/v1/matches` hoặc `POST /api/v1/matches/multi`) hoặc Tạo phiên phỏng vấn (`POST /api/v1/interviews`):
- Nếu tài khoản đã sử dụng hết lượt quota tương ứng, Backend sẽ chặn lại và trả về mã lỗi HTTP `403 Forbidden` với cấu trúc như sau:
```json
{
  "success": false,
  "error": {
    "code": "Quota.Exceeded",
    "message": "Bạn không có quyền sử dụng tính năng này." 
  }
}
```
*(Thông báo tiếng Việt cụ thể có thể thay đổi tùy thuộc vào tính năng bị chặn, ví dụ: "Bạn đã dùng hết hạn mức tạo lượt phỏng vấn của gói hiện tại.")*
- **Cách xử lý:**
  - Viết bộ lọc lỗi chung (interceptor/middleware) hoặc bắt lỗi cục bộ tại API gọi Matching/Interview.
  - Khi bắt được mã lỗi `"Quota.Exceeded"` hoặc HTTP Status `403`:
    - Hiển thị một **Modal thông báo nâng cấp** bắt mắt.
    - Cung cấp nút chuyển hướng nhanh đến trang Bảng giá (Pricing / Upgrade Page) để người dùng chọn gói cước cao hơn hoặc mua thêm lượt thông qua gói Combo.

### 3.3. Tích hợp thanh toán qua PayOS (Nhắc lại luồng checkout)
Khi người dùng bấm chọn một gói cước trả phí trên UI:
1. Gọi API `POST /api/v1/billing/checkout` với body:
```json
{
  "planKey": "monthly",
  "provider": "payos",
  "returnUrl": "https://interviet-frontend.vercel.app/subscription/success",
  "cancelUrl": "https://interviet-frontend.vercel.app/subscription/cancel"
}
```
2. Nhận phản hồi chứa `checkoutUrl`.
3. Chuyển hướng người dùng sang `checkoutUrl` để họ thực hiện quét mã QR thanh toán qua PayOS.
4. Sau khi thanh toán thành công hoặc hủy, PayOS/Backend sẽ dẫn người dùng quay lại `returnUrl` hoặc `cancelUrl` đã truyền.

---

## 4. Bảng Tra Cứu Quota Các Gói Chi Tiết (Cho Logic Phức Tạp)

Nếu frontend cần hiển thị chi tiết số lượt tối đa của từng tính năng trong Dashboard (trang Quản lý tài khoản / Hồ sơ cá nhân):

| Feature Key | Ý nghĩa | Free | Combo | Weekly | Monthly | Quarterly | Yearly |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `cv.storage` | Số CV tối đa lưu trữ | 5 | 3 | 15 | 30 | 100 | Vô hạn (`unlimited`) |
| `cv.optimization` | Tối ưu CV (upload/parse) | 5 | 3 | 15 | 30 | 100 | Vô hạn (`unlimited`) |
| `interview.ai` | Lượt phỏng vấn AI | 3 | 1 | 5 | 10 | 24 | 60 |
| `match.create` | Lượt Matching CV-JD | 5 | 3 | 15 | 30 | 100 | Vô hạn (`unlimited`) |
| `multi_jd.match` | Số JD tối đa mỗi lượt Multi-Match | 3 | 3 | 3 | 3 | 10 | 20 |
| `resume.upload` | Tải CV lên | 5 | 3 | 15 | 30 | 100 | Vô hạn (`unlimited`) |
| `resume.parse` | Phân tích CV | 5 | 3 | 15 | 30 | 100 | Vô hạn (`unlimited`) |
| `jobdescription.create` | Tạo JD (lần/ngày) | 5 | 5 | 5 | 20 | 50 | Vô hạn (`unlimited`) |

---
*Mọi thắc mắc hoặc cần làm rõ thêm về API, vui lòng liên hệ đội ngũ Backend.*
