from datetime import date
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field


class NewEmployee(BaseModel):
    full_name: str
    email: EmailStr
    temp_password: str
    job_role: str
    department: Optional[str] = None
    start_date: Optional[date] = None
class FeedbackIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None
    is_anonymous: bool = False

class ChatIn(BaseModel):
    question: str
class EscalationReply(BaseModel):
    hr_response: str
class TaskCreate(BaseModel):
    employee_id: str
    title: str
    description: Optional[str] = None
    stage: str = "onboarding"
    due_date: Optional[date] = None
class DocReview(BaseModel):
    status: Literal["approved", "rejected"]
    hr_comment: Optional[str] = None