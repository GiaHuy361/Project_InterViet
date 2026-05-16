from pydantic import BaseModel
from typing import Optional

# --- REQUEST PAYLOAD TỪ C# ---
class RealtimeSessionRequest(BaseModel):
    sessionId: str
    userId: str
    position: str
    level: str
    goal: Optional[str] = None
    interviewType: str
    interviewerMode: str
    aiModel: str
    language: str = "vi"
    voice: str = "default"
    enableTranscript: bool = True
    correlationId: str
    requestId: str

# --- RESPONSE DATA TRẢ VỀ CHO C# ---
class RealtimeSessionData(BaseModel):
    providerSessionId: str
    connectUrl: Optional[str] = None
    clientSecret: Optional[str] = None
    expiresAt: str  # Định dạng ISO 8601 (VD: 2026-05-16T10:00:00Z)
    provider: str   # "openai" hoặc "gemini"
    model: str      # Tên model thực tế được gán

# --- ENVELOPE RESPONSE CHUẨN ---
# Dùng chung InterviewResponseEnvelope từ schemas.interview_schema