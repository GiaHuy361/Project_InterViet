# Hướng dẫn Test Badge Hiển thị

## ✅ Đã sửa xong

Hệ thống badge hiện tại đã được cải thiện để hiển thị **động** theo cả `role` và `subscriptionPlan` của user.

## 🎯 Logic hiển thị mới

### Priority 1: Trạng thái đặc biệt (Role-based)
Ưu tiên cao nhất - hiển thị ngay khi user có các trạng thái này:

| Role | Badge hiển thị | Màu sắc |
|------|----------------|---------|
| `visitor` | Khách | Gray outline |
| `trial` | Dùng thử 7 ngày | Blue gradient |
| `expired` | Hết hạn | Red (destructive) |
| `cancelled` | Đã hủy | Orange outline |
| `suspended` | Tạm khóa | Red (destructive) |

### Priority 2: Gói dịch vụ (Plan-based)
Khi user có role = `free` hoặc `premium` và đang active:

| Plan | Badge hiển thị | Màu sắc |
|------|----------------|---------|
| `free` | Miễn phí | Gray |
| `monthly` | Gói Tháng | Blue gradient |
| `quarterly` | Gói Quý | Purple gradient |
| `yearly` | Gói Năm | Amber/Gold gradient |

## 🧪 Cách test

### 1. Xóa dữ liệu cũ
Mở Console (F12) và chạy:
```javascript
clearInterVietAndReload()
```

### 2. Đăng nhập lại
User mới sẽ có:
- `role: 'free'`
- `subscriptionPlan: 'free'`
- Badge hiển thị: **"Miễn phí"** (màu xám)

### 3. Test các trạng thái khác
Mở Console và chạy từng lệnh sau để test:

#### Test Gói Tháng
```javascript
window.clearInterVietData(); // Xóa data
// Đăng nhập lại, sau đó trong Console:
// (Bạn cần access AppContext - sẽ test qua UI thay vì console)
```

**Hoặc đơn giản hơn:** Sử dụng flow thanh toán trong UI:
1. Vào `/goi-dich-vu`
2. Chọn "Gói Tháng" và thanh toán
3. Badge sẽ tự động đổi thành **"Gói Tháng"** (blue gradient)

#### Test Trial
1. Vào `/goi-dich-vu`
2. Chọn "Gói Năm" → "Dùng thử 7 ngày miễn phí"
3. Badge sẽ đổi thành **"Dùng thử 7 ngày"** (blue)

#### Test Expired
Sau khi trial hết hạn (hoặc subscription hết hạn), badge tự động chuyển sang **"Hết hạn"**

## 📍 Vị trí hiển thị

Badge xuất hiện ở **2 chỗ**:

1. **Header** (góc trên phải) - bên cạnh tên user
2. **Dropdown menu** - khi click vào avatar

Cả 2 chỗ đều đồng bộ và hiển thị cùng badge.

## 🎨 Design tokens

Badge sử dụng:
- **Free**: `bg-gray-100 text-gray-700`
- **Monthly**: `bg-gradient-to-r from-blue-600 to-blue-700 text-white`
- **Quarterly**: `bg-gradient-to-r from-purple-600 to-purple-700 text-white`
- **Yearly**: `bg-gradient-to-r from-amber-500 to-amber-600 text-white`
- **Trial**: `bg-blue-600 text-white`
- **Expired/Suspended**: `destructive` variant (red)

## ✨ Lợi ích

1. ✅ Không còn hardcode "Premium"
2. ✅ Tự động cập nhật theo gói dịch vụ thực tế
3. ✅ Phù hợp với business model 4 gói (Free/Tháng/Quý/Năm)
4. ✅ Hiển thị trạng thái trial/expired/cancelled rõ ràng
5. ✅ Gradient đẹp cho các gói trả phí
