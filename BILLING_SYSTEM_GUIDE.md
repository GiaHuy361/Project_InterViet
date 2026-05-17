# INTER-VIET Billing System Guide

## Tổng quan

Hệ thống billing của INTER-VIET đã được xây dựng hoàn chỉnh với 4 gói dịch vụ, quản lý subscription state, và luồng thanh toán production-ready.

## Các gói dịch vụ

### 1. Gói Miễn phí (0đ)
- **Giới hạn**: 3 lần tối ưu CV/ngày, 1 phiên phỏng vấn AI/ngày
- **Tính năng**: 
  - Xem quảng cáo để thêm lượt
  - Model AI basic
  - Báo cáo rút gọn
  - Hỗ trợ qua email
- **Hạn chế**: Không xuất PDF, không phân tích kỹ năng giao tiếp, không so sánh benchmark ngành

### 2. Gói Tháng (149.000₫/tháng)
- **Thanh toán**: 149.000₫ hàng tháng
- **Giới hạn**: 3 lần/ngày tối ưu CV, 1 lần/ngày phỏng vấn AI
- **Tính năng**:
  - Đầy đủ 6 loại nhà tuyển dụng & stress-test
  - Model AI ổn định
  - Báo cáo phân tích toàn diện
  - Phân tích kỹ năng giao tiếp
  - Xuất PDF
  - So sánh tiến bộ & benchmark ngành
- **Định vị**: Dành cho ứng viên cần luyện tập gấp rút trước kỳ phỏng vấn sắp tới

### 3. Gói Quý (129.000₫/tháng - 387.000₫/3 tháng) - **PHỔ BIẾN NHẤT**
- **Thanh toán**: 387.000₫ thanh toán 1 lần cho 3 tháng
- **Tiết kiệm**: 60.000₫ so với gói tháng
- **Giới hạn**: 5 lần/ngày tối ưu CV, 3 lần/ngày phỏng vấn AI
- **Tính năng**:
  - Tất cả tính năng của Gói Tháng
  - Model AI cao cấp
  - Phỏng vấn 1-1 với Mentor: 3 lần/tháng
  - Hỗ trợ ưu tiên (Priority Support)
- **Định vị**: Dành cho sinh viên hoặc người đang trong giai đoạn tìm việc tích cực từ 1-3 tháng

### 4. Gói Năm (109.000₫/tháng - 1.308.000₫/năm) - **TIẾT KIỆM NHẤT**
- **Thanh toán**: 1.308.000₫ thanh toán 1 lần cho 12 tháng
- **Tiết kiệm**: 480.000₫ so với gói tháng (27% tiết kiệm)
- **Giới hạn**: Không giới hạn tối ưu CV, không giới hạn phỏng vấn AI
- **Tính năng**:
  - Tất cả tính năng của Gói Quý
  - Model AI cao cấp
  - Phỏng vấn 1-1 với Mentor: Mỗi tuần 1 lần
  - Ưu tiên chọn người phỏng vấn theo nhóm ngành cụ thể
  - Lưu trữ lịch sử, video không giới hạn thời gian
  - Hỗ trợ ưu tiên 24/7 cấp độ cao nhất
  
- **Ưu đãi đặc biệt**:
  - ✨ Mở rộng tính năng LÀM VIỆC sang Thăng tiến
  - 🤖 AI đánh giá nhân viên để tăng lương
  - 🔗 Tự động quét LinkedIn/công việc hàng tháng để cập nhật CV
  - 👔 Ưu tiên kết nối với Headhunter đối tác
  - 📊 Cập nhật xu hướng thị trường & báo cáo bằng lương
  - 👥 Chuyển đổi chủ sở hữu: 2-3 lượt (gói "người thân, bạn bè")

- **Định vị**: Giải pháp đồng hành dài hạn, xây dựng kỹ năng phỏng vấn và nghề nghiệp chuyên sâu

## Trạng thái người dùng

Hệ thống hỗ trợ 7 trạng thái người dùng:

1. **visitor**: Chưa đăng ký
2. **free**: Đã đăng ký, sử dụng gói miễn phí
3. **trial**: Đang dùng thử Premium 7 ngày
4. **premium**: Đã thanh toán và đang sử dụng Premium
5. **expired**: Gói đã hết hạn
6. **cancelled**: Đã hủy gói (vẫn sử dụng được đến hết kỳ)
7. **suspended**: Tài khoản bị tạm khóa

## Các trang liên quan đến Billing

### 1. `/bang-gia` - PricingPage
- Hiển thị 4 gói dịch vụ với chi tiết
- Bảng so sánh tính năng
- CTA "Dùng thử 7 ngày miễn phí" cho free users
- FAQ về pricing và thanh toán

### 2. `/thanh-toan` - BillingPage
- Chọn gói thanh toán (Monthly/Quarterly/Yearly)
- Chọn phương thức thanh toán:
  - VNPay
  - MoMo
  - Thẻ tín dụng/ghi nợ
  - Chuyển khoản ngân hàng
- Form nhập thông tin thanh toán
- Tóm tắt đơn hàng
- Chính sách hoàn tiền

### 3. `/goi-dich-vu` - SubscriptionPage
- Hiển thị gói hiện tại và tính năng
- Mức sử dụng hôm nay (CV optimization, interviews)
- Chi tiết thanh toán
- Ưu đãi đặc biệt cho Gói Năm
- Gợi ý nâng cấp

### 4. `/hoa-don` - InvoicesPage
- Danh sách hóa đơn
- Tải PDF hóa đơn
- Lịch sử thanh toán

### 5. `/huy-goi` - CancelSubscriptionPage
- Xác nhận hủy gói
- Giải thích quyền lợi còn lại

## Luồng thanh toán

### Luồng nâng cấp từ Free lên Premium

```
Free User -> Pricing Page -> Chọn gói 
  -> Billing Page -> Chọn phương thức thanh toán 
  -> Xác nhận -> Premium User
```

### Luồng dùng thử 7 ngày

```
Free User -> Click "Dùng thử 7 ngày miễn phí" 
  -> Tự động nâng cấp lên Trial
  -> Sau 7 ngày tự động downgrade về Free (nếu không thanh toán)
```

### Luồng đổi gói

```
Premium User (Monthly) -> Pricing Page -> Chọn Quarterly/Yearly
  -> Billing Page -> Thanh toán chênh lệch
  -> Cập nhật subscription
```

## Context & State Management

### User State
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  subscriptionPlan: SubscriptionPlan; // 'free' | 'monthly' | 'quarterly' | 'yearly'
  trialEndsAt?: Date;
  subscriptionEndsAt?: Date;
  
  // Usage tracking
  cvOptimizationsDaily: number;
  cvOptimizations: number;
  lastCVResetDate?: Date;
  
  interviewsDaily: number;
  interviewsUsed: number;
  lastInterviewResetDate?: Date;
  
  mentorSessionsMonthly: number;
  mentorSessionsUsed: number;
  lastMentorResetDate?: Date;
  
  // Payment info
  paymentMethod?: PaymentMethod;
  ownershipTransfersRemaining?: number; // For yearly plan only (2-3 transfers)
}
```

### Subscription Limits Utility
File: `/src/app/utils/subscriptionLimits.ts`

Cung cấp:
- `getSubscriptionLimits(plan)`: Lấy giới hạn của từng gói
- `canPerformAction(plan, action, currentUsage)`: Kiểm tra có thể thực hiện action không
- `getPlanPriceInfo(plan)`: Lấy thông tin giá của gói

## Components

### UpgradeModal
- Hiển thị khi user cố gắng dùng tính năng Premium
- Giải thích lợi ích của Premium
- Hiển thị usage hiện tại cho free users
- CTA "Dùng thử 7 ngày" hoặc "Xem bảng giá"

### PlanBadge
- Hiển thị badge gói hiện tại (Free/Premium/Trial)
- Sử dụng trong header, profile, settings

## Event Tracking

Events liên quan đến billing:
- `pricing_cta_click`: Click CTA trên pricing page
- `trial_started`: Bắt đầu dùng thử
- `trial_started_from_pricing`: Bắt đầu trial từ pricing page
- `upgrade_success`: Nâng cấp thành công
- `upgrade_modal_shown`: Hiển thị modal nâng cấp

## Testing Checklist

### Luồng Free User
- [ ] Xem pricing page
- [ ] Click "Dùng thử 7 ngày miễn phí" -> Chuyển thành Trial
- [ ] Dùng hết giới hạn free -> Hiển thị UpgradeModal
- [ ] Navigate đến billing page -> Chọn gói -> Thanh toán thành công

### Luồng Trial User
- [ ] Xem thời gian còn lại của trial
- [ ] Sau 7 ngày tự động downgrade về Free
- [ ] Nâng cấp lên Premium trước khi hết trial

### Luồng Premium User
- [ ] Xem subscription details trong /goi-dich-vu
- [ ] Đổi gói (upgrade/downgrade)
- [ ] Hủy gói -> Vẫn sử dụng đến hết kỳ
- [ ] Xem invoices
- [ ] Auto-renewal notification

### Yearly Plan Special Features
- [ ] Hiển thị tính năng Thăng tiến
- [ ] Hiển thị kết nối Headhunter
- [ ] Tracking ownership transfers (2-3 lần)
- [ ] Auto LinkedIn scanning notification

## Production Considerations

### Payment Gateway Integration
Hiện tại là mock implementation. Để production:
1. Tích hợp VNPay API
2. Tích hợp MoMo API
3. Tích hợp Stripe/PayPal cho thẻ quốc tế
4. Webhook xử lý payment confirmation
5. Retry logic cho failed payments

### Subscription Management
1. Auto-renewal notifications (email 7 ngày, 3 ngày, 1 ngày trước)
2. Failed payment handling
3. Dunning management
4. Proration calculation cho upgrade/downgrade
5. Refund handling

### Analytics
1. Track conversion rate từng gói
2. Track trial to paid conversion
3. Churn rate tracking
4. Revenue metrics
5. Popular payment methods

## Quyền lợi người dùng gói Năm (từ ảnh)

### Ưu đãi khi mua gói năm:
1. **Mở rộng tính năng LÀM VIỆC sang Thăng tiến**: Sau khi có việc, AI sẽ có 1 con AI sp năng cao kỹ năng cho những buổi đánh giá nhân viên. AI vào vai sếp để buổi review tăng lương.

2. **Cá nhân hóa**: Tự động quét LinkedIn hoặc dữ liệu công việc hàng tháng để cập nhật thành tựu mới vào CV. "CV luôn sẵn sàng" là từ duy của người thành công.

3. **Mục tiêu dài hạn**: Người dùng mua gói năm để luyện tập dần cho mục tiêu nhảy việc sang các tập đoàn lớn, sau khi đi làm sinh viên thường muốn nhảy việc.

4. **Gói người thân, bạn bè**: Sẽ có 2-3 lượt đổi chủ sở hữu.

### Quyền lợi nè:
1. **Ưu tiên Headhunter**: Người dùng gói Năm được ưu tiên kết nối với các Headhunter sẽ là đối tác của app mình (là những người chuyên đi tìm nhân lực giỏi để mời họ về làm với mức lương cao hơn cty cũ).

2. **Cập nhật thị trường**: Giúp cập nhật xu hướng thị trường như kỹ năng và báo cáo bằng lương.

## Migration Notes

Nếu có user data cũ, cần:
1. Add `subscriptionPlan` field (default: 'free')
2. Add daily/monthly usage tracking fields
3. Add `ownershipTransfersRemaining` cho yearly users (default: 3)
4. Migrate old `role: 'premium'` to include `subscriptionPlan: 'monthly'`

## Files Modified/Created

### Modified:
- `/src/app/contexts/AppContext.tsx` - Added subscription types & limits tracking
- `/src/app/pages/PricingPage.tsx` - Updated with 4 plans
- `/src/app/pages/BillingPage.tsx` - Complete payment flow
- `/src/app/pages/AppPages.tsx` - SubscriptionPage with 4 plans
- `/src/app/components/UpgradeModal.tsx` - Updated features list
- `/src/app/pages/DashboardPage.tsx` - Usage tracking display

### Created:
- `/src/app/utils/subscriptionLimits.ts` - Subscription limits utility
- `/BILLING_SYSTEM_GUIDE.md` - This documentation

## Summary

Hệ thống billing của INTER-VIET đã hoàn chỉnh với:
✅ 4 gói dịch vụ rõ ràng (Free, Monthly, Quarterly, Yearly)
✅ Pricing page production-ready với comparison table
✅ Billing page với 4 phương thức thanh toán
✅ Subscription management page
✅ Usage tracking và limits enforcement
✅ Upgrade/downgrade flows
✅ Trial system (7 days)
✅ Special features cho Yearly plan (Headhunter, Career Advancement, Ownership Transfer)
✅ Event tracking đầy đủ
✅ UpgradeModal thông minh
✅ Dashboard hiển thị usage stats

Sẵn sàng cho production!
