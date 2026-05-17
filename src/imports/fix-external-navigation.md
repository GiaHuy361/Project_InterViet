Continue updating the existing INTER-VIET codebase.
DO NOT recreate the project.
DO NOT delete/rename existing pages or routes.
Preserve current auth + freemium/trial/premium logic and navigation.
Vietnamese UI only. No placeholder text. No dead ends.

MỤC TIÊU DUY NHẤT
Fix triệt để lỗi: bấm “Dùng thử 7 ngày miễn phí” và “Nâng cấp Premium” bị văng ra ngoài (mở site public / tab mới / reload).
Tất cả hành vi phải ở trong app (SPA) và KHÔNG reset đăng nhập.

====================================================
1) QUÉT & CHẶN TẤT CẢ ĐIỀU HƯỚNG RA NGOÀI (ROOT CAUSE)
====================================================

1.1) Tìm và sửa toàn bộ chỗ dùng external navigation:
- <a href="https://...">, href trỏ domain ngoài
- window.location / location.href / window.open
- form submit gây reload
- Button/Link component có prop href nhưng lại trỏ URL ngoài
- onClick có gọi reload/redirect

=> THAY TẤT CẢ bằng router navigation nội bộ (navigate/push) và tuyệt đối KHÔNG mở tab mới.

1.2) Bắt buộc: mọi CTA upgrade/trial chỉ được phép:
- navigate('/thanh-toan') HOẶC navigate('/goi-dich-vu') HOẶC navigate('/bang-gia')
(tùy màn hình hiện có của hệ thống, nhưng luôn là route nội bộ)

====================================================
2) FIX “DÙNG THỬ 7 NGÀY MIỄN PHÍ” (KHÔNG VĂNG, KHÔNG RESET)
====================================================

Khi người dùng bấm “Dùng thử 7 ngày miễn phí” ở BẤT KỲ đâu (Dashboard banner, /bang-gia, modal, /goi-dich-vu):
- TUYỆT ĐỐI KHÔNG:
  + window.location / href ngoài
  + reload trang
  + clear auth/localStorage user
  + điều hướng sang /dang-nhap
  + mở tab mới

- CHỈ ĐƯỢC:
  + cập nhật trạng thái gói trong auth/user state:
      user.plan = 'Trial' (hoặc đúng schema hiện có)
      user.trialStartDate = now
      user.trialEndsAt = now + 7 ngày
      user.trialDaysLeft = 7
  + persist vào localStorage cùng key auth/user đang dùng
  + cập nhật UI ngay lập tức (plan badge đổi thành “Dùng thử”)
  + toast: “Bắt đầu dùng thử Premium 7 ngày!”
  + KHÔNG tự động navigate đi đâu cả (đứng nguyên trang hiện tại)

Nếu cần nút “Nâng cấp ngay” riêng thì nút đó mới navigate nội bộ tới /thanh-toan (không tự chạy khi start trial).

====================================================
3) FIX “NÂNG CẤP PREMIUM” (KHÔNG VĂNG, CHỈ ĐI NỘI BỘ)
====================================================

Khi bấm “Nâng cấp Premium” / “Nâng cấp ngay” ở mọi nơi:
- Không được dùng <a href> external, không window.location, không open new tab.
- Chỉ được navigate nội bộ:
   ưu tiên navigate('/thanh-toan')
   nếu hệ thống đang dùng trang trung gian thì navigate('/goi-dich-vu')

Bắt buộc giữ nguyên session:
- Không clear auth state
- Không reset user name/email
- Không đăng nhập lại
- Không reload

====================================================
4) AUDIT CỤ THỂ CÁC VỊ TRÍ HAY LỖI (BẮT BUỘC SỬA HẾT)
====================================================

Sửa tất cả CTA trong các trang/điểm sau để không văng:
- /dashboard:
  + nút “Dùng thử 7 ngày miễn phí”
  + nút “Nâng cấp Premium”
  + nút “Xem bảng giá” (navigate '/bang-gia')
- /bang-gia:
  + nút “Dùng thử 7 ngày miễn phí”
  + nút “Nâng cấp ngay”
- /goi-dich-vu:
  + nút “Nâng cấp Premium”
- Upgrade modal ở bất kỳ đâu:
  + CTA “Nâng cấp ngay”
  + CTA “Dùng thử 7 ngày miễn phí” (nếu có)
- Bất kỳ banner/toast có nút “Nâng cấp ngay”

====================================================
5) THÊM LỚP “SAFETY GUARD” ĐỂ KHÔNG CÒN VĂNG NẾU SÓT 1 LINK
====================================================

Trong App Shell / Layout root:
- Intercept click trên toàn app đối với thẻ <a>:
  Nếu href bắt đầu bằng http(s) (domain ngoài) và text/label thuộc nhóm upgrade/trial
  => preventDefault + chạy logic nội bộ tương ứng:
     - “Dùng thử 7 ngày miễn phí” => chạy startTrial() (không navigate)
     - “Nâng cấp Premium/Nâng cấp ngay” => navigate('/thanh-toan')
     - “Xem bảng giá” => navigate('/bang-gia')

Mục tiêu: dù còn sót 1 href ngoài, app cũng không được phép văng.

====================================================
6) TEST SAU KHI SỬA (BẮT BUỘC PASS)
====================================================

- Vào /dashboard => bấm “Dùng thử 7 ngày miễn phí”:
  + không mở tab, không đổi domain, không reload, không về login
  + chỉ hiện toast + badge “Dùng thử” cập nhật ngay

- Vào /bang-gia => bấm “Dùng thử 7 ngày miễn phí”:
  + không văng ra ngoài, không reload
  + vẫn giữ user đang đăng nhập

- Vào /goi-dich-vu => bấm “Nâng cấp Premium”:
  + chuyển nội bộ tới /thanh-toan (hoặc /goi-dich-vu nếu đó là flow)
  + không văng ra ngoài