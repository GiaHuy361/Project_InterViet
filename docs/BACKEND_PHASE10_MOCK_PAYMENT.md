# BACKEND_PHASE10_MOCK_PAYMENT.md

## Tổng quan

Phase 10 triển khai **Mock Payment Gateway** cho INTER-VIET backend.  
**Không có tiền thật** — toàn bộ là mô phỏng dành cho dev/staging.

---

## Nguyên tắc quan trọng

| Điều kiện | Giá trị |
|-----------|---------|
| Tiền thật? | ❌ Không |
| Provider thật? | ❌ Không — chỉ là label (vnpay / momo / stripe / payos) |
| Subscription thật? | ✅ Có — `simulate-success` kích hoạt subscription thật |
| Email thật? | 🔁 Fire-and-forget — gửi nếu SMTP config, LogOnly nếu không |
| Dev-activate flow? | ✅ Giữ nguyên, không đổi |

---

## Happy Path Flow

```
1. POST /api/v1/billing/checkout
   Body: { planKey: "monthly", provider: "vnpay" }
   → Tạo BillingCheckoutSession (status=pending)
   → Trả về checkoutUrl: "{frontendBaseUrl}/subscription/mock-checkout?checkoutSessionId={id}"

2. [Frontend hiển thị trang mock-checkout]

3. POST /api/v1/billing/checkout-sessions/{id}/simulate-success
   → Session: pending → succeeded
   → Tạo PaymentTransaction (status=succeeded)
   → Tạo Invoice (status=paid, số IVT-yyyyMMdd-0001)
   → Activate / nâng cấp Subscription
   → Gửi email xác nhận (fire-and-forget)
   → Trả về: { checkoutSessionId, paymentTransactionId, invoiceId, invoiceNumber, subscriptionId, emailSent }

4. [Frontend refetch: /subscription, /quota, /billing/invoices, /billing/payments]
```

---

## Endpoints

```
GET  /api/v1/billing/providers
POST /api/v1/billing/checkout
GET  /api/v1/billing/checkout-sessions/{id}
POST /api/v1/billing/checkout-sessions/{id}/simulate-success
POST /api/v1/billing/checkout-sessions/{id}/simulate-failed
POST /api/v1/billing/checkout-sessions/{id}/simulate-cancelled
GET  /api/v1/billing/invoices?page=1&pageSize=20
GET  /api/v1/billing/payments?page=1&pageSize=20
```

Tất cả endpoints đều yêu cầu `[Authorize]`.

---

## Phase 10B: Mock Checkout Experience (QR & Bank Transfer)

Nâng cấp trải nghiệm thanh toán mô phỏng chuyển khoản thủ công và quét mã QR Code động.

### Flow nâng cấp Happy Path:
```
1. POST /api/v1/billing/checkout
   → Trả về CheckoutResponse có thêm `paymentInstructionsUrl`

2. GET /api/v1/billing/checkout-sessions/{id}/payment-instructions
   → Nhận thông tin tài khoản Merchant Mock, số tiền, và mã QR dạng Base64 (sinh offline qua QRCoder)
   → Nội dung chuyển khoản yêu cầu dạng: IVT {yyyyMMdd} {first 6 chars of sessionId}

3. POST /api/v1/billing/checkout-sessions/{id}/submit-bank-transfer
   Body: { payerAccountNumber, payerAccountName, amountPaid, transferContent }
   → Validate số tiền (khớp 100%) và nội dung chuyển khoản (trim + case-insensitive)
   → Nếu Sai: Lưu nỗ lực dạng `rejected` và trả về 400 Bad Request
   → Nếu Đúng: Lưu nỗ lực dạng `accepted`, đổi trạng thái session sang `succeeded`, nâng cấp Subscription, xuất Hóa đơn (Paid) và gửi Email receipt.
   → Số tài khoản người chuyển sẽ được ẩn (masked) an toàn dưới dạng `******7890` trước khi lưu vào DB.

4. GET /api/v1/billing/checkout-sessions/{id}/attempts
   → Trả về lịch sử nỗ lực xác thực giao dịch chuyển khoản cho checkout session cụ thể.
```

### Endpoints bổ sung (Phase 10B):
```
GET  /api/v1/billing/checkout-sessions/{id}/payment-instructions
POST /api/v1/billing/checkout-sessions/{id}/submit-bank-transfer
GET  /api/v1/billing/checkout-sessions/{id}/attempts
```

---

## Simulate States

| Action | Hiệu ứng |
|--------|----------|
| `simulate-success` | Kích hoạt subscription, tạo invoice & payment |
| `simulate-failed` | Không đổi subscription, chỉ đánh dấu session failed |
| `simulate-cancelled` | Không đổi subscription, chỉ đánh dấu session cancelled |

**Idempotency**: gọi lại cùng simulate khi đã ở trạng thái đó → trả về `isIdempotent: true`.

---

## Database Tables mới

- `BillingCheckoutSessions` — lưu checkout sessions
- `BillingPaymentAttempts` — lưu lịch sử nỗ lực xác minh chuyển khoản ngân hàng của user (Phase 10B)

**Cột mới trên tables cũ:**
- `PaymentTransactions`: thêm `PlanKey`, `CheckoutSessionId`
- `Invoices`: thêm `PlanKey`, `CheckoutSessionId`, `PlanId`

---

## Invoice Number Format

`IVT-{yyyyMMdd}-{seq:D4}`  
Ví dụ: `IVT-20260520-0001`, `IVT-20260520-0002`

---

## Config (appsettings.json)

```json
"Billing": {
  "EnableDevSubscriptionActivation": false,
  "MockPaymentsEnabled": true,
  "MockCheckoutTtlMinutes": 30,
  "FrontendBaseUrl": "http://localhost:3000",
  "MockMerchant": {
    "MerchantName": "INTER-VIET",
    "BankName": "INTER-VIET Mock Bank",
    "BankCode": "IVB",
    "AccountNumber": "9704000000012345",
    "AccountName": "CONG TY TNHH INTER VIET"
  }
}
```

---

## Frontend sau simulate-success / submit-bank-transfer thành công cần refetch

```
GET /api/v1/subscription
GET /api/v1/billing/invoices
GET /api/v1/billing/payments
GET /api/v1/quota (nếu có)
```
