# INTER-VIET AI Intelligence Service

Dịch vụ trí tuệ nhân tạo xử lý CV và Matching CV-JD cho người Việt. Ứng dụng sử dụng FastAPI và Google Gemini AI để phân tích CV và so sánh với Job Description.

## Tổng quan

Dịch vụ cung cấp:
- **Phase 2 (CV Parsing)**: Trích xuất văn bản thô, nhận diện ngôn ngữ, tách các phần CV từ file PDF, DOCX, JPG, PNG
- **Phase 3 (CV-JD Matching)**: So sánh CV với JD, tính điểm phù hợp, phân tích điểm mạnh/yếu, đề xuất cải thiện

Hỗ trợ:
- Pool API keys riêng biệt cho từng phase
- Retry tự động và chuyển model khi Gemini quá tải
- Rate limit theo user (5 request/phút cho parse, 5 request/phút cho match)
- Xử lý file DOCX bằng python-docx
- Định dạng lỗi envelope thống nhất

## Tính năng chính

- **CV Parsing**: Sử dụng Gemini Flash để trích xuất nhanh
- **CV-JD Matching**: Sử dụng Gemini Pro để phân tích sâu
- **Multi-key Pool**: Hỗ trợ 3 keys cho parse (1-3), 3 keys cho match (4-6)
- **Rate Limiting**: Giới hạn theo X-User-ID header
- **Error Handling**: Cấu trúc lỗi chuẩn cho C# backend
- **Validation**: Kiểm tra dữ liệu đầu vào chặt chẽ

## Yêu cầu hệ thống

- Python 3.8+
- Conda (khuyến nghị)

## Cài đặt

1. Tạo môi trường conda:
```bash
conda create -n interviet_ai_service python=3.10
conda activate interviet_ai_service
```

2. Cài đặt dependencies:
```bash
pip install -r requirements.txt
```

## Cấu hình môi trường

Sao chép file `.env.example` thành `.env` và điền API keys:

```bash
cp .env.example .env
```

Chỉnh sửa `.env` với các key Gemini của bạn:

```env
# Phase 2: CV Parsing (Keys 1-3)
GEMINI_API_KEY_1=your_gemini_api_key_1_here
GEMINI_API_KEY_2=your_gemini_api_key_2_here
GEMINI_API_KEY_3=your_gemini_api_key_3_here

# Phase 3: CV-JD Matching (Keys 4-6)
GEMINI_API_KEY_4=your_gemini_api_key_4_here
GEMINI_API_KEY_5=your_gemini_api_key_5_here
GEMINI_API_KEY_6=your_gemini_api_key_6_here
```

## Chạy ứng dụng

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

Truy cập: http://localhost:8001

## API Endpoints

### GET /health

Kiểm tra trạng thái service.

**Response:**
```json
{
  "status": "Healthy"
}
```

### POST /v1/cv/parse

Parse CV từ file upload.

**Rate limit:** 5 request/phút/user

**Request (multipart/form-data):**
- `file`: File CV (PDF, DOCX, JPG, PNG)
- `resumeId`: ID CV
- `userId`: ID user
- `originalFileName`: Tên file gốc
- `contentType`: Loại file
- `correlationId`: ID tương quan
- `requestId`: ID request
- `schemaVersion`: Phiên bản schema
- `resumeVersionId`: ID phiên bản CV (optional)

**Response thành công:**
```json
{
  "success": true,
  "data": {
    "resumeId": "...",
    "rawText": "...",
    "detectedLanguage": "vi",
    "sections": {"summary": "..."},
    "skills": "...",
    "experiences": "...",
    "educations": "...",
    "projects": "...",
    "certifications": "...",
    "languages": "...",
    "warnings": [],
    "modelVersion": "cv-parser-v1-gemini-flash",
    "schemaVersion": "cv-jd-match-v1"
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
    "schemaVersion": "cv-jd-match-v1"
  }
}
```

### POST /v1/cv/match

Matching CV với Job Description.

**Rate limit:** 10 request/phút/user

**Request (JSON):**
```json
{
  "userId": "user123",
  "correlationId": "corr123",
  "requestId": "req123",
  "resumeParsedData": {
    "rawText": "...",
    "detectedLanguage": "vi",
    "sections": {"summary": "..."},
    "skills": "...",
    "experiences": "...",
    "educations": "...",
    "projects": "...",
    "certifications": "...",
    "languages": "..."
  },
  "jobDescription": {
    "title": "Software Engineer",
    "description": "...",
    "requirements": "...",
    "responsibilities": "..."
  }
}
```

**Response thành công:**
```json
{
  "success": true,
  "data": {
    "matchScore": 85,
    "matchLevel": "High",
    "strengths": ["..."],
    "weaknesses": ["..."],
    "recommendations": ["..."],
    "detailedAnalysis": "...",
    "modelVersion": "cv-jd-matcher-v1-gemini-pro",
    "schemaVersion": "cv-jd-match-v1"
  },
  "error": null
}
```

## Dependencies

- `fastapi`: Web framework
- `uvicorn`: ASGI server
- `python-multipart`: Xử lý multipart form
- `google-genai`: Gemini AI client
- `pydantic`: Data validation
- `python-dotenv`: Quản lý env
- `python-docx`: Đọc file DOCX
- `tenacity`: Retry logic
- `slowapi`: Rate limiting

## Cấu trúc dự án

```
Project_InterViet/
├── main.py              # Entry point FastAPI
├── requirements.txt     # Dependencies
├── .env.example         # Template env
├── .env                 # Environment variables
├── core/
│   ├── ai_logic.py      # Gemini AI logic
│   └── security.py      # API keys & rate limiting
├── routes/
│   ├── cv_parse.py      # CV parsing endpoint
│   └── cv_match.py      # CV-JD matching endpoint
├── schemas/
│   ├── parse_schema.py  # Pydantic schemas for parse
│   └── match_schema.py  # Pydantic schemas for match
└── README.md            # This file
```

## Đóng góp

1. Fork repo
2. Tạo branch feature (`git checkout -b feature/new-feature`)
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## Liên hệ

Đội phát triển INTER-VIET - liên hệ để nhận hỗ trợ kỹ thuật.