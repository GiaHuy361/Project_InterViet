Continue updating the existing INTER-VIET codebase.
DO NOT recreate the project.
DO NOT delete/rename existing pages or routes.
Vietnamese UI only. No placeholder text. No dead ends.

CHỈ MỤC TIÊU:
Fix triệt để lỗi “văng ra ngoài / mở site public” khi bấm:
1) /goi-dich-vu -> nút “Nâng cấp Premium”
2) /tro-giup -> nút “Liên hệ hỗ trợ”
Không chỉnh các phần khác ngoài những gì cần thiết để chặn external navigation.

====================================================
A) /goi-dich-vu — “NÂNG CẤP PREMIUM” PHẢI ĐI NỘI BỘ (SPA) 100%
====================================================

1) Tìm đúng nút “Nâng cấp Premium” trên trang /goi-dich-vu (thường nằm trong card “Gói hiện tại”).
2) BẮT BUỘC thay implementation để nút là <button type="button"> hoặc Button component chuẩn, dùng router navigate nội bộ:
   - onClick => navigate("/thanh-toan")
3) TUYỆT ĐỐI KHÔNG dùng bất kỳ thứ nào sau cho nút này:
   - <a>, <Link> với href có “http”, “https”, “www”, domain
   - target="_blank"
   - window.location / window.open / document.location
4) Nếu hiện tại code đang là <a href="..."> hoặc Button asChild với <a>:
   - thay hoàn toàn bằng button + navigate, KHÔNG để lại href dù là "#".
5) Không reload, không reset auth, không mất session.

Kết quả mong đợi:
- Bấm “Nâng cấp Premium” -> chuyển route nội bộ tới /thanh-toan ngay lập tức, không mở tab mới, không rời app.

====================================================
B) /tro-giup — “LIÊN HỆ HỖ TRỢ” KHÔNG ĐƯỢC MỞ LINK NGOÀI
====================================================

Hiện tại nút “Liên hệ hỗ trợ” đang mở external/public site. Sửa thành flow nội bộ bằng modal.

1) Tìm section “Vẫn cần hỗ trợ?” ở cuối /tro-giup và nút “Liên hệ hỗ trợ”.
2) Thay nút thành <button type="button"> (hoặc Button) với onClick mở modal nội bộ (không có href).
3) Implement modal “Liên hệ hỗ trợ” ngay trong app:

Modal UI (tiếng Việt):
- Tiêu đề: “Liên hệ hỗ trợ”
- Mô tả: “Gửi yêu cầu, đội ngũ INTER-VIET sẽ phản hồi sớm nhất có thể.”
- Form:
  a) “Loại yêu cầu” (select):
     - Lỗi kỹ thuật
     - Tư vấn gói dịch vụ
     - Góp ý tính năng
     - Khác
  b) “Mô tả chi tiết” (textarea)
  c) “Email liên hệ” (input):
     - tự điền từ user.email nếu có
     - cho phép sửa
- Buttons:
  - “Hủy”
  - “Gửi yêu cầu”

Submit behavior:
- Validate:
  - Loại yêu cầu bắt buộc
  - Mô tả >= 10 ký tự
  - Email nếu có thì format hợp lệ
- Khi hợp lệ:
  - append item vào localStorage key: interviet_support_tickets
    item gồm: id, type, message, email, createdAt, page="/tro-giup"
  - Toast: “Đã gửi yêu cầu hỗ trợ”
  - Đóng modal

Modal interactions:
- Click outside đóng
- ESC đóng
- Animate 200–300ms
- Render bằng portal + z-index >= 90 (để không bị overflow hidden cắt)

Kết quả mong đợi:
- Bấm “Liên hệ hỗ trợ” -> mở modal ngay, không văng ra ngoài.

====================================================
C) CHỐNG “VĂNG RA NGOÀI” TRIỆT ĐỂ (SAFETY NET)
====================================================

Vì Make đôi khi còn sót link external ở đâu đó trong hai page, hãy thêm 1 lớp chặn an toàn chỉ áp dụng trong app shell:

1) Tạo utility handler “safeNavigate” dùng cho các CTA upgrade/support trong 2 page này:
- Nếu url bắt đầu bằng "http" hoặc chứa domain ngoài -> chặn, không điều hướng, toast lỗi:
  “Liên kết không hợp lệ. Vui lòng dùng điều hướng trong ứng dụng.”
- Nếu là route nội bộ (bắt đầu bằng "/") -> navigate(route)

2) Áp dụng safeNavigate cho:
- Nút “Nâng cấp Premium” trong /goi-dich-vu (route "/thanh-toan")
- Nút “Liên hệ hỗ trợ” trong /tro-giup (không navigate, chỉ mở modal)

3) Nếu phát hiện bất kỳ <a href="http..."> còn tồn tại trong 2 page:
- thay bằng button + safeNavigate hoặc button mở modal
- không để lại anchor external.

====================================================
D) KIỂM TRA NHANH SAU KHI SỬA (BẮT BUỘC PASS)
====================================================
1) /goi-dich-vu -> bấm “Nâng cấp Premium”:
   - URL không đổi domain
   - không mở tab mới
   - tới /thanh-toan
2) /tro-giup -> bấm “Liên hệ hỗ trợ”:
   - mở modal
   - gửi form -> toast “Đã gửi yêu cầu hỗ trợ”
   - không rời app

Chỉ trả về tóm tắt ngắn: đã sửa ở file/component nào và cách test 2 nút.