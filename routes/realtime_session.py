import logging
import os
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Request, Header, Depends
from typing import Optional

from schemas.realtime_schema import RealtimeSessionRequest, RealtimeSessionData
from schemas.interview_schema import InterviewResponseEnvelope, ErrorDetail
from core.security import verify_internal_api_key, limiter
from core.realtime_logic import generate_realtime_session, build_realtime_instructions

router = APIRouter()
logger = logging.getLogger("ai_realtime_routes")

@router.post("/ai/interviews/realtime/session", response_model=InterviewResponseEnvelope)
@limiter.limit("10/minute") 
async def create_session(
    request: Request, # Bắt buộc có để tính Rate Limit
    payload: RealtimeSessionRequest,
    api_key: str = Depends(verify_internal_api_key),
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    x_correlation_id: Optional[str] = Header(None, alias="X-Correlation-ID"),
    x_request_id: Optional[str] = Header(None, alias="X-Request-ID")
):
    user_id = x_user_id or payload.userId
    corr_id = x_correlation_id or payload.correlationId
    req_id = x_request_id or payload.requestId
    
    # 1. Log Start theo đúng chuẩn C# yêu cầu
    logger.info(
        f"[RT_SESSION] Status: START | CorrID: {corr_id} | ReqID: {req_id} | "
        f"UserID: {user_id} | SessID: {payload.sessionId}"
    )

    try:
        # 2. Xử lý tạo session với fallback
        session_res, provider, actual_model = await generate_realtime_session(payload)
        
        # 3. Parse Secret & ID
        client_secret_val = None
        if "client_secret" in session_res and "value" in session_res["client_secret"]:
            client_secret_val = session_res["client_secret"]["value"]
            
        provider_session_id = session_res.get("id", "unknown-id")
        
        # 4. Tính toán TTL
        ttl_seconds = int(os.getenv("REALTIME_SESSION_TTL_SECONDS", 600))
        expires_at = (datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)).strftime("%Y-%m-%dT%H:%M:%SZ")
        
        # 5. Xác định URL để Frontend kết nối tùy theo Provider (BẢN MỚI)
        base_url = os.getenv("PYTHON_API_BASE_URL", "http://localhost:8002").rstrip("/")
        
        if provider == "openai":
            # Endpoint nhận SDP Offer (REST POST)
            connect_url = f"{base_url}/ai/interviews/realtime/openai/sdp"
        else:
            # Endpoint nhận Audio/Text (WebSocket)
            ws_base_url = base_url.replace("http://", "ws://").replace("https://", "wss://")
            connect_url = f"{ws_base_url}/ws/ai/interviews/stream/{client_secret_val}"

        # 6. Build Response (Bổ sung connectUrl và instructions)
        data_res = RealtimeSessionData(
            providerSessionId=provider_session_id,
            connectUrl=connect_url,
            clientSecret=client_secret_val,
            expiresAt=expires_at,
            provider=provider,
            model=actual_model,
            instructions=build_realtime_instructions(payload)
        )
        
        # 7. Log Success chuẩn
        logger.info(
            f"[RT_SESSION] Status: SUCCESS | CorrID: {corr_id} | ReqID: {req_id} | "
            f"UserID: {user_id} | SessID: {payload.sessionId} | "
            f"ProviderSessID: {provider_session_id} | Model: {actual_model}"
        )
        
        return InterviewResponseEnvelope(success=True, data=data_res)

    except Exception as e:
        err_msg = str(e)
        
        # Phân tích mã lỗi
        error_code = "INTERNAL_ERROR"
        display_msg = "Không thể khởi tạo phiên phỏng vấn."
        
        if "|" in err_msg:
            parts = err_msg.split("|", 1)
            error_code, display_msg = parts[0], parts[1]
            
        if "SERVICE_UNAVAILABLE" in error_code:
            display_msg = "Realtime provider unavailable"
        elif "MODEL_UNAVAILABLE" in error_code:
            display_msg = "Realtime model is not available"

        # 7. Log Error chuẩn
        logger.error(
            f"[RT_SESSION] Status: FAILED | CorrID: {corr_id} | ReqID: {req_id} | "
            f"UserID: {user_id} | SessID: {payload.sessionId} | Error: {error_code}"
        )

        return InterviewResponseEnvelope(
            success=False,
            error=ErrorDetail(code=error_code, message=display_msg)
        )