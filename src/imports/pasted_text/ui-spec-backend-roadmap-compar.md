Bạn hãy đọc toàn bộ UI/flow mocktest hiện tại của project INTER-VIET trong Figma Make và xuất ra tài liệu spec dạng text để backend C# kiểm tra roadmap 5 phase.

Chỉ phân tích UI/flow hiện có, không code.

Mục tiêu:
Backend C# đang làm theo các phase:
Phase 0 — Project Foundation
Phase 1 — Auth + JWT + Profile
Phase 2 — Resume Foundation + Python CV Parser
Phase 3 — Job Description + CV-JD Matching Foundation
Phase 4 — Dashboard + Usage + Activity
Phase 5 — Subscription + Billing + Quota Enforcement

Hãy kiểm tra UI mocktest hiện tại có khớp với từng phase không, phase nào đã đúng, phase nào còn thiếu, phase nào UI có nhưng backend chưa nên làm vội.

Yêu cầu output bằng tiếng Việt, rõ ràng, ưu tiên bảng text, không lan man.

PHẦN 1 — Tổng quan sản phẩm theo UI

Mô tả ngắn INTER-VIET trong UI đang là sản phẩm gì.

Các nhóm chức năng chính đang có trong sidebar/menu.

Ví dụ nếu có:
Bảng điều khiển
CV Matching
So khớp đa JD
Kết nối
Phỏng vấn
Báo cáo
Trợ giúp
Gói dịch vụ
Cài đặt

Với mỗi menu, ghi rõ mục đích business của nó.

PHẦN 2 — Đối chiếu Phase 0

Phase 0 backend là Project Foundation.

Kiểm tra UI có yêu cầu gì liên quan foundation không:
Routing
Layout
Theme
Multi-module
API groups
Health/diagnostic nếu có

Kết luận:
Phase 0 backend hiện tại cần những nền gì để support UI?
Nếu UI không thể hiện rõ thì ghi là không thấy trong UI.

PHẦN 3 — Đối chiếu Phase 1

Phase 1 backend là Auth + JWT + Profile.

Hãy kiểm tra UI có những flow nào liên quan:
Đăng ký
Đăng nhập
Google login
Logout
Profile cá nhân
Avatar
Thông tin ứng viên
Kỹ năng
Học vấn
Kinh nghiệm
Liên kết ngoài
Cài đặt tài khoản
Xác thực email nếu có
Quên mật khẩu nếu có

Output:
UI có gì
Backend cần có API gì
Backend Phase 1 đã làm đúng chưa theo UI
Còn thiếu gì nếu có

PHẦN 4 — Đối chiếu Phase 2

Phase 2 backend là Resume Foundation + Python CV Parser.

Kiểm tra UI liên quan CV:
Upload CV
Danh sách CV
CV active
Parse CV
Trạng thái xử lý CV
Reprocess CV
Download CV
Xóa CV
Xem dữ liệu parse
Tối ưu CV nếu có

Output:
UI yêu cầu gì
Backend Phase 2 cần API gì
Python parse cần trả gì
Backend Phase 2 đã đúng hướng chưa
Điểm nào UI có nhưng backend chưa cần làm ở Phase 2
Điểm nào nên để Phase sau

PHẦN 5 — Đối chiếu Phase 3

Phase 3 backend là Job Description + CV-JD Matching.

Kiểm tra UI liên quan:
Tạo JD
Danh sách JD
Sửa/xóa JD
Match CV với JD
Xem điểm phù hợp
Matched skills
Missing skills
Strengths
Weaknesses
Recommendations
Summary
Lịch sử match
So khớp đa JD nếu có

Output:
UI yêu cầu gì
Backend Phase 3 cần API gì
Python match cần trả gì
Backend Phase 3 đã đúng hướng chưa
So khớp đa JD nếu UI có thì ghi rõ nên để Phase nào, vì hiện backend mới đang single match foundation

PHẦN 6 — Đối chiếu Phase 4

Phase 4 backend là Dashboard + Usage + Activity.

Kiểm tra UI liên quan:
Dashboard tổng quan
Thống kê CV
Thống kê match
Hoạt động gần đây
Usage/quota hiện tại
Gói hiện tại
Progress bar usage
Onboarding progress nếu có
Thông báo nếu có

Output:
UI yêu cầu gì
Backend Phase 4 cần API gì
Các API dashboard nên trả những field gì
Backend Phase 4 đã đúng hướng chưa
Activity nào cần track
Usage/quota nào cần hiển thị

PHẦN 7 — Đối chiếu Phase 5

Phase 5 backend là Subscription + Billing + Quota Enforcement.

Đây là phần quan trọng nhất. Hãy đọc kỹ trang Gói dịch vụ.

Cần xuất rõ:

Danh sách gói:
Miễn phí
Gói Tháng
Gói Quý
Gói Năm

Với mỗi gói, ghi:
Plan key đề xuất
Tên hiển thị
Giá hiển thị
Chu kỳ thanh toán
Số tiền thanh toán thực tế mỗi kỳ
Mô tả ngắn
Badge nếu có
CTA button text

Quota theo từng gói:
Tối ưu CV
Phỏng vấn AI
Phỏng vấn với Mentor/người thật
So khớp đa JD nếu có
Kết nối nhà tuyển dụng/headhunter nếu có
Bất kỳ quota nào UI có

Với mỗi quota, ghi:
Free
Monthly
Quarterly
Yearly
Đơn vị là theo tài khoản, theo ngày, theo tháng, theo tuần hay không giới hạn

Feature availability theo từng gói:
Model AI
Loại nhà tuyển dụng & stress-test
Báo cáo phân tích
Phân tích kỹ năng giao tiếp
Xuất PDF
So sánh tiến bộ
So sánh benchmark ngành
Chọn mentor theo nhóm ngành
Lưu lịch sử không giới hạn
Hỗ trợ
Các feature khác nếu có

Với mỗi feature, ghi giá trị tương ứng từng gói.

PHẦN 8 — Mapping backend key đề xuất cho Phase 5

Từ UI, đề xuất backend keys ổn định:

Plan keys:
free
monthly
quarterly
yearly

Quota feature keys:
Ví dụ:
cv.optimization
interview.ai
mentor.session
multi_jd.match
headhunter.connection

Entitlement keys:
Ví dụ:
ai.model.tier
stress_test.types
analysis.report.level
communication.analysis
report.export_pdf
progress.comparison
industry.benchmark
mentor.choose_by_industry
history.retention
support.level

Với mỗi key, ghi kiểu dữ liệu đề xuất:
number
boolean
string
unlimited
period-based quota

PHẦN 9 — Subscription state và business rule

Dựa trên UI mocktest, hãy kiểm tra có thể suy ra các rule nào:

Free user có gì
User đang gói hiện tại hiển thị thế nào
Upgrade flow thế nào
Bấm Nâng cấp gói làm gì
Bấm Chọn Gói Tháng làm gì
Bấm Chọn Gói Quý làm gì
Bấm Chọn Gói Năm làm gì
Có trial không
Có giảm giá không
Có gói phổ biến nhất không
Có gói tiết kiệm nhất không
Có hủy gói không
Có gia hạn không
Có downgrade không
Có lịch sử thanh toán không
Có hóa đơn không
Có payment method không

Nếu UI chưa có flow nào thì ghi rõ là chưa có UI.

PHẦN 10 — Đề xuất thứ tự implementation backend

Dựa trên UI, hãy đề xuất backend nên làm theo thứ tự nào sau 5 phase:

Phase nào đã hợp lý
Phase nào cần bổ sung
Feature nào nên để sau
Feature nào không nên làm sớm
Payment gateway thật nên để phase nào
Mentor/interview nên để phase nào
So khớp đa JD nên để phase nào

PHẦN 11 — Kết luận kiểm tra 5 phase

Xuất bảng kết luận:

Phase
Backend scope hiện tại
UI có hỗ trợ không
Đúng hướng chưa
Thiếu gì
Nên làm tiếp gì

Các trạng thái dùng:
Đúng hướng
Cần bổ sung nhẹ
Chưa nên làm
Cần tách phase sau

PHẦN 12 — Output cuối cùng cho backend

Cuối tài liệu, hãy đưa ra 3 danh sách:

Backend Phase 5 bắt buộc phải làm ngay

Backend Phase 5 nên chuẩn bị nhưng chưa cần làm thật

Backend không nên làm trong Phase 5

Nhớ: Chỉ xuất spec text, không code.