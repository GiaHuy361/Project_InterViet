INTER-VIET Frontend Phase 1 — Auth Foundation Specification
1. Mục tiêu Phase 1
Phase 1 xây dựng lại nền tảng xác thực frontend cho INTER-VIET theo đúng backend C# contract hiện tại.
Phase này chỉ làm Auth Foundation, bao gồm API client, auth service, token handling, route guard, login, register, logout, refresh token, Google login, verify email, resend verification email, forgot password, reset password và auth error display.
Phase này không làm CV, JD, matching, subscription, interview text, realtime voice, payment, mentor, employer hoặc recruiter.
INTER-VIET hiện là sản phẩm dành 100% cho ứng viên. Frontend không được tạo lại bất kỳ flow nào liên quan đến nhà tuyển dụng, employer, recruiter, headhunter, đăng tin tuyển dụng, employer dashboard hoặc recruiter dashboard.
________________________________________
2. Backend Local Information
Backend C# API base URL:
http://localhost:5000/api/v1
Swagger:
http://localhost:5000/swagger
Frontend local nên chạy ở port 3000:
http://localhost:3000
Lý do bắt buộc ưu tiên port 3000: backend development config đang tạo email links theo frontend base URL:
http://localhost:3000/verify-email?token=...
http://localhost:3000/reset-password?token=...
Python services không dùng trong Phase 1:
Python CV service: http://localhost:8001
Python Interview service: http://localhost:8002
Frontend không gọi Python service trực tiếp trong bất kỳ auth flow nào.
________________________________________
3. Environment Variables
Tạo hoặc cập nhật file .env trong frontend project:
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_GOOGLE_CLIENT_ID=964232858341-5tr0k7mju0l31mg9amdlvf74eacau5tr.apps.googleusercontent.com
Frontend chỉ được dùng Google Client ID. Không đưa Google Client Secret vào frontend.
Google Client Secret chỉ nằm ở backend config và không được expose ra browser.
________________________________________
4. Scope Phase 1
4.1. Làm trong Phase 1
•	API client nền tảng
•	Response envelope parser
•	Error normalizer
•	Auth service
•	Auth store hoặc auth context
•	Token storage
•	Token refresh flow
•	Login bằng email/password
•	Register ứng viên
•	Logout
•	Google login bằng idToken
•	Verify email
•	Resend verification email
•	Forgot password
•	Reset password
•	Protected route
•	Public-only route
•	Auth loading state
•	Auth error display rõ ràng
•	Candidate-only enforcement
4.2. Không làm trong Phase 1
•	CV upload/list/detail
•	Job description CRUD
•	CV-JD matching
•	Multi-JD matching
•	Subscription/quota UI
•	Interview text
•	Realtime voice
•	Payment gateway
•	Mentor booking
•	Employer/recruiter flow
•	Gọi Python service
•	Fake login success
•	Fake backend response
________________________________________
5. Suggested File Structure
Nếu frontend project đã có convention riêng thì giữ convention hiện tại, không rewrite toàn bộ project. Nếu chưa có structure rõ, dùng cấu trúc gợi ý sau:
src/lib/api/apiClient.ts
src/lib/api/apiTypes.ts
src/lib/api/apiError.ts
src/services/authService.ts
src/app/contexts/AppContext.tsx
src/hooks/useAuth.ts
src/components/auth/ProtectedRoute.tsx
src/components/auth/PublicOnlyRoute.tsx
src/app/pages/LoginPage.tsx
src/app/pages/SignupPage.tsx
src/app/pages/ForgotPasswordPage.tsx
src/app/pages/ResetPasswordPage.tsx
src/app/pages/VerifyEmailPage.tsx
Không thêm state library mới nếu project đã có AppContext, Zustand, Redux hoặc context pattern đang dùng ổn định.
________________________________________
6. API Client Requirements
API client phải đọc base URL từ env:
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
Không hardcode http://localhost:5000/api/v1 trong component.
API client nên có các method:
apiClient.get<T>(url, options?)
apiClient.post<T>(url, body?, options?)
apiClient.put<T>(url, body?, options?)
apiClient.patch<T>(url, body?, options?)
apiClient.delete<T>(url, options?)
apiClient.upload<T>(url, formData, options?)
Request JSON phải tự set:
Content-Type: application/json
Khi gửi FormData thì không set Content-Type thủ công.
Authenticated request phải tự gắn:
Authorization: Bearer <accessToken>
Các auth endpoints như login, register, refresh, logout, forgot password, reset password, verify email có thể dùng skipAuth nếu không cần access token.
API client không được log access token, refresh token, password hoặc Authorization header.
________________________________________
7. Backend Response Envelope
Backend success response thường có dạng:
{
  "success": true,
  "message": null,
  "data": {},
  "meta": {
    "requestId": "0HNL...",
    "timestamp": "2026-05-17T00:00:00Z"
  },
  "error": null
}
Backend error response có thể có dạng:
{
  "success": false,
  "data": null,
  "error": {
    "code": "Auth.InvalidCredentials",
    "message": "Email hoặc mật khẩu không đúng"
  },
  "meta": {
    "requestId": "0HNL...",
    "timestamp": "2026-05-17T00:00:00Z"
  }
}
ASP.NET validation ProblemDetails có thể có dạng:
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Email": ["Email is required"],
    "Password": ["Password is required"]
  },
  "traceId": "00-..."
}
API client phải parse cả 2 dạng trên.
________________________________________
8. Shared API Types
Tạo type tương đương:
export type ApiEnvelope<T> = {
  success: boolean
  message?: string | null
  data?: T | null
  meta?: {
    requestId?: string
    timestamp?: string
  } | null
  error?: {
    code?: string
    message?: string
    details?: unknown
  } | null
}

export type ApiErrorShape = {
  status: number
  code: string
  message: string
  details?: unknown
  requestId?: string
}
Tạo ApiError class hoặc object chuẩn để các page đều handle thống nhất.
API client behavior:
•	Nếu HTTP response OK và success === true, return data
•	Nếu success === false, throw ApiError
•	Nếu là ProblemDetails, convert sang ApiError
•	Nếu network error, throw ApiError với code NETWORK_ERROR
•	Nếu response không phải JSON, throw ApiError với code UNKNOWN_RESPONSE
________________________________________
9. HTTP Error Mapping Chung
Frontend cần map lỗi chung như sau:
400 -> Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.
401 -> Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.
403 -> Bạn không có quyền thực hiện thao tác này hoặc đã vượt giới hạn gói hiện tại.
404 -> Không tìm thấy dữ liệu.
409 -> Trạng thái hiện tại không cho phép thao tác này. Vui lòng tải lại dữ liệu.
429 -> Bạn thao tác quá nhanh. Vui lòng thử lại sau.
500 -> Có lỗi hệ thống. Vui lòng thử lại.
503 -> Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.
NETWORK_ERROR -> Không thể kết nối máy chủ. Vui lòng kiểm tra backend.
UNKNOWN_RESPONSE -> Phản hồi máy chủ không hợp lệ.
Page có thể override message cụ thể theo auth error code.
________________________________________
10. Exact Backend AuthResponse Contract
Login, register, refresh, google-login đều trả AuthResponse flat trong data.
Response mẫu:
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
Frontend không được expect các field sau:
data.user
roles[]
avatarUrl
expiresIn
expiresAt
Role candidate nằm trong JWT claims nếu cần dùng sau này. Trong Phase 1, app mặc định là candidate-only.
________________________________________
11. Auth State Shape
Auth state nên có dạng:
type AuthUser = {
  userId: string
  email: string
  fullName: string
  status: string
  emailVerified: boolean
}

type AuthState = {
  isAuthenticated: boolean
  isLoading: boolean
  accessToken: string | null
  refreshToken: string | null
  accessTokenExpiry: string | null
  refreshTokenExpiry: string | null
  user: AuthUser | null
}
Auth state phải được cập nhật từ AuthResponse flat.
Không lưu data.user vì backend không trả shape đó.
________________________________________
12. Token Storage
Dùng convention hiện tại của frontend project. Nếu chưa có, có thể dùng localStorage với keys:
interviet.accessToken
interviet.refreshToken
interviet.accessTokenExpiry
interviet.refreshTokenExpiry
interviet.authUser
Yêu cầu bảo mật:
•	Không log token
•	Không log refreshToken
•	Không log Authorization header
•	Không expose token trong UI
•	Clear token khi logout
•	Clear token khi refresh fail
________________________________________
13. Refresh Token Flow
Endpoint:
POST /api/v1/auth/refresh
Request body chính xác:
{
  "refreshToken": "raw-refresh-token-string"
}
Không gửi accessToken.
Refresh rotation:
•	Backend revoke token cũ
•	Backend trả AuthResponse mới với accessToken và refreshToken mới
•	Frontend phải update cả accessToken và refreshToken mới
Nếu refresh fail với 401:
•	Clear auth state
•	Clear storage
•	Redirect login
API client behavior:
Nếu request auth trả 401 và chưa retry:
  thử refresh token
  refresh OK -> retry request cũ
  refresh fail -> logout local và redirect login
Không được refresh loop vô hạn.
________________________________________
14. Logout Flow
Endpoint:
POST /api/v1/auth/logout
Request body chính xác:
{
  "refreshToken": "raw-refresh-token-string"
}
Logout endpoint AllowAnonymous, không cần Authorization header.
Sau logout:
•	Gọi API logout nếu có refreshToken
•	Dù API fail vì token invalid, vẫn clear local auth state
•	Clear accessToken
•	Clear refreshToken
•	Clear user
•	Redirect /login hoặc /dang-nhap
Không gửi accessToken trong body.
________________________________________
15. Login Flow
Endpoint:
POST /api/v1/auth/login
Request body chính xác:
{
  "email": "user@example.com",
  "password": "Password123",
  "deviceName": "Chrome on Windows"
}
deviceName optional.
Không gửi:
username
rememberMe
nested credentials object
Success:
•	Lưu AuthResponse vào auth state/storage
•	Redirect về returnUrl nếu có
•	Nếu không có returnUrl, redirect /dashboard
Invalid credentials:
HTTP 401 hoặc Auth.InvalidCredentials
UI message: Email hoặc mật khẩu không đúng.
LoginPage phải bắt ApiError và hiển thị lỗi dưới form hoặc toast.
AppContext login() không được nuốt lỗi. Nếu catch error thì phải rethrow để LoginPage hiển thị.
________________________________________
16. LoginPage UI Requirements
Login page cần có:
•	Email input
•	Password input
•	Remember me checkbox nếu UI đã có
•	Submit button
•	Google login button
•	Link quên mật khẩu
•	Link đăng ký
•	Loading state khi submit
•	Error message rõ ràng
Submit behavior:
•	Disable button khi loading
•	Không cho double submit
•	Nếu lỗi thì enable lại button
•	Không clear email khi login fail
•	Không silent fail
Error messages:
Auth.InvalidCredentials hoặc 401 -> Email hoặc mật khẩu không đúng.
400 -> Dữ liệu đăng nhập không hợp lệ. Vui lòng kiểm tra lại.
NETWORK_ERROR -> Không thể kết nối máy chủ. Vui lòng kiểm tra backend.
500/503 -> Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.
________________________________________
17. Register Flow
Endpoint:
POST /api/v1/auth/register
Request body chính xác:
{
  "fullName": "Nguyễn Văn A",
  "email": "user@example.com",
  "password": "Password123"
}
Không gửi lên backend:
confirmPassword
firstName
lastName
phoneNumber
Frontend form có thể có confirm password để validate UX, nhưng request chỉ gửi fullName, email, password.
Password rule backend:
Tối thiểu 8 ký tự
Có ít nhất 1 chữ HOA
Có ít nhất 1 chữ thường
Có ít nhất 1 chữ số
Register success:
•	Backend trả AuthResponse
•	Register trả token luôn
•	emailVerified có thể là false
•	Backend tự gửi email xác thực
Business rule bắt buộc:
Nếu register trả emailVerified=false, frontend không được đưa thẳng user vào dashboard chính như đã hoàn tất onboarding.
Frontend phải hiển thị verification state:
Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.
Có nút resend verification email.
Có thể lưu token và auth state, nhưng cần gate UX bằng trạng thái cần xác thực email.
Nếu email đã tồn tại:
HTTP 409 hoặc Register.EmailTaken
UI message: Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.
Không được redirect dashboard khi register lỗi.
________________________________________
18. SignupPage UI Requirements
Signup page cần có:
•	Full name input
•	Email input
•	Password input
•	Confirm password input nếu UI muốn
•	Submit button
•	Link login
•	Loading state
•	Error display
Validation frontend:
fullName required
email required
email format
password required
password >= 8 ký tự
password có chữ hoa, chữ thường, số
confirmPassword match nếu có field này
Request gửi backend chỉ gồm:
{
  "fullName": "...",
  "email": "...",
  "password": "..."
}
________________________________________
19. Verify Email Flow
Backend email verify link:
http://localhost:3000/verify-email?token=<rawToken>
Frontend routes bắt buộc:
/verify-email
/xac-minh-email
Cả hai route render cùng VerifyEmailPage.
VerifyEmailPage đọc token từ query string:
const token = searchParams.get('token')
Endpoint:
POST /api/v1/auth/verify-email
Request body chính xác:
{
  "token": "raw_token_from_email_link"
}
Không gửi email.
Success:
204 No Content
UI success message:
Email đã xác thực thành công.
Sau success:
•	Nếu user đang logged in, update emailVerified=true nếu có thể
•	Redirect dashboard hoặc show button vào dashboard
•	Nếu chưa logged in, redirect login
Error mapping:
VerifyEmail.TokenExpired -> Link xác thực đã hết hạn.
VerifyEmail.TokenNotFound -> Link xác thực không hợp lệ.
400 fallback -> Link xác thực không hợp lệ hoặc đã hết hạn.
Nếu không có token trong URL:
Link xác thực không hợp lệ.
________________________________________
20. Resend Verification Email Flow
Endpoint:
POST /api/v1/auth/resend-verification-email
Request body:
{
  "email": "user@example.com"
}
UI dùng cho nút:
Gửi lại email xác thực
Nút này nên xuất hiện ở:
•	VerifyEmailPage khi token expired
•	Verification pending screen sau register
•	User account state khi emailVerified=false
Success message:
Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư.
Không tự gửi email từ frontend. Backend là bên gửi email.
________________________________________
21. Forgot Password Flow
Frontend routes:
/forgot-password
/quen-mat-khau
Endpoint:
POST /api/v1/auth/forgot-password
Request body:
{
  "email": "user@example.com"
}
Backend luôn trả 200 để chống leak email.
UI success message bắt buộc:
Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.
Không hiển thị email có tồn tại hay không.
ForgotPasswordPage cần có:
•	Email input
•	Submit button
•	Link quay về login
•	Loading state
•	Generic success state
•	Error state cho network/server error
________________________________________
22. Reset Password Flow
Backend reset password link:
http://localhost:3000/reset-password?token=<rawToken>
Frontend routes bắt buộc:
/reset-password
/dat-lai-mat-khau
Cả hai route render cùng ResetPasswordPage.
ResetPasswordPage đọc token từ query string:
const token = searchParams.get('token')
Endpoint:
POST /api/v1/auth/reset-password
Request body chính xác:
{
  "token": "raw_token_from_email_link",
  "newPassword": "NewPassword456"
}
Không gửi:
email
confirmPassword
accessToken
refreshToken
Frontend form có:
•	New password
•	Confirm password
Frontend validate confirm password trước khi gửi, nhưng request chỉ gửi token và newPassword.
Success:
204 No Content
UI success message:
Mật khẩu đã được cập nhật.
Sau success:
•	Clear auth state nếu đang logged in
•	Redirect login
•	User phải login lại
Backend revoke toàn bộ refresh tokens sau reset password.
Error mapping:
ResetPassword.TokenExpired -> Link đặt lại mật khẩu đã hết hạn.
ResetPassword.TokenNotFound -> Link đặt lại mật khẩu không hợp lệ.
________________________________________
23. Google Login Flow
Frontend cần dùng Google Identity Services hoặc @react-oauth/google.
Env bắt buộc:
VITE_GOOGLE_CLIENT_ID=964232858341-5tr0k7mju0l31mg9amdlvf74eacau5tr.apps.googleusercontent.com
Nếu env có giá trị, Google login button phải enabled.
Nếu env không có, mới disable button và show:
Google Login đang được cấu hình
Google Identity response:
response.credential
response.credential chính là idToken.
Endpoint:
POST /api/v1/auth/google-login
Request body chính xác:
{
  "idToken": "google-id-token",
  "deviceName": "Chrome on Windows"
}
deviceName optional.
Không gửi:
credential
googleToken
accessToken
clientSecret
Success:
•	Backend trả AuthResponse flat
•	Lưu token như login thường
•	Redirect returnUrl hoặc dashboard
Backend behavior:
•	Google account chưa tồn tại thì backend tự tạo account và login
•	Google account đã tồn tại thì backend login/link account
•	Nếu Google email chưa verified, backend có thể trả 401 GoogleLogin.UnverifiedEmail
Error mapping:
GoogleLogin.InvalidToken -> Google token không hợp lệ.
GoogleLogin.UnverifiedEmail -> Email Google chưa được xác thực.
GoogleLogin.AccountDeleted -> Tài khoản đã bị xóa.
Không fake Google login success.
________________________________________
24. Auth Service Functions
Auth service cần có các function:
authService.login(payload)
authService.register(payload)
authService.refresh(payload)
authService.logout(payload)
authService.googleLogin(payload)
authService.forgotPassword(payload)
authService.resetPassword(payload)
authService.verifyEmail(payload)
authService.resendVerificationEmail(payload)
authService.getSessions?.()
authService.revokeSession?.(sessionId)
Exact payloads:
login({ email, password, deviceName? })
register({ fullName, email, password })
refresh({ refreshToken })
logout({ refreshToken })
googleLogin({ idToken, deviceName? })
forgotPassword({ email })
resetPassword({ token, newPassword })
verifyEmail({ token })
resendVerificationEmail({ email })
________________________________________
25. Route Guard
Public routes:
/
/login
/dang-nhap
/register
/dang-ky
/forgot-password
/quen-mat-khau
/reset-password
/dat-lai-mat-khau
/verify-email
/xac-minh-email
Protected routes:
/dashboard
/profile
/resumes
/job-descriptions
/matches
/interviews
/subscription
/plans
/settings
ProtectedRoute behavior:
Nếu auth loading -> show loading screen
Nếu chưa authenticated -> redirect /login?returnUrl=<current-path>
Nếu authenticated -> render page
PublicOnlyRoute behavior:
Nếu authenticated -> redirect /dashboard
Nếu chưa authenticated -> render page
Special case:
VerifyEmailPage và ResetPasswordPage phải accessible khi chưa login.
________________________________________
26. Email Verification Gate
Nếu user emailVerified=false, frontend cần có UX rõ.
Yêu cầu tối thiểu:
•	Sau register, show verification pending screen hoặc modal
•	Có nút resend verification email
•	Không coi onboarding là hoàn tất
•	Không tự động hide verification requirement
Có thể cho user vào dashboard read-only hay không tùy UI hiện tại, nhưng phải có banner rõ:
Bạn cần xác thực email để sử dụng đầy đủ tính năng.
Tốt nhất trong Phase 1: sau register với emailVerified=false, redirect sang verification pending page thay vì dashboard chính.
________________________________________
27. Candidate-only Rules
Không tạo:
Employer login
Recruiter login
Employer signup
Recruiter signup
Role switcher
Employer dashboard
Recruiter dashboard
/employer route
/nha-tuyen-dung route
AuthResponse không có roles array.
Nếu cần check role sau này thì decode JWT claim, nhưng Phase 1 mặc định app là candidate-only.
________________________________________
28. Auth Error Code Mapping
Frontend phải handle các code sau:
Auth.InvalidCredentials -> Email hoặc mật khẩu không đúng.
Auth.AccountSuspended -> Tài khoản đã bị khóa.
Register.EmailTaken -> Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.
GoogleLogin.InvalidToken -> Google token không hợp lệ.
GoogleLogin.UnverifiedEmail -> Email Google chưa được xác thực.
GoogleLogin.AccountDeleted -> Tài khoản đã bị xóa.
VerifyEmail.TokenNotFound -> Link xác thực không hợp lệ.
VerifyEmail.TokenExpired -> Link xác thực đã hết hạn.
ResetPassword.TokenNotFound -> Link đặt lại mật khẩu không hợp lệ.
ResetPassword.TokenExpired -> Link đặt lại mật khẩu đã hết hạn.
RefreshToken.Invalid -> Phiên đăng nhập không hợp lệ.
RefreshToken.Revoked -> Phiên đăng nhập đã bị thu hồi.
RefreshToken.Expired -> Phiên đăng nhập đã hết hạn.
Error UI không được chỉ log console.
Tất cả lỗi auth phải hiển thị rõ bằng inline alert hoặc toast.
________________________________________
29. Dev Debug Helpers
Project có thể có dev helper như:
clearInterVietData()
clearInterVietDataAndReload()
showInterVietData()
Có thể giữ trong dev, nhưng không phụ thuộc vào helper để auth flow hoạt động.
Không log token trong helper nếu không cần. Nếu đang log token, cần mask token.
________________________________________
30. Local Run Commands
Phase 1 không cần bật Python CV hoặc Python Interview service.
________________________________________
31. Phase 1 Test Checklist
Login
•	Login đúng email/password -> redirect dashboard
•	Login sai password -> hiện “Email hoặc mật khẩu không đúng.”
•	Login 400 validation -> hiện lỗi validation
•	Login network error -> hiện lỗi không kết nối server
•	Login loading disable button
•	Login không double submit
Register
•	Register email mới -> gọi backend đúng body { fullName, email, password }
•	Register không gửi confirmPassword lên backend
•	Register email đã tồn tại -> hiện lỗi 409 rõ
•	Register emailVerified=false -> show verification pending, không coi như hoàn tất
•	Resend verification email gọi API thật
Verify Email
•	/verify-email?token=test render VerifyEmailPage
•	/xac-minh-email?token=test render VerifyEmailPage
•	Page đọc token từ query param
•	Page gọi POST /auth/verify-email body { token }
•	Token invalid -> show link không hợp lệ
•	Token expired -> show link hết hạn
Forgot Password
•	/forgot-password hoạt động
•	/quen-mat-khau hoạt động
•	Gửi email gọi POST /auth/forgot-password
•	Success luôn show generic message
•	Không leak email tồn tại hay không
Reset Password
•	/reset-password?token=test render ResetPasswordPage
•	/dat-lai-mat-khau?token=test render ResetPasswordPage
•	Page đọc token từ query param
•	Form validate confirmPassword
•	Request chỉ gửi { token, newPassword }
•	Token invalid -> show link không hợp lệ
•	Token expired -> show link hết hạn
Google Login
•	Có VITE_GOOGLE_CLIENT_ID thì Google button enabled
•	Click Google button khởi tạo Google Identity flow
•	Lấy response.credential làm idToken
•	Gửi POST /auth/google-login body { idToken, deviceName? }
•	Không fake login success
•	Không hardcode idToken
Refresh / Logout
•	Refresh chỉ gửi { refreshToken }
•	Logout chỉ gửi { refreshToken }
•	Logout không cần Authorization header
•	Refresh fail -> clear auth và redirect login
•	Logout clear auth state và storage
Route Guard
•	Chưa login vào /dashboard -> redirect login
•	Login rồi vào /login hoặc /dang-nhap -> redirect dashboard
•	/verify-email và /reset-password public accessible
•	Không còn employer/recruiter route
________________________________________
32. Acceptance Criteria Phase 1
Phase 1 chỉ được coi là pass khi toàn bộ điều kiện sau đúng:
API client dùng VITE_API_BASE_URL
AuthResponse flat được handle đúng
Login success redirect dashboard
Login fail hiển thị lỗi
Register gửi đúng body
Register conflict hiển thị lỗi
Register emailVerified=false hiển thị verify pending
Verify email route tiếng Anh và tiếng Việt đều hoạt động
Reset password route tiếng Anh và tiếng Việt đều hoạt động
Forgot password gọi API thật
Resend verification email gọi API thật
Google login enabled khi có VITE_GOOGLE_CLIENT_ID
Refresh gửi đúng body
Logout gửi đúng body
Route guard hoạt động
Không fake auth result
Không gọi Python service
Không có employer/recruiter auth
Không silent fail trên lỗi API
________________________________________
33. Deliverables Cần Báo Lại Sau Khi Làm Xong
Frontend dev cần báo lại:
Files tạo mới
Files sửa
API client nằm ở đâu
Auth service nằm ở đâu
Auth context/store nằm ở đâu
Token storage dùng keys nào
Route guard nằm ở đâu
Các route auth đã thêm
Google login đã real hay còn pending
Forgot password đã nối API chưa
Reset password đã nối API chưa
Verify email đã nối API chưa
Resend verification email đã nối API chưa
Register emailVerified=false xử lý thế nào
Login error display xử lý thế nào
Build/lint result
Known issues nếu có
________________________________________
34. Không Được Làm Trong Phase 1
Không làm CV API.
Không làm JD API.
Không làm Matching API.
Không làm Subscription API.
Không làm Interview API.
Không làm Realtime API.
Không làm employer/recruiter.
Không gọi Python service.
Không fake login success.
Không fake register success.
Không fake Google login.
Không hardcode token.
Không hardcode API base URL trong component.
Không log accessToken.
Không log refreshToken.
Không log password.
________________________________________
35. Ghi Chú Cuối
Phase 1 là nền móng cho toàn bộ frontend integration. Không làm chồng sang Phase 2 nếu Phase 1 chưa pass local test.
Sau khi Phase 1 pass, mới tiếp tục Phase 2: Dashboard + Profile + Subscription/Quota.
