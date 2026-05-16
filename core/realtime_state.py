# core/realtime_state.py
from typing import Dict, Any

# Bộ nhớ tạm lưu trữ các session proxy đang chờ Frontend kết nối
# Cấu trúc: { "proxy_token_uuid": { "model": "...", "instructions": "...", "api_key": "..." } }
ACTIVE_PROXY_SESSIONS: Dict[str, Any] = {}