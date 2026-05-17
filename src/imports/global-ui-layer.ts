Continue updating the existing INTER-VIET codebase.
DO NOT recreate the project.
DO NOT delete/rename existing pages or routes.
Preserve all screens, freemium/trial/premium logic, navigation.
Incremental updates only.
Vietnamese UI only. No placeholder text. No dead ends.

====================================================
GLOBAL HARD FIX – DROPDOWN & MODAL LAYER SYSTEM (MANDATORY)
====================================================

Problem: Dropdowns are rendered inside containers with overflow:hidden or low z-index.

Implement a global UI Layer system:

1) Add <div id="ui-layer" /> at root App level.
2) All dropdowns + popovers + modals MUST render via React Portal (createPortal) into #ui-layer.
3) #ui-layer must have:
   position: relative;
   z-index: 9999;

4) All dropdown panels:
   position: absolute OR fixed (based on anchor rect)
   z-index: 9999 (or >= 60 minimum)
   pointer-events: auto

5) DO NOT render dropdown inside any parent with overflow:hidden.
6) If any overlay blocks header clicks, ensure:
   - Topbar z-index: 10000
   - Or overlay pointer-events: none when inactive

Only one dropdown can be open at a time.

====================================================
A) HEADER – NOTIFICATION DROPDOWN (MUST WORK)
====================================================

Bell must be a <button> with onClick toggle.
No div click handlers.

Open behavior:
- Toggle dropdown via state
- Portal render to #ui-layer
- Click outside closes
- ESC closes
- 200–300ms animation (fade + slide)

Badge rules:
- Show red badge if unread > 0
- Hide if 0
- If >99 show “99+”
- If unread > 0 add subtle pulse animation to bell

Dropdown UI:
Title: “Thông báo”
Tabs: “Tất cả” / “Chưa đọc”

Each item:
- Bold title if unread
- Short description
- Time label (vừa xong / 2 giờ trước / hôm qua)
- Blue dot for unread

Actions:
- Click item:
  - mark as read instantly
  - decrease badge
  - navigate:
    report_ready -> /bao-cao
    limit_reminder -> /goi-dich-vu
    tips_cv -> /cv-matching
- “Đánh dấu tất cả là đã đọc”
  - mark all read
  - badge disappears
  - toast “Đã đánh dấu tất cả là đã đọc”

Persist notifications in:
localStorage key: interviet_notifications

Track events:
notification_open
notification_mark_all_read

====================================================
B) HEADER – ACCOUNT DROPDOWN (MUST WORK + DYNAMIC)
====================================================

Avatar area must be <button> with onClick toggle.
Portal render into #ui-layer.
Click outside + ESC closes.
Only one dropdown open at a time.

Header must use dynamic auth state:
- user.name (NOT hardcoded)
- user.email
- plan badge:
  “Miễn phí”
  “Dùng thử”
  “Premium”
  “Hết hạn”

Menu:
- Hồ sơ -> /cai-dat
- Cài đặt -> /cai-dat
- Gói dịch vụ -> /goi-dich-vu
- Divider
- Đăng xuất (danger)

Logout modal:
Title: “Bạn có chắc muốn đăng xuất?”
Text: “Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng hệ thống.”
Buttons: “Hủy” / “Đăng xuất”

Confirm:
- Clear auth state
- Clear notifications
- Navigate to /dang-nhap (SPA only, no reload)
- Toast “Đã đăng xuất”

Track event: logout

====================================================
C) LIVE INTERVIEW – STICKY ACTION BAR (CLEAR & LARGE)
====================================================

On /phong-van-live:

Remove small top buttons.
Create a sticky bottom action bar (always visible).

Layout:
- Full width sticky bottom
- Desktop: align right
- Mobile: stack vertical
- Height >= 56px
- Padding 12–16
- Large readable text

Buttons:

1) Outline/Danger:
   “Thoát phỏng vấn”
   icon: exit

2) Solid primary:
   “Kết thúc & tạo báo cáo ngay”
   icon: sparkle/report

Optional helper text:
“Demo nhanh — tạo báo cáo trong 2–3 giây”

Ensure:
- z-index above transcript
- not hidden by overflow

Exit modal:
Title: “Thoát phỏng vấn?”
Text: “Phiên phỏng vấn đang diễn ra sẽ kết thúc.”
Buttons: “Tiếp tục” / “Thoát”

Confirm:
navigate("/phong-van-setup")
toast “Đã thoát buổi phỏng vấn”
track: interview_end

Instant report modal:
Title: “Báo cáo tức thì?”
Text: “Hệ thống sẽ tạo báo cáo dựa trên phần trao đổi hiện tại.”
Buttons: “Tiếp tục” / “Nhận báo cáo”

Confirm:
- show processing screen 2–3s:
   “Đang phân tích nội dung…”
   “Đang đánh giá kỹ năng…”
   “Đang tổng hợp nhận xét…”
- navigate("/bao-cao")
- toast “Báo cáo đã sẵn sàng”
track:
interview_end
report_view

Timer must NOT block generation.

====================================================
D) INTERVIEW SETUP – MODEL AI AS SINGLE DROPDOWN
====================================================

Replace long list with ONE dropdown block.

Section:
Title: “Model AI”
Helper: “Chọn mô hình để cân bằng tốc độ và chất lượng phản hồi.”

Closed state shows:
Selected model + badge (Miễn phí/Premium)

Opened state groups:

Miễn phí:
- GPT-4o mini — Nhanh & tiết kiệm
- GPT-3.5 Turbo — Cơ bản, ổn định

Premium:
- GPT-4o — Chất lượng cao, phản biện sâu
- GPT-4o Realtime — Voice realtime, độ trễ thấp
- Claude 3 Opus — Lập luận mạnh
- Gemini 1.5 Pro — Ngữ cảnh dài
- Mixtral 8x7B — Tối ưu chi phí

Rules:
Free user:
- only free models selectable
- premium models show lock + “Premium”
- clicking locked opens upgrade modal
- does NOT change selection

Premium or Trial user:
- can select all

Persist:
localStorage key: interviet_selected_model
Sync global state.
Show summary:
“Model đã chọn: …”
Pass to /phong-van-live header:
“Model: …”

====================================================
E) UPGRADE – MUST STAY INSIDE APP
====================================================

Fix ALL upgrade CTAs:
- /goi-dich-vu
- /bang-gia
- Upgrade modal
- Banner “Nâng cấp ngay”

Rules:
- NO external href
- NO window.location
- Use navigate("/thanh-toan") or navigate("/goi-dich-vu")
- Keep SPA state intact

Track:
upgrade_open
upgrade_success

====================================================
F) TRIAL 7 NGÀY – MUST NOT RESET SESSION
====================================================

When clicking “Dùng thử 7 ngày miễn phí”:

DO NOT:
- clear auth
- reload
- navigate to /dang-nhap

ONLY:
- user.plan = "Trial"
- trialStartDate = now
- trialDaysLeft = 7
- trialActive = true
- persist to localStorage

Toast:
“Bắt đầu dùng thử Premium 7 ngày!”

Immediately:
- update top badge to “Dùng thử”
- unlock premium AI models
- unlock premium interview modes

Only navigate to /thanh-toan if user clicks “Nâng cấp ngay”

====================================================
G) FINAL TEST GUIDE (RETURN THIS)
====================================================

After update, return:

Cách test nhanh:

1) Click chuông -> dropdown mở, click ngoài đóng, ESC đóng, mark all read hoạt động.
2) Click avatar -> dropdown mở, logout modal hoạt động.
3) /phong-van-live -> sticky bottom bar rõ ràng, 2 nút lớn.
4) /phong-van-setup -> Model AI là 1 dropdown.
5) Upgrade không văng ra ngoài.
6) Dùng thử 7 ngày không reset đăng nhập, badge đổi ngay.