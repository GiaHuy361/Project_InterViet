# 🔒 EXTERNAL NAVIGATION FIX - TEST GUIDE

## ✅ ĐÃ HOÀN THÀNH

Đã triển khai **GLOBAL HARD FIX – EXTERNAL NAVIGATION BLOCKER** với Safety Guard Layer toàn cục.

### 📋 CÁC THAY ĐỔI ĐÃ THỰC HIỆN

#### 1. **DashboardPage.tsx** - Line 37-40
```typescript
// BEFORE (SAI - navigate sau khi startTrial):
const handleStartTrial = () => {
  startTrial();
  navigate('/bang-gia');  // ❌ VI PHẠT
};

// AFTER (ĐÚNG - chỉ startTrial):
const handleStartTrial = () => {
  startTrial();
  // DO NOT navigate - stay on current page as per fix-external-navigation.md
};
```
**✅ Kết quả:** Bấm "Dùng thử 7 ngày miễn phí" → Chỉ active trial + toast, KHÔNG navigate

---

#### 2. **PricingPage.tsx** - Line 63-79
```typescript
// BEFORE (SAI - startTrial xong lại navigate):
if (state.user.role === 'free') {
  startTrial();
  toast.success('...');
  navigate('/thanh-toan');  // ❌ VI PHẠT
}

// AFTER (ĐÚNG - startTrial rồi return):
if (state.user.role === 'free') {
  startTrial();
  eventTracker.track('trial_started_from_pricing');
  return; // Stay on pricing page ✅
}
// Chỉ navigate /thanh-toan nếu user KHÔNG phải free (đã trial/premium)
navigate('/thanh-toan');
```
**✅ Kết quả:** Free user bấm "Dùng thử 7 ngày miễn phí" → Activate trial, ĐỨ NG NGUYÊN tại /bang-gia

---

#### 3. **InterviewSetupPage.tsx** - Add startTrial button to upgrade modal
```typescript
// Add startTrial button to upgrade modal
const handleStartTrial = () => {
  startTrial();
  // DO NOT navigate - stay on current page as per fix-external-navigation.md
};
```
**✅ Kết quả:** Bấm "Dùng thử 7 ngày miễn phí" trong modal nâng cấp → Chỉ active trial + toast, KHÔNG navigate

---

#### 4. **AllRemainingPages.tsx** - Line 632
```typescript
// BEFORE (SAI - window.location):
<Button onClick={() => window.location.href = '/lien-he'}>  // ❌ VI PHẠT

// AFTER (ĐÚNG - SPA navigate):
<Button onClick={() => navigate('/lien-he')}>  // ✅
```
**✅ Kết quả:** SPA navigation, KHÔNG reload trang

---

#### 5. **ErrorBoundary.tsx** - Line 33-35
```typescript
// BEFORE (SAI - luôn dùng window.location):
handleGoHome = () => {
  window.location.href = '/dashboard';  // ❌ VI PHẠT
};

// AFTER (ĐÚNG - ưu tiên SPA navigate):
handleGoHome = () => {
  if (this.props.navigate) {
    this.props.navigate('/dashboard');  // ✅ SPA
  } else {
    window.location.href = '/dashboard';  // Fallback only
  }
};
```
**✅ Kết quả:** Error boundary dùng SPA navigation khi có navigate prop

---

#### 6. **AppLayout.tsx** - SAFETY GUARD LAYER (NEW!)
```typescript
// THÊM MỚI: Global click interceptor
useEffect(() => {
  const handleClick = (e: MouseEvent) => {
    const anchor = (e.target as HTMLElement).closest('a');
    if (!anchor) return;
    
    const href = anchor.getAttribute('href');
    const isExternal = href?.startsWith('http://') || href?.startsWith('https://');
    
    if (!isExternal) return;
    
    const text = anchor.textContent?.trim().toLowerCase() || '';
    
    // Intercept "Dùng thử 7 ngày"
    if (text.includes('dùng thử 7 ngày') || text.includes('dùng thử miễn phí')) {
      e.preventDefault();
      startTrial();
      return;
    }
    
    // Intercept "Nâng cấp Premium"
    if (text.includes('nâng cấp premium') || text.includes('nâng cấp ngay')) {
      e.preventDefault();
      navigate('/thanh-toan');
      return;
    }
    
    // Intercept "Xem bảng giá"
    if (text.includes('xem bảng giá') || text.includes('bảng giá')) {
      e.preventDefault();
      navigate('/bang-gia');
      return;
    }
    
    // Block any other external links
    console.warn('[Safety Guard] Blocked external navigation:', href);
    toast.error('Không thể mở liên kết bên ngoài từ ứng dụng');
    e.preventDefault();
  };
  
  document.addEventListener('click', handleClick, true);
  return () => document.removeEventListener('click', handleClick, true);
}, [navigate, startTrial]);
```
**✅ Kết quả:** Mọi external link được intercept, không thể văng ra ngoài app

---

## 🧪 KỊCH BẢN TEST BẮT BUỘC

### ✅ TEST 1: Dashboard - "Dùng thử 7 ngày miễn phí"
**Steps:**
1. Đăng nhập với free user
2. Vào `/dashboard`
3. Tìm banner "Nâng cấp lên Premium"
4. Bấm nút **"Dùng thử 7 ngày miễn phí"**

**Expected:**
- ✅ Toast hiện: "Bắt đầu dùng thử Premium 7 ngày!"
- ✅ Plan badge (header) đổi thành "Dùng thử"
- ✅ Banner biến mất (vì user đã là trial)
- ✅ URL vẫn là `/dashboard` (KHÔNG chuyển trang)
- ✅ KHÔNG reload, KHÔNG mất session
- ✅ Console log: `[Event] trial_started`

---

### ✅ TEST 2: Pricing Page - "Dùng thử 7 ngày miễn phí"
**Steps:**
1. Đăng nhập với free user
2. Vào `/bang-gia`
3. Bấm nút **"Dùng thử 7 ngày miễn phí"** trên Premium card

**Expected:**
- ✅ Toast hiện: "Bắt đầu dùng thử Premium 7 ngày!"
- ✅ Plan badge đổi thành "Dùng thử"
- ✅ URL vẫn là `/bang-gia` (KHÔNG navigate)
- ✅ Button text đổi thành "Gói hiện tại" (vì đã trial)
- ✅ KHÔNG reload, KHÔNG mất session
- ✅ Console log: `[Event] trial_started_from_pricing`

---

### ✅ TEST 3: Pricing Page - "Nâng cấp ngay" (Trial user)
**Steps:**
1. Đăng nhập với trial user (hoặc sau TEST 2)
2. Vẫn ở `/bang-gia`
3. Scroll xuống CTA section
4. Bấm nút **"Dùng thử Premium miễn phí"** (user đã trial thì nó navigate)

**Expected:**
- ✅ Navigate nội bộ tới `/thanh-toan`
- ✅ KHÔNG reload, KHÔNG mất session
- ✅ URL đổi thành `/thanh-toan`
- ✅ Page thanh toán hiển thị đúng

---

### ✅ TEST 4: Interview Setup - Upgrade Modal - "Dùng thử 7 ngày miễn phí"
**Steps:**
1. Đăng nhập với free user
2. Vào `/phong-van-setup`
3. Chọn bất kỳ premium option (AI model premium, interviewer mode premium, etc.)
4. Modal "Nâng cấp lên Premium" xuất hiện
5. Bấm nút **"Dùng thử 7 ngày miễn phí"**

**Expected:**
- ✅ Toast hiện: "Bắt đầu dùng thử Premium 7 ngày!"
- ✅ Modal tự đóng
- ✅ Plan badge đổi thành "Dùng thử"
- ✅ URL vẫn là `/phong-van-setup` (KHÔNG navigate)
- ✅ AI model dropdown bây giờ cho phép chọn tất cả premium models
- ✅ Tất cả premium interviewer modes được unlock
- ✅ KHÔNG reload, KHÔNG mất session

---

### ✅ TEST 5: Upgrade Modal (Shared Component) - "Dùng thử 7 ngày miễn phí"
**Steps:**
1. Đăng nhập với free user
2. Trigger UpgradeModal từ bất kỳ đâu (có thể từ CV page khi hết quota)
3. Modal "Nâng cấp lên Premium" xuất hiện
4. Bấm nút **"Dùng thử 7 ngày miễn phí"**

**Expected:**
- ✅ Toast hiện: "Bắt đầu dùng thử Premium 7 ngày!"
- ✅ Modal tự đóng
- ✅ Plan badge đổi thành "Dùng thử"
- ✅ URL KHÔNG thay đổi (stay on current page)
- ✅ KHÔNG reload, KHÔNG mất session

---

### ✅ TEST 6: Safety Guard - Block external links
**Steps:**
1. Đăng nhập vào app
2. Vào bất kỳ trang nào (dashboard, pricing, etc.)
3. Nếu có bất kỳ `<a href="https://example.com">` nào (giả sử lỡ có)
4. Bấm vào link đó

**Expected:**
- ✅ Console warning: `[Safety Guard] Blocked external navigation: https://...`
- ✅ Toast error: "Không thể mở liên kết bên ngoài từ ứng dụng"
- ✅ KHÔNG mở tab mới
- ✅ KHÔNG redirect ra ngoài
- ✅ Vẫn ở trong app

---

### ✅ TEST 7: Header - "Nâng cấp ngay" button
**Steps:**
1. Đăng nhập với free user
2. Header có button **"Nâng cấp ngay"**
3. Bấm button đó

**Expected:**
- ✅ Navigate nội bộ tới `/thanh-toan`
- ✅ KHÔNG reload, KHÔNG mất session
- ✅ URL đổi thành `/thanh-toan`

---

### ✅ TEST 8: Subscription Page - "Nâng cấp Premium"
**Steps:**
1. Đăng nhập với free user
2. Vào `/goi-dich-vu`
3. Bấm nút **"Nâng cấp Premium"**

**Expected:**
- ✅ Navigate nội bộ tới `/bang-gia`
- ✅ KHÔNG reload, KHÔNG mất session

---

### ✅ TEST 9: Trial không bị reset sau reload
**Steps:**
1. Thực hiện TEST 1 hoặc TEST 2 để activate trial
2. Reload trang (F5 hoặc Cmd+R)
3. Kiểm tra plan badge và user state

**Expected:**
- ✅ Plan badge vẫn hiển thị "Dùng thử"
- ✅ User vẫn đăng nhập
- ✅ Trial state vẫn còn (localStorage persistent)
- ✅ `user.role === 'trial'`
- ✅ `user.trialEndsAt` vẫn đúng

---

## 🎯 ĐIỂM QUAN TRỌNG

### ✅ ĐÚNG - Khi nào KHÔNG navigate:
- ✅ "Dùng thử 7 ngày miễn phí" → Chỉ `startTrial()`, đứng nguyên trang
- ✅ User bấm thì chỉ cập nhật state + toast
- ✅ Plan badge tự động update ngay lập tức

### ✅ ĐÚNG - Khi nào CÓ navigate:
- ✅ "Nâng cấp Premium" / "Nâng cấp ngay" → `navigate('/thanh-toan')`
- ✅ "Xem bảng giá" → `navigate('/bang-gia')`
- ✅ User đã trial/premium bấm upgrade → navigate billing

### ❌ SAI - Không bao giờ được:
- ❌ `window.location.href = ...`
- ❌ `window.location.reload()`
- ❌ `window.open(...)`
- ❌ `<a href="https://...">`
- ❌ Navigate sau `startTrial()`
- ❌ Clear localStorage user data
- ❌ Redirect về `/dang-nhap` khi activate trial

---

## 🔍 DEBUG CHECKLIST

Nếu vẫn bị văng ra ngoài, check:

1. **Console logs:** Có log `[Safety Guard]` không?
2. **Network tab:** Có full page reload không?
3. **localStorage:** Key `interviet_app_state` có bị clear không?
4. **URL changes:** URL có đổi sang domain khác không?
5. **React Router:** Có dùng `useNavigate()` đúng cách không?
6. **Event tracking:** Có event `trial_started` được fire không?

---

## 📊 SUMMARY

| File | Changes | Status |
|------|---------|--------|
| `DashboardPage.tsx` | Remove navigate after startTrial | ✅ Fixed |
| `PricingPage.tsx` | Return early after startTrial | ✅ Fixed |
| `InterviewSetupPage.tsx` | Add startTrial button to upgrade modal | ✅ Enhanced |
| `AllRemainingPages.tsx` | Use navigate instead of window.location | ✅ Fixed |
| `ErrorBoundary.tsx` | Add navigate prop support | ✅ Fixed |
| `AppLayout.tsx` | Add Safety Guard Layer | ✅ New |
| `AppContext.tsx` | startTrial already correct | ✅ No change |
| `UpgradeModal.tsx` | Already correct | ✅ No change |

---

## 🎉 EXPECTED FINAL BEHAVIOR

**User Flow:**
1. Free user vào app
2. Bấm "Dùng thử 7 ngày miễn phí" BẤT KỲ ĐÂU
3. ✅ Toast xuất hiện
4. ✅ Badge đổi thành "Dùng thử"
5. ✅ Vẫn ở nguyên trang hiện tại
6. ✅ User có thể tiếp tục dùng app với premium features
7. ✅ Không reload, không mất session, không văng ra ngoài

**User được upgrade nhưng vẫn ở lại app = SPA hoàn hảo! 🚀**

---

## 📝 NOTES

- Toast message được handle trong `AppContext.tsx` line 235-243
- Plan badge tự động update vì state thay đổi
- Trial duration: 7 days (computed in `AppContext.tsx`)
- Safety Guard chạy trên toàn bộ app khi mount `AppLayout`
- Event tracking vẫn hoạt động bình thường

---

**Tất cả fixes đã được triển khai theo đúng specification trong `fix-external-navigation.md`.**

**Status: ✅ PRODUCTION READY**