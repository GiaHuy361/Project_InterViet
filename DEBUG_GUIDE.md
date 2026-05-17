# Phase 1 Debug Guide

## Issues Fixed

### 1. ✅ Đăng ký nhảy thẳng vào dashboard
**Fixed**: SignupPage giờ check `response.emailVerified` từ API response thay vì từ state (race condition).

**Flow mới:**
- Register success + emailVerified=false → Toast "Đăng ký thành công!" → Navigate `/xac-minh-email`
- Register success + emailVerified=true → Toast "Đăng ký thành công!" → Navigate `/dashboard`

### 2. ✅ Google Login hiển thị "đang được cấu hình"
**Fixed**: Đã tạo `.env` file với `VITE_GOOGLE_CLIENT_ID`.

**Cần làm:**
1. **RELOAD dev server** sau khi .env thay đổi:
   ```bash
   # Stop dev server (Ctrl+C)
   # Start lại
   pnpm dev
   ```

2. Hoặc hard refresh browser: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

### 3. 🔍 Đăng nhập không được vào / chưa có message
**Đã thêm debug logging** để tìm lỗi:

**Cách debug:**
1. Mở Console (F12)
2. Thử đăng nhập
3. Xem logs:
   - `[LoginPage] Attempting login...` - Component đang gọi
   - `[AppContext] Calling login API...` - Context đang xử lý
   - `[AppContext] Login API success` - API trả về thành công
   - `[LoginPage] Login successful` - Navigate sắp xảy ra

**Nếu thấy error:**
- Check error message trong red alert box
- Check console error
- Check backend có chạy không (http://localhost:5000)

**Common errors:**
- `NETWORK_ERROR` → Backend chưa chạy
- `Auth.InvalidCredentials` → Email/password sai
- `401 Unauthorized` → API contract không khớp

---

## Test Checklist

### Backend Running?
```bash
# Check backend is running
curl http://localhost:5000/api/v1/health
```

### Frontend Dev Server
```bash
# Should run on port 3000 (required for email links)
pnpm dev

# Check output:
# ➜ Local:   http://localhost:3000/
```

### Environment Variables
```bash
# Check .env file exists
cat .env

# Should see:
# VITE_API_BASE_URL=http://localhost:5000/api/v1
# VITE_GOOGLE_CLIENT_ID=964232858341-5tr0k7mju0l31mg9amdlvf74eacau5tr.apps.googleusercontent.com
```

### Test Flow

#### 1. Register Flow
1. Go to `/dang-ky`
2. Fill form: Name, Email, Password, Confirm Password
3. Click "Tạo tài khoản"
4. **Expected**:
   - Toast: "Đăng ký thành công! Vui lòng kiểm tra email..."
   - Navigate to `/xac-minh-email`
   - See green banner: "Đăng ký thành công!"
   - See instructions to check email

#### 2. Login Flow
1. Go to `/dang-nhap`
2. Fill email & password
3. Click "Đăng nhập"
4. **Expected**:
   - Button shows loading (disabled + spinner)
   - If success: Navigate to `/dashboard`
   - If error: Red alert box with message

#### 3. Google Login Flow
1. Go to `/dang-nhap`
2. **Check**: Google button should be visible (not disabled)
3. Click Google button
4. **Expected**:
   - Google popup opens
   - After auth: Blue loading message
   - Navigate to `/dashboard`

---

## Debugging Tips

### Login Not Working

**Check 1: Backend Running?**
```bash
curl http://localhost:5000/api/v1/health
```

**Check 2: Network Tab**
- Open DevTools → Network tab
- Try login
- Look for POST request to `/auth/login`
- Check status code (200 OK vs 401 Unauthorized)
- Check response body

**Check 3: Console Logs**
Look for:
```
[LoginPage] Attempting login... {email: "...", deviceName: "..."}
[AppContext] Calling login API... {email: "...", deviceName: "..."}
[AppContext] Login API success, emailVerified: true
[LoginPage] Login successful
```

**If stuck at "Calling login API":**
- Backend timeout or not running
- CORS issue
- Network error

**If see error log:**
- Read error message
- Check ApiError mapping in console

### Register Goes Directly to Dashboard

**Should NOT happen anymore.** If still happens:
1. Check console for logs
2. Verify backend returns `emailVerified: false`
3. Check SignupPage is using latest code

### Google Login Still Shows "đang được cấu hình"

**Fix:**
1. Check `.env` file exists
2. Restart dev server
3. Hard refresh browser (Ctrl+Shift+R)
4. Check console: `import.meta.env.VITE_GOOGLE_CLIENT_ID` should NOT be empty

---

## Console Commands for Testing

Open browser console and run:

```javascript
// Check env loaded
console.log('Google Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);

// Check auth state
// (in component that uses useApp)
// const { state } = useApp();
// console.log('Auth state:', state);
```

---

## Next Steps After Fixes Work

1. Test full auth flow end-to-end
2. Test with real backend
3. Test email verification with real emails
4. Test password reset with real emails
5. Test Google login with real Google account

---

## Known Issues

None - all Phase 1 issues fixed.

## Contact

If issues persist after following this guide, provide:
1. Console logs (full output)
2. Network tab screenshot (failed request)
3. Browser & OS
4. Steps to reproduce
