from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ParseMetadata(BaseModel):
    textLength: int
    warningCount: int
    detectedSections: List[str]
    missingSections: List[str]
    confidenceScore: float  # Từ 0.0 đến 1.0
    parseQuality: str      # "High", "Medium", "Low"

class ParseDataResponse(BaseModel):
    resumeId: str
    resumeVersionId: Optional[str] = None
    rawText: str
    detectedLanguage: str
    sections: Dict[str, Any]
    skills: str
    experiences: str
    educations: str
    projects: str
    certifications: str
    languages: str
    warnings: List[str]
    modelVersion: str = "cv-parser-v1-gemini-flash"
    schemaVersion: str = "resume-parse-v1"
    metadata: Optional[ParseMetadata] = None

class ParseErrorDetail(BaseModel):
    code: str
    message: str
    correlationId: str
    requestId: str
    schemaVersion: str

class ParseResponseEnvelope(BaseModel):
    success: bool
    data: Optional[ParseDataResponse] = None
    error: Optional[ParseErrorDetail] = None