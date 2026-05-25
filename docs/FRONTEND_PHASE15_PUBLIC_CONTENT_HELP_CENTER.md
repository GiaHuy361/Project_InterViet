# TÀI LIỆU TÍCH HỢP FRONTEND - PHASE 15
## Public Content + Help Center + Admin CMS

Tài liệu này cung cấp chi tiết kỹ thuật cho đội ngũ Phát triển Frontend (Web/Mobile) để thực hiện tích hợp các API thuộc **Phase 15 (Public Content + Help Center + Admin CMS)** vào giao diện ứng dụng INTER-VIET. 

Tất cả thông tin, các endpoint, mảng dữ liệu và sơ đồ luồng dữ liệu dưới đây đều được ánh xạ trực tiếp và chính xác 100% từ mã nguồn C# Backend hiện tại.

---

## 1. Tổng quan Phase 15
Phase 15 thực hiện xây dựng hệ thống nội dung công cộng (Public Content), Trung tâm Trợ giúp (Help Center) và Trang quản trị CMS để Admin quản lý các nội dung hiển thị trên trang chủ:
* **Landing Page Public Data**: Cung cấp số liệu thống kê thực tế, đánh giá từ khách hàng (Testimonials) để tăng uy tín.
* **Trung tâm trợ giúp (Help Center FAQs)**: Trả về danh mục các câu hỏi thường gặp phục vụ việc tự động giải đáp thắc mắc.
* **Cổng thông tin & Cẩm nang (Blog/Articles)**: Danh sách bài viết và chi tiết bài viết hỗ trợ tối ưu CV & phỏng vấn.
* **Biểu mẫu Liên hệ Khách vãng lai (Public Contact Guest)**: Dành cho khách chưa đăng nhập gửi yêu cầu hỗ trợ từ Footer/Landing Page.
* **Modal "Liên hệ hỗ trợ" trong Dashboard**: Tái sử dụng nghiệp vụ Support Ticket đã có từ Phase 14 dành riêng cho người dùng đã đăng nhập.
* **Quản trị Nội dung CMS (Admin CMS CRUD)**: Cho phép Admin/Support thêm/sửa/xóa các chỉ số, FAQ, testimonials, bài viết blog và phê duyệt trạng thái các liên hệ khách gửi về.

---

## 2. Screen Mapping dành cho Frontend

Dưới đây là sơ đồ khớp nối màn hình giao diện (Screens) với các API tương ứng:

### **Màn hình Landing Page (Trang chủ công cộng)**
* **Stats Section**: Hiển thị số liệu đếm số ứng viên, CV đã lọc, và số lượt phỏng vấn thử -> Gọi `GET /api/v1/public/stats`.
* **Testimonials Section**: Carousel/Grid hiển thị lời khen từ khách hàng nổi tiếng -> Gọi `GET /api/v1/public/testimonials`.
* **Blog Preview (nếu có)**: Grid danh sách 3 bài viết mới nhất dưới chân trang chủ -> Gọi `GET /api/v1/public/blog?category=&page=1&pageSize=3`.

### **Màn hình Trung tâm Trợ giúp (Help Center)**
* **FAQ Accordion**: Hiển thị danh sách câu hỏi phân nhóm theo Tab -> Gọi `GET /api/v1/public/faqs`.
* **Blog/Resources**: Trang danh sách tất cả bài cẩm nang -> Gọi `GET /api/v1/public/blog`.
* **Contact/Support CTA**: Form liên hệ nhanh dành cho khách vãng lai -> Gọi `POST /api/v1/public/contact`.

### **Màn hình Candidate Dashboard (Đã Đăng Nhập)**
* **Modal "Liên hệ hỗ trợ"**: Giao diện pop-up để người dùng đã đăng nhập gửi ticket lỗi hệ thống -> Gọi `POST /api/v1/support/tickets` (Yêu cầu JWT Token).

### **Màn hình Admin CMS (Trang Quản Trị Nội Dung)**
* **Quản lý Chỉ số**: CRUD thống kê -> Gọi nhóm API Admin Stats (`/api/v1/admin/public/stats`).
* **Quản lý Đánh giá**: CRUD testimonials -> Gọi nhóm API Admin Testimonials (`/api/v1/admin/public/testimonials`).
* **Quản lý FAQs**: CRUD câu hỏi thường gặp -> Gọi nhóm API Admin FAQs (`/api/v1/admin/public/faqs`).
* **Quản lý Blog**: CRUD bài viết -> Gọi nhóm API Admin Blog (`/api/v1/admin/public/blog`).
* **Xử lý yêu cầu liên hệ**: Xem và duyệt trạng thái liên hệ -> Gọi nhóm API Admin Contact Requests (`/api/v1/admin/public/contact-requests`).

---

## 3. Danh sách chi tiết API Công cộng (Public APIs)
*Tất cả API dưới đây đều được cấu hình `[AllowAnonymous]` (Không yêu cầu truyền JWT Authorization Header).*

### **3.1 GET `/api/v1/public/stats`**
* **Mục đích**: Lấy dữ liệu thống kê tổng quan của toàn bộ hệ thống để làm marketing số liệu thật.
* **Xác thực**: `Không`
* **Response Payload**:
  ```json
  {
    "success": true,
    "message": null,
    "data": {
      "totalCandidates": 1250,
      "totalCVsProcessed": 4820,
      "totalInterviewsConducted": 3110,
      "averageRating": 4.9
    },
    "meta": {
      "requestId": "0HMA1S9P20K1H:00000001",
      "timestamp": "2026-05-25T15:30:50Z"
    }
  }
  ```

---

### **3.2 GET `/api/v1/public/testimonials`**
* **Mục đích**: Lấy danh sách đánh giá của khách hàng đang hoạt động (`IsActive == true`).
* **Xác thực**: `Không`
* **Response Payload**:
  ```json
  {
    "success": true,
    "message": null,
    "data": [
      {
        "id": "e9b5f903-f0e2-45e3-85bb-5942ad76cd21",
        "authorName": "Nguyễn Thu Hà",
        "authorRole": "Senior Developer @ FPT Software",
        "content": "Tính năng phỏng vấn AI thật sự tuyệt vời! Tôi đã có thể tự tin trả lời phỏng vấn trước các nhà tuyển dụng lớn nhờ những nhận xét chi tiết của AI.",
        "avatarUrl": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop",
        "rating": 5.0,
        "sortOrder": 1,
        "isActive": true,
        "isFeatured": true
      }
    ],
    "meta": {
      "requestId": "0HMA1S9P20K1H:00000002",
      "timestamp": "2026-05-25T15:31:00Z"
    }
  }
  ```

---

### **3.3 GET `/api/v1/public/faqs`**
* **Mục đích**: Lấy câu hỏi thường gặp cho trang Help Center (`IsActive == true`).
* **Xác thực**: `Không`
* **Response Payload**:
  ```json
  {
    "success": true,
    "message": null,
    "data": [
      {
        "id": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
        "category": "Tối ưu CV",
        "question": "Làm thế nào để so khớp CV với JD?",
        "answer": "Sau khi tải CV lên, bạn dán nội dung tin tuyển dụng (JD) của vị trí ứng tuyển vào ô mô tả công việc. Nhấn 'Phân tích', AI sẽ trả về điểm số so khớp và gợi ý từ khoá cần bổ sung.",
        "sortOrder": 1,
        "isActive": true
      }
    ],
    "meta": {
      "requestId": "0HMA1S9P20K1H:00000003",
      "timestamp": "2026-05-25T15:31:05Z"
    }
  }
  ```

---

### **3.4 GET `/api/v1/public/blog`**
* **Mục đích**: Lấy danh sách cẩm nang kinh nghiệm viết bài và phỏng vấn đã xuất bản.
* **Xác thực**: `Không`
* **Query Parameters**:
  - `category` (string, optional)
* **Response Payload**:
  ```json
  {
    "success": true,
    "message": null,
    "data": [
      {
        "id": "b1a2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "title": "Bí quyết tối ưu CV chuẩn ATS giúp đánh bại 90% bộ lọc tuyển dụng",
        "slug": "bi-quyet-toi-uu-cv-chuan-ats",
        "content": "<p>Hầu hết các công ty lớn hiện nay đều sử dụng hệ thống quản lý tuyển dụng ATS để lọc hồ sơ...</p>",
        "author": "Đội ngũ biên tập viên INTER-VIET",
        "coverImageUrl": "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop",
        "category": "Kiến thức CV",
        "isPublished": true,
        "publishedAt": "2026-05-25T13:57:38Z",
        "createdAt": "2026-05-25T13:57:38Z"
      }
    ],
    "meta": {
      "requestId": "0HMA1S9P20K1H:00000004",
      "timestamp": "2026-05-25T15:31:10Z"
    }
  }
  ```

---

### **3.5 GET `/api/v1/public/blog/{slug}`**
* **Mục đích**: Lấy nội dung chi tiết bài viết blog theo trường slug.
* **Xác thực**: `Không`
* **Response Payload**:
  ```json
  {
    "success": true,
    "message": null,
    "data": {
      "id": "b1a2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "title": "Bí quyết tối ưu CV chuẩn ATS giúp đánh bại 90% bộ lọc tuyển dụng",
      "slug": "bi-quyet-toi-uu-cv-chuan-ats",
      "content": "<p>Hầu hết các công ty lớn hiện nay đều sử dụng hệ thống quản lý tuyển dụng ATS để lọc hồ sơ. Một CV được trình bày đẹp mắt đối với mắt người thường có thể bị lỗi font hoặc mất cấu trúc khi qua bộ quét ATS.</p>",
      "author": "Đội ngũ biên tập viên INTER-VIET",
      "coverImageUrl": "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop",
      "category": "Kiến thức CV",
      "isPublished": true,
      "publishedAt": "2026-05-25T13:57:38Z",
      "createdAt": "2026-05-25T13:57:38Z"
    },
    "meta": {
      "requestId": "0HMA1S9P20K1H:00000005",
      "timestamp": "2026-05-25T15:31:12Z"
    }
  }
  ```

---

### **3.6 POST `/api/v1/public/contact`**
* **Mục đích**: Gửi thông tin liên hệ từ khách chưa đăng nhập.
* **Xác thực**: `Không`
* **Request Body (JSON)**:
  ```json
  {
    "name": "Nguyễn Văn Khách",
    "email": "khach.visitor@gmail.com",
    "phone": "0912345678",
    "subject": "Cần tư vấn gói Enterprise",
    "category": "Billing",
    "message": "Tôi muốn đăng ký nhiều tài khoản cho công ty."
  }
  ```
* **Response Payload**:
  ```json
  {
    "success": true,
    "message": "Thông tin liên hệ của bạn đã được tiếp nhận thành công.",
    "data": {
      "id": "a9b8c7d6-e5f4-3a2b-1c0d-9e8f7a6b5c4d",
      "fullName": "Nguyễn Văn Khách",
      "email": "khach.visitor@gmail.com",
      "phone": "0912345678",
      "subject": "Cần tư vấn gói Enterprise",
      "category": "Billing",
      "message": "Tôi muốn đăng ký nhiều tài khoản cho công ty.",
      "status": "pending",
      "createdAt": "2026-05-25T15:32:00Z"
    },
    "meta": {
      "requestId": "0HMA1S9P20K1H:00000006",
      "timestamp": "2026-05-25T15:32:00Z"
    }
  }
  ```

---

## 4. Dashboard Support Modal (Logged-In Flow)

### **4.1 POST `/api/v1/support/tickets`**
* **Mục đích**: Người dùng đã đăng nhập gửi yêu cầu hỗ trợ kỹ thuật từ Dashboard.
* **Xác thực**: `Bắt buộc JWT Token`
* **Request Body (JSON)**:
  ```json
  {
    "subject": "Lỗi trừ lượt CV Matching",
    "description": "Tôi bị lỗi trừ lượt matching nhưng không nhận kết quả...",
    "category": "CV_Matching",
    "priority": "normal"
  }
  ```
* **Response Payload**:
  ```json
  {
    "success": true,
    "message": "Support ticket created successfully.",
    "data": {
      "id": "f5e4d3c2-b1a0-9e8f-7d6c-5b4a3f2e1d0c",
      "ticketNumber": "TK-20260525-2315",
      "category": "CV_Matching",
      "priority": "normal",
      "subject": "Lỗi trừ lượt CV Matching",
      "status": "open",
      "description": "Tôi bị lỗi trừ lượt matching nhưng không nhận kết quả...",
      "assignedTo": null,
      "createdAt": "2026-05-25T15:15:00Z",
      "closedAt": null,
      "lastMessageAt": null,
      "messages": []
    },
    "meta": {
      "requestId": "0HMA1S9P20K1H:00000007",
      "timestamp": "2026-05-25T15:15:00Z"
    }
  }
  ```

---

## 5. Danh sách API CMS Quản trị (Admin CMS CRUD)
*Tất cả API dưới đây đều yêu cầu truyền JWT token của tài khoản Admin/Support.*

### **5.1 Quản lý Chỉ số Thống kê (PublicStats CRUD)**

#### **5.1.1 GET `/api/v1/admin/public/stats`**
* **Quyền hạn**: `AdminOnly`
* **Response Payload**:
  ```json
  {
    "success": true,
    "message": null,
    "data": {
      "totalFaqs": 16,
      "publishedFaqs": 16,
      "totalBlogArticles": 2,
      "publishedBlogArticles": 2,
      "totalTestimonials": 2,
      "activeTestimonials": 2,
      "totalContactRequests": 5,
      "pendingContactRequests": 2
    },
    "meta": {
      "requestId": "0HMA1S9P20K1H:00000008",
      "timestamp": "2026-05-25T15:33:00Z"
    }
  }
  ```

#### **5.1.2 POST `/api/v1/admin/public/stats`**
* **Quyền hạn**: `AdminOnly`
* **Request Body (JSON)**:
  ```json
  {
    "key": "success_rate",
    "value": "98%",
    "label": "Tỷ lệ đỗ phỏng vấn",
    "icon": "trend-up",
    "sortOrder": 5
  }
  ```
* **Response Payload**:
  ```json
  {
    "success": true,
    "message": "Tạo chỉ số thành công.",
    "data": {
      "id": "c1f1a1d1-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "key": "success_rate",
      "value": "98%",
      "label": "Tỷ lệ đỗ phỏng vấn",
      "icon": "trend-up",
      "sortOrder": 5
    },
    "meta": {
      "requestId": "0HMA1S9P20K1H:00000009",
      "timestamp": "2026-05-25T15:33:10Z"
    }
  }
  ```

#### **5.1.3 PUT `/api/v1/admin/public/stats/{id}`**
* **Quyền hạn**: `AdminOnly`
* **Request Body (JSON)**:
  ```json
  {
    "key": "success_rate",
    "value": "99%",
    "label": "Tỷ lệ thành công vượt trội",
    "icon": "trend-up-bold",
    "sortOrder": 1
  }
  ```
* **Response Payload**:
  ```json
  {
    "success": true,
    "message": "Cập nhật chỉ số thành công.",
    "data": {
      "id": "c1f1a1d1-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "key": "success_rate",
      "value": "99%",
      "label": "Tỷ lệ thành công vượt trội",
      "icon": "trend-up-bold",
      "sortOrder": 1
    },
    "meta": {
      "requestId": "0HMA1S9P20K1H:00000010",
      "timestamp": "2026-05-25T15:33:20Z"
    }
  }
  ```

#### **5.1.4 DELETE `/api/v1/admin/public/stats/{id}`**
* **Quyền hạn**: `AdminOnly`
* **Response Payload**:
  ```json
  {
    "success": true,
    "message": "Xóa chỉ số thành công.",
    "data": {
      "id": "c1f1a1d1-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
    },
    "meta": {
      "requestId": "0HMA1S9P20K1H:00000011",
      "timestamp": "2026-05-25T15:33:30Z"
    }
  }
  ```

---

### **5.2 Quản lý Đánh giá (Testimonial CRUD)**

#### **5.2.1 GET `/api/v1/admin/public/testimonials`**
* **Quyền hạn**: `AdminOnly`
* **Response Payload**:
  ```json
  {
    "success": true,
    "message": null,
    "data": [
      {
        "id": "e9b5f903-f0e2-45e3-85bb-5942ad76cd21",
        "authorName": "Nguyễn Thu Hà",
        "authorRole": "Senior Developer @ FPT Software",
        "content": "Tính năng phỏng vấn AI thật sự tuyệt vời!",
        "avatarUrl": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
        "rating": 5.0,
        "sortOrder": 1,
        "isActive": true,
        "isFeatured": true
      }
    ],
    "meta": {
      "requestId": "0HMA1S9P20K1H:00000012",
      "timestamp": "2026-05-25T15:34:00Z"
    }
  }
  ```

#### **5.2.2 POST `/api/v1/admin/public/testimonials`**
* **Quyền hạn**: `AdminOnly`
* **Request Body (JSON)**:
  ```json
  {
    "authorName": "Phạm Quốc Bảo",
    "authorRole": "Tech Lead @ Zalo",
    "content": "Match CV nhanh, giao diện thân thiện với lập trình viên.",
    "avatarUrl": "https://i.pravatar.cc/150",
    "rating": 5.0,
    "sortOrder": 3,
    "isActive": true,
    "isFeatured": false
  }
  ```
* **Response Payload**:
  ```json
  {
    "success": true,
    "message": "Tạo đánh giá thành công.",
    "data": {
      "id": "a2b2c2d2-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "authorName": "Phạm Quốc Bảo",
      "authorRole": "Tech Lead @ Zalo",
      "content": "Match CV nhanh, giao diện thân thiện với lập trình viên.",
      "avatarUrl": "https://i.pravatar.cc/150",
      "rating": 5.0,
      "sortOrder": 3,
      "isActive": true,
      "isFeatured": false
    },
    "meta": {
      "requestId": "0HMA1S9P20K1H:00000013",
      "timestamp": "2026-05-25T15:34:10Z"
    }
  }
  ```

#### **5.2.3 PUT `/api/v1/admin/public/testimonials/{id}`**
* **Quyền hạn**: `AdminOnly`
* **Request Body (JSON)**:
  ```json
  {
    "authorName": "Phạm Quốc Bảo",
    "authorRole": "Engineering Manager @ Zalo",
    "content": "AI phỏng vấn phản hồi cực nhanh và chính xác.",
    "avatarUrl": "https://i.pravatar.cc/150",
    "rating": 4.9,
    "sortOrder": 1,
    "isActive": true,
    "isFeatured": true
  }
  ```
* **Response Payload**:
  ```json
  {
    "success": true,
    "message": "Cập nhật đánh giá thành công.",
    "data": {
      "id": "a2b2c2d2-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "authorName": "Phạm Quốc Bảo",
      "authorRole": "Engineering Manager @ Zalo",
      "content": "AI phỏng vấn phản hồi cực nhanh và chính xác.",
      "avatarUrl": "https://i.pravatar.cc/150",
      "rating": 4.9,
      "sortOrder": 1,
      "isActive": true,
      "isFeatured": true
    },
    "meta": {
      "requestId": "0HMA1S9P20K1H:00000014",
      "timestamp": "2026-05-25T15:34:20Z"
    }
  }
  ```

#### **5.2.4 DELETE `/api/v1/admin/public/testimonials/{id}`**
* **Quyền hạn**: `AdminOnly`
* **Response Payload**:
  ```json
  {
    "success": true,
    "message": "Xóa đánh giá thành công.",
    "data": {
      "id": "a2b2c2d2-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
    },
    "meta": {
      "requestId": "0HMA1S9P20K1H:00000015",
      "timestamp": "2026-05-25T15:34:30Z"
    }
  }
  ```

---

### **5.3 Quản lý FAQs thường gặp (FAQ CRUD)**

#### **5.3.1 GET `/api/v1/admin/public/faqs`**
* **Quyền hạn**: `AdminOnly`
* **Response Payload**:
  ```json
  {
    "success": true,
    "message": null,
    "data": [
      {
        "id": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
        "category": "Tối ưu CV",
        "question": "Làm thế nào để so khớp CV với JD?",
        "answer": "Sau khi tải CV lên, bạn dán nội dung tin tuyển dụng (JD) của vị trí ứng tuyển vào ô mô tả công việc.",
        "sortOrder": 1,
        "isActive": true
      }
    ],
    "meta": {
      "requestId": "0HMA1S9P20K1H:00000016",
      "timestamp": "2026-05-25T15:35:00Z"
    }
  }
  ```

#### **5.3.2 POST `/api/v1/admin/public/faqs`**
* **Quyền hạn**: `AdminOnly`
* **Request Body (JSON)**:
  ```json
  {
    "category": "Phỏng vấn AI",
    "question": "Tôi có bị giới hạn lượt phỏng vấn thử không?",
    "answer": "Người dùng Premium sẽ không bị giới hạn số lượt phỏng vấn thử với AI.",
    "sortOrder": 5,
    "isActive": true
  }
  ```
* **Response Payload**:
  ```json
  {
    "success": true,
    "message": "Tạo FAQ thành công.",
    "data": {
      "id": "c3c3c3c3-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "category": "Phỏng vấn AI",
      "question": "Tôi có bị giới hạn lượt phỏng vấn thử không?",
      "answer": "Người dùng Premium sẽ không bị giới hạn số lượt phỏng vấn thử với AI.",
      "sortOrder": 5,
      "isActive": true
    },
    "meta": {
      "requestId": "0HMA1S9P20K1H:00000017",
      "timestamp": "2026-05-25T15:35:10Z"
    }
  }
  ```

#### **5.3.3 PUT `/api/v1/admin/public/faqs/{id}`**
* **Quyền hạn**: `AdminOnly`
* **Request Body (JSON)**:
  ```json
  {
    "category": "Phỏng vấn AI",
    "question": "Tôi có bị giới hạn lượt phỏng vấn thử hàng ngày không?",
    "answer": "Người dùng Premium được mở khóa không giới hạn lượt. Người dùng Free bị giới hạn 3 lượt mỗi ngày.",
    "sortOrder": 1,
    "isActive": true
  }
  ```
* **Response Payload**:
  ```json
  {
    "success": true,
    "message": "Cập nhật FAQ thành công.",
    "data": {
      "id": "c3c3c3c3-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "category": "Phỏng vấn AI",
      "question": "Tôi có bị giới hạn lượt phỏng vấn thử hàng ngày không?",
      "answer": "Người dùng Premium được mở khóa không giới hạn lượt. Người dùng Free bị giới hạn 3 lượt mỗi ngày.",
      "sortOrder": 1,
      "isActive": true
    },
    "meta": {
      "requestId": "0HMA1S9P20K1H:00000018",
      "timestamp": "2026-05-25T15:35:20Z"
    }
  }
  ```

#### **5.3.4 DELETE `/api/v1/admin/public/faqs/{id}`**
* **Quyền hạn**: `AdminOnly`
* **Response Payload**:
  ```json
  {
    "success": true,
    "message": "Xóa FAQ thành công.",
    "data": {
      "id": "c3c3c3c3-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
    },
    "meta": {
      "requestId": "0HMA1S9P20K1H:00000019",
      "timestamp": "2026-05-25T15:35:30Z"
    }
  }
  ```

---

### **5.4 Quản lý Cẩm nang bài viết (Blog Article CRUD)**

#### **5.4.1 GET `/api/v1/admin/public/blog`**
* **Quyền hạn**: `AdminOnly`
* **Response Payload**:
  ```json
  {
    "success": true,
    "message": null,
    "data": [
      {
        "id": "b1a2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "title": "Bí quyết tối ưu CV chuẩn ATS giúp đánh bại 90% bộ lọc tuyển dụng",
        "slug": "bi-quyet-toi-uu-cv-chuan-ats",
        "content": "<p>Hầu hết các công ty lớn hiện nay đều sử dụng hệ thống quản lý tuyển dụng ATS...</p>",
        "author": "Đội ngũ biên tập viên INTER-VIET",
        "coverImageUrl": "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800",
        "category": "Kiến thức CV",
        "isPublished": true,
        "publishedAt": "2026-05-25T13:57:38Z",
        "createdAt": "2026-05-25T13:57:38Z"
      }
    ],
    "meta": {
      "requestId": "0HMA1S9P20K1H:00000020",
      "timestamp": "2026-05-25T15:36:00Z"
    }
  }
  ```

#### **5.4.2 POST `/api/v1/admin/public/blog`**
* **Quyền hạn**: `AdminOnly`
* **Request Body (JSON)**:
  ```json
  {
    "title": "Cách đối diện câu hỏi tình huống hóc búa",
    "slug": "cach-doi-dien-cau-hoi-tinh-huong",
    "content": "<p>Bí quyết của nhà tâm lý học nhân sự...</p>",
    "author": "Đội ngũ biên tập viên",
    "coverImageUrl": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2",
    "category": "Kinh nghiệm phỏng vấn",
    "isPublished": true,
    "publishedAt": "2026-05-25T15:30:00Z"
  }
  ```
* **Response Payload**:
  ```json
  {
    "success": true,
    "message": "Tạo bài viết thành công.",
    "data": {
      "id": "d4d4d4d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "title": "Cách đối diện câu hỏi tình huống hóc búa",
      "slug": "cach-doi-dien-cau-hoi-tinh-huong",
      "content": "<p>Bí quyết của nhà tâm lý học nhân sự...</p>",
      "author": "Đội ngũ biên tập viên",
      "coverImageUrl": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2",
      "category": "Kinh nghiệm phỏng vấn",
      "isPublished": true,
      "publishedAt": "2026-05-25T15:30:00Z"
    },
    "meta": {
      "requestId": "0HMA1S9P20K1H:00000021",
      "timestamp": "2026-05-25T15:36:10Z"
    }
  }
  ```

#### **5.4.3 PUT `/api/v1/admin/public/blog/{id}`**
* **Quyền hạn**: `AdminOnly`
* **Request Body (JSON)**:
  ```json
  {
    "title": "Cách đối phó câu hỏi tình huống hóc búa",
    "slug": "cach-doi-dien-cau-hoi-tinh-huong-update",
    "content": "<p>Bổ sung các tình huống cụ thể trong ngành IT...</p>",
    "author": "Tác giả chính",
    "coverImageUrl": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2",
    "category": "Kinh nghiệm phỏng vấn",
    "isPublished": true,
    "publishedAt": "2026-05-25T15:30:00Z"
  }
  ```
* **Response Payload**:
  ```json
  {
    "success": true,
    "message": "Cập nhật bài viết thành công.",
    "data": {
      "id": "d4d4d4d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "title": "Cách đối phó câu hỏi tình huống hóc búa",
      "slug": "cach-doi-dien-cau-hoi-tinh-huong-update",
      "content": "<p>Bổ sung các tình huống cụ thể trong ngành IT...</p>",
      "author": "Tác giả chính",
      "coverImageUrl": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2",
      "category": "Kinh nghiệm phỏng vấn",
      "isPublished": true,
      "publishedAt": "2026-05-25T15:30:00Z"
    },
    "meta": {
      "requestId": "0HMA1S9P20K1H:00000022",
      "timestamp": "2026-05-25T15:36:20Z"
    }
  }
  ```

#### **5.4.4 DELETE `/api/v1/admin/public/blog/{id}`**
* **Quyền hạn**: `AdminOnly`
* **Response Payload**:
  ```json
  {
    "success": true,
    "message": "Xóa bài viết thành công.",
    "data": {
      "id": "d4d4d4d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
    },
    "meta": {
      "requestId": "0HMA1S9P20K1H:00000023",
      "timestamp": "2026-05-25T15:36:30Z"
    }
  }
  ```

---

### **5.5 Quản lý Yêu cầu Liên hệ Khách viếng thăm (Contact Requests Management)**

#### **5.5.1 GET `/api/v1/admin/public/contact-requests`**
* **Quyền hạn**: `AdminOrSupport`
* **Response Payload**:
  ```json
  {
    "success": true,
    "message": null,
    "data": {
      "total": 1,
      "page": 1,
      "pageSize": 10,
      "items": [
        {
          "id": "a9b8c7d6-e5f4-3a2b-1c0d-9e8f7a6b5c4d",
          "fullName": "Nguyễn Văn Khách",
          "email": "khach.visitor@gmail.com",
          "phone": "0912345678",
          "subject": "Cần tư vấn gói Enterprise",
          "category": "Billing",
          "message": "Tôi muốn đăng ký nhiều tài khoản cho công ty.",
          "status": "pending",
          "createdAt": "2026-05-25T15:32:00Z"
        }
      ]
    },
    "meta": {
      "requestId": "0HMA1S9P20K1H:00000024",
      "timestamp": "2026-05-25T15:37:00Z"
    }
  }
  ```

#### **5.5.2 GET `/api/v1/admin/public/contact-requests/{id}`**
* **Quyền hạn**: `AdminOrSupport`
* **Response Payload**:
  ```json
  {
    "success": true,
    "message": null,
    "data": {
      "id": "a9b8c7d6-e5f4-3a2b-1c0d-9e8f7a6b5c4d",
      "fullName": "Nguyễn Văn Khách",
      "email": "khach.visitor@gmail.com",
      "phone": "0912345678",
      "subject": "Cần tư vấn gói Enterprise",
      "category": "Billing",
      "message": "Tôi muốn đăng ký nhiều tài khoản cho công ty.",
      "status": "pending",
      "createdAt": "2026-05-25T15:32:00Z"
    },
    "meta": {
      "requestId": "0HMA1S9P20K1H:00000025",
      "timestamp": "2026-05-25T15:37:10Z"
    }
  }
  ```

#### **5.5.3 POST `/api/v1/admin/public/contact-requests/{id}/status`**
* **Quyền hạn**: `AdminOrSupport`
* **Request Body (JSON)**:
  ```json
  {
    "status": "processed"
  }
  ```
* **Response Payload**:
  ```json
  {
    "success": true,
    "message": "Cập nhật trạng thái yêu cầu liên hệ thành công.",
    "data": {
      "id": "a9b8c7d6-e5f4-3a2b-1c0d-9e8f7a6b5c4d",
      "previousStatus": "pending",
      "currentStatus": "processed"
    },
    "meta": {
      "requestId": "0HMA1S9P20K1H:00000026",
      "timestamp": "2026-05-25T15:37:20Z"
    }
  }
  ```

---

## 6. Sơ đồ trạng thái & Xử lý giao diện trống (Empty States)

Frontend cần xử lý giao diện cực kỳ mượt mà để wow ứng viên khi trang web không có dữ liệu:

* **Stats DB Trống**: Các ô số hiển thị `0`. Average rating hiển thị `"Chưa có đánh giá"` hoặc ẩn phần ngôi sao đi.
* **Testimonials Trống (`[]`)**: Ẩn toàn bộ Carousel/khối Testimonials trên Landing Page hoặc hiển thị một banner thông điệp chào mừng mặc định.
* **Help Center FAQs Trống (`[]`)**: Hiển thị một khu vực thông báo: *"Trung tâm trợ giúp đang cập nhật câu hỏi, vui lòng liên hệ trực tiếp với chúng tôi qua nút hỗ trợ dưới đây."*
* **Blog List Trống (`[]`)**: Hiển thị banner: *"Không tìm thấy bài viết nào trong danh mục này."*
* **Validation Error trên Contact Form**: Không được xóa trắng các input mà khách đã nhập. Hãy hiển thị viền đỏ xung quanh input bị lỗi và hiển thị dòng chữ thông báo lỗi tương ứng lấy từ `errors` JSON của backend trả về dưới chân thẻ input.

---

## 7. Xử lý Mã lỗi từ Hệ thống (Error Handling Rules)

Hệ thống INTER-VIET sử dụng các mã lỗi chuẩn đi kèm với mã HTTP Code để Frontend tiện xử lý:

| HTTP Status | Mã lỗi hệ thống (nếu có) | Ý nghĩa nghiệp vụ |
|---|---|---|
| **`400 Bad Request`** | `Validation.Failed` | Thiếu trường bắt buộc hoặc sai định dạng dữ liệu (như thiếu kí tự `@` của email). |
| **`401 Unauthorized`** | `Identity.Unauthorized` | Token hết hạn hoặc chưa đăng nhập (đối với API gửi Support Ticket). |
| **`403 Forbidden`** | `Identity.Forbidden` | Tài khoản đăng nhập không có quyền hạn truy cập (như Support cố tình vào API thanh toán Admin). |
| **`404 NotFound`** | `Resource.NotFound` | Bài viết blog hoặc FAQ không tồn tại hoặc đã bị xóa. |
| **`409 Conflict`** | `Resource.Conflict` | Trùng lặp `slug` bài viết cẩm nang. |

---

## 8. Checklist kiểm thử nhanh dành cho Lập trình viên

Hãy đảm bảo rằng bạn đã chạy thử toàn bộ checklist dưới đây trên Swagger hoặc Postman trước khi bàn giao giao diện hoàn thiện:

- [ ] **Kiểm tra chỉ số thực**: Gọi `GET /api/v1/public/stats` không truyền header. Đảm bảo các chỉ số nhảy số thật khi database tăng số ứng viên/CV.
- [ ] **Kiểm tra FAQs**: Gọi `GET /api/v1/public/faqs` xem các câu hỏi có được gom theo nhóm `"Tối ưu CV"`, `"Phỏng vấn AI"`... và sắp xếp chuẩn chỉ chưa.
- [ ] **Kiểm tra gửi liên hệ**: Gửi `POST /api/v1/public/contact` không có Token. Đảm bảo validate thành công và lưu vào Database.
- [ ] **Kiểm tra bảo mật Admin**: Đăng nhập tài khoản Candidate bình thường, gọi API `GET /api/v1/admin/public/contact-requests`. Đảm bảo nhận về kết quả chặn `403 Forbidden`.
- [ ] **Kiểm tra trùng Slug**: Thử tạo bài viết mới có trường `slug` đã tồn tại trong DB, đảm bảo server trả lỗi `400` với thông báo cụ thể thay vì lỗi crash hệ thống `500`.
- [ ] **Kiểm tra Modal Support**: Lấy token ứng viên đăng nhập, gọi `POST /api/v1/support/tickets`. Xác nhận ticket được khởi tạo và tự lấy email từ Token.

---

## 9. Lưu ý quan trọng nhất dành cho lập trình viên Frontend
1. **Số liệu thống kê là thật**: Mọi số liệu hiển thị trên trang chủ được tính toán trực tiếp, không sử dụng số ảo.
2. **Dashboard support modal và Contact form công cộng là 2 API độc lập hoàn toàn**:
   * Dashboard hỗ trợ của người dùng đã đăng nhập dùng: **`POST /api/v1/support/tickets`** (Yêu cầu JWT Token).
   * Biểu mẫu liên hệ ngoài trang chủ cho khách chưa đăng nhập dùng: **`POST /api/v1/public/contact`** (Không Token).
3. **Sử dụng Slug để làm đường dẫn chi tiết bài viết**: Khi người dùng nhấn xem một bài viết, Frontend sử dụng trường `slug` (ví dụ: `bi-quyet-toi-uu-cv-chuan-ats`) để gọi API `GET /api/v1/public/blog/{slug}` để lấy nội dung HTML hiển thị.
