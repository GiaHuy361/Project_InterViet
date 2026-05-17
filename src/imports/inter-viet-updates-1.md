Continue updating the existing INTER-VIET codebase.
DO NOT recreate the project.
DO NOT delete/rename existing pages or routes.
Keep current UI layout.
Only implement missing interactions and missing sections below.
Vietnamese UI only. No placeholder text.

PRIORITY: FIX WHAT IS CURRENTLY NOT WORKING/NOT APPEARING.
Do NOT do broad refactors.

====================================================
0) DIAGNOSE & FIX WIRING (IMPORTANT)
====================================================

Right now, bell icon and account area do not open anything, meaning the UI exists but lacks:
- click handlers
- dropdown components rendered
- open/close state + outside-click + ESC handling
- z-index/positioning (dropdown may render but hidden)

Fix by implementing a shared dropdown/popover system in the Topbar component:
- state: isNotificationsOpen, isAccountOpen
- anchored dropdown positioned under respective icon/avatar
- z-index above page content
- click outside closes
- ESC closes
- smooth 200–300ms animation

Ensure icons are wrapped in buttons with onClick.

====================================================
1) NOTIFICATIONS DROPDOWN MUST WORK (BELL CLICK)
====================================================

Implement Notification dropdown fully:

- Clicking bell toggles dropdown.
- Badge already shows “1” in screenshot; keep it.
- Dropdown content:
  Title “Thông báo”
  Tabs “Tất cả” / “Chưa đọc”
  List items (at least 3 seeded notifications) with:
    - title (bold if unread)
    - description
    - time label (vừa xong/2 giờ trước/hôm qua)
    - blue dot if unread
- “Đánh dấu tất cả là đã đọc” button works
- Clicking notification item:
   marks read immediately
   badge decreases immediately
   navigates to correct route
- Persist notifications state in localStorage.
- If dropdown is empty: show empty state message.

IMPORTANT VISUAL FIX:
- Ensure dropdown is visible: position absolute/fixed, correct right alignment, z-index high (e.g. 50+).
- Ensure clicking bell does NOT navigate away.

====================================================
2) ACCOUNT DROPDOWN MUST WORK (AVATAR/NAME CLICK)
====================================================

Implement Account dropdown:

- Clicking avatar/name area toggles dropdown.
- Dropdown shows dynamic user info from auth state:
   user.name (NOT hardcoded top1latao)
   user.email
   plan badge (Miễn phí / Premium / Trial / Expired)

Menu items:
- Hồ sơ → Settings/Profile section (or Settings)
- Cài đặt → Settings
- Gói dịch vụ → Subscription/Pricing
- Divider
- Đăng xuất (danger)

Logout flow:
- Confirm modal: “Bạn có chắc muốn đăng xuất?”
- Confirm:
   clear auth state
   clear notifications state (demo)
   navigate to Landing/Login
   toast “Đã đăng xuất”

Also:
- click outside closes
- ESC closes
- z-index correct

====================================================
3) INTERVIEW SETUP MUST HAVE “CHỌN MÔ HÌNH AI”
====================================================

On /phong-van-setup page:
Add a new section BEFORE “Chọn nhà tuyển dụng AI”:

Section title: “Chọn mô hình AI”
Description: “Chọn mô hình phù hợp cho chất lượng và tốc độ phản hồi”

Selectable model cards (radio style):
FREE:
- GPT-4o mini — “Nhanh & tiết kiệm”
- GPT-3.5 Turbo — “Cơ bản, ổn định”

PREMIUM LOCK:
- GPT-4o — “Chất lượng cao, phản biện sâu”
- GPT-4o Realtime — “Voice realtime, độ trễ thấp”
- Claude 3 Opus — “Lập luận mạnh”
- Gemini 1.5 Pro — “Ngữ cảnh dài”
- Mixtral 8x7B — “Tối ưu chi phí”

Rules:
- Free user can select only FREE models.
- Clicking locked model opens Upgrade modal (do not switch).
- Premium can select any.

Persist selected model in localStorage + global state.
Show selected model summary near bottom on Setup:
“Model đã chọn: …”

Ensure “Tiếp tục” button validates:
- must have a selected model (default to GPT-4o mini if none)
- pass model choice forward to pre-call/live interview state.

====================================================
4) LIVE INTERVIEW MUST HAVE EXIT + INSTANT REPORT BUTTONS
====================================================

On /phong-van-live page (Live Interview):

Add always-visible controls (top-right or bottom sticky):
A) Primary/outline: “Thoát phỏng vấn”
B) Secondary: “Kết thúc & tạo báo cáo ngay”

A) Exit Button behavior:
- Click → confirm modal:
  Title: “Thoát buổi phỏng vấn?”
  Text: “Phiên phỏng vấn đang diễn ra sẽ kết thúc.”
  Buttons: “Tiếp tục phỏng vấn” / “Thoát”
- Confirm → navigate back to /phong-van-setup
- Toast: “Đã thoát buổi phỏng vấn”

B) Instant report behavior:
- Click → confirm modal:
  Title: “Kết thúc buổi phỏng vấn?”
  Desc: “Hệ thống sẽ tạo báo cáo dựa trên phần trao đổi hiện tại.”
  Buttons: “Tiếp tục phỏng vấn” / “Tạo báo cáo”
- Confirm:
  navigate to a short processing view (2–3 seconds max):
    “Đang phân tích…”
    cycling lines:
      “Đang phân tích nội dung trả lời…”
      “Đang đánh giá mức độ tự tin…”
      “Đang tổng hợp nhận xét…”
  then auto navigate to report detail page with a realistic report generated.

Timer must NOT block report generation.

Also show selected model in live header:
“Model: GPT-4o mini” (or selected)
“Chế độ: HR cơ bản” (selected interviewer)

====================================================
5) DASHBOARD MUST SHOW 4-STEP “BẮT ĐẦU NHANH”
====================================================

On /dashboard:
Add a new section above the 3 main cards:

Title: “Bắt đầu hành trình chinh phục công việc”
Subtitle: “Chỉ 4 bước để chuẩn bị hồ sơ và luyện phỏng vấn hiệu quả cùng AI”

4 cards original INTER-VIET style:
- step background number 01–04
- hover lift + glow
- completion badge “Hoàn thành” when done
- progress line fills with completion %

Steps:
01 Tải CV → /cv-matching (complete when cv_upload exists)
02 Thêm JD → /cv-matching (complete when jd_analyze exists)
03 Luyện phỏng vấn → /phong-van-setup (complete when interview_end exists)
04 Xem báo cáo → /bao-cao (complete when report_view exists)

Use existing event tracker/localStorage to detect completion.
Do not hardcode completion.

====================================================
DELIVERABLE CHECKLIST (MUST PASS)
====================================================

- Clicking bell opens a visible dropdown (not hidden).
- Clicking avatar/name opens a visible dropdown (not hidden).
- /phong-van-setup shows “Chọn mô hình AI”.
- /phong-van-live has “Thoát phỏng vấn” and “Kết thúc & tạo báo cáo ngay” with modals.
- /dashboard shows 4-step section.
- Vietnamese UI.
- No broken routes.
Return a short “Where to click to test” list.