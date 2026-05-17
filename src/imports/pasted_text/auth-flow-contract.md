FRONTEND PHASE 1B — COMPLETE AUTH FULL FLOW WITH EXACT BACKEND CONTRACT

Phase 1 core đã làm xong API client/Auth foundation. Bây giờ hoàn thiện full auth UI theo backend contract chính xác.

Không làm CV/JD/Matching/Interview.
Không làm employer/recruiter.
Không gọi Python service.
Không fake auth result.

Lưu ý quan trọng:
Các contract dưới đây là contract chính xác từ backend C#.
Không dùng lại sample cũ nếu khác contract này.

1. Environment

Frontend cần thêm:

VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_GOOGLE_CLIENT_ID=<google_oauth_client_id>

Không expose Google Client Secret ra frontend.
Backend giữ GoogleAuth:ClientId và GoogleAuth:ClientSecret trong appsettings.

2. AuthResponse chính xác

Login, register, refresh, google-login đều trả AuthResponse flat trong data:

{
  "success": true,
  "data": {
    "userId": "guid",
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A",
    "status": "free",
    "accessToken": "jwt-token",
    "accessTokenExpiry": "2026-05-17T01:00:00Z",
    "refreshToken": "raw-refresh-token",
    "refreshTokenExpiry": "2026-06-16T00:30:00Z",
    "emailVerified": true
  },
  "meta": {
    "requestId": "...",
    "timestamp": "..."
  }
}

Không có roles array trong response.
Không có avatarUrl trong response.
Không có expiresIn.
Role candidate nằm trong JWT claims.
Avatar lấy sau bằng GET /profile.

Frontend phải normalize auth state theo shape này.

3. Login

Endpoint:

POST /auth/login

Request body chính xác:

{
  "email": "user@example.com",
  "password": "Password123",
  "deviceName": "Chrome on Windows"
}

deviceName optional.

Sau success:
Lưu accessToken
Lưu refreshToken
Lưu accessTokenExpiry
Lưu refreshTokenExpiry
Lưu user flat data
Redirect /dashboard hoặc returnUrl

4. Register

Endpoint:

POST /auth/register

Request body chính xác:

{
  "fullName": "Nguyễn Văn A",
  "email": "user@example.com",
  "password": "Password123"
}

Không gửi firstName/lastName.
Không gửi confirmPassword lên backend.
Không gửi phoneNumber.

Frontend vẫn có thể có confirmPassword input để validate UX, nhưng chỉ gửi fullName, email, password.

Password rule backend:
Tối thiểu 8 ký tự
Có ít nhất 1 chữ HOA
Có ít nhất 1 chữ thường
Có ít nhất 1 chữ số

Register response:
Trả AuthResponse giống login.
Register trả token luôn, user logged in ngay.
Nhưng emailVerified có thể là false.
Backend tự gửi email xác thực.

Sau register:
Nếu emailVerified=false thì show banner hoặc screen:
“Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.”

Không tự gửi email từ frontend.

5. Verify Email

Email verify link backend tạo:

/verify-email?token=<rawToken>

Frontend route cần có:

/verify-email

Query param:
token bắt buộc

Endpoint:

POST /auth/verify-email

Request body chính xác:

{
  "token": "raw_token_from_email_link"
}

Không gửi email.

Response success:
204 No Content

Flow:
User vào /verify-email?token=xxx
Frontend lấy token
POST /auth/verify-email { token }
204 success thì show “Email đã xác thực thành công”
Redirect /login hoặc /dashboard tùy auth state

Error:
400 VerifyEmail.TokenExpired → show “Link xác thực đã hết hạn”
404 VerifyEmail.TokenNotFound → show “Link xác thực không hợp lệ”

6. Resend Verification Email

Endpoint tồn tại:

POST /auth/resend-verification-email

Request body:

{
  "email": "user@example.com"
}

Response 200.

Dùng cho nút:
“Gửi lại email xác thực”

Nút này nên xuất hiện khi verify token expired hoặc user chưa verify email.

7. Forgot Password

Endpoint:

POST /auth/forgot-password

Request body:

{
  "email": "user@example.com"
}

Response luôn 200 để chống leak email:

{
  "success": true,
  "message": "If an account exists, a reset email has been sent."
}

Frontend message:
“Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.”

Không hiển thị email có tồn tại hay không.

8. Reset Password

Reset password link backend tạo:

/reset-password?token=<rawToken>

Frontend route cần có:

/reset-password

Query param:
token bắt buộc

Endpoint:

POST /auth/reset-password

Request body chính xác:

{
  "token": "raw_token_from_email_link",
  "newPassword": "NewPassword456"
}

Không gửi email.
Không gửi confirmPassword lên backend.

Frontend form có:
newPassword
confirmPassword

Frontend validate confirmPassword trước khi gửi.
Chỉ gửi token + newPassword.

Response success:
204 No Content

Sau success:
Show “Mật khẩu đã được cập nhật”
Redirect /login

Backend revoke toàn bộ refresh tokens sau reset, nên user phải login lại.

Error:
400 ResetPassword.TokenExpired → “Link đặt lại mật khẩu đã hết hạn”
404 ResetPassword.TokenNotFound → “Link đặt lại mật khẩu không hợp lệ”

9. Google Login

Login page cần có nút:
“Đăng nhập với Google”

Dùng Google Identity Services hoặc @react-oauth/google.

Frontend lấy idToken từ Google credential response:

response.credential chính là idToken.

Endpoint:

POST /auth/google-login

Request body chính xác:

{
  "idToken": "google-id-token",
  "deviceName": "Chrome on Windows"
}

deviceName optional.

Không gửi credential field.
Không gửi googleToken field.
Không hardcode idToken.

Sau success:
Lưu AuthResponse giống login thường
Redirect /dashboard hoặc returnUrl

Behavior backend:
Google account chưa tồn tại thì tự register + login
Google account đã có email trong DB thì link rồi login
Email Google chưa verify thì backend trả 401 GoogleLogin.UnverifiedEmail

Nếu chưa có VITE_GOOGLE_CLIENT_ID:
Giữ nút Google Login nhưng disable hoặc show “Google login pending configuration”
Không fake login success.

10. Refresh Token

Endpoint:

POST /auth/refresh

Request body chính xác:

{
  "refreshToken": "raw-refresh-token-string"
}

Không gửi accessToken.

Refresh rotation:
Token cũ bị revoke.
Backend trả AuthResponse mới với accessToken + refreshToken mới.

Nếu refresh fail với 401:
Clear auth state
Redirect /login

11. Logout

Endpoint:

POST /auth/logout

Request body chính xác:

{
  "refreshToken": "raw-refresh-token-string"
}

Endpoint AllowAnonymous.
Không cần JWT header.
Không cần accessToken.

Response:
204 No Content

Logout idempotent.
Sau logout:
Clear accessToken
Clear refreshToken
Clear user
Redirect /login

12. Frontend routes bắt buộc

/login
/register
/forgot-password
/reset-password?token=...
/verify-email?token=...

Các routes này là public routes.

Protected routes:
dashboard
profile
resumes
job descriptions
matching
interviews
subscription

13. Candidate-only rule

Không employer login.
Không recruiter login.
Không role switcher.
Không employer dashboard.
Không route /employer hoặc /nha-tuyen-dung.

AuthResponse không có roles array.
Nếu cần check role thì decode JWT claim roleCode nếu project đã có helper.
Mặc định app là candidate-only.

14. Error codes cần handle

Auth.InvalidCredentials → 401 → Email hoặc mật khẩu không đúng
Auth.AccountSuspended → 403 → Tài khoản đã bị khóa
Register.EmailTaken → 409 → Email đã được đăng ký
GoogleLogin.InvalidToken → 401 → Google token không hợp lệ
GoogleLogin.UnverifiedEmail → 401 → Email Google chưa được xác thực
GoogleLogin.AccountDeleted → 401 → Tài khoản đã bị xóa
VerifyEmail.TokenNotFound → 404 → Link xác thực không hợp lệ
VerifyEmail.TokenExpired → 400 → Link xác thực đã hết hạn
ResetPassword.TokenNotFound → 404 → Link đặt lại mật khẩu không hợp lệ
ResetPassword.TokenExpired → 400 → Link đặt lại mật khẩu đã hết hạn
RefreshToken.Invalid → 401 → Phiên đăng nhập không hợp lệ
RefreshToken.Revoked → 401 → Phiên đăng nhập đã bị thu hồi
RefreshToken.Expired → 401 → Phiên đăng nhập đã hết hạn

15. Update Phase 1 hiện tại

Kiểm tra lại authService hiện tại và sửa cho đúng contract:

Register:
Không gửi confirmPassword lên backend
Không gửi firstName/lastName
Gửi fullName/email/password

Verify email:
Chỉ gửi token
Không gửi email

Reset password:
Chỉ gửi token/newPassword
Không gửi email
Không gửi confirmPassword

Refresh:
Chỉ gửi refreshToken
Không gửi accessToken

Logout:
Chỉ gửi refreshToken
Không cần Authorization header

Google login:
Gửi idToken
Không gửi credential

AuthResponse:
Không expect data.user
Không expect roles
Không expect avatarUrl
Không expect expiresIn
Dùng flat data fields:
userId, email, fullName, status, accessToken, accessTokenExpiry, refreshToken, refreshTokenExpiry, emailVerified

16. Deliverables Phase 1B

Báo lại:
Files tạo/sửa
AuthService đã sửa contract nào
Google login trạng thái real/pending config
Forgot password UI đã nối chưa
Reset password UI đã nối chưa
Verify email UI đã nối chưa
Resend verification email có nút chưa
Register flow xử lý emailVerified=false thế nào
Refresh/logout contract đã đúng chưa
Build/lint result
Known issues

17. Test checklist

Login thường pass
Login sai mật khẩu show Auth.InvalidCredentials
Register pass với fullName/email/password
Register không gửi confirmPassword lên backend
Sau register emailVerified=false thì show check email/banner
Verify email route đọc token và gọi API thật
Verify token expired show đúng lỗi
Resend verification email gọi API thật
Forgot password gọi API thật và luôn show generic success
Reset password route đọc token và gửi token/newPassword
Refresh token chỉ gửi refreshToken
Logout chỉ gửi refreshToken và clear auth state
Google button hiển thị
Google login không fake nếu thiếu VITE_GOOGLE_CLIENT_ID
Không còn employer/recruiter auth
Route guard vẫn hoạt động

Chỉ làm Phase 1B này, không làm các module khác.