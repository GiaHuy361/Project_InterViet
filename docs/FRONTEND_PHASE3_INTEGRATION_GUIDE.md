# TÀI LIỆU TÍCH HỢP FRONTEND - HỆ THỐNG INTER-VIET
## FRONTEND PHASE 3: CV + JOB DESCRIPTION + MATCHING SPECIFICATION (100% COMPLETE & PRODUCTION-READY)

Tài liệu này cung cấp đặc tả kỹ thuật tích hợp hoàn chỉnh và chính xác 100% cho Phase 3 của hệ thống INTER-VIET. Được biên soạn dựa trên cấu trúc các contracts C# thực tế từ Backend và các quy tắc nghiệp vụ bắt buộc của hệ thống.

---

## 1. THIẾT KẾ KHUNG TƯƠNG TÁC API (API FRAMEWORK)

Tất cả các API trong Phase 3 của hệ thống INTER-VIET tuân thủ theo hai định dạng chuẩn (Success Envelope và Error Problem Details).

### 1.1 Khung Phản Hồi Thành Công (Success Envelope JSON)
Khi API trả về trạng thái HTTP thành công (`200 OK`, `201 Created`, hoặc `202 Accepted`), body của phản hồi luôn được bọc trong cấu trúc chuẩn sau:

```json
{
  "success": true,
  "message": "Thông tin bổ sung từ hệ thống (nếu có)",
  "data": {
    "//": "Dữ liệu nghiệp vụ thực tế trả về từ backend"
  },
  "meta": {
    "requestId": "0HN18E6QJS9N7:00000002",
    "timestamp": "2026-05-22T13:50:00Z"
  }
}
```

*Lưu ý:* Đối với các API kết thúc bằng `204 No Content` (ví dụ như Delete hoặc Set Active), response body sẽ trống hoàn toàn và không có JSON bọc.

### 1.2 Khung Phản Hồi Lỗi Hệ Thống (Error Problem Details JSON)
Khi hệ thống trả về lỗi (mã trạng thái HTTP `4xx` hoặc `5xx`), hệ thống sử dụng định dạng chuẩn RFC-7807 (Problem Details). Định dạng này không có trường `success`:

```json
{
  "type": "https://api.interviet.vn/errors/quota-exceeded",
  "title": "Quota.Exceeded",
  "detail": "Bạn đã sử dụng hết lượt trong gói hiện tại.",
  "code": "Quota.Exceeded"
}
```

---

## 2. QUY TRÌNH QUẢN LÝ CV (RESUME MANAGEMENT FLOW)

### 2.1 Tải Lên CV Mới (Upload CV)
*   **Method**: `POST`
*   **Path**: `/api/v1/resumes`
*   **Content-Type**: `multipart/form-data`
*   **Headers**: `Authorization: Bearer <token>`
*   **Multipart Fields**:
    *   `File` *(IFormFile, Bắt buộc)*: File định dạng `.pdf`, `.docx`, `.jpg`, `.jpeg`, `.png`, dung lượng tối đa 10MB.
    *   `Title` *(String, Tùy chọn)*: Tên tiêu đề của CV (mặc định nếu để trống sẽ lấy tên file gốc).

#### Validation phía Frontend:
*   Bắt buộc chọn file.
*   Kiểm tra đuôi file thuộc danh sách cho phép.
*   Kiểm tra kích thước file <= 10MB. Nếu sai, hiển thị thông báo lỗi lập tức trước khi gửi API.
*   *Lưu ý:* Không tự ý set `Content-Type: multipart/form-data` thủ công ở code AJAX/Axios, hãy để trình duyệt tự động gán ranh giới boundary.

#### Sample Response (201 Created):
```json
{
  "success": true,
  "message": null,
  "data": {
    "resumeId": "a00a0000-e29b-41d4-a716-446655440000",
    "title": "CV Nguyễn Văn A - Kỹ Sư .NET",
    "isActive": true,
    "versionNumber": 1,
    "latestVersionId": "a00a0000-e29b-41d4-a716-446655440001",
    "originalFileName": "cv_nguyen_van_a.pdf",
    "fileExtension": ".pdf",
    "contentType": "application/pdf",
    "fileSizeBytes": 1024000,
    "parseStatus": "Queued",
    "processingError": null,
    "lastProcessedAt": null,
    "createdAt": "2026-05-22T13:50:00Z",
    "updatedAt": "2026-05-22T13:50:00Z"
  },
  "meta": {
    "requestId": "0HN18E6QJS9N7:00000003",
    "timestamp": "2026-05-22T13:50:00Z"
  }
}
```

---

### 2.2 Lấy Danh Sách CV Của Tôi (List Resumes)
*   **Method**: `GET`
*   **Path**: `/api/v1/resumes`
*   **Query Parameters**:
    *   `page` *(int, mặc định = 1)*
    *   `pageSize` *(int, mặc định = 10)*
    *   `status` *(string, tùy chọn)*: Lọc theo trạng thái xử lý (`Queued`, `Processing`, `Parsed`, `Failed`).
    *   `isActive` *(bool, tùy chọn)*: Lọc CV đang hoạt động.

#### Sample Response (200 OK):
```json
{
  "success": true,
  "message": null,
  "data": {
    "items": [
      {
        "resumeId": "a00a0000-e29b-41d4-a716-446655440000",
        "title": "CV Nguyễn Văn A - Kỹ Sư .NET",
        "isActive": true,
        "versionNumber": 1,
        "latestVersionId": "a00a0000-e29b-41d4-a716-446655440001",
        "originalFileName": "cv_nguyen_van_a.pdf",
        "fileExtension": ".pdf",
        "contentType": "application/pdf",
        "fileSizeBytes": 1024000,
        "parseStatus": "Parsed",
        "processingError": null,
        "lastProcessedAt": "2026-05-22T13:50:15Z",
        "createdAt": "2026-05-22T13:50:00Z",
        "updatedAt": "2026-05-22T13:50:15Z"
      }
    ],
    "totalCount": 1,
    "page": 1,
    "pageSize": 10
  },
  "meta": {
    "requestId": "0HN18E6QJS9N7:00000004",
    "timestamp": "2026-05-22T13:51:00Z"
  }
}
```

#### Empty State JSON (Nếu user chưa tải lên CV nào):
```json
{
  "success": true,
  "message": null,
  "data": {
    "items": [],
    "totalCount": 0,
    "page": 1,
    "pageSize": 10
  },
  "meta": {
    "requestId": "0HN18E6QJS9N7:00000005",
    "timestamp": "2026-05-22T13:51:10Z"
  }
}
```

---

### 2.3 Lấy Thông Tin CV Hoạt Động (Active Resume)
*   **Method**: `GET`
*   **Path**: `/api/v1/resumes/active`

#### Sample Response (200 OK):
```json
{
  "success": true,
  "message": null,
  "data": {
    "resumeId": "a00a0000-e29b-41d4-a716-446655440000",
    "title": "CV Nguyễn Văn A - Kỹ Sư .NET",
    "isActive": true,
    "versionNumber": 1,
    "latestVersionId": "a00a0000-e29b-41d4-a716-446655440001",
    "originalFileName": "cv_nguyen_van_a.pdf",
    "fileExtension": ".pdf",
    "contentType": "application/pdf",
    "fileSizeBytes": 1024000,
    "parseStatus": "Parsed",
    "processingError": null,
    "lastProcessedAt": "2026-05-22T13:50:15Z",
    "createdAt": "2026-05-22T13:50:00Z",
    "updatedAt": "2026-05-22T13:50:15Z"
  },
  "meta": {
    "requestId": "0HN18E6QJS9N7:00000006",
    "timestamp": "2026-05-22T13:52:00Z"
  }
}
```

*Lưu ý:* Nếu không có CV nào hoạt động, API sẽ trả lỗi `404 Not Found` với mã `Resume.ActiveNotFound`. Frontend cần bắt lỗi này để hiển thị trạng thái hướng dẫn chọn hoặc upload CV mới.

---

### 2.4 Chi Tiết CV & Dữ Liệu Phân Tích (Resume Detail)
*   **Method**: `GET`
*   **Path**: `/api/v1/resumes/{resumeId}`

#### Sample Response (200 OK):
```json
{
  "success": true,
  "message": null,
  "data": {
    "resumeId": "a00a0000-e29b-41d4-a716-446655440000",
    "title": "CV Nguyễn Văn A - Kỹ Sư .NET",
    "isActive": true,
    "versionNumber": 1,
    "latestVersionId": "a00a0000-e29b-41d4-a716-446655440001",
    "originalFileName": "cv_nguyen_van_a.pdf",
    "fileExtension": ".pdf",
    "contentType": "application/pdf",
    "fileSizeBytes": 1024000,
    "parseStatus": "Parsed",
    "processingError": null,
    "lastProcessedAt": "2026-05-22T13:50:15Z",
    "latestParseJob": {
      "jobId": "99999999-e29b-41d4-a716-446655440000",
      "resumeId": "a00a0000-e29b-41d4-a716-446655440000",
      "status": "Completed",
      "provider": "PythonCvService",
      "correlationId": "corr-1111-2222",
      "errorCode": null,
      "errorMessage": null,
      "retryCount": 0,
      "modelVersion": "interviet-cv-v2",
      "requestedAt": "2026-05-22T13:50:02Z",
      "startedAt": "2026-05-22T13:50:03Z",
      "completedAt": "2026-05-22T13:50:15Z"
    },
    "parsedData": {
      "id": "88888888-e29b-41d4-a716-446655440000",
      "detectedLanguage": "vi",
      "rawText": "HỌ VÀ TÊN: NGUYỄN VĂN A\nĐỊA CHỈ: TP.HCM\nKỸ NĂNG: C#, .NET, Web API, SQL Server...",
      "sectionsJson": "{\"summary\":\"Tóm tắt hồ sơ chuyên nghiệp Nguyễn Văn A...\"}",
      "skillsJson": "C#, .NET Core, SQL Server, Web API, Docker",
      "experiencesJson": "Công ty Cổ phần Công nghệ ABC - Senior Backend Developer (2022-01-01 - Hiện tại): Phát triển hệ thống xử lý giao dịch đạt 10,000 requests/giây; Tối ưu hóa cơ sở dữ liệu giúp tăng 40% hiệu năng truy vấn. Công nghệ sử dụng: C#, .NET Core, SQL Server, Docker.",
      "educationsJson": "Trường Đại học Bách khoa TP.HCM - Khoa học Máy tính - Kỹ sư (2015-09-01 - 2019-06-30)",
      "projectsJson": "E-Commerce System - Technical Lead: Phát triển nền tảng thương mại điện tử chuyên nghiệp. Quy mô nhóm: 5 người.",
      "certificationsJson": "Microsoft Certified: Azure Developer Associate",
      "languagesJson": "Tiếng Việt (Bản xứ), Tiếng Anh (IELTS 7.0)",
      "warningsJson": "[]",
      "modelVersion": "cv-parser-v1-gemini-flash",
      "schemaVersion": "resume-parse-v1",
      "parseTextLength": 4500,
      "parseWarningCount": 0,
      "parseConfidenceScore": 0.98,
      "parseQuality": "High",
      "detectedSectionsJson": "[\"skills\",\"experiences\",\"educations\",\"languages\"]",
      "missingSectionsJson": "[\"projects\",\"certifications\"]",
      "createdAt": "2026-05-22T13:50:15Z"
    },
    "createdAt": "2026-05-22T13:50:00Z",
    "updatedAt": "2026-05-22T13:50:15Z"
  },
  "meta": {
    "requestId": "0HN18E6QJS9N7:00000007",
    "timestamp": "2026-05-22T13:52:15Z"
  }
}
```

---

### 2.5 Thiết Lập CV Hoạt Động (Set Active Resume)
*   **Method**: `PATCH`
*   **Path**: `/api/v1/resumes/{resumeId}/active`

#### Sample Response (204 No Content):
*(Không có response body. HTTP Status 204 tượng trưng cho xử lý thành công).*

---

### 2.6 Xóa CV (Delete Resume)
*   **Method**: `DELETE`
*   **Path**: `/api/v1/resumes/{resumeId}`

#### Quy tắc xác nhận phía Frontend:
Trước khi gọi API, hiển thị một Modal xác nhận có nội dung sau:
> "Bạn có chắc chắn muốn xóa CV này không? Các kết quả matching cũ liên quan vẫn được hệ thống lưu trữ để tham chiếu lịch sử."

#### Sample Response (204 No Content):
*(Không có response body).*

---

### 2.7 Phân Tích Lại CV (Reprocess Resume)
*   **Method**: `POST`
*   **Path**: `/api/v1/resumes/{resumeId}/reprocess`

#### Sample Response (200 OK):
```json
{
  "success": true,
  "message": null,
  "data": {
    "jobId": "77777777-e29b-41d4-a716-446655440000",
    "resumeId": "a00a0000-e29b-41d4-a716-446655440000",
    "status": "Queued",
    "requestedAt": "2026-05-22T13:53:00Z"
  },
  "meta": {
    "requestId": "0HN18E6QJS9N7:00000008",
    "timestamp": "2026-05-22T13:53:00Z"
  }
}
```

*Lưu ý:* Sau khi gọi Reprocess thành công, Frontend cần chuyển trạng thái giao diện chi tiết CV về dạng đang xử lý (Processing) và khởi động quy trình Polling dựa trên `resumeId`.

---

### 2.8 Lịch Sử Tiến Trình Xử Lý CV (Resume Processing Jobs)
*   **Method**: `GET`
*   **Path**: `/api/v1/resumes/{resumeId}/processing-jobs`

#### Sample Response (200 OK):
```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "jobId": "99999999-e29b-41d4-a716-446655440000",
      "resumeId": "a00a0000-e29b-41d4-a716-446655440000",
      "status": "Completed",
      "provider": "PythonCvService",
      "correlationId": "corr-1111-2222",
      "errorCode": null,
      "errorMessage": null,
      "retryCount": 0,
      "modelVersion": "interviet-cv-v2",
      "requestedAt": "2026-05-22T13:50:02Z",
      "startedAt": "2026-05-22T13:50:03Z",
      "completedAt": "2026-05-22T13:50:15Z"
    }
  ],
  "meta": {
    "requestId": "0HN18E6QJS9N7:00000009",
    "timestamp": "2026-05-22T13:54:00Z"
  }
}
```

---

### 2.9 Tải File CV Gốc (Download Resume File)
*   **Method**: `GET`
*   **Path**: `/api/v1/resumes/{resumeId}/download`

#### Cách xử lý Blob an sau ở Frontend (TypeScript):
```typescript
import { apiClient } from '../lib/apiClient';

async function handleDownloadResume(resumeId: string, originalFileName: string) {
  try {
    const response = await apiClient.get(`/resumes/${resumeId}/download`, {
      responseType: 'blob'
    });
    
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = originalFileName || 'resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error("Tải file CV thất bại:", error);
  }
}
```

---

## 3. QUY TRÌNH CRUD MÔ TẢ CÔNG VIỆC (JOB DESCRIPTION - JD)

### 3.1 Tạo Mới Mô Tả Công Việc (Create JD)
*   **Method**: `POST`
*   **Path**: `/api/v1/job-descriptions`
*   **Content-Type**: `application/json`

#### Form Request Body:
```json
{
  "title": "Kỹ Sư Phát Triển Backend ASP.NET C#",
  "companyName": "Tập Đoàn Công Nghệ InterViet",
  "location": "Quận 1, TP. Hồ Chí Minh",
  "salaryText": "Thỏa thuận (25M - 40M VND)",
  "sourceUrl": "https://careers.interviet.vn/jobs/aspnet-engineer-102",
  "rawText": "Chúng tôi tìm kiếm 2 Lập trình viên ASP.NET Core có kinh nghiệm phát triển Web API, SQL Server. Yêu cầu kỹ năng: C#, Entity Framework Core, thiết kế microservices, Docker...",
  "postedAt": "2026-05-22"
}
```

#### Validation phía Frontend:
*   `title`: Bắt buộc nhập (tối thiểu 3 ký tự).
*   `companyName`: Bắt buộc nhập (tối thiểu 2 ký tự).
*   `location`: Bắt buộc nhập.
*   `rawText`: Bắt buộc nhập (nội dung text JD đầy đủ để phân tích, tối thiểu 50 ký tự).
*   `sourceUrl`: Nếu có nhập, phải tuân thủ định dạng URL hợp lệ.
*   `postedAt`: Nếu nhập, phải là định dạng ngày hợp lệ (YYYY-MM-DD).

#### Sample Response (201 Created):
```json
{
  "success": true,
  "message": null,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "u00u0000-e29b-41d4-a716-446655440000",
    "title": "Kỹ Sư Phát Triển Backend ASP.NET C#",
    "companyName": "Tập Đoàn Công Nghệ InterViet",
    "location": "Quận 1, TP. Hồ Chí Minh",
    "salaryText": "Thỏa thuận (25M - 40M VND)",
    "sourceUrl": "https://careers.interviet.vn/jobs/aspnet-engineer-102",
    "rawText": "Chúng tôi tìm kiếm 2 Lập trình viên ASP.NET Core có kinh nghiệm phát triển Web API, SQL Server. Yêu cầu kỹ năng: C#, Entity Framework Core, thiết kế microservices, Docker...",
    "postedAt": "2026-05-22",
    "createdAt": "2026-05-22T13:55:00Z",
    "updatedAt": "2026-05-22T13:55:00Z"
  },
  "meta": {
    "requestId": "0HN18E6QJS9N7:00000010",
    "timestamp": "2026-05-22T13:55:00Z"
  }
}
```

---

### 3.2 Lấy Danh Sách JD (List Job Descriptions)
*   **Method**: `GET`
*   **Path**: `/api/v1/job-descriptions`
*   **Query Parameters**:
    *   `page` *(int, mặc định = 1)*
    *   `pageSize` *(int, mặc định = 10)*

#### Sample Response (200 OK):
```json
{
  "success": true,
  "message": null,
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "userId": "u00u0000-e29b-41d4-a716-446655440000",
        "title": "Kỹ Sư Phát Triển Backend ASP.NET C#",
        "companyName": "Tập Đoàn Công Nghệ InterViet",
        "location": "Quận 1, TP. Hồ Chí Minh",
        "salaryText": "Thỏa thuận (25M - 40M VND)",
        "sourceUrl": "https://careers.interviet.vn/jobs/aspnet-engineer-102",
        "rawText": "Chúng tôi tìm kiếm 2 Lập trình viên ASP.NET Core...",
        "postedAt": "2026-05-22",
        "createdAt": "2026-05-22T13:55:00Z",
        "updatedAt": "2026-05-22T13:55:00Z"
      }
    ],
    "totalCount": 1,
    "page": 1,
    "pageSize": 10
  },
  "meta": {
    "requestId": "0HN18E6QJS9N7:00000011",
    "timestamp": "2026-05-22T13:55:30Z"
  }
}
```

#### Empty State JSON (Nếu user chưa tạo JD nào):
```json
{
  "success": true,
  "message": null,
  "data": {
    "items": [],
    "totalCount": 0,
    "page": 1,
    "pageSize": 10
  },
  "meta": {
    "requestId": "0HN18E6QJS9N7:00000012",
    "timestamp": "2026-05-22T13:55:40Z"
  }
}
```

---

### 3.3 Chi Tiết Mô Tả Công Việc (Job Description Detail)
*   **Method**: `GET`
*   **Path**: `/api/v1/job-descriptions/{jobDescriptionId}`

#### Sample Response (200 OK):
```json
{
  "success": true,
  "message": null,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "u00u0000-e29b-41d4-a716-446655440000",
    "title": "Kỹ Sư Phát Triển Backend ASP.NET C#",
    "companyName": "Tập Đoàn Công Nghệ InterViet",
    "location": "Quận 1, TP. Hồ Chí Minh",
    "salaryText": "Thỏa thuận (25M - 40M VND)",
    "sourceUrl": "https://careers.interviet.vn/jobs/aspnet-engineer-102",
    "rawText": "Chúng tôi tìm kiếm 2 Lập trình viên ASP.NET Core có kinh nghiệm phát triển Web API, SQL Server. Yêu cầu kỹ năng: C#, Entity Framework Core, thiết kế microservices, Docker...",
    "postedAt": "2026-05-22",
    "createdAt": "2026-05-22T13:55:00Z",
    "updatedAt": "2026-05-22T13:55:00Z"
  },
  "meta": {
    "requestId": "0HN18E6QJS9N7:00000013",
    "timestamp": "2026-05-22T13:56:00Z"
  }
}
```

---

### 3.4 Cập Nhật Mô Tả Công Việc (Update JD)
*   **Method**: `PUT`
*   **Path**: `/api/v1/job-descriptions/{jobDescriptionId}`
*   **Content-Type**: `application/json`

#### Form Request Body:
```json
{
  "title": "Kỹ Sư Backend ASP.NET C# (Senior)",
  "companyName": "Tập Đoàn Công Nghệ InterViet",
  "location": "Quận 1, TP. Hồ Chí Minh",
  "salaryText": "30M - 50M VND",
  "sourceUrl": "https://careers.interviet.vn/jobs/aspnet-engineer-102",
  "rawText": "Cập nhật yêu cầu: Tối thiểu 4 năm kinh nghiệm làm việc với C# và hệ sinh thái .NET...",
  "postedAt": "2026-05-22"
}
```

#### Sample Response (200 OK):
```json
{
  "success": true,
  "message": null,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "u00u0000-e29b-41d4-a716-446655440000",
    "title": "Kỹ Sư Backend ASP.NET C# (Senior)",
    "companyName": "Tập Đoàn Công Nghệ InterViet",
    "location": "Quận 1, TP. Hồ Chí Minh",
    "salaryText": "30M - 50M VND",
    "sourceUrl": "https://careers.interviet.vn/jobs/aspnet-engineer-102",
    "rawText": "Cập nhật yêu cầu: Tối thiểu 4 năm kinh nghiệm làm việc với C# và hệ sinh thái .NET...",
    "postedAt": "2026-05-22",
    "createdAt": "2026-05-22T13:55:00Z",
    "updatedAt": "2026-05-22T13:57:00Z"
  },
  "meta": {
    "requestId": "0HN18E6QJS9N7:00000014",
    "timestamp": "2026-05-22T13:57:00Z"
  }
}
```

---

### 3.5 Xóa Mô Tả Công Việc (Delete JD)
*   **Method**: `DELETE`
*   **Path**: `/api/v1/job-descriptions/{jobDescriptionId}`

#### Quy tắc xác nhận phía Frontend:
Hiển thị một Modal xác nhận trước khi gửi lệnh xóa:
> "Bạn có chắc chắn muốn xóa Mô tả công việc này không? Các kết quả đối sánh (matching) cũ thuộc mô tả này vẫn sẽ được giữ lại trong lịch sử hệ thống."

#### Sample Response (204 No Content):
*(Không có response body).*

---

## 4. QUY TRÌNH ĐỐI SÁNH CV VỚI JD (CV-JD MATCHING PROCESS)

Quy trình đối sánh CV-JD là quy trình bất đồng bộ (Asynchronous). Khi bấm nút "Bắt đầu đối sánh", Backend sẽ tạo phiên và trả về ngay mã trạng thái `202 Accepted` cùng `sessionId`. Frontend sẽ điều hướng sang trang kết quả và chạy Polling cho đến khi tiến trình hoàn tất.

### 4.1 Tạo Phiên Đối Sánh Đơn (Single Match Request)
*   **Method**: `POST`
*   **Path**: `/api/v1/matches`
*   **Content-Type**: `application/json`

#### Request Body:
```json
{
  "resumeId": "a00a0000-e29b-41d4-a716-446655440000",
  "jobDescriptionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Sample Response (202 Accepted):
```json
{
  "success": true,
  "message": null,
  "data": {
    "sessionId": "b00b0000-e29b-41d4-a716-446655440000",
    "resumeId": "a00a0000-e29b-41d4-a716-446655440000",
    "jobDescriptionId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "Pending",
    "requestedAt": "2026-05-22T13:58:00Z"
  },
  "meta": {
    "requestId": "0HN18E6QJS9N7:00000015",
    "timestamp": "2026-05-22T13:58:00Z"
  }
}
```

---

### 4.2 Tạo Phiên Đối Sánh Đa (Multi-JD Match Request)
*   **Method**: `POST`
*   **Path**: `/api/v1/matches/multi`
*   **Content-Type**: `application/json`

#### Request Body:
```json
{
  "resumeId": "a00a0000-e29b-41d4-a716-446655440000",
  "jobDescriptionIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001"
  ],
  "title": "Chiến dịch tuyển dụng Backend Q2"
}
```

#### Sample Response (202 Accepted):
```json
{
  "success": true,
  "message": null,
  "data": {
    "sessionId": "b00b0000-e29b-41d4-a716-446655449999",
    "resumeId": "a00a0000-e29b-41d4-a716-446655440000",
    "sessionType": "Multi",
    "status": "Pending",
    "targetCount": 2,
    "requestedAt": "2026-05-22T13:59:00Z"
  },
  "meta": {
    "requestId": "0HN18E6QJS9N7:00000016",
    "timestamp": "2026-05-22T13:59:00Z"
  }
}
```

> [!TIP]
> **Tối ưu hóa hiệu năng (Phase 6):** Backend C# đã áp dụng cơ chế xử lý song song có kiểm soát (Concurrency Control) bằng `SemaphoreSlim`. Khi người dùng chạy đối sánh đa JD (Multi-JD Match), hệ thống sẽ gửi đồng thời tối đa **3 request song song cùng lúc** để phân tích thay vì chạy tuần tự từng cái một. Cải tiến này giúp tốc độ phản hồi tổng thể của phiên đối sánh đa nhanh gấp 3 lần, giúp nâng cao trải nghiệm người dùng tối đa!

---

### 4.3 Danh Sách Lịch Sử Đối Sánh (List Match Sessions)
*   **Method**: `GET`
*   **Path**: `/api/v1/matches`
*   **Query Parameters**:
    *   `page` *(int, mặc định = 1)*
    *   `pageSize` *(int, mặc định = 10)*

#### Sample Response (200 OK):
```json
{
  "success": true,
  "message": null,
  "data": {
    "items": [
      {
        "sessionId": "b00b0000-e29b-41d4-a716-446655440000",
        "resumeId": "a00a0000-e29b-41d4-a716-446655440000",
        "resumeVersionId": "a00a0000-e29b-41d4-a716-446655440001",
        "jobDescriptionId": "550e8400-e29b-41d4-a716-446655440000",
        "sessionType": "Single",
        "status": "Completed",
        "errorCode": null,
        "errorMessage": null,
        "requestedAt": "2026-05-22T13:58:00Z",
        "completedAt": "2026-05-22T13:58:15Z",
        "targetCount": 1,
        "completedCount": 1,
        "failedCount": 0,
        "bestScore": 85.50,
        "averageScore": 85.50,
        "result": null,
        "targets": null
      }
    ],
    "totalCount": 1,
    "page": 1,
    "pageSize": 10
  },
  "meta": {
    "requestId": "0HN18E6QJS9N7:00000017",
    "timestamp": "2026-05-22T13:59:30Z"
  }
}
```

---

### 4.4 Kết Quả / Chi Tiết Phiên Đối Sánh (Match Session Detail / Result)
Được dùng cho Polling để cập nhật giao diện kết quả. API này trả về 4 kịch bản trạng thái dữ liệu chính xác tuyệt đối như sau:

#### Kịch Bản A: Đối Sánh Đơn Đã Hoàn Thành (Single Match - Completed)
Kết quả phân tích đầy đủ nằm trong đối tượng `result`. Các tham số `bestScore`, `averageScore` và mảng `targets` sẽ là `null`.

```json
{
  "success": true,
  "message": null,
  "data": {
    "sessionId": "b00b0000-e29b-41d4-a716-446655440000",
    "resumeId": "a00a0000-e29b-41d4-a716-446655440000",
    "resumeVersionId": "a00a0000-e29b-41d4-a716-446655440001",
    "jobDescriptionId": "550e8400-e29b-41d4-a716-446655440000",
    "sessionType": "Single",
    "status": "Completed",
    "errorCode": null,
    "errorMessage": null,
    "requestedAt": "2026-05-22T13:58:00Z",
    "completedAt": "2026-05-22T13:58:15Z",
    "targetCount": 1,
    "completedCount": 1,
    "failedCount": 0,
    "bestScore": null,
    "averageScore": null,
    "result": {
      "id": "c00c0000-e29b-41d4-a716-446655440000",
      "totalScore": 85.50,
      "technicalScore": 90.00,
      "experienceScore": 80.00,
      "educationScore": 85.00,
      "languageScore": 100.00,
      "matchBand": "High",
      "summaryText": "Ứng viên Nguyễn Văn A thể hiện sự phù hợp cao đối với vị trí Kỹ Sư ASP.NET C#. Kỹ năng kỹ thuật và khả năng sử dụng tiếng Anh là những điểm cộng rất lớn.",
      "matchedSkillsJson": "[\"C#\", \".NET Core\", \"SQL Server\", \"Web API\", \"Docker\"]",
      "missingSkillsJson": "[\"Entity Framework Core\", \"Microservices\"]",
      "strengthsJson": "[\"Kinh nghiệm 5 năm làm backend C# vững chắc.\", \"Điểm đánh giá ngoại ngữ hoàn hảo (IELTS 7.0).\", \"Kinh nghiệm tối ưu hóa truy vấn SQL ấn tượng.\"]",
      "weaknessesJson": "[\"Thiếu kinh nghiệm sâu về mô hình kiến trúc Microservices.\", \"Mức độ thuần thục với Entity Framework Core chưa được nêu rõ trong CV.\"]",
      "suggestionsJson": "[\"Bổ sung dự án thực tế sử dụng Entity Framework Core vào CV.\", \"Tìm hiểu và thực hành thêm về hệ thống phân tán và giao tiếp giữa các microservices.\"]",
      "modelVersion": "interviet-match-v3",
      "schemaVersion": "1.0",
      "createdAt": "2026-05-22T13:58:15Z"
    },
    "targets": null
  },
  "meta": {
    "requestId": "0HN18E6QJS9N7:00000019",
    "timestamp": "2026-05-22T13:59:00Z"
  }
}
```

---

#### Kịch Bản B: Đối Sánh Đa Đã Hoàn Thành (Multi-JD Match - Completed)
Kết quả nằm hoàn toàn trong mảng `targets`. Đối tượng `result` ở root sẽ là `null`.

```json
{
  "success": true,
  "message": null,
  "data": {
    "sessionId": "b00b0000-e29b-41d4-a716-446655449999",
    "resumeId": "a00a0000-e29b-41d4-a716-446655440000",
    "resumeVersionId": "a00a0000-e29b-41d4-a716-446655440001",
    "jobDescriptionId": null,
    "sessionType": "Multi",
    "status": "Completed",
    "errorCode": null,
    "errorMessage": null,
    "requestedAt": "2026-05-22T13:59:00Z",
    "completedAt": "2026-05-22T13:59:20Z",
    "targetCount": 2,
    "completedCount": 2,
    "failedCount": 0,
    "bestScore": 92.00,
    "averageScore": 81.50,
    "result": null,
    "targets": [
      {
        "targetId": "d00d0000-e29b-41d4-a716-446655440001",
        "jobDescriptionId": "550e8400-e29b-41d4-a716-446655440000",
        "jobTitle": "Kỹ Sư Phát Triển Backend ASP.NET C#",
        "companyName": "Tập Đoàn Công Nghệ InterViet",
        "status": "Completed",
        "totalScore": 92.00,
        "technicalScore": 95.00,
        "experienceScore": 90.00,
        "educationScore": 90.00,
        "languageScore": 100.00,
        "summaryText": "Sự ăn khớp xuất sắc về mặt công nghệ (.NET Core/C#) và thời gian kinh nghiệm thực tế.",
        "matchedSkillsJson": "[\"C#\", \".NET Core\", \"SQL Server\", \"Docker\"]",
        "missingSkillsJson": "[\"Kubernetes\"]",
        "strengthsJson": "[\"Kinh nghiệm 5 năm làm backend C# vững chắc.\", \"Có kinh nghiệm với Docker.\"]",
        "weaknessesJson": "[\"Thiếu kinh nghiệm sâu về Kubernetes.\"]",
        "suggestionsJson": "[\"Bổ sung dự án thực tế sử dụng Kubernetes vào CV.\"]",
        "completedAt": "2026-05-22T13:59:12Z",
        "errorCode": null
      },
      {
        "targetId": "d00d0000-e29b-41d4-a716-446655440002",
        "jobDescriptionId": "550e8400-e29b-41d4-a716-446655440001",
        "jobTitle": "Lập Trình Viên Fullstack React / Node.js",
        "companyName": "VinTech Solutions",
        "status": "Completed",
        "totalScore": 71.00,
        "technicalScore": 60.00,
        "experienceScore": 80.00,
        "educationScore": 90.00,
        "languageScore": 100.00,
        "summaryText": "Ứng viên có kỹ năng nền tảng vững, nhưng thiếu chuyên môn thực tế về mảng frontend React.",
        "matchedSkillsJson": "[\"Node.js (Cơ bản)\", \"Git\"]",
        "missingSkillsJson": "[\"React.js\", \"TypeScript\", \"TailwindCSS\"]",
        "strengthsJson": "[\"Nền tảng vững với Node.js và Git.\"]",
        "weaknessesJson": "[\"Chưa có kinh nghiệm thực chiến với React.js và TypeScript.\"]",
        "suggestionsJson": "[\"Tìm hiểu thêm về React Hooks, Redux Toolkit và TypeScript core.\"]",
        "completedAt": "2026-05-22T13:59:20Z",
        "errorCode": null
      }
    ]
  },
  "meta": {
    "requestId": "0HN18E6QJS9N7:00000020",
    "timestamp": "2026-05-22T14:00:00Z"
  }
}
```

---

#### Kịch Bản C: Phiên Đang Chờ / Đang Đối Sánh (Pending / Processing)
Trạng thái đối sánh dở dang. Các trường kết quả phân tích chưa được hình thành.

```json
{
  "success": true,
  "message": null,
  "data": {
    "sessionId": "b00b0000-e29b-41d4-a716-446655440000",
    "resumeId": "a00a0000-e29b-41d4-a716-446655440000",
    "resumeVersionId": "a00a0000-e29b-41d4-a716-446655440001",
    "jobDescriptionId": "550e8400-e29b-41d4-a716-446655440000",
    "sessionType": "Single",
    "status": "Processing",
    "errorCode": null,
    "errorMessage": null,
    "requestedAt": "2026-05-22T13:58:00Z",
    "completedAt": null,
    "targetCount": 1,
    "completedCount": 0,
    "failedCount": 0,
    "bestScore": null,
    "averageScore": null,
    "result": null,
    "targets": null
  },
  "meta": {
    "requestId": "0HN18E6QJS9N7:00000021",
    "timestamp": "2026-05-22T13:58:05Z"
  }
}
```

---

#### Kịch Bản D: Phiên Đối Sánh Thất Bại (Failed)
Hệ thống gặp sự cố trong tiến trình xử lý bất đồng bộ (Ví dụ: Python AI Service gặp lỗi).

```json
{
  "success": true,
  "message": null,
  "data": {
    "sessionId": "b00b0000-e29b-41d4-a716-446655440000",
    "resumeId": "a00a0000-e29b-41d4-a716-446655440000",
    "resumeVersionId": "a00a0000-e29b-41d4-a716-446655440001",
    "jobDescriptionId": "550e8400-e29b-41d4-a716-446655440000",
    "sessionType": "Single",
    "status": "Failed",
    "errorCode": "Match.AiServiceFailed",
    "errorMessage": "Dịch vụ phân tích AI không phản hồi kịp thời. Vui lòng thực hiện đối sánh lại.",
    "requestedAt": "2026-05-22T13:58:00Z",
    "completedAt": "2026-05-22T13:58:08Z",
    "targetCount": 1,
    "completedCount": 0,
    "failedCount": 1,
    "bestScore": null,
    "averageScore": null,
    "result": null,
    "targets": null
  },
  "meta": {
    "requestId": "0HN18E6QJS9N7:00000022",
    "timestamp": "2026-05-22T13:58:10Z"
  }
}
```

---

## 5. BỘ TRỢ GIÚP TÍCH HỢP CHO FRONTEND (INTEGRATION HELPERS)

### 5.1 Bộ Phân Tích JSON String An Toàn (Safe JSON Parser)
Rất nhiều dữ liệu phân tích trả về từ Backend (như kỹ năng, kinh nghiệm, điểm mạnh, điểm yếu...) được lưu dưới dạng chuỗi JSON thô (JSON String) trong cơ sở dữ liệu để tối ưu hóa linh hoạt lưu trữ cấu trúc. 
**Yêu cầu nghiêm ngặt:** Cấm tuyệt đối việc gọi `JSON.parse` trực tiếp tại giao diện render mà không được đặt trong khối `try/catch`. 

Dưới đây là module Helper chuẩn mực viết bằng TypeScript giúp parse an toàn 100%, tự động fallback về cấu trúc mặc định nếu chuỗi rỗng hoặc lỗi cú pháp:

```typescript
/**
 * Bộ phân tích JSON an toàn dành cho dự án INTER-VIET.
 * Ngăn chặn tuyệt đối hiện tượng sập giao diện (Crash UI) khi gặp dữ liệu lỗi.
 */
export function safeParseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) {
    return fallback;
  }
  
  if (typeof value !== 'string') {
    // Nếu giá trị đã được parse sẵn ở tầng interceptor
    return value as T;
  }
  
  const trimmed = value.trim();
  if (trimmed === '') {
    return fallback;
  }
  
  try {
    const parsed = JSON.parse(trimmed);
    return parsed as T;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn("Lỗi phân tích JSON tại hệ thống INTER-VIET. Chuỗi thô:", trimmed, error);
    }
    return fallback;
  }
}

// ── Hướng Dẫn Render Dữ Liệu Phẳng Dạng String Cho Frontend ─────────────────

/*
  Sau khi gọi `safeParseJson` trên các trường của `parsedData` (skillsJson, experiencesJson,...)
  Frontend sẽ nhận được các chuỗi chữ thô (String) hoặc mảng rỗng tùy theo fallback.
  Dưới đây là gợi ý cách render mượt mà, tối ưu nhất phía Frontend:
*/

// 1. Đối với skillsJson (Chuỗi các kỹ năng ngăn cách bằng dấu phẩy):
// Ví dụ: "C#, .NET Core, SQL Server, Web API"
const parseSkills = (skillsJson: string | null): string[] => {
  if (!skillsJson) return [];
  // Loại bỏ các ký tự escape dư thừa nếu có và split bằng dấu phẩy
  const cleanStr = skillsJson.replace(/^"+|"+$/g, '').trim();
  return cleanStr ? cleanStr.split(',').map(s => s.trim()) : [];
};

// Giao diện React render Kỹ năng dạng Chips:
// {parseSkills(parsedData.skillsJson).map((skill, index) => (
//   <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
//     {skill}
//   </span>
// ))}

// 2. Đối với các trường đoạn văn (experiencesJson, educationsJson, projectsJson, certificationsJson, languagesJson):
// Các trường này hiện là dạng chuỗi mô tả phẳng, Frontend chỉ cần render dạng văn bản hoặc ngắt dòng an toàn:
// <p className="text-gray-700 whitespace-pre-line">
//   {safeParseJson(parsedData.experiencesJson, "Chưa cập nhật kinh nghiệm")}
// </p>
```

---

### 5.2 Custom Hook Thực Hiện Polling Bất Đồng Bộ (React Hooks)
Quy trình Polling an toàn bắt buộc phải đảm bảo:
1. Hủy interval lập tức khi component unmount để tránh rò rỉ bộ nhớ.
2. Dừng polling ngay khi tiến trình chuyển sang trạng thái cuối (`Completed`, `Failed`, `Cancelled`).
3. Dừng khi gặp lỗi đặc thù (`401 Unauthorized`, `404 Not Found`).
4. Tự động chấm dứt (Timeout) sau tối đa 3 phút để tránh vòng lặp vô hạn.

Dưới đây là mã nguồn Custom Hook hoàn chỉnh bằng React/TypeScript để chạy Polling cho cả CV Parse và Match Session:

```typescript
import { useEffect, useState, useRef } from 'react';

type PollingStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Cancelled';

interface PollingHookOptions<T> {
  fetchFn: () => Promise<T>;
  getStatusFn: (data: T) => string;
  intervalMs?: number;
  timeoutMs?: number;
  onSuccess?: (data: T) => void;
  onFailure?: (error: any) => void;
}

export function useAsyncPolling<T>({
  fetchFn,
  getStatusFn,
  intervalMs = 3000,
  timeoutMs = 180000, // Tối đa 3 phút
  onSuccess,
  onFailure
}: PollingHookOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<any>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const stopPolling = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPolling(false);
  };

  const startPolling = () => {
    stopPolling();
    setIsPolling(true);
    setError(null);
    startTimeRef.current = Date.now();
    
    const tick = async () => {
      // 1. Kiểm tra giới hạn thời gian (Timeout)
      if (Date.now() - startTimeRef.current > timeoutMs) {
        stopPolling();
        const timeoutError = new Error("Hết thời gian chờ hệ thống phân tích. Vui lòng tải lại trang.");
        setError(timeoutError);
        if (onFailure) onFailure(timeoutError);
        return;
      }

      try {
        const response = await fetchFn();
        setData(response);
        
        const rawStatus = getStatusFn(response);
        const status = rawStatus.trim().toLowerCase();

        // 2. Kiểm tra các trạng thái kết thúc (Final States)
        if (status === 'completed' || status === 'parsed') {
          stopPolling();
          if (onSuccess) onSuccess(response);
        } else if (status === 'failed' || status === 'cancelled') {
          stopPolling();
          const processingError = new Error("Tiến trình phân tích bị thất bại trên server.");
          setError(processingError);
          if (onFailure) onFailure(processingError);
        }
      } catch (err: any) {
        // 3. Dừng Polling ngay nếu gặp các lỗi nghiêm trọng
        if (err?.response?.status === 401 || err?.response?.status === 404) {
          stopPolling();
          setError(err);
          if (onFailure) onFailure(err);
        }
      }
    };

    tick();
    timerRef.current = setInterval(tick, intervalMs);
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  return { data, isPolling, error, startPolling, stopPolling };
}
```

---

## 6. XỬ LÝ LỖI HỆ THỐNG VÀ GIỚI HẠN GÓI CƯỚC (QUOTA & ERRORS)

### 6.1 Lỗi Vượt Quá Giới Hạn Lượt Dùng (403 Quota.Exceeded)
Khi người dùng dùng hết quota tải CV hoặc số lượng lượt đối sánh, API trả về trạng thái HTTP `403 Forbidden`.

#### Cách xử lý ở Frontend:
*   Phát hiện mã lỗi `Quota.Exceeded` trong phản hồi.
*   Hiển thị thông báo thân thiện: **"Bạn đã sử dụng hết lượt trong gói cước hiện tại."**
*   Cung cấp nút Kêu Gọi Hành Động (CTA Button) nổi bật để chuyển hướng người dùng đến trang nâng cấp gói dịch vụ (`/subscription` hoặc `/plans`).
*   **Cấm**: Tuyệt đối không tự động kích hoạt tiến trình chạy lại (retry) hoặc tạo dữ liệu giả thành công.

#### JSON Lỗi Quota.Exceeded thực tế:
```json
{
  "type": "https://api.interviet.vn/errors/quota-exceeded",
  "title": "Quota.Exceeded",
  "detail": "Bạn đã sử dụng hết số lượt phân tích CV/đối sánh trong chu kỳ này.",
  "code": "Quota.Exceeded"
}
```

### 6.2 Lỗi Dịch Vụ AI Tạm Thời Không Khả Dụng (503 Service Unavailable)
Xảy ra khi Python AI/CV service (cổng 8001) tắt hoặc quá tải. C# Backend không thể lấy kết quả phân tích.

#### Cách xử lý ở Frontend:
*   Phát hiện trạng thái HTTP `503 Service Unavailable` hoặc mã lỗi `Service.Unavailable`.
*   Hiển thị thông báo thân thiện: **"Dịch vụ phân tích AI/CV hiện tạm thời không khả dụng. Xin vui lòng thử lại sau ít phút."**
*   **Cấm**: Tuyệt đối không hiển thị dòng code/trace lỗi kỹ thuật trực tiếp lên UI ứng dụng, không tự ý bypass qua backend C# để gọi thẳng dịch vụ Python ở cổng 8001.

#### JSON Lỗi Service Unavailable thực tế:
```json
{
  "type": "https://api.interviet.vn/errors/service-unavailable",
  "title": "Service.Unavailable",
  "detail": "Dịch vụ AI phân tích CV tạm thời gián đoạn.",
  "code": "Service.Unavailable"
}
```

---

## 7. BẢNG KIỂM TRA CHẤT LƯỢNG TÍCH HỢP PHASE 3 (TESTING CHECKLIST)

Bảng checklist gồm 35 điều kiện chuẩn giúp đội ngũ Frontend kiểm tra chéo (self-test) trước khi tiến hành nghiệm thu:

| STT | Phân Vùng | Mô Tả Điều Kiện Kiểm Thử (Validation Rule) | Trạng Thế |
| :--- | :--- | :--- | :---: |
| 1 | **Upload CV** | Chọn file đúng định dạng `.pdf`, `.docx`, `.png`, `.jpg` <= 10MB thành công. | [ ] |
| 2 | **Upload CV** | Chọn file sai đuôi (ví dụ: `.zip`, `.txt`) hiển thị cảnh báo chặn ngay tại Client. | [ ] |
| 3 | **Upload CV** | Chọn file > 10MB hiển thị cảnh báo chặn kích thước ngay tại Client. | [ ] |
| 4 | **Upload CV** | MultipartFormData truyền chính xác từ khóa key đầu `File` (không viết thường thành `file`). | [ ] |
| 5 | **Upload CV** | Trường tiêu đề `Title` gửi kèm dạng text tùy chọn lên server thành công. | [ ] |
| 6 | **Upload CV** | Không set cứng `Content-Type` khi đóng gói FormData. | [ ] |
| 7 | **Upload CV** | Ngay sau khi upload, CV hiển thị trạng thái đang chờ phân tích (`Queued` hoặc `Processing`). | [ ] |
| 8 | **Upload CV** | Tiến trình Polling GET `/resumes/{id}` tự động kích hoạt chu kỳ mỗi 3-5 giây. | [ ] |
| 9 | **Upload CV** | Polling dừng thông minh và cập nhật giao diện khi server trả trạng thái `Parsed`. | [ ] |
| 10 | **Upload CV** | Polling dừng thông minh và hiển thị lỗi thân thiện khi server trả trạng thái `Failed`. | [ ] |
| 11 | **CV List** | Hiển thị đầy đủ danh sách gồm Title, tên tệp tin gốc, kích thước, trạng thái, ngày tạo. | [ ] |
| 12 | **CV List** | Hiển thị giao diện "Empty State" đẹp khi user chưa có CV nào với nút CTA dẫn tới Upload. | [ ] |
| 13 | **CV Detail** | Sử dụng module `safeParseJson` để bóc tách các trường JSON string thô mà không gây lỗi giao diện. | [ ] |
| 14 | **CV Detail** | Hiển thị rõ ràng các trường thông tin parsed: Skills, Kinh Nghiệm, Học Vấn, Cảnh Báo CV. | [ ] |
| 15 | **Set Active** | Nút bấm "Set Active" gọi API thành công và tự động fetch lại danh sách CV mới. | [ ] |
| 16 | **Delete CV** | Hiển thị Modal xác nhận trước khi thực thi xóa. Xóa thành công tự động cập nhật lại danh sách. | [ ] |
| 17 | **Reprocess** | Gọi API Reprocess thành công, chuyển CV về Processing và kích hoạt Polling chi tiết. | [ ] |
| 18 | **Download** | Nút tải xuống hoạt động chuẩn qua cơ chế Blob Download, bảo toàn tên tệp tin và định dạng. | [ ] |
| 19 | **JD CRUD** | Form tạo mới/chỉnh sửa JD yêu cầu bắt buộc Title và RawText. | [ ] |
| 20 | **JD CRUD** | Kiểm tra URL hợp lệ đối với trường `sourceUrl` tại form nhập liệu. | [ ] |
| 21 | **JD CRUD** | Thêm mới JD thành công và điều hướng mượt mà về danh sách. | [ ] |
| 22 | **JD CRUD** | Hiển thị giao diện "Empty State" tinh tế cho danh sách JD kèm CTA tạo JD đầu tiên. | [ ] |
| 23 | **JD CRUD** | Hiển thị chi tiết nội dung văn bản gốc đầy đủ của JD. | [ ] |
| 24 | **JD CRUD** | Chỉnh sửa JD cập nhật mượt mà dữ liệu lên máy chủ. | [ ] |
| 25 | **JD CRUD** | Xóa JD hiển thị cảnh báo xác nhận lịch sử matching. | [ ] |
| 26 | **Matching** | Giao diện cho phép người dùng chọn rõ ràng 1 CV và nổi bật CV đang là Active. | [ ] |
| 27 | **Matching** | Chọn 1 JD cho tiến trình Single Match, gọi đúng API `/matches` và chuyển sang màn kết quả. | [ ] |
| 28 | **Matching** | Chọn nhiều JD cho tiến trình Multi Match, gọi đúng API `/matches/multi` và chuyển màn. | [ ] |
| 29 | **Matching** | Giao diện màn hình kết quả hiển thị thông tin chờ đợi kèm spinner: "Đang phân tích mức độ phù hợp..." | [ ] |
| 30 | **Matching** | Polling GET `/matches/{sessionId}` chạy chuẩn chu kỳ 3-5 giây và dừng khi trạng thái là cuối. | [ ] |
| 31 | **Matching** | Khử Polling triệt để khi chuyển trang (unmount component). | [ ] |
| 32 | **Matching** | Đối sánh Single Match hoàn thành hiển thị đúng cấu trúc điểm số, điểm mạnh, yếu từ `result`. | [ ] |
| 33 | **Matching** | Đối sánh Multi Match hoàn thành hiển thị danh sách sắp xếp bảng xếp hạng (ranking) từ `targets`. | [ ] |
| 34 | **Quota** | Khi API trả 403 `Quota.Exceeded`, giao diện hiển thị thông báo khóa lượt và nút CTA nâng cấp gói cước. | [ ] |
| 35 | **Service** | Khi API trả 503 `Service.Unavailable`, hiển thị lỗi dịch vụ AI gián đoạn, cấm gọi trực tiếp Python. | [ ] |

---

Tài liệu đặc tả tích hợp Phase 3 này được xây dựng vững chắc để đảm bảo việc tích hợp diễn ra trơn tru, chính xác và hiệu quả tuyệt đối!
