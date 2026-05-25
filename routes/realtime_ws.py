# routes/realtime_ws.py
import json
import logging
import asyncio
import websockets
import httpx
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request, Response, HTTPException

from core.realtime_state import ACTIVE_PROXY_SESSIONS

logger = logging.getLogger("ai_realtime_ws")
router = APIRouter()

@router.websocket("/ws/ai/interviews/stream/{proxy_token}")
async def websocket_proxy(websocket: WebSocket, proxy_token: str):
    """Endpoint trung gian: Frontend <==> Python Proxy <==> Google Gemini."""
    
    # 1. Xác thực vé vào cửa
    await websocket.accept()
    is_active = True
    session_data = ACTIVE_PROXY_SESSIONS.get(proxy_token)
    
    if not session_data:
        logger.warning(f"WS Connection rejected: Invalid or expired token {proxy_token}")
        await websocket.close(code=1008, reason="Invalid Client Secret")
        return

    # Lấy dữ liệu và xóa khỏi RAM (mỗi token chỉ dùng 1 lần)
    api_key = session_data["api_key"]
    model = session_data["model"].replace("models/", "") 
    instructions = session_data["instructions"]
    enable_transcript = bool(session_data.get("enable_transcript", True))
    del ACTIVE_PROXY_SESSIONS[proxy_token]

    # URI chuẩn của Gemini Multimodal Live API
    gemini_ws_url = f"wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key={api_key}"

    try:
        # 2. Mở đường ống kết nối lên Google Gemini
        async with websockets.connect(gemini_ws_url) as gemini_ws:
            logger.info(f"[WS_PROXY] Mở luồng kết nối tới Gemini model: {model}")
            
            # BƯỚC QUAN TRỌNG: Gửi gói tin "Setup" mang theo prompt nhập vai lên Gemini
            setup_msg = {
                "setup": {
                    "model": f"models/{model}",
                    "generationConfig": {
                        "responseModalities": ["AUDIO"]
                    },
                    "systemInstruction": {
                        "parts": [{"text": instructions}]
                    },
                    **({
                        "inputAudioTranscription": {},
                        "outputAudioTranscription": {}
                    } if enable_transcript else {})
                }
            }
            await gemini_ws.send(json.dumps(setup_msg))

            # 3. Chạy 2 luồng song song (bidi-directional forwarding)
            
            async def frontend_to_gemini():
                nonlocal is_active
                try:
                    while is_active:
                        data = await websocket.receive_text()
                        await gemini_ws.send(data)
                except Exception:
                    is_active = False # Đóng luồng

            async def gemini_to_frontend():
                """Hứng audio/text từ Gemini rồi chuyển về Frontend."""
                nonlocal is_active
                try:
                    while is_active:
                        msg = await gemini_ws.recv()
                        if is_active: # Chỉ gửi nếu chưa đóng
                            await websocket.send_text(msg)
                except Exception as e:
                    logger.error(f"Lỗi đẩy về Front: {e}")
                finally:
                    is_active = False # Đánh dấu đóng

            # Gộp 2 luồng chạy đồng thời
            await asyncio.gather(frontend_to_gemini(), gemini_to_frontend())

            # Dọn dẹp
            is_active = False
            await websocket.close()

    except Exception as e:
        logger.error(f"[WS_PROXY] Lỗi khởi tạo Proxy tới Gemini: {str(e)}")
        await websocket.close(code=1011, reason="Internal Server Error")
    finally:
        logger.info(f"[WS_PROXY] Đóng luồng WebSocket proxy_token: {proxy_token}")

@router.post("/ai/interviews/realtime/openai/sdp")
async def openai_webrtc_sdp(request: Request):
    """
    Trạm trung chuyển SDP Offer. Frontend gọi API này để lấy SDP Answer từ OpenAI.
    """
    # 1. Xác thực token nội bộ do Frontend gửi lên
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Thiếu token xác thực")
    
    proxy_token = auth_header.split(" ")[1]
    session_data = ACTIVE_PROXY_SESSIONS.get(proxy_token)
    
    if not session_data or session_data.get("provider") != "openai":
        raise HTTPException(status_code=403, detail="Token không hợp lệ hoặc đã hết hạn")
        
    api_key = session_data["api_key"]
    model = session_data["model"]
    
    # Lấy nội dung SDP Offer dạng text thuần từ Frontend
    sdp_offer_bytes = await request.body()
    sdp_offer = sdp_offer_bytes.decode("utf-8")
    
    # Xóa token khỏi RAM ngay lập tức (mỗi token chỉ đổi 1 lần SDP)
    del ACTIVE_PROXY_SESSIONS[proxy_token]
    
    # 2. Gọi sang OpenAI bằng endpoint GA chuẩn (yêu cầu application/sdp)
    openai_url = f"https://api.openai.com/v1/realtime?model={model}"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/sdp" 
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            openai_url,
            headers=headers,
            content=sdp_offer,
            timeout=15.0
        )
        
        if response.status_code not in (200, 201):
            logger.error(f"[OPENAI SDP ERROR] {response.text}")
            raise HTTPException(status_code=502, detail="OpenAI từ chối kết nối WebRTC")
            
        # 3. Trả về SDP Answer cho Frontend để trình duyệt thiết lập cuộc gọi
        return Response(content=response.text, media_type="application/sdp")
