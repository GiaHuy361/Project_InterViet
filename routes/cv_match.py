import json
from typing import Optional
from fastapi import APIRouter, Request, Header
from datetime import datetime
from schemas.match_schema import MatchRequest, MatchResponseEnvelope, MatchDataResponse
from core.ai_logic import call_gemini_with_retry
from core.security import match_clients, limiter

# Khởi tạo Router
router = APIRouter()

# --- HÀM HELPER TIỀN XỬ LÝ ---
def normalize_json_field(field_value: str) -> str:
    """
    Tiền xử lý: Làm sạch mảng JSON thành text thuần để tiết kiệm token 
    và giúp AI dễ đọc nội dung hơn (tránh nhiễu ngoặc vuông, ngoặc nhọn).
    """
    if not field_value or field_value.strip() in ("{}", "[]", ""):
        return "Không có thông tin"
    try:
        parsed = json.loads(field_value)
        # Nếu là List, chuyển thành chuỗi cách nhau dấu phẩy
        if isinstance(parsed, list):
            return ", ".join([str(item) for item in parsed])
        # Nếu là Dict, chuyển về string dễ nhìn
        elif isinstance(parsed, dict):
            return json.dumps(parsed, ensure_ascii=False, indent=2)
        return str(parsed)
    except json.JSONDecodeError:
        # Nếu json.loads fail (bản chất đã là text thô), giữ nguyên văn bản
        return field_value.strip()

# --- ENDPOINT MATCHING ---
@router.post("/v1/cv/match", response_model=MatchResponseEnvelope)
@limiter.limit("5/minute")
async def match_cv_jd(
    request: Request,
    payload: MatchRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    x_correlation_id: Optional[str] = Header(None, alias="X-Correlation-ID"),
    x_request_id: Optional[str] = Header(None, alias="X-Request-ID")
):
    # 1. Lấy thông tin tracking (Ưu tiên Header, Fallback xuống Body)
    user_id = x_user_id or payload.userId
    correlation_id = x_correlation_id or payload.correlationId
    request_id = x_request_id or payload.requestId

    # 2. Bắt lỗi Validation cơ bản
    if not payload.resumeParsedData.rawText or not payload.resumeParsedData.rawText.strip():
        # Ghi chú: Khi ráp vào main.py, ta sẽ ném CustomAPIException ở đây
        raise ValueError(f"RESUME_PARSED_DATA_REQUIRED|{correlation_id}|{request_id}|Dữ liệu CV parse không được để trống")

    # 3. Tiền xử lý dữ liệu CV
    cv_data = payload.resumeParsedData
    normalized_skills = normalize_json_field(cv_data.skillsJson)
    normalized_exp = normalize_json_field(cv_data.experiencesJson)
    normalized_edu = normalize_json_field(cv_data.educationsJson)
    normalized_cert = normalize_json_field(cv_data.certificationsJson)
    normalized_lang = normalize_json_field(cv_data.languagesJson)

    # 4. Chuẩn bị System Prompt & User Prompt
    current_date = datetime.now().strftime("%d/%m/%Y")
    system_instruction = f"""Bạn là một chuyên gia Tuyển dụng (Senior IT Recruiter).
Hôm nay là ngày {current_date}. Hãy dùng ngày này làm mốc để tính toán số năm kinh nghiệm.
Nhiệm vụ của bạn là đánh giá mức độ phù hợp giữa một Hồ sơ ứng viên (CV) và Yêu cầu công việc (JD).
Hãy phân tích khách quan, chính xác và trả về kết quả DƯỚI DẠNG JSON.
Quy tắc bắt buộc:
1. TUYỆT ĐỐI KHÔNG trả về 0 điểm. Nếu CV không liên quan, hãy cho mức điểm sàn từ 5-15 điểm.
2. Ngôn ngữ nhận xét (summary, strengths, weaknesses, recommendations) BẮT BUỘC là Tiếng Việt.
3. Không trả về markdown code block (```json). Chỉ trả JSON thuần."""

    prompt = f"""
Hãy so sánh CV và JD sau đây:

--- YÊU CẦU CÔNG VIỆC (JD) ---
{payload.jobDescription.rawText}

--- DỮ LIỆU HỒ SƠ ỨNG VIÊN ---
[Kỹ năng]: {normalized_skills}
[Kinh nghiệm làm việc]: {normalized_exp}
[Học vấn]: {normalized_edu}
[Chứng chỉ]: {normalized_cert}
[Ngoại ngữ]: {normalized_lang}
[Văn bản gốc CV]: {cv_data.rawText[:3000]} 

Dựa vào thông tin trên, hãy tính điểm và điền đầy đủ các trường JSON sau:
{{
  "overallScore": <int từ 5-100>,
  "skillScore": <int từ 5-100>,
  "experienceScore": <int từ 5-100>,
  "educationScore": <int từ 5-100>,
  "languageScore": <int từ 5-100>,
  "matchedSkills": ["kỹ năng 1", "kỹ năng 2"],
  "missingSkills": ["kỹ năng thiếu 1"],
  "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
  "weaknesses": ["Điểm yếu 1"],
  "recommendations": ["Gợi ý 1", "Gợi ý 2"],
  "summary": "Tóm tắt đánh giá ngắn gọn"
}}
"""

    # 5. Gọi Gemini qua module ai_logic dùng chung
    try:
        # Cấu hình danh sách Model dòng Pro cho Matching (như bạn yêu cầu)
        models = ['gemini-2.5-pro', 'gemini-3.1-pro-preview']
        
        response = call_gemini_with_retry(
            contents_payload=[prompt],
            client_pool=match_clients,
            models_to_try=models,
            task_type="match",
            system_instruction=system_instruction
        )
        
        # 6. Parse kết quả trả về
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        ai_result = json.loads(clean_text)
        
        # 7. Build dữ liệu thành công
        match_data = MatchDataResponse(
            matchJobId=payload.matchJobId,
            resumeId=payload.resumeId,
            resumeVersionId=payload.resumeVersionId,
            jobDescriptionId=payload.jobDescriptionId,
            overallScore=ai_result.get("overallScore", 10),
            skillScore=ai_result.get("skillScore", 10),
            experienceScore=ai_result.get("experienceScore", 10),
            educationScore=ai_result.get("educationScore", 10),
            languageScore=ai_result.get("languageScore", 10),
            matchedSkills=ai_result.get("matchedSkills", []),
            missingSkills=ai_result.get("missingSkills", []),
            strengths=ai_result.get("strengths", []),
            weaknesses=ai_result.get("weaknesses", []),
            recommendations=ai_result.get("recommendations", []),
            summary=ai_result.get("summary", "Không có tóm tắt.")
        )
        
        return MatchResponseEnvelope(success=True, data=match_data, error=None)

    except Exception as e:
        error_msg = str(e)
        # Bắt đúng lỗi 503 để báo Service Unavailable theo Contract của C#
        if "503" in error_msg or "high demand" in error_msg.lower():
            # Tương tự, khi ráp main.py ta sẽ ném CustomAPIException
            raise ValueError(f"SERVICE_UNAVAILABLE|{correlation_id}|{request_id}|Dịch vụ matching tạm thời không khả dụng do quá tải.")
            
        raise ValueError(f"INTERNAL_ERROR|{correlation_id}|{request_id}|Lỗi khi tính điểm match: {error_msg}")