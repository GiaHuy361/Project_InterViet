# Hướng dẫn Tích hợp Frontend — Phase 18: Cổng thanh toán PayOS & SignalR Realtime

Tài liệu này cung cấp hướng dẫn chi tiết cho đội ngũ Frontend để tích hợp cổng thanh toán **PayOS** và các sự kiện realtime trạng thái đơn hàng thông qua **SignalR** trong dự án INTER-VIET.

---

## 1. Tổng quan Phase 18

*   **Thay thế Mock Billing**: Luồng thanh toán cũ thông qua Mock/Manual Bank Transfer (nộp thông tin tài khoản và đăng ảnh biên lai) **không còn là luồng chính**.
*   **Redirect thanh toán**: Frontend chỉ cần sử dụng đường dẫn `checkoutUrl` được Backend trả về từ API để chuyển hướng người dùng sang trang thanh toán chính thức của PayOS.
*   **Xác minh thanh toán**: Trạng thái thanh toán thành công thật sự (`succeeded`) **chỉ dựa trên Webhook của PayOS** gửi về và được xác thực chữ ký (Signature/Checksum) tại Backend.
*   **Nguyên tắc ReturnUrl**: Đường dẫn quay lại (`ReturnUrl`) khi hoàn tất thanh toán trên PayOS chỉ là trang hiển thị trạng thái tạm thời (chờ xác nhận). Frontend **tuyệt đối không** tự động kích hoạt gói cước hoặc thay đổi trạng thái tài khoản của người dùng chỉ dựa trên các tham số nhận được trên URL.
*   **SignalR & Polling**: Trạng thái thanh toán sẽ được cập nhật tức thời xuống Client thông qua SignalR. Trong trường hợp SignalR mất kết nối hoặc người dùng tắt trình duyệt trước đó, Frontend sẽ sử dụng cơ chế Polling (truy vấn lặp) để đối chiếu trạng thái.

---

## 2. Quy trình Thanh toán (Payment Flow)

Quy trình thanh toán giữa các thành phần hệ thống diễn ra như sau:

1.  **Chọn gói dịch vụ**: Người dùng click chọn mua gói Subscription (hoặc đặt lịch Mentor).
2.  **Khởi tạo Checkout**: Frontend gửi yêu cầu tạo phiên thanh toán tới API Backend: `POST /api/v1/billing/checkout`.
3.  **Tạo phiên thanh toán**: Backend tạo `BillingCheckoutSession` trong database, sinh mã đơn hàng `OrderCode` dạng số nguyên `long` (độc nhất), gọi API PayOS Sandbox/Production để lấy liên kết thanh toán.
4.  **Trả kết quả**: Backend trả về `checkoutUrl` và thông tin phiên giao dịch (`checkoutSessionId`, `paymentId`).
5.  **Chuyển hướng (Redirect)**: Frontend chuyển hướng trình duyệt của người dùng tới `checkoutUrl` (Cổng PayOS).
6.  **Thực hiện giao dịch**: Người dùng quét mã QR hoặc điền thông tin tài khoản ngân hàng test/real trên trang PayOS để hoàn tất thanh toán.
7.  **Webhook từ PayOS**: PayOS gửi một thông báo (Webhook) có kèm chữ ký bảo mật tới API Backend của INTER-VIET.
8.  **Xác thực & Kích hoạt**: Backend nhận Webhook, giải mã và xác thực chữ ký bằng `ChecksumKey`, cập nhật trạng thái session thành `succeeded`, ghi nhận hóa đơn (`Invoice`), cập nhật/gia hạn Subscription tương ứng của người dùng.
9.  **Đẩy sự kiện SignalR**: Backend đẩy thông báo thời gian thực xuống Frontend qua kênh SignalR với 2 sự kiện:
    *   `payment.updated`
    *   `subscription.activated`
10. **Fallback xác nhận**: Trang kết quả thanh toán của Frontend (Success page) cũng chủ động gọi API `GET /api/v1/billing/payments/{id}` để cập nhật trạng thái giao dịch từ DB đề phòng trường hợp rớt kết nối SignalR hoặc webhook có độ trễ.
11. **Cập nhật giao diện**: Sau khi xác nhận trạng thái thành công, Frontend hiển thị Modal chúc mừng, reload gói VIP hiện tại và quota sử dụng của người dùng.

---

## 3. API: Tạo Phiên Thanh Toán (Create Checkout)

Sử dụng endpoint này để khởi tạo phiên giao dịch và nhận link thanh toán từ PayOS.

*   **API Path:** `POST /api/v1/billing/checkout`
*   **Authentication:** Yêu cầu Header JWT `Authorization: Bearer <token>`
*   **Request JSON Shape:**
    ```json
    {
      "planId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "planKey": "premium_monthly",
      "provider": "payos",
      "returnUrl": "http://localhost:3000/payment/success",
      "cancelUrl": "http://localhost:3000/payment/cancel"
    }
    ```
    > [!NOTE]
    > * Bạn có thể truyền `planId` (ID của gói) **hoặc** `planKey` (Mã code của gói). Nếu truyền cả hai, Backend sẽ ưu tiên dùng `planId`.
    > * Giá trị `provider` bắt buộc là `"payos"`.
    > * Đường dẫn `returnUrl` và `cancelUrl` là nơi PayOS sẽ redirect trình duyệt của người dùng về sau khi hoàn thành/hủy thanh toán.

*   **Response JSON (HTTP 200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "checkoutSessionId": "2bf50b91-1efd-4a92-bf3b-9a88eba78d2b",
        "paymentId": "2bf50b91-1efd-4a92-bf3b-9a88eba78d2b",
        "checkoutUrl": "https://pay.payos.vn/web/3e80d463d12d4a2cb5804dfcb13b632c",
        "status": "pending",
        "expiresAt": "2026-05-28T14:15:00.000Z",
        "expiredAt": "2026-05-28T14:15:00.000Z",
        "provider": "payos",
        "planKey": "premium_monthly",
        "amount": 200000.00,
        "currencyCode": "VND",
        "paymentInstructionsUrl": "/api/v1/billing/checkout-sessions/2bf50b91-1efd-4a92-bf3b-9a88eba78d2b/payment-instructions"
      },
      "meta": {
        "requestId": "0HMVK1P193L37:00000001",
        "timestamp": "2026-05-28T14:06:21.070Z"
      }
    }
    ```

### Lưu ý cho Frontend:
1.  **Chuyển hướng ngay lập tức**: Frontend phải thực hiện redirect trình duyệt sang địa chỉ `checkoutUrl` để người dùng thực hiện giao dịch trên cổng PayOS.
2.  **Định danh Payment**: Trong cấu trúc hiện tại, giá trị `paymentId` được trả về tương đương với `checkoutSessionId`.
3.  **Thuộc tính không dùng**: Thuộc tính `paymentInstructionsUrl` chỉ được giữ lại để tương thích ngược với luồng cũ, **không sử dụng** trong luồng PayOS.
4.  **Giao diện**: Không dựng giao diện nộp ảnh/bank transfer đối với luồng PayOS này.

---

## 4. API: Tra cứu Trạng thái Thanh toán (Get Payment Status)

Sử dụng endpoint này để chủ động kiểm tra trạng thái thanh toán từ Database Backend.

*   **API Path:** `GET /api/v1/billing/payments/{id}`
*   **Authentication:** Yêu cầu Header JWT `Authorization: Bearer <token>`
*   **Tham số `{id}`**: Hỗ trợ truyền vào **`paymentId`** hoặc **`checkoutSessionId`** nhận được từ checkout response.
*   **Response JSON (HTTP 200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "id": "2bf50b91-1efd-4a92-bf3b-9a88eba78d2b",
        "provider": "payos",
        "planKey": "premium_monthly",
        "checkoutSessionId": "2bf50b91-1efd-4a92-bf3b-9a88eba78d2b",
        "purpose": "subscription_plan",
        "description": "Nap goi premium_monthly",
        "amount": 200000.00,
        "currencyCode": "VND",
        "status": "succeeded",
        "paidAt": "2026-05-28T13:46:12.000Z",
        "failedAt": null
      },
      "meta": {
        "requestId": "0HMVK1P193L38:00000002",
        "timestamp": "2026-05-28T14:07:05.120Z"
      }
    }
    ```

### Lưu ý cho Frontend:
*   Gọi API này ngay khi người dùng đáp xuống trang Success/Cancel Page để cập nhật dữ liệu mới nhất.
*   Nếu `status` là `"pending"`, tiếp tục hiển thị trạng thái chờ xử lý (và có thể chạy Polling).
*   Nếu `status` là `"succeeded"`, hiển thị màn hình chúc mừng thành công và cập nhật lại giao diện Subscription của User.
*   Nếu `status` là `"failed"`, `"cancelled"`, hoặc `"expired"`, hiển thị màn hình thông báo lỗi tương ứng kèm nút hành động mua lại (Retry CTA).

---

## 5. Vòng đời Trạng thái Thanh toán (Payment Status Lifecycle)

Các trạng thái đơn hàng trả về từ Backend gồm:

| Trạng thái | Ý nghĩa | Hành vi đề xuất trên UI |
| :--- | :--- | :--- |
| **`pending`** | Đơn hàng đang chờ thanh toán. | Hiện Spinner/Loading, thông báo *"Hệ thống đang xác nhận giao dịch..."*. Lắng nghe SignalR hoặc chạy Polling lặp lại mỗi 3–5 giây. |
| **`succeeded`** | Đơn hàng đã được thanh toán thành công qua PayOS (và đã được webhook kích hoạt gói cước). | Hiển thị Modal/Màn hình thành công, kích hoạt pháo hoa, gọi API reload Subscription để cập nhật giao diện VIP/Quota. |
| **`failed`** | Đơn hàng gặp lỗi thanh toán từ phía PayOS. | Hiển thị màn hình lỗi chi tiết, cung cấp nút *"Thử lại"* (quay lại bước tạo checkout mới). |
| **`cancelled`** | Người dùng chủ động nhấn hủy giao dịch trên cổng PayOS. | Hiển thị thông báo giao dịch đã bị hủy, đưa người dùng quay lại màn hình chọn gói Subscription. |
| **`expired`** | Phiên thanh toán hết hạn (mặc định sau 30 phút). | Hiển thị thông báo phiên giao dịch hết hạn, yêu cầu người dùng khởi tạo phiên thanh toán mới. |

---

## 6. Quy tắc Xử lý tại Return URL & Cancel URL

### Cách hoạt động của URL Redirect từ PayOS
Khi người dùng kết thúc giao dịch trên PayOS, PayOS sẽ chuyển hướng người dùng về Frontend kèm theo các tham số truy vấn qua URL:
*   **Ví dụ ReturnUrl thành công:** `https://your-app.com/payment/success?code=00&id=f23d880081&cancel=false&status=PAID&orderCode=803347`
*   **Ví dụ CancelUrl hủy bỏ:** `https://your-app.com/payment/cancel?code=00&id=f23d880081&cancel=true&status=CANCELLED&orderCode=803347`

### Quy định xử lý trên Frontend
1.  **Không tin tưởng hoàn toàn vào Query Params**: Các tham số `code=00` hay `status=PAID` trên trình duyệt hoàn toàn có thể bị người dùng chỉnh sửa bằng tay.
2.  **Đường dẫn đề xuất trên Frontend**:
    *   Trang thành công: `/payment/success`
    *   Trang hủy: `/payment/cancel`
3.  **Logic tại trang Success / Cancel**:
    *   Trích xuất tham số `paymentId` hoặc `id` (Payment Link ID của PayOS) từ query string của URL.
    *   Hiển thị màn hình chờ xác thực: *"Đang xác nhận kết quả thanh toán với ngân hàng..."*.
    *   Gọi API `GET /api/v1/billing/payments/{id}` để Backend kiểm tra xem Webhook từ PayOS đã gửi tới và ghi nhận thành công hay chưa.

---

## 7. Sự kiện Realtime thông qua SignalR

Hệ thống sử dụng SignalR để đẩy thông báo cập nhật thanh toán tức thời tới người dùng.

*   **SignalR Hub Endpoint:** `/hubs/notifications`
*   **Authentication:** Truyền JWT token qua tham số query string `access_token`.
*   **Cơ chế Nhóm**: Khi kết nối thành công, Hub sẽ tự động thêm connection của bạn vào nhóm `user:<userId>` dựa trên token đăng nhập.

### Các Sự kiện Cần Lắng Nghe

#### 1. Sự kiện `payment.updated`
Được kích hoạt khi trạng thái thanh toán được cập nhật.
*   **Payload JSON mẫu:**
    ```json
    {
      "paymentId": "2bf50b91-1efd-4a92-bf3b-9a88eba78d2b",
      "orderCode": 75822360000,
      "status": "succeeded", // hoặc "failed"
      "provider": "payos",
      "subscriptionId": "8f67389a-4127-4632-bd92-4f3b8901aa92"
    }
    ```

#### 2. Sự kiện `subscription.activated`
Được kích hoạt ngay sau khi gói Subscription được nâng cấp thành công trên DB.
*   **Payload JSON mẫu:**
    ```json
    {
      "paymentId": "2bf50b91-1efd-4a92-bf3b-9a88eba78d2b",
      "orderCode": 75822360000,
      "status": "succeeded",
      "provider": "payos",
      "subscriptionId": "8f67389a-4127-4632-bd92-4f3b8901aa92"
    }
    ```

### Code mẫu kết nối bằng React/TypeScript
```typescript
import * as signalR from "@microsoft/signalr";
import { useEffect, useState } from "react";

export function usePaymentListener(token: string, currentPaymentId: string, onActivated: () => void) {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);

  useEffect(() => {
    const hubConnection = new signalR.HubConnectionBuilder()
      .withUrl("https://api.interviet.vn/hubs/notifications", {
        accessTokenFactory: () => token,
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    setConnection(hubConnection);
  }, [token]);

  useEffect(() => {
    if (!connection) return;

    connection.start()
      .then(() => {
        console.log("SignalR Connected!");

        // Lắng nghe sự kiện trạng thái thanh toán thay đổi
        connection.on("payment.updated", (payload) => {
          if (payload.paymentId === currentPaymentId) {
            console.log("Trạng thái đơn hàng cập nhật:", payload.status);
            if (payload.status === "failed") {
               // Xử lý khi thanh toán thất bại
            }
          }
        });

        // Lắng nghe sự kiện kích hoạt Subscription thành công
        connection.on("subscription.activated", (payload) => {
          if (payload.paymentId === currentPaymentId) {
            console.log("Subscription kích hoạt thành công!");
            onActivated(); // Callback reload giao diện VIP/Quota
          }
        });
      })
      .catch(err => console.error("SignalR Connection Error: ", err));

    return () => {
      connection.off("payment.updated");
      connection.off("subscription.activated");
      connection.stop();
    };
  }, [connection, currentPaymentId, onActivated]);
}
```

---

## 8. Polling Fallback (Cơ chế đối soát dự phòng)

Mặc dù SignalR là cơ chế realtime chính, Frontend vẫn cần cài đặt thêm Polling dự phòng cho trường hợp:
*   Mạng của người dùng yếu, không kết nối được WebSocket/SignalR.
*   Người dùng tắt trình duyệt hoặc tải lại trang trước khi webhook kịp bắn về.
*   Kết nối SignalR bị ngắt đột ngột.

### Quy trình Polling được đề xuất:
1.  Ngay khi đáp xuống trang `/payment/success` và SignalR chưa thông báo trạng thái `succeeded`:
2.  Tiến hành gọi `GET /api/v1/billing/payments/{paymentId}`.
3.  Lặp lại cuộc gọi sau mỗi **3 đến 5 giây**.
4.  **Thời gian tối đa (Timeout)**: Sau khoảng **1 - 2 phút**, nếu trạng thái vẫn là `pending`, ngừng lặp và hiển thị nút hành động cho người dùng kiểm tra lại hoặc liên hệ hỗ trợ.
5.  **Dừng Polling lập tức** khi nhận về trạng thái kết thúc (Terminal states): `succeeded`, `failed`, `cancelled`, hoặc `expired`.

---

## 9. Những điều Frontend TUYỆT ĐỐI KHÔNG được làm

Để tránh các lỗ hổng bảo mật nghiêm trọng trong thanh toán, đội ngũ Frontend phải tuân thủ nghiêm ngặt các quy tắc sau:

*   ❌ **KHÔNG** tự động chuyển trạng thái User thành Premium chỉ dựa vào tham số query trên URL Redirect.
*   ❌ **KHÔNG** tự ý gọi trực tiếp Webhook của Backend từ phía Client Browser.
*   ❌ **KHÔNG** gửi số tiền thanh toán (`amount`) từ Frontend lên Backend khi tạo Checkout. Backend sẽ tự động lấy thông tin giá tiền thực tế của gói cước trong DB để gửi sang PayOS.
*   ❌ **KHÔNG** sử dụng `paymentInstructionsUrl` hoặc vẽ UI hướng dẫn chuyển khoản mock cho luồng PayOS.
*   ❌ **KHÔNG** được tích hợp SDK PayOS hoặc nhúng `ApiKey`, `ChecksumKey` bên dưới mã nguồn Frontend. Toàn bộ các khóa bí mật của PayOS chỉ nằm ở Backend an toàn.
*   ❌ **KHÔNG** gọi trực tiếp các API của PayOS từ phía Frontend (mọi hoạt động giao tiếp với PayOS phải đi qua Backend).

---

## 10. Cấu hình Môi trường Frontend

Frontend chỉ cần lưu trữ duy nhất địa chỉ gốc của Backend API:

```bash
# Biến môi trường Frontend
VITE_API_BASE_URL=https://api.interviet.vn
```

> [!IMPORTANT]
> Frontend **không cần** lưu trữ bất kỳ thông tin nào liên quan đến ClientId, ApiKey, hay ChecksumKey của PayOS. Tất cả cấu hình bảo mật đó đã được Backend quản lý.

---

## 11. Xử lý Lỗi (Error Handling)

Khi gọi API Backend gặp lỗi, hệ thống sẽ trả về định dạng lỗi chuẩn hóa (Error Envelope). Frontend cần bắt mã lỗi `code` để hiển thị UI phù hợp:

```json
{
  "success": false,
  "error": {
    "code": "Plan.NotFound",
    "message": "Plan not found.",
    "type": "https://api.interviet.vn/errors/plan-notfound"
  },
  "meta": {
    "requestId": "0HMVK1P193L39:00000003",
    "timestamp": "2026-05-28T14:08:12.000Z"
  }
}
```

### Các Mã lỗi Thường gặp:

| Mã lỗi (`code`) | Mô tả | Xử lý giao diện đề xuất |
| :--- | :--- | :--- |
| **`Plan.NotFound`** | Không tìm thấy thông tin gói dịch vụ tương ứng. | Thông báo gói cước không tồn tại, quay lại trang chủ. |
| **`Billing.PayosDisabled`** | Cổng thanh toán PayOS hiện đang bị tắt trong hệ thống. | Thông báo cổng thanh toán đang bảo trì, vui lòng quay lại sau. |
| **`Billing.PayOSError`** | Lỗi kết nối hoặc lỗi cấu hình khi gọi cổng PayOS. | Thông báo lỗi hệ thống thanh toán, yêu cầu thử lại sau. |
| **`Payment.NotFound`** | Không tìm thấy giao dịch thanh toán. | Báo lỗi giao dịch không hợp lệ. |
| **`CheckoutSession.AlreadyTerminal`** | Session thanh toán đã kết thúc (thành công hoặc thất bại trước đó). | Chặn hành động thay đổi trạng thái, hướng dẫn người dùng tạo thanh toán mới. |
| **`Unauthorized`** | Token JWT hết hạn hoặc không hợp lệ. | Điều hướng người dùng về trang Đăng nhập. |
| **`Forbidden`** | Người dùng truy cập vào phiên thanh toán của tài khoản khác. | Hiển thị màn hình 403 từ chối truy cập. |

---

## 12. Gợi ý Thiết kế UI Trạng thái Thanh toán

### 1. Nút bấm Thanh toán (Checkout Button)
*   Hiển thị icon Loading và vô hiệu hóa nút bấm (`disabled`) ngay khi click để tránh người dùng double-click tạo nhiều phiên thanh toán trùng lặp.

### 2. Màn hình chờ kết quả (Success / Waiting Page)
*   Sử dụng một Spinner lớn kèm thông điệp rõ ràng: *"Đang đợi cổng thanh toán PayOS xác nhận giao dịch..."*.
*   Nếu SignalR nhận được sự kiện thành công $\rightarrow$ Chuyển UI ngay sang trạng thái check xanh kèm nút *"Vào trang chủ/Bắt đầu sử dụng"*.
*   Nếu quá 1.5 phút polling thất bại $\rightarrow$ Đổi thông điệp: *"Chưa nhận được xác nhận từ ngân hàng. Nếu bạn đã bị trừ tiền, vui lòng bấm nút kiểm tra lại hoặc liên hệ hỗ trợ"*.

### 3. Trang hiển thị gói dịch vụ (Subscription Page)
*   Sau khi nhận tín hiệu thành công, reload lại gói cước để cập nhật:
    *   Hạn sử dụng gói mới.
    *   Hạn ngạch (Quota) lượt CV review, AI interview, v.v.
    *   Hiển thị Badge VIP/Premium trên avatar người dùng.

---

## 13. Đoạn Mã Giả (Pseudocode) Luồng Frontend

Dưới đây là mã giả minh họa luồng xử lý hoàn chỉnh của Frontend từ khi tạo checkout đến khi nhận kết quả:

```typescript
// 1. Khởi tạo checkout và redirect sang PayOS
async function startPayment(planId: string) {
    showLoadingSpinner();
    try {
        const response = await api.post("/api/v1/billing/checkout", {
            planId: planId,
            provider: "payos"
        });
        const { checkoutUrl, paymentId } = response.data.data;
        
        // Điều hướng sang cổng PayOS
        window.location.href = checkoutUrl;
    } catch (error) {
        showErrorToast(error.response.data.error.message);
        hideLoadingSpinner();
    }
}

// 2. Xử lý tại trang kết quả (Success/Waiting Page)
async function handlePaymentResultPage(paymentId: string) {
    showProcessingUI();

    // Thiết lập kết nối SignalR Hub
    const signalRConnection = connectSignalRHub();
    
    // Đăng ký lắng nghe sự kiện
    signalRConnection.on("subscription.activated", (payload) => {
        if (payload.paymentId === paymentId) {
            signalRConnection.stop();
            showSuccessUI();
            updateUserProfileAndQuota();
        }
    });

    // Chạy cơ chế Polling dự phòng
    let attempt = 0;
    const interval = setInterval(async () => {
        attempt++;
        if (attempt > 20) { // Quá 100 giây -> dừng polling
            clearInterval(interval);
            showTimeoutOrManualCheckUI();
            return;
        }

        try {
            const response = await api.get(`/api/v1/billing/payments/${paymentId}`);
            const paymentStatus = response.data.data.status;

            if (paymentStatus === "succeeded") {
                clearInterval(interval);
                signalRConnection.stop();
                showSuccessUI();
                updateUserProfileAndQuota();
            } else if (paymentStatus === "failed" || paymentStatus === "cancelled" || paymentStatus === "expired") {
                clearInterval(interval);
                signalRConnection.stop();
                showFailedUI(paymentStatus);
            }
        } catch (err) {
            console.error("Lỗi polling:", err);
        }
    }, 5000); // Polling mỗi 5 giây
}
```

---

## 14. Danh sách Kiểm thử (Swagger / Manual Verification Checklist)

Các lập trình viên Frontend có thể tự kiểm tra tích hợp theo các bước sau:

1.  **Đăng nhập**: Lấy Token JWT hợp lệ từ API auth.
2.  **Lấy danh sách gói**: Gọi `GET /api/v1/plans` để lấy ID gói Premium.
3.  **Tạo link thanh toán**: Gọi `POST /api/v1/billing/checkout` với `planId` vừa lấy. Xác nhận nhận được `checkoutUrl` hợp lệ.
4.  **Mở cổng thanh toán**: Dán `checkoutUrl` vào trình duyệt và xác nhận trang thanh toán PayOS hiện ra chính xác.
5.  **Thanh toán sandbox**: Thực hiện thanh toán thử nghiệm bằng tài khoản test (nhập mã OTP test là `123456`).
6.  **Trở về trang kết quả**: Sau khi hoàn thành, PayOS tự chuyển về `returnUrl` kèm các tham số query chính xác.
7.  **Kiểm tra giao dịch**: Gọi `GET /api/v1/billing/payments/{paymentId}` từ Swagger và kiểm tra trạng thái trả về là `"status": "succeeded"`.
8.  **Xác minh SignalR**: Mở tab Network trên Chrome để xem kết nối WebSocket SignalR nhận được event `subscription.activated` đầy đủ payload.
9.  **Kiểm tra gói cước**: Gọi `GET /api/v1/subscription` và kiểm tra xem tài khoản đã được nâng cấp chính xác hay chưa.
10. **Test luồng hủy bỏ**: Tạo checkout mới, nhấn nút hủy thanh toán trên cổng PayOS và kiểm tra xem URL redirect về có đúng `cancelUrl` đã khai báo không.

---

## 15. Các thuộc tính và API đã lỗi thời (Deprecated Notes)

*   ⚠️ **`paymentInstructionsUrl`**: Trả về link hướng dẫn nạp tiền thủ công. Thuộc tính này đã bị **bỏ và đánh dấu lỗi thời (deprecated)** đối với luồng PayOS. Tuyệt đối không gọi hay dùng thuộc tính này để xây dựng giao diện chuyển khoản thủ công.
*   ⚠️ **Chế độ Mock Billing**: Chế độ thanh toán mô phỏng chuyển khoản thủ công (mock bank transfer) sẽ tự động bị tắt trên Staging và Production bằng cấu hình `Billing__MockPaymentsEnabled=false` ở phía Backend. Giao diện Frontend chỉ tích hợp và hiển thị duy nhất nút thanh toán qua cổng PayOS thật.

---

## 16. Cấu hình Backend tham khảo cho Frontend

Đây là các cấu hình phía Backend (đọc để nắm thông tin, **không nhúng** vào mã nguồn Frontend):
*   `PayOS__ClientId`: ID tài khoản tích hợp PayOS.
*   `PayOS__ApiKey`: Khóa kết nối API PayOS.
*   `PayOS__ChecksumKey`: Khóa tạo và kiểm tra chữ ký mã hóa PayOS.
*   `PayOS__WebhookUrl`: Địa chỉ Backend nhận tin báo từ PayOS.
*   `PayOS__Enabled`: Bật (`true`) / Tắt (`false`) thanh toán PayOS.
*   `PaymentRedirect__ReturnUrl`: Đường dẫn redirect mặc định về trang thành công của Frontend.
*   `PaymentRedirect__CancelUrl`: Đường dẫn redirect mặc định về trang hủy thanh toán của Frontend.
*   `Billing__MockPaymentsEnabled`: Đặt thành `false` ở production để chặn toàn bộ luồng mock cũ.

---

## 17. Câu hỏi thường gặp & Xác nhận (Q&A)

*   **Q: Cấu trúc request body tối thiểu khi checkout là gì?**
    *   *A: Chỉ cần gửi `{ "planId": "<guid>" }` (hoặc `{ "planKey": "<code-gói>" }`) kèm Header Bearer token.*
*   **Q: Các giá trị status thanh toán thực tế trả về từ backend là gì?**
    *   *A: Bao gồm: `pending` (đang chờ), `succeeded` (thành công), `failed` (lỗi), `cancelled` (hủy), và `expired` (hết hạn).*
*   **Q: Đường dẫn route nào trên Frontend được khuyên dùng để cấu hình redirect?**
    *   *A: Nên dùng `/payment/success?paymentId={paymentId}` cho ReturnUrl và `/payment/cancel?paymentId={paymentId}` cho CancelUrl để dễ dàng trích xuất định danh giao dịch.*
*   **Q: `paymentId` có luôn bằng `checkoutSessionId` không?**
    *   *A: Đúng. Trong hệ thống hiện tại, cả hai thuộc tính này đại diện cho cùng một định danh phiên giao dịch và trả về cùng một giá trị Guid.*
