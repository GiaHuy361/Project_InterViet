FRONTEND PHASE 1 — API FOUNDATION + CANDIDATE AUTH INTEGRATION

Bối cảnh

INTER-VIET là nền tảng AI dành 100% cho ứng viên.

Frontend hiện đã cleanup employer/recruiter.
Không được tạo lại bất kỳ flow nào liên quan đến:
nhà tuyển dụng
employer
recruiter
headhunter
đăng tin tuyển dụng
employer login
recruiter dashboard
/nha-tuyen-dung
/employer

Backend C# đã sẵn sàng tại:

C# API base URL:
http://localhost:5000/api/v1

Swagger:
http://localhost:5000/swagger

Mục tiêu Phase 1

Chỉ làm nền API client + Auth candidate.

Phase này chỉ làm:
API client
Response envelope handler
Error handler
Auth service
Token handling
Route guard
Candidate login/register/logout/refresh
Candidate-only auth UI

Không làm trong Phase 1:
Không nối CV upload
Không nối JD
Không nối Matching
Không nối Subscription
Không nối Interview
Không nối Realtime voice
Không làm Payment
Không làm Mentor
Không làm Employer/Recruiter
Không gọi Python service trực tiếp
Không fake login

Python services:
http://localhost:8001
http://localhost:8002

Frontend không gọi Python trực tiếp trong Phase 1.

1. Environment

Tạo hoặc cập nhật file env frontend:

VITE_API_BASE_URL=http://localhost:5000/api/v1

Không hardcode base URL trong component.

2. API client structure

Tạo service layer theo convention hiện tại của project.

Nếu chưa có structure rõ, dùng gợi ý sau:

src/lib/api/apiClient.ts
src/lib/api/apiTypes.ts
src/lib/api/apiError.ts
src/services/authService.ts
src/stores/authStore.ts hoặc src/contexts/AuthContext.tsx tùy project đang dùng
src/hooks/useAuth.ts
src/components/auth/ProtectedRoute.tsx
src/components/auth/PublicOnlyRoute.tsx

Nếu project đang có structure khác thì giữ style hiện tại, không rewrite toàn bộ.

3. API response envelope

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

Hoặc ASP.NET ProblemDetails:

{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "email": ["Email is required"]
  },
  "traceId": "00-..."
}

Yêu cầu apiClient:
Luôn parse JSON an toàn
Nếu response.success === true thì trả data
Nếu response.success === false thì throw ApiError
Nếu là ProblemDetails thì convert sang ApiError
Nếu network error thì throw ApiError code = NETWORK_ERROR
Nếu response không phải JSON thì throw ApiError code = UNKNOWN_RESPONSE

Tạo type gợi ý:

type ApiEnvelope<T> = {
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

type ApiErrorShape = {
  status: number
  code: string
  message: string
  details?: unknown
  requestId?: string
}

4. HTTP status cần handle

400 Validation error
401 Unauthorized hoặc token expired
403 Forbidden hoặc quota/access denied
404 Not found
409 Conflict hoặc wrong state
429 Rate limit
500 Server error
503 Service unavailable

Mapping message frontend gợi ý:

400:
Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.

401:
Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.

403:
Bạn không có quyền thực hiện thao tác này hoặc đã vượt giới hạn gói hiện tại.

404:
Không tìm thấy dữ liệu.

409:
Trạng thái hiện tại không cho phép thao tác này. Vui lòng tải lại dữ liệu.

429:
Bạn thao tác quá nhanh. Vui lòng thử lại sau.

500:
Có lỗi hệ thống. Vui lòng thử lại.

503:
Dịch vụ AI hiện tạm thời không khả dụng. Vui lòng thử lại sau.

5. API client behavior

Tạo apiClient có các method:

apiClient.get<T>(url, options?)
apiClient.post<T>(url, body?, options?)
apiClient.put<T>(url, body?, options?)
apiClient.patch<T>(url, body?, options?)
apiClient.delete<T>(url, options?)
apiClient.upload<T>(url, formData, options?)

Yêu cầu:
Tự thêm Content-Type: application/json cho JSON request
Không set Content-Type thủ công khi gửi FormData
Tự thêm Authorization: Bearer <accessToken> nếu request cần auth
Có option skipAuth cho login/register/forgot-password
Có option rawResponse nếu cần download file sau này
Có xử lý 401 bằng refresh token

Pseudo behavior:

request()
  attach baseURL
  attach bearer token nếu có
  call fetch/axios
  nếu 401 và chưa retry:
    thử refresh token
    nếu refresh OK retry request cũ
    nếu refresh fail logout
  parse envelope
  return data hoặc throw ApiError

6. Auth endpoints cần nối

Dựa theo backend Swagger:

POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
POST /auth/google-login nếu UI có
POST /auth/forgot-password nếu UI có
POST /auth/reset-password nếu UI có
POST /auth/verify-email nếu UI có
GET /auth/sessions nếu UI có
DELETE /auth/sessions/{id} nếu UI có

Nếu Swagger field khác sample dưới đây thì bám Swagger, không tự bịa field.

7. Register request JSON mẫu

Frontend register form candidate gửi:

{
  "email": "candidate@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "fullName": "Nguyen Van A"
}

Nếu backend dùng firstName/lastName thay vì fullName thì map theo Swagger:

{
  "email": "candidate@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "firstName": "Van A",
  "lastName": "Nguyen"
}

Expected success response dạng:

{
  "success": true,
  "data": {
    "userId": "guid",
    "email": "candidate@example.com",
    "fullName": "Nguyen Van A",
    "emailVerified": false,
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token",
    "expiresAt": "2026-05-17T10:00:00Z"
  }
}

Nếu register backend không trả token mà yêu cầu login sau, frontend phải redirect sang login và show message đăng ký thành công.

8. Login request JSON mẫu

POST /auth/login

{
  "email": "candidate@example.com",
  "password": "Password123!"
}

Expected success response dạng:

{
  "success": true,
  "data": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token",
    "expiresAt": "2026-05-17T10:00:00Z",
    "user": {
      "userId": "guid",
      "email": "candidate@example.com",
      "fullName": "Nguyen Van A",
      "avatarUrl": null,
      "roles": ["Candidate"]
    }
  }
}

Frontend cần normalize response vì backend có thể trả user ở data.user hoặc trả flat fields.

Auth normalize rule:
accessToken lấy từ data.accessToken hoặc data.token
refreshToken lấy từ data.refreshToken nếu có
user lấy từ data.user hoặc build từ data fields
expiresAt lấy từ data.expiresAt nếu có

9. Refresh token request JSON mẫu

POST /auth/refresh

{
  "refreshToken": "refresh-token"
}

Hoặc nếu backend yêu cầu accessToken + refreshToken:

{
  "accessToken": "old-jwt-token",
  "refreshToken": "refresh-token"
}

Expected response:

{
  "success": true,
  "data": {
    "accessToken": "new-jwt-token",
    "refreshToken": "new-refresh-token",
    "expiresAt": "2026-05-17T11:00:00Z"
  }
}

Behavior:
Nếu refresh success thì cập nhật token store
Nếu refresh fail thì clear auth state và redirect /login

10. Logout request JSON mẫu

POST /auth/logout

Nếu backend cần refreshToken:

{
  "refreshToken": "refresh-token"
}

Nếu backend không cần body thì gửi empty body.

Sau logout:
Clear token
Clear current user
Redirect /login

11. Forgot password request JSON mẫu

POST /auth/forgot-password

{
  "email": "candidate@example.com"
}

Expected response:
Show message:
Nếu email tồn tại, hệ thống đã gửi hướng dẫn đặt lại mật khẩu.

Không leak email tồn tại hay không.

12. Reset password request JSON mẫu

POST /auth/reset-password

{
  "email": "candidate@example.com",
  "token": "reset-token",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}

Sau success:
Redirect /login
Show message đặt lại mật khẩu thành công

13. Verify email request JSON mẫu

POST /auth/verify-email

{
  "email": "candidate@example.com",
  "token": "verify-token"
}

Sau success:
Show verified state
Redirect dashboard hoặc login tùy auth state

14. Google login request JSON mẫu

POST /auth/google-login

{
  "idToken": "google-id-token"
}

Expected response giống login:

{
  "success": true,
  "data": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token",
    "expiresAt": "2026-05-17T10:00:00Z",
    "user": {
      "userId": "guid",
      "email": "candidate@gmail.com",
      "fullName": "Nguyen Van A",
      "avatarUrl": "https://...",
      "roles": ["Candidate"]
    }
  }
}

Nếu UI hiện chưa có Google login thì không cần tạo mới trong Phase 1.

15. Sessions APIs nếu UI có

GET /auth/sessions

Expected response:

{
  "success": true,
  "data": [
    {
      "sessionId": "guid",
      "deviceName": "Chrome on Windows",
      "ipAddress": "127.0.0.1",
      "createdAt": "2026-05-17T10:00:00Z",
      "lastSeenAt": "2026-05-17T10:30:00Z",
      "isCurrent": true
    }
  ]
}

DELETE /auth/sessions/{id}

Sau success:
Remove session khỏi list

Nếu UI không có session management, chỉ tạo service function, chưa cần screen.

16. Auth state shape

Tạo auth state dạng:

{
  "isAuthenticated": true,
  "isLoading": false,
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "expiresAt": "2026-05-17T10:00:00Z",
  "user": {
    "userId": "guid",
    "email": "candidate@example.com",
    "fullName": "Nguyen Van A",
    "avatarUrl": null,
    "roles": ["Candidate"]
  }
}

Tùy framework đang dùng:
React Context
Zustand
Redux
Existing store

Không introduce state library mới nếu project đã có convention.

17. Token storage strategy

Ưu tiên dùng convention hiện tại của project.

Nếu project chưa có:
Access token có thể lưu localStorage/sessionStorage theo hiện trạng frontend.
Refresh token cũng theo convention hiện tại.

Keys gợi ý:
interviet.accessToken
interviet.refreshToken
interviet.authUser
interviet.expiresAt

Yêu cầu bảo mật:
Không log token
Không log refreshToken
Không log full Authorization header
Không expose token trong UI
Clear token khi logout hoặc refresh fail

18. Candidate-only enforcement

Sau login, kiểm tra roles nếu backend trả roles.

Nếu roles có Employer/Recruiter nhưng không có Candidate:
Clear token
Show error:
Tài khoản này không được hỗ trợ trong phiên bản ứng viên.

Nếu backend không trả roles:
Mặc định coi là candidate user.

Không tạo employer switcher.
Không tạo role selection employer.
Không tạo redirect employer dashboard.

19. Route guard

Tạo ProtectedRoute:

Nếu auth đang loading:
show loading screen

Nếu chưa authenticated:
redirect /login?returnUrl=<current-path>

Nếu authenticated:
render children

Tạo PublicOnlyRoute:

Nếu authenticated:
redirect /dashboard

Nếu chưa authenticated:
render login/register

Protected routes phase 1 cần guard:
dashboard
profile
resumes
job-descriptions
matches
interviews
subscription
plans nếu cần login

Public routes:
/
login
register
forgot-password
reset-password
verify-email

20. Auth screens cần nối API thật

Login page:
Email
Password
Submit
Loading state
Invalid credentials error
Link forgot password
Link register

Register page:
Full name hoặc firstName/lastName theo UI
Email
Password
Confirm password
Submit
Validation
Redirect login/dashboard after success

Forgot password page nếu có:
Email
Submit
Success message

Reset password page nếu có:
Token từ URL
Email nếu cần
New password
Confirm password
Submit

Verify email page nếu có:
Token/email từ URL
Call verify endpoint
Show success/fail

Logout:
Button/menu action gọi logout API
Clear state regardless API failure nếu token invalid

21. Form validation frontend

Login:
email required
email format
password required

Register:
name required nếu field có
email required
email format
password required
confirmPassword match
password minimum basic check

Không duplicate quá nhiều backend validation.
Backend vẫn là source of truth.

22. Error display examples

Invalid login response:

{
  "success": false,
  "error": {
    "code": "Auth.InvalidCredentials",
    "message": "Email hoặc mật khẩu không đúng"
  }
}

UI show:
Email hoặc mật khẩu không đúng.

Validation response:

{
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Email": ["Email is required"],
    "Password": ["Password is required"]
  }
}

UI show field-level errors nếu map được.
Nếu không map được thì show summary.

401 response:
Clear auth state hoặc try refresh.
Nếu refresh fail:
Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.

503 response:
Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.

23. API service functions cần tạo

authService.register(payload)
authService.login(payload)
authService.refresh(payload)
authService.logout(payload?)
authService.googleLogin(payload)
authService.forgotPassword(payload)
authService.resetPassword(payload)
authService.verifyEmail(payload)
authService.getSessions()
authService.revokeSession(sessionId)
authService.getCurrentUser() nếu backend có endpoint me hoặc dùng profile service ở phase sau

apiClient.setAuthToken(token)
apiClient.clearAuthToken()

24. Không nối các module khác trong Phase 1

Trong Phase 1, các màn sau có thể giữ UI hiện tại nhưng chưa gọi API thật:

CV upload/list
JD
Matching
Subscription
Interview
Realtime

Tuy nhiên route guard phải hoạt động.
Nếu user vào các màn đó sau login, có thể hiển thị UI existing/mock hiện tại, nhưng không fake backend response mới.

Không xóa UI các màn này.
Chỉ không nối API trong Phase 1.

25. Loading states Phase 1

Auth initial load:
Khi app mở, kiểm tra token trong storage
Nếu có token:
set authenticated tạm thời
Có thể fetch profile/me nếu endpoint rõ
Nếu token hết hạn:
try refresh
Nếu refresh fail:
clear auth

Login submit:
button disabled
show spinner

Register submit:
button disabled
show spinner

Logout:
disable action hoặc show loading nhỏ

26. Acceptance criteria Phase 1

Phase 1 chỉ được coi là xong khi:

App đọc được VITE_API_BASE_URL
Login gọi backend thật
Register gọi backend thật nếu UI có
Logout hoạt động
Access token được attach vào authenticated request
401 refresh logic hoạt động hoặc logout an toàn
Route guard hoạt động
Candidate-only login/register
Không còn employer/recruiter auth entry
API errors hiển thị thân thiện
Build/lint pass nếu project có

27. Test checklist Phase 1

Test bằng backend local:

C# API:
http://localhost:5000/api/v1

Swagger:
http://localhost:5000/swagger

Checklist:

Register candidate mới
Login bằng candidate
Login sai mật khẩu
Logout
Reload page vẫn giữ auth nếu token còn hạn
Route /dashboard chưa login redirect /login
Route /login khi đã login redirect /dashboard
Gọi thử một authenticated endpoint với token
Token invalid thì logout hoặc refresh
Forgot password nếu UI có
Reset password nếu UI có
Verify email nếu UI có
Google login nếu UI có
Không còn employer login/signup
Không còn link recruiter/employer trong header/dropdown

28. Files deliverables cần báo lại

Sau khi làm xong, báo lại:

Files tạo mới
Files sửa
API client nằm ở đâu
Auth service nằm ở đâu
Auth store/context nằm ở đâu
Token lưu ở đâu
Route guard nằm ở đâu
Các auth endpoints đã nối
Các auth endpoints còn pending nếu UI không có
Env cần thêm
Cách chạy frontend local
Build/lint result
Known issues nếu có

29. Không được làm

Không làm CV API trong Phase 1
Không làm JD API trong Phase 1
Không làm Matching API trong Phase 1
Không làm Interview API trong Phase 1
Không làm Realtime API trong Phase 1
Không gọi Python service
Không fake login success
Không tạo employer route
Không tạo recruiter route
Không hardcode token
Không hardcode API base URL trong component
Không log accessToken/refreshToken

30. Final instruction

Hãy implement Phase 1 gọn, chắc, bám backend Swagger.

Mục tiêu là tạo nền API/Auth ổn định để các phase sau nối CV, Matching và Interview không bị lỗi dây chuyền.