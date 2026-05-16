import os
import asyncio
import uuid
import httpx
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Tuple, List 
from core.realtime_state import ACTIVE_PROXY_SESSIONS

logger = logging.getLogger("ai_realtime_core")

# =====================================================================
# 1. MODEL MAPPING (Giữ nguyên như lúc nãy)
# =====================================================================
REALTIME_MODELS = [
    "gemini-2.5-flash-native-audio-preview-12-2025",
    "gemini-3.1-flash-live-preview",
    "gpt-4o-mini-realtime-preview",
    "gpt-realtime-mini",
    "gpt-realtime",
    "gpt-realtime-1.5",
    "gpt-realtime-2",
    "gpt-4o-realtime-preview"
]

# 1. Mapping tự động từ gói cước sang Realtime Model mặc định
REALTIME_TIER_MAPPING = {
    "free": ["gemini-2.5-flash-native-audio-preview-12-2025"],
    "monthly": ["gemini-2.5-flash-native-audio-preview-12-2025", "gemini-3.1-flash-live-preview"],
    "quarterly": ["gpt-4o-mini-realtime-preview", "gpt-realtime-mini"],
    "yearly": ["gpt-realtime", "gpt-realtime-1.5", "gpt-realtime-2","gpt-4o-realtime-preview"]
}

# 2. Mapping tự động từ Model Text cụ thể sang Model Realtime tương đương
TEXT_TO_REALTIME_MAPPING = {
    # --- Dòng OpenAI Nhỏ / Rẻ ---
    "gpt-4o-mini": "gemini-2.5-flash-native-audio-preview-12-2025",
    "gpt-3.5-turbo": "gpt-4o-mini-realtime-preview",
    "gpt-4.1-mini": "gemini-2.5-flash-native-audio-preview-12-2025",
    "gpt-5-mini": "gemini-2.5-flash-native-audio-preview-12-2025",
    "gpt-5.4-mini": "gpt-4o-mini-realtime-preview",
    "o1-mini": "gpt-4o-mini-realtime-preview",
    "o3-mini": "gpt-4o-mini-realtime-preview",
    "o4-mini": "gpt-4o-mini-realtime-preview",
    
    # --- Dòng OpenAI To / Đắt ---
    "gpt-5": "gpt-realtime-mini",
    "gpt-5.1": "gpt-realtime-mini",
    "gpt-5.2": "gpt-realtime-mini",
    "gpt-4.1": "gpt-realtime",
    "gpt-5.4": "gpt-realtime-1.5",
    "o3": "gpt-realtime",
    "gpt-4o": "gpt-realtime-1.5",

    # --- Dòng Gemini Flash/Lite ---
    "gemini-2.5-flash-lite": "gemini-2.5-flash-native-audio-preview-12-2025",
    "gemini-3.1-flash-lite": "gemini-2.5-flash-native-audio-preview-12-2025",
    "gemini-2.5-flash": "gemini-2.5-flash-native-audio-preview-12-2025",
    
    # --- Dòng Gemini Pro / Preview cao cấp ---
    "gemini-3-flash-preview": "gemini-3.1-flash-live-preview",
    "gemini-2.5-pro": "gemini-3.1-flash-live-preview",
    "gemini-3.1-pro-preview": "gemini-3.1-flash-live-preview"
}

def resolve_realtime_models(requested_model: str) -> List[str]:
    """Luôn trả về 1 list các model để fallback duyệt dần"""
    model_lower = requested_model.lower()
    
    if model_lower in REALTIME_TIER_MAPPING:
        return REALTIME_TIER_MAPPING[model_lower]
        
    if model_lower in REALTIME_MODELS:
        return [model_lower]
        
    if model_lower in TEXT_TO_REALTIME_MAPPING:
        return [TEXT_TO_REALTIME_MAPPING[model_lower]]
        
    raise ValueError(f"MODEL_UNAVAILABLE|Model '{requested_model}' không được hệ thống hỗ trợ.")

# =====================================================================
# 2. QUẢN LÝ POOL KEYS (DÀNH RIÊNG CHO REALTIME)
# =====================================================================
OPENAI_RT_KEYS = [os.getenv(f"OPENAI_API_KEY_{i}") for i in range(4, 7) if os.getenv(f"OPENAI_API_KEY_{i}")]
GEMINI_RT_KEYS = [os.getenv(f"GEMINI_API_KEY_{i}") for i in range(10, 13) if os.getenv(f"GEMINI_API_KEY_{i}")]

openai_rt_idx = 0
gemini_rt_idx = 0

def get_rt_key(provider: str) -> str:
    global openai_rt_idx, gemini_rt_idx
    if provider == "openai" and OPENAI_RT_KEYS:
        key = OPENAI_RT_KEYS[openai_rt_idx]
        openai_rt_idx = (openai_rt_idx + 1) % len(OPENAI_RT_KEYS)
        return key
    elif provider == "gemini" and GEMINI_RT_KEYS:
        key = GEMINI_RT_KEYS[gemini_rt_idx]
        gemini_rt_idx = (gemini_rt_idx + 1) % len(GEMINI_RT_KEYS)
        return key
    raise ValueError(f"SERVICE_UNAVAILABLE|Không tìm thấy cấu hình API Key cho {provider}")

# =====================================================================
# 3. BUILD SYSTEM INSTRUCTIONS CỰC NGẮN GỌN (CHO VOICE)
# =====================================================================
def build_realtime_instructions(payload: Any) -> str:
    """Xây dựng prompt nhập vai. Viết để AI ĐỌC/NÓI, nên cần ngắn gọn, tự nhiên."""
    goal_text = payload.goal if payload.goal else "Không có mục tiêu cụ thể"
    return f"""Bạn là một chuyên gia tuyển dụng. Hãy tiến hành phỏng vấn bằng giọng nói.
Ứng viên đang ứng tuyển vị trí: {payload.position} (Level: {payload.level}).
Mục tiêu ứng viên: {goal_text}.
Loại phỏng vấn: {payload.interviewType}. Phong cách: {payload.interviewerMode}.
Ngôn ngữ: {payload.language}.

QUY TẮC BẮT BUỘC KHI NÓI CHUYỆN:
1. Hãy mở lời chào và đặt câu hỏi đầu tiên luôn để bắt đầu.
2. Trả lời cực kỳ ngắn gọn, tự nhiên như người thật đang nói chuyện. 
3. KHÔNG ĐỌC danh sách gạch đầu dòng, KHÔNG dùng markdown.
4. Đợi ứng viên trả lời rồi mới hỏi tiếp follow-up. Ngắt lời nếu ứng viên muốn bổ sung."""

# =====================================================================
# 4. HÀM TẠO SESSION TRỰC TIẾP VỚI PROVIDER
# =====================================================================
async def expire_proxy_token(token: str, delay_seconds: int = 600):
    """Đợi hết thời gian TTL, nếu token chưa được xài thì xóa bỏ"""
    await asyncio.sleep(delay_seconds)
    if token in ACTIVE_PROXY_SESSIONS:
        del ACTIVE_PROXY_SESSIONS[token]
        logger.info(f"[PROXY_CLEANUP] Đã xóa token hết hạn do Frontend không kết nối: {token}")

async def create_openai_rt_session(model: str, instructions: str, voice: str, api_key: str) -> Dict[str, Any]:
    """
    Theo GA API, ta không lấy Ephemeral Token qua JSON nữa.
    Chỉ lưu state nội bộ và cấp Token để Frontend dùng làm chứng chỉ gửi SDP Offer.
    """
    internal_proxy_token = str(uuid.uuid4())
    
    # Ép chuẩn model về GA
    openai_ga_model = "gpt-4o-mini-realtime-preview-2024-12-17" if "mini" in model.lower() else "gpt-4o-realtime-preview-2024-12-17"
    
    # Lưu vào bộ nhớ RAM chờ Frontend gửi SDP lên
    from core.realtime_state import ACTIVE_PROXY_SESSIONS # Đảm bảo đã import
    ACTIVE_PROXY_SESSIONS[internal_proxy_token] = {
        "provider": "openai",
        "model": openai_ga_model,
        "instructions": instructions,
        "voice": voice if voice != "default" else "alloy",
        "api_key": api_key
    }
    
    # Kích hoạt bộ đếm tự hủy sau 10 phút
    import asyncio
    asyncio.create_task(expire_proxy_token(internal_proxy_token, 600))
    
    return {
        "client_secret": {"value": internal_proxy_token},
        "id": f"openai-webrtc-{uuid.uuid4().hex[:8]}"
    }

async def create_gemini_proxy_session(model: str, instructions: str, voice: str, api_key: str) -> Dict[str, Any]:
    """
    Cách B: Tạo cấu hình ảo cho Proxy. 
    Không gọi API Google ngay lúc này, chỉ cấp Token nội bộ để Frontend gọi vào Proxy của ta.
    """
    internal_proxy_token = str(uuid.uuid4())
    
    ACTIVE_PROXY_SESSIONS[internal_proxy_token] = {
        "model": model,
        "instructions": instructions,
        "api_key": api_key # Giữ sẵn key để lát nữa proxy gọi lên Google
    }

    asyncio.create_task(expire_proxy_token(internal_proxy_token, 600))
    
    return {
        "client_secret": {"value": internal_proxy_token},
        "id": f"gemini-proxy-sess-{uuid.uuid4().hex[:8]}"
    }

# =====================================================================
# 5. ORCHESTRATOR CHÍNH ĐƯỢC ROUTE GỌI TỚI
# =====================================================================
async def generate_realtime_session(payload: Any) -> Tuple[Dict[str, Any], str, str]:
    """Trả về Tuple: (Session_Data_Dict, actual_provider, actual_model)"""
    
    # 1. Lấy danh sách model cần thử
    models_to_try = resolve_realtime_models(payload.aiModel)
    instructions = build_realtime_instructions(payload)
    
    # 2. Duyệt qua từng model trong danh sách fallback
    for model in models_to_try:
        provider = "openai" if "gpt" in model or "o1" in model or "o3" in model or "o4" in model else "gemini"
        num_keys = len(OPENAI_RT_KEYS) if provider == "openai" else len(GEMINI_RT_KEYS)
        
        # 3. Thử xoay đủ các API key của model hiện tại
        for attempt in range(num_keys):
            try:
                api_key = get_rt_key(provider)
                if provider == "openai":
                    session_res = await create_openai_rt_session(model, instructions, payload.voice, api_key)
                else:
                    session_res = await create_gemini_proxy_session(model, instructions, payload.voice, api_key)
                    
                return session_res, provider, model
                
            except Exception as e:
                logger.warning(f"Failed {model} (Key attempt {attempt+1}): {str(e)}")
                continue # Thử key tiếp theo
                
    # Nếu chạy hết list mà vẫn tạch
    raise Exception("SERVICE_UNAVAILABLE|Tất cả Realtime models khả dụng đều quá tải hoặc lỗi mạng.")