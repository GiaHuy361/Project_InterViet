from pydantic import BaseModel
from typing import List

class ScoreBreakdown(BaseModel):
    dimension: str
    score: float
    maxScore: float = 10.0

class FeedbackItem(BaseModel):
    category: str # "strength" hoặc "improvement"
    title: str
    detail: str

class AnalyzeDataResponse(BaseModel):
    overallScore: float
    confidenceScore: float
    clarityScore: float
    relevanceScore: float
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]
    scoreBreakdowns: List[ScoreBreakdown]
    feedbackItems: List[FeedbackItem]
    modelVersion: str
    schemaVersion: str = "interview-analysis-v1"

class AnalyzeRequest(BaseModel):
    sessionId: str
    userId: str
    correlationId: str
    requestId: str
    position: str
    level: str
    goal: str
    interviewType: str
    aiModel: str
    transcriptJson: str # Stringified JSON từ C#