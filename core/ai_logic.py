import json
import os
import logging
from typing import Tuple, List, Dict, Optional

# Giả lập import SDK (Anh nhớ cài openai, google-genai vào requirements.txt)
from openai import AsyncOpenAI
from google import genai
from google.genai import types

logger = logging.getLogger("ai_interview_core")

# --- DANH SÁCH MODEL THEO GÓI ---
TIER_MODELS = {
    "free": ["gemini-2.5-flash-lite", "gpt-4o-mini", "gemini-3.1-flash-lite", "gpt-5-mini", "gemini-2.5-flash", "gpt-4.1-mini"],
    "monthly": ["gemini-2.5-flash-lite", "gpt-4o-mini", "gemini-3.1-flash-lite", "gpt-5-mini", "gemini-2.5-flash", "gpt-4.1-mini"],
    "quarterly": ["gemini-3-flash-preview", "gpt-3.5-turbo", "gpt-5.4-mini", "o1-mini", "o3-mini", "o4-mini", "gpt-5", "gpt-5.1", "gemini-2.5-pro", "gpt-5.2"],
    "yearly": ["o3", "gpt-4.1", "gemini-3.1-pro-preview", "gpt-4o", "gpt-5.4"]
}

# --- QUẢN LÝ POOL API KEYS ---
GEMINI_KEYS = [os.getenv(f"GEMINI_API_KEY_{i}") for i in range(7, 10) if os.getenv(f"GEMINI_API_KEY_{i}")]
OPENAI_KEYS = [os.getenv(f"OPENAI_API_KEY_{i}") for i in range(1, 4) if os.getenv(f"OPENAI_API_KEY_{i}")]

gemini_key_idx = 0
openai_key_idx = 0

def get_next_key(provider: str) -> str:
    global gemini_key_idx, openai_key_idx
    if provider == "gemini" and GEMINI_KEYS:
        key = GEMINI_KEYS[gemini_key_idx]
        gemini_key_idx = (gemini_key_idx + 1) % len(GEMINI_KEYS)
        return key
    elif provider == "openai" and OPENAI_KEYS:
        key = OPENAI_KEYS[openai_key_idx]
        openai_key_idx = (openai_key_idx + 1) % len(OPENAI_KEYS)
        return key
    raise ValueError(f"No API Keys configured for {provider}")

def determine_provider(model_name: str) -> str:
    if "gpt" in model_name or model_name.startswith("o1") or model_name.startswith("o3") or model_name.startswith("o4"):
        return "openai"
    return "gemini"

# --- TRANSFORMER LỊCH SỬ CHAT ---
def transform_conversation_history(history_json_str: Optional[str], window_size: int = 2) -> Tuple[List[str], List[Dict]]:
    if not history_json_str:
        return [], []
    try:
        history = json.loads(history_json_str)
        if not isinstance(history, list):
            return [], []
    except json.JSONDecodeError:
        return [], []

    topic_memory = []
    old_turns_count = max(0, len(history) - window_size)
    for i in range(old_turns_count):
        q = history[i].get("question")
        if q:
            topic_memory.append(q)
            
    recent_turns = history[old_turns_count:]
    return topic_memory, recent_turns

# --- HÀM GỌI SDK LÕI THỰC TẾ ---
async def _call_provider_sdk(provider: str, model: str, api_key: str, system_prompt: str, recent_turns: List[Dict]) -> str:
    if provider == "openai":
        client = AsyncOpenAI(api_key=api_key)
        messages = [{"role": "system", "content": system_prompt}]
        for turn in recent_turns:
            if turn.get("question"): messages.append({"role": "assistant", "content": turn["question"]})
            if turn.get("answer"): messages.append({"role": "user", "content": turn["answer"]})
        
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            response_format={"type": "json_object"}
        )
        return response.choices[0].message.content

    else: # Gemini
        client = genai.Client(api_key=api_key)
        contents = []
        for turn in recent_turns:
            if turn.get("question"): contents.append(types.Content(role="model", parts=[types.Part.from_text(turn["question"])]))
            if turn.get("answer"): contents.append(types.Content(role="user", parts=[types.Part.from_text(turn["answer"])]))
        # Nếu chưa có lịch sử (câu 1), Gemini cần mảng contents chứa mồi
        if not contents:
             contents.append(types.Content(role="user", parts=[types.Part.from_text("Bắt đầu phỏng vấn.")]))
             
        response = client.models.generate_content(
            model=model,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json"
            )
        )
        return response.text

# --- ORCHESTRATOR: TỰ ĐỘNG FALLBACK & XOAY KEY ---
async def generate_question_with_fallback(ai_model_request: str, system_prompt: str, recent_turns: List[Dict]) -> Tuple[str, str]:
    ai_model_request = ai_model_request.lower()
    
    # Kịch bản 1: Gọi theo Tier (Gói Cước) -> Có quyền trượt model
    if ai_model_request in TIER_MODELS:
        models_to_try = TIER_MODELS[ai_model_request]
        for model in models_to_try:
            provider = determine_provider(model)
            for attempt in range(3): # Xoay tối đa 3 keys cho mỗi model
                try:
                    key = get_next_key(provider)
                    result = await _call_provider_sdk(provider, model, key, system_prompt, recent_turns)
                    return result, model
                except Exception as e:
                    logger.warning(f"Failed {model} (Key attempt {attempt+1}): {str(e)}")
                    continue # Thử key tiếp theo
        
        raise Exception("SERVICE_UNAVAILABLE|Tất cả model trong gói đều quá tải.")

    # Kịch bản 2: Gọi Model Cụ Thể -> KHÔNG trượt model, chỉ xoay key
    else:
        model = ai_model_request
        provider = determine_provider(ai_model_request)
        for attempt in range(3):
            try:
                key = get_next_key(provider)
                result = await _call_provider_sdk(provider, ai_model_request, key, system_prompt, recent_turns)
                return result, model
            except Exception as e:
                logger.warning(f"Failed {ai_model_request} (Key attempt {attempt+1}): {str(e)}")
                continue
                
        raise Exception(f"SERVICE_UNAVAILABLE|Model {ai_model_request} hiện không khả dụng.")
    
    