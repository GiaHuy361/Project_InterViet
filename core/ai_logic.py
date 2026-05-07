from tenacity import retry, stop_after_attempt, wait_exponential
from google.genai import types

# Tách riêng index để xoay vòng chuẩn xác cho từng nhóm Key
parse_key_index = 0
match_key_index = 0

@retry(
    stop=stop_after_attempt(4), 
    wait=wait_exponential(multiplier=2, min=4, max=20), 
    reraise=True
)
def call_gemini_with_retry(
    contents_payload, 
    client_pool: list, 
    models_to_try: list, 
    task_type: str = "parse", 
    system_instruction: str = None
):
    global parse_key_index, match_key_index
    
    # 1. Chọn Key dựa trên loại tác vụ (Round Robin)
    if task_type == "parse":
        client = client_pool[parse_key_index % len(client_pool)]
        parse_key_index += 1
    elif task_type == "match":
        client = client_pool[match_key_index % len(client_pool)]
        match_key_index += 1
    else:
        raise ValueError("task_type chỉ hỗ trợ 'parse' hoặc 'match'")
    
    # 2. Quét qua danh sách Model (từ cao đến thấp)
    last_exception = None
    for model_name in models_to_try:
        try:
            return client.models.generate_content(
                model=model_name,
                contents=contents_payload,
                config=types.GenerateContentConfig(
                    temperature=0.1, 
                    top_p=0.95,
                    system_instruction=system_instruction
                )
            )
        except Exception as e:
            last_exception = e
            if "503" in str(e) or "high demand" in str(e).lower():
                print(f"[RETRY] Model {model_name} bận, đang fallback sang model tiếp theo...")
                continue
            raise e 
            
    raise last_exception