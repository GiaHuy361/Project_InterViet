Sửa lại flow pricing bên ỨNG VIÊN cho logic và đồng bộ hoàn toàn với pricing mới. Hiện tại vẫn còn text và hành vi cũ, cần fix triệt để.

NHỮNG LỖI CẦN SỬA NGAY
1) Xóa toàn bộ wording cũ như:
- “Premium”
- “Nâng cấp Premium”
- các quyền lợi cũ không còn thuộc pricing mới
- các nội dung cũ như “Headhunter”, “Thăng tiến với AI đánh giá” nếu không nằm trong chính sách giá mới hiện tại

2) Nút “Xem bảng giá” ở trang /goi-dich-vu hiện không logic.
- Vì user đang ở đúng trang gói dịch vụ rồi, KHÔNG dùng modal cho nút này.
- Hãy đổi hành vi nút “Xem bảng giá” thành 1 trong 2 cách hợp lý:
  a) scroll mượt xuống section “Bảng so sánh gói”
  HOẶC
  b) mở rộng ngay bên dưới thành section pricing cards + comparison table
- Không để nút bấm mà không có action.

3) Khối “Nâng cấp để mở khóa thêm” hiện quá chung chung và sai logic.
- Bỏ khối generic này.
- Thay bằng section rõ ràng tên:
  “Các gói phù hợp với bạn”
- Hiển thị 3 card nâng cấp rõ ràng: Tháng / Quý / Năm
- Không hiển thị “Premium” chung chung nữa.

YÊU CẦU UX LOGIC MỚI CHO TRANG /GOI-DICH-VU
A. Bố cục hợp lý hơn:
1. Card đầu:
- “Gói hiện tại”
- tên gói hiện tại
- badge gói
- mô tả ngắn
- tính năng hiện tại
- quota còn lại hôm nay / tuần / tháng tùy gói
- nếu là free thì có CTA:
  “Nâng cấp gói”
  và phụ CTA nhỏ:
  “Xem bảng so sánh”

2. Ngay bên dưới:
- Section “Các gói nâng cấp”
- Hiển thị 3 pricing cards:
  + Gói Tháng
  + Gói Quý [badge: Phổ biến nhất]
  + Gói Năm [badge: Tiết kiệm nhất]
- Free là gói hiện tại thì không cần đưa thành card mua nữa, chỉ hiển thị ở card summary phía trên

3. Bên dưới nữa:
- Section “Bảng so sánh chi tiết”
- So sánh Miễn phí / Tháng / Quý / Năm

B. Hành vi CTA phải logic:
1. “Nâng cấp Premium” -> đổi toàn bộ thành:
- “Nâng cấp gói”
hoặc
- “Chọn gói phù hợp”

2. Nút trên từng card:
- Tháng: “Chọn gói Tháng”
- Quý: “Chọn gói Quý”
- Năm: “Chọn gói Năm”

3. Nếu user đang ở free:
- CTA chính ở card đầu: “Nâng cấp gói”
- Khi bấm thì scroll tới section “Các gói nâng cấp”

4. Nếu user đang ở Tháng:
- Card Tháng hiện “Gói hiện tại”
- Card Quý/Năm có nút đổi gói
- Không được hiện CTA mua lại chính gói đang dùng

5. Nếu user đang ở Quý:
- Card Quý hiện “Gói hiện tại”
- Card Năm có nút nâng cấp
- Card Tháng có thể là “Hạ xuống gói Tháng” trong trang quản lý gói, nhưng không nên làm CTA chính nổi bật

6. Nếu user đang ở Năm:
- Card Năm hiện “Gói hiện tại”
- Không hiện lời mời nâng cấp generic nữa

C. Sửa nội dung để khớp pricing mới 100%
GÓI MIỄN PHÍ
- 3 lần tối ưu CV miễn phí
- xem quảng cáo để thêm lượt
- 1 phiên phỏng vấn AI
- Model AI basic
- Báo cáo rút gọn
- Hỗ trợ qua email

GÓI THÁNG — 149.000đ/tháng
- 3 lần/ngày tối ưu CV
- 1 lần/ngày phỏng vấn AI
- đầy đủ 6 loại nhà tuyển dụng & stress-test
- Model AI ổn định
- Báo cáo phân tích toàn diện
- Phân tích kỹ năng giao tiếp
- Xuất PDF
- So sánh tiến bộ
- So sánh benchmark ngành
- Không có mentor/người thật

GÓI QUÝ — 129.000đ/tháng, thanh toán 387.000đ/3 tháng
- badge: Phổ biến nhất
- gồm toàn bộ gói Tháng, cộng thêm:
- 5 lần/ngày tối ưu CV
- 3 lần/ngày phỏng vấn AI
- Model AI cao cấp
- Mentor/người thật: tối đa 3 lần/tháng
- Priority Support

GÓI NĂM — 109.000đ/tháng, thanh toán 1.308.000đ/năm
- badge: Tiết kiệm nhất
- gồm toàn bộ gói Quý, cộng thêm:
- Không giới hạn tối ưu CV
- Không giới hạn phỏng vấn AI
- Mentor/người thật: 1 lần/tuần
- được chọn mentor theo nhóm ngành
- lưu lịch sử, video, tiến trình không giới hạn thời gian
- hỗ trợ ưu tiên 24/7 cao nhất

D. Fix microcopy cho chuẩn
Thay các text mơ hồ bằng text cụ thể:
- “Nâng cấp Premium” -> “Nâng cấp gói”
- “Xem bảng giá” -> “Xem bảng so sánh”
- “Nâng cấp để mở khóa thêm” -> “Các gói phù hợp với bạn”
- “Free” badge -> “Miễn phí”
- “Premium” badge -> bỏ hoàn toàn

E. Fix interaction thật sự, không chỉ sửa text
- Tất cả CTA phải hoạt động
- Không để button chết
- Nếu dùng anchor scroll thì phải scroll đúng tới section pricing comparison
- Nếu dùng expand/collapse thì phải mở đúng section
- Không dùng modal ở trang /goi-dich-vu cho hành động “Xem bảng so sánh”
- Modal chỉ giữ cho paywall trong các feature bị khóa ở chỗ khác trong app

F. Dọn sạch nội dung pricing cũ
Hãy tìm và thay toàn bộ mọi text cũ còn sót lại trong candidate flow:
- Premium
- Headhunter
- Thăng tiến với AI đánh giá
- các quyền lợi cũ không còn thuộc pricing mới
- các CTA cũ không còn khớp logic gói mới

KẾT QUẢ MONG MUỐN
Trang /goi-dich-vu phải có logic rõ ràng:
- phần trên = gói hiện tại + quota hiện tại
- phần giữa = các gói có thể nâng cấp
- phần dưới = bảng so sánh chi tiết
- CTA nào cũng hoạt động
- không còn chữ “Premium”
- không còn content pricing cũ
- toàn bộ wording đồng bộ với pricing mới của ứng viên