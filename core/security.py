import os
from google import genai
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request

# ==========================================
# CẤU HÌNH POOL KEYS CHO PARSE CV (Keys 1, 2, 3)
# ==========================================
parse_clients = []
for i in range(1, 4): 
    key = os.getenv(f"GEMINI_API_KEY_{i}")
    if key:
        parse_clients.append(genai.Client(api_key=key))

if not parse_clients:
    raise ValueError("Không tìm thấy API Key nào cho Phase 2 (PARSE CV)!")

# ==========================================
# CẤU HÌNH POOL KEYS CHO MATCH JD (Keys 4, 5, 6)
# ==========================================
match_clients = []
for i in range(4, 7): 
    key = os.getenv(f"GEMINI_API_KEY_{i}")
    if key:
        match_clients.append(genai.Client(api_key=key))

if not match_clients:
    raise ValueError("Không tìm thấy API Key nào cho Phase 3 (MATCH CV-JD)!")

# ==========================================
# CẤU HÌNH RATE LIMITER
# ==========================================
def rate_limit_key_func(request: Request):
    return request.headers.get("X-User-ID", get_remote_address(request))

limiter = Limiter(key_func=rate_limit_key_func)