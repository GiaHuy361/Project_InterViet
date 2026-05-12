# INTER-VIET AI Interview Service

Dịch vụ AI Phỏng vấn (Sinh câu hỏi & Phân tích) cho nền tảng INTER-VIET, được xây dựng bằng FastAPI và tích hợp các mô hình AI từ OpenAI và Google GenAI.

## Mô tả

Dự án này cung cấp API để tự động hóa quá trình phỏng vấn:
- **Sinh câu hỏi**: Tạo câu hỏi phỏng vấn phù hợp dựa trên vị trí, cấp độ và lịch sử cuộc trò chuyện.
- **Phân tích phỏng vấn**: Đánh giá transcript phỏng vấn và cung cấp phản hồi chi tiết.

Dịch vụ được thiết kế để tích hợp với backend C# của nền tảng INTER-VIET.

## Tính năng

- Sinh câu hỏi phỏng vấn thông minh với ngữ cảnh
- Phân tích transcript phỏng vấn tự động
- Hỗ trợ nhiều loại phỏng vấn (Technical, Behavioral)
- Rate limiting để bảo vệ API
- Xác thực API key nội bộ
- Logging chi tiết cho giám sát
- CORS hỗ trợ cho frontend/backend

## Cài đặt

### Yêu cầu hệ thống
- Python 3.8+
- Conda (Miniconda hoặc Anaconda)

### Các bước cài đặt

1. **Tạo môi trường Conda:**
   ```bash
   conda create -n interviet_ai_service python=3.11
   conda activate interviet-ai
   ```

2. **Cài đặt dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Cấu hình biến môi trường:**
   Tạo file `.env` trong thư mục gốc với các biến sau:
   ```
   OPENAI_API_KEY=your_openai_api_key
   GOOGLE_GENAI_API_KEY=your_google_genai_api_key
   INTERNAL_API_KEY=your_internal_api_key
   ```

## Chạy ứng dụng

1. **Kích hoạt môi trường:**
   ```bash
   conda activate interviet_ai_service
   ```

2. **Chạy server:**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8002 --reload
   ```

3. **Kiểm tra health:**
   Truy cập `http://localhost:8002/health` để kiểm tra trạng thái dịch vụ.

## API Endpoints

### Sinh câu hỏi
- **POST** `/ai/interviews/generate-question`
- Rate limit: 20 requests/phút
- Tạo câu hỏi phỏng vấn tiếp theo dựa trên ngữ cảnh

### Phân tích phỏng vấn
- **POST** `/ai/interviews/analyze`
- Rate limit: 5 requests/phút
- Phân tích transcript và cung cấp đánh giá

### Health Check
- **GET** `/health`
- Kiểm tra trạng thái dịch vụ

## Cấu trúc dự án

```
Project_InterViet/
├── main.py                 # Entry point FastAPI app
├── requirements.txt        # Python dependencies
├── .env.example
├── core/
│   ├── ai_logic.py         # Logic xử lý AI (OpenAI, Google GenAI)
│   └── security.py         # Xác thực API key và rate limiting
├── routes/
│   ├── generate_question.py # Endpoint sinh câu hỏi
│   └── analyze.py          # Endpoint phân tích
└── schemas/
    ├── analyze_schema.py   # Pydantic schemas cho phân tích
    └── interview_schema.py # Pydantic schemas chung
```
