Continue updating the existing INTER-VIET codebase.
DO NOT recreate the project.
DO NOT delete/rename existing pages or routes.
Preserve all existing screens, freemium/trial/premium logic, and current navigation.
Make incremental upgrades only.
Entire UI must be Vietnamese.
No placeholder text.
No dead ends.
No external redirects.

MAIN GOAL
Finalize INTER-VIET so it feels like a real shipped SaaS:
production-grade UX polish, consistent design system, realistic flows, strong conversion,
fully working header interactions, immersive interview with AI face,
instant demo-friendly report generation, and professional behavior.

====================================================
0) MUST: FIX “TRỢ GIÚP” (NO EXTERNAL JUMP)
====================================================

- Ensure “Trợ giúp” always routes internally inside the authenticated app shell (sidebar + topbar stays).
- Remove any external URL / public-site redirect / target=_blank behavior.
- Keep route as internal (e.g. /tro-giup).
- Add CTA “Quay lại Dashboard” on Help Center.
- Navigating to Help must NOT reset auth session.

====================================================
A) HEADER INTERACTIONS – PRODUCTION LEVEL
====================================================

A1) Notification Bell + Badge + Read Logic
- Bell icon clickable.
- Red badge shows unread count.
- >99 → show “99+”.
- If 0 → hide badge completely.
- When unread > 0 → subtle pulse/highlight animation.

Dropdown panel:
- Title: “Thông báo”
- Tabs: “Tất cả” / “Chưa đọc”
- Item:
  - Bold title if unread
  - Short description
  - Time label (vừa xong/2 giờ trước/hôm qua)
  - Blue unread dot

Interactions:
- Click item → mark as read → remove dot → decrease badge instantly → navigate correctly:
  - Report-ready → Báo cáo
  - Limit reminder → Gói dịch vụ
  - Tip/help → Trợ giúp hoặc CV
- Add “Đánh dấu tất cả là đã đọc”
  → all read, remove all dots, badge=0, hide badge
  → toast: “Đã đánh dấu tất cả là đã đọc”
- Empty state:
  “Bạn chưa có thông báo nào” + subtext
- Persist state in localStorage.
- Click outside + ESC closes dropdown.
- 200–300ms animation.

A2) Account Dropdown + Logout (DYNAMIC USER, NO HARDCODE)
IMPORTANT:
- DO NOT hardcode any username (e.g. “top1latao”).
- Must use authenticated user state: user.name, user.email, user.plan.

Avatar/name clickable → dropdown.

Header shows dynamically:
- user.name
- user.email
- user.plan badge: Miễn phí / Premium / Trial / Expired

Menu:
- Hồ sơ → Settings/Profile
- Cài đặt → Settings
- Gói dịch vụ → Subscription/Pricing
- Divider
- Đăng xuất (danger)

Logout:
- Confirm modal: “Bạn có chắc muốn đăng xuất?”
- On confirm:
  - Clear auth state
  - Clear notification state
  - Navigate to Landing/Login
  - Toast: “Đã đăng xuất”

If logged out:
- Hide dropdown.
- Protected routes redirect to Login.

====================================================
B) DASHBOARD – “BẮT ĐẦU NHANH” (4 BƯỚC, INTER-VIET ORIGINAL STYLE)
====================================================

Add a new section on Dashboard above main action cards.

Title:
“Bắt đầu hành trình chinh phục công việc”

Subtitle:
“Chỉ 4 bước để chuẩn bị hồ sơ và luyện phỏng vấn hiệu quả cùng AI”

Design (ORIGINAL INTER-VIET, not copied):
- 4 cards row (responsive).
- Subtle brand gradient border glow (xanh→tím), soft shadow.
- Large background step number (01/02/03/04) semi-transparent inside each card.
- Small label: “BƯỚC 01”, “BƯỚC 02”, etc.
- Hover: card lifts + border glow.
- Completed: check icon + badge “Hoàn thành”.

Steps:
BƯỚC 01: “Tải CV của bạn”
- Desc: “Thêm CV để AI phân tích cấu trúc và tối ưu theo chuẩn tuyển dụng Việt Nam.”
- CTA: “Tối ưu CV”
- Route: /cv-matching
- Complete if: user has uploaded CV (use existing state/event).

BƯỚC 02: “Thêm mô tả công việc (JD)”
- Desc: “So khớp kỹ năng của bạn với yêu cầu tuyển dụng cụ thể.”
- CTA: “So khớp JD”
- Route: /cv-matching
- Complete if: user has analyzed at least 1 JD.

BƯỚC 03: “Luyện phỏng vấn cùng AI”
- Desc: “Thực hành hội thoại liên tục theo vị trí và cấp độ mong muốn.”
- CTA: “Bắt đầu phỏng vấn”
- Route: /phong-van-setup
- Complete if: user has finished at least 1 interview session.

BƯỚC 04: “Xem báo cáo & cải thiện”
- Desc: “Nhận phân tích chi tiết và theo dõi tiến bộ qua từng buổi.”
- CTA: “Xem báo cáo”
- Route: /bao-cao
- Complete if: user has viewed at least 1 report.

Add progress line under cards that fills as steps complete (0–100%).
Persist completion via existing tracker/localStorage.

====================================================
C) INTERVIEW SETUP – ADD “CHỌN MÔ HÌNH AI” (ALL MODELS LISTED)
====================================================

In Interview Setup page, before Pre-call and before Live Interview:
Add section: “Chọn mô hình AI”

Use selectable radio cards with badges and descriptions.
List ALL model options clearly:

FREE AVAILABLE:
1) GPT-4o mini — “Nhanh & tiết kiệm”
2) GPT-3.5 Turbo — “Cơ bản, ổn định”

PREMIUM LOCKED (Free click opens Upgrade modal):
3) GPT-4o — “Chất lượng cao, phản biện sâu”
4) GPT-4o Realtime (Voice-to-Voice) — “Độ trễ thấp, hội thoại realtime”
5) Claude 3 Opus — “Lập luận mạnh, câu hỏi sắc bén”
6) Gemini 1.5 Pro — “Ngữ cảnh dài, xử lý JD dài”
7) Mixtral 8x7B — “Nhanh, tối ưu chi phí (open-source)”

Rules:
- Free users can select only FREE models.
- Clicking locked model opens Upgrade modal (do not switch).
- Premium users can select any.
- Persist selected model in localStorage/global state.
- Default:
  - Free → GPT-4o mini
  - Premium → GPT-4o

Show selected model summary on:
- Pre-call screen
- Live interview header
- Report metadata (“Model sử dụng: …”)

====================================================
D) LIVE INTERVIEW – IMMERSIVE AI FACE + INSTANT REPORT
====================================================

D1) AI Face / Avatar Card
On Live Interview screen add AI interviewer card:
- Circular AI avatar illustration
- Label: “Nhà tuyển dụng AI”
- Mode label (HR cơ bản/HR khó tính…)
- Status chip: “Đang nói” / “Đang nghe” / “Đang suy nghĩ”

D2) Speaking/Listening/Thinking Animations
When “Đang nói”:
- Pulsing ring + animated waveform
- Transcript auto-appends AI message

When “Đang nghe”:
- Waveform smaller + mic listening indicator

When “Đang suy nghĩ”:
- 3-dot typing + small spinner

Default:
- AI speaks first 2–3 seconds, then listening.
- Continuous transcript (no Q1/Q2, no next question).

D3) Exit Button
Always visible “Thoát phỏng vấn”
- Confirm modal:
  “Thoát buổi phỏng vấn?” + warning text
- Confirm → back to Interview Setup
- Toast: “Đã thoát buổi phỏng vấn”

D4) Instant Demo Report (NO WAIT FULL DURATION)
Add always-visible secondary button:
“Kết thúc & tạo báo cáo ngay”

- Confirm modal:
  Title: “Kết thúc buổi phỏng vấn?”
  Desc: “Hệ thống sẽ tạo báo cáo dựa trên phần trao đổi hiện tại.”
  Buttons: “Tiếp tục phỏng vấn” / “Tạo báo cáo”

On confirm:
- End session immediately.
- Show processing screen MAX 2–3 seconds:
  “Đang phân tích…” + spinner + cycling texts.
- Then auto navigate to Report page with a full realistic report.
- Toast: “Báo cáo đã sẵn sàng”
Timer still runs visually but MUST NOT block report.
If session < 60s add small note:
“Báo cáo được tạo dựa trên phiên phỏng vấn rút gọn.”

====================================================
E) REAL SAAS POLISH – FULL SYSTEM (KEEP INCREMENTAL)
====================================================

- Consolidate design system components for consistency.
- Add skeleton loaders where needed.
- Add route-level friendly error boundaries + “Tải lại”.
- Keep Command Palette (Ctrl/Cmd+K) and global search working.
- Ensure all pages remain intact and no routes break.

====================================================
DELIVERABLE
====================================================

- “Trợ giúp” stays inside app (no external jump).
- Notifications dropdown + badge + mark all read works and persists.
- Account dropdown uses dynamic logged-in user (no hardcoded username).
- Dashboard has original INTER-VIET 4-step “Bắt đầu nhanh” section with completion logic.
- Interview Setup includes AI model selection with Free/Premium gating and full model list.
- Live Interview has AI face states + exit + instant report generation (2–3s).
- Vietnamese UI everywhere; no broken routes; no dead ends.
Return a concise summary of changes and where to click to test each.