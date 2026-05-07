import json
import io
import docx
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, Request, Header
from google.genai import types

from schemas.parse_schema import ParseResponseEnvelope, ParseDataResponse
from core.ai_logic import call_gemini_with_retry
from core.security import parse_clients, limiter

router = APIRouter()

@router.post("/v1/cv/parse", response_model=ParseResponseEnvelope)
@limiter.limit("5/minute") # Đã cập nhật lên 10 request / phút
async def parse_cv(
    request: Request,
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
        raise ValueError(f"UNSUPPORTED_FORMAT|{correlationId}|{requestId}|Chỉ hỗ trợ PDF, DOCX, JPG, JPEG, PNG.")

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
        Cái nào không có thông tin thì để trống. Lưu ý là sections chỉ đang có summary thôi.
        """
        
        contents_payload = [prompt]
        
        # --- TIỀN XỬ LÝ FILE THEO ĐỊNH DẠNG ---
        if file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            try:
                doc = docx.Document(io.BytesIO(file_bytes))
                extracted_text = "\n".join([para.text.strip() for para in doc.paragraphs if para.text.strip()])
                if len(extracted_text) < 50:
                    raise ValueError(f"FILE_PARSE_FAILED|{correlationId}|{requestId}|File DOCX quá ít chữ.")
                contents_payload.append(f"Nội dung CV:\n\n{extracted_text}")
            except Exception as e:
                 raise ValueError(f"FILE_PARSE_FAILED|{correlationId}|{requestId}|Lỗi đọc file DOCX: {str(e)}")
        else:
            contents_payload.append(types.Part.from_bytes(data=file_bytes, mime_type=file.content_type))

        # --- GỌI AI ENGINE CHO PHASE 2 ---
        models_for_parse = [
            'gemini-2.5-flash',
            'gemini-3.1-flash-lite-preview',
            'gemini-3-flash-preview',
            'gemini-2.5-flash-lite'
        ]
        
        response = call_gemini_with_retry(
            contents_payload=contents_payload,
            client_pool=parse_clients,
            models_to_try=models_for_parse,
            task_type="parse"
        )
        
        # --- PARSE JSON KẾT QUẢ ---
        try:
            clean_text = response.text.replace("```json", "").replace("```", "").strip()
            parsed_data = json.loads(clean_text)
        except json.JSONDecodeError:
             raise ValueError(f"FILE_PARSE_FAILED|{correlationId}|{requestId}|AI không thể trích xuất JSON.")

        print(f"[DEBUG] PARSE CV | resumeId: {resumeId} | rawText length: {len(parsed_data.get('rawText', ''))}")

        # --- XÂY DỰNG RESPONSE ---
        data_payload = ParseDataResponse(
            resumeId=resumeId,
            resumeVersionId=resumeVersionId,
            rawText=parsed_data.get("rawText", ""),
            detectedLanguage=parsed_data.get("detectedLanguage", "unknown"),
            sections=parsed_data.get("sections", {}),
            skills=parsed_data.get("skills", ""),
            experiences=parsed_data.get("experiences", ""),
            educations=parsed_data.get("educations", ""),
            projects=parsed_data.get("projects", ""),
            certifications=parsed_data.get("certifications", ""),
            languages=parsed_data.get("languages", ""),
            warnings=parsed_data.get("warnings", []),
            modelVersion="cv-parser-v1-gemini-flash",
            schemaVersion="resume-parse-v1"
        )

        return ParseResponseEnvelope(success=True, data=data_payload, error=None)

    except ValueError as ve:
        # Re-raise ValueError để main.py bắt và format thành JSON Envelope
        raise ve 
    except Exception as e:
        raise ValueError(f"INTERNAL_ERROR|{correlationId}|{requestId}|Lỗi nội bộ: {str(e)}")