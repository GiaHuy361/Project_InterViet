import os
from fastapi import Request, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
from slowapi import Limiter
from slowapi.util import get_remote_address

# --- RATE LIMITER ---
def rate_limit_key_func(request: Request):
    # Lấy User-ID làm key chặn Rate Limit, nếu không có thì fallback về IP
    return request.headers.get("X-User-ID", get_remote_address(request))

limiter = Limiter(key_func=rate_limit_key_func)

# --- INTERNAL AUTH ---
API_KEY_NAME = "X-Interviet-Api-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def verify_internal_api_key(api_key_header: str = Security(api_key_header)):
    expected_key = os.getenv("INTERVIET_INTERNAL_API_KEY")
    # Bỏ qua validate ở môi trường local nếu chưa config key
    if not expected_key:
        return True
    
    if api_key_header != expected_key:
        raise HTTPException(
            status_code=401, 
            detail="Unauthorized. Invalid Internal API Key."
        )
    return api_key_header