from pydantic import BaseModel
from typing import List, Optional, Dict, Any

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