import os
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# 1. BẮT BUỘC LOAD ENV VÀ CẤU HÌNH LOG TRƯỚC TIÊN
load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("ai_interview_main")

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# Import các module nội bộ
from core.security import limiter
from routes import generate_question, analyze
from schemas.interview_schema import InterviewResponseEnvelope, ErrorDetail

# Khởi tạo FastAPI
app = FastAPI(
    title="INTER-VIET AI Interview Service",
    description="Dịch vụ AI Phỏng vấn (Sinh câu hỏi & Phân tích) cho nền tảng INTER-VIET",
    version="1.0.0"
)

# Cấu hình Rate Limit (SlowAPI)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# Cấu hình CORS (Cho phép C# Backend hoặc Frontend gọi tới)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Trên production nên đổi thành domain thực tế
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- GLOBAL EXCEPTION HANDLERS (ĐẢM BẢO CONTRACT C#) ---

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Bắt lỗi khi C# gửi sai cấu trúc Request Body (Thiếu field, sai type)"""
    logger.warning(f"[VALIDATION_ERROR] Path: {request.url.path} | Detail: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content=InterviewResponseEnvelope(
            success=False,
            error=ErrorDetail(
                code="VALIDATION_ERROR", 
                message="Dữ liệu đầu vào không hợp lệ hoặc thiếu trường bắt buộc."
            )
        ).model_dump()
    )

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Bắt lỗi khi user bị dính Rate Limit (VD: Quá 20 req/min)"""
    logger.warning(f"[RATE_LIMIT_EXCEEDED] IP/User: {request.client.host} | Path: {request.url.path}")
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content=InterviewResponseEnvelope(
            success=False,
            error=ErrorDetail(
                code="RATE_LIMIT_EXCEEDED", 
                message="Vượt quá giới hạn gọi API. Vui lòng thử lại sau."
            )
        ).model_dump()
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Bắt mọi lỗi Runtime chưa được bắt để tránh văng thông tin nhạy cảm (Stack trace)"""
    logger.error(f"[INTERNAL_ERROR] Path: {request.url.path} | Error: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=InterviewResponseEnvelope(
            success=False,
            error=ErrorDetail(
                code="INTERNAL_ERROR", 
                message="Đã xảy ra lỗi hệ thống không xác định."
            )
        ).model_dump()
    )

# --- ĐĂNG KÝ ROUTERS ---
app.include_router(generate_question.router, tags=["Interview Engine"])
app.include_router(analyze.router, tags=["Interview Engine"])

# --- HEALTH CHECK ---
@app.get("/health", tags=["System"])
async def health_check():
    """Endpoint để C# ping kiểm tra trạng thái service"""
    return {"status": "ok", "service": "ai-interview", "port": 8002}