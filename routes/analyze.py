import json
import logging
from fastapi import APIRouter, Request, Header, Depends
from typing import Optional

from schemas.analyze_schema import AnalyzeRequest, AnalyzeDataResponse
from schemas.interview_schema import InterviewResponseEnvelope, ErrorDetail
from core.ai_logic import generate_question_with_fallback
from core.security import verify_internal_api_key, limiter

router = APIRouter()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai_analyze_routes")

@router.post("/ai/interviews/analyze", response_model=InterviewResponseEnvelope)
@limiter.limit("5/minute") # Phân tích tốn token và thời gian hơn nên giới hạn thấp hơn
async def analyze_interview(
    request: Request,
    payload: AnalyzeRequest,
    api_key: str = Depends(verify_internal_api_key),
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    x_correlation_id: Optional[str] = Header(None, alias="X-Correlation-ID"),
    x_request_id: Optional[str] = Header(None, alias="X-Request-ID")
):
    user_id = x_user_id or payload.userId
    corr_id = x_correlation_id or payload.correlationId
    req_id = x_request_id or payload.requestId
    
    logger.info(f"[ANALYZE_START] Corr: {corr_id} | User: {user_id} | Session: {payload.sessionId}")
    
    # 1. Parse Transcript & Validation
    try:
        transcript = json.loads(payload.transcriptJson)
        # Phải là list và phải có dữ liệu
        if not transcript or not isinstance(transcript, list):
             raise ValueError("Transcript không phải là danh sách hợp lệ.")
             
        # Phải có ít nhất 1 câu trả lời hợp lệ bên trong
        has_valid_answer = any(isinstance(item, dict) and item.get("answer") for item in transcript)
        if not has_valid_answer:
             raise ValueError("Không tìm thấy câu trả lời nào của ứng viên.")
        
    except Exception as e:
        logger.warning(f"[ANALYZE_VALIDATION_FAILED] Corr: {corr_id} | {str(e)}")
        return InterviewResponseEnvelope(
            success=False, 
            error=ErrorDetail(code="INVALID_TRANSCRIPT", message="Transcript rỗng hoặc định dạng không hợp lệ.")
        )
    
    # 2. Xây dựng nội dung Transcript để ném vào Prompt
    formatted_transcript = ""
    for item in transcript:
        if isinstance(item, dict):
            q_num = item.get('questionNumber', '?')
            question = item.get('question', '')
            answer = item.get('answer', '')
            formatted_transcript += f"Q{q_num}: {question}\nA: {answer}\n---\n"

    goal_text = payload.goal if payload.goal else "Không có mục tiêu cụ thể"

    # 3. System Prompt "Chuyên gia"
    system_prompt = f"""Bạn là Hội đồng chuyên gia đánh giá phỏng vấn cao cấp.
Nhiệm vụ: Phân tích transcript buổi phỏng vấn cho vị trí {payload.position} (Level: {payload.level}).
Mục tiêu của ứng viên: {goal_text}.

Tiêu chí đánh giá (Thang điểm 10):
- Overall: Điểm tổng quát.
- Confidence: Sự tự tin qua cách diễn đạt.
- Clarity: Sự mạch lạc, rõ ràng.
- Relevance: Độ liên quan của câu trả lời với câu hỏi và vị trí tuyển dụng.

Dữ liệu Transcript:
{formatted_transcript}

YÊU CẦU TRẢ VỀ JSON THUẦN (Tiếng Việt):
{{
  "overallScore": float,
  "confidenceScore": float,
  "clarityScore": float,
  "relevanceScore": float,
  "strengths": ["Liệt kê 2-3 điểm mạnh"],
  "weaknesses": ["Liệt kê 2-3 điểm yếu thật lòng"],
  "recommendations": ["Lời khuyên thực tế để cải thiện"],
  "scoreBreakdowns": [
    {{"dimension": "technical_knowledge", "score": float, "maxScore": 10}},
    {{"dimension": "communication", "score": float, "maxScore": 10}},
    {{"dimension": "problem_solving", "score": float, "maxScore": 10}}
  ],
  "feedbackItems": [
    {{"category": "strength", "title": "Tiêu đề", "detail": "Chi tiết..."}},
    {{"category": "improvement", "title": "Tiêu đề", "detail": "Chi tiết..."}}
  ]
}}
"""

    try:
        # Sử dụng lại hàm gọi AI có xoay key và fallback ở Phase trước
        raw_result, model_used = await generate_question_with_fallback(
            ai_model_request=payload.aiModel,
            system_prompt=system_prompt,
            recent_turns=[] # Không cần context chat vì transcript đã nằm trong prompt
        )

        ai_json = json.loads(raw_result.replace("```json", "").replace("```", "").strip())
        
        # Build Response Data
        data_res = AnalyzeDataResponse(
            **ai_json,
            modelVersion=model_used
        )

        logger.info(f"[ANALYZE_SUCCESS] Corr: {corr_id} | Model: {model_used} | Score: {data_res.overallScore}")
        return InterviewResponseEnvelope(success=True, data=data_res)

    except Exception as e:
        err_msg = str(e)
        logger.error(f"[ANALYZE_ERROR] Corr: {corr_id} | Error: {err_msg}")
        
        # Bóc tách lỗi đàng hoàng để trả về đúng SERVICE_UNAVAILABLE nếu Provider sập
        error_code = "ANALYSIS_FAILED"
        display_msg = "Không thể phân tích kết quả phỏng vấn lúc này."
        
        if "|" in err_msg:
            parts = err_msg.split("|", 1)
            error_code, display_msg = parts[0], parts[1]
            
        if "SERVICE_UNAVAILABLE" in error_code:
            display_msg = "Dịch vụ AI phỏng vấn hiện chưa sẵn sàng."

        return InterviewResponseEnvelope(
            success=False,
            error=ErrorDetail(code=error_code, message=display_msg)
        )