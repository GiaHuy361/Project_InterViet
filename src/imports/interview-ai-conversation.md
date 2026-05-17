Continue from the existing INTER-VIET codebase. Do NOT recreate or restructure the whole project. Keep all current pages, routing, state logic, freemium model, and UI system.

This update focuses ONLY on redesigning the Mock Interview feature to match the original product vision.

==================================================
CRITICAL CHANGE: INTERVIEW EXPERIENCE LOGIC
==================================================

The current interview flow is question-by-question (predefined Q1, Q2, Q3 structure). This is incorrect.

Replace it with:

A continuous AI conversation session that simulates a real HR interviewer talking naturally with the candidate.

There must NOT be a visible list of predefined questions.
There must NOT be separate “Next Question” logic.

It should feel like one live, flowing conversation session.

==================================================
NEW INTERVIEW EXPERIENCE STRUCTURE
==================================================

1) Interview Setup Page
User selects:
- Vị trí ứng tuyển
- Cấp độ (Intern / Junior / Mid / Senior)
- Mục tiêu buổi phỏng vấn (Phản xạ / STAR / Tự tin)
- Thời lượng (5 / 10 / 20 phút)

Interviewer Mode (NEW):
User chooses interviewer personality:

Free mode:
- HR cơ bản

Premium modes:
- HR khó tính (Stress-test)
- Trưởng phòng kỹ thuật
- Nhà tuyển dụng startup
- Nhà tuyển dụng tập đoàn
- Phỏng vấn theo ngành chuyên sâu

Locked Premium modes show badge + upgrade modal.

==================================================
2) LIVE INTERVIEW SESSION (REBUILT)
==================================================

This must behave like ONE CONTINUOUS SESSION.

UI requirements:
- AI avatar speaking naturally
- Live transcript scrolling automatically
- Microphone waveform animation
- Timer counting total session duration
- No question numbers
- No segmented cards per question
- No “Next” button

AI interaction model (UI simulation only):
- AI speaks first (introduces itself naturally)
- Conversation flows dynamically
- Transcript shows back-and-forth messages like chat but in real-time voice style
- Candidate can interrupt (optional visual)
- End session anytime

Before session:
Add a Pre-call screen:
- Kiểm tra micro
- Hướng dẫn môi trường yên tĩnh
- CTA: “Bắt đầu phỏng vấn”

==================================================
3) REPORT LOGIC UPDATE
==================================================

Report must analyze:
- Overall communication ability
- Confidence level
- Response structure
- Depth of answers
- Speaking speed
- Filler words
- Emotional stability

Remove any logic that scores per individual question.
Score must be based on entire session performance.

Add:
- “Nhận xét tổng thể từ nhà tuyển dụng”
- “Ấn tượng cuối cùng”

==================================================
4) PREMIUM PRICING UPDATE
==================================================

Update Premium pricing to:

149.000đ / tháng

Update:
- Pricing page
- Upgrade modal
- Comparison table
- Dashboard premium banner

Premium benefits must clearly emphasize:

- Unlimited interview sessions
- Advanced interviewer personalities
- Stress-test mode
- Full detailed session analysis
- PDF export
- So sánh tiến bộ qua nhiều buổi

==================================================
5) EXPERIENCE QUALITY
==================================================

- Add smoother transitions between setup → pre-call → live session
- Add AI “processing” animation before report
- Make the interview screen visually immersive (focus mode, less sidebar distraction)
- Maintain Vietnamese UI everywhere

==================================================
IMPORTANT
==================================================

Do NOT add admin panel.
Do NOT remove freemium logic.
Do NOT change other modules (CV, Dashboard, Blog, Billing).

Only refactor the Interview module to feel like a real-time AI conversation product instead of predefined question flow.

The final result must feel like:
“A real HR is talking to me in one continuous session.”