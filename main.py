import os
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

load_dotenv()

# Import các thành phần nội bộ
from core.security import limiter
from routes import cv_parse, cv_match

app = FastAPI(
    title="INTER-VIET AI Intelligence Service",
    description="Service xử lý CV và Matching CV-JD cho người Việt",
    version="1.1.0"
)

# Gắn Limiter vào trạng thái của App
app.state.limiter = limiter

# ==========================================
# 1. EXCEPTION HANDLING (Bộ lọc lỗi tập trung)
# ==========================================

def create_envelope_error(code: str, message: str, correlation_id: str = "", request_id: str = ""):
    """Helper tạo cấu trúc lỗi chuẩn Envelope cho C#"""
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST, # Mặc định 400, sẽ ghi đè nếu cần
        content={
            "success": False,
            "data": None,
            "error": {
                "code": code,
                "message": message,
                "correlationId": correlation_id,
                "requestId": request_id,
                "schemaVersion": "cv-jd-match-v1" 
            }
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Bắt lỗi khi dữ liệu Form-data hoặc JSON gửi lên không đúng định dạng"""
    corr_id = request.headers.get("X-Correlation-ID", "")
    return create_envelope_error("VALIDATION_ERROR", f"Dữ liệu đầu vào không hợp lệ: {str(exc)}", corr_id)

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Bắt lỗi khi User vượt quá giới hạn 5 request/phút"""
    corr_id = request.headers.get("X-Correlation-ID", "")
    return create_envelope_error(
        "RATE_LIMIT_EXCEEDED", 
        "Bạn đang thao tác quá nhanh. Vui lòng thử lại sau một lát.", 
        corr_id
    )

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """
    Bắt các lỗi nghiệp vụ được ném ra từ Router dưới dạng chuỗi 'CODE|CORR_ID|REQ_ID|MESSAGE'
    """
    error_str = str(exc)
    if "|" in error_str:
        parts = error_str.split("|")
        code = parts[0]
        corr_id = parts[1]
        req_id = parts[2]
        msg = parts[3]
        
        # Xác định Status Code phù hợp cho C#
        status_code = status.HTTP_400_BAD_REQUEST
        if code == "SERVICE_UNAVAILABLE":
            status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        elif code == "RESUME_PARSED_DATA_REQUIRED":
            status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
            
        resp = create_envelope_error(code, msg, corr_id, req_id)
        resp.status_code = status_code
        return resp
    
    # Trường hợp ValueError thông thường khác
    return create_envelope_error("INTERNAL_ERROR", error_str)

# ==========================================
# 2. ROUTERS (Đăng ký các phân vùng chức năng)
# ==========================================

# Phase 2: Parse CV (Sử dụng API Key 1-3)
app.include_router(cv_parse.router, tags=["Phase 2 - CV Parsing"])

# Phase 3: Match CV-JD (Sử dụng API Key 4-6)
app.include_router(cv_match.router, tags=["Phase 3 - CV-JD Matching"])

# ==========================================
# 3. SYSTEM ENDPOINTS
# ==========================================

@app.get("/health", tags=["System"])
async def health_check():
    """Kiểm tra trạng thái hoạt động của Service"""
    return {
        "status": "Healthy",
        "service": "INTER-VIET AI Intelligence",
        "phase": "Production-Ready"
    }

if __name__ == "__main__":
    import uvicorn
    # Chạy trên port 8001 như đã chốt với team C#
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)