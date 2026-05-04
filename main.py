import os
import json
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from dotenv import load_dotenv

from google import genai
from google.genai import types

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

app = FastAPI(title="CV Intelligence Service", version="1.0.0")

# ==========================================
# 1. GLOBAL EXCEPTION HANDLER (Envelope Format)
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
    body = await request.form() if request.headers.get("content-type", "").startswith("multipart/form-data") else {}
    return create_error_response(
        "VALIDATION_ERROR", 
        f"Dữ liệu đầu vào không hợp lệ: {str(exc)}", 
        body.get("correlationId", ""), 
        body.get("requestId", "")
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
# 2. ENDPOINTS
# ==========================================

@app.get("/health")
async def health_check():
    return {"status": "Healthy"}

@app.post("/v1/cv/parse")
async def parse_cv(
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
    # Chặn chặt các loại file, loại trừ .doc
    allowed_types = [
        "application/pdf", 
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
        "image/jpeg", 
        "image/png"
    ]
    
    if file.content_type not in allowed_types:
        raise CustomAPIException(
            "UNSUPPORTED_FORMAT", 
            "Chỉ hỗ trợ PDF, DOCX, JPG, PNG. Định dạng .doc cũ không được hỗ trợ.", 
            correlationId, 
            requestId
        )

    try:
        file_bytes = await file.read()
        
        prompt = """
        Bạn là hệ thống trích xuất CV chuyên nghiệp. Đọc tài liệu đính kèm và trích xuất dữ liệu trả về DƯỚI DẠNG JSON.
        Quy tắc:
        1. Nhận diện ngôn ngữ của CV ('vi' hoặc 'en'). Trả lời rawText bằng đúng ngôn ngữ đó.
        2. Các trường dữ liệu phải là Raw Text (đoạn văn thô), không phải mảng/list.
        3. Định dạng JSON BẮT BUỘC tuân thủ nghiêm ngặt cấu trúc sau, không bọc trong ```json:
        {
            "rawText": "Toàn bộ nội dung chữ thô rút trích được từ CV",
            "detectedLanguage": "vi",
            "sections": {
                "summary": "Tóm tắt hồ sơ hoặc mục tiêu nghề nghiệp..."
            },
            "skills": "text...",
            "experiences": "text...",
            "educations": "text...",
            "projects": "text...",
            "certifications": "text...",
            "languages": "text...",
            "warnings": ["CV quá ngắn"]
        }
        Nếu mục nào không có thông tin, hãy để chuỗi rỗng "".
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                prompt,
                types.Part.from_bytes(data=file_bytes, mime_type=file.content_type)
            ]
        )
        
        try:
            clean_text = response.text.replace("```json", "").replace("```", "").strip()
            parsed_data = json.loads(clean_text)
        except json.JSONDecodeError:
             raise CustomAPIException("FILE_PARSE_FAILED", "AI không thể trích xuất cấu trúc chuẩn từ file này.", correlationId, requestId)

        print(f"[DEBUG] resumeId: {resumeId} | resumeVersionId: {resumeVersionId} | rawText length: {len(parsed_data.get('rawText', ''))}")

        data_payload = {
            "resumeId": resumeId,
            "rawText": parsed_data.get("rawText", ""),
            "detectedLanguage": parsed_data.get("detectedLanguage", "vi"),
            "sections": parsed_data.get("sections", {}),
            "skills": parsed_data.get("skills", ""),
            "experiences": parsed_data.get("experiences", ""),
            "educations": parsed_data.get("educations", ""),
            "projects": parsed_data.get("projects", ""),
            "certifications": parsed_data.get("certifications", ""),
            "languages": parsed_data.get("languages", ""),
            "warnings": parsed_data.get("warnings", []),
            "modelVersion": "cv-parser-v1-gemini-2.5",
            "schemaVersion": "resume-parse-v1"
        }

        # Add optional resumeVersionId if provided by C#
        if resumeVersionId is not None:
            data_payload["resumeVersionId"] = resumeVersionId

        return {
            "success": True,
            "data": data_payload,
            "error": None
        }

    except CustomAPIException as e:
        raise e 
    except Exception as e:
        raise CustomAPIException("INTERNAL_ERROR", f"Lỗi máy chủ nội bộ: {str(e)}", correlationId, requestId)

if __name__ == "__main__":
    import uvicorn
    # Chạy trên port 8001
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)