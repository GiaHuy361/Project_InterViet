import json
import logging
from fastapi import APIRouter, Request, Header, Depends
from typing import Optional

from schemas.interview_schema import GenerateQuestionRequest, GenerateQuestionData, InterviewResponseEnvelope, ErrorDetail
from core.ai_logic import transform_conversation_history, generate_question_with_fallback
from core.security import verify_internal_api_key, limiter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai_interview_routes")
router = APIRouter()

@router.post("/ai/interviews/generate-question", response_model=InterviewResponseEnvelope)
@limiter.limit("20/minute") # Đề xuất: 20 req/phút cho sinh câu hỏi
async def generate_question(
    request: Request,
    payload: GenerateQuestionRequest,
    api_key: str = Depends(verify_internal_api_key),
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    x_correlation_id: Optional[str] = Header(None, alias="X-Correlation-ID"),
    x_request_id: Optional[str] = Header(None, alias="X-Request-ID")
):
    user_id = x_user_id or payload.userId
    corr_id = x_correlation_id or payload.correlationId
    req_id = x_request_id or payload.requestId
    
    # 1. Logging bảo mật
    logger.info(f"[GEN_QUESTION_START] Corr: {corr_id} | User: {user_id} | Session: {payload.sessionId} | QNum: {payload.questionNumber}")

    try:
        # 2. Xử lý Lịch sử (Token Optimization)
        topic_memory, recent_turns = transform_conversation_history(payload.conversationHistoryJson)
        
        topic_memory_str = "\n".join([f"- {t}" for t in topic_memory]) if topic_memory else "Chưa hỏi gì."
        
        goal_text = payload.goal if payload.goal else "Không có mục tiêu cụ thể"

        # 3. Kỹ thuật Prompt Engineering bám sát hợp đồng C#
        system_prompt = f"""Bạn là nhà tuyển dụng/phỏng vấn viên chuyên nghiệp (Tiếng Việt).
Thông tin ứng viên:
- Vị trí: {payload.position}
- Level: {payload.level}
- Mục tiêu: {goal_text}
- Loại phỏng vấn: {payload.interviewType} (Technical ưu tiên chuyên môn, Behavioral ưu tiên STAR)
- Phong cách: {payload.interviewerMode}

Nhiệm vụ: Hãy sinh ra câu hỏi số {payload.questionNumber} / {payload.totalExpectedQuestions}.
- Nếu questionNumber = 1: Bắt đầu bằng câu mở đầu phù hợp.
- Nếu > 1: Đánh giá câu trả lời gần nhất của ứng viên. Nếu sơ sài -> Hỏi follow-up/đào sâu. Nếu tốt -> Chuyển sang chủ đề mới.

[BỘ NHỚ - CÁC CHỦ ĐỀ ĐÃ HỎI - BẠN TUYỆT ĐỐI KHÔNG HỎI LẠI CÁC Ý NÀY]:
{topic_memory_str}

BẮT BUỘC TRẢ VỀ CHUẨN JSON SAU:
{{
  "questionText": "Nội dung câu hỏi (chỉ định).",
  "questionType": "opening/behavioral/technical/follow_up/system_design/culture_fit",
  "difficulty": "easy/medium/hard",
  "expectedAnswerPoints": ["Ý chính 1 cần có", "Ý chính 2 cần có", "Ví dụ..."]
}}
"""
        
        # 4. Thực thi AI call
        raw_result, model_used = await generate_question_with_fallback(
            ai_model_request=payload.aiModel,
            system_prompt=system_prompt,
            recent_turns=recent_turns
        )
        
        # 5. Parse và Trả kết quả
        try:
            ai_json = json.loads(raw_result.replace("```json", "").replace("```", "").strip())
            
            data_res = GenerateQuestionData(
                questionText=ai_json.get("questionText"),
                questionType=ai_json.get("questionType"),
                difficulty=ai_json.get("difficulty"),
                expectedAnswerPoints=ai_json.get("expectedAnswerPoints", []),
                modelVersion=model_used, 
                schemaVersion="interview-question-v1"
            )
            
            logger.info(f"[GEN_QUESTION_SUCCESS] Corr: {corr_id} | QNum: {payload.questionNumber}")
            return InterviewResponseEnvelope(success=True, data=data_res)

        except json.JSONDecodeError:
            raise ValueError("QUESTION_GENERATION_FAILED|Lỗi định dạng JSON từ mô hình AI.")

    except Exception as e:
        err_msg = str(e)
        logger.error(f"[GEN_QUESTION_ERROR] Corr: {corr_id} | Error: {err_msg}")
        
        # Bóc tách Custom Exception (nếu có)
        error_code = "INTERNAL_ERROR"
        display_msg = err_msg
        if "|" in err_msg:
            parts = err_msg.split("|", 1)
            error_code, display_msg = parts[0], parts[1]
        
        if "SERVICE_UNAVAILABLE" in error_code:
            display_msg = "Dịch vụ AI phỏng vấn hiện chưa sẵn sàng."

        return InterviewResponseEnvelope(
            success=False,
            error=ErrorDetail(code=error_code, message=display_msg)
        )