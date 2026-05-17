# INTER-VIET API Contract Specification

## API Architecture

```
┌─────────────────┐
│   Frontend      │
│   (React)       │
└────────┬────────┘
         │
         ├──────────────────────┬────────────────────────┐
         ▼                      ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  C# Backend     │    │  Python AI      │    │  File Storage   │
│  (.NET API)     │◄───┤  (FastAPI)      │    │  (Azure/S3)     │
└────────┬────────┘    └────────┬────────┘    └─────────────────┘
         │                      │
         └──────────┬───────────┘
                    ▼
         ┌─────────────────────┐
         │   SQL Server DB     │
         └─────────────────────┘
```

## Base URLs

- **C# API**: `https://api.interviet.com/api/v1`
- **Python AI API**: `https://ai.interviet.com/api/v1`

## Authentication

All APIs use **Bearer Token** authentication (JWT).

```http
Authorization: Bearer <access_token>
```

### Token Structure (JWT)

```json
{
  "sub": "user-guid",
  "email": "user@example.com",
  "role": "user",
  "plan": "YEARLY",
  "status": "premium",
  "exp": 1714723200
}
```

---

## C# Backend APIs

### 1. Authentication & Users

#### `POST /auth/register`
Register new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "fullName": "Nguyễn Văn A",
  "phoneNumber": "0901234567"
}
```

**Response:** `201 Created`
```json
{
  "userId": "guid",
  "email": "user@example.com",
  "fullName": "Nguyễn Văn A",
  "userStatus": "free",
  "message": "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản."
}
```

#### `POST /auth/login`
User login.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 3600,
  "user": {
    "userId": "guid",
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A",
    "userStatus": "premium",
    "subscription": {
      "planCode": "YEARLY",
      "planName": "Gói Năm",
      "status": "active",
      "endDate": "2027-04-23"
    }
  }
}
```

#### `POST /auth/refresh-token`
Refresh access token.

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGc...",
  "expiresIn": 3600
}
```

#### `POST /auth/logout`
Logout user (invalidate refresh token).

**Response:** `204 No Content`

#### `GET /users/me`
Get current user info.

**Response:** `200 OK`
```json
{
  "userId": "guid",
  "email": "user@example.com",
  "fullName": "Nguyễn Văn A",
  "phoneNumber": "0901234567",
  "userStatus": "premium",
  "isEmailVerified": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "lastLoginAt": "2026-04-23T08:15:00Z"
}
```

#### `PUT /users/me`
Update current user info.

**Request:**
```json
{
  "fullName": "Nguyễn Văn A",
  "phoneNumber": "0901234567"
}
```

**Response:** `200 OK`
```json
{
  "userId": "guid",
  "fullName": "Nguyễn Văn A",
  "phoneNumber": "0901234567",
  "updatedAt": "2026-04-23T10:00:00Z"
}
```

---

### 2. Candidate Profiles

#### `GET /profiles/me`
Get current user's profile.

**Response:** `200 OK`
```json
{
  "profileId": "guid",
  "userId": "guid",
  "dateOfBirth": "1995-05-15",
  "gender": "Nam",
  "city": "Hà Nội",
  "district": "Cầu Giấy",
  "currentTitle": "Senior Backend Developer",
  "yearsOfExperience": 5,
  "educationLevel": "Đại học",
  "desiredJobTitle": "Tech Lead",
  "desiredSalaryMin": 30000000,
  "desiredSalaryMax": 40000000,
  "desiredWorkType": "Hybrid",
  "bio": "...",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2026-04-20T15:00:00Z"
}
```

#### `PUT /profiles/me`
Update profile.

**Request:**
```json
{
  "dateOfBirth": "1995-05-15",
  "gender": "Nam",
  "city": "Hà Nội",
  "district": "Cầu Giấy",
  "currentTitle": "Senior Backend Developer",
  "yearsOfExperience": 5,
  "desiredJobTitle": "Tech Lead",
  "desiredSalaryMin": 30000000,
  "desiredSalaryMax": 40000000,
  "bio": "..."
}
```

**Response:** `200 OK` (same structure as GET)

#### `GET /profiles/me/skills`
Get user's skills.

**Response:** `200 OK`
```json
{
  "skills": [
    {
      "skillId": "guid",
      "skillName": "C#",
      "skillCategory": "Technical",
      "proficiencyLevel": "Expert",
      "yearsOfExperience": 5
    }
  ]
}
```

#### `POST /profiles/me/skills`
Add new skill.

**Request:**
```json
{
  "skillName": "Python",
  "skillCategory": "Technical",
  "proficiencyLevel": "Intermediate",
  "yearsOfExperience": 2
}
```

**Response:** `201 Created`

#### `PUT /profiles/me/skills/{skillId}`
Update skill.

#### `DELETE /profiles/me/skills/{skillId}`
Delete skill.

**Response:** `204 No Content`

#### `GET /profiles/me/experiences`
Get work experiences.

**Response:** `200 OK`
```json
{
  "experiences": [
    {
      "experienceId": "guid",
      "companyName": "ABC Tech",
      "jobTitle": "Senior Developer",
      "industry": "Technology",
      "startDate": "2020-01-01",
      "endDate": null,
      "isCurrent": true,
      "description": "..."
    }
  ]
}
```

#### `POST /profiles/me/experiences`
#### `PUT /profiles/me/experiences/{experienceId}`
#### `DELETE /profiles/me/experiences/{experienceId}`

Similar patterns for:
- `/profiles/me/educations`
- `/profiles/me/certifications`

---

### 3. CVs

#### `GET /cvs`
Get user's CVs.

**Response:** `200 OK`
```json
{
  "cvs": [
    {
      "cvId": "guid",
      "cvName": "CV Backend Developer 2024",
      "originalFileName": "NguyenVanA_CV.pdf",
      "fileUrl": "https://storage.interviet.com/cvs/...",
      "fileSize": 524288,
      "fileType": "PDF",
      "isDefaultCV": true,
      "analysisScore": 85.5,
      "lastAnalyzedAt": "2026-04-20T10:00:00Z",
      "createdAt": "2026-04-15T09:00:00Z"
    }
  ]
}
```

#### `POST /cvs/upload`
Upload new CV.

**Request:** `multipart/form-data`
```
cvName: string
file: File (PDF/DOCX)
isDefaultCV: boolean (optional)
```

**Response:** `201 Created`
```json
{
  "cvId": "guid",
  "cvName": "CV Backend Developer 2024",
  "fileUrl": "https://storage.interviet.com/cvs/...",
  "message": "CV đã được tải lên thành công. Đang phân tích..."
}
```

**After upload, C# API calls Python AI API:**
```http
POST https://ai.interviet.com/api/v1/cv/analyze
Authorization: Bearer <service-token>
Content-Type: application/json

{
  "cvId": "guid",
  "userId": "guid",
  "fileUrl": "https://storage.interviet.com/cvs/..."
}
```

#### `GET /cvs/{cvId}`
Get CV details.

**Response:** `200 OK`
```json
{
  "cvId": "guid",
  "cvName": "CV Backend Developer 2024",
  "fileUrl": "https://storage.interviet.com/cvs/...",
  "analysisScore": 85.5,
  "analysisData": {
    "strengths": [
      "Kinh nghiệm 5 năm với C# và .NET Core",
      "Có kinh nghiệm lead team",
      "Kỹ năng SQL và database design tốt"
    ],
    "weaknesses": [
      "Thiếu chứng chỉ chuyên môn",
      "Chưa có kinh nghiệm cloud (AWS/Azure)"
    ],
    "suggestions": [
      "Nên lấy chứng chỉ Microsoft Certified",
      "Bổ sung thêm projects với cloud services"
    ]
  }
}
```

#### `PUT /cvs/{cvId}`
Update CV name or set as default.

**Request:**
```json
{
  "cvName": "CV Updated",
  "isDefaultCV": true
}
```

#### `DELETE /cvs/{cvId}`
Delete CV.

**Response:** `204 No Content`

#### `GET /cvs/templates`
Get available CV templates.

**Response:** `200 OK`
```json
{
  "templates": [
    {
      "templateId": "guid",
      "templateName": "Professional Modern",
      "templateCategory": "Professional",
      "previewImageUrl": "https://...",
      "isPremium": false
    }
  ]
}
```

---

### 4. Job Descriptions

#### `GET /job-descriptions`
Get user's JDs.

**Query params:**
- `status`: active | archived | applied
- `page`: int (default: 1)
- `pageSize`: int (default: 20)

**Response:** `200 OK`
```json
{
  "jobDescriptions": [
    {
      "jdId": "guid",
      "jobTitle": "Senior Backend Developer",
      "companyName": "VNG Corporation",
      "industry": "Technology",
      "jobLevel": "Senior",
      "salaryMin": 30000000,
      "salaryMax": 45000000,
      "city": "Hồ Chí Minh",
      "status": "active",
      "createdAt": "2026-04-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 45,
    "totalPages": 3
  }
}
```

#### `POST /job-descriptions`
Create new JD.

**Request:**
```json
{
  "jobTitle": "Senior Backend Developer",
  "companyName": "VNG Corporation",
  "description": "...",
  "requirements": "...",
  "benefits": "...",
  "industry": "Technology",
  "jobLevel": "Senior",
  "jobType": "Full-time",
  "workMode": "Hybrid",
  "salaryMin": 30000000,
  "salaryMax": 45000000,
  "city": "Hồ Chí Minh",
  "district": "Quận 1"
}
```

**Response:** `201 Created`

#### `GET /job-descriptions/{jdId}`
Get JD details.

#### `PUT /job-descriptions/{jdId}`
Update JD.

#### `DELETE /job-descriptions/{jdId}`
Delete JD.

---

### 5. Subscriptions & Billing

#### `GET /subscription-plans`
Get all subscription plans.

**Response:** `200 OK`
```json
{
  "plans": [
    {
      "planId": "guid",
      "planCode": "FREE",
      "planName": "Gói Miễn phí",
      "price": 0,
      "billingCycle": "lifetime",
      "pricePerMonth": 0,
      "hasTrial": false,
      "trialDays": 0,
      "features": {
        "cvAnalysisLimit": 3,
        "jdMatchingLimit": 5,
        "multiJDLimit": 3,
        "interviewSessionsLimit": 1,
        "interviewMinutesLimit": 30,
        "cvStorageLimit": 1,
        "cvTemplatesAccess": false,
        "prioritySupport": false
      }
    },
    {
      "planId": "guid",
      "planCode": "YEARLY",
      "planName": "Gói Năm",
      "price": 1308000,
      "billingCycle": "yearly",
      "pricePerMonth": 109000,
      "hasTrial": true,
      "trialDays": 7,
      "features": {
        "cvAnalysisLimit": -1,
        "jdMatchingLimit": -1,
        "multiJDLimit": 20,
        "interviewSessionsLimit": -1,
        "interviewMinutesLimit": -1,
        "cvStorageLimit": -1,
        "cvTemplatesAccess": true,
        "prioritySupport": true
      }
    }
  ]
}
```

#### `GET /subscriptions/me`
Get current user's subscription.

**Response:** `200 OK`
```json
{
  "subscriptionId": "guid",
  "plan": {
    "planCode": "YEARLY",
    "planName": "Gói Năm",
    "price": 1308000
  },
  "status": "active",
  "isTrialPeriod": false,
  "startDate": "2026-01-15T00:00:00Z",
  "endDate": "2027-01-15T00:00:00Z",
  "nextBillingDate": "2027-01-15T00:00:00Z",
  "autoRenew": true
}
```

#### `POST /subscriptions/upgrade`
Upgrade subscription plan.

**Request:**
```json
{
  "planCode": "YEARLY"
}
```

**Response:** `200 OK`
```json
{
  "subscriptionId": "guid",
  "message": "Bạn cần thanh toán 1.308.000đ để nâng cấp lên Gói Năm.",
  "paymentRequired": true,
  "amount": 1308000,
  "orderId": "ORDER_20260423_001"
}
```

**If YEARLY plan and eligible for trial:**
```json
{
  "subscriptionId": "guid",
  "message": "Gói Năm đã được kích hoạt với 7 ngày dùng thử miễn phí!",
  "paymentRequired": false,
  "isTrialPeriod": true,
  "trialEndDate": "2026-04-30T00:00:00Z"
}
```

#### `POST /subscriptions/cancel`
Cancel subscription.

**Request:**
```json
{
  "cancellationReason": "Quá đắt"
}
```

**Response:** `200 OK`
```json
{
  "message": "Gói đăng ký sẽ hết hạn vào 15/01/2027. Bạn vẫn có thể sử dụng đến ngày đó.",
  "endDate": "2027-01-15T00:00:00Z"
}
```

#### `GET /subscriptions/usage`
Get current period usage.

**Response:** `200 OK`
```json
{
  "period": {
    "startDate": "2026-04-01T00:00:00Z",
    "endDate": "2026-05-01T00:00:00Z"
  },
  "limits": {
    "cvAnalysisLimit": -1,
    "jdMatchingLimit": -1,
    "interviewSessionsLimit": -1,
    "interviewMinutesLimit": -1
  },
  "used": {
    "cvAnalysisUsed": 35,
    "jdMatchingUsed": 87,
    "interviewSessionsUsed": 15,
    "interviewMinutesUsed": 523
  },
  "remaining": {
    "cvAnalysis": -1,
    "jdMatching": -1,
    "interviewSessions": -1,
    "interviewMinutes": -1
  }
}
```

---

### 6. Payments

#### `POST /payments/create-order`
Create payment order.

**Request:**
```json
{
  "planCode": "MONTHLY",
  "paymentMethod": "vnpay",
  "returnUrl": "https://interviet.com/payment/result"
}
```

**Response:** `200 OK`
```json
{
  "orderId": "ORDER_20260423_001",
  "paymentId": "guid",
  "amount": 149000,
  "currency": "VND",
  "paymentMethod": "vnpay",
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
  "expiresAt": "2026-04-23T11:00:00Z"
}
```

#### `POST /payments/vnpay/callback`
VNPay payment callback (webhook).

**Request:** (from VNPay)
```json
{
  "vnp_TxnRef": "ORDER_20260423_001",
  "vnp_Amount": "14900000",
  "vnp_ResponseCode": "00",
  "vnp_TransactionNo": "14012345",
  "vnp_SecureHash": "..."
}
```

**C# Backend:**
1. Verify signature
2. Update `Payments` table status → `completed`
3. Activate subscription
4. Create invoice
5. Send notification to user

#### `POST /payments/momo/callback`
MoMo payment callback.

#### `GET /payments/history`
Get payment history.

**Response:** `200 OK`
```json
{
  "payments": [
    {
      "paymentId": "guid",
      "orderId": "ORDER_20260423_001",
      "amount": 149000,
      "paymentMethod": "vnpay",
      "status": "completed",
      "createdAt": "2026-04-23T09:00:00Z",
      "completedAt": "2026-04-23T09:05:00Z"
    }
  ]
}
```

#### `GET /invoices/{invoiceId}`
Get invoice.

**Response:** `200 OK`
```json
{
  "invoiceId": "guid",
  "invoiceNumber": "INV-2026-04-001",
  "totalAmount": 149000,
  "billingName": "Nguyễn Văn A",
  "billingEmail": "user@example.com",
  "issuedAt": "2026-04-23T09:05:00Z",
  "invoicePdfUrl": "https://storage.interviet.com/invoices/..."
}
```

---

### 7. Support

#### `GET /support/tickets`
Get user's support tickets.

**Response:** `200 OK`
```json
{
  "tickets": [
    {
      "ticketId": "guid",
      "ticketNumber": "TKT-2026-001",
      "subject": "Không thể tải CV lên",
      "category": "technical",
      "priority": "normal",
      "status": "open",
      "createdAt": "2026-04-23T08:00:00Z"
    }
  ]
}
```

#### `POST /support/tickets`
Create support ticket.

**Request:**
```json
{
  "subject": "Không thể tải CV lên",
  "category": "technical",
  "message": "Tôi đã thử tải CV nhưng bị lỗi..."
}
```

**Response:** `201 Created`

#### `GET /support/tickets/{ticketId}`
Get ticket details with messages.

#### `POST /support/tickets/{ticketId}/messages`
Reply to ticket.

---

## Python AI APIs

### 1. CV Analysis

#### `POST /ai/cv/analyze`
Analyze CV and extract insights.

**Request:**
```json
{
  "cvId": "guid",
  "userId": "guid",
  "fileUrl": "https://storage.interviet.com/cvs/user1/cv1.pdf"
}
```

**Response:** `200 OK`
```json
{
  "cvId": "guid",
  "analysisScore": 85.5,
  "analysisData": {
    "strengths": [
      "Kinh nghiệm 5 năm với C# và .NET Core",
      "Có kinh nghiệm lead team",
      "Kỹ năng SQL và database design tốt"
    ],
    "weaknesses": [
      "Thiếu chứng chỉ chuyên môn",
      "Chưa có kinh nghiệm cloud (AWS/Azure)"
    ],
    "suggestions": [
      "Nên lấy chứng chỉ Microsoft Certified",
      "Bổ sung thêm projects với cloud services",
      "Thêm metrics cụ thể về impact của các projects"
    ],
    "extractedData": {
      "skills": ["C#", "ASP.NET Core", "SQL Server", "Git"],
      "experiences": [...],
      "educations": [...],
      "summary": "..."
    }
  },
  "processingTimeMs": 2500
}
```

**Python AI then calls C# API to update database:**
```http
PATCH https://api.interviet.com/internal/cvs/{cvId}/analysis
Authorization: Bearer <service-token>

{
  "analysisScore": 85.5,
  "analysisData": {...}
}
```

---

### 2. CV-JD Matching

#### `POST /ai/matching/single`
Match 1 CV vs 1 JD.

**Request:**
```json
{
  "cvId": "guid",
  "jdId": "guid",
  "userId": "guid"
}
```

**Response:** `200 OK`
```json
{
  "matchingId": "guid",
  "cvId": "guid",
  "jdId": "guid",
  "matchScore": 82.5,
  "matchLevel": "Excellent",
  "matchedSkills": [
    {
      "skill": "C#",
      "matchStrength": "strong",
      "cvExperience": 5,
      "jdRequirement": "3+ years"
    },
    {
      "skill": "ASP.NET Core",
      "matchStrength": "strong",
      "cvExperience": 5,
      "jdRequirement": "required"
    }
  ],
  "missingSkills": [
    {
      "skill": "Azure",
      "importance": "high",
      "jdRequirement": "preferred"
    },
    {
      "skill": "Docker",
      "importance": "medium",
      "jdRequirement": "nice-to-have"
    }
  ],
  "matchedExperiences": [
    {
      "type": "years",
      "cvValue": 5,
      "jdRequirement": "3+",
      "match": "exceeds"
    },
    {
      "type": "industry",
      "cvValue": "Technology",
      "jdRequirement": "Technology",
      "match": "exact"
    }
  ],
  "recommendations": [
    "Bổ sung kinh nghiệm Azure/cloud vào CV",
    "Highlight các projects liên quan đến microservices",
    "Thêm metrics về performance improvements"
  ],
  "strengthAreas": [
    "Technical skills rất phù hợp với yêu cầu",
    "Kinh nghiệm vượt yêu cầu tối thiểu",
    "Background về .NET ecosystem match hoàn hảo"
  ],
  "weaknessAreas": [
    "Thiếu kinh nghiệm cloud (Azure preferred)",
    "Chưa đề cập đến containerization (Docker/K8s)"
  ],
  "processingTimeMs": 1800
}
```

**Python AI then calls C# API:**
```http
POST https://api.interviet.com/internal/matchings
Authorization: Bearer <service-token>

{
  "matchingId": "guid",
  "userId": "guid",
  "cvId": "guid",
  "jdId": "guid",
  "matchScore": 82.5,
  "matchLevel": "Excellent",
  "matchedSkills": [...],
  "missingSkills": [...],
  "recommendations": [...]
}
```

---

#### `POST /ai/matching/multi`
Match 1 CV vs multiple JDs.

**Request:**
```json
{
  "cvId": "guid",
  "jdIds": ["guid1", "guid2", "guid3", ...],
  "userId": "guid",
  "matchingName": "So sánh Top 10 JDs Backend Developer"
}
```

**Response:** `200 OK`
```json
{
  "multiMatchingId": "guid",
  "cvId": "guid",
  "totalJDs": 10,
  "results": [
    {
      "jdId": "guid1",
      "jobTitle": "Senior Backend Developer - VNG",
      "matchScore": 92.5,
      "matchLevel": "Excellent",
      "topMatchedSkills": ["C#", "ASP.NET Core", "SQL Server"],
      "topMissingSkills": ["Azure", "Docker"]
    },
    {
      "jdId": "guid2",
      "jobTitle": "Backend Engineer - FPT",
      "matchScore": 85.3,
      "matchLevel": "Excellent",
      "topMatchedSkills": ["C#", ".NET Core", "PostgreSQL"],
      "topMissingSkills": ["Go", "Kubernetes"]
    }
  ],
  "bestMatch": {
    "jdId": "guid1",
    "jobTitle": "Senior Backend Developer - VNG",
    "matchScore": 92.5
  },
  "averageScore": 82.7,
  "summary": {
    "excellentMatches": 5,
    "goodMatches": 3,
    "fairMatches": 2,
    "poorMatches": 0
  },
  "commonMissingSkills": [
    {
      "skill": "Cloud (Azure/AWS)",
      "frequency": 8
    },
    {
      "skill": "Containerization (Docker/K8s)",
      "frequency": 6
    }
  ],
  "processingTimeMs": 5200
}
```

**Python AI then saves to database via C# API.**

---

### 3. AI Interview

#### `POST /ai/interview/start`
Start new interview session.

**Request:**
```json
{
  "userId": "guid",
  "jdId": "guid",
  "sessionType": "technical",
  "interviewLevel": "senior",
  "industry": "Technology",
  "jobTitle": "Senior Backend Developer"
}
```

**Response:** `200 OK`
```json
{
  "sessionId": "guid",
  "sessionType": "technical",
  "firstQuestion": {
    "questionId": "guid",
    "questionNumber": 1,
    "questionType": "technical",
    "questionText": "Bạn có thể giải thích sự khác biệt giữa IEnumerable và IQueryable trong C# không? Khi nào nên dùng cái nào?",
    "difficulty": "medium",
    "expectedAnswerPoints": [
      "IEnumerable executes in-memory",
      "IQueryable allows server-side filtering",
      "Performance implications"
    ]
  },
  "estimatedDuration": 30
}
```

---

#### `POST /ai/interview/answer`
Submit answer to question.

**Request:**
```json
{
  "questionId": "guid",
  "answerText": "IEnumerable và IQueryable đều là interfaces cho collections, nhưng...",
  "audioUrl": "https://storage.interviet.com/interviews/session1/answer1.mp3",
  "audioDurationSeconds": 120
}
```

**Response:** `200 OK`
```json
{
  "answerId": "guid",
  "evaluation": {
    "answerScore": 85.0,
    "clarityScore": 88.0,
    "relevanceScore": 82.0,
    "completenessScore": 85.0,
    "feedback": "Câu trả lời rất tốt! Bạn đã giải thích rõ ràng sự khác biệt và use cases...",
    "positivePoints": [
      "Giải thích chính xác về in-memory vs server-side execution",
      "Đưa ra examples cụ thể",
      "Đề cập đến performance implications"
    ],
    "negativePoints": [
      "Chưa đề cập đến deferred execution",
      "Có thể bổ sung thêm về LINQ providers"
    ],
    "suggestions": [
      "Nên thêm ví dụ về deferred execution",
      "Giải thích thêm về khi nào IQueryable compile thành SQL"
    ]
  },
  "nextQuestion": {
    "questionId": "guid",
    "questionNumber": 2,
    "questionText": "Trong một hệ thống microservices, làm thế nào bạn handle distributed transactions?",
    "difficulty": "hard"
  },
  "progressPercentage": 20
}
```

---

#### `POST /ai/interview/complete`
Complete interview session.

**Request:**
```json
{
  "sessionId": "guid"
}
```

**Response:** `200 OK`
```json
{
  "sessionId": "guid",
  "overallScore": 86.5,
  "overallFeedback": "Buổi phỏng vấn rất tốt! Bạn thể hiện kiến thức vững vàng về .NET và backend development...",
  "detailedScores": {
    "communicationScore": 88.0,
    "technicalScore": 85.0,
    "problemSolvingScore": 87.0,
    "confidenceScore": 85.0
  },
  "strengthAreas": [
    "Kiến thức vững về .NET ecosystem",
    "Trình bày rõ ràng, có structure",
    "Đưa ra examples thực tế tốt"
  ],
  "improvementAreas": [
    "Có thể đào sâu hơn về distributed systems",
    "Nên chuẩn bị thêm về cloud architecture",
    "Practice thêm về system design"
  ],
  "actionableAdvice": [
    "Đọc thêm về microservices patterns (Saga, CQRS)",
    "Làm thêm projects với Azure/AWS",
    "Luyện tập system design interviews"
  ],
  "totalQuestions": 10,
  "durationSeconds": 1800,
  "completedAt": "2026-04-23T10:30:00Z"
}
```

---

### 4. Voice Processing

#### `POST /ai/voice/transcribe`
Transcribe audio to text.

**Request:**
```json
{
  "audioUrl": "https://storage.interviet.com/interviews/session1/answer1.mp3"
}
```

**Response:** `200 OK`
```json
{
  "transcribedText": "IEnumerable và IQueryable đều là interfaces cho collections...",
  "confidence": 0.95,
  "language": "vi-VN",
  "durationSeconds": 120
}
```

---

#### `POST /ai/voice/analyze`
Analyze voice quality and confidence.

**Request:**
```json
{
  "audioUrl": "https://storage.interviet.com/interviews/session1/answer1.mp3",
  "transcribedText": "..."
}
```

**Response:** `200 OK`
```json
{
  "confidenceScore": 85.0,
  "clarityScore": 88.0,
  "paceAnalysis": {
    "wordsPerMinute": 140,
    "assessment": "good",
    "feedback": "Tốc độ nói vừa phải, dễ nghe"
  },
  "fillerWords": {
    "count": 3,
    "percentage": 2.1,
    "examples": ["ừm", "à", "thì"]
  },
  "suggestions": [
    "Giảm filler words để nghe professional hơn",
    "Có thể nói chậm hơn một chút khi giải thích khái niệm phức tạp"
  ]
}
```

---

## Error Responses

All APIs use standard HTTP status codes and error format:

### 400 Bad Request
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Email không hợp lệ",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  }
}
```

### 401 Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token không hợp lệ hoặc đã hết hạn"
  }
}
```

### 403 Forbidden
```json
{
  "error": {
    "code": "FEATURE_LIMIT_REACHED",
    "message": "Bạn đã hết lượt phân tích CV trong tháng này. Vui lòng nâng cấp gói.",
    "details": {
      "feature": "cv-analysis",
      "limit": 3,
      "used": 3,
      "resetDate": "2026-05-01T00:00:00Z"
    }
  }
}
```

### 404 Not Found
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "CV không tồn tại"
  }
}
```

### 500 Internal Server Error
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Đã xảy ra lỗi. Vui lòng thử lại sau.",
    "requestId": "req_abc123"
  }
}
```

---

## Service-to-Service Authentication

Python AI ↔ C# Backend communication uses **Service Tokens**.

```http
Authorization: Bearer <service-token>
X-Service-Name: python-ai
```

Service tokens are long-lived JWT tokens with `role: "service"`.

---

## Rate Limiting

- **Free tier**: 100 requests/hour
- **Paid tier**: 1000 requests/hour
- **AI APIs**: Lower limits based on compute cost

**Response header:**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 850
X-RateLimit-Reset: 1714723200
```

**429 Too Many Requests:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Bạn đã vượt quá giới hạn requests. Vui lòng thử lại sau.",
    "retryAfter": 3600
  }
}
```

---

## Webhooks (Future)

For async operations, Python AI can call webhooks:

```http
POST {callbackUrl}
Authorization: Bearer <webhook-secret>

{
  "event": "cv.analysis.completed",
  "cvId": "guid",
  "status": "success",
  "data": {...}
}
```

---

## Notes for Implementation

### C# Team:
1. Use **ASP.NET Core Web API** with controllers
2. Use **Entity Framework Core** for database access
3. Use **FluentValidation** for request validation
4. Use **Serilog** for logging
5. Use **JWT Bearer** authentication
6. Use **HttpClient** to call Python AI APIs
7. Handle payment gateway integrations (VNPay, MoMo)
8. Implement file upload to Azure Blob Storage

### Python Team:
1. Use **FastAPI** framework
2. Use **pyodbc** or **SQLAlchemy** for database access
3. Use **pydantic** for request/response models
4. Use **python-jose** for JWT
5. Use **httpx** to call C# APIs
6. Implement ML models for CV analysis, JD matching, interview evaluation
7. Use **OpenAI Whisper** or **Google Speech-to-Text** for voice transcription
8. Use **sentence-transformers** for semantic matching

---

## Testing

### C# API Base URL (dev):
```
http://localhost:5000/api/v1
```

### Python AI API Base URL (dev):
```
http://localhost:8000/api/v1
```

### Test Users (from test_data.sql):
```
nguyen.vana@gmail.com / Password123!  (Free)
tran.thib@gmail.com / Password123!    (Trial - Yearly)
le.vanc@gmail.com / Password123!      (Monthly)
pham.thid@gmail.com / Password123!    (Yearly)
```

---

**Last Updated:** 2026-04-23
