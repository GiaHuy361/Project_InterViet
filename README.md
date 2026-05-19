
  # Build INTER-VIET SaaS Application

  This is a code bundle for Build INTER-VIET SaaS Application. The original project is available at https://www.figma.com/design/if1nnqNYBvDUgjrVuY9ug9/Build-INTER-VIET-SaaS-Application.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Cập nhật tiến độ Phase 4 (Đã hoàn thành)

  Dự án đã tích hợp đầy đủ tính năng và kết nối API thực tế của luồng **Phỏng vấn AI (Text/Voice)** theo tài liệu đặc tả Phase 4.

  ### 1. Quản lý Quota (Check Quota)
  - **API**: `POST /api/v1/interviews/check-quota`
  - FE tự động kiểm tra số lượt phỏng vấn trong ngày/gói đăng ký trước khi bắt đầu. Nếu hết lượt, hệ thống sẽ khoá nút Start và điều hướng nâng cấp.

  ### 2. Thiết lập phiên phỏng vấn (Setup Interview)
  - **API**: `POST /api/v1/interviews`
  - Người dùng có thể điền thông tin Vị trí, Cấp độ, Loại phỏng vấn, và cấu hình Model AI. Hỗ trợ song song tab Phỏng vấn **Text** và **Voice**.

  ### 3. Phòng phỏng vấn (Interview Room & Start Session)
  - **API (Start)**: `POST /api/v1/interviews/{id}/start` (Lấy câu hỏi đầu tiên)
  - **API (Submit)**: `POST /api/v1/interviews/{id}/messages` (Gửi câu trả lời và lấy câu tiếp theo)
  - Xử lý hoàn hảo các trạng thái idempotency, bắt lỗi 409 (Conflict) khi đã trả lời câu hỏi, không nạp lại trang để tránh mất state. Hỗ trợ kết thúc sớm.

  ### 4. Kết thúc & Báo cáo đánh giá (Complete & Report)
  - **API (Complete)**: `POST /api/v1/interviews/{id}/complete`
  - **API (Detail)**: `GET /api/v1/interviews/{id}`
  - Tự động hiển thị báo cáo AI sau khi kết thúc. Parse và render giao diện trực quan cho các mảng: Điểm tổng (Overall Score), Điểm chi tiết, Điểm mạnh (Strengths), Điểm yếu (Weaknesses), Khuyến nghị (Recommendations) và tổng hợp Q&A.

  ### 5. Lịch sử & Thống kê (History & Stats)
  - **API (List)**: `GET /api/v1/interviews`
  - **API (Stats)**: `GET /api/v1/interviews/stats`
  - **API (Delete)**: `DELETE /api/v1/interviews/{id}`
  - Trang Lịch sử theo dõi toàn bộ số liệu thống kê chung (Số phiên, điểm trung bình) và hiển thị các phiên từng thực hiện. Hỗ trợ xóa phiên phỏng vấn.

  ### 6. Cấu hình đệm Voice (Pre-call)
  - Trang đệm để kiểm tra (System check) Microphone, Network và Loa trước khi vào phỏng vấn chế độ Voice, đảm bảo luồng UX an toàn và đáng tin cậy.