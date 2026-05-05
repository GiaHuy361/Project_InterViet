import os
import json
import io
import random
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from dotenv import load_dotenv

import docx
from google import genai
from google.genai import types

# Import cho Retry và Rate Limit
from tenacity import retry, stop_after_attempt, wait_exponential
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

load_dotenv()

# ==========================================
# CẤU HÌNH POOL API KEYS (Tính năng 5)
# ==========================================
api_clients = []
for i in range(1, 10):
    key = os.getenv(f"GEMINI_API_KEY_{i}")
    if key:
        api_clients.append(genai.Client(api_key=key))

# Fallback nếu chỉ có 1 key tên GEMINI_API_KEY
if not api_clients:
    fallback_key = os.getenv("GEMINI_API_KEY")
    if fallback_key:
         api_clients.append(genai.Client(api_key=fallback_key))

if not api_clients:
    raise ValueError("Không tìm thấy GEMINI_API_KEY nào trong file .env!")

# ==========================================
# CẤU HÌNH RATE LIMITER (Tính năng 3)
# ==========================================
# Lấy X-User-ID từ Header để giới hạn từng user. Nếu không có thì lấy IP C# server.
def rate_limit_key_func(request: Request):
    return request.headers.get("X-User-ID", get_remote_address(request))

limiter = Limiter(key_func=rate_limit_key_func)
app = FastAPI(title="CV Intelligence Service", version="1.0.0")
app.state.limiter = limiter

# ==========================================
# GLOBAL EXCEPTION HANDLER
# ==========================================
def create_error_response(error_code: str, message: str, correlation_id: str = "", request_id: str = ""):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "success": False,
            "data": None,
            "error": {
                "code": error_code,
                "message": message,
                "correlationId": correlation_id,
                "requestId": request_id,
                "schemaVersion": "resume-parse-v1"
            }
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    corr_id = request.headers.get("X-Correlation-ID", "")
    return create_error_response("VALIDATION_ERROR", f"Dữ liệu đầu vào không hợp lệ: {str(exc)}", corr_id, "")

# Handler cho lỗi quá tải Rate Limit
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    corr_id = request.headers.get("X-Correlation-ID", "")
    return create_error_response(
        "RATE_LIMIT_EXCEEDED", 
        f"Bạn đã parse CV quá nhanh. Vui lòng thử lại sau. Chi tiết: {exc.detail}", 
        corr_id, 
        ""
    )

class CustomAPIException(Exception):
    def __init__(self, error_code: str, message: str, correlation_id: str, request_id: str):
        self.error_code = error_code
        self.message = message
        self.correlation_id = correlation_id
        self.request_id = request_id

@app.exception_handler(CustomAPIException)
async def custom_api_exception_handler(request: Request, exc: CustomAPIException):
    return create_error_response(exc.error_code, exc.message, exc.correlation_id, exc.request_id)

# ==========================================
# HÀM GỌI GEMINI CÓ RETRY TỰ ĐỘNG (Tính năng 1)
# ==========================================
# Thử lại tối đa 4 lần. Đợi 4s, 8s, 16s giữa các lần lỗi.
current_key_index = 0
@retry(stop=stop_after_attempt(4), wait=wait_exponential(multiplier=2, min=4, max=20), reraise=True)
def call_gemini_with_retry(contents_payload):
    global current_key_index
    
    # Xoay vòng Key theo kiểu Round Robin
    client = api_clients[current_key_index % len(api_clients)]
    current_key_index += 1
    # Danh sách model ưu tiên từ cao đến thấp
    models_to_try = ['gemini-2.5-flash','gemini-3.1-flash-lite-preview','gemini-3-flash-preview','gemini-2.5-flash-lite']
    
    last_exception = None
    for model_name in models_to_try:
        try:
            return client.models.generate_content(
                model=model_name,
                contents=contents_payload,
                # Thêm cấu hình ưu tiên tốc độ xử lý cho Flash
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    top_p=0.95,
                )
            )
        except Exception as e:
            last_exception = e
            # Nếu lỗi 503 (quá tải), thử ngay model tiếp theo (Pro)
            if "503" in str(e) or "high demand" in str(e).lower():
                print(f"[RETRY] Model {model_name} bận, đang thử model khác...")
                continue
            raise e # Nếu lỗi khác (như 400, 401) thì dừng luôn
            
    raise last_exception

# ==========================================
# ENDPOINTS
# ==========================================
@app.get("/health")
async def health_check():
    return {"status": "Healthy", "active_keys": len(api_clients)}

@app.post("/v1/cv/parse")
@limiter.limit("5/minute") # Giới hạn 5 request / 1 phút / 1 User
async def parse_cv(
    request: Request, # Thêm request object để limiter hoạt động
    file: UploadFile = File(...),
    resumeId: str = Form(...),
    userId: str = Form(...),
    originalFileName: str = Form(...),
    contentType: str = Form(...),
    correlationId: str = Form(...),
    requestId: str = Form(...),
    schemaVersion: str = Form(...),
    resumeVersionId: Optional[str] = Form(None)
):
    allowed_types = [
        "application/pdf", 
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
        "image/jpeg", 
        "image/png"
    ]
    
    if file.content_type not in allowed_types:
        raise CustomAPIException("UNSUPPORTED_FORMAT", "Chỉ hỗ trợ PDF, DOCX, JPG, JPEG, PNG.", correlationId, requestId)

    try:
        file_bytes = await file.read()
        
        prompt = """
        Bạn là hệ thống trích xuất CV chuyên nghiệp. Hãy phân tích nội dung CV được cung cấp và trả về DƯỚI DẠNG JSON.
        Quy tắc:
        1. Nhận diện ngôn ngữ được sử dụng trong CV ('vi' hoặc 'en'). Trả lời rawText bằng đúng ngôn ngữ đó.
        2. Định dạng JSON BẮT BUỘC như sau, không bọc trong ```json:
        {
            "rawText": "Toàn bộ nội dung chữ thô...",
            "detectedLanguage": "text...",
            "sections": {"summary": "..."},
            "skills": "text...",
            "experiences": "text...",
            "educations": "text...",
            "projects": "text...",
            "certifications": "text...",
            "languages": "text...",
            "warnings": ["text...",...]
        }
        Cái nào không có thông tin thì để trống. Lưu ý là sections chỉ đang có summary thôi, không có cái khác nhé
        """
        
        contents_payload = [prompt]
        
        if file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            try:
                doc = docx.Document(io.BytesIO(file_bytes))
                extracted_text = "\n".join([para.text.strip() for para in doc.paragraphs if para.text.strip()])
                if len(extracted_text) < 50:
                    raise CustomAPIException("FILE_PARSE_FAILED", "File DOCX quá ít chữ.", correlationId, requestId)
                contents_payload.append(f"Nội dung CV:\n\n{extracted_text}")
            except Exception as e:
                 raise CustomAPIException("FILE_PARSE_FAILED", f"Lỗi đọc file DOCX: {str(e)}", correlationId, requestId)
        else:
            contents_payload.append(types.Part.from_bytes(data=file_bytes, mime_type=file.content_type))

        # Gọi hàm Retry
        response = call_gemini_with_retry(contents_payload)
        
        try:
            clean_text = response.text.replace("```json", "").replace("```", "").strip()
            parsed_data = json.loads(clean_text)
        except json.JSONDecodeError:
             raise CustomAPIException("FILE_PARSE_FAILED", "AI không thể trích xuất JSON.", correlationId, requestId)

        print(f"[DEBUG] resumeId: {resumeId} | rawText length: {len(parsed_data.get('rawText', ''))}")

        data_payload = {
            "resumeId": resumeId,
            "rawText": parsed_data.get("rawText", ""),
            "detectedLanguage": parsed_data.get("detectedLanguage", "unknown"),
            "sections": parsed_data.get("sections", {}),
            "skills": parsed_data.get("skills", ""),
            "experiences": parsed_data.get("experiences", ""),
            "educations": parsed_data.get("educations", ""),
            "projects": parsed_data.get("projects", ""),
            "certifications": parsed_data.get("certifications", ""),
            "languages": parsed_data.get("languages", ""),
            "warnings": parsed_data.get("warnings", []),
            "modelVersion": "cv-parser-v1-gemini-flash",
            "schemaVersion": "resume-parse-v1"
        }

        if resumeVersionId is not None:
            data_payload["resumeVersionId"] = resumeVersionId

        return {"success": True, "data": data_payload, "error": None}

    except CustomAPIException as e:
        raise e 
    except Exception as e:
        raise CustomAPIException("INTERNAL_ERROR", f"Lỗi nội bộ: {str(e)}", correlationId, requestId)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)