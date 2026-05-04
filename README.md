# INTER-VIET CV Intelligence Service

Dịch vụ trí tuệ nhân tạo xử lý CV (Curriculum Vitae) cho hệ thống INTER-VIET. Dự án này sử dụng FastAPI và Google Gemini AI để phân tích và trích xuất thông tin từ CV.

## Mô tả

Dịch vụ này chịu trách nhiệm:
- Phân tích CV định dạng PDF, DOCX, JPG, PNG
- Trích xuất văn bản thô
- Phát hiện ngôn ngữ
- Trích xuất các phần của CV
- Chuẩn bị dữ liệu cho việc matching CV với Job Description (JD)

## Tính năng

- **Phân tích CV**: Sử dụng AI để trích xuất thông tin từ CV
- **Hỗ trợ nhiều định dạng**: PDF, DOCX, JPG, PNG
- **API RESTful**: Dễ dàng tích hợp với hệ thống khác
- **Xử lý lỗi**: Cơ chế xử lý lỗi và validation dữ liệu đầu vào
- **Health check**: Endpoint kiểm tra trạng thái dịch vụ

## Cài đặt

### Yêu cầu hệ thống
- Python 3.8+
- Conda (khuyến nghị)

### Cài đặt dependencies

1. Tạo môi trường conda:
```bash
conda create -n interviet_ai_service python=3.9
conda activate interviet_ai_service
```

2. Cài đặt các gói cần thiết:
```bash
pip install -r requirements.txt
```

### Cấu hình môi trường

Tạo file `.env` trong thư mục gốc và thêm các biến môi trường sau:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

*Lưu ý: Bạn cần có API key từ Google Gemini để sử dụng dịch vụ.*

## Chạy ứng dụng

### Chạy local

```bash
uvicorn main:app --reload --port 8001
```

Ứng dụng sẽ chạy tại: http://localhost:8001

### Health check

Truy cập: http://localhost:8001/health

## API Endpoints

### POST /v1/cv/parse

Endpoint chính để phân tích CV.

**Parameters (multipart/form-data):**
- `file`: File CV (PDF, DOCX, JPG, PNG)
- `resumeId`: ID của CV
- `userId`: ID người dùng
- `originalFileName`: Tên file gốc
- `contentType`: Loại nội dung file
- `correlationId`: ID tương quan
- `requestId`: ID yêu cầu
- `schemaVersion`: Phiên bản schema
- `resumeVersionId`: ID phiên bản CV (tùy chọn)

**Response:**
```json
{
  "success": true,
  "data": {
    // Dữ liệu CV đã trích xuất
  },
  "error": null
}
```

### GET /health

Kiểm tra trạng thái dịch vụ.

**Response:**
```json
{
  "status": "Healthy"
}
```

## Dependencies

- `fastapi`: Framework web API
- `uvicorn`: ASGI server
- `python-multipart`: Xử lý multipart form data
- `google-genai`: Google Gemini AI client
- `pydantic`: Data validation
- `python-dotenv`: Quản lý biến môi trường

## Cấu trúc dự án

```
Project_InterViet/
├── main.py          # File chính chứa API
├── requirements.txt # Dependencies
├── README.md        # Tài liệu này
└── .env             # Biến môi trường (tạo riêng)
```