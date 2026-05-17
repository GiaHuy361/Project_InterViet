# AI MODEL MAPPING - INTER-VIET

**Ngày:** 2026-05-09  
**Mục đích:** Mapping UI AI models → Backend stable keys → Python actual models

---

## 📋 UI MOCKTEST HIỆN TẠI

Màn **Interview Setup** có dropdown chọn AI model với **7 options:**

| Value (hiện tại) | Label UI | Description | Premium | Vấn đề |
|------------------|----------|-------------|---------|--------|
| `gpt-4o-mini` | GPT-4o mini | Nhanh & tiết kiệm | ❌ Free | ❌ Cứng provider |
| `gpt-3.5-turbo` | GPT-3.5 Turbo | Cơ bản, ổn định | ❌ Free | ❌ Cứng provider |
| `gpt-4o` | GPT-4o | Chất lượng cao, phản biện sâu | ✅ Premium | ❌ Cứng provider |
| `gpt-4o-realtime` | GPT-4o Realtime | Voice realtime, độ trễ thấp | ✅ Premium | ❌ Cứng provider |
| `claude-3-opus` | Claude 3 Opus | Lập luận mạnh | ✅ Premium | ❌ Cứng provider |
| `gemini-1.5-pro` | Gemini 1.5 Pro | Ngữ cảnh dài | ✅ Premium | ❌ Cứng provider |
| `mixtral-8x7b` | Mixtral 8x7B | Tối ưu chi phí | ✅ Premium | ❌ Cứng provider |

### Vấn đề với cách hiện tại:

1. ❌ **Frontend cứng tên provider** (GPT, Claude, Gemini) → Khó migrate nếu đổi provider
2. ❌ **Backend phụ thuộc provider-specific keys** → Tight coupling
3. ❌ **Python AI service không flexible** → Không thể A/B test hoặc fallback

---

## ✅ ĐỀ XUẤT MAPPING MỚI

### **Backend Stable Keys (3 tiers)**

Frontend chỉ gửi **3 keys ổn định:**

| Backend Key | Tier | Purpose | Free/Premium |
|-------------|------|---------|--------------|
| `basic` | Cơ bản | Fast, cost-effective, good enough | ❌ Free |
| `standard` | Tiêu chuẩn | Balanced quality & speed | ✅ Premium |
| `advanced` | Cao cấp | Best quality, deep reasoning | ✅ Premium |

### **Frontend → Backend Mapping**

UI dropdown gửi key ổn định, backend map sang tier:

| UI Label (hiển thị) | UI Value (gửi backend) | Backend Tier | Description |
|---------------------|------------------------|--------------|-------------|
| **Model cơ bản** | `basic` | basic | Nhanh & tiết kiệm |
| **Model tiêu chuẩn** | `standard` | standard | Cân bằng chất lượng & tốc độ |
| **Model cao cấp** | `advanced` | advanced | Chất lượng tốt nhất |

### **Backend → Python Mapping**

Python AI service nhận tier, tự chọn model thật:

| Backend Tier | Python Model (hiện tại) | Python Model (fallback) | Cost/Request |
|--------------|------------------------|-------------------------|--------------|
| `basic` | `gpt-4o-mini` | `gpt-3.5-turbo` | ~$0.001 |
| `standard` | `gpt-4o` | `claude-3-5-sonnet` | ~$0.01 |
| `advanced` | `claude-3-opus` | `gpt-4o` | ~$0.03 |

**Lợi ích:**
- ✅ Python có thể A/B test models
- ✅ Python có thể fallback nếu 1 provider down
- ✅ Python có thể optimize cost bằng cách swap models
- ✅ Frontend KHÔNG cần update nếu đổi provider

---

## 🔄 MIGRATION PLAN

### **Phase 1: Update Frontend (Breaking Change)**

**Trước:**
```typescript
const aiModels = [
  { value: 'gpt-4o-mini', label: 'GPT-4o mini', ... },
  { value: 'claude-3-opus', label: 'Claude 3 Opus', ... },
];
```

**Sau:**
```typescript
const aiModels = [
  { 
    value: 'basic', 
    label: 'Model cơ bản', 
    description: 'Nhanh & tiết kiệm, phù hợp luyện tập hàng ngày',
    premium: false 
  },
  { 
    value: 'standard', 
    label: 'Model tiêu chuẩn', 
    description: 'Cân bằng chất lượng & tốc độ, phù hợp phỏng vấn thật',
    premium: true 
  },
  { 
    value: 'advanced', 
    label: 'Model cao cấp', 
    description: 'AI thông minh nhất, phản biện sâu như CEO',
    premium: true 
  },
];
```

### **Phase 2: Update Backend C# API**

**Database:**
```sql
-- InterviewSessions table
AIModel NVARCHAR(50)  -- Values: 'basic', 'standard', 'advanced'
```

**API Request:**
```json
POST /api/v1/interviews
{
  "position": "Software Engineer",
  "aiModel": "standard"  // ← Stable key
}
```

**C# → Python:**
```csharp
// C# forwards to Python without transformation
var request = new {
    sessionId = session.Id,
    aiModelTier = session.AIModel,  // "standard"
    ...
};
await _pythonClient.PostAsync("/ai/interviews/generate-question", request);
```

### **Phase 3: Python AI Service Mapping**

**Python config:**
```python
# config/models.py
MODEL_MAPPING = {
    "basic": {
        "primary": "gpt-4o-mini",
        "fallback": "gpt-3.5-turbo",
        "max_tokens": 1000,
        "temperature": 0.7,
    },
    "standard": {
        "primary": "gpt-4o",
        "fallback": "claude-3-5-sonnet",
        "max_tokens": 2000,
        "temperature": 0.8,
    },
    "advanced": {
        "primary": "claude-3-opus",
        "fallback": "gpt-4o",
        "max_tokens": 4000,
        "temperature": 0.9,
    },
}

def get_model_for_tier(tier: str):
    config = MODEL_MAPPING.get(tier, MODEL_MAPPING["basic"])
    try:
        return config["primary"]
    except:
        return config["fallback"]
```

**Python API:**
```python
@app.post("/ai/interviews/generate-question")
async def generate_question(request: GenerateQuestionRequest):
    tier = request.aiModelTier  # "standard"
    actual_model = get_model_for_tier(tier)  # "gpt-4o"
    
    response = await openai.ChatCompletion.create(
        model=actual_model,
        messages=[...],
        **MODEL_MAPPING[tier]
    )
    
    return response
```

---

## 📊 COMPARISON: OLD vs NEW

### **OLD (Provider-specific)**

```
Frontend: "gpt-4o" 
    ↓
Backend: Save "gpt-4o"
    ↓
Python: Use "gpt-4o" directly
```

**Problems:**
- ❌ Frontend phụ thuộc OpenAI naming
- ❌ Khó đổi provider
- ❌ Không có fallback
- ❌ User nhìn thấy technical names

### **NEW (Tier-based)**

```
Frontend: "standard" (User thấy: "Model tiêu chuẩn")
    ↓
Backend: Save "standard"
    ↓
Python: Map "standard" → "gpt-4o" (hoặc fallback "claude-3-5-sonnet")
```

**Benefits:**
- ✅ Frontend agnostic về provider
- ✅ Dễ đổi provider (chỉ update Python config)
- ✅ Có fallback tự động
- ✅ User thấy business terms, không phải technical names

---

## 🎯 FINAL RECOMMENDATION

### **Frontend UI (Đề xuất đơn giản hóa)**

Chỉ **3 options** thay vì 7:

```typescript
const aiModels = [
  {
    value: 'basic',
    label: 'Model cơ bản',
    description: 'Nhanh & tiết kiệm • Phù hợp luyện tập hàng ngày',
    features: ['Tốc độ phản hồi nhanh', 'Câu hỏi cơ bản đến trung bình'],
    premium: false,
    icon: '⚡',
  },
  {
    value: 'standard',
    label: 'Model tiêu chuẩn',
    description: 'Cân bằng chất lượng & tốc độ • Phù hợp phỏng vấn thật',
    features: ['Câu hỏi chuyên sâu', 'Phản biện logic tốt', 'Đánh giá chính xác'],
    premium: true,
    icon: '🎯',
    badge: 'Phổ biến',
  },
  {
    value: 'advanced',
    label: 'Model cao cấp',
    description: 'AI thông minh nhất • Phản biện sâu như CEO thật',
    features: ['Câu hỏi sắc bén nhất', 'Phân tích đa chiều', 'Follow-up questions thông minh'],
    premium: true,
    icon: '🚀',
    badge: 'Tốt nhất',
  },
];
```

### **Backend Database**

```sql
-- SubscriptionPlans table
AIModelTier NVARCHAR(20) DEFAULT 'basic'
-- Values: 'basic', 'standard', 'advanced'

-- InterviewSessions table
AIModel NVARCHAR(20) NOT NULL
-- Values: 'basic', 'standard', 'advanced'
```

### **Backend C# Enum**

```csharp
public enum AIModelTier
{
    Basic = 0,      // Free users
    Standard = 1,   // Premium users (default)
    Advanced = 2    // Premium users (opt-in)
}
```

### **Python AI Config**

```python
# Easy to update models without touching C# or Frontend
MODEL_MAPPING = {
    "basic": {
        "primary": "gpt-4o-mini",
        "fallback": "gpt-3.5-turbo",
        "provider": "openai",
    },
    "standard": {
        "primary": "gpt-4o",
        "fallback": "claude-3-5-sonnet",
        "provider": "openai",  # Can switch to "anthropic" anytime
    },
    "advanced": {
        "primary": "claude-3-opus",
        "fallback": "gpt-4o",
        "provider": "anthropic",
    },
}
```

---

## 🔒 BUSINESS RULES

### **Free vs Premium Access**

| Tier | Free User | Monthly/Quarterly | Yearly |
|------|-----------|-------------------|--------|
| `basic` | ✅ Always allowed | ✅ Allowed | ✅ Allowed |
| `standard` | ❌ Upgrade required | ✅ Allowed (default) | ✅ Allowed |
| `advanced` | ❌ Upgrade required | ✅ Allowed | ✅ Allowed (default) |

### **Default Model per Plan**

```csharp
var defaultModel = user.Plan switch
{
    SubscriptionPlan.Free => AIModelTier.Basic,
    SubscriptionPlan.Monthly => AIModelTier.Standard,
    SubscriptionPlan.Quarterly => AIModelTier.Standard,
    SubscriptionPlan.Yearly => AIModelTier.Advanced,
    _ => AIModelTier.Basic
};
```

---

## ✅ MIGRATION CHECKLIST

### **Phase 1: Frontend Update**
- [ ] Update `aiModels` array (3 options: basic/standard/advanced)
- [ ] Update UI labels (Model cơ bản/tiêu chuẩn/cao cấp)
- [ ] Remove provider names from UI
- [ ] Add features list per tier
- [ ] Update premium checks

### **Phase 2: Backend Update**
- [ ] Update `InterviewSessions.AIModel` column type
- [ ] Create `AIModelTier` enum
- [ ] Update validation (only accept basic/standard/advanced)
- [ ] Update API request models
- [ ] Update API response models
- [ ] Migrate existing data (gpt-4o → standard, etc.)

### **Phase 3: Python Update**
- [ ] Create `MODEL_MAPPING` config
- [ ] Implement `get_model_for_tier()` function
- [ ] Add fallback logic
- [ ] Add retry with fallback model
- [ ] Update all API endpoints to use tier mapping
- [ ] Add logging for model selection

### **Phase 4: Testing**
- [ ] Test free user với basic model
- [ ] Test premium user với standard model
- [ ] Test premium user với advanced model
- [ ] Test fallback khi primary model fails
- [ ] Test upgrade flow (free → premium)
- [ ] Load test với 3 tiers

---

## 📝 API CONTRACT UPDATE

### **Before (Old):**

```http
POST /api/v1/interviews
{
  "aiModel": "gpt-4o"  // ❌ Provider-specific
}
```

### **After (New):**

```http
POST /api/v1/interviews
{
  "aiModel": "standard"  // ✅ Tier-based
}
```

### **Python AI Request:**

```http
POST /ai/interviews/generate-question
{
  "sessionId": "guid",
  "aiModelTier": "standard",  // ✅ Backend stable key
  ...
}
```

**Python internally maps:**
```python
tier = "standard"
actual_model = "gpt-4o"  # or "claude-3-5-sonnet" if fallback
```

---

## 🎓 EDUCATIONAL MESSAGING

### **How to explain to users:**

**Old UI (confusing):**
> "Chọn GPT-4o mini, GPT-3.5 Turbo, hoặc Claude 3 Opus"  
> ❌ User: "GPT là gì? Claude là gì? Khác nhau thế nào?"

**New UI (clear):**
> **Model cơ bản** - Nhanh & tiết kiệm  
> **Model tiêu chuẩn** - Cân bằng chất lượng & tốc độ  
> **Model cao cấp** - AI thông minh nhất  
> ✅ User: "Ồ, tôi hiểu rồi! Cơ bản cho luyện tập, cao cấp cho phỏng vấn thật."

---

## 🚀 ROLLOUT STRATEGY

### **Option A: Big Bang (Breaking Change)**

1. Deploy all changes cùng lúc
2. Migrate existing data
3. Frontend/Backend/Python đồng thời update

**Pros:** Clean, no technical debt  
**Cons:** Risk cao, requires coordination

### **Option B: Gradual Migration (Recommended)**

**Week 1:** Backend support both old + new keys
```csharp
// Accept both "gpt-4o" and "standard"
var tier = request.AIModel switch
{
    "gpt-4o-mini" or "gpt-3.5-turbo" => "basic",
    "gpt-4o" => "standard",
    "claude-3-opus" or "gemini-1.5-pro" => "advanced",
    _ => request.AIModel  // Already new format
};
```

**Week 2:** Frontend update to new keys  

**Week 3:** Python fully migrated  

**Week 4:** Remove backward compatibility, migrate old data

---

## 📌 SUMMARY

### **Mapping Table**

| UI Label | Frontend Value | Backend Tier | Python Model | Free/Premium |
|----------|---------------|--------------|--------------|--------------|
| Model cơ bản | `basic` | `basic` | `gpt-4o-mini` → fallback `gpt-3.5-turbo` | ❌ Free |
| Model tiêu chuẩn | `standard` | `standard` | `gpt-4o` → fallback `claude-3-5-sonnet` | ✅ Premium |
| Model cao cấp | `advanced` | `advanced` | `claude-3-opus` → fallback `gpt-4o` | ✅ Premium |

### **Key Principles**

1. ✅ **Frontend**: Business terms, NOT technical names
2. ✅ **Backend**: Stable keys, tier-based
3. ✅ **Python**: Flexible model mapping, can change anytime
4. ✅ **User**: Simple choice, clear value proposition

---

**Recommendation:** Implement **Option B (Gradual Migration)** để giảm risk.

**Timeline:** 4 weeks total

**Priority:** MEDIUM - Nên làm trước khi Phase 7 Interview production launch

---

**Ngày xuất:** 2026-05-09  
**Version:** 1.0  
**Tác giả:** Claude Code Analysis
