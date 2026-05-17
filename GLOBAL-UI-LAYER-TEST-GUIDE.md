# ✅ GLOBAL UI LAYER SYSTEM - TEST GUIDE

## Cách test nhanh (6 bước):

### 1️⃣ Header - Notification Dropdown
**Kiểm tra:**
- ✅ Click chuông → dropdown mở ngay lập tức
- ✅ Click ra ngoài dropdown → đóng
- ✅ Nhấn ESC → đóng
- ✅ Badge hiển thị đúng số thông báo chưa đọc (>99 hiển thị "99+")
- ✅ Pulse animation trên badge khi có thông báo chưa đọc
- ✅ Click "Đánh dấu tất cả là đã đọc" → badge biến mất, toast hiển thị
- ✅ Click notification → navigate đúng trang, mark là đã đọc
- ✅ Tab "Tất cả" / "Chưa đọc" hoạt động

**Event tracking:**
- `notification_open`
- `notification_mark_all_read`

---

### 2️⃣ Header - Account Dropdown
**Kiểm tra:**
- ✅ Click avatar → dropdown mở với thông tin user động:
  - Tên user (NOT hardcoded)
  - Email
  - Plan badge (Miễn phí/Dùng thử/Premium/Hết hạn)
- ✅ Click ra ngoài → đóng
- ✅ Nhấn ESC → đóng
- ✅ Menu items navigate đúng:
  - Hồ sơ → `/cai-dat`
  - Cài đặt → `/cai-dat`
  - Gói dịch vụ → `/goi-dich-vu`
- ✅ Đăng xuất → hiển thị modal confirmation
- ✅ Confirm logout:
  - Clear auth state
  - Clear notifications
  - Navigate to `/dang-nhap` (SPA only, NO reload)
  - Toast "Đã đăng xuất"

**Event tracking:**
- `logout`

---

### 3️⃣ Interview Live - Sticky Bottom Action Bar
**Kiểm tra tại `/phong-van-live`:**
- ✅ Sticky bottom bar luôn hiển thị (không bị overflow:hidden)
- ✅ 2 buttons rõ ràng, lớn (min-height: 56px):
  1. **"Thoát phỏng vấn"** (outline/danger, icon exit)
  2. **"Kết thúc & tạo báo cáo ngay"** (solid primary, icon sparkle)
- ✅ Helper text: "Demo nhanh — tạo báo cáo trong 2–3 giây"
- ✅ z-index cao hơn transcript

**Exit modal:**
- Title: "Thoát phỏng vấn?"
- Text: "Phiên phỏng vấn đang diễn ra sẽ kết thúc."
- Buttons: "Tiếp tục" / "Thoát"
- Confirm → navigate(`/phong-van-setup`), toast "Đã thoát buổi phỏng vấn"
- Track: `interview_end`

**Instant report modal:**
- Title: "Báo cáo tức thì?"
- Text: "Hệ thống sẽ tạo báo cáo dựa trên phần trao đổi hiện tại."
- Buttons: "Tiếp tục" / "Nhận báo cáo"
- Confirm → processing screen 2–3s:
  - "Đang phân tích nội dung…"
  - "Đang đánh giá kỹ năng…"
  - "Đang tổng hợp nhận xét…"
- Navigate(`/bao-cao`), toast "Báo cáo đã sẵn sàng"
- Track: `interview_end`, `report_view`

**Timer KHÔNG block generation**

---

### 4️⃣ Interview Setup - Model AI Dropdown
**Kiểm tra tại `/phong-van-setup`:**
- ✅ Section "Model AI" hiển thị là 1 dropdown (KHÔNG phải list dài)
- ✅ Helper text: "Chọn mô hình để cân bằng tốc độ và chất lượng phản hồi."
- ✅ Closed state hiển thị: Selected model + badge (Miễn phí/Premium)
- ✅ Opened state có 2 groups:
  - **Miễn phí:** GPT-4o mini, GPT-3.5 Turbo
  - **Premium:** GPT-4o, GPT-4o Realtime, Claude 3 Opus, Gemini 1.5 Pro, Mixtral 8x7B

**Free user logic:**
- ✅ Chỉ chọn được free models
- ✅ Premium models hiển thị lock + "Premium" badge
- ✅ Click locked model → upgrade modal (KHÔNG change selection)

**Premium/Trial user:**
- ✅ Chọn được tất cả models

**Persistence:**
- ✅ localStorage key: `interviet_selected_model`
- ✅ Sync global state
- ✅ Summary hiển thị: "Model đã chọn: …"
- ✅ Pass to `/phong-van-live` header: "Model: …"

---

### 5️⃣ Upgrade - MUST Stay Inside App
**Kiểm tra tất cả upgrade CTAs:**
- `/goi-dich-vu`
- `/bang-gia`
- Upgrade modal
- Banner "Nâng cấp ngay"

**Rules:**
- ❌ NO external href
- ❌ NO window.location
- ✅ USE navigate(`/thanh-toan`) hoặc navigate(`/goi-dich-vu`)
- ✅ SPA state intact

**Event tracking:**
- `upgrade_open`
- `upgrade_success`

---

### 6️⃣ Trial 7 ngày - NO Session Reset
**Kiểm tra khi click "Dùng thử 7 ngày miễn phí":**

**KHÔNG làm:**
- ❌ Clear auth
- ❌ Reload page
- ❌ Navigate to `/dang-nhap`

**CHỈ làm:**
- ✅ user.plan = "Trial"
- ✅ trialStartDate = now
- ✅ trialDaysLeft = 7
- ✅ trialActive = true
- ✅ Persist to localStorage

**Ngay lập tức:**
- ✅ Toast: "Bắt đầu dùng thử Premium 7 ngày!"
- ✅ Top badge đổi thành "Dùng thử"
- ✅ Unlock premium AI models
- ✅ Unlock premium interview modes
- ✅ KHÔNG navigate, KHÔNG reload

**Chỉ navigate `/thanh-toan` nếu:**
- User click "Nâng cấp ngay" (upgrade to paid Premium)

---

## ✨ Technical Implementation

### Portal System
- ✅ `<div id="ui-layer" />` at root App level
- ✅ All dropdowns render via `createPortal(content, uiLayer)`
- ✅ #ui-layer: `position: relative; z-index: 9999`
- ✅ Dropdown panels: `position: fixed; z-index: 9999; pointer-events: auto`
- ✅ NO overflow:hidden parent containers

### Dropdown Management
- ✅ Only one dropdown open at a time
- ✅ Click outside closes
- ✅ ESC key closes
- ✅ 200-300ms fade + slide animation
- ✅ Calculate position dynamically based on trigger rect

### Z-Index Hierarchy
- Header: z-index 10000 (higher than ui-layer)
- UI Layer: z-index 9999
- Dropdowns/Modals inside UI Layer: z-index 9999
- Sticky Bottom Bar: z-index 50

---

## 🎯 Success Criteria

Tất cả 6 điểm test phải PASS:
1. ✅ Notification dropdown hoạt động với Portal
2. ✅ Account dropdown hoạt động với Portal  
3. ✅ Interview Live có sticky bottom bar rõ ràng
4. ✅ Interview Setup có Model AI dropdown
5. ✅ Upgrade CTAs stay inside app
6. ✅ Trial 7 ngày KHÔNG reset session

---

**🚀 Implementation Status: COMPLETE**
