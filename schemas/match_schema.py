from pydantic import BaseModel, Field
from typing import List, Optional, Any

# --- INPUT SCHEMAS ---
class ResumeParsedDataInput(BaseModel):
    rawText: str
    sectionsJson: Optional[str] = "{}"
    skillsJson: Optional[str] = "[]"
    experiencesJson: Optional[str] = "[]"
    educationsJson: Optional[str] = "[]"
    projectsJson: Optional[str] = "[]"
    certificationsJson: Optional[str] = "[]"
    languagesJson: Optional[str] = "[]"

class JobDescriptionInput(BaseModel):
    rawText: str

class MatchRequest(BaseModel):
    userId: str
    resumeId: str
    resumeVersionId: Optional[str] = None
    jobDescriptionId: str
    matchJobId: str # Lưu ý C# gửi key là matchJobId
    resumeParsedData: ResumeParsedDataInput
    jobDescription: JobDescriptionInput
    correlationId: str
    requestId: str
    schemaVersion: str

# --- OUTPUT SCHEMAS ---
class MatchDataResponse(BaseModel):
    matchJobId: str
    resumeId: str
    resumeVersionId: Optional[str] = None
    jobDescriptionId: str
    overallScore: int
    skillScore: int
    experienceScore: int
    educationScore: int
    languageScore: int
    matchedSkills: List[str]
    missingSkills: List[str]
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]
    summary: str
    modelVersion: str = "cv-jd-matcher-v1-gemini-pro"
    schemaVersion: str = "cv-jd-match-v1"

class MatchErrorDetail(BaseModel):
    code: str
    message: str
    correlationId: str
    requestId: str
    schemaVersion: str

class MatchResponseEnvelope(BaseModel):
    success: bool
    data: Optional[MatchDataResponse] = None
    error: Optional[MatchErrorDetail] = None