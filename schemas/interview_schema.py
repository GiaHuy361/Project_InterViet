from pydantic import BaseModel
from typing import List, Optional, Any

class GenerateQuestionRequest(BaseModel):
    sessionId: str
    userId: str
    correlationId: str
    requestId: str
    position: str
    level: str
    goal: Optional[str] = None
    interviewType: str
    interviewerMode: str
    aiModel: str
    questionNumber: int
    totalExpectedQuestions: int
    # C# gửi stringify JSON, nên để kiểu Optional[str]
    conversationHistoryJson: Optional[str] = None

class GenerateQuestionData(BaseModel):
    questionText: str
    questionType: str
    difficulty: str
    expectedAnswerPoints: List[str] # Trả về list chuẩn, C# tự lo đoạn GetRawText
    modelVersion: str
    schemaVersion: str = "interview-question-v1"

class ErrorDetail(BaseModel):
    code: str
    message: str

class InterviewResponseEnvelope(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[ErrorDetail] = None