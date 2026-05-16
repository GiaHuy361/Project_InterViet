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
    """Endpoint trung gian: Frontend <==> Python Proxy <==> Google Gemini"""
    
    # 1. Xác thực vé vào cửa
    await websocket.accept()
    session_data = ACTIVE_PROXY_SESSIONS.get(proxy_token)
    
    if not session_data:
        logger.warning(f"WS Connection rejected: Invalid or expired token {proxy_token}")
        await websocket.close(code=1008, reason="Invalid Client Secret")
        return

    # Lấy dữ liệu và xóa khỏi RAM (Mỗi token chỉ dùng 1 lần)
    api_key = session_data["api_key"]
    model = session_data["model"].replace("models/", "") 
    instructions = session_data["instructions"]
    del ACTIVE_PROXY_SESSIONS[proxy_token]

    # URI chuẩn của Gemini Multimodal Live API
    gemini_ws_url = f"wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key={api_key}"

    try:
        # 2. Mở đường ống kết nối lên Google Gemini
        async with websockets.connect(gemini_ws_url) as gemini_ws:
            logger.info(f"[WS_PROXY] Mở luồng kết nối tới Gemini model: {model}")
            
            # BƯỚC QUAN TRỌNG: Gửi gói tin "Setup" mang theo Prompt nhập vai lên Gemini
            setup_msg = {
                "setup": {
                    "model": f"models/{model}",
                    "systemInstruction": {
                        "parts": [{"text": instructions}]
                    }
                }
            }
            await gemini_ws.send(json.dumps(setup_msg))

            # 3. Chạy 2 luồng song song (Bidi-directional forwarding)
            
            async def frontend_to_gemini():
                """Hứng Audio/Text từ Frontend -> Ném cho Gemini"""
                try:
                    while True:
                        data = await websocket.receive_text()
                        # Pass-through nguyên vẹn
                        await gemini_ws.send(data)
                except WebSocketDisconnect:
                    logger.info("[WS_PROXY] Frontend ngắt kết nối.")
                except Exception as e:
                    logger.error(f"[WS_PROXY] Lỗi luồng Frontend->Gemini: {str(e)}")

            async def gemini_to_frontend():
                """Hứng Audio/Text từ Gemini -> Ném về Frontend"""
                try:
                    while True:
                        data = await gemini_ws.recv()
                        # Pass-through nguyên vẹn
                        await websocket.send_text(data)
                except websockets.exceptions.ConnectionClosed:
                    logger.info("[WS_PROXY] Gemini ngắt kết nối.")
                except Exception as e:
                    logger.error(f"[WS_PROXY] Lỗi luồng Gemini->Frontend: {str(e)}")

            # Gộp 2 luồng chạy đồng thời
            await asyncio.gather(frontend_to_gemini(), gemini_to_frontend())

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
    # 1. Xác thực Token nội bộ do Frontend gửi lên
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Thiếu Token xác thực")
    
    proxy_token = auth_header.split(" ")[1]
    session_data = ACTIVE_PROXY_SESSIONS.get(proxy_token)
    
    if not session_data or session_data.get("provider") != "openai":
        raise HTTPException(status_code=403, detail="Token không hợp lệ hoặc đã hết hạn")
        
    api_key = session_data["api_key"]
    model = session_data["model"]
    
    # Lấy nội dung SDP Offer dạng text thuần từ Frontend
    sdp_offer_bytes = await request.body()
    sdp_offer = sdp_offer_bytes.decode("utf-8")
    
    # Xóa token khỏi RAM ngay lập tức (1 Token chỉ được đổi 1 lần SDP)
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