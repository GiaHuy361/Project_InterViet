# INTER-VIET CV Intelligence Service

Dịch vụ này xử lý CV để trích xuất dữ liệu bằng AI và chuẩn bị thông tin cho quá trình matching với Job Description. Ứng dụng sử dụng FastAPI và Google Gemini AI.

## Tổng quan

Dịch vụ hiện tại cung cấp:
- Trích xuất văn bản thô từ CV
- Nhận diện ngôn ngữ CV (Vietnamese / English)
- Trích xuất các phần chính như summary, skills, experiences, educations, projects, certifications, languages
- Hỗ trợ file PDF, DOCX, JPG, JPEG, PNG
- Chỉ hỗ trợ `DOCX`, không hỗ trợ `.doc` cũ
- Retry tự động khi gọi Gemini và chuyển sang model khác khi cần
- Rate limit theo user
- Pool nhiều Gemini API key

## Tính năng quan trọng

- Hỗ trợ nhiều API key Gemini: `GEMINI_API_KEY_1`...`GEMINI_API_KEY_3`
- Fallback về `GEMINI_API_KEY` khi chỉ có một key
- Retry và chuyển model khi Gemini quá tải
- Rate limit `5 request / phút / user`
- Xử lý file DOCX bằng `python-docx`
- Trả về lỗi theo định dạng envelope thống nhất

## Yêu cầu hệ thống

- Python 3.8+
- `conda` hoặc môi trường ảo `venv`

## Cài đặt

1. Tạo môi trường ảo và kích hoạt:
```bash
conda create -n interviet_ai_service python=3.10
conda activate interviet_ai_service
```

2. Cài dependencies:
```bash
pip install -r requirements.txt
```

## Cấu hình môi trường

Tạo file `.env` ở thư mục gốc và thêm:

```env
GEMINI_API_KEY_1=your_gemini_api_key_1
# ...
GEMINI_API_KEY_9=your_gemini_api_key_3
```

Hoặc nếu chỉ có một key:

```env
GEMINI_API_KEY=your_gemini_api_key
```

## Chạy ứng dụng

```bash
uvicorn main:app --reload --port 8001
```

Truy cập:

http://localhost:8001

## Health check

Kiểm tra trạng thái service.

**Endpoint:** `/health`

**Response ví dụ:**
```json
{
  "status": "Healthy",
  "active_keys": 1
}
```

## Endpoints

### POST /v1/cv/parse

Endpoint chính để phân tích CV.

**Yêu cầu multipart/form-data:**
- `file`: file CV (PDF, DOCX, JPG, JPEG, PNG)
- `resumeId`: ID của CV
- `userId`: ID người dùng
- `originalFileName`: Tên file gốc
- `contentType`: Kiểu nội dung file
- `correlationId`: ID tương quan
- `requestId`: ID yêu cầu
- `schemaVersion`: Phiên bản schema
- `resumeVersionId`: ID phiên bản CV (tùy chọn)

**Response thành công:**
```json
{
  "success": true,
  "data": {
    "resumeId": "...",
    "rawText": "...",
    "detectedLanguage": "vi",
    "sections": { "summary": "..." },
    "skills": "...",
    "experiences": "...",
    "educations": "...",
    "projects": "...",
    "certifications": "...",
    "languages": "...",
    "warnings": [],
    "modelVersion": "cv-parser-v1-gemini-flash",
    "schemaVersion": "resume-parse-v1"
  },
  "error": null
}
```

**Response lỗi:**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "UNSUPPORTED_FORMAT",
    "message": "Chỉ hỗ trợ PDF, DOCX, JPG, JPEG, PNG.",
    "correlationId": "...",
    "requestId": "...",
    "schemaVersion": "resume-parse-v1"
  }
}
```

## Ghi chú sử dụng

- Với file DOCX, hệ thống sẽ đọc văn bản bằng `python-docx`.
- Với file PDF/JPG/PNG, nội dung file được gửi trực tiếp cho Gemini.
- Nếu AI trả về JSON không hợp lệ, lỗi `FILE_PARSE_FAILED` sẽ được trả.
- Nếu vượt quá hạn mức, lỗi `RATE_LIMIT_EXCEEDED` sẽ được trả.

## Dependencies

- `fastapi`
- `uvicorn`
- `python-multipart`
- `google-genai`
- `pydantic`
- `python-dotenv`
- `python-docx`
- `tenacity`
- `slowapi`

## Cấu trúc dự án

```
Project_InterViet/
├── main.py          # API và logic parse CV
├── requirements.txt # Dependencies
├── README.md        # Tài liệu dự án
└── .env             # Biến môi trường (tạo riêng)
```
